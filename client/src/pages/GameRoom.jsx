import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import PlayerHand from '../components/PlayerHand';

// We'll manage the socket connection at the top level or singleton if needed, 
// but for now, let's keep it simple. If we navigate away, we might disconnect.
// Ideally, the socket should be passed down or managed in a context.
// For this refactor, I'll move the socket logic here, but we need to handle the connection passing.
// Actually, let's keep the socket in a separate module or pass it as a prop if we want it persistent.
// But for "Join Game" flow, we might want a fresh connection or just emit events.

// Let's create a socket singleton for simplicity in this file for now, 
// or better, pass it from App or a Context. 
// Given the scope, I'll instantiate it here, but we need to handle the "color" prop.

let socket;

const GameRoom = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { color } = location.state || {}; // Get chosen color from Lobby

    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [selection, setSelection] = useState(null);
    const [viewingBoard, setViewingBoard] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        // Use environment variable for backend URL, fallback to localhost for development
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        socket = io(backendUrl, {
            transports: ['websocket'],
        });

        function onConnect() {
            console.log('Connected with ID:', socket.id);
            setIsConnected(true);
            setPlayerId(socket.id);
            // Join game with selected color
            socket.emit('join_game', { color });
        }

        function onDisconnect() {
            console.log('Disconnected');
            setIsConnected(false);
        }

        function onGameUpdate(state) {
            console.log('Game update:', state);
            setGameState(state);
            setSelection(null);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('game_update', onGameUpdate);

        return () => {
            socket.disconnect();
        };
    }, [color]);

    useEffect(() => {
        // Reset viewing board state when game restarts
        if (gameState && (gameState.state === 'playing' || gameState.state === 'waiting')) {
            setViewingBoard(false);
        }
    }, [gameState?.state]);

    const handleHandPieceClick = (stackIndex) => {
        if (!gameState || gameState.winner) return;
        const playerColor = gameState.players.find(p => p.id === playerId)?.color;
        if (gameState.turn !== playerId) return;

        // Select piece from hand
        if (selection && selection.type === 'hand' && selection.stackIndex === stackIndex) {
            setSelection(null); // Deselect if already selected
        } else {
            setSelection({ type: 'hand', stackIndex });
        }
    };

    const handleBoardCellClick = (row, col) => {
        if (!gameState) return;
        // If game is over, don't allow interaction unless we want to allow viewing
        // But for now, disable moves if winner exists
        if (gameState.winner) return;

        const playerColor = gameState.players.find(p => p.id === playerId)?.color;
        if (gameState.turn !== playerId) return;

        if (selection && selection.type === 'hand') {
            // Place piece
            socket.emit('place_piece', {
                stackIndex: selection.stackIndex,
                row,
                col
            });
            setSelection(null);
        } else if (selection && selection.type === 'board') {
            // Move piece
            if (selection.row === row && selection.col === col) {
                setSelection(null); // Deselect if clicking same cell
                return;
            }
            socket.emit('move_piece', {
                fromRow: selection.row,
                fromCol: selection.col,
                toRow: row,
                toCol: col
            });
            setSelection(null);
        } else {
            // Select piece on board to move
            // Validate: must be my piece
            const stack = gameState.board[row][col];
            if (stack.length > 0) {
                const topPiece = stack[stack.length - 1];
                if (topPiece.color === playerColor) {
                    setSelection({ type: 'board', row, col });
                }
            }
        }
    };

    const handlePlayAgain = () => {
        socket.emit('reset_game');
    };

    if (!gameState) {
        return (
            <div className="app-container">
                <h1>Jerry's Goblet</h1>
                <h3 className="waiting-message">Connecting to game...</h3>
            </div>
        );
    }

    const playerColor = gameState.players.find(p => p.id === playerId)?.color;
    const opponentColor = playerColor === 'white' ? 'black' : 'white'; // Fallback if 2 players not yet joined
    // Actually, we should get opponent color from game state players list if available
    const opponent = gameState.players.find(p => p.id !== playerId);
    const actualOpponentColor = opponent ? opponent.color : (playerColor === 'white' ? 'black' : 'white');

    const isMyTurn = gameState.turn === playerId;
    const turnPlayer = gameState.players.find(p => p.id === gameState.turn);
    const turnColor = turnPlayer ? turnPlayer.color : '';

    console.log('Turn Debug:', {
        turnId: gameState.turn,
        myId: playerId,
        players: gameState.players,
        turnPlayer,
        turnColor
    });

    const getDisplayColor = (c) => {
        if (!c) return '';
        // Map internal colors to display names if needed, or just capitalize
        // If we support custom colors, we might just use them directly
        return c.charAt(0).toUpperCase() + c.slice(1);
    };

    // Generate status message
    const getStatusMessage = () => {
        if (gameState.state === 'waiting') {
            return 'Waiting for opponent to join...';
        }
        if (gameState.winner) {
            if (gameState.winner === playerColor) {
                return 'You win!';
            } else {
                return `${getDisplayColor(gameState.winner)} wins!`;
            }
        }
        if (isMyTurn) {
            return 'Your turn';
        } else {
            return `${getDisplayColor(turnColor)}'s turn`;
        }
    };

    return (
        <div className="app-container">
            <div className="page-header">
                <img src="/goblet1.png" alt="Jerry the Goblin" className="header-icon" />
                <h1>Jerry's Gobblet</h1>
            </div>

            {!viewingBoard && <h3 className="game-status-message">{getStatusMessage()}</h3>}

            {/* Opponent Hand */}
            {gameState.state !== 'waiting' && (
                <PlayerHand
                    hand={gameState.playerHands[actualOpponentColor] || [[], [], []]}
                    color={actualOpponentColor}
                    onPieceClick={() => { }}
                    isCurrentPlayer={false}
                />
            )}

            <GameBoard
                board={gameState.board}
                onCellClick={handleBoardCellClick}
                currentPlayer={playerColor}
                turn={turnColor}
                selectedCell={selection && selection.type === 'board' ? selection : null}
            />

            {/* My Hand */}
            <PlayerHand
                hand={gameState.playerHands[playerColor] || [[], [], []]}
                color={playerColor}
                onPieceClick={handleHandPieceClick}
                selectedStackIndex={selection && selection.type === 'hand' ? selection.stackIndex : null}
                isCurrentPlayer={true}
                isMyTurn={isMyTurn}
            />

            {/* Win Overlay */}
            {gameState.winner && !viewingBoard && (
                <div className="win-overlay">
                    <div className="win-content">
                        <h2 className="win-title">{gameState.winner === playerColor ? 'VICTORY!' : 'DEFEAT'}</h2>
                        <p className="win-subtitle">
                            {gameState.winner === playerColor ? 'You gobbled your way to glory!' : 'Better luck next time.'}
                        </p>
                        <div className="game-over-actions">
                            <button className="action-btn view-board" onClick={() => setViewingBoard(true)}>
                                View Board
                            </button>
                            <button className="action-btn play-again" onClick={handlePlayAgain}>
                                Play Again
                            </button>
                            <button className="action-btn return-home" onClick={() => navigate('/')}>
                                Return Home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back to Menu button when viewing board in finished state */}
            {gameState.winner && viewingBoard && (
                <div className="view-board-controls">
                    <button className="action-btn return-home small" onClick={() => setViewingBoard(false)}>
                        Show Menu
                    </button>
                    <div className="game-status-message">
                        {gameState.winner === playerColor ? 'You won!' : `${gameState.winner} won!`}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameRoom;
