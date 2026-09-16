import type { Tile as TileType, TileKind } from '../game/types';
import type { Direction } from '../game/directions';

const EDGE_POINTS: Record<Direction, { x: number; y: number }> = {
  N: { x: 50, y: 0 },
  E: { x: 100, y: 50 },
  S: { x: 50, y: 100 },
  W: { x: 0, y: 50 },
};

const KIND_LABELS: Record<TileKind, string> = {
  power: '电源',
  bulb: '灯泡',
  straight: '直线',
  corner: '弯线',
  tee: 'T形',
  cross: '十字形',
};

type Props = {
  tile: TileType;
  row: number;
  col: number;
  onRotate: () => void;
};

export function Tile({ tile, row, col, onRotate }: Props) {
  const isPower = tile.kind === 'power';
  const wireColor = tile.powered ? '#fbbf24' : '#4b5563';
  const label = `第 ${row + 1} 行第 ${col + 1} 列，${KIND_LABELS[tile.kind]}，${
    tile.powered ? '已通电' : '未通电'
  }`;

  const svg = (
    <svg viewBox="0 0 100 100" className="tile-svg" aria-hidden="true">
      {tile.connections.map((dir) => {
        const p = EDGE_POINTS[dir];
        return (
          <line
            key={dir}
            x1={50}
            y1={50}
            x2={p.x}
            y2={p.y}
            stroke={wireColor}
            strokeWidth={16}
            strokeLinecap="round"
          />
        );
      })}
      {tile.kind === 'bulb' && (
        <circle
          cx={50}
          cy={50}
          r={18}
          fill={tile.powered ? '#fde047' : '#374151'}
          stroke={wireColor}
          strokeWidth={3}
        />
      )}
      {tile.kind === 'power' && (
        <polygon
          points="50,28 64,50 55,50 60,72 38,50 47,50"
          fill={tile.powered ? '#fde047' : '#93c5fd'}
        />
      )}
    </svg>
  );

  if (isPower) {
    return (
      <div className="tile power-tile" role="img" aria-label={label}>
        {svg}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="tile"
      aria-label={label}
      onClick={onRotate}
    >
      {svg}
    </button>
  );
}
