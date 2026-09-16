export type Direction = 'N' | 'E' | 'S' | 'W';

export const DIRECTIONS: Direction[] = ['N', 'E', 'S', 'W'];

export const OPPOSITE: Record<Direction, Direction> = {
  N: 'S',
  E: 'W',
  S: 'N',
  W: 'E',
};

const CLOCKWISE: Record<Direction, Direction> = {
  N: 'E',
  E: 'S',
  S: 'W',
  W: 'N',
};

export function opposite(d: Direction): Direction {
  return OPPOSITE[d];
}

export function rotateClockwise(d: Direction): Direction {
  return CLOCKWISE[d];
}

export function rotateConnectionsClockwise(connections: Direction[]): Direction[] {
  return connections.map(rotateClockwise);
}
