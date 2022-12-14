// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/SafeERC20.sol";
import "./libraries/Address.sol";

import "./interfaces/IRouter.sol";
import "./interfaces/IRewards.sol";

// This contract should be relatively upgradeable = no important state

contract Treasury {

	using SafeERC20 for IERC20; 
    using Address for address payable;

	// Contract dependencies
	address public owner;
	address public router;
	address public trading;
	address public oracle;

	uint256 public constant UNIT = 10**18;

	constructor() {
		owner = msg.sender;
	}

	// Governance methods

	function setOwner(address newOwner) external onlyOwner {
		owner = newOwner;
	}

	function setRouter(address _router) external onlyOwner {
		router = _router;
		oracle = IRouter(router).oracle();
		trading = IRouter(router).trading();
	}

	// Methods

	function notifyFeeReceived(
		address currency, 
		uint256 amount
	) external onlyTrading {

		// Contracts from Router
		address poolRewards = IRouter(router).getPoolRewards(currency);
		address apxRewards = IRouter(router).getApxRewards(currency);

		// Send poolShare to pool-currency rewards contract
		uint256 poolReward = IRouter(router).getPoolShare(currency) * amount / 10**4;
		_transferOut(currency, poolRewards, poolReward);
		IRewards(poolRewards).notifyRewardReceived(poolReward);

		// Send apxPoolShare to apx-currency rewards contract
		uint256 apxReward = IRouter(router).getApxShare(currency) * amount / 10**4;
		_transferOut(currency, apxRewards, apxReward);
		IRewards(apxRewards).notifyRewardReceived(apxReward);

	}

	function fundOracle(
		address destination, 
		uint256 amount
	) external onlyOracle {
		uint256 ethBalance = address(this).balance;
		if (amount > ethBalance) return;
		payable(destination).sendValue(amount);
	}

	function sendFunds(
		address token,
		address destination,
		uint256 amount
	) external onlyOwner {
		_transferOut(token, destination, amount);
	}

	function sendApxReward(
		address token,
		uint256 amount
	) public onlyOwner {
		uint256 balance = IERC20(token).balanceOf(address(this));
		require(balance > 0, "No amount for reward");
		require(balance > amount, "Exceed amount to send");
		address apxRewards = IRouter(router).getApxRewards(token);
		IRewards(apxRewards).adminAirdrop(amount);
		IERC20(token).transfer(apxRewards, amount);
	}

	// To receive ETH
	fallback() external payable {}
	receive() external payable {}

	// Utils

	function _transferOut(address currency, address to, uint256 amount) internal {
		if (amount == 0 || to == address(0)) return;
		// adjust decimals
		uint256 decimals = IRouter(router).getDecimals(currency);
		amount = amount * (10**decimals) / UNIT;
		IERC20(currency).safeTransfer(to, amount);
	}

	// Modifiers

	modifier onlyOwner() {
		require(msg.sender == owner, "!owner");
		_;
	}

	modifier onlyTrading() {
		require(msg.sender == trading, "!trading");
		_;
	}

	modifier onlyOracle() {
		require(msg.sender == oracle, "!oracle");
		_;
	}

}