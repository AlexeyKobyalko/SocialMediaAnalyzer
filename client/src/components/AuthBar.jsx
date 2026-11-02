import { useState, useEffect } from 'react';
import { login, register, getProfile } from '../api';

function AuthBar({ onAuthChange }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);

        try {
            if (isRegisterMode) {
                await register({ email, password, role });
            }

            const res = await login({ email, password });
            localStorage.setItem('token', res.data.token);
            setCurrentUser(res.data.user);
            setEmail('');
            setPassword('');
            if (onAuthChange) onAuthChange(res.data.user);
        } catch (err) {
            setAuthError(err.response?.data?.error || 'Произошла ошибка при аутентификации');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        if (onAuthChange) onAuthChange(null);
    };

    return (
        <div className="auth-card">
            {currentUser ? (
                <div className="auth-user-bar">
                    <div className="auth-user-info">
                        <span className="user-avatar">{currentUser.email[0].toUpperCase()}</span>
                        <div>
                            <p className="user-email">{currentUser.email}</p>
                            <span className="user-badge">{currentUser.role}</span>
                        </div>
                    </div>
                    <button type="button" className="btn btn-dark-pill" onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            ) : (
                <div className="auth-box">
                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={`auth-tab ${!isRegisterMode ? 'active' : ''}`}
                            onClick={() => {
                                setIsRegisterMode(false);
                                setAuthError(null);
                            }}
                        >
                            Вход
                        </button>
                        <button
                            type="button"
                            className={`auth-tab ${isRegisterMode ? 'active' : ''}`}
                            onClick={() => {
                                setIsRegisterMode(true);
                                setAuthError(null);
                            }}
                        >
                            Регистрация
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
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

                        {isRegisterMode && (
                            <select
                                className="auth-select"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="admin">Роль: Администратор (CRUD доступен)</option>
                                <option value="user">Роль: Обычный пользователь (только чтение)</option>
                            </select>
                        )}

                        <button type="submit" className="btn btn-lime">
                            {isRegisterMode ? 'Создать аккаунт' : 'Войти'}
                        </button>
                    </form>

                    {authError && <div className="auth-error-banner">{authError}</div>}
                </div>
            )}
        </div>
    );
}

export default AuthBar;