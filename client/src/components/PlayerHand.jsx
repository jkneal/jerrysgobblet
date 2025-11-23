import React from 'react';
import GoblinPiece from './GoblinPiece';

const PlayerHand = ({ hand, color, onPieceClick, selectedStackIndex, isCurrentPlayer, isMyTurn = true }) => {
    const displayColor = color ? color.charAt(0).toUpperCase() + color.slice(1) : '';
    const handTitle = isCurrentPlayer ? 'Your Hand' : `${displayColor}'s Hand`;
    const isDisabled = isCurrentPlayer && !isMyTurn;

    return (
        <div className={`player-hand ${color} ${isCurrentPlayer ? 'current-player' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <h3>{handTitle}</h3>
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
                                        width: `${28 + size * 3}px`,
                                        height: `${28 + size * 3}px`,
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
