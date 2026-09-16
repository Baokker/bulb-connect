import type { Board as BoardType } from '../game/types';
import { Tile } from './Tile';

type Props = {
  board: BoardType;
  disabled?: boolean;
  onRotate: (row: number, col: number) => void;
};

export function Board({ board, disabled, onRotate }: Props) {
  return (
    <div className="board" role="grid" aria-label="游戏棋盘">
      {board.map((row, r) => (
        <div key={r} className="board-row" role="row">
          {row.map((tile, c) => (
            <Tile
              key={tile.id}
              tile={tile}
              row={r}
              col={c}
              disabled={disabled}
              onRotate={() => onRotate(r, c)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
