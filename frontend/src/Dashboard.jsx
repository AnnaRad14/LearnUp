import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CourseBuilder from './CourseBuilder';

export default function Dashboard({ user, openCourse }) {
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN';

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [courses, setCourses] = useState([]);

  // Стейти для admin-панелі
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin-stats' : 'my-courses');
  const [allUsers, setAllUsers] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalEarnings: 0
  });

  // Стейт для даних користувача
  const [currentUserData, setCurrentUserData] = useState(() => {
    return JSON.parse(localStorage.getItem('learnup_user')) || user;
  });

  // Стейт для редагування профілю
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUserData?.fullName || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUserData?.avatar || '');

  const completedLessons = currentUserData?.completedLessonIds || [];
  const completedCourseIds = currentUserData?.completedCourseIds || [];

  const defaultAvatars = ['🚀', '💻', '🦊', '🎨', '🧠', '🥷', '🦁', '🌟'];

  // Повний фіксований список усіх тем платформи
  const allCategories = [
    "Java Spring Boot",
    "JavaScript / TypeScript",
    "React / Next.js",
    "Node.js",
    "Python Django / FastAPI",
    "Java Core",
    "Python Core",
    "C# / .NET",
    "C++",
    "Go Golang",
    "QA / Тестування",
    "Бази даних та SQL",
    "Mobile (Android / iOS)",
    "DevOps & Cloud",
    "UI/UX Дизайн"
  ];

  // Гнучкий підрахунок глобальної статистики платформи
  const updateGlobalStats = (usersList, coursesList) => {
    const students = usersList.filter(u => u.role && u.role.toUpperCase() === 'STUDENT').length;
    const earnings = coursesList.reduce((sum, c) => sum + (c.price || 0), 0);

    setGlobalStats({
      totalStudents: students,
      totalCourses: coursesList.length,
      totalEarnings: earnings
    });
  };

  // Розрахунок кількості курсів для ВСІХ тем (навіть якщо курсів 0)
  const getCoursesCountByCategory = () => {
    return allCategories.map(cat => {
      const count = courses.filter(c => c.category?.trim().toLowerCase() === cat.trim().toLowerCase()).length;
      return { name: cat, count: count };
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const savedUser = JSON.parse(localStorage.getItem('learnup_user')) || user;
      if (!savedUser) return;

      const userId = savedUser.id || savedUser.userId || savedUser.email;
      if (!userId) return;

      const config = { headers: {} };
      if (savedUser.token) {
        config.headers.Authorization = savedUser.token.startsWith('Bearer ')
          ? savedUser.token
          : `Bearer ${savedUser.token}`;
      }

      try {
        const userResponse = await axios.get(`http://localhost:8080/api/users/${userId}`, config);
        if (userResponse.data) {
          const updatedUser = { ...savedUser, ...userResponse.data };
          if (JSON.stringify(updatedUser) !== JSON.stringify(savedUser)) {
            localStorage.setItem('learnup_user', JSON.stringify(updatedUser));
            setCurrentUserData(updatedUser);
          }
        }
      } catch (error) {
        console.log("Працюємо на локальних даних профілю.");
      }

      try {
        const coursesResponse = await axios.get('http://localhost:8080/api/courses', config);
        const allCourses = coursesResponse.data || [];

        if (savedUser?.role === 'ADMIN') {
          try {
            const usersResponse = await axios.get('http://localhost:8080/api/users/admin/users', config);
            const usersList = usersResponse.data || [];
            setAllUsers(usersList);
            updateGlobalStats(usersList, allCourses);
          } catch (adminErr) {
            console.error("Помилка завантаження адмін-даних:", adminErr);
          }
        }

        if (savedUser?.role === 'ADMIN') {
          setCourses(allCourses);
        } else if (isTeacher) {
          const teacherCourses = allCourses.filter(c => c.authorId === userId || c.authorName === "Anton" || c.authorName === savedUser.fullName);
          setCourses(teacherCourses);
        } else {
          const enrolledIds = savedUser?.unlockedCourseIds || [];
          const studentCourses = allCourses.filter(c => enrolledIds.includes(c.id));
          setCourses(studentCourses);
        }
      } catch (e) {
        console.error("Помилка завантаження курсів:", e);
      }
    };

    fetchDashboardData();
  }, [user?.id, user?.role, isBuilderOpen]);

  const handleToggleRole = async (userId, currentRole) => {
    const savedUser = JSON.parse(localStorage.getItem('learnup_user')) || user;
    const newRole = currentRole.toUpperCase() === 'STUDENT' ? 'TEACHER' : 'STUDENT';

    const config = { headers: {} };
    if (savedUser?.token) {
      config.headers.Authorization = savedUser.token.startsWith('Bearer ') ? savedUser.token : `Bearer ${savedUser.token}`;
    }

    try {
      await axios.put(`http://localhost:8080/api/users/admin/users/${userId}/role`, { role: newRole }, config);
      const updatedUsers = allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u);
      setAllUsers(updatedUsers);

      const currentCoursesResponse = await axios.get('http://localhost:8080/api/courses', config);
      updateGlobalStats(updatedUsers, currentCoursesResponse.data || []);
    } catch (err) {
      console.error(err);
      alert("Не вдалося змінити роль.");
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (window.confirm(`Ви впевнені, що хочете видалити курс "${courseTitle}"?`)) {
      const savedUser = JSON.parse(localStorage.getItem('learnup_user')) || user;
      const config = { headers: {} };
      if (savedUser?.token) {
        config.headers.Authorization = savedUser.token.startsWith('Bearer ') ? savedUser.token : `Bearer ${savedUser.token}`;
      }

      try {
        await axios.delete(`http://localhost:8080/api/courses/${courseId}`, config);
        const updatedCourses = courses.filter(course => course.id !== courseId);
        setCourses(updatedCourses);

        const refreshedCoursesResponse = await axios.get('http://localhost:8080/api/courses', config);
        updateGlobalStats(allUsers, refreshedCoursesResponse.data || []);
      } catch (error) {
        console.error(error);
        alert("Не вдалося видалити курс.");
      }
    }
  };

  //  ВСТАВИТИ ЦЕЙ ВАРІАНТ:
    const handleSaveNewCourse = async (cleanCourseData) => {
        try {
          // Підставляємо реальні дані авторизованого викладача, який створює курс
          const courseWithAuthor = {
            ...cleanCourseData,
            authorId: currentUserData?.id || currentUserData?.userId || "64f1b5_ANTON_ID",
            authorName: currentUserData?.fullName || currentUserData?.name || "Anton",
            status: "PENDING" // Новий курс завжди йде на модерацію до адміна
          };

          const response = await axios.post('http://localhost:8080/api/courses', courseWithAuthor);

          if (response.status === 200 || response.status === 201) {
            alert("Курс успішно створено та відправлено на модерацію адміну!");
            setIsBuilderOpen(false); // Закриваємо модалку конструктора

            // Оновлюємо список курсів на сторінці дешборду, щоб викладач одразу побачив свій новий курс
            if (isTeacher) {
              const res = await axios.get(`http://localhost:8080/api/courses/teacher/${courseWithAuthor.authorId}`);
              setCourses(res.data);
            } else {
              const res = await axios.get('http://localhost:8080/api/courses');
              setCourses(res.data);
            }
          }
        } catch (error) {
          console.error("Помилка під час збереження курсу через дешборд:", error);
          alert("Не вдалося зберегти курс. Перевірте з'єднання з бекендом.");
        }
      };

  const calculateProgress = (course) => {
    let totalLessons = 0;
    let completedCount = 0;
    course.modules?.forEach((mod, mIdx) => {
      mod.lessons?.forEach((les, lIdx) => {
        totalLessons++;
        const uniqueKey = `${course.id}_m${mIdx}_l${lIdx}`;
        if (completedLessons.includes(uniqueKey) || completedLessons.includes(les.title)) {
          completedCount++;
        }
      });
    });
    return totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  };

  const getCourseGraduatesCount = (course) => {
    if (course.authorId === (currentUserData?.id || currentUserData?.email) && !course.id.toString().includes('-')) {
      return 0;
    }
    const hash = course.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 24) + 6;
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const savedUser = JSON.parse(localStorage.getItem('learnup_user')) || user;
    const userId = savedUser?.id || savedUser?.userId || savedUser?.email;

    if (!userId) return;

    const payload = { fullName: profileName, avatar: profileAvatar };
    const config = { headers: {} };
    if (savedUser?.token) {
      config.headers.Authorization = savedUser.token.startsWith('Bearer ') ? savedUser.token : `Bearer ${savedUser.token}`;
    }

    try {
      const response = await axios.put(`http://localhost:8080/api/users/${userId}`, payload, config);
      if (response.data) {
        const updatedSessionUser = { ...savedUser, ...response.data, token: savedUser.token };
        localStorage.setItem('learnup_user', JSON.stringify(updatedSessionUser));
        setCurrentUserData(updatedSessionUser);
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const totalCompletedCourses = courses.filter(c => calculateProgress(c) === 100 || completedCourseIds.includes(c.id)).length;
  const totalCoursesInProgress = Math.max(0, courses.length - totalCompletedCourses);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-[#161820] p-8 rounded-2xl border border-gray-800/60 shadow-2xl relative overflow-hidden">

        {/* ШАПКА ПРОФІЛЮ */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1f222f] border border-gray-700/60 flex items-center justify-center text-3xl overflow-hidden shadow-inner shrink-0">
              {currentUserData?.avatar ? (
                currentUserData.avatar.length <= 4 ? (
                  currentUserData.avatar
                ) : (
                  <img src={currentUserData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                )
              ) : (
                '🎓'
              )}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Особистий кабінет</h2>
              <p className="text-gray-400 mt-1">Раді бачити тебе, <span className="text-blue-400 font-bold">{currentUserData?.fullName || 'Користувач'}</span>!</p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Роль: {isAdmin ? '👑 Адміністратор' : isTeacher ? '👨‍🏫 Викладач' : '👨‍🎓 Студент'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setProfileName(currentUserData?.fullName || '');
                setProfileAvatar(currentUserData?.avatar || '');
                setIsEditingProfile(!isEditingProfile);
              }}
              className="px-4 py-3 text-sm font-bold bg-[#1f222f] hover:bg-[#282b3d] text-gray-300 hover:text-white rounded-xl transition-all border border-gray-700/50 cursor-pointer"
            >
              {isEditingProfile ? '❌ Закрити редагування' : '⚙️ Налаштувати профіль'}
            </button>

            {isTeacher && (
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="px-5 py-3 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl shadow-lg cursor-pointer border-none"
              >
                + Створити курс
              </button>
            )}
          </div>
        </div>

        {/* ГОРИЗОНТАЛЬНА НАВІГАЦІЯ */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 mt-6 bg-[#0f111a] p-1.5 rounded-xl border border-gray-800/80 max-w-max">

            <button
              onClick={() => setActiveTab('admin-stats')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${activeTab === 'admin-stats' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white bg-transparent'}`}
            >
              📊 Статистика платформи
            </button>
            <button
              onClick={() => setActiveTab('admin-users')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${activeTab === 'admin-users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white bg-transparent'}`}
            >
              👥 Користувачі ({allUsers.length})
            </button>
          </div>
        )}

        <hr className="border-gray-800 my-8" />

        {/* ФОРМА РЕДАГУВАННЯ ПРОФІЛЮ */}
        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="bg-[#1f222f]/60 border border-gray-800 p-6 md:p-8 rounded-2xl max-w-2xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Редагування профілю</h3>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Аватар профілю</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#161820] border border-gray-700 flex items-center justify-center text-3xl overflow-hidden shrink-0">
                  {profileAvatar ? (
                    profileAvatar.length <= 4 ? profileAvatar : <img src={profileAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : '🎓'}
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {defaultAvatars.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setProfileAvatar(av)}
                        className={`w-8 h-8 rounded-lg bg-[#161820] hover:bg-gray-800 text-sm border flex items-center justify-center transition-all cursor-pointer ${profileAvatar === av ? 'border-blue-500' : 'border-gray-700'}`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Повне ім'я</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#161820] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1 opacity-60">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Email (не змінюється)</label>
                <input
                  type="email"
                  value={currentUserData?.email || 'email@example.com'}
                  disabled
                  className="w-full px-4 py-2.5 text-sm bg-[#161820] border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer border-none shadow-lg shadow-blue-500/10"
              >
                Зберегти зміни
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-5 py-2.5 text-xs font-bold bg-transparent text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer border-none"
              >
                Скасувати
              </button>
            </div>
          </form>
        ) : (
          <div>

            {/* АДМІН-ВКЛАДКА 1: ДІАГРАМА РОЗПОДІЛУ КУРСІВ ЗА ВСІМА ТЕМАМИ */}
            {isAdmin && activeTab === 'admin-stats' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Загальні показники */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-[#1f222f] border border-gray-700/40 rounded-xl">
                    <h4 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Всього студентів</h4>
                    <p className="text-3xl font-black text-white mt-2 font-mono">{globalStats.totalStudents}</p>
                  </div>
                  <div className="p-6 bg-[#1f222f] border border-gray-700/40 rounded-xl">
                    <h4 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Загальна кількість курсів</h4>
                    <p className="text-3xl font-black text-purple-400 mt-2 font-mono">{globalStats.totalCourses}</p>
                  </div>
                  <div className="p-6 bg-[#1f222f] border border-gray-700/40 rounded-xl">
                    <h4 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Оборот платформи</h4>
                    <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{globalStats.totalEarnings} UAH</p>
                  </div>
                </div>

                {/* Повна діаграма тем */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-5 tracking-wide">Розподіл курсів за категоріями</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {getCoursesCountByCategory().map((cat) => (
                      <div key={cat.name} className="p-5 bg-[#1f222f] border border-gray-800/80 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[130px] group hover:border-gray-700 transition-all shadow-md">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-white text-sm tracking-wide leading-tight group-hover:text-blue-400 transition-colors">
                            {cat.name}
                          </h4>
                          <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-xs shrink-0">
                            💻
                          </div>
                        </div>

                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className={`text-3xl font-black font-mono tracking-tight ${cat.count > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                            {cat.count}
                          </span>
                          <span className="text-gray-500 text-xs font-medium">
                            Курсів
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* АДМІН-ВКЛАДКА 2: УПРАВЛІННЯ КОРИСТУВАЧАМИ */}
            {isAdmin && activeTab === 'admin-users' && (
              <div className="bg-[#1f222f]/40 rounded-2xl border border-gray-800 overflow-x-auto animate-in fade-in duration-200">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#1a1c27] text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-800">
                      <th className="p-4 pl-6">Користувач</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Поточна роль</th>
                      <th className="p-4 pr-6 text-right">Управління</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-800/60">
                    {allUsers.map(u => (
                      <tr key={u.id || u.email} className="hover:bg-[#1f222f]/60 transition-colors">
                        <td className="p-4 pl-6 font-bold text-white">{u.fullName || 'Без імені'}</td>
                        <td className="p-4 text-gray-400 font-mono text-xs">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 text-[9px] rounded-md font-mono font-bold tracking-wide uppercase ${u.role?.toUpperCase() === 'TEACHER' ? 'bg-purple-950/60 text-purple-300 border border-purple-900/40' : u.role?.toUpperCase() === 'ADMIN' ? 'bg-amber-950/60 text-amber-300 border border-amber-900/40' : 'bg-blue-950/60 text-blue-300 border border-blue-900/40'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {u.role?.toUpperCase() !== 'ADMIN' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u.id || u.email, u.role)}
                              className="px-3 py-1.5 bg-[#161820] hover:bg-gray-800 border border-gray-700/60 text-xs text-white rounded-lg transition-all cursor-pointer"
                            >
                              Зробити {u.role?.toUpperCase() === 'STUDENT' ? 'Викладачем' : 'Студентом'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-600 italic">Головний admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ЗВИЧАЙНА СТУДЕНТСЬКА / ВИКЛАДАЦЬКА ВКЛАДКА */}
            {activeTab === 'my-courses' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xl font-bold text-white">
                    {isTeacher ? 'Мої навчальні програми' : 'Моє навчання (Активні курси)'}
                  </h3>

                  {courses.length === 0 ? (
                    <div className="p-8 bg-[#1f222f]/50 border border-gray-800 rounded-xl text-center text-sm text-gray-500 font-mono">
                      {isTeacher ? 'У вас поки немає створених курсів.' : 'Ви ще не записалися на жоден курс.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {courses.map((course) => {
                        const progress = calculateProgress(course);
                        const isFinished = progress === 100 || completedCourseIds.includes(course.id);
                        const graduatesCount = getCourseGraduatesCount(course);

                        return (
                          <div key={course.id} className={`p-5 bg-[#1f222f] border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${isFinished && !isTeacher ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-gray-700/40'}`}>
                            <div className="flex-1 w-full">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-md">
                                  {course.category || 'Загальне'}
                                </span>

                                {isTeacher && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-950/60 text-purple-400 border border-purple-900/40 rounded-md flex items-center gap-1">
                                    🎓 Випустилось: <span className="font-mono font-black text-white bg-purple-900/60 px-1 rounded">{graduatesCount}</span> студентів
                                  </span>
                                )}

                                {isFinished && !isTeacher && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-md">
                                    Завершено 🎓
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-white text-lg mt-2">{course.title}</h4>

                              {!isTeacher && (
                                <div className="mt-3 max-w-md flex items-center gap-3">
                                  <div className="w-full bg-[#161820] h-2 rounded-full overflow-hidden border border-gray-800">
                                    <div
                                      className={`h-full transition-all duration-500 ${isFinished ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                      style={{ width: `${isFinished ? 100 : progress}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs font-bold font-mono min-w-[35px] text-right ${isFinished ? 'text-emerald-400' : 'text-blue-400'}`}>
                                    {isFinished ? 100 : progress}%
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                              {isTeacher && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCourse(course.id, course.title)}
                                  className="px-4 py-2.5 text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl hover:bg-red-900/60 hover:text-red-300 transition-all cursor-pointer"
                                >
                                  🗑️ Видалити
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openCourse(course.id)}
                                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl border-none cursor-pointer transition-all ${isFinished && !isTeacher ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md' : 'bg-blue-600 hover:bg-blue-500'}`}
                              >
                                {isTeacher ? 'Керувати' : isFinished ? 'Повторити 🎉' : 'Продовжити навчання →'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* БЛОК СТАТИСТИКИ (ПРАВИЙ) */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Статистика</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-[#1f222f] border border-gray-700/40 rounded-xl relative overflow-hidden group hover:border-blue-500/20 transition-all">
                      <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider">
                        {isTeacher ? 'Всього курсів' : 'Курсів у процесі'}
                      </h4>
                      <p className="text-3xl font-black text-blue-400 mt-1 transition-transform group-hover:scale-105 origin-left">
                        {isTeacher ? courses.length : totalCoursesInProgress}
                      </p>
                    </div>

                    {!isTeacher && (
                      <div className="p-6 bg-[#1f222f] border border-gray-700/40 rounded-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider">Завершено уроків</h4>
                        <p className="text-3xl font-black text-emerald-400 mt-1 font-mono transition-transform group-hover:scale-105 origin-left">
                          {completedLessons.length}
                        </p>
                      </div>
                    )}

                    {!isTeacher && (
                      <div className="p-6 bg-[#1f222f] border border-gray-700/40 rounded-xl relative overflow-hidden group hover:border-purple-500/20 transition-all">
                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider">Завершено курсів</h4>
                        <p className="text-3xl font-black text-purple-400 mt-1 font-mono transition-transform group-hover:scale-105 origin-left">
                          {totalCompletedCourses}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isBuilderOpen && (
        <CourseBuilder
          onClose={() => setIsBuilderOpen(false)}
          onSave={handleSaveNewCourse}
        />
      )}
    </main>
  );
}