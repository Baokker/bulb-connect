import type { Difficulty } from '../game/types';
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  formatTime,
  starsForTime,
} from '../game/types';

type Props = {
  difficulty: Difficulty;
  started: boolean;
  won: boolean;
  showingSolution: boolean;
  elapsedSeconds: number;
  onDifficultyChange: (d: Difficulty) => void;
  onStart: () => void;
  onNewGame: () => void;
  onResetRequest: () => void;
  onShowSolutionRequest: () => void;
};

export function GameControls({
  difficulty,
  started,
  won,
  showingSolution,
  elapsedSeconds,
  onDifficultyChange,
  onStart,
  onNewGame,
  onResetRequest,
  onShowSolutionRequest,
}: Props) {
  return (
    <div className="controls-panel">
      {/* 难度选择 */}
      <div className="difficulty-row" role="group" aria-label="难度选择">
        {DIFFICULTY_ORDER.map((d) => (
          <button
            key={d}
            type="button"
            className={`difficulty-btn ${d === difficulty ? 'active' : ''}`}
            onClick={() => onDifficultyChange(d)}
            aria-pressed={d === difficulty}
          >
            {DIFFICULTIES[d].label}
          </button>
        ))}
      </div>

      {/* 计时器与开始按钮 */}
      <div className="timer-row">
        <div className="timer-display" aria-live="polite" aria-label="已用时间">
          ⏱ {formatTime(elapsedSeconds)}
        </div>
        {!started && !won && (
          <button
            type="button"
            className="start-btn"
            onClick={onStart}
          >
            开始游戏
          </button>
        )}
        {started && !won && (
          <div className="stars-block">
            <div
              className="live-stars"
              aria-label={`当前预计 ${starsForTime(difficulty, elapsedSeconds)} 星`}
            >
              <span className="star-bright">
                {'★'.repeat(starsForTime(difficulty, elapsedSeconds))}
              </span>
              <span className="star-dim">
                {'★'.repeat(3 - starsForTime(difficulty, elapsedSeconds))}
              </span>
            </div>
            {(() => {
              const cfg = DIFFICULTIES[difficulty];
              if (elapsedSeconds < cfg.starThreeSeconds) {
                return (
                  <div className="star-countdown">
                    距 2★ 还剩 {formatTime(cfg.starThreeSeconds - elapsedSeconds)}
                  </div>
                );
              }
              if (elapsedSeconds < cfg.starTwoSeconds) {
                return (
                  <div className="star-countdown">
                    距 1★ 还剩 {formatTime(cfg.starTwoSeconds - elapsedSeconds)}
                  </div>
                );
              }
              return <div className="star-countdown star-timeout">已超时，当前 1★</div>;
            })()}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="controls">
        <button type="button" onClick={onNewGame}>
          新游戏
        </button>
        <button
          type="button"
          onClick={onResetRequest}
          disabled={!started && !won}
        >
          重置
        </button>
        <button
          type="button"
          className="solution-btn"
          onClick={onShowSolutionRequest}
          disabled={won || showingSolution}
        >
          显示答案
        </button>
      </div>
    </div>
  );
}
