import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Initialize socket
        socket = io('http://localhost:3000', {
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

    const handleHandPieceClick = (stackIndex) => {
        if (!gameState) return;

        if (gameState.turn !== playerId) return;

        if (selection && selection.type === 'hand' && selection.stackIndex === stackIndex) {
            setSelection(null);
        } else {
            setSelection({ type: 'hand', stackIndex });
        }
    };

    const handleBoardCellClick = (row, col) => {
        if (!gameState) return;
        const playerColor = gameState.players.find(p => p.id === playerId)?.color;
        if (gameState.turn !== playerId) return;

        if (!selection) {
            const stack = gameState.board[row][col];
            if (stack.length > 0 && stack[stack.length - 1].color === playerColor) {
                setSelection({ type: 'board', row, col });
            }
            return;
        }

        if (selection.type === 'hand') {
            socket.emit('place_piece', { stackIndex: selection.stackIndex, row, col });
        } else if (selection.type === 'board') {
            if (selection.row === row && selection.col === col) {
                setSelection(null);
                return;
            }
            socket.emit('move_piece', { fromRow: selection.row, fromCol: selection.col, toRow: row, toCol: col });
        }
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

    return (
        <div className="app-container">
            <h1>Jerry's Goblet</h1>
            {gameState.state === 'waiting' && <h3 className="waiting-message">Waiting for opponent to join...</h3>}

            <div className="game-info">
                <p>You are: <span className={`player-badge ${playerColor}`} style={{ background: playerColor }}>{getDisplayColor(playerColor)}</span></p>
                {gameState.state !== 'waiting' && (
                    <p>Turn: <span className={`player-badge ${turnColor}`} style={{ background: turnColor }}>{getDisplayColor(turnColor)}</span></p>
                )}
                <p>Status: {gameState.state}</p>
            </div>

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
                isCurrentPlayer={isMyTurn}
            />

            {gameState.winner && (
                <div className="win-overlay">
                    <div className="win-content">
                        <h2 className="win-title">{gameState.winner === playerColor ? 'VICTORY!' : 'DEFEAT'}</h2>
                        <p className="win-subtitle">
                            {gameState.winner === playerColor ? 'You gobbled your way to glory!' : 'Better luck next time.'}
                        </p>
                        <button className="play-again" onClick={() => navigate('/')}>Back to Home</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameRoom;
