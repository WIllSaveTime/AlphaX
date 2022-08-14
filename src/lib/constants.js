export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const WETH_ADDR = '0x77eB6cD3debD391cc78e6c4a3a7495796bc435D5'

export const HISTORY_COUNT = 10;

export const CURRENCY_LOGOS = {
	weth: '/logos/ETH.svg',
	usdc: '/logos/USDC.svg',
	apx: '/logos/apx.svg',
	matic: '/logos/MATIC.svg',
	alpha: '/logos/ALPHA.svg'
}

export const ABIS = {
	router: [
		"function trading() view returns(address)",
		"function treasury() view returns(address)",
		"function apxPool() view returns(address)",
		"function oracle() view returns(address)",

		"function getPool(address currency) view returns(address)",
		"function getPoolShare(address currency) view returns(uint256)",
		"function getApxShare(address currency) view returns(uint256)",
		"function getPoolRewards(address currency) view returns(address)",
		"function getApxRewards(address currency) view returns(address)"
	],
	trading: [
		"function getProduct(bytes32 productId) view returns(tuple(uint64 maxLeverage, uint64 liquidationThreshold, uint64 fee, uint64 interest))",
		"function getOrders(bytes32[] keys) view returns(tuple(bool isClose, uint64 size, uint64 margin)[])",
		"function getPositions(bytes32[] keys) view returns(tuple(uint64 size, uint64 margin, uint64 timestamp, uint64 price)[])",

		"function submitOrder(bytes32 productId,address currency,bool isLong,uint256 margin,uint256 size) payable",
		"function submitCloseOrder(bytes32 productId,address currency,bool isLong,uint256 size,uint256 funding) payable",
		"function cancelOrder(bytes32 productId,address currency,bool isLong)",

		"event NewOrder(bytes32 indexed key,address indexed user,bytes32 indexed productId,address currency,bool isLong,uint256 margin,uint256 size,bool isClose, uint256 funding)",
		"event PositionUpdated(bytes32 indexed key,address indexed user,bytes32 indexed productId,address currency,bool isLong,uint256 margin,uint256 size,uint256 price,uint256 fee)",
		"event ClosePosition(bytes32 indexed key,address indexed user,bytes32 indexed productId,address currency,bool isLong,uint256 price,uint256 margin,uint256 size,uint256 fee,int256 pnl,bool wasLiquidated)"
	],
	pool: [
		"function getUtilization() view returns(uint256)",
		"function getBalance(address account) view returns(uint256)",
		"function getCurrencyBalance(address account) view returns(uint256)",
		"function totalSupply() view returns(uint256)",
		"function withdrawFee() view returns(uint256)",
		"function openInterest() view returns(uint256)",
		"function utilizationMultiplier() view returns(uint256)",

		"function deposit(uint256 amount) payable",
		"function withdraw(uint256 amount)"
	],
	rewards: [
		"function getClaimableReward() view returns(uint256)",

		"function collectReward()",
		"function collectRewardApx(uint256 amount)"
	],
	treasury: [
		
	],
	oracle: [
		"event SettlementError(uint256 indexed orderId,bool indexed isClose,string reason)"
	],
	erc20: [
		"function totalSupply() view returns (uint256)",
		"function decimals() view returns (uint8)",
		"function balanceOf(address account) view returns (uint256)",
		"function transfer(address recipient, uint256 amount) returns (bool)",
		"function allowance(address owner, address spender) view returns (uint256)",
		"function approve(address spender, uint256 amount) returns (bool)"
	]
};

// Contract addresses are pulled from router contract

export const CHAINDATA = {
	31337: {
		label: 'localhost',
		router: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
		explorer: 'http://localhost:8545',
		currencies: {
			weth: ADDRESS_ZERO,
			usdc: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
		},
		poolInception: {
			weth: 1637154307000,
			usdc: 1637154307000,
			apx: 1637154307000
		},
		apx: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
	},
	42161: {
		label: 'Arbitrum',
		router: '0x5ABFF8F8D5b13253dCAB1e427Fdb3305cA620119',
		explorer: 'https://arbiscan.io',
		rpc: 'https://arb1.arbitrum.io/rpc', // for walletconnect
		currencies: {
			weth: ADDRESS_ZERO,
			usdc: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'
		},
		poolInception: {
			weth: 1637154307000,
			usdc: 1637154307000,
			apx: 1637154307000
		},
		apx: '0x031d35296154279DC1984dCD93E392b1f946737b'
	},
	80001: {
		label: 'Mumbai',
		router: '0x18e47D360e7F5258b51F10E2786143d50F1D9110',
		explorer: 'https://mumbai.polygonscan.com/',
		rpc: 'https://polygon-mumbai.g.alchemy.com/v2/VFCowlE8aG7cSC17T52wbQAL387ycrzc', // for walletconnect
		currencies: {
			weth: '0xec8225B3cae93cad610380B6C3d522be98090C20',
			usdc: '0x77Ca06E65915DC8e8A00cFE3D39E4c48E0060d27'
		},
		poolInception: {
			weth: 1658797825000,
			usdc: 1658797825000,
			apx: 1658797825000
		},
		apx: '0x303043E85AfA2af16004A9f62496c28f07CE76B1'
	}
}