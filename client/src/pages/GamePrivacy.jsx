import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GamePrivacy = () => {
    const navigate = useNavigate();
    const [boardSize, setBoardSize] = useState(4); // Default to 4x4

    const handleSelection = (isPublic) => {
        // Navigate to color preferences with privacy setting and board size
        // isPublic=true -> "Anyone can join"
        // isPublic=false -> "Create join code" (requestJoinCode=true)
        navigate('/color-preferences', {
            state: {
                isPublic,
                requestJoinCode: !isPublic,
                boardSize
            },
            replace: true // Don't keep privacy screen in history
        });
    };

    return (
        <div className="app-container lobby-screen">
            <h1>Create New Game</h1>

            {/* Board Size Selection */}
            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Board Size</h2>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        className={`menu-btn ${boardSize === 4 ? 'primary' : 'secondary'}`}
                        onClick={() => setBoardSize(4)}
                        style={{ minWidth: '150px' }}
                    >
                        4x4 Board
                    </button>
                    <button
                        className={`menu-btn ${boardSize === 3 ? 'primary' : 'secondary'}`}
                        onClick={() => setBoardSize(3)}
                        style={{ minWidth: '150px' }}
                    >
                        3x3 Board
                    </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                    {boardSize === 4 ? '4 sizes, get 4 in a row to win' : '3 sizes, get 3 in a row to win'}
                </p>
            </section>

            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Privacy</h2>
            <div className="lobby-subtitle" style={{ marginBottom: '0.5rem' }}>Who can join your game?</div>

            <div className="privacy-options">
                <button
                    className="menu-btn secondary privacy-btn"
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
