<script>

	import { CHECKMARK_ICON, DISCORD_ICON, TWITTER_ICON, TELEGRAM_ICON, GITHUB_ICON, ARBITRUM_ICON, POLYGON_ICON } from '../../lib/icons'

	import { fade } from 'svelte/transition'

	amplitude.getInstance().logEvent('Buy');

</script>
<style>

	.home-wrap {
		padding: var(--base-padding);
		background-color: #1A201A;
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		overflow-y: scroll;
	}

	.home {
		margin: 0 auto;
		max-width: 720px;
		padding: 12px 0;
	}

	.hero {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
	}

	.hero-inner {		
		display: grid;
		grid-auto-flow: row;
		grid-gap: 64px;
		text-align: center;
	}

	.token-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.token-icon {
		height: 20px;
		width: 20px;
		margin: 100px 0;
		border-radius: 100%;
		box-shadow: 0 0 250px 100px #153C15;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.token-icon img {
		height: 72px;
	}

	.tagline {
		line-height: 1.618;
		font-size: 200%;
		font-weight: 600;
		max-width: 420px;
		margin: 0 auto;
	}

	.chains {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 90%;
		font-weight: 500;
		margin-top: 16px;
	}
	.chains :global(svg) {
		height: 22px;
		margin-right: 4px;
		margin-left: 8px;
	}

	.button-wrap {
	}

	.button {
		padding: 14px 24px;
		border-radius: var(--base-radius);
		font-weight: 700;
		font-size: 120%;
		color: var(--green-dark);
		background-color: var(--green);
		display: inline-block;
	}
	.button:hover {
		background-color: var(--btn-color);
	}

	.about, .coin-links {
		max-width: 290px;
		margin: 0 auto;
		border-top: 1px solid var(--onyx-dim);
		padding: 40px 0;
	}

	h4, p {
		padding: 0;
		margin: 0;
	}

	.item {
		margin-bottom: 20px;
	}
	.item:last-child {
		margin-bottom: 0;
	}

	h4 {
		margin-bottom: 6px;
	}
	h4 {
		display: flex;
		align-items: center;
	}
	h4 :global(svg) {
		height: 16px;
		fill: var(--green);
		margin-right: 10px;
	}
	p {
		line-height: 1.418;
		color: var(--sonic-silver);
	}

	.coin-links {
		text-align: center;
	}

	.coin-links a {
		margin: 0 8px;
	}

	.links {
		padding-top: 18px;
		text-align: center;
		line-height: 1.618;
	}
	.links a {
		margin: 0 8px;
		color: var(--sonic-silver);
		font-size: 80%;
	}
	.links a:hover {
		color: var(--btn-color);
	}
	.community {
		padding-top: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.community a {
		margin: 0 10px;
	}

	.community :global(svg) {
		height: 18px;
		fill: currentColor;
	}

</style>

<div class='home-wrap'>

	<div class='home'>

		<div class='hero'>

			<div class='hero-inner'>

				<div class='token-icon-wrap'>
					<div class='token-icon' in:fade={{ duration: 1500 }}>
						<img src='/apx-3d.png' title='Alpha X logo' alt='Alpha X logo' />
					</div>
				</div>

				<div class='button-wrap'>
					<a class='button' href='https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x031d35296154279dc1984dcd93e392b1f946737b' target="_blank">Buy Alpha X on QuickSwap</a>
					<div class='chains'>Set your network to {@html POLYGON_ICON} Polygon</div>
				</div>

			</div>

		</div>

		<div class='about'>

			<div class='item'>
				<h4>{@html CHECKMARK_ICON} Revenue Producing</h4>
				<p>Stake Alpha X to get a share of income</p>
			</div>

			<div class='item'>
				<h4>{@html CHECKMARK_ICON} No Inflation</h4>
				<p>Token supply is fixed at 100,000</p>
			</div>

			<div class='item'>
				<h4>{@html CHECKMARK_ICON} Strong Community</h4>
				<p>Bound by a culture of holding</p>
			</div>

		</div>

		<div class='coin-links'>
			<a href='https://www.coingecko.com/en/coins/apx' target="_blank">CoinGecko</a>
			<a href='https://coinmarketapx.com/currencies/apx/' target="_blank">CoinMarketapx</a>
		</div>
		
		<div class='community'>
			<a href='https://discord.gg/alphax' target='_blank' title='Discord'>{@html DISCORD_ICON}</a>
			<a href='https://t.me/alphax' target='_blank' title='Telegram'>{@html TELEGRAM_ICON}</a>
			<a href='https://twitter.com/alphaxleverage?s=11&t=c-XUrTprPDq8wY23Oj1b9A' target='_blank' title='Twitter'>{@html TWITTER_ICON}</a>
			<a href='https://github.com/alphax' target='_blank' title='Github'>{@html GITHUB_ICON}</a>
		</div>

		<div class='links'>
			<a href='/'>Home</a>
			<a href='https://alpha-x-1.gitbook.io/documentation' target='_blank'>Docs</a>
			<a href='https://www.tokenterminal.com/terminal/projects/apx' target='_blank'>Token Terminal</a>
			<a href='https://defillama.com/protocol/apx' target='_blank'>Defi Llama</a>
			<a href='https://www.immunefi.com/bounty/apx' target='_blank'>Immunefi</a>
		</div>

	</div>

</div>