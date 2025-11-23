class GobletGame {
    constructor(id) {
        this.id = id;
        this.players = []; // { id: socketId, color: 'white' | 'black' }
        // 4x4 grid, each cell is a stack of pieces. 
        // Piece: { color: 'white'|'black', size: 1|2|3|4 }
        this.board = Array(4).fill(null).map(() => Array(4).fill(null).map(() => []));
        this.turn = null;
        this.state = 'waiting'; // waiting, playing, finished
        this.winner = null;

        // Initial hands: 3 stacks of [1, 2, 3, 4] for each player
        // We track available pieces. Since they must be played in order (largest first usually, 
        // or just available from external stacks), we can represent this as 3 stacks per player.
        // Actually, in Gobblet, you have 3 stacks of 4 pieces nested. You can only play the top one.
        // So we track 3 stacks per player.
        this.playerHands = {
            white: [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
            black: [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]
        };

        // Track last move for highlighting
        this.lastMove = null; // { type: 'place'|'move', toRow, toCol, fromRow?, fromCol? }
    }

    addPlayer(playerId, preferredColor) {
        // Check if player is already in the game
        if (this.players.some(p => p.id === playerId)) {
            return true; // Already joined
        }

        if (this.players.length >= 2) return false;

        let color = preferredColor;
        // If no preference or taken, assign default
        if (!color || !this.isColorAvailable(color)) {
            const usedColors = this.players.map(p => p.color);
            // Default fallback colors if custom ones aren't used, or just pick a random unused one
            // For simplicity, if custom colors are used, we just accept them.
            // If collision, we might need to negotiate, but for now we assume matchmaking handles it or we reject.
            // Let's implement a simple fallback: if 'gold' is taken, try 'silver', etc.
            // But since we have many colors now, we should just check collision.

            // If we are the first player, take preference or default to 'gold'
            if (this.players.length === 0) {
                color = preferredColor || 'gold';
            } else {
                // Second player
                if (preferredColor && this.isColorAvailable(preferredColor)) {
                    color = preferredColor;
                } else {
                    // Assign a complementary or random available color
                    // For now, let's just ensure it's different from player 1
                    color = this.players[0].color === 'gold' ? 'silver' : 'gold';
                    // If player 1 picked something else, we need a robust fallback.
                    // Let's just pick 'silver' if p1 is not silver, else 'gold'.
                    if (this.players[0].color === 'silver') color = 'gold';
                    else if (this.players[0].color === 'gold') color = 'silver';
                    else color = 'silver'; // Default 2nd player color
                }
            }
        }

        this.players.push({ id: playerId, color });

        // Initialize hand for this color
        this.playerHands[color] = [
            [1, 2, 3, 4],
            [1, 2, 3, 4],
            [1, 2, 3, 4]
        ];

        if (this.players.length === 2) {
            this.state = 'playing';
            this.turn = this.players[0].id; // First player starts
        }
        return true;
    }

    isColorAvailable(color) {
        return !this.players.some(p => p.color === color);
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        // Only reset if the game was in progress or waiting. 
        // If finished, keep state so the other player can see the result.
        if (this.state !== 'finished') {
            this.state = 'waiting';
            this.reset();
        }
    }

    reset() {
        this.board = Array(4).fill(null).map(() => Array(4).fill(null).map(() => []));
        this.winner = null;

        // Reset turn to first player if exists
        if (this.players.length > 0) {
            this.turn = this.players[0].id;
        } else {
            this.turn = null;
        }

        // Reset hands for current players
        this.playerHands = {};
        this.players.forEach(p => {
            this.playerHands[p.color] = [
                [1, 2, 3, 4],
                [1, 2, 3, 4],
                [1, 2, 3, 4]
            ];
        });

        // Clear last move
        this.lastMove = null;

        // If we have default colors but no players (shouldn't happen in active game reset),
        // we might want to keep defaults, but for now this is safer for active games.
    }

    getPlayerColor(playerId) {
        const player = this.players.find(p => p.id === playerId);
        return player ? player.color : null;
    }

    // Place a piece from hand to board
    place(playerId, stackIndex, toRow, toCol) {
        if (this.state !== 'playing' || this.winner) {
            console.log(`Place failed: state=${this.state}, winner=${this.winner}`);
            return false;
        }

        if (playerId !== this.turn) {
            console.log(`Place failed: wrong turn. Player=${playerId}, Turn=${this.turn}`);
            return false;
        }

        const color = this.getPlayerColor(playerId);

        // Validate stack index
        if (stackIndex < 0 || stackIndex > 2) return false;
        const stack = this.playerHands[color][stackIndex];
        if (stack.length === 0) return false;

        const pieceSize = stack[stack.length - 1]; // Top piece (largest available in that stack)

        // Validate move
        if (!this.isValidMove(pieceSize, toRow, toCol)) {
            console.log(`Place failed: invalid move to ${toRow},${toCol}`);
            return false;
        }

        // Execute move
        stack.pop(); // Remove from hand
        this.board[toRow][toCol].push({ color, size: pieceSize });

        // Track last move
        this.lastMove = { type: 'place', toRow, toCol };

        this.finishTurn();
        return true;
    }

    // Move a piece on the board
    move(playerId, fromRow, fromCol, toRow, toCol) {
        if (this.state !== 'playing' || this.winner) {
            console.log(`Move failed: state=${this.state}`);
            return false;
        }

        if (playerId !== this.turn) {
            console.log(`Move failed: wrong turn`);
            return false;
        }

        const color = this.getPlayerColor(playerId);

        // Validate source
        const sourceStack = this.board[fromRow][fromCol];
        if (sourceStack.length === 0) {
            console.log(`Move failed: source stack is empty at ${fromRow},${fromCol}`);
            return false;
        }
        const piece = sourceStack[sourceStack.length - 1];
        if (piece.color !== color) {
            console.log(`Move failed: piece at ${fromRow},${fromCol} does not belong to player ${color}`);
            return false;
        }

        // Validate move (cannot move to same spot)
        if (fromRow === toRow && fromCol === toCol) {
            console.log(`Move failed: cannot move to the same spot ${fromRow},${fromCol}`);
            return false;
        }

        // Validate destination
        if (!this.isValidMove(piece.size, toRow, toCol)) {
            console.log(`Move failed: invalid move to ${toRow},${toCol}`);
            return false;
        }

        // Execute move
        sourceStack.pop();
        this.board[toRow][toCol].push(piece);

        // Track last move
        this.lastMove = { type: 'move', fromRow, fromCol, toRow, toCol };

        this.finishTurn();
        return true;
    }

    isValidMove(pieceSize, row, col) {
        if (row < 0 || row > 3 || col < 0 || col > 3) return false;
        const targetStack = this.board[row][col];

        // Empty cell is always valid
        if (targetStack.length === 0) return true;

        // Must be larger than the top piece
        const topPiece = targetStack[targetStack.length - 1];
        return pieceSize > topPiece.size;
    }

    finishTurn() {
        if (this.checkWin()) {
            this.state = 'finished';
        } else {
            // Switch to the other player's ID
            const currentPlayerIndex = this.players.findIndex(p => p.id === this.turn);
            if (currentPlayerIndex !== -1) {
                const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
                this.turn = this.players[nextPlayerIndex].id;
            }
        }
    }

    checkWin() {
        const winners = new Set();
        const board = this.board;

        // Helper to get color at cell (or null)
        const getColor = (r, c) => {
            const stack = board[r][c];
            return stack.length > 0 ? stack[stack.length - 1].color : null;
        };

        // Check rows
        for (let r = 0; r < 4; r++) {
            const c0 = getColor(r, 0);
            if (c0 && c0 === getColor(r, 1) && c0 === getColor(r, 2) && c0 === getColor(r, 3)) {
                winners.add(c0);
            }
        }

        // Check cols
        for (let c = 0; c < 4; c++) {
            const r0 = getColor(0, c);
            if (r0 && r0 === getColor(1, c) && r0 === getColor(2, c) && r0 === getColor(3, c)) {
                winners.add(r0);
            }
        }

        // Check diagonals
        const d1 = getColor(0, 0);
        if (d1 && d1 === getColor(1, 1) && d1 === getColor(2, 2) && d1 === getColor(3, 3)) {
            winners.add(d1);
        }

        const d2 = getColor(0, 3);
        if (d2 && d2 === getColor(1, 2) && d2 === getColor(2, 1) && d2 === getColor(3, 0)) {
            winners.add(d2);
        }

        if (winners.size === 0) return false;

        // If there are winners, check priority.
        // Rule: If you uncover your opponent's winning line, they win (even if you also win).
        const currentPlayerColor = this.getPlayerColor(this.turn);

        // If the set contains a color that is NOT the current player's color, that player wins.
        for (const w of winners) {
            if (w !== currentPlayerColor) {
                this.winner = w;
                return true;
            }
        }

        // Otherwise, the current player wins
        this.winner = currentPlayerColor;
        return true;
    }

    getGameState() {
        return {
            id: this.id,
            players: this.players,
            board: this.board,
            turn: this.turn,
            state: this.state,
            winner: this.winner,
            playerHands: this.playerHands, // Frontend needs to know available pieces
            lastMove: this.lastMove // For highlighting opponent moves
        };
    }
}

module.exports = GobletGame;
