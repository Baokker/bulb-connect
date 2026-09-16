import { useEffect, useReducer, useRef, useState } from 'react';
import { gameReducer } from './game/gameReducer';
import { generateGame } from './game/generator';
import type { Difficulty } from './game/types';
import { starsForTime, formatTime, DIFFICULTIES } from './game/types';
import { Board } from './components/Board';
import { GameControls } from './components/GameControls';
import { ConfirmDialog } from './components/ConfirmDialog';
import './App.css';

function init() {
  return generateGame();
}

type DialogType = 'reset' | 'solution' | null;

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);
  const [elapsed, setElapsed] = useState(0);
  const [dialog, setDialog] = useState<DialogType>(null);

  // 计时器：开始后每秒 +1，胜利后停止
  useEffect(() => {
    if (!state.started || state.won) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [state.started, state.won]);

  // 检测胜利跃迁，记录完成时间（仅当尚未记录时）
  const prevWon = useRef(false);
  useEffect(() => {
    if (
      state.won &&
      !prevWon.current &&
      !state.showingSolution &&
      state.completedSeconds === null
    ) {
      dispatch({ type: 'COMPLETE', seconds: elapsed });
    }
    prevWon.current = state.won;
  }, [state.won, state.showingSolution, state.completedSeconds, elapsed]);

  const handleDifficultyChange = (d: Difficulty) => {
    if (d === state.difficulty) return;
    setElapsed(0);
    setDialog(null);
    dispatch({ type: 'NEW_GAME', difficulty: d });
  };

  const handleStart = () => {
    setElapsed(0);
    dispatch({ type: 'START' });
  };

  const handleNewGame = () => {
    setElapsed(0);
    setDialog(null);
    dispatch({ type: 'NEW_GAME' });
  };

  const handleResetConfirm = () => {
    setElapsed(0);
    setDialog(null);
    dispatch({ type: 'RESET' });
  };

  const handleShowSolutionConfirm = () => {
    setDialog(null);
    dispatch({ type: 'SHOW_SOLUTION' });
  };

  const stars =
    state.completedSeconds !== null
      ? starsForTime(state.difficulty, state.completedSeconds)
      : null;

  return (
    <div className="app">
      <h1>连灯泡</h1>
      <p className="subtitle">旋转线材和灯泡，让电源点亮所有灯泡</p>

      {/* 胜利 / 答案提示 */}
      {state.won && !state.showingSolution && state.completedSeconds !== null && (
        <div className="win-banner" role="alert">
          <div className="win-title">胜利！</div>
          <div className="win-stars">
            <span className="star-bright">{'★'.repeat(stars ?? 1)}</span>
            <span className="star-dim">{'★'.repeat(3 - (stars ?? 1))}</span>
          </div>
          <div className="win-time">
            用时 {formatTime(state.completedSeconds)} · {DIFFICULTIES[state.difficulty].label}
          </div>
        </div>
      )}
      {state.showingSolution && (
        <div className="win-banner solution-banner" role="alert">
          <div className="win-title">参考答案</div>
          <div className="win-time">已展示正确连接方式（不计星级）</div>
        </div>
      )}

      {/* 未开始提示 */}
      {!state.started && !state.won && (
        <div className="start-hint">点击「开始游戏」后计时并启用旋转</div>
      )}

      <Board
        board={state.board}
        disabled={!state.started}
        onRotate={(r, c) => dispatch({ type: 'ROTATE', row: r, col: c })}
      />

      <GameControls
        difficulty={state.difficulty}
        started={state.started}
        won={state.won}
        showingSolution={state.showingSolution}
        elapsedSeconds={elapsed}
        onDifficultyChange={handleDifficultyChange}
        onStart={handleStart}
        onNewGame={handleNewGame}
        onResetRequest={() => setDialog('reset')}
        onShowSolutionRequest={() => setDialog('solution')}
      />

      {/* 重置确认 */}
      <ConfirmDialog
        open={dialog === 'reset'}
        title="确认重置？"
        message="将恢复本局初始布局并清空计时，当前进度会丢失。"
        confirmText="确认重置"
        onConfirm={handleResetConfirm}
        onCancel={() => setDialog(null)}
      />

      {/* 显示答案确认 */}
      <ConfirmDialog
        open={dialog === 'solution'}
        title="查看参考答案？"
        message="查看答案后本局将直接展示正确连接，不计入星级评定。"
        confirmText="查看答案"
        onConfirm={handleShowSolutionConfirm}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
