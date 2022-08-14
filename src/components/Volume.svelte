<script>
	
	import { onMount, onDestroy } from 'svelte'
	import { getVolume, getTotalPosition } from '../lib/graph'
	import { formatToDisplay } from '../lib/utils'
	import { SPINNER_ICON } from '../lib/icons'
	import { prices, volume_ETH, volume_USDC, totalPositionETHMargin, totalPositionUSDCMargin } from '../lib/stores'

	let v;
	let volumeETH;
	let volumeUSD;

	onMount(async () => {
		const res = await getVolume();
		await getTotalPosition()
		
		volumeETH = res.volumeETH;
		volumeUSD = res.volumeUSD;

		volume_ETH.set(res.volumeETH)
		volume_USDC.set(res.volumeUSD)
		v = setInterval(async () => {
			await getTotalPosition();
			const res = await getVolume();
			volumeETH = res.volumeETH;
			volumeUSD = res.volumeUSD;
			volume_ETH.set(volumeETH)
			volume_USDC.set(volumeUSD)
		}, 60*1000);
	});
	
	onDestroy(() => {
		clearInterval(v);
	});

	let volume_eth;
	let volume_usd;

	function calculateVolume(_prices, _volumeETH, _volumeUSD) {
		// console.log('calculateVolume', _prices, _volumeETH, _volumeUSD);
		if (!_prices['ETH-USD']) return;
		volume_eth = _volumeUSD * 1 / _prices['ETH-USD'] + _volumeETH * 1;
		volume_usd = _volumeUSD * 1 + _prices['ETH-USD'] * _volumeETH * 1;
		volume_usd = Math.round(volume_usd);
		// console.log('volume usd', volume_usd)
	}

	$: calculateVolume($prices, volumeETH, volumeUSD);

</script>

<style>
	.loading-icon :global(svg) {
		height: 16px;
		fill: none;
	}
	.dollar-amount {
		color: var(--sonic-silver);
		font-weight: 400;
	}
</style>

{#if volume_usd}
	${formatToDisplay(volume_usd)}
{:else}
	<div class='loading-icon'>{@html SPINNER_ICON}</div>
{/if}
