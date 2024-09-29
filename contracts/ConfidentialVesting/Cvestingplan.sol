pragma solidity 0.8.24;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../ERC721Delegate/ERC721Delegate.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../sharedContracts/URIAdmin.sol";
import "./CvestingStorage.sol";
import "./CTransferHelper.sol";
import { EncryptedERC20 } from "contracts/EncryptedERC20.sol";
contract CTokenVestingPlans is ERC721Delegate, CVestingStorage, ReentrancyGuard, URIAdmin {
    using Counters for Counters.Counter;
    Counters.Counter private _planIds;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        uriAdmin = msg.sender;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
    function createPlan(
        address recipient,
        address token,
        einput amount,
        einput start,
        einput cliff,
        uint256 rate,
        uint256 period,
        address vestingAdmin,
        bytes calldata inputProof
    ) external nonReentrant returns (uint256 newPlanId) {
        euint64 amount_ = TFHE.asEuint64(amount, inputProof);
        euint64 start_ = TFHE.asEuint64(start, inputProof);
        euint64 cliff_ = TFHE.asEuint64(cliff, inputProof);
        require(recipient != address(0), "0_recipient");
        require(token != address(0), "0_token");
        (euint64 end, ebool valid) = CTimelockLibrary.validateEnd(start_, cliff_, amount_, rate, period);
        //   euint64 samount=TFHE.select(valid, amount_ ,TFHE.asEuint64(0));
        _planIds.increment();
        newPlanId = _planIds.current();
        TFHE.allow(amount_, address(token));
        EncryptedERC20(token).transferFrom(msg.sender, address(this), amount_);
        plans[newPlanId] = Plan(token, amount_, start_, cliff_, rate, period, vestingAdmin);
        _safeMint(recipient, newPlanId);
    }

    function redeemAllPlans() external nonReentrant {
        uint256 balance = balanceOf(msg.sender);
        uint256[] memory planIds = new uint256[](balance);
        for (uint256 i; i < balance; i++) {
            uint256 planId = tokenOfOwnerByIndex(msg.sender, i);
            planIds[i] = planId;
        }
        _redeemPlans(planIds, block.timestamp);
    }

    function _redeemPlans(uint256[] memory planIds, uint256 redemptionTime) internal {
    
        for (uint256 i; i < planIds.length; i++) {
            (euint64 balance, euint64 remainder, euint64 latestUnlock) = planBalanceOf(
                planIds[i],
                block.timestamp,
                redemptionTime
            );
            TFHE.allow(balance, address(this));
            TFHE.allow(remainder, address(this));
            TFHE.allow(latestUnlock, address(this));
            _redeemPlan(planIds[i], balance, remainder, latestUnlock);
        }
    }
    

    function _redeemPlan(uint256 planId, euint64 balance, euint64 remainder, euint64 latestUnlock) internal {
        require(ownerOf(planId) == msg.sender, "!owner");
        address token = plans[planId].token;
        plans[planId].amount = remainder;
        plans[planId].start = latestUnlock;
        TFHE.allow(balance, token);
        CTransferHelper.withdrawTokens(token, msg.sender, balance);
        // emit PlanRedeemed(planId, balance, remainder, latestUnlock);
    }

    //delegate functionality

    function delegate(uint256 planId, address delegatee) external {
        _delegateToken(delegatee, planId);
    }

    /// @notice functeion to delegate multiple plans to multiple delegates in a single transaction
    /// @dev this also calls the internal _delegateToken function from ERC721Delegate.sol to delegate an NFT to another wallet.
    /// @dev this function iterates through the array of plans and delegatees, delegating each individual NFT.
    /// @param planIds is the array of planIds that will be delegated
    /// @param delegatees is the array of addresses that each corresponding planId will be delegated to
    function delegatePlans(uint256[] calldata planIds, address[] calldata delegatees) external nonReentrant {
        require(planIds.length == delegatees.length, "array error");
        for (uint256 i; i < planIds.length; i++) {
            _delegateToken(delegatees[i], planIds[i]);
        }
    }

    /// @notice function to delegate all plans related to a specific token to a single delegatee address
    /// @dev this function pulls the balances of a wallet, checks that the token in the vesting plan matches the token input param, and then delegates it to the delegatee
    /// @param token is the address of the ERC20 tokens that are locked in the vesting plans desired to be delegated
    /// @param delegatee is the address of the delegate that all of the NFTs / plans will be delegated to.
    function delegateAll(address token, address delegatee) external {
        uint256 balance = balanceOf(msg.sender);
        for (uint256 i; i < balance; i++) {
            uint256 planId = tokenOfOwnerByIndex(msg.sender, i);
            if (plans[planId].token == token) _delegateToken(delegatee, planId);
        }
    }

    function lockedBalances(address holder, address token) external returns (euint64 lockedBalance) {
        uint256 holdersBalance = balanceOf(holder);
        for (uint256 i; i < holdersBalance; i++) {
            uint256 planId = tokenOfOwnerByIndex(holder, i);
            Plan memory plan = plans[planId];
            if (token == plan.token) {
                lockedBalance = TFHE.add(plan.amount, lockedBalance);
            }
        }
    }

    /// @notice this function will pull all of the tokens locked in vesting plans where the NFT has been delegated to a specific delegatee wallet address
    /// this is useful for the snapshot strategy hedgey-delegate, polling this function based on the wallet signed into snapshot
    /// by default all NFTs are self-delegated when they are minted.
    /// @param delegatee is the address of the delegate where NFTs have been delegated to
    /// @param token is the address of the ERC20 token that is locked in vesting plans and has been delegated
    function delegatedBalances(address delegatee, address token) external returns (euint64 delegatedBalance) {
        uint256 delegateBalance = balanceOfDelegate(delegatee);
        for (uint256 i; i < delegateBalance; i++) {
            uint256 planId = tokenOfDelegateByIndex(delegatee, i);
            Plan memory plan = plans[planId];
            if (token == plan.token) {
                delegatedBalance = TFHE.add(plan.amount, delegatedBalance);
            }
        }
    }
}
