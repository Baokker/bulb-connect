import type { GameState, Difficulty } from './types';
import { applyPowered, checkWin } from './power';
import { generateGame, type RandomFn } from './generator';
import { rotateConnectionsClockwise } from './directions';

export type Action =
  | { type: 'ROTATE'; row: number; col: number }
  | { type: 'RESET' }
  | { type: 'NEW_GAME'; difficulty?: Difficulty; rng?: RandomFn }
  | { type: 'START' }
  | { type: 'COMPLETE'; seconds: number }
  | { type: 'SHOW_SOLUTION' };

function deepCopyBoard(board: GameState['board']): GameState['board'] {
  return board.map((row) =>
    row.map((t) => ({ ...t, connections: [...t.connections] })),
  );
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ROTATE': {
      // 未开始或已胜利/显示答案时，禁止旋转
      if (!state.started || state.won) return state;
      const { row, col } = action;
      const tile = state.board[row][col];
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
      const resetBoard = applyPowered(deepCopyBoard(state.initialBoard));
      return {
        ...state,
        board: resetBoard,
        won: false,
        started: false,
        completedSeconds: null,
        showingSolution: false,
      };
    }

    case 'NEW_GAME': {
      return generateGame(action.rng, action.difficulty ?? state.difficulty);
    }

    case 'START': {
      if (state.started || state.won) return state;
      return { ...state, started: true };
    }

    case 'COMPLETE': {
      if (!state.won || state.showingSolution) return state;
      return { ...state, completedSeconds: action.seconds };
    }

    case 'SHOW_SOLUTION': {
      if (state.showingSolution) return state;
      return {
        ...state,
        board: deepCopyBoard(state.solutionBoard),
        won: true,
        started: false,
        completedSeconds: null,
        showingSolution: true,
      };
    }
  }
}
