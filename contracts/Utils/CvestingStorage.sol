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
    ) public returns (euint64 balance, euint64 remainder, euint64 latestUnlock) {
        euint64 start= plans[planId].start;
        euint64 cliff= plans[planId].cliff;
        euint64 amount= plans[planId].amount;
        uint256 rate = plans[planId].rate;
        uint256 period = plans[planId].period;
         TFHE.allow(start, address(this));
         TFHE.allow(cliff, address(this));
         TFHE.allow(amount, address(this));
        (balance, remainder, latestUnlock) = 
        CTimelockLibrary.balanceAtTime(
            start,
            cliff,
            amount,
           rate,
          period,
            timeStamp,
            redemptionTime
        );
        TFHE.allow(balance, address(this));
        TFHE.allow(remainder, address(this));
        TFHE.allow(latestUnlock, address(this));
    }
    
    function planEnd(uint256 planId) public  returns (euint64 end) {
        Plan memory plan = plans[planId];
        end = CTimelockLibrary.endDate(plan.start, plan.amount, plan.rate, plan.period);
    }




}
