import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginButton = () => {
    const { user, login, logout, getDisplayName } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    if (!user) {
        return (
            <button className="login-btn" onClick={login}>
                <span className="google-icon">G</span>
                Sign in with Google
            </button>
        );
    }

    return (
        <div className="user-menu">
            <button
                className="user-button"
                onClick={() => setShowMenu(!showMenu)}
            >
                {user.avatar_url && (
                    <img
                        src={user.avatar_url}
                        alt={getDisplayName()}
                        className="user-avatar"
                    />
                )}
                <span className="user-name">{getDisplayName()}</span>
                <span className="dropdown-arrow">▼</span>
            </button>

            {showMenu && (
                <div className="user-dropdown">
                    <button
                        className="dropdown-item"
                        onClick={() => {
                            setShowMenu(false);
                            navigate('/profile');
                        }}
                    >
                        Profile
                    </button>
                    <button
                        className="dropdown-item"
                        onClick={() => {
                            setShowMenu(false);
                            logout();
                        }}
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginButton;
