
"use client";

import { useState, useEffect, useCallback } from 'react';

export function useStorageListener<T>(key: string, initialState: T): T {
  const [storedValue, setStoredValue] = useState<T>(initialState);

  const handleStorageChange = useCallback((event: StorageEvent | CustomEvent) => {
    let valueStr: string | null | undefined = null;
    let eventKey: string | null | undefined = null;

    if (event instanceof StorageEvent) {
      // Standard browser 'storage' event
      eventKey = event.key;
      valueStr = event.newValue;
    } else if (event instanceof CustomEvent && event.type === 'storage_change') {
      // Custom event dispatched by our storage service
      eventKey = event.detail.key;
      valueStr = event.detail.value;
    }

    if (eventKey !== key || valueStr === null || valueStr === undefined) {
      return;
    }
    
    try {
      setStoredValue(JSON.parse(valueStr));
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}" from event:`, error);
    }
  }, [key]);

  // Set initial value from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialState);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}" on mount:`, error);
      setStoredValue(initialState);
    }
  }, [key, initialState]);

  // Listen for changes from other tabs and from our own app
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage_change', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage_change', handleStorageChange);
    };
  }, [handleStorageChange]);

  return storedValue;
}
