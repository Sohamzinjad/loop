// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EcoMarketplace
 * @notice Marketplace for trading ERC-1155 carbon credits.
 * @dev Supports listing, buying (with partial fills), cancellation,
 *      listing expiry, fee tracking, and per-user listing limits.
 */
contract EcoMarketplace is ERC1155Holder, Ownable, ReentrancyGuard, Pausable {
    IERC1155 public ecoCredits;

    uint256 public platformFeeBps = 250; // 2.5%
    uint256 public constant MAX_FEE_BPS = 1000; // 10% cap
    uint256 public constant MAX_LISTINGS_PER_USER = 50;
    uint256 public constant DEFAULT_EXPIRY = 30 days;

    uint256 private _nextListingId = 1;
    uint256 public accumulatedFees;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerUnit;
        bool active;
        uint256 expiresAt;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public userListingCount;

    // ─── Events ───
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit,
        uint256 expiresAt
    );

    event Sold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice,
        uint256 fee
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(address _ecoCredits) Ownable(msg.sender) {
        require(_ecoCredits != address(0), "Invalid EcoCredits address");
        ecoCredits = IERC1155(_ecoCredits);
    }

    // ─── Core Functions ───

    /**
     * @notice List carbon credits for sale.
     * @param tokenId The ERC-1155 token ID to list
     * @param amount Number of credits to list
     * @param pricePerUnit Price per credit in wei (MATIC)
     * @return listingId The ID of the created listing
     */
    function list(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external whenNotPaused returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(pricePerUnit > 0, "Price must be > 0");
        require(
            userListingCount[msg.sender] < MAX_LISTINGS_PER_USER,
            "Max listings reached"
        );

        // Transfer tokens to marketplace escrow
        ecoCredits.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        uint256 listingId = _nextListingId++;
        uint256 expiresAt = block.timestamp + DEFAULT_EXPIRY;

        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true,
            expiresAt: expiresAt
        });

        unchecked {
            userListingCount[msg.sender]++;
        }

        emit Listed(listingId, msg.sender, tokenId, amount, pricePerUnit, expiresAt);
        return listingId;
    }

    /**
     * @notice Buy credits from a listing (supports partial fills).
     * @param listingId The listing to buy from
     * @param amount Number of credits to purchase
     */
    function buy(
        uint256 listingId,
        uint256 amount
    ) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(block.timestamp < listing.expiresAt, "Listing expired");
        require(amount > 0 && amount <= listing.amount, "Invalid amount");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        uint256 totalPrice = listing.pricePerUnit * amount;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Calculate platform fee
        uint256 fee = (totalPrice * platformFeeBps) / 10_000;
        uint256 sellerProceeds = totalPrice - fee;

        // Track fees separately from escrow
        accumulatedFees += fee;

        // Update listing (partial fill support)
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
            unchecked {
                if (userListingCount[listing.seller] > 0) {
                    userListingCount[listing.seller]--;
                }
            }
        }

        // Transfer tokens to buyer
        ecoCredits.safeTransferFrom(address(this), msg.sender, listing.tokenId, amount, "");

        // Pay seller
        (bool sent, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(sent, "Payment to seller failed");

        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refunded, "Refund failed");
        }

        emit Sold(listingId, msg.sender, amount, totalPrice, fee);
    }

    /**
     * @notice Cancel a listing and return tokens to seller.
     * @param listingId The listing to cancel
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");

        listing.active = false;

        unchecked {
            if (userListingCount[msg.sender] > 0) {
                userListingCount[msg.sender]--;
            }
        }

        // Return tokens from escrow
        ecoCredits.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");

        emit ListingCancelled(listingId, msg.sender);
    }

    // ─── Admin Functions ───

    /**
     * @notice Update the platform fee (basis points).
     * @param _feeBps New fee in basis points (max 10%)
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds maximum");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = _feeBps;
        emit FeeUpdated(oldFee, _feeBps);
    }

    /**
     * @notice Withdraw accumulated platform fees.
     * @dev Only withdraws tracked fees, not escrowed tokens' value.
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");

        accumulatedFees = 0;

        (bool sent, ) = payable(owner()).call{value: amount}("");
        require(sent, "Withdrawal failed");

        emit FeesWithdrawn(owner(), amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ─── View Functions ───

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function isListingActive(uint256 listingId) external view returns (bool) {
        Listing memory listing = listings[listingId];
        return listing.active && block.timestamp < listing.expiresAt;
    }

    function getActiveListingsCount() external view returns (uint256 count) {
        // Note: This is O(n) — for production, use an off-chain indexer
        for (uint256 i = 1; i < _nextListingId; i++) {
            if (listings[i].active && block.timestamp < listings[i].expiresAt) {
                unchecked { count++; }
            }
        }
    }
}
