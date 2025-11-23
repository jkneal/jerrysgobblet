import React from 'react';

const GameBoard = ({ board, onCellClick, currentPlayer, turn, selectedCell }) => {
    return (
        <div className="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    {row.map((cell, colIndex) => {
                        const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;
                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`board-cell ${isSelected ? 'selected' : ''}`}
                                onClick={() => onCellClick(rowIndex, colIndex)}
                            >
                                {cell.length > 0 && (
                                    <div className={`piece piece-${cell[cell.length - 1].color} piece-size-${cell[cell.length - 1].size}`}>
                                        {/* Visual representation of the piece */}
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
