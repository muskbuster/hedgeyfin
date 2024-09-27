import { ethers } from "hardhat";

import type { CVestingStorage,CTokenVestingPlans,EncryptedERC20 } from "../../types";
import { getSigners } from "../signers";

export async function deployVestingFixture(): Promise<{CTokenVestingPlans:CTokenVestingPlans,EncryptedERC20:EncryptedERC20}>
{
    const signers = await getSigners();
    const contractFactory = await ethers.getContractFactory("CTokenVestingPlans");
    const contract = await contractFactory.connect(signers.alice).deploy("IncoVesting","INCV");
    await contract.waitForDeployment();
    const erc20Factory=  await ethers.getContractFactory("EncryptedERC20");
    const erc20= await erc20Factory.connect(signers.alice).deploy("VST","VST");
    await erc20.waitForDeployment();
  return {CTokenVestingPlans:contract,EncryptedERC20:erc20};
}
