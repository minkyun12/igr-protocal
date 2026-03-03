// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IgrRegistry {
    struct Resolution {
        string eventId;
        string decision;
        string finalState;
        string reasonCodes;
        bytes32 decisionHash;
        uint256 timestamp;
    }

    mapping(bytes32 => Resolution) public resolutions;

    address public owner;
    address public authorizedForwarder;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ForwarderUpdated(address indexed previousForwarder, address indexed newForwarder);
    event ResolutionRecorded(bytes32 indexed key, string eventId, string finalState, bytes32 decisionHash);

    constructor(address _authorizedForwarder) {
        owner = msg.sender;
        authorizedForwarder = _authorizedForwarder;
        emit OwnershipTransferred(address(0), msg.sender);
        emit ForwarderUpdated(address(0), _authorizedForwarder);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == authorizedForwarder, "not authorized");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setAuthorizedForwarder(address newForwarder) external onlyOwner {
        require(newForwarder != address(0), "zero forwarder");
        emit ForwarderUpdated(authorizedForwarder, newForwarder);
        authorizedForwarder = newForwarder;
    }

    /// @notice Keystone-style entry point. Metadata reserved for future use.
    /// @dev report is abi.encode(eventId, decision, finalState, reasonCodes, decisionHash)
    function onReport(bytes calldata /* metadata */, bytes calldata report) external onlyAuthorized {
        (string memory eventId, string memory decision, string memory finalState, string memory reasonCodes, bytes32 decisionHash) = abi.decode(
            report,
            (string, string, string, string, bytes32)
        );
        _storeResolution(eventId, decision, finalState, reasonCodes, decisionHash);
    }

    /// @notice Optional debug path for local testing (still restricted to authorized forwarder).
    function record(
        string calldata eventId,
        string calldata decision,
        string calldata finalState,
        string calldata reasonCodes,
        bytes32 decisionHash
    ) external onlyAuthorized {
        _storeResolution(eventId, decision, finalState, reasonCodes, decisionHash);
    }

    function _storeResolution(
        string memory eventId,
        string memory decision,
        string memory finalState,
        string memory reasonCodes,
        bytes32 decisionHash
    ) internal {
        bytes32 key = keccak256(abi.encodePacked(eventId, block.timestamp, decisionHash));
        resolutions[key] = Resolution(eventId, decision, finalState, reasonCodes, decisionHash, block.timestamp);
        emit ResolutionRecorded(key, eventId, finalState, decisionHash);
    }

    function getResolution(bytes32 key) external view returns (Resolution memory) {
        return resolutions[key];
    }
}
