// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EcoCredits
 * @notice ERC-1155 contract for tokenized carbon credits.
 * @dev Each token ID represents a unique carbon offset project batch.
 *      Supports minting (after verification), retirement (burning),
 *      and pausability for emergency stops.
 */
contract EcoCredits is ERC1155, AccessControl, ERC1155Burnable, ERC1155Supply, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Start at 1 to avoid issues with token ID 0 in some tooling
    uint256 private _nextTokenId = 1;

    struct ProjectBatch {
        string projectName;
        string metadataURI;
        bool verified;
        uint256 totalRetired;
    }

    mapping(uint256 => ProjectBatch) public projectBatches;
    mapping(uint256 => string) private _tokenURIs;

    // ─── Events ───
    event CarbonRetired(
        address indexed retiree,
        uint256 indexed tokenId,
        uint256 amount,
        string retireeName,
        string reason,
        uint256 timestamp
    );

    event CreditMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 amount,
        string projectName
    );

    event ProjectBatchCreated(
        uint256 indexed tokenId,
        string projectName,
        address creator
    );

    event ProjectVerified(uint256 indexed tokenId, address verifier);

    constructor(string memory baseURI) ERC1155(baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ─── Core Functions ───

    /**
     * @notice Create a new project batch (token ID) for a carbon project.
     * @param projectName Name of the carbon project
     * @param metadataURI URI pointing to project metadata (IPFS/HTTP)
     * @return tokenId The newly created token ID
     */
    function createProjectBatch(
        string memory projectName,
        string memory metadataURI
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        projectBatches[tokenId] = ProjectBatch({
            projectName: projectName,
            metadataURI: metadataURI,
            verified: false,
            totalRetired: 0
        });
        _tokenURIs[tokenId] = metadataURI;

        emit ProjectBatchCreated(tokenId, projectName, msg.sender);
        return tokenId;
    }

    /**
     * @notice Mint credits for a verified project.
     * @dev Requires the project batch to be verified by a VERIFIER_ROLE holder.
     */
    function batchMint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(projectBatches[id].verified, "EcoCredits: token not verified");
        require(amount > 0, "EcoCredits: amount must be > 0");

        _mint(to, id, amount, data);

        emit CreditMinted(id, to, amount, projectBatches[id].projectName);
    }

    /**
     * @notice Verify a project batch, enabling minting.
     * @param id Token ID of the project batch to verify
     */
    function verifyToken(uint256 id) external onlyRole(VERIFIER_ROLE) {
        require(bytes(projectBatches[id].projectName).length > 0, "EcoCredits: batch does not exist");
        require(!projectBatches[id].verified, "EcoCredits: already verified");

        projectBatches[id].verified = true;
        emit ProjectVerified(id, msg.sender);
    }

    /**
     * @notice Retire (burn) carbon credits permanently.
     * @dev Burns the tokens and records the retirement on-chain.
     * @param id Token ID of the credits to retire
     * @param amount Number of credits to retire
     * @param retireeName Name of the entity retiring the credits
     * @param reason Reason for retirement
     */
    function retire(
        uint256 id,
        uint256 amount,
        string memory retireeName,
        string memory reason
    ) external whenNotPaused {
        require(balanceOf(msg.sender, id) >= amount, "EcoCredits: insufficient balance");
        require(amount > 0, "EcoCredits: amount must be > 0");

        _burn(msg.sender, id, amount);

        // Unchecked is safe: totalRetired can't overflow in practice
        unchecked {
            projectBatches[id].totalRetired += amount;
        }

        emit CarbonRetired(
            msg.sender,
            id,
            amount,
            retireeName,
            reason,
            block.timestamp
        );
    }

    // ─── Admin Functions ───

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ─── View Functions ───

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        return super.uri(tokenId);
    }

    function getProjectBatch(uint256 tokenId) external view returns (ProjectBatch memory) {
        return projectBatches[tokenId];
    }

    function getTotalRetired(uint256 tokenId) external view returns (uint256) {
        return projectBatches[tokenId].totalRetired;
    }

    // ─── Override Resolution ───

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
