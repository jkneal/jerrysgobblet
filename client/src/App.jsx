import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import HowToPlay from './pages/HowToPlay';
import Lobby from './pages/Lobby';
import ColorPreferences from './pages/ColorPreferences';
import GameRoom from './pages/GameRoom';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/color-preferences" element={<ColorPreferences />} />
        <Route path="/play" element={<GameRoom />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
