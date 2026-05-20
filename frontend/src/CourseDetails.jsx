import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';

export default function CourseDetails({ courseId, user, onBack }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      try {
        const response = await axios.get('http://localhost:8080/api/courses');
        const foundCourse = response.data.find(c => c.id === courseId);
        setCourse(foundCourse);

        const flatLessons = [];
        foundCourse?.modules?.forEach((mod, mIdx) => {
          mod.lessons?.forEach((les, lIdx) => {
            const uniqueKey = `${courseId}_m${mIdx}_l${lIdx}`;
            flatLessons.push({ ...les, uniqueKey });
          });
        });
        setAllLessons(flatLessons);

        if (flatLessons.length > 0) {
          setActiveLesson(flatLessons[0]);
        }

        const savedUser = JSON.parse(localStorage.getItem('learnup_user')) || user;
        if (savedUser?.completedLessonIds) {
          setCompletedLessonIds(savedUser.completedLessonIds);
        }
      } catch (error) {
        console.error("Помилка завантаження курсів:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [courseId, user]);

  const markLessonAsComplete = async (lessonKey) => {
    const savedUser = JSON.parse(localStorage.getItem('learnup_user')) || user;
    if (!savedUser) {
      alert("Помилка: користувача не знайдено.");
      return;
    }

    let userId = savedUser.id || savedUser.userId || savedUser.email;
    if (!userId && savedUser.token) {
      try {
        const base64Url = savedUser.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        userId = decoded.id || decoded.sub || decoded.email;
      } catch (e) {
        console.error("Не вдалося розпарсити токен:", e);
      }
    }

    if (!userId) {
      console.error("Критично: ID користувача не визначено!", savedUser);
      return;
    }

    try {
      const config = {};
      if (savedUser.token) {
        config.headers = { Authorization: `Bearer ${savedUser.token}` };
      }

      const response = await axios.post(
        `http://localhost:8080/api/users/${userId}/lessons/complete`,
        { lessonTitle: lessonKey },
        config
      );

      const updatedUserData = { ...savedUser, ...response.data };
      localStorage.setItem('learnup_user', JSON.stringify(updatedUserData));
      setCompletedLessonIds(response.data.completedLessonIds || []);
    } catch (error) {
      console.error("Не вдалося зберегти прогрес уроку:", error);
    }
  };

  const triggerCelebration = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-mono text-sm">Завантаження...</div>;
  if (!course) return <div className="text-center py-20 text-red-400">Курс не знайдено.</div>;

  const currentIdx = allLessons.findIndex(l => l.uniqueKey === activeLesson?.uniqueKey);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allLessons.length - 1;

  const handleNext = () => {
    if (activeLesson) {
      markLessonAsComplete(activeLesson.uniqueKey);
    }
    if (hasNext) {
      setActiveLesson(allLessons[currentIdx + 1]);
    } else {
      const savedUser = JSON.parse(localStorage.getItem('learnup_user')) || user;
      if (savedUser) {
        const currentCompletedCourses = savedUser.completedCourseIds || [];
        if (!currentCompletedCourses.includes(courseId)) {
          const updatedUser = {
            ...savedUser,
            completedCourseIds: [...currentCompletedCourses, courseId]
          };
          localStorage.setItem('learnup_user', JSON.stringify(updatedUser));
        }
      }
      triggerCelebration();
      setIsSuccessModalOpen(true);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setActiveLesson(allLessons[currentIdx - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white flex flex-col md:flex-row relative">

      {/* ЛІВА ПАНЕЛЬ */}
      <aside className="w-full md:w-80 bg-[#161820] border-r border-gray-800/80 flex flex-col h-auto md:h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-5 border-b border-gray-800 bg-[#1a1c27]">
          <button onClick={onBack} className="text-xs text-gray-400 hover:text-white mb-3 bg-transparent border-none cursor-pointer flex items-center gap-1">
            ← В кабінет
          </button>
          <h2 className="text-base font-black text-white line-clamp-2">{course.title}</h2>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {course.modules?.map((module, mIndex) => (
            <div key={mIndex} className="space-y-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-1">
                {module.title || module.moduleTitle}
              </h3>
              <div className="space-y-0.5">
                {module.lessons?.map((lesson, lIndex) => {
                  const currentLessonKey = `${courseId}_m${mIndex}_l${lIndex}`;
                  const isActive = activeLesson?.uniqueKey === currentLessonKey;
                  const isDone = completedLessonIds.includes(currentLessonKey);

                  return (
                    <button
                      key={lIndex}
                      onClick={() => {
                        const found = allLessons.find(l => l.uniqueKey === currentLessonKey);
                        setActiveLesson(found || { ...lesson, uniqueKey: currentLessonKey });
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs font-medium rounded-xl flex items-center justify-between transition-all cursor-pointer border-none ${
                        isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-gray-400 hover:bg-[#1f222f] hover:text-white bg-transparent'
                      }`}
                    >
                      <span className="truncate pr-2">
                        📄 {lesson.title}
                      </span>
                      {isDone && <span className="text-emerald-400 font-bold text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ПРАВА ЧАСТИНА */}
      <main className="flex-1 p-6 md:p-10 flex flex-col justify-between h-auto md:h-[calc(100vh-64px)] bg-[#0f111a] overflow-y-auto">
        {activeLesson ? (
          <div className="max-w-4xl w-full mx-auto space-y-6 flex-1">

            <div className="border-b border-gray-800 pb-4 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold uppercase">Матеріали уроку</span>
                <h1 className="text-xl md:text-2xl font-black text-white mt-1">{activeLesson.title}</h1>
              </div>
              <button
                onClick={() => markLessonAsComplete(activeLesson.uniqueKey)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  completedLessonIds.includes(activeLesson.uniqueKey) ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-[#161820] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {completedLessonIds.includes(activeLesson.uniqueKey) ? '✓ Вивчено' : 'Позначити як вивчений'}
              </button>
            </div>

            {/* 1. БЛОК ВІДЕОПЛЕЄРА */}
            {(activeLesson.contentUrl || activeLesson.videoUrl) && (
              <div className="aspect-video w-full bg-[#161820] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl mb-6">
                {(() => {
                  const url = activeLesson.contentUrl || activeLesson.videoUrl;
                  if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    return <iframe className="w-full h-full border-none" src={url.replace("watch?v=", "embed/")} title={activeLesson.title} allowFullScreen />;
                  }
                  return (
                    <div className="p-6 text-center text-xs text-gray-500 break-all">
                      Відеоурок: <a href={url} target="_blank" rel="noreferrer" className="text-blue-400 underline">{url}</a>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 🔥 2. ДИНАМІЧНИЙ ВМІСТ УРОКУ (БЕЗКІНЕЧНІ КОНСПЕКТИ ТА ФОТО З МАСИВУ) */}
            {activeLesson.materials && activeLesson.materials.length > 0 ? (
              <div className="space-y-6">
                {activeLesson.materials.map((material, idx) => {
                  if (material.type === 'TEXT') {
                    return (
                      <div key={idx} className="bg-[#161820] border border-gray-800/60 rounded-2xl p-6 md:p-8 shadow-xl">
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{material.value}</p>
                      </div>
                    );
                  }
                  if (material.type === 'PHOTO') {
                    return (
                      <div key={idx} className="w-full bg-[#161820] border border-gray-800/60 rounded-2xl p-2 shadow-xl max-h-[500px] overflow-hidden flex justify-center items-center">
                        <img
                          src={material.value}
                          alt={`Матеріал до уроку №${idx + 1}`}
                          className="max-w-full max-h-[480px] object-contain rounded-xl"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              /* Слот зворотної сумісності для старих курсів, що вже є в БД */
              <div className="space-y-6">
                {activeLesson.photo && (
                  <div className="w-full bg-[#161820] border border-gray-800/60 rounded-2xl p-2 shadow-xl max-h-[500px] overflow-hidden flex justify-center items-center">
                    <img src={activeLesson.photo} alt="Матеріал до уроку" className="max-w-full max-h-[480px] object-contain rounded-xl" />
                  </div>
                )}
                {activeLesson.textContent && (
                  <div className="bg-[#161820] border border-gray-800/60 rounded-2xl p-6 md:p-8 shadow-xl">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson.textContent}</p>
                  </div>
                )}
              </div>
            )}

            {/* НАВІГАЦІЯ ЗНИЗУ */}
            <div className="pt-8 mt-10 border-t border-gray-800 flex justify-between items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={!hasPrev}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border-none ${
                  hasPrev ? 'bg-[#161820] text-white hover:bg-[#1f222f] cursor-pointer' : 'bg-gray-800/20 text-gray-600 cursor-not-allowed'
                }`}
              >
                ← Попередній урок
              </button>
              <span className="text-xs text-gray-500 font-mono">
                Урок {currentIdx + 1} з {allLessons.length}
              </span>
              <button
                onClick={handleNext}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer border-none ${
                  hasNext ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/10'
                }`}
              >
                {hasNext ? 'Наступний урок →' : 'Завершити курс 🎉'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 font-mono text-sm">Оберіть урок із лівого меню</div>
        )}
      </main>

      {/* МОДАЛЬНЕ ВІКНО ЗАВЕРШЕННЯ */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#161820] border border-emerald-500/30 w-full max-w-md rounded-2xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full" />
            <div className="text-6xl">🎓</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Вітаємо з випуском!</h3>
              <p className="text-gray-400 text-sm">Ти успішно завершив курс <br /><span className="text-emerald-400 font-bold">"{course?.title}"</span></p>
            </div>
            <p className="text-xs text-gray-500 font-mono bg-[#0f111a] p-3 rounded-xl border border-gray-800">
              🚀 Усі модулі та практичні матеріали пройдено. Твій скіл офіційно прокачано на новий рівень!
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  onBack();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all border-none cursor-pointer shadow-lg shadow-blue-500/20"
              >
                Круто, повернутись до кабінету
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}