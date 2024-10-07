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

  // it("should create Vesting plans", async function () {
  //   //token approval
  //   const transaction = await this.erc20.mint(1000000);
  //   await transaction.wait();
  //   const inputAlice = this.instances.alice.createEncryptedInput(this.erc20Address, this.signers.alice.address);
  //   inputAlice.add64(100000);
  //   const encryptedAllowanceAmount = inputAlice.encrypt();
  //   const tx = await this.erc20["approve(address,bytes32,bytes)"](
  //     this.contractAddress,
  //     encryptedAllowanceAmount.handles[0],
  //     encryptedAllowanceAmount.inputProof,
  //   );
  //   await tx.wait();
  // //check allowance
  //   const VestingInput = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
  //   VestingInput.add64(100000).add64(0).add64(200);
  //   const VestingOutput = VestingInput.encrypt();
  //   const createTx = await this.contract[
  //     "createPlan(address,address,bytes32,bytes32,bytes32,uint256,uint256,bytes)"
  //   ](
  //     this.signers.bob.address,
  //     this.erc20,
  //     VestingOutput.handles[0],
  //     VestingOutput.handles[1],
  //     VestingOutput.handles[2],
  //     10,
  //     1,
  //     VestingOutput.inputProof,
  //   );
  //   await createTx.wait();

  //   const { publicKey: publicKeyAlice, privateKey: privateKeyAlice } = this.instances.alice.generateKeypair();
  //   const eip712 = this.instances.alice.createEIP712(publicKeyAlice, this.erc20Address);
  //   const signatureAlice = await this.signers.alice.signTypedData(
  //     eip712.domain,
  //     { Reencrypt: eip712.types.Reencrypt },
  //     eip712.message,
  //   );
  //   const balanceHandleAlice2 = await this.erc20.balanceOf(this.signers.alice);
  //   const balanceAlice2 = await this.instances.alice.reencrypt(
  //     balanceHandleAlice2,
  //     privateKeyAlice,
  //     publicKeyAlice,
  //     signatureAlice.replace("0x", ""),
  //     this.erc20Address,
  //     this.signers.alice.address,
  //   );
  //   expect(balanceAlice2).to.equal(1000000-100000); 
  //   console.log(balanceAlice2);
  //   const plans= await this.contract.plans(1);
  //   //const plans2= await this.contract._planIds();
  //   console.log(plans);
  //  // console.log(plans2);
  // });


  it("should allow claim for vested plans", async function () {
    // Token approval
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
  
    // Check allowance and create plan
    const VestingInput = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    VestingInput.add64(1000).add64(0).add64(0);
    const VestingOutput = VestingInput.encrypt();
  
    const createTx = await this.contract[
      "createPlan(address,address,bytes32,bytes32,bytes32,uint256,uint256,bytes)"
    ](
      this.signers.bob.address,
      this.erc20,
      VestingOutput.handles[0],
      VestingOutput.handles[1],
      VestingOutput.handles[2],
      1,
      100,
      VestingOutput.inputProof,
    );
    await createTx.wait();
  
  
    const { publicKey: publicKeyAlice, privateKey: privateKeyAlice } = this.instances.alice.generateKeypair();
    const eip712Alice = this.instances.alice.createEIP712(publicKeyAlice, this.erc20Address);
    const signatureAlice = await this.signers.alice.signTypedData(
      eip712Alice.domain,
      { Reencrypt: eip712Alice.types.Reencrypt },
      eip712Alice.message,
    );
  
    const balanceHandleAlice = await this.erc20.balanceOf(this.signers.alice);
    const balanceAlice = await this.instances.alice.reencrypt(
      balanceHandleAlice,
      privateKeyAlice,
      publicKeyAlice,
      signatureAlice.replace("0x", ""),
      this.erc20Address,
      this.signers.alice.address,
    );
  
    expect(balanceAlice).to.equal(9000); 
    console.log(balanceAlice);
  
    const plans = await this.contract.plans(1);
    console.log(plans);
  
   
    const redeemTx = await this.contract.connect(this.signers.bob).redeemAllPlans();
    await redeemTx.wait(); 
  
    const balanceHandleBob = await this.erc20.balanceOf(this.signers.bob);
  
 
    const { publicKey: publicKeyBob, privateKey: privateKeyBob } = this.instances.bob.generateKeypair();
    
 
    const eip712Bob = this.instances.bob.createEIP712(publicKeyBob, this.erc20Address);
    const signatureBob = await this.signers.bob.signTypedData(
      eip712Bob.domain,
      { Reencrypt: eip712Bob.types.Reencrypt },
      eip712Bob.message,
    );
  
    
    const balanceBob = await this.instances.bob.reencrypt(
      balanceHandleBob,
      privateKeyBob,
      publicKeyBob,
      signatureBob.replace("0x", ""),
      this.erc20Address,
      this.signers.bob.address,
    );
  
    console.log(balanceBob);
    
  });

  // it("should delegate tokens to Alice and check delegated balance", async function () {
  //   // Step 1: Mint tokens for Alice
  //   const transaction = await this.erc20.mint(1000000);
  //   await transaction.wait();
  
  //   // Step 2: Approve contract to spend Alice's tokens
  //   const inputAlice = this.instances.alice.createEncryptedInput(this.erc20Address, this.signers.alice.address);
  //   inputAlice.add64(100000);
  //   const encryptedAllowanceAmount = inputAlice.encrypt();
  
  //   const tx = await this.erc20["approve(address,bytes32,bytes)"](
  //     this.contractAddress,
  //     encryptedAllowanceAmount.handles[0],
  //     encryptedAllowanceAmount.inputProof,
  //   );
  //   await tx.wait();
  
  //   // Step 3: Create vesting plan for Bob using Alice's tokens
  //   const VestingInput = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
  //   VestingInput.add64(100000).add64(0).add64(200);  // (amount, releaseTime, duration)
  //   const VestingOutput = VestingInput.encrypt();
  
  //   const createTx = await this.contract[
  //     "createPlan(address,address,bytes32,bytes32,bytes32,uint256,uint256,bytes)"
  //   ](
  //     this.signers.bob.address,
  //     this.erc20,
  //     VestingOutput.handles[0],
  //     VestingOutput.handles[1],
  //     VestingOutput.handles[2],
  //     10, // startTime
  //     0, // cliffTime
  //     VestingOutput.inputProof,
  //   );
  //   await createTx.wait();
  
  
  //   const delegateTx = await this.contract.connect(this.signers.bob).delegateAll(this.erc20Address, this.signers.alice.address);
  //   await delegateTx.wait();

  //   //Delegated Balance Check
  // });

});
