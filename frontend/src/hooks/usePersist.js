import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export function usePersist(key, initialValue) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await storage.get(key, true);
      if (res && res.value) {
        setData(res.value);
      }
      setLoading(false);
    })();
  }, [key]);

  const save = async (nextValue) => {
    setData(nextValue);
    await storage.set(key, nextValue, true);
  };

  return [data, save, loading];
}
