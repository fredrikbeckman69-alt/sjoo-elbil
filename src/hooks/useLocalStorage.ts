import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Hämta från localStorage vid första rendering
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Fel vid läsning av localStorage för nyckel "${key}":`, error);
      return initialValue;
    }
  });

  // Uppdatera localStorage när värdet ändras
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Fel vid sparande till localStorage för nyckel "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
