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

const GameRoom = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const playerColor = location.state?.color || '#ffd700'; // Default to gold
    const gameId = location.state?.gameId; // Optional: join specific game

    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [selection, setSelection] = useState(null); // { type: 'hand'|'board', stackIndex?, row?, col? }
    const [lastMove, setLastMove] = useState(null);
    const [viewingBoard, setViewingBoard] = useState(false);
    const playerIdRef = useRef(null); // To store the player's socket ID
    const gameIdRef = useRef(null); // To store the current game ID


    // Initialize socket connection
    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const newSocket = io(backendUrl, {
            withCredentials: true
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
            playerIdRef.current = newSocket.id;

            // Check if we have a stored gameId (from page refresh)
            const storedGameId = sessionStorage.getItem('currentGameId');

            // Priority: use gameId from navigation state, otherwise try stored gameId
            if (gameId) {
                // Joining a specific game (from lobby or color preferences)
                console.log('Joining game:', gameId);
                newSocket.emit('join_game', { color: playerColor, gameId });
                // Update stored gameId
                sessionStorage.setItem('currentGameId', gameId);
            } else if (storedGameId) {
                // Attempt to rejoin the stored game (page refresh)
                console.log('Attempting to rejoin game:', storedGameId);
                newSocket.emit('rejoin_game', { gameId: storedGameId });
            } else {
                // New game with matchmaking
                console.log('Starting new game with color:', playerColor);
                newSocket.emit('join_game', { color: playerColor });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        newSocket.on('game_update', (state) => {
            setGameState(state);
            setSelection(null);

            // Store gameId for reconnection
            if (state.id) {
                gameIdRef.current = state.id;
                sessionStorage.setItem('currentGameId', state.id);
            }
        });

        newSocket.on('game_error', (error) => {
            console.error('Game error:', error);

            // Only clear and redirect if it's a "Game not found" or "Not a player" error
            // and we were trying to rejoin
            const storedGameId = sessionStorage.getItem('currentGameId');
            if (storedGameId && (error.message === 'Game not found' || error.message === 'You are not a player in this game')) {
                sessionStorage.removeItem('currentGameId');
                navigate('/lobby');
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [playerColor, gameId]);

    // Clear stored gameId when leaving the page
    useEffect(() => {
        return () => {
            // Only clear if game is finished
            if (gameState?.state === 'finished') {
                sessionStorage.removeItem('currentGameId');
            }
        };
    }, [gameState?.state]);


    useEffect(() => {
        // Reset viewing board state when game restarts
        if (gameState && (gameState.state === 'playing' || gameState.state === 'waiting')) {
            setViewingBoard(false);
        }
    }, [gameState?.state]);

    // Auto-clear last move highlighting after 3 seconds
    useEffect(() => {
        if (gameState?.lastMove) {
            setLastMove(gameState.lastMove);
            const timer = setTimeout(() => {
                setLastMove(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.lastMove]);

    const handleHandPieceClick = (stackIndex) => {
        if (!gameState || gameState.winner) return;
        const playerId = playerIdRef.current;
        const myPlayer = gameState.players.find(p => p.id === playerId);
        if (!myPlayer || gameState.turn !== playerId) return;

        // Select piece from hand
        if (selection && selection.type === 'hand' && selection.stackIndex === stackIndex) {
            setSelection(null); // Deselect if already selected
        } else {
            setSelection({ type: 'hand', stackIndex });
        }
    };
    const handleBoardCellClick = (row, col) => {
        if (!gameState || !socket) return;
        // If game is over, don't allow interaction unless we want to allow viewing
        // But for now, disable moves if winner exists
        if (gameState.winner) return;

        const playerId = playerIdRef.current;
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
            const playerId = playerIdRef.current;
            const myPlayer = gameState.players.find(p => p.id === playerId);
            const myColor = myPlayer?.color;

            if (stack.length > 0) {
                const topPiece = stack[stack.length - 1];
                if (topPiece.color === myColor) {
                    setSelection({ type: 'board', row, col });
                }
            }
        }
    };

    const handlePlayAgain = () => {
        if (socket && socket.connected) {
            socket.emit('reset_game');
        }
    };

    if (!gameState) {
        return (
            <div className="app-container">
                <h1>Jerry's Gobblet</h1>
                <h3 className="waiting-message">Connecting to game...</h3>
            </div>
        );
    }

    const playerId = playerIdRef.current;
    const myPlayerColor = gameState.players.find(p => p.id === playerId)?.color || playerColor;
    const opponent = gameState.players.find(p => p.id !== playerId);
    const actualOpponentColor = opponent ? opponent.color : (myPlayerColor === '#ffd700' ? '#c0c0c0' : '#ffd700');

    const isMyTurn = gameState.turn === playerId;
    const turnPlayer = gameState.players.find(p => p.id === gameState.turn);
    const turnColor = turnPlayer ? turnPlayer.color : '';

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

    const getDisplayColor = (c) => {
        if (!c) return '';
        // Check if it's a known hex code
        const name = COLOR_NAMES[c.toLowerCase()];
        if (name) return name;
        // Fallback for named colors or unknown hexes
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
                const winningPlayer = gameState.players.find(p => p.color === gameState.winner);
                const winnerName = winningPlayer?.displayName || 'Opponent';
                return `${winnerName} wins!`;
            }
        }
        if (isMyTurn) {
            return 'Your turn';
        } else {
            const turnPlayerData = gameState.players.find(p => p.id === gameState.turn);
            const turnPlayerName = turnPlayerData?.displayName || 'Opponent';
            return `${turnPlayerName}'s turn`;
        }
    };

    // Get badge background color based on game state
    const getStatusBadgeColor = () => {
        if (gameState.state === 'waiting') {
            return 'transparent';
        }
        if (gameState.winner) {
            return gameState.winner; // Return the winner's color
        }
        return turnColor; // Return current turn player's color
    };

    return (
        <div className="app-container">
            {viewingBoard ? (
                <div className="header-spacer"></div>
            ) : (
                <>
                    <div className="page-header">
                        <img src="/goblet1.png" alt="Jerry the Goblin" className="header-icon" />
                        <h1>Jerry's Gobblet</h1>
                    </div>

                    <div
                        className="game-status-message"
                        style={{ backgroundColor: getStatusBadgeColor() }}
                    >
                        {getStatusMessage()}
                    </div>
                </>
            )}

            {/* Opponent Hand */}
            {gameState.state !== 'waiting' && (
                <PlayerHand
                    hand={gameState.playerHands[actualOpponentColor] || [[], [], []]}
                    color={actualOpponentColor}
                    onPieceClick={() => { }}
                    isCurrentPlayer={false}
                    player={opponent}
                />
            )}

            <GameBoard
                board={gameState.board}
                onCellClick={handleBoardCellClick}
                currentPlayer={myPlayerColor}
                turn={turnColor}
                selectedCell={selection && selection.type === 'board' ? selection : null}
                lastMove={lastMove}
            />

            {/* My Hand */}
            <PlayerHand
                hand={gameState.playerHands[myPlayerColor] || [[], [], []]}
                color={myPlayerColor}
                onPieceClick={handleHandPieceClick}
                selectedStackIndex={selection && selection.type === 'hand' ? selection.stackIndex : null}
                isCurrentPlayer={true}
                isMyTurn={isMyTurn}
                player={gameState.players.find(p => p.color === myPlayerColor)}
            />

            {/* Win Overlay */}
            {gameState.winner && !viewingBoard && (
                <div className="win-overlay">
                    <div className="win-content">
                        <h2 className="win-title">{gameState.winner === myPlayerColor ? 'VICTORY!' : 'DEFEAT'}</h2>
                        <p className="win-subtitle">
                            {gameState.winner === myPlayerColor ? 'You gobbled your way to glory!' : 'Better luck next time.'}
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
