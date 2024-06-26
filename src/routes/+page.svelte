<script lang="ts">
	import ChampionFrame from "$lib/components/ChampionFrame.svelte";
	import { colors, lanes, close } from "$lib/data/assets";
	import { allChampionIDs } from "$lib/data/data_dragon";
	import { Color, Lane, isColor, isLane, refreshColors, refreshLanes, picks as picksStore } from "$lib/data/stores";

	let previousMessageOrNull: any | null = null;
	let selectedChampionIDOrNull: string | null = null;
	let selectedLocationOrNull: string | null = null;

	let blueBans = new Array(5).fill(null);
	let redBans = new Array(5).fill(null);

	let picks = picksStore.get();

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

		picksStore.set(picks);

		updateSelected();
		updateDisabled();
	}

	let selectedMap: Record<string, boolean> = {};
	updateSelected();

	function updateSelected() {
		for (let championID of allChampionIDs) {
			selectedMap["frame" + championID] = selectedLocationOrNull == "frame" && selectedChampionIDOrNull == championID;
		}
		for (let i = 0; i < 5; i++) {
			selectedMap["blueBan" + i] = selectedLocationOrNull == "blueBan" + i && selectedChampionIDOrNull != null;
			selectedMap["redBan" + i] = selectedLocationOrNull == "redBan" + i && selectedChampionIDOrNull != null;
			selectedMap["bluePick" + i] = selectedLocationOrNull == "bluePick" + i && selectedChampionIDOrNull != null;
			selectedMap["redPick" + i] = selectedLocationOrNull == "redPick" + i && selectedChampionIDOrNull != null;
		}
	}

	let disabledMap: Record<string, boolean> = {};
	updateDisabled();

	function updateDisabled() {
		for (let championID of allChampionIDs) {
			// @ts-ignore
			disabledMap["frame" + championID] = blueBans.includes(championID) || redBans.includes(championID) || picks.blue.includes(championID) || picks.red.includes(championID);
		}
	}

	let laneFilterOrNull: Lane | null = null;

	function toggleLaneFilter(lane: Lane) {
		if (laneFilterOrNull != lane) {
			laneFilterOrNull = lane;
		} else {
			laneFilterOrNull = null;
		}

		updateChampionFilter();
		updateLaneFilterMap();
	}

	let colorFilterOrNull: Color | null = null;

	function toggleColorFilter(color: Color) {
		if (colorFilterOrNull != color) {
			colorFilterOrNull = color;
		} else {
			colorFilterOrNull = null;
		}

		updateChampionFilter();
		updateColorFilterMap();
	}

	let championIDs = allChampionIDs;
	updateChampionFilter();

	type LanePredicate = (lane: Lane | null, championIDOrNull: string | null) => boolean;

	function getLaneFilterPredicate(laneFilterOrNull: Lane | null): LanePredicate {
		if (laneFilterOrNull == null) {
			return (_lane, _championIDOrNull) => true;
		}

		return (lane, championIDOrNull) => isLane(lane, championIDOrNull);
	}

	type ColorPredicate = (color: Color | null, championIDOrNull: string | null) => boolean;

	function getColorFilterPredicate(colorFilterOrNull: Color | null): ColorPredicate {
		if (colorFilterOrNull == null) {
			return (_color, _championIDOrNull) => true;
		}

		return (color, championIDOrNull) => isColor(color, championIDOrNull);
	}

	function updateChampionFilter() {
		const laneFilterPredicate = getLaneFilterPredicate(laneFilterOrNull);
		const colorFilterPredicate = getColorFilterPredicate(colorFilterOrNull);

		championIDs = allChampionIDs.filter(championID => laneFilterPredicate(laneFilterOrNull, championID) && colorFilterPredicate(colorFilterOrNull, championID));
	}

	refreshLanes.onTrigger(() => {
		updateChampionFilter();
	});

	refreshColors.onTrigger(() => {
		updateChampionFilter();
	});

	let laneFilterMap: Record<string, boolean> = {};
	updateLaneFilterMap();

	function updateLaneFilterMap() {
		for (let lane of lanes) {
			laneFilterMap[lane.lane] = laneFilterOrNull == lane.lane;
		}
	} 

	let colorFilterMap: Record<string, boolean> = {};
	updateColorFilterMap();

	function updateColorFilterMap() {
		for (let color of colors) {
			colorFilterMap[color.color] = colorFilterOrNull == color.color;
		}
	} 

	function clearPickBan(_event: any) {
		blueBans = new Array(5).fill(null);
		redBans = new Array(5).fill(null);

		picks.blue = new Array(5).fill(null);
		picks.red = new Array(5).fill(null);
		picksStore.set(picks);

		updateSelected();
		updateDisabled();
		
		// TODO Clear selectedOrNull?
	}
</script>

<div class="bans-container">
	<div class="bans">
		{#each Array(5) as _, i }
			<ChampionFrame bind:championID={blueBans[i]} on:message={handle} struck={true} gap={i == 2} settable={true} location={"blueBan" + i} bind:selected={selectedMap["blueBan" + i]} />
		{/each}
	</div>
	<div class="bans">
		{#each Array(5) as _, i }
			<ChampionFrame bind:championID={redBans[i]} on:message={handle} struck={true} gap={i == 1} settable={true} location={"redBan" + i} bind:selected={selectedMap["redBan" + i]} />
		{/each}
	</div>
</div>

<div class="tri">
	<div class="picks">
		{#each Array(5) as _, i}
			<div>
				<h2 class="blue {selectedMap["bluePick" + i] ? "gold" : ""}">B{i + 1}</h2>
				<ChampionFrame bind:championID={picks.blue[i]} on:message={handle} settable={true} big={true} location={"bluePick" + i} bind:selected={selectedMap["bluePick" + i]} />
			</div>
		{/each}
	</div>
	<div class="picker">
		<div class="bar">
			<div class="filter">
				{#each lanes as {lane, src}}
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<img {src} class="{laneFilterMap[lane] ? "selected" : ""}" on:click={() => toggleLaneFilter(lane)}>
				{/each}
				{#each colors as {color, src}}
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<img {src} class="color {colorFilterMap[color] ? "selected" : ""}" on:click={() => toggleColorFilter(color)}>
				{/each}
			</div>
			<div class="options">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<img src={close} on:click={clearPickBan}>
			</div>
		</div>
		<div class="palette">
			{#each championIDs as championID}
				<ChampionFrame {championID} on:message={handle} showName={true} location={"frame"} bind:selected={selectedMap["frame" + championID]} bind:disabled={disabledMap["frame" + championID]} />
			{/each}
		</div>
	</div>
	<div class="picks">
		{#each Array(5) as _, i}
			<div>
				<ChampionFrame bind:championID={picks.red[i]} on:message={handle} settable={true} big={true} location={"redPick" + i} bind:selected={selectedMap["redPick" + i]} />
				<h2 class="red {selectedMap["redPick" + i] ? "gold" : ""}">R{i + 1}</h2>
			</div>
		{/each}
	</div>
</div>


<style>
	.bans-container {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.tri {
		display: grid;
		grid-template-columns: min-content 1fr min-content;

		gap: var(--section-gap);
	}

	.bans {
		display: flex;
		flex: 0 1 auto;
		flex-direction: row;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--section-gap);
	}

	.picks {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--section-gap);
	}

	.picks > div {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--section-gap);
	}

	.picks > div > h2 {
		width: auto;
		height: auto;
	}

	.picks div:nth-child(3) {
		margin-bottom: calc(2 * var(--section-gap));
	}

	.picker {
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
		filter: grayscale();

		cursor: pointer;
	}

	.picker .bar img.color {
		filter: none;
	} 

	.picker .bar img.selected, .picker .bar img:hover {
		filter: grayscale() brightness(200%);
	}

	.picker .bar .filter {
		display: flex;
		flex-direction: row;
		gap: 0.25rem;
	}

	.palette {
		display: grid;
		justify-items: center;
		/* TODO Determine if 6 or 7 columns looks best */
		grid-template-columns: repeat(7, minmax(min-content, 1fr));
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
</style>