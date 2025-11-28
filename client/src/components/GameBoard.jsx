import React from 'react';
import GoblinPiece from './GoblinPiece';

const GameBoard = ({ board, onCellClick, currentPlayer, turn, selectedCell, lastMove, winningLine }) => {
    // Calculate arrow position and rotation for board-to-board moves
    const renderMoveArrow = () => {
        if (!lastMove || lastMove.type !== 'move') return null;

        const { fromRow, fromCol, toRow, toCol } = lastMove;
        const cellSize = 100 / 4; // Each cell is 25% of board

        // Calculate center positions (in percentage)
        const fromX = (fromCol + 0.5) * cellSize;
        const fromY = (fromRow + 0.5) * cellSize;
        const toX = (toCol + 0.5) * cellSize;
        const toY = (toRow + 0.5) * cellSize;

        // Calculate angle
        const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

        // Calculate distance
        const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));

        return (
            <svg className="move-arrow-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5
            }}>
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3, 0 6" fill="#ffd700" />
                    </marker>
                </defs>
                <line
                    x1={`${fromX}%`}
                    y1={`${fromY}%`}
                    x2={`${toX}%`}
                    y2={`${toY}%`}
                    stroke="#ffd700"
                    strokeWidth="3"
                    markerEnd="url(#arrowhead)"
                    opacity="0.8"
                />
            </svg>
        );
    };

    return (
        <div className="game-board" style={{ position: 'relative' }}>
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    {row.map((cell, colIndex) => {
                        const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;
                        const topPiece = cell.length > 0 ? cell[cell.length - 1] : null;
                        const isOpponentPiece = topPiece && topPiece.color !== currentPlayer;
                        const isLastMove = lastMove && lastMove.toRow === rowIndex && lastMove.toCol === colIndex;
                        const winningCellIndex = winningLine ? winningLine.findIndex(cell => cell.r === rowIndex && cell.c === colIndex) : -1;
                        const isWinningCell = winningCellIndex !== -1;

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`board-cell ${isSelected ? 'selected' : ''} ${isOpponentPiece ? 'opponent-piece' : ''} ${isLastMove ? 'last-move' : ''} ${isWinningCell ? `winning-cell winning-cell-${winningCellIndex}` : ''}`}
                                onClick={() => onCellClick(rowIndex, colIndex)}
                            >
                                {cell.length > 0 && (
                                    <div className={`piece piece-${cell[cell.length - 1].color} piece-size-${cell[cell.length - 1].size}`} data-color={cell[cell.length - 1].color}>
                                        <GoblinPiece
                                            color={cell[cell.length - 1].color}
                                            size={cell[cell.length - 1].size}
                                            isWinning={isWinningCell}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
            {renderMoveArrow()}
        </div>
    );
};

export default GameBoard;
