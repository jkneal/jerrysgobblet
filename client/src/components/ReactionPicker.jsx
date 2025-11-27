import React, { useState } from 'react';

const EMOJIS = ['😂', '😮', '😡', '👏', '🤔', '😭', '💪'];

const ReactionPicker = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (emoji) => {
        onSelect(emoji);
        setIsOpen(false);
    };

    return (
        <div className="reaction-picker-container">
            {isOpen && (
                <div className="reaction-list">
                    {EMOJIS.map((emoji, index) => (
                        <button
                            key={index}
                            className="reaction-btn"
                            onClick={() => handleSelect(emoji)}
                            aria-label={`Send ${emoji} reaction`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
            <button
                className="reaction-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle reactions"
            >
                😀
            </button>
        </div>
    );
};

export default ReactionPicker;
