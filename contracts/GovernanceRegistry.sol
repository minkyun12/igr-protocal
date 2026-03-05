// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20VotesLike {
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256);
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256);
}

contract GovernanceRegistry {
    struct Config {
        string[2] modelPair;
        string[] optionalSources;
        string[] advisoryPrompts;
        string mismatchPolicy;
        uint256 rerunDelayHours;
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
        uint256 snapshotTimepoint;
        uint256 executableAt;
        bool executed;
        bool passed;
        Config config;
    }

    address public owner;
    IERC20VotesLike public governanceToken;

    uint256 public nextProposalId = 1;
    uint256 public votingPeriod = 48 hours;
    uint256 public executionDelay = 24 hours;

    // Basis points (10000 = 100%)
    uint256 public proposalThresholdBps = 100; // 1.0%
    uint256 public quorumBps = 1000; // 10.0%

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => Config) public lockedConfigByMarket;

    event GovernanceTokenUpdated(address indexed token);
    event VotingPeriodUpdated(uint256 newVotingPeriod);
    event ExecutionDelayUpdated(uint256 newExecutionDelay);
    event ProposalThresholdUpdated(uint256 newProposalThresholdBps);
    event QuorumUpdated(uint256 newQuorumBps);

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

    function setGovernanceToken(address token) external onlyOwner {
        require(token != address(0), "zero token");
        governanceToken = IERC20VotesLike(token);
        emit GovernanceTokenUpdated(token);
    }

    function setVotingPeriod(uint256 newVotingPeriod) external onlyOwner {
        require(newVotingPeriod >= 1 hours, "too short");
        votingPeriod = newVotingPeriod;
        emit VotingPeriodUpdated(newVotingPeriod);
    }

    function setExecutionDelay(uint256 newExecutionDelay) external onlyOwner {
        require(newExecutionDelay <= 30 days, "delay too long");
        executionDelay = newExecutionDelay;
        emit ExecutionDelayUpdated(newExecutionDelay);
    }

    function setProposalThresholdBps(uint256 newProposalThresholdBps) external onlyOwner {
        require(newProposalThresholdBps <= 10_000, "invalid bps");
        proposalThresholdBps = newProposalThresholdBps;
        emit ProposalThresholdUpdated(newProposalThresholdBps);
    }

    function setQuorumBps(uint256 newQuorumBps) external onlyOwner {
        require(newQuorumBps > 0 && newQuorumBps <= 10_000, "invalid bps");
        quorumBps = newQuorumBps;
        emit QuorumUpdated(newQuorumBps);
    }

    function propose(Config calldata config) external returns (uint256 proposalId) {
        require(config.configHash != bytes32(0), "empty hash");
        require(address(governanceToken) != address(0), "token not set");
        require(bytes(config.mismatchPolicy).length > 0, "empty mismatch policy");
        require(
            keccak256(bytes(config.mismatchPolicy)) == keccak256(bytes("split_immediate")) ||
            keccak256(bytes(config.mismatchPolicy)) == keccak256(bytes("rerun_once_then_split")),
            "invalid mismatch policy"
        );

        uint256 snapshotTimepoint = block.number - 1;
        uint256 proposerVotes = governanceToken.getPastVotes(msg.sender, snapshotTimepoint);
        uint256 totalSupply = governanceToken.getPastTotalSupply(snapshotTimepoint);
        uint256 threshold = (totalSupply * proposalThresholdBps) / 10_000;
        require(proposerVotes >= threshold, "proposal threshold");

        proposalId = nextProposalId++;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.configHash = config.configHash;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingPeriod;
        p.snapshotTimepoint = snapshotTimepoint;
        p.config = config;

        emit ConfigurationProposed(proposalId, config.configHash);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "proposal not found");
        require(block.timestamp <= p.endTime, "voting ended");
        require(!hasVoted[proposalId][msg.sender], "already voted");
        require(address(governanceToken) != address(0), "token not set");

        hasVoted[proposalId][msg.sender] = true;

        uint256 weight = governanceToken.getPastVotes(msg.sender, p.snapshotTimepoint);
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
        require(address(governanceToken) != address(0), "token not set");

        uint256 totalSupply = governanceToken.getPastTotalSupply(p.snapshotTimepoint);
        uint256 quorumVotes = (totalSupply * quorumBps) / 10_000;
        bool passed = p.yesVotes >= quorumVotes && p.yesVotes > p.noVotes;

        p.executed = true;
        p.passed = passed;
        p.executableAt = block.timestamp + executionDelay;

        emit ProposalExecuted(proposalId, passed);
    }

    function lockForMarket(uint256 marketId, uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.executed, "proposal not executed");
        require(p.passed, "proposal not passed");
        require(block.timestamp >= p.executableAt, "execution delay active");
        require(!lockedConfigByMarket[marketId].locked, "already locked");

        Config storage stored = lockedConfigByMarket[marketId];
        stored.modelPair = p.config.modelPair;
        stored.optionalSources = p.config.optionalSources;
        stored.advisoryPrompts = p.config.advisoryPrompts;
        stored.mismatchPolicy = p.config.mismatchPolicy;
        stored.rerunDelayHours = p.config.rerunDelayHours;
        stored.configHash = p.config.configHash;
        stored.locked = true;

        emit ConfigurationLocked(marketId, p.config.configHash);
    }

    function getLockedConfig(uint256 marketId) external view returns (Config memory) {
        require(lockedConfigByMarket[marketId].locked, "config not locked");
        return lockedConfigByMarket[marketId];
    }
}
