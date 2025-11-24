import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, updateProfile, getDisplayName } = useAuth();
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const result = await updateProfile({ nickname: nickname.trim() || null });

        if (result.success) {
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to update profile');
        }

        setLoading(false);
    };

    if (!user) {
        return (
            <div className="app-container">
                <h1>Profile</h1>
                <p>Please log in to view your profile.</p>
                <button className="back-btn" onClick={() => navigate('/')}>
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="app-container profile-page">
            <h1>Your Profile</h1>

            <div className="profile-content">
                <div className="profile-avatar">
                    {user.avatar_url && (
                        <img src={user.avatar_url} alt={getDisplayName()} />
                    )}
                </div>

                <div className="profile-info">
                    <div className="info-row">
                        <label>Email:</label>
                        <span>{user.email}</span>
                    </div>

                    <div className="info-row">
                        <label>Name:</label>
                        <span>{user.first_name} {user.last_name}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="nickname">Nickname (optional):</label>
                            <input
                                type="text"
                                id="nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Enter a nickname"
                                maxLength={50}
                            />
                            <small>Leave blank to use your first name</small>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="save-btn"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => navigate('/')}
                            >
                                Back to Home
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
