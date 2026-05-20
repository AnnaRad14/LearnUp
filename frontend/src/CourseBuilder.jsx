import React, { useState } from 'react';

export default function CourseBuilder({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Java Spring Boot');
  const [price, setPrice] = useState(0);

  // Структура уроку містить масив materials для безкінечного додавання
  const [modules, setModules] = useState([
    {
      moduleTitle: 'Модуль 1: Вступ',
      lessons: [{
        title: 'Урок 1',
        contentUrl: '',
        materials: [] // тут зберігаються конспекти та фото
      }]
    }
  ]);

  const addModule = () => {
    setModules([...modules, {
      moduleTitle: `Модуль ${modules.length + 1}: Новий модуль`,
      lessons: [{
        title: 'Урок 1',
        contentUrl: '',
        materials: []
      }]
    }]);
  };

  const removeModule = (moduleIndex) => {
    setModules(modules.filter((_, index) => index !== moduleIndex));
  };

  const handleModuleTitleChange = (index, value) => {
    const newModules = [...modules];
    newModules[index].moduleTitle = value;
    setModules(newModules);
  };

  const addLesson = (moduleIndex) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons.push({
      title: `Урок ${newModules[moduleIndex].lessons.length + 1}`,
      contentUrl: '',
      materials: []
    });
    setModules(newModules);
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
    setModules(newModules);
  };

  const handleLessonChange = (moduleIndex, lessonIndex, field, value) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex][field] = value;
    setModules(newModules);
  };

  // --- ФУНКЦІЇ ДЛЯ БЕЗКІНЕЧНИХ МАТЕРІАЛІВ ---

  const addMaterialField = (moduleIndex, lessonIndex, type) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex].materials.push({
      id: Date.now() + Math.random(), // Тимчасовий ключ для рендеру на клієнті
      type: type, // 'TEXT' або 'PHOTO'
      value: ''
    });
    setModules(newModules);
  };

  const removeMaterialField = (moduleIndex, lessonIndex, materialId) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex].materials = newModules[moduleIndex].lessons[lessonIndex].materials.filter(
      (m) => m.id !== materialId
    );
    setModules(newModules);
  };

  const handleMaterialValueChange = (moduleIndex, lessonIndex, materialId, value) => {
    const newModules = [...modules];
    const material = newModules[moduleIndex].lessons[lessonIndex].materials.find((m) => m.id === materialId);
    if (material) material.value = value;
    setModules(newModules);
  };

  const handleMaterialPhotoChange = (moduleIndex, lessonIndex, materialId, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleMaterialValueChange(moduleIndex, lessonIndex, materialId, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔥 ОНОВЛЕНА ФУНКЦІЯ ВІДПРАВКИ Даних
  const handleSubmit = (e) => {
    e.preventDefault();

    // Приводимо структуру до стандартного вигляду бекенду перед відправкою
    const cleanModules = modules.map(mod => ({
      title: mod.moduleTitle, // Конвертуємо у title для бекенду
      lessons: mod.lessons.map(les => ({
        title: les.title,
        contentUrl: les.contentUrl,
        // Видаляємо тимчасові id матеріалів, залишаючи тільки чисті поля type та value
        materials: les.materials.map(mat => ({
          type: mat.type,
          value: mat.value
        }))
      }))
    }));

    onSave({
      title,
      description,
      category,
      price: Number(price),
      modules: cleanModules // відправляємо правильний масив модулів
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#161820] w-full max-w-4xl rounded-2xl border border-gray-800/80 shadow-2xl max-h-[90vh] flex flex-col relative overflow-hidden">

        <div className="p-6 border-b border-gray-800/60 flex justify-between items-center bg-[#1a1c27]">
          <div>
            <h2 className="text-xl font-bold text-white">Конструктор нового курсу</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg bg-gray-800/40 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1f222f]/50 p-4 rounded-xl border border-gray-800/40">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">Назва курсу</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-4 py-2 bg-[#1f222f] border border-gray-700 rounded-xl text-white outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">Опис</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="mt-1 w-full px-4 py-2 bg-[#1f222f] border border-gray-700 rounded-xl text-white outline-none resize-none" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Категорія / Напрямок</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 bg-[#1f222f] border border-gray-700 rounded-xl text-white outline-none cursor-pointer focus:border-blue-500 transition-all"
              >
                <optgroup label="Веб-розробка та Фреймворки">
                  <option value="Java Spring Boot">☕ Java Spring Boot</option>
                  <option value="JavaScript / TypeScript">🟨 JavaScript / TypeScript</option>
                  <option value="React / Next.js">⚛️ React / Next.js</option>
                  <option value="Node.js">🟢 Node.js</option>
                  <option value="Python Django / FastAPI">🐍 Python (Django / FastAPI)</option>
                </optgroup>
                <optgroup label="Мови програмування">
                  <option value="Java Core">☕ Java Core</option>
                  <option value="Python Core">🐍 Python Core</option>
                  <option value="C# / .NET">🔷 C# / .NET</option>
                  <option value="C++">🦾 C++</option>
                  <option value="Go Golang">🐹 Go (Golang)</option>
                </optgroup>
                <optgroup label="Інші напрямки">
                  <option value="QA / Тестування">🧪 QA / Тестування</option>
                  <option value="Бази даних та SQL">🗄️ Бази даних & SQL</option>
                  <option value="Mobile (Android / iOS)">📱 Mobile (Android / iOS)</option>
                  <option value="DevOps & Cloud">☁️ DevOps & Cloud</option>
                  <option value="UI/UX Дизайн">🎨 UI/UX Дизайн</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Ціна (грн)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full px-4 py-2 bg-[#1f222f] border border-gray-700 rounded-xl text-white outline-none" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-blue-400 uppercase">Модулі курсу</h3>
              <button type="button" onClick={addModule} className="px-4 py-2 text-xs font-bold text-blue-400 bg-blue-950/30 border border-blue-900/50 rounded-xl cursor-pointer">+ Додати модуль</button>
            </div>

            {modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="bg-[#1f222f]/30 border border-gray-800 rounded-xl p-5 space-y-4">
                <div className="flex gap-4 items-center justify-between">
                  <input type="text" required value={module.moduleTitle} onChange={(e) => handleModuleTitleChange(moduleIndex, e.target.value)} className="w-full font-bold text-white bg-transparent border-b border-gray-700 outline-none pb-1" />
                  {modules.length > 1 && (
                    <button type="button" onClick={() => removeModule(moduleIndex)} className="text-xs text-red-400 cursor-pointer">Видалити</button>
                  )}
                </div>

                <div className="pl-6 border-l-2 border-gray-800 space-y-4">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="bg-[#1f222f]/80 p-5 rounded-xl border border-gray-800/60 space-y-4">

                      <div className="flex justify-between items-center gap-4">
                        <input type="text" required value={lesson.title} onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'title', e.target.value)} className="font-semibold text-sm text-gray-200 bg-transparent border-b border-transparent outline-none flex-1 focus:border-gray-700 pb-0.5" />
                        {module.lessons.length > 1 && (
                          <button type="button" onClick={() => removeLesson(moduleIndex, lessonIndex)} className="text-xs text-gray-500 hover:text-red-400 cursor-pointer">✕</button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {lesson.materials.map((material) => (
                          <div key={material.id}>
                            {material.type === 'TEXT' && (
                              <div className="relative">
                                <textarea
                                  value={material.value}
                                  onChange={(e) => handleMaterialValueChange(moduleIndex, lessonIndex, material.id, e.target.value)}
                                  rows="3"
                                  placeholder="Конспект або текстовий зміст уроку..."
                                  className="w-full text-xs px-3 py-2 bg-[#161820] border border-gray-800 rounded-lg text-white resize-none focus:border-blue-500/50 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeMaterialField(moduleIndex, lessonIndex, material.id)}
                                  className="absolute top-2 right-2 text-[10px] text-gray-500 hover:text-red-400"
                                >
                                  ✕ Прибрати
                                </button>
                              </div>
                            )}

                            {material.type === 'PHOTO' && (
                              <div className="p-3 bg-[#161820] border border-gray-800 rounded-lg space-y-2 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block">Супровідне foto до уроку</label>
                                <div className="flex items-center gap-4">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleMaterialPhotoChange(moduleIndex, lessonIndex, material.id, e.target.files[0])}
                                    className="block text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1f222f] file:text-gray-300 hover:file:bg-gray-800 cursor-pointer"
                                  />
                                  {material.value && (
                                    <div className="w-12 h-12 rounded-lg bg-[#1f222f] border border-gray-700 overflow-hidden shrink-0">
                                      <img src={material.value} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMaterialField(moduleIndex, lessonIndex, material.id)}
                                  className="absolute top-3 right-3 text-[10px] text-gray-500 hover:text-red-400"
                                >
                                  ✕ Прибрати
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex gap-4 pt-1">
                          <button
                            type="button"
                            onClick={() => addMaterialField(moduleIndex, lessonIndex, 'TEXT')}
                            className="text-[11px] font-semibold text-gray-400 hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            ➕ додавати конспект
                          </button>
                          <button
                            type="button"
                            onClick={() => addMaterialField(moduleIndex, lessonIndex, 'PHOTO')}
                            className="text-[11px] font-semibold text-gray-400 hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            ➕ додавати файл
                          </button>
                        </div>

                        <div className="pt-2 border-t border-gray-800/40">
                          <input
                            type="url"
                            value={lesson.contentUrl}
                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'contentUrl', e.target.value)}
                            placeholder="Посилання на відеоуроку (YouTube / Vimeo тощо якщо є)"
                            className="w-full text-xs px-3 py-2 bg-[#161820] border border-gray-800 rounded-lg text-white focus:border-blue-500/50 outline-none font-mono text-gray-400"
                          />
                        </div>

                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={() => addLesson(moduleIndex)} className="text-xs font-medium text-gray-400 hover:text-blue-400 flex items-center gap-1 pl-2 cursor-pointer">
                    + Додати урок до цього модуля
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-800 flex justify-end gap-3 bg-[#161820]">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-800/40 rounded-xl cursor-pointer">Скасувати</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer border-none">Створити курс</button>
          </div>
        </form>
      </div>
    </div>
  );
}