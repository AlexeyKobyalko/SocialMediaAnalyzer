import { useState } from 'react';
import { login, register } from '../api';

function AuthPage({ onAuthSuccess, onBack }) {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isRegisterMode) {
                await register({ email, password, role });
            }

            const res = await login({ email, password });
            localStorage.setItem('token', res.data.token);
            onAuthSuccess(res.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Произошла ошибка при аутентификации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-page-card">
                <button type="button" className="btn-back" onClick={onBack}>
                    ← Назад к аналитике
                </button>

                <div className="auth-page-header">
                    <span className="brand-tag">SMA Security</span>
                    <h2>{isRegisterMode ? 'Создание учетной записи' : 'Вход в аккаунт'}</h2>
                    <p>
                        {isRegisterMode
                            ? 'Выберите роль для управления доступом к функциям системы'
                            : 'Введите свои учетные данные для авторизации в системе'}
                    </p>
                </div>

                <div className="auth-mode-switch">
                    <button
                        type="button"
                        className={`switch-btn ${!isRegisterMode ? 'active' : ''}`}
                        onClick={() => {
                            setIsRegisterMode(false);
                            setError(null);
                        }}
                    >
                        Войти
                    </button>
                    <button
                        type="button"
                        className={`switch-btn ${isRegisterMode ? 'active' : ''}`}
                        onClick={() => {
                            setIsRegisterMode(true);
                            setError(null);
                        }}
                    >
                        Регистрация
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-page-form">
                    <div className="auth-field">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label>Пароль</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {isRegisterMode && (
                        <div className="auth-field">
                            <label>Роль в системе</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="admin">Администратор (Полный CRUD доступ)</option>
                                <option value="user">Обычный пользователь (Только просмотр)</option>
                            </select>
                        </div>
                    )}

                    {error && <div className="auth-page-error">{error}</div>}

                    <button type="submit" className="btn btn-lime auth-submit-btn" disabled={loading}>
                        {loading
                            ? 'Обработка...'
                            : isRegisterMode
                                ? 'Зарегистрироваться и войти'
                                : 'Войти в систему'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AuthPage;