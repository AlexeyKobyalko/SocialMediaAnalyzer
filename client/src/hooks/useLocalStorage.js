import { useState, useEffect, useRef } from 'react';
export function useLocalStorage(key, initialValue, debounceMs = 500) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        const initial =
          typeof initialValue === 'function' ? initialValue() : initialValue;
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

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

    return () => clearTimeout(timerId);
  }, [key, value, debounceMs]);

  return [value, setValue];
}
