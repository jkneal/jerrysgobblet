import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from '../components/LoginButton';

const Home = () => {
    const navigate = useNavigate();
    const { user, loading, getDisplayName } = useAuth();

    return (
        <div className="home-screen">
            {user && (
                <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
                    <LoginButton />
                </div>
            )}

            <div className="title-graphic">
                <img
                    src="/goblet1.png"
                    alt="Jerry the Goblin"
                    className="goblet-icon"
                    fetchpriority="high"
                />
            </div>
            <h1 style={{ "marginTop": "-.5rem" }}>Jerry's Gobblet</h1>

            {!loading && (
                <>
                    {user ? (
                        <div className="welcome-message">Welcome back, {getDisplayName()}!</div>
                    ) : (
                        <div className="challenge-text">Think you have what it takes to beat Jerry? 🤔</div>
                    )}
                </>
            )}

            <div className="menu-buttons">
                {user ? (
                    <button className="menu-btn primary" onClick={() => navigate('/lobby')}>
                        Play Now
                    </button>
                ) : (
                    <LoginButton />
                )}
                <button className="menu-btn secondary" onClick={() => navigate('/how-to-play')}>
                    How to Play
                </button>
            </div>
        </div>
    );
};

export default Home;
