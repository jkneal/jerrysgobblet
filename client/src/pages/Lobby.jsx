import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const Lobby = () => {
    const navigate = useNavigate();
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleJoin = () => {
        // Pass the hex value so GoblinPiece can render any color correctly
        // (e.g. 'bronze' is not a valid CSS color, but the hex is)
        navigate('/play', { state: { color: selectedColor.hex } });
    };

    return (
        <div className="app-container lobby-screen">
            <h1>Choose Your Color</h1>

            <div className="color-grid">
                {COLORS.map(color => (
                    <div
                        key={color.id}
                        className={`color-option ${selectedColor.id === color.id ? 'selected' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => setSelectedColor(color)}
                    >
                        {selectedColor.id === color.id && <span className="check-mark">✓</span>}
                        <span className="color-name">{color.name}</span>
                    </div>
                ))}
            </div>

            <button className="join-btn" onClick={handleJoin}>Join Game</button>
            <button className="back-btn" onClick={() => navigate('/')}>Back</button>
        </div>
    );
};

export default Lobby;
