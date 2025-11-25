import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HowToPlay = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ui'); // 'ui' or 'rules'

    return (
        <div className="app-container how-to-play">
            <h1>How to Play Jerry's Gobblet</h1>

            {/* Tab Navigation */}
            <div className="how-to-tabs">
                <button
                    className={`tab-btn ${activeTab === 'ui' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ui')}
                >
                    📱 Using the UI
                </button>
                <button
                    className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rules')}
                >
                    📖 Game Rules
                </button>
            </div>

            {/* UI Guide Tab */}
            {activeTab === 'ui' && (
                <div className="rules-content">
                    <section>
                        <h2>Getting Started</h2>
                        <ol>
                            <li><strong>Create or Join a Game:</strong> From the lobby, click "Create New Game" or join an existing waiting game</li>
                            <li><strong>Choose Your Color:</strong> Select your preferred piece color from the color palette</li>
                            <li><strong>Wait for Opponent:</strong> The game starts when a second player joins</li>
                        </ol>
                    </section>

                    <section>
                        <h2>Playing Your Turn</h2>
                        <h3>🎯 Selecting a Piece</h3>
                        <ul>
                            <li><strong>From Your Hand:</strong> Click on any piece in your hand (bottom area) to select it</li>
                            <li><strong>From the Board:</strong> Click on one of your pieces already on the board to move it</li>
                            <li>Selected pieces will have a <span className="color-badge">dark blue glow</span></li>
                            <li>Click the same piece again to deselect it</li>
                        </ul>

                        <h3>📍 Placing a Piece</h3>
                        <ul>
                            <li>After selecting a piece from your hand, click any valid board cell</li>
                            <li>You can place on empty cells or cover smaller opponent pieces</li>
                            <li>Larger pieces can "gobble" (cover) smaller pieces</li>
                        </ul>

                        <h3>🔄 Moving a Piece</h3>
                        <ul>
                            <li>Select one of your pieces on the board (must be on top, not covered)</li>
                            <li>Click a different cell to move it there</li>
                            <li>Moving a piece may reveal what was underneath!</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Game Interface</h2>
                        <h3>🎨 Visual Indicators</h3>
                        <ul>
                            <li><strong>Turn Badge:</strong> Shows whose turn it is with their color</li>
                            <li><strong>Last Move:</strong> Recent moves are briefly highlighted in orange</li>
                            <li><strong>Winning Row:</strong> When someone wins, the 4 winning pieces pulse with golden light and dance! 🎉</li>
                            <li><strong>Your Hand:</strong> Bottom area shows your available pieces (white background)</li>
                            <li><strong>Opponent's Hand:</strong> Top area shows opponent's pieces (dark background)</li>
                        </ul>

                        <h3>💬 Chat</h3>
                        <ul>
                            <li>Click the chat button (💬) in the bottom-left corner</li>
                            <li>Type messages to communicate with your opponent</li>
                            <li>Unread messages show a red badge</li>
                        </ul>

                        <h3>🔊 Sound Effects</h3>
                        <ul>
                            <li><strong>Select:</strong> Plays when you click a piece</li>
                            <li><strong>Place:</strong> Plays when you place or move a piece</li>
                            <li><strong>Opponent:</strong> Plays when your opponent makes a move</li>
                            <li><strong>Victory:</strong> Plays when the game ends</li>
                        </ul>
                    </section>

                    <section>
                        <h2>After the Game</h2>
                        <ul>
                            <li><strong>View the Board:</strong> See the final position with winning cells highlighted</li>
                            <li><strong>Play Again:</strong> Start a new game with the same opponent</li>
                            <li><strong>Return Home:</strong> Go back to the lobby to find a new opponent</li>
                        </ul>
                    </section>
                </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
                <div className="rules-content">
                    <section>
                        <h2>🎯 Objective</h2>
                        <p>Be the first player to get <strong>4 of your pieces in a row</strong> — horizontally, vertically, or diagonally.</p>
                    </section>

                    <section>
                        <h2>🎲 Setup</h2>
                        <ul>
                            <li>Each player starts with <strong>12 pieces</strong> in 3 stacks of 4 nested pieces</li>
                            <li>Pieces come in 4 sizes: Small (1), Medium (2), Large (3), and Extra Large (4)</li>
                            <li>The board is a 4×4 grid, initially empty</li>
                            <li>Players choose their piece color</li>
                        </ul>
                    </section>

                    <section>
                        <h2>🎮 Gameplay</h2>
                        <h3>Turn Structure</h3>
                        <p>Players alternate turns. On your turn, you <strong>must</strong> do ONE of the following:</p>

                        <h3>1️⃣ Place a Piece from Your Hand</h3>
                        <ul>
                            <li>Take the top piece from any of your 3 stacks</li>
                            <li>Place it on any empty cell OR on top of a smaller piece (yours or opponent's)</li>
                            <li>You can only play the top piece from each stack (nested pieces must wait)</li>
                        </ul>

                        <h3>2️⃣ Move a Piece Already on the Board</h3>
                        <ul>
                            <li>Select one of your pieces that is visible (on top, not covered)</li>
                            <li>Move it to any empty cell OR on top of a smaller piece</li>
                            <li>Moving a piece reveals what was underneath (if anything)</li>
                        </ul>
                    </section>

                    <section>
                        <h2>🍽️ The Gobbling Rule</h2>
                        <p><strong>Larger pieces can cover ("gobble") smaller pieces!</strong></p>
                        <ul>
                            <li>Size 4 can gobble sizes 1, 2, or 3</li>
                            <li>Size 3 can gobble sizes 1 or 2</li>
                            <li>Size 2 can gobble size 1</li>
                            <li>Size 1 cannot gobble anything</li>
                            <li>You can gobble your own pieces or your opponent's pieces</li>
                            <li>Gobbled pieces are hidden but still on the board</li>
                            <li>If the top piece moves away, the gobbled piece is revealed!</li>
                        </ul>
                    </section>

                    <section>
                        <h2>🏆 Winning the Game</h2>
                        <h3>Victory Condition</h3>
                        <p>Get 4 of your colored pieces in a row (horizontal, vertical, or diagonal). Only the <strong>top visible piece</strong> in each cell counts.</p>

                        <h3>⚠️ Important: The Reveal Rule</h3>
                        <p><strong>If you move a piece and reveal your opponent's winning line, THEY WIN!</strong></p>
                        <p>Example: If moving your piece uncovers an opponent's piece that completes their 4-in-a-row, you lose immediately.</p>

                        <h3>Simultaneous Wins</h3>
                        <p>If a move creates 4-in-a-row for both players:</p>
                        <ul>
                            <li>The player who did NOT make the move wins</li>
                            <li>This prevents you from accidentally giving your opponent the win</li>
                        </ul>
                    </section>

                    <section>
                        <h2>💡 Strategy Tips</h2>
                        <ul>
                            <li><strong>Memory is key:</strong> Remember what pieces are gobbled where!</li>
                            <li><strong>Size matters:</strong> Save your largest pieces for critical moments</li>
                            <li><strong>Think ahead:</strong> Moving a piece might reveal something dangerous underneath</li>
                            <li><strong>Block and attack:</strong> Use gobbling to disrupt opponent's lines</li>
                            <li><strong>Control the center:</strong> Central positions offer more winning lines</li>
                        </ul>
                    </section>

                    <section>
                        <h2>❓ Common Questions</h2>
                        <h3>Can I gobble my own pieces?</h3>
                        <p>Yes! Sometimes it's strategic to cover your own pieces.</p>

                        <h3>What if I run out of pieces?</h3>
                        <p>You can still move pieces already on the board. You're never stuck!</p>

                        <h3>Can I see what's under a piece?</h3>
                        <p>No, gobbled pieces are hidden. You must remember what's underneath!</p>

                        <h3>Can I pass my turn?</h3>
                        <p>No, you must make a move if any legal move exists.</p>
                    </section>
                </div>
            )}

            <button className="back-btn" onClick={() => window.location.href = '/'}>Back to Home</button>
        </div>
    );
};

export default HowToPlay;
