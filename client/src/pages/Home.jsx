import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="app-container home-screen">
            <div className="title-graphic">
                {/* Placeholder for graphic */}
                <div className="goblet-icon">🏆</div>
            </div>
            <h1>Jerry's Goblet</h1>
            <p className="subtitle">The Ultimate Strategy Game</p>
            <p className="challenge-text">Think you have what it takes to beat Jerry? 🤔😈</p>

            <div className="menu-buttons">
                <button className="menu-btn primary" onClick={() => navigate('/lobby')}>Play Now</button>
                <button className="menu-btn secondary" onClick={() => navigate('/how-to-play')}>How to Play</button>
            </div>
        </div>
    );
};

export default Home;
