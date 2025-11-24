import { useState, useEffect, useRef } from 'react';

const ChatPanel = ({ socket, gameId, playerId, playerName, isOpen, onToggle }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Listen for incoming chat messages
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (message) => {
            setMessages(prev => [...prev, message]);

            // Increment unread count if panel is closed
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
        };

        socket.on('chat_message', handleChatMessage);

        return () => {
            socket.off('chat_message', handleChatMessage);
        };
    }, [socket, isOpen]);

    // Reset unread count when panel opens
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!inputValue.trim() || !socket) return;

        const message = {
            id: Date.now(),
            sender: playerName,
            senderId: playerId,
            text: inputValue.trim(),
            timestamp: Date.now()
        };

        socket.emit('chat_message', { gameId, message });
        setInputValue('');
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                className="chat-toggle-btn"
                onClick={onToggle}
                aria-label="Toggle chat"
            >
                💬
                {!isOpen && unreadCount > 0 && (
                    <span className="chat-badge">{unreadCount}</span>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <span>Chat</span>
                        <button
                            className="chat-close-btn"
                            onClick={onToggle}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div className="chat-empty">No messages yet. Say hi! 👋</div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`chat-message ${msg.senderId === playerId ? 'own-message' : ''}`}
                                >
                                    <div className="message-header">
                                        <span className="message-sender">{msg.sender}</span>
                                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                                    </div>
                                    <div className="message-text">{msg.text}</div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            maxLength={200}
                        />
                        <button type="submit" disabled={!inputValue.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatPanel;
