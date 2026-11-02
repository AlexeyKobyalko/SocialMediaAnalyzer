import { useState, useEffect } from 'react';
import PostList from './components/PostList';
import AuthPage from './components/AuthPage';
import { getProfile } from './api';
import './App.css';

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentView, setCurrentView] = useState('dashboard');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getProfile()
                .then((res) => setCurrentUser(res.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                });
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
    };

    const handleAuthSuccess = (user) => {
        setCurrentUser(user);
        setCurrentView('dashboard');
    };

    if (currentView === 'auth') {
        return (
            <main className="app">
                <AuthPage
                    onAuthSuccess={handleAuthSuccess}
                    onBack={() => setCurrentView('dashboard')}
                />
            </main>
        );
    }

    return (
        <main className="app">
            <header className="main-navbar">
                <div className="navbar-left">
                    <span className="brand-tag">Analytics Hub</span>
                    <h1 className="navbar-logo">Social Media Analyzer</h1>
                </div>

                <div className="navbar-right">
                    {currentUser ? (
                        <div className="nav-profile-pill">
                            <span className="nav-avatar">{currentUser.email[0].toUpperCase()}</span>
                            <div className="nav-user-details">
                                <span className="nav-user-email">{currentUser.email}</span>
                                <span className={`nav-role-badge role-${currentUser.role}`}>
                  {currentUser.role}
                </span>
                            </div>
                            <button type="button" className="btn-logout" onClick={handleLogout}>
                                Выйти
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-lime"
                            onClick={() => setCurrentView('auth')}
                        >
                            Войти / Регистрация
                        </button>
                    )}
                </div>
            </header>

            <PostList currentUser={currentUser} />
        </main>
    );
}

export default App;