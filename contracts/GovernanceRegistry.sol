// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GovernanceRegistry {
    struct Config {
        string[2] modelPair;
        string[] optionalSources;
        string[] advisoryPrompts;
        bytes32 configHash;
        bool locked;
    }

    struct Proposal {
        uint256 id;
        address proposer;
        bytes32 configHash;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        Config config;
    }

    address public owner;
    uint256 public nextProposalId = 1;
    uint256 public votingPeriod = 48 hours;
    uint256 public quorum = 1; // MVP: tokenless quorum placeholder

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => Config) public lockedConfigByMarket;

    event ConfigurationProposed(uint256 indexed proposalId, bytes32 configHash);
    event ConfigurationVoted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ConfigurationLocked(uint256 indexed marketId, bytes32 configHash);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setVotingPeriod(uint256 newVotingPeriod) external onlyOwner {
        require(newVotingPeriod >= 1 hours, "too short");
        votingPeriod = newVotingPeriod;
    }

    function setQuorum(uint256 newQuorum) external onlyOwner {
        require(newQuorum > 0, "zero quorum");
        quorum = newQuorum;
    }

    function propose(Config calldata config) external returns (uint256 proposalId) {
        require(config.configHash != bytes32(0), "empty hash");

        proposalId = nextProposalId++;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.configHash = config.configHash;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingPeriod;
        p.config = config;

        emit ConfigurationProposed(proposalId, config.configHash);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "proposal not found");
        require(block.timestamp <= p.endTime, "voting ended");
        require(!hasVoted[proposalId][msg.sender], "already voted");

        hasVoted[proposalId][msg.sender] = true;

        // MVP tokenless vote weight. Replace with ERC20Votes integration later.
        uint256 weight = 1;
        if (support) {
            p.yesVotes += weight;
        } else {
            p.noVotes += weight;
        }

        emit ConfigurationVoted(proposalId, msg.sender, support, weight);
    }

    function execute(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "proposal not found");
        require(block.timestamp > p.endTime, "voting active");
        require(!p.executed, "already executed");

        p.executed = true;
        bool passed = p.yesVotes >= quorum && p.yesVotes > p.noVotes;

        emit ProposalExecuted(proposalId, passed);
    }

    function lockForMarket(uint256 marketId, uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(p.executed, "proposal not executed");
        require(!lockedConfigByMarket[marketId].locked, "already locked");

        Config storage stored = lockedConfigByMarket[marketId];
        stored.modelPair = p.config.modelPair;
        stored.optionalSources = p.config.optionalSources;
        stored.advisoryPrompts = p.config.advisoryPrompts;
        stored.configHash = p.config.configHash;
        stored.locked = true;

        emit ConfigurationLocked(marketId, p.config.configHash);
    }

    function getLockedConfig(uint256 marketId) external view returns (Config memory) {
        require(lockedConfigByMarket[marketId].locked, "config not locked");
        return lockedConfigByMarket[marketId];
    }
}
