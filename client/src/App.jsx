import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HowToPlay from './pages/HowToPlay';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/how-to-play" element={<HowToPlay />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/play" element={<GameRoom />} />
    </Routes>
  );
}

export default App;
