import { expect } from "chai";

import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployVestingFixture } from "./vestingtest.fixture";

describe("Vesting tests", () => {
    before(async function () {
        await initSigners();
        this.signers = await getSigners();
      });
      beforeEach(async function () {
        const {CTokenVestingPlans,EncryptedERC20} = await deployVestingFixture();
        this.contractAddress = await CTokenVestingPlans.getAddress();
        this.erc20Address = await EncryptedERC20.getAddress();
        this.contract = CTokenVestingPlans;
        this.erc20 = EncryptedERC20;
        this.instances = await createInstances(this.signers);
    });

    it("should create Vesting plans", async function()  {
        //token approval 
        const transaction = await this.erc20.mint(10000);
        await transaction.wait();
        const inputAlice = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    inputAlice.add64(1337);
    const encryptedAllowanceAmount = inputAlice.encrypt();
    const tx = await this.erc20["approve(address,bytes32,bytes)"](
      this.contractAddress,
      encryptedAllowanceAmount.handles[0],
      encryptedAllowanceAmount.inputProof,
    );
    await tx.wait();

    

    });


});