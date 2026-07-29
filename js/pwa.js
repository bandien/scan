(function () {
  'use strict';
  const script = document.currentScript;
  const root = (script && script.dataset.root) || './';
  let installPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(root + 'sw.js', { scope: root })
        .catch((error) => console.warn('Không đăng ký được Service Worker:', error));
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => { installPrompt = null; });

  window.BD_PWA = {
    canInstall: () => Boolean(installPrompt),
    promptInstall: async () => {
      if (!installPrompt) return { supported: false };
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      installPrompt = null;
      return { supported: true, outcome: choice.outcome };
    }
  };
})();

