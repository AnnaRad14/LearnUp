import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';
import Home from './Home';
import CourseDetails from './CourseDetails'; // Залишено один правильний імпорт

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('learnup_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const openCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setCurrentPage('course');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('learnup_user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('learnup_token', userData.token);
    }
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('learnup_user');
    localStorage.removeItem('learnup_token');
    setSelectedCourseId(null);
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] font-sans text-gray-100">
      <nav className="bg-[#161820] border-b border-gray-800/60 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => setCurrentPage('home')} className="flex items-center space-x-2 text-xl font-bold text-white cursor-pointer outline-none bg-transparent border-none">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span>LearnUp</span>
          </button>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => setCurrentPage('home')}
              className={`text-sm font-medium transition-colors cursor-pointer bg-transparent border-none ${currentPage === 'home' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              Головна
            </button>

            {user ? (
              <>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`text-sm font-medium transition-colors cursor-pointer bg-transparent border-none ${currentPage === 'dashboard' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Особистий кабінет
                </button>
                <button onClick={handleLogout} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer bg-transparent border-none">
                  Вийти
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentPage('auth')}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer shadow-lg shadow-blue-500/20 border-none"
              >
                Увійти
              </button>
            )}
          </div>
        </div>
      </nav>

      {currentPage === 'home' && <Home openCourse={openCourse} isAuth={!!user} />}
      {currentPage === 'auth' && <Auth onLoginSuccess={handleLoginSuccess} />}
      {currentPage === 'dashboard' && <Dashboard user={user} openCourse={openCourse} />}

      {currentPage === 'course' && (
        <CourseDetails
          courseId={selectedCourseId}
          user={user}
          onBack={() => setCurrentPage(user ? 'dashboard' : 'home')}
        />
      )}
    </div>
  );
}