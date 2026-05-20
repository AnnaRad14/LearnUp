import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home({ openCourse, isAuth }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  const [priceFilter, setPriceFilter] = useState('Всі'); // 'Всі', 'Безкоштовні', 'Платні'
  const [userData, setUserData] = useState(null);

  // Синхронізуємо дані користувача з localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('learnup_user');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
  }, [isAuth]);

  // Завантажуємо всі курси з бази даних
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/courses');
        setCourses(response.data || []);
      } catch (error) {
        console.error("Помилка при завантаженні каталогу курсів:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllCourses();
  }, []);

  // Функція запису на курс
  const handleEnroll = async (courseId) => {
    if (!isAuth || !userData) {
      alert("Будь ласка, увійдіть в акаунт, щоб записатися на курс!");
      return;
    }

    const userId = userData.id || userData.userId || userData.email;

    try {
      const config = {};
      if (userData.token) {
        config.headers = { Authorization: `Bearer ${userData.token}` };
      }

      const response = await axios.post(
        `http://localhost:8080/api/users/${userId}/enroll`,
        { courseId: courseId },
        config
      );

      const updatedUserData = { ...userData, ...response.data };
      setUserData(updatedUserData);
      localStorage.setItem('learnup_user', JSON.stringify(updatedUserData));

      alert("🎉 Ви успішно записалися на курс! Тепер він відображається в Особистому кабінеті.");
    } catch (error) {
      console.error("Помилка при записі на курс:", error);
      alert("Не вдалося записатися на курс. Перевірте підключення до бекенду.");
    }
  };

  // 🔥 ВИПРАВЛЕНО: Повний список напрямків, тотожний конструктору курсів викладача
  const categories = [
    'Всі',
    'Java Spring Boot',
    'JavaScript / TypeScript',
    'React / Next.js',
    'Node.js',
    'Python Django / FastAPI',
    'Java Core',
    'Python Core',
    'C# / .NET',
    'C++',
    'Go Golang',
    'QA / Тестування',
    'Бази даних та SQL',
    'Mobile (Android / iOS)',
    'DevOps & Cloud',
    'UI/UX Дизайн'
  ];

  // Подвійна фільтрація списку каталогу (і за напрямком, і за типом ціни)
  const filteredCourses = courses.filter((course) => {
    const matchesCategory = selectedCategory === 'Всі' || course.category === selectedCategory;

    let matchesPrice = true;
    if (priceFilter === 'Безкоштовні') {
      matchesPrice = Number(course.price) === 0;
    } else if (priceFilter === 'Платні') {
      matchesPrice = Number(course.price) > 0;
    }

    return matchesCategory && matchesPrice;
  });

  // Вибираємо останні курси для блоку рекомендованих (обмежуємо жорстко до 3-х елементів)
  const recommendedCourses = courses.slice(-3).reverse().slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0f111a] text-white">
      {/* Промо-блок */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 px-3 py-1 bg-blue-950/50 border border-blue-900/30 rounded-full">
          Платформа майбутнього навчання
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Розвивай навички <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">без обмежень</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-base md:text-lg">
          Обирай курси від топових викладачів, навчайся на практиці та отримуй реальні знання для IT-кар'єри.
        </p>
      </section>

      {/* БЛОК: РЕКОМЕНДОВАНІ ПРОГРАМИ (максимум 3 курси) */}
      {!loading && courses.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-12 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400 text-lg">⭐</span>
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-gray-200">Рекомендовані курси</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => {
              const isEnrolled = userData?.unlockedCourseIds?.includes(course.id);
              return (
                <div
                  key={`rec-${course.id}`}
                  className="bg-gradient-to-b from-[#1c1f2f] to-[#161820] border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all"
                >
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl">
                    Рекомендовано 🔥
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900/40 rounded-md inline-block">
                      {course.category || 'Загальне'}
                    </span>
                    <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {course.title}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-800/60 flex justify-between items-center">
                    <span className="text-sm font-black text-white">
                      {course.price > 0 ? `${course.price} грн` : 'Безкоштовно'}
                    </span>
                    {isEnrolled ? (
                      <button
                        onClick={() => openCourse(course.id)}
                        className="px-3 py-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-xl transition-all cursor-pointer"
                      >
                        У кабінеті ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all border-none cursor-pointer"
                      >
                        Записатись
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Каталог курсів */}
      <main className="max-w-6xl mx-auto px-6 pb-24 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-5">
          <h2 className="text-2xl font-bold">Каталог навчальних програм</h2>

          {/* Перемикач фільтрації за ціною (Всі / Безкоштовні / Платні) */}
          <div className="flex bg-[#161820] p-1 rounded-xl border border-gray-800 text-xs self-start md:self-auto">
            {['Всі', 'Безкоштовні', 'Платні'].map((filter) => (
              <button
                key={filter}
                onClick={() => setPriceFilter(filter)}
                className={`px-3 py-1.5 font-bold rounded-lg cursor-pointer border-none transition-all ${
                  priceFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Напрямки навчання з підтримкою скролу, якщо кнопок забагато */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-[#161820] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 font-mono text-gray-500 text-sm">
            Завантаження курсів з бази даних...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-[#161820]/30 border border-gray-800 rounded-2xl text-gray-500 font-mono text-sm">
            Наразі немає курсів за обраними фільтрами.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = userData?.unlockedCourseIds?.includes(course.id);

              return (
                <div
                  key={course.id}
                  className="bg-[#161820] border border-gray-800/70 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-700 transition-all group relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-blue-500 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900/40 rounded-md">
                        {course.category || 'Загальне'}
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        👨‍🏫 {course.authorName || 'Анонім'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-sm text-gray-400 line-clamp-3">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-800/60 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Ціна програми</span>
                      <span className="text-base font-black text-white">
                        {course.price > 0 ? `${course.price} грн` : 'Безкоштовно'}
                      </span>
                    </div>

                    {isEnrolled ? (
                      <button
                        onClick={() => openCourse(course.id)}
                        className="px-4 py-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        У кабінеті ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/10 active:scale-[0.97] transition-all cursor-pointer border-none"
                      >
                        Записатись
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}