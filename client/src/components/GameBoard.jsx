import React from 'react';
import GoblinPiece from './GoblinPiece';

const GameBoard = ({ board, onCellClick, currentPlayer, turn, selectedCell }) => {
    return (
        <div className="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    {row.map((cell, colIndex) => {
                        const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;
                        const topPiece = cell.length > 0 ? cell[cell.length - 1] : null;
                        const isOpponentPiece = topPiece && topPiece.color !== currentPlayer;

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`board-cell ${isSelected ? 'selected' : ''} ${isOpponentPiece ? 'opponent-piece' : ''}`}
                                onClick={() => onCellClick(rowIndex, colIndex)}
                            >
                                {cell.length > 0 && (
                                    <div className={`piece piece-${cell[cell.length - 1].color} piece-size-${cell[cell.length - 1].size}`}>
                                        <GoblinPiece
                                            color={cell[cell.length - 1].color}
                                            size={cell[cell.length - 1].size}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
