import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const COLORS = [
    { id: 'gold', name: 'Gold', hex: '#ffd700' },
    { id: 'silver', name: 'Silver', hex: '#c0c0c0' },
    { id: 'red', name: 'Ruby', hex: '#e91e63' },
    { id: 'blue', name: 'Sapphire', hex: '#2196f3' },
    { id: 'green', name: 'Emerald', hex: '#4caf50' },
    { id: 'purple', name: 'Amethyst', hex: '#9c27b0' },
    { id: 'orange', name: 'Amber', hex: '#ff9800' },
    { id: 'teal', name: 'Turquoise', hex: '#00bcd4' },
    { id: 'pink', name: 'Rose', hex: '#ff4081' },
    { id: 'indigo', name: 'Indigo', hex: '#3f51b5' },
    { id: 'lime', name: 'Lime', hex: '#cddc39' },
    { id: 'cyan', name: 'Cyan', hex: '#00e5ff' },
    { id: 'brown', name: 'Bronze', hex: '#795548' },
    { id: 'slate', name: 'Slate', hex: '#607d8b' },
    { id: 'crimson', name: 'Crimson', hex: '#dc143c' },
];

const ColorPreferences = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const gameId = location.state?.gameId; // If joining a specific game
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [takenColor, setTakenColor] = useState(null);
    const [loading, setLoading] = useState(!!gameId);

    useEffect(() => {
        // If joining a specific game, fetch the game info to see which color is taken
        if (gameId) {
            fetchGameInfo();
        }
    }, [gameId]);

    const fetchGameInfo = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
            const response = await fetch(`${backendUrl}/api/games/${gameId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const game = await response.json();
                if (game.players && game.players.length > 0) {
                    const takenColorHex = game.players[0].color;
                    setTakenColor(takenColorHex);
                    // Auto-select a different color
                    const availableColor = COLORS.find(c => c.hex !== takenColorHex);
                    if (availableColor) {
                        setSelectedColor(availableColor);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch game info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        // Pass the hex value and optional gameId
        // Use replace: true to remove ColorPreferences from history
        // so back button from game goes to lobby
        navigate('/play', {
            state: {
                color: selectedColor.hex,
                gameId,
                // Pass privacy options from previous screen
                isPublic: location.state?.isPublic,
                requestJoinCode: location.state?.requestJoinCode
            },
            replace: true
        });
    };

    const isColorDisabled = (colorHex) => {
        return takenColor && takenColor === colorHex;
    };

    if (loading) {
        return (
            <div className="app-container lobby-screen">
                <h1>Choose Your Color</h1>
                <p>Loading game info...</p>
            </div>
        );
    }

    return (
        <div className="app-container lobby-screen">
            <h1>Choose Your Color</h1>
            {takenColor && (
                <p className="color-info">One color is already taken by your opponent</p>
            )}

            <div className="color-grid">
                {COLORS.map(color => {
                    const disabled = isColorDisabled(color.hex);
                    return (
                        <div
                            key={color.id}
                            className={`color-option ${selectedColor.id === color.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            style={{ backgroundColor: color.hex }}
                            onClick={() => !disabled && setSelectedColor(color)}
                        >
                            {selectedColor.id === color.id && <span className="check-mark">✓</span>}
                            {disabled && <span className="taken-mark">✗</span>}
                            <span className="color-name">{color.name}</span>
                        </div>
                    );
                })}
            </div>

            <button className="join-btn" onClick={handleContinue}>Continue to Game</button>
            <button className="back-btn" onClick={() => navigate('/lobby')}>Back to Lobby</button>
        </div>
    );
};

export default ColorPreferences;
