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
    const { CTokenVestingPlans, EncryptedERC20 } = await deployVestingFixture();
    this.contractAddress = await CTokenVestingPlans.getAddress();
    this.erc20Address = await EncryptedERC20.getAddress();
    this.contract = CTokenVestingPlans;
    this.erc20 = EncryptedERC20;
    this.instances = await createInstances(this.signers);
  });

  it("should create Vesting plans", async function () {
    //token approval
    const transaction = await this.erc20.mint(10000);
    await transaction.wait();
    const inputAlice = this.instances.alice.createEncryptedInput(this.erc20Address, this.signers.alice.address);
    inputAlice.add64(1000);
    const encryptedAllowanceAmount = inputAlice.encrypt();
    const tx = await this.erc20["approve(address,bytes32,bytes)"](
      this.contractAddress,
      encryptedAllowanceAmount.handles[0],
      encryptedAllowanceAmount.inputProof,
    );
    await tx.wait();
    // const bobErc20 = this.erc20.connect(this.signers.bob);
    // const inputBob1 = this.instances.bob.createEncryptedInput(this.erc20Address, this.signers.bob.address);
    // inputBob1.add64(1000); // above allowance so next tx should actually not send any token
    // const encryptedTransferAmount = inputBob1.encrypt();
    // const tx2 = await bobErc20["transferFrom(address,address,bytes32,bytes)"](
    //   this.signers.alice.address,
    //   this.signers.bob.address,
    //   encryptedTransferAmount.handles[0],
    //   encryptedTransferAmount.inputProof,
    // );
    // await tx2.wait();
    const VestingInput = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    VestingInput.add64(100).add64(200).add64(200);
    const VestingOutput = VestingInput.encrypt();
    const createTx = await this.contract[
      "createPlan(address,address,bytes32,bytes32,bytes32,uint256,uint256,address,bytes)"
    ](
      this.signers.bob.address,
      this.erc20,
      VestingOutput.handles[0],
      VestingOutput.handles[1],
      VestingOutput.handles[2],
      10,
      30000000,
      this.signers.bob.address,
      VestingOutput.inputProof,
    );
    await createTx;
    const { publicKey: publicKeyAlice, privateKey: privateKeyAlice } = this.instances.alice.generateKeypair();
    const eip712 = this.instances.alice.createEIP712(publicKeyAlice, this.erc20Address);
    const signatureAlice = await this.signers.alice.signTypedData(
      eip712.domain,
      { Reencrypt: eip712.types.Reencrypt },
      eip712.message,
    );
    const balanceHandleAlice2 = await this.erc20.balanceOf(this.signers.alice);
    const balanceAlice2 = await this.instances.alice.reencrypt(
      balanceHandleAlice2,
      privateKeyAlice,
      publicKeyAlice,
      signatureAlice.replace("0x", ""),
      this.erc20Address,
      this.signers.alice.address,
    );
    expect(balanceAlice2).to.equal(10000 - 1000);
  });
});
