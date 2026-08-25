export const storage = {
  get: async (key, parse = false) => {
    try {
      const value = localStorage.getItem(key);
      if (parse && value) {
        return { value: JSON.parse(value) };
      }
      return { value };
    } catch (e) {
      return { value: null };
    }
  },
  set: async (key, value, stringify = false) => {
    try {
      localStorage.setItem(key, stringify ? JSON.stringify(value) : value);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },
  remove: async (key) => {
    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
};

if (typeof window !== 'undefined') {
  window.storage = storage;
}
