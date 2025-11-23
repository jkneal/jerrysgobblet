import React from 'react';
import GoblinPiece from './GoblinPiece';

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

const PlayerHand = ({ hand, color, onPieceClick, selectedStackIndex, isCurrentPlayer, isMyTurn = true }) => {
    const getColorName = (hex) => {
        if (!hex) return '';
        // Check if it's a known hex code
        const name = COLOR_NAMES[hex.toLowerCase()];
        if (name) return name;
        // Fallback for named colors or unknown hexes
        return hex.charAt(0).toUpperCase() + hex.slice(1);
    };

    const displayColor = getColorName(color);
    const handTitle = isCurrentPlayer ? 'Your Hand' : `${displayColor}'s Hand`;
    const isDisabled = isCurrentPlayer && !isMyTurn;

    return (
        <div className={`player-hand ${color} ${isCurrentPlayer ? 'current-player' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="hand-header">
                <h3>{handTitle}</h3>
            </div>
            <div className="hand-stacks">
                {hand.map((stack, index) => (
                    <div
                        key={index}
                        className={`hand-stack-container ${selectedStackIndex === index ? 'selected' : ''}`}
                    >
                        {/* Main piece display - shows the top (available) piece */}
                        <div
                            className="hand-stack-main"
                            onClick={() => isCurrentPlayer && stack.length > 0 && onPieceClick(index)}
                        >
                            {stack.length > 0 ? (
                                <div className={`piece piece-${color} piece-size-${stack[stack.length - 1]}`}>
                                    <GoblinPiece
                                        color={color}
                                        size={stack[stack.length - 1]}
                                    />
                                </div>
                            ) : (
                                <div className="empty-stack-placeholder" />
                            )}
                        </div>

                        {/* Small panel showing remaining pieces */}
                        <div className="hand-stack-remaining">
                            {stack.slice(0, -1).reverse().map((size, pieceIndex) => (
                                <div
                                    key={pieceIndex}
                                    className="remaining-piece"
                                    style={{
                                        width: `${20 + size * 2}px`,
                                        height: `${20 + size * 2}px`,
                                    }}
                                >
                                    <GoblinPiece color={color} size={size} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerHand;
