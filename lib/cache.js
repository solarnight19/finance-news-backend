// Simple in-memory cache for Vercel functions
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class SimpleCache {
  static set(key, data) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static get(key) {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }

    return item.data;
  }

  static clear() {
    cache.clear();
  }
}