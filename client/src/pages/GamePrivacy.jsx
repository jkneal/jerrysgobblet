import React from 'react';
import { useNavigate } from 'react-router-dom';

const GamePrivacy = () => {
    const navigate = useNavigate();

    const handleSelection = (isPublic) => {
        // Navigate to color preferences with privacy setting
        // isPublic=true -> "Anyone can join"
        // isPublic=false -> "Create join code" (requestJoinCode=true)
        navigate('/color-preferences', {
            state: {
                isPublic,
                requestJoinCode: !isPublic
            },
            replace: true // Don't keep privacy screen in history
        });
    };

    return (
        <div className="app-container lobby-screen">
            <h1>Game Privacy</h1>
            <p className="lobby-subtitle">Who can join your game?</p>

            <div className="privacy-options">
                <button
                    className="menu-btn primary privacy-btn"
                    onClick={() => handleSelection(true)}
                >
                    <div className="btn-content">
                        <span className="btn-title">Anyone can join</span>
                        <span className="btn-desc">Game will appear in the lobby for anyone to join</span>
                    </div>
                </button>

                <button
                    className="menu-btn secondary privacy-btn"
                    onClick={() => handleSelection(false)}
                >
                    <div className="btn-content">
                        <span className="btn-title">Create join code</span>
                        <span className="btn-desc">Private game. Players need a 3-digit code to join</span>
                    </div>
                </button>
            </div>

            <button className="back-btn" onClick={() => navigate('/lobby')}>Back to Lobby</button>
        </div>
    );
};

export default GamePrivacy;
