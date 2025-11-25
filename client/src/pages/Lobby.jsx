import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Lobby = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [waitingGames, setWaitingGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGames();
        // Poll for updates every 3 seconds
        const interval = setInterval(fetchGames, 3000);
        return () => clearInterval(interval);
    }, [user]);

    const fetchGames = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;

            // Fetch waiting games
            const waitingResponse = await fetch(`${backendUrl}/api/games/waiting`, {
                credentials: 'include'
            });
            if (waitingResponse.ok) {
                const games = await waitingResponse.json();
                setWaitingGames(games);
            }
        } catch (error) {
            console.error('Failed to fetch games:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGame = (gameId) => {
        // Clear any stored game ID to ensure we join the new one
        localStorage.removeItem('currentGameId');
        navigate('/color-preferences', { state: { gameId } });
    };

    const handleCreateGame = () => {
        // Clear any stored game ID to ensure we start a new one
        localStorage.removeItem('currentGameId');
        navigate('/color-preferences');
    };

    const COLOR_NAMES = {
        '#ffd700': 'Gold',
        '#c0c0c0': 'Silver',
        '#e91e63': 'Ruby',
        '#2196f3': 'Sapphire',
        '#4caf50': 'Emerald',
        '#9c27b0': 'Amethyst',
        '#ff9800': 'Amber',
        '#00bcd4': 'Turquoise',
        '#ff4081': 'Rose',
        '#3f51b5': 'Indigo',
        '#cddc39': 'Lime',
        '#00e5ff': 'Cyan',
        '#795548': 'Bronze',
        '#607d8b': 'Slate',
        '#dc143c': 'Crimson'
    };

    const getDisplayColor = (c) => {
        if (!c) return '';
        const name = COLOR_NAMES[c.toLowerCase()];
        if (name) return name;
        return c.charAt(0).toUpperCase() + c.slice(1);
    };

    return (
        <div className="app-container lobby-screen">
            <h1>Game Lobby</h1>
            <p className="lobby-subtitle">Join a waiting player or start a new game</p>

            {loading ? (
                <div className="loading-message">Loading games...</div>
            ) : (
                <>
                    {waitingGames.length > 0 && (
                        <div className="waiting-games-section">
                            <h2>Waiting Players</h2>
                            <div className="waiting-games-list">
                                {waitingGames.map(game => (
                                    <div key={game.id} className="waiting-game-card">
                                        <div className="waiting-player-info">
                                            <div className="waiting-player-avatar">
                                                {game.players[0].avatarUrl ? (
                                                    <img src={game.players[0].avatarUrl} alt="Avatar" />
                                                ) : (
                                                    <div className="avatar-placeholder">?</div>
                                                )}
                                            </div>
                                            <div className="waiting-player-details">
                                                <div className="waiting-player-name">
                                                    {game.players[0].displayName || 'Unknown Player'}
                                                </div>
                                                <div className="waiting-player-color">
                                                    <div
                                                        className="color-indicator"
                                                        style={{ backgroundColor: game.players[0].color }}
                                                    />
                                                    <span>Playing as {getDisplayColor(game.players[0].color)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="join-game-btn"
                                            onClick={() => handleJoinGame(game.id)}
                                        >
                                            Join Game
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="create-game-section">
                        <button className="create-game-btn" onClick={handleCreateGame}>
                            <span className="plus-icon">+</span>
                            Create New Game
                        </button>
                    </div>
                </>
            )}

            <button className="back-btn" onClick={() => navigate('/')}>Back to Home</button>
        </div>
    );
};

export default Lobby;
