import React from 'react';

const PlayerHand = ({ hand, color, onPieceClick, selectedStackIndex, isCurrentPlayer }) => {
    const displayColor = color ? color.charAt(0).toUpperCase() + color.slice(1) : '';
    return (
        <div className={`player-hand ${color}`}>
            <h3>{displayColor}'s Hand</h3>
            <div className="hand-stacks">
                {hand.map((stack, index) => (
                    <div
                        key={index}
                        className={`hand-stack ${selectedStackIndex === index ? 'selected' : ''}`}
                        onClick={() => isCurrentPlayer && stack.length > 0 && onPieceClick(index)}
                    >
                        {stack.length > 0 ? (
                            <div className={`piece piece-${color} piece-size-${stack[stack.length - 1]}`}>
                                {/* Visual representation */}
                            </div>
                        ) : (
                            <div className="empty-stack-placeholder" />
                        )}
                        <div className="stack-count">{stack.length}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerHand;
