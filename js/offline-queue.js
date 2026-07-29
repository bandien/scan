// Durable, allowlisted request queue for operational mutations.
(function (root) {
  'use strict';

  const STORAGE_KEY = 'bandien_offline_queue_v1';
  const ALLOWED_ACTIONS = new Set(['savePlan']);
  let transport = {
    post: root.bdsApiPost,
    fetch: root.bdsApiFetch
  };
  let flushing = false;
  let lastSyncedAt = null;

  function readQueue() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function writeQueue(queue) {
    if (queue.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    else localStorage.removeItem(STORAGE_KEY);
    publish();
  }

  function dedupeKey(action, payload) {
    const id = payload && (payload.PlanID || payload.planId || payload.id);
    return id ? `${action}:${id}` : null;
  }

  function state() {
    const pending = readQueue().length;
    return {
      pending,
      syncing: flushing,
      online: navigator.onLine,
      lastSyncedAt
    };
  }

  function publish() {
    root.dispatchEvent(new CustomEvent('bd-sync-state', { detail: state() }));
  }

  function enqueue(method, action, payload) {
    const queue = readQueue();
    const key = dedupeKey(action, payload);
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      method,
      action,
      payload: payload || {},
      dedupeKey: key,
      createdAt: new Date().toISOString(),
      attempts: 0
    };
    const existing = key ? queue.findIndex((entry) => entry.dedupeKey === key) : -1;
    if (existing >= 0) queue.splice(existing, 1, item);
    else queue.push(item);
    writeQueue(queue);
    return { status: 'success', queued: true, offline: true };
  }

  function isTransportFailure(error) {
    const message = String(error && error.message || error);
    return Boolean(
      error && (error.name === 'AbortError' || error.name === 'TypeError') ||
      /failed to fetch|networkerror|load failed|timeout|http 5\d\d/i.test(message)
    );
  }

  async function wrapped(method, action, payload, options) {
    const original = transport[method];
    if (!ALLOWED_ACTIONS.has(action)) return original(action, payload, options);
    if (!navigator.onLine) return enqueue(method, action, payload);
    try {
      return await original(action, payload, options);
    } catch (error) {
      if (isTransportFailure(error)) return enqueue(method, action, payload);
      throw error;
    }
  }

  async function flush() {
    if (flushing || !navigator.onLine) {
      publish();
      return state();
    }
    flushing = true;
    publish();
    try {
      let queue = readQueue();
      while (queue.length && navigator.onLine) {
        const item = queue[0];
        try {
          await transport[item.method](item.action, item.payload, { retries: 0 });
          queue.shift();
          writeQueue(queue);
        } catch (error) {
          item.attempts = (item.attempts || 0) + 1;
          item.lastError = String(error && error.message || error);
          writeQueue(queue);
          break;
        }
      }
      if (!queue.length) {
        lastSyncedAt = new Date().toISOString();
        try {
          localStorage.setItem('bandien_last_sync', lastSyncedAt);
        } catch (_) {}
      }
    } finally {
      flushing = false;
      publish();
    }
    return state();
  }

  function setTransport(next) {
    if (next && typeof next.post === 'function') transport.post = next.post;
    if (next && typeof next.fetch === 'function') transport.fetch = next.fetch;
  }

  root.bdsApiPost = (action, payload, options) => wrapped('post', action, payload, options);
  root.bdsApiFetch = (action, payload, options) => wrapped('fetch', action, payload, options);
  root.BD_OFFLINE_QUEUE = {
    flush,
    getState: state,
    setTransport
  };

  root.addEventListener('online', flush);
  root.addEventListener('offline', publish);
  document.addEventListener('DOMContentLoaded', () => {
    publish();
    if (navigator.onLine && readQueue().length) flush();
  });
})(window);
