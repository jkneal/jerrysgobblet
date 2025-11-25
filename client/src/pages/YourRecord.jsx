import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const YourRecord = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('history');
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;

                // Fetch user stats and history
                const statsRes = await fetch(`${backendUrl}/api/stats/me`, {
                    credentials: 'include'
                });
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats);
                    setHistory(data.history);
                }

                // Fetch leaderboard
                const leaderboardRes = await fetch(`${backendUrl}/api/rankings?limit=50`);
                if (leaderboardRes.ok) {
                    const data = await leaderboardRes.json();
                    setLeaderboard(data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading-spinner">Loading stats...</div>
            </div>
        );
    }

    return (
        <div className="app-container profile-page">
            <div className="profile-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ← Back to Home
                </button>
                <h1>Your Record</h1>
            </div>

            {/* Stats Summary Card */}
            <div className="stats-summary-card">
                <div className="stat-item stat-rank">
                    <span className="stat-label">Rank</span>
                    <span className="stat-value">#{stats?.rank || '-'}</span>
                </div>
                <div className="stat-item stat-win-rate">
                    <span className="stat-label">Win Rate</span>
                    <span className="stat-value">
                        {stats?.total_games > 0
                            ? Math.round((stats.wins / stats.total_games) * 100) + '%'
                            : '-'}
                    </span>
                </div>
                <div className="stat-item stat-wins">
                    <span className="stat-label">Wins</span>
                    <span className="stat-value">{stats?.wins || 0}</span>
                </div>
                <div className="stat-item stat-losses">
                    <span className="stat-label">Losses</span>
                    <span className="stat-value">{stats?.losses || 0}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="stats-tabs">
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Match History
                </button>
                <button
                    className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    Leaderboard
                </button>
            </div>

            {/* Content Area */}
            <div className="stats-content">
                {activeTab === 'history' ? (
                    <div className="history-list">
                        {history.length === 0 ? (
                            <div className="empty-state">No games played yet.</div>
                        ) : (
                            history.map((game) => (
                                <div key={game.id} className={`history-item ${game.result}`}>
                                    <div className="game-result">
                                        <span className="result-badge">{game.result.toUpperCase()}</span>
                                        <div className="game-meta">
                                            <span className="game-date">{formatDate(game.played_at)}</span>
                                            <span className="game-duration">{formatDuration(game.duration_seconds)}</span>
                                        </div>
                                    </div>
                                    <div className="opponent-info">
                                        <span className="vs-label">vs</span>
                                        <div className="opponent-details">
                                            {game.opponent_avatar && (
                                                <img src={game.opponent_avatar} alt="Opponent" className="mini-avatar" />
                                            )}
                                            <span className="opponent-name">
                                                {game.opponent_name || 'Guest'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="leaderboard-list">
                        <div className="leaderboard-header">
                            <span>Rank</span>
                            <span>Player</span>
                            <span>Score</span>
                            <span>W/L</span>
                        </div>
                        {leaderboard.map((player, index) => (
                            <div
                                key={player.user_id}
                                className={`leaderboard-item ${player.user_id === user?.id ? 'current-user' : ''}`}
                            >
                                <div className="rank-col">
                                    <span className={`rank-badge rank-${index + 1}`}>
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="player-col">
                                    {player.avatar_url && (
                                        <img src={player.avatar_url} alt={player.nickname} className="mini-avatar" />
                                    )}
                                    <span className="player-name">
                                        {player.nickname || player.first_name || 'Unknown'}
                                    </span>
                                </div>
                                <div className="score-col">{player.rank_score}</div>
                                <div className="ratio-col">
                                    {player.wins}/{player.losses}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default YourRecord;
