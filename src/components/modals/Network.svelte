<script>
	import Modal from '../modals/Modal.svelte'
	import Button from '../layout/Button.svelte'

	import { switchChains } from '../../lib/wallet'
</script>

<style>

	.note {
		padding: var(--base-padding);
		line-height: 1.618;
		color: var(--red-dark);
	}

</style>

<Modal title='Invalid Network' showHeader={true} showCancel={true}>

	<div class='note'>
		Select Polygon(mumbai) as your wallet's network to trade or pool on Alpha X.
	</div>

	<Button wrap={true} onClick={() => {switchChains()}} label={`Switch to Polygon`} />

</Modal>