const assert = require('assert');
const GobletGame = require('../game/GobletGame');

console.log('Running Game Logic Tests...');

const game = new GobletGame('test-game');
game.addPlayer('p1'); // white
game.addPlayer('p2'); // black

assert.strictEqual(game.state, 'playing');
assert.strictEqual(game.turn, 'white');

// Test 1: Place piece
console.log('Test 1: Place piece');
// White places size 4 from stack 0 to (0,0)
let success = game.place('p1', 0, 0, 0);
assert.strictEqual(success, true);
assert.strictEqual(game.board[0][0].length, 1);
assert.strictEqual(game.board[0][0][0].size, 4);
assert.strictEqual(game.board[0][0][0].color, 'white');
assert.strictEqual(game.turn, 'black');

// Test 2: Invalid move (wrong turn)
console.log('Test 2: Invalid move (wrong turn)');
success = game.place('p1', 0, 0, 1);
assert.strictEqual(success, false);

// Test 3: Gobble piece
console.log('Test 3: Gobble piece');
// Black places size 4 to (0,1)
game.place('p2', 0, 0, 1);
// White places size 3 to (1,0)
game.place('p1', 0, 1, 0);
// Black moves size 4 from (0,1) to (1,0) - gobbling white's size 3
// Wait, black needs to move.
// Current board: (0,0): W4, (0,1): B4, (1,0): W3
// Turn: Black
success = game.move('p2', 0, 1, 1, 0);
assert.strictEqual(success, true);
assert.strictEqual(game.board[1][0].length, 2);
assert.strictEqual(game.board[1][0][1].color, 'black'); // Top is black
assert.strictEqual(game.board[1][0][1].size, 4);

// Test 4: Win condition
console.log('Test 4: Win condition');
game.reset();
game.addPlayer('p1');
game.addPlayer('p2');

// White fills row 0
game.board[0][0].push({ color: 'white', size: 4 });
game.board[0][1].push({ color: 'white', size: 4 });
game.board[0][2].push({ color: 'white', size: 4 });
game.board[0][3].push({ color: 'white', size: 4 });

assert.strictEqual(game.checkWin(), true);
assert.strictEqual(game.winner, 'white');

console.log('All tests passed!');
