// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require('hardhat');

const toBytes32 = function (string) {
  return ethers.utils.formatBytes32String(string);
}
const fromBytes32 = function (string) {
  return ethers.utils.parseBytes32String(string);
}

const parseUnits = function (number, units) {
  return ethers.utils.parseUnits(number, units || 18);
}

const formatUnits = function (number, units) {
  return ethers.utils.formatUnits(number, units || 18);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const provider = hre.ethers.provider;
  const signer = await provider.getSigner();

  /*
  await hre.ethers.provider.send('hardhat_setNonce', [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x3b"
  ]);
  return;
  */

  // // Local
  const darkOracleAddress = '0x14dc79964da2c08b23698b3d3cc7ca32193d9955';

  const account = await signer.getAddress();
  console.log('account', account);
  console.log('Account balance', formatUnits(await provider.getBalance(account)));

  // Router
  const Router = await hre.ethers.getContractFactory("Router");
  const router = await Router.deploy();
  await router.deployed();
  console.log("Router deployed to:", router.address);

  // Trading
  const Trading = await hre.ethers.getContractFactory("Trading");
  const trading = await Trading.deploy();
  await trading.deployed();
  console.log("Trading deployed to:", trading.address);

  // Oracle
  const Oracle = await hre.ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy();
  await oracle.deployed();
  console.log("Oracle deployed to:", oracle.address);

  // Treasury
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.deployed();
  console.log("Treasury deployed to:", treasury.address);

  // WETH, APX, USDC mock tokens (local only)
  const WETH = await hre.ethers.getContractFactory("WETH");
  const weth = await WETH.deploy();
  await weth.deployed();

  // const weth = {address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'};
  console.log("weth:", weth.address);

  const AlphaX = await hre.ethers.getContractFactory("AlphaX");
  const apx = await AlphaX.deploy("Apx", "APX", 18);
  await apx.deployed();

  // const apx = {address: '0x031d35296154279DC1984dCD93E392b1f946737b'};
  console.log("apx:", apx.address);

  const usdc = await AlphaX.deploy("USDC", "USDC", 6);
  await usdc.deployed();

  // const usdc = {address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'};
  console.log("usdc:", usdc.address);


  // PoolAPX
  const PoolAPX = await hre.ethers.getContractFactory("PoolAPX");
  const poolAPX = await PoolAPX.deploy(apx.address);
  await poolAPX.deployed();
  console.log("PoolAPX deployed to:", poolAPX.address);

  // Pools (WETH, USDC)
  const Pool = await hre.ethers.getContractFactory("Pool");
  
  const poolWETH = await Pool.deploy(weth.address);
  await poolWETH.deployed();
  console.log("poolWETH deployed to:", poolWETH.address);

  const poolUSDC = await Pool.deploy(usdc.address);
  await poolUSDC.deployed();
  console.log("poolUSDC deployed to:", poolUSDC.address);
  
  // Rewards

  const Rewards = await hre.ethers.getContractFactory("Rewards");

  // Rewards for Pools
  const poolRewardsWETH = await Rewards.deploy(poolWETH.address, weth.address);
  await poolRewardsWETH.deployed();
  console.log("poolRewardsWETH deployed to:", poolRewardsWETH.address);

  const poolRewardsUSDC = await Rewards.deploy(poolUSDC.address, usdc.address);
  await poolRewardsUSDC.deployed();
  console.log("poolRewardsUSDC deployed to:", poolRewardsUSDC.address);

  // Rewards for Apx
  const apxRewardsWETH = await Rewards.deploy(poolAPX.address, weth.address);
  await apxRewardsWETH.deployed();
  console.log("apxRewardsWETH deployed to:", apxRewardsWETH.address);

  const apxRewardsUSDC = await Rewards.deploy(poolAPX.address, usdc.address);
  await apxRewardsUSDC.deployed();
  console.log("apxRewardsUSDC deployed to:", apxRewardsUSDC.address);

  // Treasury fee share setup
  await treasury.setPoolShare(weth.address, 5000);
  await treasury.setPoolShare(usdc.address, 5000);
  console.log("set pool shares for treasury");

  await treasury.setapxPoolShare(weth.address, 1000);
  await treasury.setapxPoolShare(usdc.address, 1000);
  console.log("set Apx shares for treasury");

  // Router setup
  await router.setContracts(
    treasury.address,
    trading.address,
    poolAPX.address,
    oracle.address,
    darkOracleAddress,
    weth.address
  );

  await router.setPool(weth.address, poolWETH.address);
  await router.setPool(usdc.address, poolUSDC.address);

  await router.setPoolRewards(weth.address, poolRewardsWETH.address);
  await router.setPoolRewards(usdc.address, poolRewardsUSDC.address);

  await router.setApxRewards(weth.address, apxRewardsWETH.address);
  await router.setApxRewards(usdc.address, apxRewardsUSDC.address);
  
  console.log("Setup router contracts");

  await router.setCurrencies([weth.address, usdc.address]);
  console.log("Setup router currencies");

  // Link contracts with Router, which also sets their dependent contract addresses
  await trading.setRouter(router.address);
  await treasury.setRouter(router.address);
  await poolAPX.setRouter(router.address);
  await oracle.setRouter(router.address);
  await poolWETH.setRouter(router.address);
  await poolUSDC.setRouter(router.address);
  await poolRewardsWETH.setRouter(router.address);
  await poolRewardsUSDC.setRouter(router.address);
  await apxRewardsWETH.setRouter(router.address);
  await apxRewardsUSDC.setRouter(router.address);

  console.log("Linked router with contracts");

  const network = hre.network.name;
  console.log('network', network);

  // Add products

  const products = [
    {
      symbol: 'ETH-USD',
      id: 1,
      maxLeverage: 50,
      fee: 0.1,
      interest: 16,
      liquidationThreshold: 80
    },
    {
      symbol: 'BTC-USD',
      id: 2,
      maxLeverage: 50,
      fee: 0.1,
      interest: 16,
      liquidationThreshold: 80
    }
  ];

  for (const p of products) {
    await trading.addProduct(p.id, [
      parseUnits(""+p.maxLeverage),
      parseInt(p.liquidationThreshold * 100),
      parseInt(p.fee * 10000),
      parseInt(p.interest * 100),
    ]);
    console.log('Added product ' + p.symbol);
  }

  // // Mint some APX, USDC
  // await usdc.mint(parseUnits("100000", 6));
  // await apx.mint(parseUnits("1000"));


  /// GAS TESTS

  let tx, receipt;
  
  // submit order (ETH)
  tx = await trading.submitNewPosition(
    weth.address, // currency
    1, // productId
    0, // margin is sent as value for WETH
    parseUnits("5"), // size
    true, // isLong
    {value: parseUnits("1")} // margin
  );
  console.log('Submitted order long 1 ETH margin at 20x (WETH, ETH-USD)');
  receipt = await provider.getTransactionReceipt(tx.hash);
  console.log('Gas used:', (receipt.gasUsed).toNumber()); // 334911, 317811 / 244768 / 194000

  const posId = await trading.nextPositionId();
  console.log('Position', posId.toString());

  // // submit partial close order
  // tx = await trading.submitCloseOrder(
  //   posId, // position id
  //   parseUnits("1"), // size to close
  //   {value: parseUnits("0.0016")} // fee - to be calculated correctly. can be anything above the expected amount
  // );
  // console.log('Submitted close order for 1 ETH on position ', posId);
  // receipt = await provider.getTransactionReceipt(tx.hash);
  // console.log('Gas used:', (receipt.gasUsed).toNumber()); // 235604

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
