import { describe, it, expect } from 'vitest';
import { computePowered, applyPowered, checkWin, findPower } from './power';
import type { Board, Tile, TileKind } from './types';
import type { Direction } from './directions';

function t(kind: TileKind, connections: Direction[], powered = false): Tile {
  return { id: 't', kind, connections, powered };
}

describe('findPower', () => {
  it('找到电源格位置', () => {
    const board: Board = [[t('power', ['E']), t('bulb', ['W'])]];
    expect(findPower(board)).toEqual({ row: 0, col: 0 });
  });

  it('没有电源时返回 null', () => {
    const board: Board = [[t('bulb', ['N'])]];
    expect(findPower(board)).toBeNull();
  });
});

describe('computePowered', () => {
  it('双向接口匹配时邻格通电', () => {
    const board: Board = [[t('power', ['E']), t('bulb', ['W'])]];
    expect(computePowered(board)).toEqual([[true, true]]);
  });

  it('仅单侧有接口时不通电', () => {
    const board: Board = [[t('power', ['E']), t('bulb', ['N'])]];
    expect(computePowered(board)).toEqual([[true, false]]);
  });

  it('不越出棋盘边界', () => {
    const board: Board = [[t('power', ['N', 'W'])]];
    expect(computePowered(board)).toEqual([[true]]);
  });

  it('能点亮多段路径', () => {
    const board: Board = [
      [t('power', ['E']), t('straight', ['E', 'W']), t('bulb', ['W'])],
    ];
    expect(computePowered(board)).toEqual([[true, true, true]]);
  });

  it('在不回连的格子处停止传播', () => {
    // 电源 E -> 中间格只有 N/S（没有 W 回连）-> 灯泡不通
    const board: Board = [
      [t('power', ['E']), t('straight', ['N', 'S']), t('bulb', ['W'])],
    ];
    expect(computePowered(board)).toEqual([[true, false, false]]);
  });

  it('电源可同时向两个方向点亮灯泡', () => {
    // 电源在中间，左灯泡需 E 接口，右灯泡需 W 接口
    const board: Board = [
      [t('bulb', ['E']), t('power', ['W', 'E']), t('bulb', ['W'])],
    ];
    expect(computePowered(board)).toEqual([[true, true, true]]);
  });
});

describe('applyPowered', () => {
  it('返回新棋盘并写入 powered 字段', () => {
    const board: Board = [[t('power', ['E']), t('bulb', ['W'])]];
    const result = applyPowered(board);
    expect(result[0][0].powered).toBe(true);
    expect(result[0][1].powered).toBe(true);
    // 原棋盘不被修改
    expect(board[0][1].powered).toBe(false);
  });
});

describe('checkWin', () => {
  it('所有灯泡通电时为胜利', () => {
    const board: Board = [
      [
        { ...t('power', ['E']), powered: true },
        { ...t('bulb', ['W']), powered: true },
      ],
    ];
    expect(checkWin(board)).toBe(true);
  });

  it('任一灯泡未通电时不胜利', () => {
    const board: Board = [
      [
        { ...t('power', ['E']), powered: true },
        { ...t('bulb', ['W']), powered: false },
      ],
    ];
    expect(checkWin(board)).toBe(false);
  });

  it('未通电的非灯泡格不阻止胜利', () => {
    const board: Board = [
      [
        { ...t('power', ['E']), powered: true },
        { ...t('bulb', ['W']), powered: true },
        { ...t('straight', ['N', 'S']), powered: false },
      ],
    ];
    expect(checkWin(board)).toBe(true);
  });
});
