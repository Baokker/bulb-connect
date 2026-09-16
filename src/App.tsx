import { useReducer } from 'react';
import { gameReducer } from './game/gameReducer';
import { generateGame } from './game/generator';
import { Board } from './components/Board';
import { GameControls } from './components/GameControls';
import './App.css';

function init() {
  return generateGame();
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);

  return (
    <div className="app">
      <h1>连灯泡</h1>
      <p className="subtitle">旋转线材和灯泡，让电源点亮所有灯泡</p>
      {state.won && (
        <div className="win-banner" role="alert">
          胜利！所有灯泡已点亮
        </div>
      )}
      <Board
        board={state.board}
        onRotate={(r, c) => dispatch({ type: 'ROTATE', row: r, col: c })}
      />
      <GameControls
        onNewGame={() => dispatch({ type: 'NEW_GAME' })}
        onReset={() => dispatch({ type: 'RESET' })}
      />
    </div>
  );
}
