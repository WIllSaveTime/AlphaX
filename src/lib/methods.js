// Contract interaction
import { get } from 'svelte/store'
import { ethers } from 'ethers'

import { monitorTx } from './monitor'

import { getContract } from './contracts'
import { loadCandles, loadPositionLines, applyWatermark } from './chart'
import { formatUnits, formatProduct, formatPositions, parseUnits, getChainData, hideModal, showToast, getCachedLeverage, toBytes32, setActiveProducts } from './utils'

import * as Stores from './stores'

let productCache = {};

export async function getProduct(productId) {

	if (productCache[productId]) {
		return productCache[productId];
	}

	const contract = await getContract('trading');
	if (!contract) return {};

	productCache[productId] = formatProduct(productId, await contract.getProduct(toBytes32(productId)));

	return productCache[productId];

}

export async function selectProduct(productId) {

	// console.log('selectProduct', productId);

	if (!productId) productId = get(Stores.productId);

	// console.log('productId', productId);

	let product = await getProduct(productId);

	// console.log('product', product);

	if (!product.symbol) {
		product = formatProduct('ETH-USD', { symbol: 'ETH-USD', productId: 'ETH-USD', maxLeverage: 50 * 10 ** 8, fee: 0 });
	}

	// console.log('product2', product);

	Stores.product.set(product);
	Stores.productId.set(productId);
	localStorage.setItem('productId', productId);

	// Leverage
	const cached = getCachedLeverage(productId);
	// console.log('cached2', cached);
	// console.log('p', product);
	if (cached) {
		Stores.leverage.set(cached);
	} else {
		Stores.leverage.set(product.maxLeverage);
	}

	setActiveProducts();

	// Chart
	await loadCandles();
	applyWatermark();

}

export async function selectCurrency(currencyLabel) {

	if (!currencyLabel) currencyLabel = get(Stores.currencyLabel);

	const currencies = getChainData('currencies');
	if (!currencies) return;

	const currency = currencies[currencyLabel];

	Stores.currency.set(currency);
	Stores.currencyLabel.set(currencyLabel);
	localStorage.setItem('currencyLabel', currencyLabel);

	await getAllowance(currencyLabel, 'trading');

}

export async function getAllowance(currencyLabel, spenderName) {

	if (!currencyLabel) currencyLabel = get(Stores.currencyLabel);

	// console.log('currencyLabel', currencyLabel);

	// if (currencyLabel == 'weth') {
	// 	Stores.allowances.update((x) => {
	// 		if (!x[currencyLabel]) x[currencyLabel] = {};
	// 		x[currencyLabel][spenderName] = parseUnits(10**10, 18);
	// 		return x;
	// 	});
	// 	return;
	// }

	const address = get(Stores.address);
	if (!address) return;

	const contract = await getContract(currencyLabel);
	if (!contract) return;

	const spenderContract = await getContract(spenderName);
	if (!spenderContract) return;

	const allowance = formatUnits(await contract.allowance(address, spenderContract.address), 18);

	// console.log('allowance', allowance);

	Stores.allowances.update((x) => {
		if (!x[currencyLabel]) x[currencyLabel] = {};
		x[currencyLabel][spenderName] = allowance;
		return x;
	});

}

export async function getOrders(keys) {

	const contract = await getContract('trading');
	if (!contract) return {};

	return await contract.getOrders(keys);

}

export async function getPositions(keys) {

	const contract = await getContract('trading');
	if (!contract) return {};

	return await contract.getPositions(keys);

}

// ERC20

export async function approveCurrency(currencyLabel, spenderName, amount) {

	const contract = await getContract(currencyLabel, true);
	if (!contract) return;

	const spenderContract = await getContract(spenderName);
	if (!spenderContract) return;

	const spenderAddress = spenderContract.address;
	let approveAmount;
	if (currencyLabel == 'usdc') {
		approveAmount = parseUnits(amount, 6)
	} else {
		approveAmount = parseUnits(amount, 18)
	}
	try {
		const tx = await contract.approve(spenderAddress, approveAmount);
		monitorTx(tx.hash, 'approve', { currencyLabel, spenderName });
		let result = await tx.wait();
		if (result.transactionHash) {
			return 'approved';
		}
	} catch (e) {
		// console.log('here', e.message)
		showToast(e);
		return e;
	}

}

export async function getBalanceOf(currencyLabel, address) {

	if (!currencyLabel) currencyLabel = get(Stores.currencyLabel);

	if (!address) {
		address = get(Stores.address);
		if (!address) return 0;
	}

	let balance, decimals;
	// if (currencyLabel == 'weth') {
	// 	// get ETH balance
	// 	balance = await get(Stores.provider).getBalance(address);
	// } else {
	const contract = await getContract(currencyLabel);
	if (!contract) return 0;
	decimals = await contract.decimals();
	balance = await contract.balanceOf(address);
	// }

	return formatUnits(balance, decimals || 18);

}

// Pool

export async function getPoolShare(currencyLabel) {

	const contract = await getContract('router');
	if (!contract) return 0;

	const currencies = getChainData('currencies');
	if (!currencies) return;

	const currency = currencies[currencyLabel];

	return formatUnits(await contract.getPoolShare(currency), 2);

}

export async function getapxPoolShare(currencyLabel) {

	const contract = await getContract('router');
	if (!contract) return 0;

	const currencies = getChainData('currencies');
	if (!currencies) return;

	const currency = currencies[currencyLabel];

	return formatUnits(await contract.getApxShare(currency), 2);

}

export async function getUserPoolBalance(currencyLabel, isOld) {

	const address = get(Stores.address);
	if (!address) return 0;

	const contract = await getContract(isOld ? 'oldpool' : 'pool', false, currencyLabel);
	if (!contract) return 0;

	return formatUnits(await contract.getCurrencyBalance(address), 18);

}

let dataCache = {};

export async function getPoolInfo(currencyLabel, reloading) {

	let info = {
		tvl: 0,
		userBalance: 0,
		claimableReward: 0,
		poolShare: 50,
		withdrawFee: 0.15,
		utilization: 0,
		openInterest: 0,
		utilizationMultiplier: 0.1
	};

	if (!dataCache[currencyLabel]) dataCache[currencyLabel] = {};

	if (!reloading) {
		Stores.pools.update((x) => {
			x[currencyLabel] = info;
			return x;
		});
	}

	const contract = await getContract('pool', false, currencyLabel);

	if (!contract) return;

	try {
		const poolBalance = await getBalanceOf(currencyLabel, contract.address);
		const userBalance = await getUserPoolBalance(currencyLabel);
		const claimableReward = await getClaimableReward(currencyLabel);
		const poolShare = await getPoolShare(currencyLabel);

		const openInterest = formatUnits(await contract.openInterest(), 18);

		const withdrawFee = dataCache[currencyLabel].withdrawFee || formatUnits(await contract.withdrawFee(), 2);
		dataCache[currencyLabel].withdrawFee = withdrawFee;

		const utilizationMultiplier = dataCache[currencyLabel].utilizationMultiplier || formatUnits(await contract.utilizationMultiplier(), 2);
		dataCache[currencyLabel].utilizationMultiplier = utilizationMultiplier;

		const utilization = poolBalance * 1 ? openInterest * utilizationMultiplier / poolBalance : 0;

		info = {
			tvl: poolBalance,
			userBalance,
			claimableReward,
			poolShare,
			withdrawFee,
			utilization,
			openInterest,
			utilizationMultiplier
		};

	} catch (e) {
		// console.log('error', e.message);
	}

	Stores.pools.update((x) => {
		x[currencyLabel] = info;
		return x;
	});

}

export async function getOldPoolInfo(currencyLabel) {

	let info = {
		tvl: 0,
		userBalance: 0,
		claimableReward: 0,
		poolShare: 50,
		withdrawFee: 0.15,
		utilization: 0,
		openInterest: 0,
		utilizationMultiplier: 0.1
	};

	if (!dataCache[currencyLabel]) dataCache[currencyLabel] = {};

	const contract = await getContract('oldpool', false, currencyLabel);

	Stores.oldPools.update((x) => {
		x[currencyLabel] = info;
		return x;
	});

	if (!contract) return;

	try {
		const poolBalance = await getBalanceOf(currencyLabel, contract.address);
		const userBalance = await getUserPoolBalance(currencyLabel, true);
		const claimableReward = await getClaimableReward(currencyLabel, false, true);
		const poolShare = await getPoolShare(currencyLabel);

		const openInterest = formatUnits(await contract.openInterest(), 18);

		const withdrawFee = dataCache[currencyLabel].withdrawFee || formatUnits(await contract.withdrawFee(), 2);
		dataCache[currencyLabel].withdrawFee = withdrawFee;

		const utilizationMultiplier = dataCache[currencyLabel].utilizationMultiplier || formatUnits(await contract.utilizationMultiplier(), 2);
		dataCache[currencyLabel].utilizationMultiplier = utilizationMultiplier;

		const utilization = poolBalance * 1 ? openInterest * utilizationMultiplier / poolBalance : 0;

		info = {
			tvl: poolBalance,
			userBalance,
			claimableReward,
			poolShare,
			withdrawFee,
			utilization,
			openInterest,
			utilizationMultiplier
		};

	} catch (e) {
		// console.log('errror', e.message)
	}

	Stores.oldPools.update((x) => {
		x[currencyLabel] = info;
		return x;
	});

}

export async function deposit(currencyLabel = null, amount) {

	const contract = await getContract('pool', true, currencyLabel);
	if (!contract) throw 'No contract available.';

	try {
		let tx = await contract.deposit(parseUnits(amount, 18));

		monitorTx(tx.hash, 'pool-deposit', { currencyLabel });
		hideModal();
		amplitude.getInstance().logEvent('Pool Deposit', { currencyLabel, amount });
	} catch (e) {
		console.log('deposit err', e.message)
		showToast(e);
		return e;
	}

}

export async function withdraw(currencyLabel, amount, isOld) {

	const contract = await getContract(isOld ? 'oldpool' : 'pool', true, currencyLabel);
	if (!contract) throw 'No contract available.';

	try {
		let tx = await contract.withdraw(parseUnits(amount, 18));
		monitorTx(tx.hash, isOld ? 'pool-withdraw-old' : 'pool-withdraw', { currencyLabel });
		hideModal();
		amplitude.getInstance().logEvent('Pool Withdraw', { currencyLabel, amount, isOld });
	} catch (e) {
		// console.log('error', e.message)
		showToast(e);
		return e;
	}

}

export async function collectPoolReward(currencyLabel, isOld) {

	const contract = await getContract(isOld ? 'oldpoolrewards' : 'poolrewards', true, currencyLabel);
	if (!contract) throw 'No contract available.';
	// console.log('contract', contract)

	try {
		let tx = await contract.collectReward();
		monitorTx(tx.hash, isOld ? 'pool-collect-old' : 'pool-collect', { currencyLabel });
		amplitude.getInstance().logEvent('Pool Collect', { currencyLabel, isOld });
	} catch (e) {
		// console.log('error', e.message)
		showToast(e);
		return e;
	}

}

// APX Pool

export async function getUserapxBalance() {

	const address = get(Stores.address);
	if (!address) return 0;

	const contract = await getContract('apxPool');
	if (!contract) return 0;

	return formatUnits(await contract.getBalance(address), 18);

}

export async function getapxSupply() {

	const contract = await getContract('apxPool');
	if (!contract) return;

	return formatUnits(await contract.totalSupply(), 18);

}

export async function getapxPoolInfo() {

	let info = {
		supply: 0,
		userBalance: 0,
		poolShares: {}
	};

	const currencies = getChainData('currencies');
	if (!currencies) {
		Stores.apxPool.set(info);
		return;
	}

	const contract = await getContract('router');

	let poolShares = {};
	let rewardBalance = {};
	let rewardAmount = {};
	for (const currencyLabel in currencies) {
		poolShares[currencyLabel] = await getapxPoolShare(currencyLabel);
		const apxRewardContract = await contract.getApxRewards(currencies[currencyLabel])
		rewardBalance[currencyLabel] = await getBalanceOf(currencyLabel, apxRewardContract)
		rewardAmount[currencyLabel] = await getWithdrawAmount(currencyLabel)
		if (currencyLabel == 'usdc') rewardAmount[currencyLabel] = rewardAmount[currencyLabel] * 10 ** 12;
	}

	info = {
		supply: await getapxSupply(),
		userBalance: await getUserapxBalance(),
		poolShares,
		rewardBalance,
		rewardAmount
	};

	Stores.apxPool.set(info);

}

export async function depositapx(amount) {

	const contract = await getContract('apxPool', true);
	// console.log('contract', contract)
	if (!contract) throw 'No contract available.';

	try {
		let tx = await contract.deposit(parseUnits(amount, 18));
		monitorTx(tx.hash, 'apx-deposit');
		hideModal();
		amplitude.getInstance().logEvent('Pool Deposit Alpha X', { amount });
	} catch (e) {
		// console.log('deposit apx error', e.message)
		showToast(e);
		return e;
	}

}

export async function withdrawapx(amount) {

	const contract = await getContract('apxPool', true);
	if (!contract) throw 'No contract available.';

	try {
		let tx = await contract.withdraw(parseUnits(amount, 18));
		monitorTx(tx.hash, 'apx-withdraw');
		hideModal();
		amplitude.getInstance().logEvent('Pool Withdraw Alpha X', { amount });
	} catch (e) {
		// console.log('error', e.message)
		showToast(e);
		return e;
	}

}

export async function collectapxReward(currencyLabel) {

	const contract = await getContract('apxrewards', true, currencyLabel);
	if (!contract) throw 'No contract available.';

	try {
		let tx = await contract.collectRewardApx();
		monitorTx(tx.hash, 'apx-collect', { currencyLabel });
		let result = await tx.wait();
		amplitude.getInstance().logEvent('Pool Collect Alpha X', { currencyLabel });

		if (result) {
			Stores.confirmApxReward.update((x => {
				x[currencyLabel] = true;
				return x;
			}))
			return 'done'
		}
	} catch (e) {
		console.log('error', e.message)
		showToast(e);
		return e;
	}

}

// Rewards

export async function getClaimableReward(currencyLabel, forapx, isOld) {

	const address = get(Stores.address);
	if (!address) return 0;

	let contractName = forapx ? 'apxrewards' : 'poolrewards';
	if (forapx) {
		contractName = 'apxrewards';
	} else if (isOld) {
		contractName = 'oldpoolrewards';
	} else {
		contractName = 'poolrewards';
	}

	const contract = await getContract(contractName, true, currencyLabel);
	if (!contract) return;

	return formatUnits(await contract.getClaimableReward(), 18);

}

export async function getWithdrawAmount(currencyLabel) {
	const address = get(Stores.address);
	if (!address) return;
	const contract = await getContract('apxrewards', true, currencyLabel)
	if (!contract) return;
	let temp = await contract.getWithdrawAmount(address)
	return formatUnits(await contract.getWithdrawAmount(address), 18);
}

// Positions

// TODO: error handling

export async function submitOrder(isLong) {

	const contract = await getContract('trading', true);
	if (!contract) throw 'No contract available.';

	const currencyLabel = get(Stores.currencyLabel);
	const currency = get(Stores.currency);
	const productId = get(Stores.productId);
	const size = get(Stores.size);
	const leverage = get(Stores.leverage);

	if (!size || !leverage) return;

	let margin = size / leverage;

	try {

		let marginEth = 0;

		// if (currencyLabel == 'weth') {
		// 	// Add fee to margin
		// 	const product = get(Stores.product);
		// 	const fee = product.fee * 1;
		// 	margin += size * fee / 100;
		// 	marginEth = margin;
		// }

		margin = margin.toFixed(8);
		marginEth = marginEth.toFixed(12);

		let tx = await contract.submitOrder(
			toBytes32(productId),
			currency,
			isLong,
			parseUnits(margin),
			parseUnits(size)
		);

		monitorTx(tx.hash, 'submit-new-position');

		amplitude.getInstance().logEvent('Order Submit', { productId, currencyLabel, margin, size, leverage, isLong, marginEth });

	} catch (e) {
		// console.log('submitOrder error', e.message)
		showToast(e);
		return e;
	}

}

export async function submitCloseOrder(productId, currencyLabel, isLong, size, funding) {


	const contract = await getContract('trading', true);
	if (!contract) throw 'No contract available.';

	const currencies = getChainData('currencies');
	if (!currencies) return;

	const currency = currencies[currencyLabel];
	if (funding < 0) funding = -1 * funding

	try {
		let tx = await contract.submitCloseOrder(
			toBytes32(productId),
			currency,
			isLong,
			parseUnits(size),
			parseUnits(funding.toFixed(8))
		);

		monitorTx(tx.hash, 'submit-close-order');
		hideModal();

		amplitude.getInstance().logEvent('Order Close', { productId, currencyLabel, size, isLong });

	} catch (e) {
		console.log('error', e)
		showToast(e);
		return e;
	}

}

export async function cancelOrder(productId, currencyLabel, isLong) {

	const contract = await getContract('trading', true);
	if (!contract) throw 'No contract available.';

	const currencies = getChainData('currencies');
	if (!currencies) return;

	const currency = currencies[currencyLabel];

	try {

		const tx = await contract.cancelOrder(toBytes32(productId), currency, isLong);
		monitorTx(tx.hash, 'cancel-order');
		hideModal();

		amplitude.getInstance().logEvent('Order Cancel', { productId, currencyLabel, isLong });

	} catch (e) {
		// console.log('error', e.message)
		showToast(e);
		return e;

	}

}