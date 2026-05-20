import React, { useState } from 'react';
import { authService } from './api/auth';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // Перемикач між Входом та Реєстрацією
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const data = await authService.login(email, password);
        setSuccess(`Вітаємо, ${data.fullName}! Ви успішно увійшли.`);

        // МАГІЯ ТУТ: передаємо дані користувача в App.jsx, щоб змінилась сторінка
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess(data);
          }, 1000); // даємо 1 секунду порадіти зеленому напису і перемикаємо
        }
      } else {
        const data = await authService.register(fullName, email, password, role);
        setSuccess('Реєстрація успішна! Тепер увійдіть у свій акаунт.');

        // Після реєстрації автоматично перемикаємо на форму входу через 1.5 секунди
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
          setError('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Щось пішло не так. Перевірте дані.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] px-4 font-sans text-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#161820] rounded-2xl shadow-2xl border border-gray-800/60 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-blue-500 before:to-cyan-400">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            {isLogin ? 'Вхід у LearnUp' : 'Створення акаунту'}
          </h2>
          <p className="mt-3 text-center text-sm text-gray-400">
            {isLogin ? 'Новий користувач? ' : 'Вже маєте акаунт? '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className="font-semibold text-blue-400 hover:text-blue-300 transition-colors underline cursor-pointer decoration-blue-500/50"
            >
              {isLogin ? 'Зареєструватися' : 'Увійти'}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 rounded-xl text-sm font-medium">
              {success}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Повне ім'я</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 bg-[#1f222f] border border-gray-700/70 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="Іван Іванов"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email адреса</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 bg-[#1f222f] border border-gray-700/70 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 bg-[#1f222f] border border-gray-700/70 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Хто ви?</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 bg-[#1f222f] border border-gray-700/70 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="STUDENT" className="bg-[#161820]">Я хочу навчатися (Студент)</option>
                  <option value="TEACHER" className="bg-[#161820]">Я хочу викладати (Викладач)</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 mt-6 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#161820] focus:ring-blue-500 cursor-pointer transition-all duration-150"
          >
            {isLogin ? 'Увійти' : 'Створити акаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}