import type { Direction } from './directions';

export type TileKind = 'power' | 'bulb' | 'straight' | 'corner' | 'tee' | 'cross';

export type Tile = {
  id: string;
  kind: TileKind;
  connections: Direction[];
  powered: boolean;
};

export type Board = Tile[][];

export type GameState = {
  board: Board;
  initialBoard: Board;
  won: boolean;
};

export const ROWS = 5;
export const COLS = 5;
export const BULB_COUNT = 5;
