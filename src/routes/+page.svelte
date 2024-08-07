<script lang="ts">
	import ChampionFrame from '$lib/components/ChampionFrame.svelte';
	import { close } from '$lib/data/assets';
	import { allChampionIDs } from '$lib/data/data_dragon';
	import { entries, picks as storedPicks } from '$lib/data/stores';

	let previousMessageOrNull: any | null = null;
	let selectedChampionIDOrNull: string | null = null;
	let selectedLocationOrNull: string | null = null;

	let blueBans = new Array(5).fill(null);
	let redBans = new Array(5).fill(null);

	let picks = storedPicks.get();

	let update = 0;

	function handle(event: any) {
		const message = event.detail;

		const championID = message.championID;
		const location = message.location;
		const settable = message.settable;

		if (selectedChampionIDOrNull == null) {
			selectedChampionIDOrNull = championID;
			selectedLocationOrNull = location;
		} else {
			let previousSettable = false;

			if (previousMessageOrNull != null) {
				previousMessageOrNull.setChampionID(championID);
				previousSettable = previousMessageOrNull.settable;
			}

			message.setChampionID(selectedChampionIDOrNull);

			if (settable || previousSettable) {
				selectedChampionIDOrNull = null;
				selectedLocationOrNull = null;
			} else {
				selectedChampionIDOrNull = championID;
				selectedLocationOrNull = location;
			}
		}

		previousMessageOrNull = message;

		storedPicks.set(picks);

		updateSelected();
		updateDisabled();
	}

	let selectedMap: Record<string, boolean> = {};
	updateSelected();

	function updateSelected() {
		for (let championID of allChampionIDs) {
			selectedMap['frame' + championID] =
				selectedLocationOrNull == 'frame' && selectedChampionIDOrNull == championID;
		}
		for (let i = 0; i < 5; i++) {
			selectedMap['blueBan' + i] =
				selectedLocationOrNull == 'blueBan' + i && selectedChampionIDOrNull != null;
			selectedMap['redBan' + i] =
				selectedLocationOrNull == 'redBan' + i && selectedChampionIDOrNull != null;
			selectedMap['bluePick' + i] =
				selectedLocationOrNull == 'bluePick' + i && selectedChampionIDOrNull != null;
			selectedMap['redPick' + i] =
				selectedLocationOrNull == 'redPick' + i && selectedChampionIDOrNull != null;
		}
	}

	let disabledMap: Record<string, boolean> = {};
	updateDisabled();

	function updateDisabled() {
		for (let championID of allChampionIDs) {
			// @ts-ignore
			disabledMap['frame' + championID] =
				blueBans.includes(championID) ||
				redBans.includes(championID) ||
				picks.blue.includes(championID) ||
				picks.red.includes(championID);
		}
	}

	for (const entry of entries) {
		entry.onChange(updateChampionIDs);
		entry.onChange(() => (update += 1));
	}

	let championIDs = allChampionIDs;
	updateChampionIDs();

	function updateChampionIDs() {
		const predicates = [];

		for (const entry of entries) {
			predicates.push(entry.filter.predicate(entry.selector.selected));
		}

		championIDs = allChampionIDs.filter((id) => {
			for (const predicate of predicates) {
				if (!predicate(id)) {
					return false;
				}
			}

			return true;
		});
	}

	function clearPickBan(_event: any) {
		blueBans = new Array(5).fill(null);
		redBans = new Array(5).fill(null);

		picks.blue = new Array(5).fill(null);
		picks.red = new Array(5).fill(null);
		storedPicks.set(picks);

		updateSelected();
		updateDisabled();

		for (const entry of entries) {
			entry.selector.deselect();
		}

		// TODO Clear selectedOrNull?
	}
</script>

<div class="grid">
	<div class="blue bans">
		{#each Array(5) as _, i}
			<ChampionFrame
				bind:championID={blueBans[i]}
				on:message={handle}
				struck={true}
				settable={true}
				location={'blueBan' + i}
				bind:selected={selectedMap['blueBan' + i]}
			/>
		{/each}
	</div>
	<div class="red bans">
		{#each Array(5) as _, i}
			<ChampionFrame
				bind:championID={redBans[i]}
				on:message={handle}
				struck={true}
				settable={true}
				location={'redBan' + i}
				bind:selected={selectedMap['redBan' + i]}
			/>
		{/each}
	</div>
	<div class="blue picks">
		{#each Array(5) as _, i}
			<div>
				<h2 class={selectedMap['bluePick' + i] ? 'gold' : ''}>B{i + 1}</h2>
				<ChampionFrame
					bind:championID={picks.blue[i]}
					on:message={handle}
					settable={true}
					big={true}
					location={'bluePick' + i}
					bind:selected={selectedMap['bluePick' + i]}
				/>
			</div>
		{/each}
	</div>
	<div class="red picks">
		{#each Array(5) as _, i}
			<div>
				<ChampionFrame
					bind:championID={picks.red[i]}
					on:message={handle}
					settable={true}
					big={true}
					location={'redPick' + i}
					bind:selected={selectedMap['redPick' + i]}
				/>
				<h2 class={selectedMap['redPick' + i] ? 'gold' : ''}>R{i + 1}</h2>
			</div>
		{/each}
	</div>
	<div class="picker">
		<div class="bar">
			<div class="filter">
				{#key update}
					{#each entries as entry}
						{#each entry.assets as { type, src }}
							<!-- svelte-ignore a11y-missing-attribute -->
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<img
								{src}
								class={entry.selector.selected == type ? 'selected' : ''}
								on:click={() => entry.selector.select(type)}
							/>
						{/each}
						<div class="separator"></div>
					{/each}
				{/key}
			</div>
			<div class="options">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<img src={close} on:click={clearPickBan} />
			</div>
		</div>
		<div class="palette">
			{#each championIDs as championID}
				<ChampionFrame
					{championID}
					on:message={handle}
					showName={true}
					location={'frame'}
					bind:selected={selectedMap['frame' + championID]}
					bind:disabled={disabledMap['frame' + championID]}
				/>
			{/each}
		</div>
	</div>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: min-content min-content min-content min-content 1fr;
		gap: var(--section-gap) var(--section-gap);
		grid-auto-flow: row;
		grid-template-areas:
			'bb'
			'rb'
			'bp'
			'rp'
			'pp';
	}

	.red.picks,
	.red.bans {
		margin-bottom: var(--section-gap);
	}

	.picks {
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: var(--section-gap);
	}

	.picks > div {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--section-gap);
	}

	.blue.bans {
		grid-area: bb;
	}

	.red.bans {
		grid-area: rb;
	}

	.blue.picks {
		grid-area: bp;
	}

	.red.picks {
		grid-area: rp;
	}

	.bans {
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: var(--section-gap);
	}

	.picks > div > h2 {
		width: auto;
		height: auto;
	}

	.picker {
		grid-area: pp;

		display: flex;
		flex-direction: column;
		gap: var(--section-gap);

		height: 40rem;
	}

	.picker .bar {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.picker .bar img {
		height: 2rem;

		cursor: pointer;
	}

	.picker .bar img.selected,
	.picker .bar img:hover {
		filter: grayscale() brightness(200%);
	}

	.picker .bar .filter {
		display: flex;
		flex-direction: row;
		gap: 0.25rem;
	}

	.picker .bar .filter .separator:not(:last-of-type) {
		border-left: 1px solid var(--clr-neutral-800);
		border-radius: var(--radius-element);

		height: 85%;

		margin-inline: 0.5rem;
		margin-block: auto;
	}

	.palette {
		display: grid;
		justify-items: center;
		grid-template-columns: repeat(6, minmax(min-content, 1fr));
		grid-auto-rows: min-content;
		gap: var(--section-gap);

		height: 100%;
		overflow-y: scroll;
	}

	.blue {
		color: var(--clr-blue);
	}

	.red {
		color: var(--clr-red);
	}

	.gold {
		color: var(--clr-gold);
	}

	@media screen and (min-width: 80rem) {
		/* desktop */
		.grid {
			grid-template-columns: min-content 1fr 1fr min-content;
			grid-template-rows: min-content 1fr;
			grid-template-areas:
				'bb bb rb rb'
				'bp pp pp rp';
		}

		.red.bans,
		.red.picks {
			margin-bottom: 0;
		}

		.blue.bans {
			justify-content: left;
		}

		.red.bans {
			justify-content: right;
		}

		.picks {
			flex-direction: column;
		}

		.picks > div {
			flex-direction: row;
		}

		.palette {
			grid-template-columns: repeat(7, minmax(min-content, 1fr));
		}
	}
</style>
