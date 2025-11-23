import React from 'react';
import { useNavigate } from 'react-router-dom';

const HowToPlay = () => {
    const navigate = useNavigate();

    return (
        <div className="app-container how-to-play">
            <h1>How to Play</h1>

            <div className="rules-content">
                <section>
                    <h2>Objective</h2>
                    <p>Be the first to align 4 of your pieces in a row (horizontal, vertical, or diagonal).</p>
                </section>

                <section>
                    <h2>Pieces</h2>
                    <p>You have 3 stacks of pieces. Larger pieces can cover (gobble) smaller pieces.</p>
                    {/* Placeholder for piece graphic */}
                    <div className="graphic-placeholder">Pieces Graphic</div>
                </section>

                <section>
                    <h2>Moves</h2>
                    <ul>
                        <li><strong>Place:</strong> Take a piece from your hand and place it on an empty square or over a smaller piece.</li>
                        <li><strong>Move:</strong> Move one of your exposed pieces on the board to another square (empty or over a smaller piece).</li>
                    </ul>
                </section>

                <section>
                    <h2>Gobbling</h2>
                    <p>Covering a piece hides it. If you move the top piece later, the piece underneath is revealed!</p>
                </section>
            </div>

            <button className="back-btn" onClick={() => navigate('/')}>Back to Home</button>
        </div>
    );
};

export default HowToPlay;
