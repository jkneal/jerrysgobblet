import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="app-container home-screen">
            <div className="title-graphic">
                <img src="/goblet1.png" alt="Jerry the Goblin" className="goblet-icon" />
            </div>
            <h1 style={{ "marginTop": "-.5rem" }}>Jerry's Gobblet</h1>
            <div className="challenge-text">Think you have what it takes to beat Jerry? 🤔</div>
            <div className="subtitle">The Ultimate Strategy Game</div>

            <div className="menu-buttons">
                <button className="menu-btn primary" onClick={() => navigate('/lobby')}>Play Now</button>
                <button className="menu-btn secondary" onClick={() => navigate('/how-to-play')}>How to Play</button>
            </div>
        </div>
    );
};

export default Home;
