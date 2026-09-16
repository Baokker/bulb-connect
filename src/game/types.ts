import type { Direction } from './directions';

export type TileKind = 'power' | 'bulb' | 'straight' | 'corner' | 'tee' | 'cross';

export type Tile = {
  id: string;
  kind: TileKind;
  connections: Direction[];
  powered: boolean;
};

export type Board = Tile[][];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'hell';

export type DifficultyConfig = {
  label: string;
  rows: number;
  cols: number;
  bulbCount: number;
  /** 用时 ≤ 此值（秒）得 3 星 */
  starThreeSeconds: number;
  /** 用时 ≤ 此值（秒）得 2 星，否则 1 星 */
  starTwoSeconds: number;
};

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: '简单',
    rows: 5,
    cols: 5,
    bulbCount: 5,
    starThreeSeconds: 60,
    starTwoSeconds: 120,
  },
  medium: {
    label: '中等',
    rows: 6,
    cols: 6,
    bulbCount: 6,
    starThreeSeconds: 120,
    starTwoSeconds: 240,
  },
  hard: {
    label: '困难',
    rows: 7,
    cols: 7,
    bulbCount: 7,
    starThreeSeconds: 180,
    starTwoSeconds: 360,
  },
  hell: {
    label: '地狱',
    rows: 9,
    cols: 9,
    bulbCount: 9,
    starThreeSeconds: 300,
    starTwoSeconds: 600,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'hell'];

export function starsForTime(difficulty: Difficulty, seconds: number): 1 | 2 | 3 {
  const cfg = DIFFICULTIES[difficulty];
  if (seconds <= cfg.starThreeSeconds) return 3;
  if (seconds <= cfg.starTwoSeconds) return 2;
  return 1;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export type GameState = {
  board: Board;
  initialBoard: Board;
  /** 解状态棋盘（全连通、全通电），用于"显示答案" */
  solutionBoard: Board;
  won: boolean;
  difficulty: Difficulty;
  /** 是否已点击开始，未开始时禁止旋转 */
  started: boolean;
  /** 完成用时（秒），胜利时写入；查看答案则为 null */
  completedSeconds: number | null;
  /** 是否正在显示参考答案 */
  showingSolution: boolean;
};
