// Connects to contracts deduced from router, initializes with ethers js
import { get } from 'svelte/store'
import { ContractFactory, ethers } from 'ethers'
import { CHAINDATA, ABIS } from './constants'
import { showModal, hideModal } from './utils'
import * as Stores from './stores'

let router;
let contracts = {};
let ack_network = false;

export async function getContract(contractName, withSigner, _currencyLabel) {

	const _signer = get(Stores.signer);

	if (_currencyLabel) {
		contractName += _currencyLabel;
	}

	const _chainId = get(Stores.chainId);
	const _provider = get(Stores.provider);

	if (!_chainId || !_provider) return;

	if (!CHAINDATA[_chainId]) {
		Stores.wrongNetwork.set(true);
		if (!ack_network) {
			showModal('Network');
			// ack_network = true;
		}
		return;
	}

	// hideModal();
	Stores.wrongNetwork.set(false);
	// console.log('contracts', contracts, contractName)

	if (contracts[contractName]) {
		if (withSigner) {
			return contracts[contractName].connect(_signer);
		}
		return contracts[contractName];
	}

	if (!router) {
		const routerAddress = CHAINDATA[_chainId].router;
		const routerAbi = ABIS.router;
		router = new ethers.Contract(routerAddress, routerAbi, _provider);
	}

	if (contractName == 'router') return router;

	const currencies = CHAINDATA[_chainId].currencies;

	// Currencies (ERC20)
	if (!contracts['weth'] || !contracts['usdc']) {	
		for (const currencyLabel in currencies) {
			contracts[currencyLabel] = new ethers.Contract(currencies[currencyLabel], ABIS.erc20, _provider);
		}
	}

	// apx (ERC20)
	if (!contracts['apx']) {
		const apx = CHAINDATA[_chainId].apx;
		contracts['apx'] = new ethers.Contract(apx, ABIS.erc20, _provider);
	}

	let address;

	const currency = currencies[_currencyLabel];

	let abiName = contractName;

	if (contractName.toLowerCase().includes('poolrewards')) {
		address = await router.getPoolRewards(currency);
		// console.log('pool reward address', address)
		// if (_currencyLabel == 'weth') {
		// 	address = '0x9FBA8B9A6335EDAe7F9d205e0D8873566E6311Bd';
		// } else if (_currencyLabel == 'usdc') {
		// 	address = '0xA2136E53c2A39513b968C42D86f449BC8Ef7A89d';
		// }
		abiName = 'rewards';
	} else if (contractName.toLowerCase().includes('apxrewards')) {
		address = await router.getApxRewards(currency);
		// if (_currencyLabel == 'weth') {
		// 	address = '0x6fCC7768CdcE48aa4e94d839E00f133de845B9FE';
		// } else if (_currencyLabel == 'usdc') {
		// 	address = '0xd17E84ec5Ef476c14C91c146B1FAcE6a7adAFd5A';
		// }
		abiName = 'rewards';
	} else if (contractName == 'apxPool') {
		address = await router[contractName]();
		// console.log('apx pool', address)
		abiName = 'pool';
	} else if (contractName.toLowerCase().includes('pool')) {
		address = await router.getPool(currency);
		// if (_currencyLabel == 'weth') {
		// 	address = '0xE0cCd451BB57851c1B2172c07d8b4A7c6952a54e';
		// } else if (_currencyLabel == 'usdc') {
		// 	address = '0x958cc92297e6F087f41A86125BA8E121F0FbEcF2';
		// }
		// console.log('pool address', address)
		abiName = 'pool';
	} else {
		address = await router[contractName]();
		// console.log('else addr', address)
	}
		
	// console.log('contract address', abiName, address);
	
	const abi = ABIS[abiName];

	contracts[contractName] = new ethers.Contract(address, abi, _provider);

	// console.log('contracts---', contracts[contractName]);

	if (withSigner) {
		return contracts[contractName].connect(_signer);
	}
	return contracts[contractName];

}