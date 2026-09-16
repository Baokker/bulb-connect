import type { GameState } from './types';
import { applyPowered, checkWin } from './power';
import { generateGame, type RandomFn } from './generator';
import { rotateConnectionsClockwise } from './directions';

export type Action =
  | { type: 'ROTATE'; row: number; col: number }
  | { type: 'RESET' }
  | { type: 'NEW_GAME'; rng?: RandomFn };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ROTATE': {
      const { row, col } = action;
      const tile = state.board[row][col];
      // 电源不可旋转；十字形旋转后接口不变，直接跳过
      if (tile.kind === 'power' || tile.kind === 'cross') return state;

      const newBoard = state.board.map((r, ri) =>
        r.map((t, ci) => {
          if (ri === row && ci === col) {
            return {
              ...t,
              connections: rotateConnectionsClockwise(t.connections),
            };
          }
          return t;
        }),
      );
      const powered = applyPowered(newBoard);
      return { ...state, board: powered, won: checkWin(powered) };
    }

    case 'RESET': {
      const resetBoard = state.initialBoard.map((row) =>
        row.map((t) => ({ ...t, connections: [...t.connections] })),
      );
      const powered = applyPowered(resetBoard);
      return { ...state, board: powered, won: checkWin(powered) };
    }

    case 'NEW_GAME': {
      return generateGame(action.rng);
    }
  }
}
