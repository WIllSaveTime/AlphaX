// Subgraph interaction
import { get } from 'svelte/store'

import { WETH_ADDR, HISTORY_COUNT } from './constants'
import { getContract } from './contracts'
import { getOrders, getPositions } from './methods'

import { formatUnits, formatTrades, formatOrders, formatPositions, setActiveProducts, getChainData } from './utils'
import { history, orders, positions, address, poolStats, totalPositionETHMargin, totalPositionUSDCMargin } from './stores'

const graph_url = 'https://api.thegraph.com/subgraphs/name/cooker0910/prototype';
// const graph_url = 'https://api.thegraph.com/subgraphs/name/cooker0910/alpha';

export async function getVolume() {

	// v1 and v2 volume should already be added in graph call 

	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
					datas(first: 2) {
						id
						cumulativeVolume
					}
				}
			`
		})
	});
	const json = await response.json();
	// console.log('json', json);
	if (!json.data) return {volume: 1099876787};

	let datas = json.data && json.data.datas;
  	
	// let volumeETH = 420000; // cumulative previous versions of apx
	let volumeETH = 0; // cumulative previous versions of apx
	let volumeUSD = 0; // v2 + v1
	for (const d of datas) {
		// console.log('d', d);
		if (d.id.toLowerCase() == WETH_ADDR.toLowerCase()) { // ETH
			volumeETH += formatUnits(d.cumulativeVolume) * 1;
		} else {
			volumeUSD += formatUnits(d.cumulativeVolume) * 1;
		}
	}
	return {
		volumeETH: volumeETH,
		volumeUSD: volumeUSD
	};
}

export async function getUserOrders() {

	// console.log('called getUserOrders');

	// from events only

	const _address = get(address);
	// console.log(_address, '_address')
	if (!_address) return;

	// From recent events + graph - merge both
	const contract = await getContract('trading');
	if (!contract) return;

	const filter = contract.filters.NewOrder(null, _address);
	const _events = await contract.queryFilter(filter, -100);

	// console.log('NewOrder _events', filter);

	let _details = {};
	for (const ev of _events) {
		_details[ev.args.key] = ev.args;
	}

	// graph

	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
				  orders(
				    orderBy: createdAtTimestamp,
				    orderDirection: desc,
				    first:30,
				    where: {user: "${_address}"}
				  ) {
				  	id,
				    productId,
				    currency,
				    margin,
				    size,
				    isClose,
				    isLong,
				    createdAtTimestamp
				  }
				}
			`
		})
	});

	const json = await response.json();
	// console.log('json', json)

	let graph_orders = json.data && json.data.orders;

	// console.log('graph_orders', graph_orders);

	if (!graph_orders) graph_orders = [];

	for (const order of graph_orders) {
		_details[order.id] = order;
	}

	let graph_keys = graph_orders.map((e) => {return e.id;});

	let keys = _events.map((e) => {return e.args.key;});

	// uniq keys
	let unique_keys = [];
	for (const k of keys) {
		if (unique_keys.includes(k)) continue;
		unique_keys.push(k);
	}
	for (const k of graph_keys) {
		if (unique_keys.includes(k)) continue;
		unique_keys.push(k);
	}

	let _raw_orders = await getOrders(unique_keys);

	let _order_info = [];
	for (const k of unique_keys) {
		_order_info.push(_details[k]);
	}

	// console.log('_raw_orders', _raw_orders, _order_info);
	
	orders.set(formatOrders(_raw_orders,_order_info));

}

export async function getUserPositions() {

	const _address = get(address);
	if (!_address) return;

	// From recent events + graph - merge both

	// events

	const contract = await getContract('trading');
	if (!contract) return;

	const filter = contract.filters.PositionUpdated(null, _address);
	const _events = await contract.queryFilter(filter, -100);

	// console.log('_events', _events);

	let _details = {};
	for (const ev of _events) {
		_details[ev.args.key] = ev.args;
	}

	let keys = _events.map((e) => {return e.args.key;});

	// console.log('keys', keys);

	// uniq keys
	let unique_keys = [];
	for (const k of keys) {
		if (unique_keys.includes(k)) continue;
		unique_keys.push(k);
	}

	// console.log('unique_keys', unique_keys);

	let raw_positions = await getPositions(unique_keys);
	// console.log('raw_positions', raw_positions);

	let _position_info = [];
	for (const k of unique_keys) {
		_position_info.push(_details[k]);
	}

	let event_positions = formatPositions(raw_positions,_position_info);

	// console.log('event_positions', event_positions);

	// graph

	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
				  positions(
				    orderBy: createdAtTimestamp,
				    orderDirection: desc,
				    first:50,
				    where: {user: "${_address}"}
				  ) {
				  	id,
				    productId,
				    currency,
				    margin,
				    fee,
				    size,
				    leverage,
				    price,
				    isLong,
				    createdAtTimestamp
				  }
				}
			`
		})
	});

	const json = await response.json();
	// console.log('json', json)

	let _positions = json.data && json.data.positions;

	let _keys = _positions.map((e) => {return e.id;});

	let _raw_positions = await getPositions(_keys);

	// make sure graph positions actually exist in the contract for times the graph hasn't yet updated
	let actual_positions = [];
	let i = 0;
	for (const p of _positions) {
		if (_raw_positions[i] && _raw_positions[i].size && _raw_positions[i].size.toString() * 1 > 0) {
			actual_positions.push(p);
		}
		i++;
	}

	let graph_positions = formatPositions(actual_positions);

	// console.log('graph_positions', graph_positions);

	let unique_positions = [];
	let added_key = {};
	for (const item of event_positions) {
		if (!added_key[item.key]) {
			unique_positions.push(item);
			added_key[item.key] = true;
		}
	}
	for (const item of graph_positions) {
		if (!added_key[item.key]) {
			unique_positions.push(item);
			added_key[item.key] = true;
		}
	}

	positions.set(unique_positions);
	setActiveProducts();

}

export async function getUserHistory(first, skip) {

	// console.log('first, skip', first, skip);
	
	const _address = get(address);
	if (!_address) return;

	if (!first) first = HISTORY_COUNT;
	if (!skip) skip = 0;
	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
				  trades(
				    orderBy: timestamp,
				    orderDirection: desc,
				    first:${first},
				    skip:${skip},
				    where: {user: "${_address}"}
				  ) {
				    id,
				    txHash,
				    positionKey,
				    productId,
				    currency,
				    margin,
				    leverage,
				    size,
				    entryPrice,
				    closePrice,
				    isLong,
				    pnl,
				    fee,
				    timestamp,
				    blockNumber,
				    wasLiquidated,
				    isFullClose
				  }
				}
			`
		})
	});
	const json = await response.json();
	// console.log('json', json)
	const trades = formatTrades(json.data && json.data.trades);
	if (skip) {
		// append
		let _history = get(history);
		_history = _history.concat(trades);
		history.set(_history);
	} else {
		history.set(trades);
	}
	return trades;
}

export async function getPoolStats(currencyLabel) {

	const currencies = getChainData('currencies');
	if (!currencies) return;

	const currency = currencies[currencyLabel].toLowerCase();

	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
				  datas(
						where: {id: "${currency}"}
					) {
				    id,
				    cumulativeFees,
				    cumulativePnl,
				    cumulativeVolume,
				    cumulativeMargin,
				    openInterest,
				    openInterestLong,
				    openInterestShort
				    positionCount,
				    tradeCount
				  }
				}
			`
		})
	});
	const json = await response.json();

	poolStats.update((x) => {
		let d = json.data && json.data.datas && json.data.datas[0];
		if (!d) return x;
		x[currencyLabel] = {
			cumulativeFees: formatUnits(d.cumulativeFees),
			cumulativePnl: formatUnits(d.cumulativePnl)
		};
		return x;
	})
}

export async function getTotalPosition() {
	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
				  positions(
				    orderBy: createdAtTimestamp,
				    orderDirection: desc
				  ) {
				  	id,
				    productId,
				    currency,
				    margin,
				    fee,
				    size,
				    leverage,
				    price,
				    isLong,
				    createdAtTimestamp
				  }
				}
			`
		})
	});

	const json = await response.json();
	// console.log('json', json)

	let _positions = json.data && json.data.positions;

	let _keys = _positions.map((e) => {return e.id;});

	let _raw_positions = await getPositions(_keys);

	let totallPostionETH = 0
	let totalPositionUSDC = 0
	const currencies = getChainData('currencies');
	if (!currencies) return;
	let i = 0;

	for(const p of _positions) {
		if (_raw_positions[i] && _raw_positions[i].size && _raw_positions[i].size.toString() * 1 > 0) {
			if(currencies['weth'].toLowerCase() == p.currency.toLowerCase()) totallPostionETH += Number(p.margin);
			if(currencies['usdc'].toLowerCase() == p.currency.toLowerCase()) totalPositionUSDC += Number(p.margin);
		}
		i++;
	}

	totalPositionETHMargin.set(totallPostionETH)
	totalPositionUSDCMargin.set(totalPositionUSDC)
}
