type Props = {
  onNewGame: () => void;
  onReset: () => void;
};

export function GameControls({ onNewGame, onReset }: Props) {
  return (
    <div className="controls">
      <button type="button" onClick={onNewGame}>
        新游戏
      </button>
      <button type="button" onClick={onReset}>
        重置
      </button>
    </div>
  );
}
