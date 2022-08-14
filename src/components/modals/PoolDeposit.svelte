<script>

	import { onMount } from 'svelte'

	import { formatToDisplay, formatCurrency, hideModal } from '../../lib/utils'
	
	import { deposit, depositapx, getBalanceOf, approveCurrency } from '../../lib/methods'

	import { allowances, apxPool } from '../../lib/stores';
	
	import Modal from './Modal.svelte'
	import DataList from '../layout/DataList.svelte'
	import Button from '../layout/Button.svelte'

	export let data;

	let amount;
	let result;

	async function calculateShare() {
		
	}

	let submitIsPending = false;
	const _submit = async() =>{
		submitIsPending = true;
		if(data.currencyLabel == 'apx') {
			result = await approveCurrency(data.currencyLabel, 'apxPool', amount)
		} else {
			result = await approveCurrency(data.currencyLabel, 'pool' + data.currencyLabel, amount);
		}
		if (result === 'approved') {
			let error;
			if (data.currencyLabel == 'apx') {
				error = await depositapx(
					amount
				);
			} else {
				error = await deposit(
					data.currencyLabel,
					amount
				);
			}
			submitIsPending = false;
		}
	}

	let loading = false;
	let balance = 0;
	onMount(async () => {
		// get available balance
		loading = true;
		balance = await getBalanceOf(data.currencyLabel);
		loading = false;
	});

	function setMaxAmount() {
		let _balance = balance * 1;
		if (data.currencyLabel == 'weth') {
			_balance -= 0.003; // gas 
			if (_balance < 0) _balance = 0;
		}
		amount = _balance;
	}

	let rows;
	$: rows = [
		{
			type: 'input',
			label: 'Amount (' + formatCurrency(data.currencyLabel) + ')',
			onKeyUp: calculateShare
		},
		{
			label: 'Wallet Balance',
			value: `${formatToDisplay(balance)}` + formatCurrency(data.currencyLabel),
			// onclick: setMaxAmount,
			isEmpty: loading
		}
	];

</script>

<style>
	.closeDiv{
		height: 10px;
	}
	.close{
		color: black;
		float: right;
		padding-right: 10px;
		cursor: pointer;
	}
</style>

<Modal>
	<div class="closeDiv"><span on:click={hideModal} class="close">x</span></div>
	<DataList data={rows} bind:value={amount} onSubmit={_submit} />
	<Button wrap={true} isLoading={!amount || submitIsPending} onClick={_submit} label={`Deposit into ${formatCurrency(data.currencyLabel)} pool`} />
</Modal>