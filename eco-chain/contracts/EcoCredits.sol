// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title EcoCredits
 * @notice ERC-1155 Semi-Fungible Carbon Credit Token
 * @dev Token ID = Project Batch, Balance = Tons of CO2 offset
 */
contract EcoCredits is ERC1155, AccessControl, ERC1155Burnable, ERC1155Supply {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // ─── Events ───
    event CarbonRetired(
        address indexed retiree,
        uint256 indexed tokenId,
        uint256 amount,
        string retireeName,
        string reason
    );

    event ProjectBatchCreated(
        uint256 indexed tokenId,
        string projectName,
        string metadataURI
    );

    event CreditsVerifiedAndMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 amount
    );

    // ─── State ───
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bool) public tokenVerified;

    // ─── Retirement Tracking ───
    mapping(address => uint256) public totalRetiredByAddress;
    uint256 public totalRetiredGlobal;

    constructor(string memory baseURI) ERC1155(baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ─── Create a New Project Batch ───
    function createProjectBatch(
        string memory projectName,
        string memory metadataURI
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _tokenURIs[tokenId] = metadataURI;
        emit ProjectBatchCreated(tokenId, projectName, metadataURI);
        return tokenId;
    }

    // ─── Batch Mint (after verification) ───
    function batchMint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(tokenVerified[id], "EcoCredits: token not verified");
        _mint(to, id, amount, data);
        emit CreditsVerifiedAndMinted(id, to, amount);
    }

    // ─── Verify Token for Minting ───
    function verifyToken(uint256 id) external onlyRole(VERIFIER_ROLE) {
        tokenVerified[id] = true;
    }

    // ─── Retire Credits (Burn with metadata) ───
    function retire(
        uint256 id,
        uint256 amount,
        string memory retireeName,
        string memory reason
    ) external {
        require(balanceOf(msg.sender, id) >= amount, "EcoCredits: insufficient balance");
        _burn(msg.sender, id, amount);

        totalRetiredByAddress[msg.sender] += amount;
        totalRetiredGlobal += amount;

        emit CarbonRetired(msg.sender, id, amount, retireeName, reason);
    }

    // ─── URI Override ───
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        return super.uri(tokenId);
    }

    function setURI(string memory newuri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
    }

    function setTokenURI(uint256 tokenId, string memory tokenURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _tokenURIs[tokenId] = tokenURI;
    }

    // ─── Required Overrides ───
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
