import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy CTokenVestingPlans contract
  const cTokenVestingPlans = await deploy("CTokenVestingPlans", {
    from: deployer,
    args: ["IncoVesting", "INCV"],  // Constructor arguments
    log: true,
  });
  console.log(`CTokenVestingPlans contract deployed at: `, cTokenVestingPlans.address);


  const encryptedERC20 = await deploy("EncryptedERC20", {
    from: deployer,
    args: ["VST", "VST"],  // Constructor arguments
    log: true,
  });
  console.log(`EncryptedERC20 contract deployed at: `, encryptedERC20.address);


  const erc20Contract = await ethers.getContractAt("EncryptedERC20", encryptedERC20.address);
  const mintTx = await erc20Contract.mint(1000000); 
  await mintTx.wait();  
  console.log(`Minted 1,000,000 tokens to the deployer: ${deployer}`);
  
};

export default func;
func.id = "deploy_vesting_contracts";  // id required to prevent reexecution
func.tags = ["CTokenVestingPlans", "EncryptedERC20"];
