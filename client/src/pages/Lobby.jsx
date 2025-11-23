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
];

const Lobby = () => {
    const navigate = useNavigate();
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleJoin = () => {
        navigate('/play', { state: { color: selectedColor.id } });
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
