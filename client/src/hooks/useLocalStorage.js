import { useState, useEffect, useRef } from 'react';

/**
 * Пользовательский хук: синхронизация состояния с localStorage.
 * Загрузка — ленивый инициализатор useState (при монтировании).
 * Сохранение — с debounce (по умолчанию 500 мс), cleanup отменяет таймер.
 *
 * В лабе 5 этот хук можно заменить на работу с REST API.
 */
export function useLocalStorage(key, initialValue, debounceMs = 500) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        const initial =
          typeof initialValue === 'function' ? initialValue() : initialValue;
        // Сразу кладём начальные данные, чтобы ключ был виден в DevTools
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  // Пропускаем лишнюю запись сразу после инициализации из localStorage
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    const timerId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Не удалось сохранить в localStorage:', error);
      }
    }, debounceMs);

    // Cleanup: отмена таймера при новом изменении или размонтировании
    return () => clearTimeout(timerId);
  }, [key, value, debounceMs]);

  return [value, setValue];
}
