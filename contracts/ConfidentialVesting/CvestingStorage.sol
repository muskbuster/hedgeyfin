pragma solidity 0.8.24;

import "./TimeLock.sol";

contract CVestingStorage {
    struct Plan {
        address token;
        euint64 amount;
        euint64 start;
        euint64 cliff;
        uint256 rate;
        uint256 period;
        address vestingAdmin;
    }
    mapping(uint256 => Plan) public plans;
    event PlanCreated(
        uint256 indexed id,
        address indexed recipient,
        address indexed token,
        euint64 amount,
        euint64 start,
        euint64 cliff,
        uint256 end,
        uint256 rate,
        uint256 period
    );
    function planBalanceOf(
        uint256 planId,
        uint256 timeStamp,
        uint256 redemptionTime
    ) public  returns (euint64 balance, euint64 remainder, euint64 latestUnlock) {
        Plan memory plan = plans[planId];
        (balance, remainder, latestUnlock) = CTimelockLibrary.balanceAtTime(
            plan.start,
            plan.cliff,
            plan.amount,
            plan.rate,
            plan.period,
            timeStamp,
            redemptionTime
        );
        
    }
    function planEnd(uint256 planId) public  returns (euint64 end) {
        Plan memory plan = plans[planId];
        end = CTimelockLibrary.endDate(plan.start, plan.amount, plan.rate, plan.period);
    }




}
