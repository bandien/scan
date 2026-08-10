(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BD_ChecklistRoutes = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function decode(value) {
    try { return decodeURIComponent(value); } catch (_) { return value; }
  }

  function encode(value) {
    return encodeURIComponent(String(value || '').trim());
  }

  function parseHash(hash) {
    const value = String(hash || '').replace(/^#/, '');
    const parts = value.split('/');
    if (parts[0] !== 'checklist') return null;

    return {
      scope: decode(parts[1] || 'all').trim().toLowerCase() || 'all',
      objectId: parts.length > 2 ? parts.slice(2).map(decode).join('/') : ''
    };
  }

  function buildHash(scope, objectId) {
    const normalizedScope = String(scope || 'all').trim().toLowerCase() || 'all';
    if (normalizedScope === 'all' && !objectId) return '#checklist';
    const objectPart = objectId ? '/' + encode(objectId) : '';
    return '#checklist/' + encode(normalizedScope) + objectPart;
  }

  function returnTo(scope, objectId) {
    return '../nhatky/' + buildHash(scope, objectId);
  }

  return { parseHash, buildHash, returnTo };
});
