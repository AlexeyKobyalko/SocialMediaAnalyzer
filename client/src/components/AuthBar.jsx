import { useState, useEffect } from 'react';
import { login, getProfile } from '../api';

function AuthBar({ onAuthChange }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getProfile()
                .then((res) => {
                    setCurrentUser(res.data);
                    if (onAuthChange) onAuthChange(res.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                    if (onAuthChange) onAuthChange(null);
                });
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError(null);
        try {
            const res = await login({ email, password });
            localStorage.setItem('token', res.data.token);
            setCurrentUser(res.data.user);
            setEmail('');
            setPassword('');
            if (onAuthChange) onAuthChange(res.data.user);
        } catch (err) {
            setAuthError(err.response?.data?.error || 'Ошибка авторизации');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        if (onAuthChange) onAuthChange(null);
    };

    return (
        <div className="auth-bar">
            {currentUser ? (
                <div className="auth-logged-in">
          <span>
            Вы вошли как: <strong>{currentUser.email}</strong> ({currentUser.role})
          </span>
                    <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            ) : (
                <form className="auth-form" onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary">
                        Войти (JWT)
                    </button>
                    {authError && <span className="auth-error">{authError}</span>}
                </form>
            )}
        </div>
    );
}

export default AuthBar;