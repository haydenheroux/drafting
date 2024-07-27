import { trigger } from '$lib/util/trigger';
import { storable } from '$lib/util/storable';
import { Filter } from '$lib/util/filter';

type ChampionID = string;

export enum Lane {
	Top = 'Top',
	Jungle = 'Jungle',
	Middle = 'Middle',
	Bottom = 'Bottom',
	Support = 'Support'
}

export const lanes = new Filter<Lane, ChampionID>('lanes');

export enum Color {
	Red = 'Red',
	Green = 'Green',
	Blue = 'Blue',
	White = 'White',
	Black = 'Black',
	Colorless = 'Colorless'
}

export const colors = new Filter<Color, ChampionID>('colors');

export enum Damage {
	Magic = 'Magic',
	Physical = 'Physical',
	CrowdControl = 'CC'
}

export const damages = new Filter<Damage, ChampionID>('damages');

export const hideContextMenus = trigger();

export interface Picks {
	red: Array<string | null>;
	blue: Array<string | null>;
}

export const picks = storable<Picks>('picks', { red: [], blue: [] } as Picks);
