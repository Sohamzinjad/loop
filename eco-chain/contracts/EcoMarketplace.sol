// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EcoMarketplace
 * @notice Marketplace for trading ERC-1155 Carbon Credits
 * @dev Supports partial fills, fee collection, and listing management
 */
contract EcoMarketplace is ERC1155Holder, Ownable, ReentrancyGuard {
    // ─── Structs ───
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerUnit; // in wei (MATIC)
        bool active;
    }

    // ─── State ───
    IERC1155 public ecoCredits;
    uint256 public nextListingId;
    uint256 public platformFeeBps = 250; // 2.5%
    uint256 public totalVolume;

    mapping(uint256 => Listing) public listings;

    // ─── Events ───
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 pricePerUnit
    );

    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );

    event ListingCancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFeeBps);

    constructor(address _ecoCredits) Ownable(msg.sender) {
        ecoCredits = IERC1155(_ecoCredits);
    }

    // ─── List Credits for Sale ───
    function list(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external returns (uint256) {
        require(amount > 0, "Marketplace: amount must be > 0");
        require(pricePerUnit > 0, "Marketplace: price must be > 0");
        require(
            ecoCredits.balanceOf(msg.sender, tokenId) >= amount,
            "Marketplace: insufficient balance"
        );
        require(
            ecoCredits.isApprovedForAll(msg.sender, address(this)),
            "Marketplace: not approved"
        );

        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });

        // Transfer tokens to marketplace escrow
        ecoCredits.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        emit Listed(listingId, msg.sender, tokenId, amount, pricePerUnit);
        return listingId;
    }

    // ─── Buy Credits (Supports Partial Fills) ───
    function buy(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(amount > 0 && amount <= listing.amount, "Marketplace: invalid amount");

        uint256 totalPrice = amount * listing.pricePerUnit;
        require(msg.value >= totalPrice, "Marketplace: insufficient payment");

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Calculate fees
        uint256 fee = (totalPrice * platformFeeBps) / 10000;
        uint256 sellerAmount = totalPrice - fee;

        // Transfer tokens to buyer
        ecoCredits.safeTransferFrom(address(this), msg.sender, listing.tokenId, amount, "");

        // Transfer payment to seller
        (bool success, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(success, "Marketplace: payment failed");

        totalVolume += totalPrice;

        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refunded, "Marketplace: refund failed");
        }

        emit Purchased(listingId, msg.sender, amount, totalPrice);
    }

    // ─── Cancel Listing ───
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Marketplace: not seller");
        require(listing.active, "Marketplace: not active");

        listing.active = false;

        // Return tokens to seller
        ecoCredits.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");

        emit ListingCancelled(listingId);
    }

    // ─── Admin ───
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Marketplace: fee too high"); // max 10%
        platformFeeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Marketplace: no fees to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Marketplace: withdrawal failed");
    }

    // ─── View Functions ───
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
}
