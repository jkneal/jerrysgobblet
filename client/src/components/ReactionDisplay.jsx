import React, { useEffect, useState } from 'react';

const ReactionDisplay = ({ reactions, onAnimationEnd }) => {
    return (
        <div className="reaction-display-layer">
            {reactions.map((reaction) => (
                <div
                    key={reaction.id}
                    className={`floating-reaction ${reaction.isMine ? 'mine' : 'opponent'}`}
                    onAnimationEnd={() => onAnimationEnd(reaction.id)}
                >
                    {reaction.emoji}
                </div>
            ))}
        </div>
    );
};

export default ReactionDisplay;
