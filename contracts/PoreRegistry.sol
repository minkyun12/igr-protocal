// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PoreRegistry {
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

    event ResolutionRecorded(bytes32 indexed key, string eventId, string finalState, bytes32 decisionHash);

    constructor() { owner = msg.sender; }

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    function record(string calldata eventId, string calldata decision, string calldata finalState, string calldata reasonCodes, bytes32 decisionHash) external onlyOwner {
        bytes32 key = keccak256(abi.encodePacked(eventId, block.timestamp));
        resolutions[key] = Resolution(eventId, decision, finalState, reasonCodes, decisionHash, block.timestamp);
        emit ResolutionRecorded(key, eventId, finalState, decisionHash);
    }

    function getResolution(bytes32 key) external view returns (Resolution memory) {
        return resolutions[key];
    }
}
