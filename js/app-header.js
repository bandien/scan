(function () {
  'use strict';

  const script = document.currentScript;
  const configuredBack = script && script.dataset.back
    ? script.dataset.back
    : ((script && script.dataset.root) || '') + 'index.html';

  function safeReturnTarget(candidate, fallback) {
    if (!candidate) return fallback;
    try {
      const target = new URL(candidate, window.location.href);
      return target.origin === window.location.origin ? candidate : fallback;
    } catch (_) {
      return fallback;
    }
  }

  const requestedReturn = new URLSearchParams(window.location.search).get('returnTo');
  const options = {
    title: script && script.dataset.title ? script.dataset.title : 'BanDienScan',
    subtitle: script && script.dataset.sub ? script.dataset.sub : '',
    icon: script && script.dataset.icon ? script.dataset.icon : 'bi-grid-fill',
    back: safeReturnTarget(requestedReturn, configuredBack)
  };

  function addStyles() {
    if (document.getElementById('bds-app-header-styles')) return;

    const style = document.createElement('style');
    style.id = 'bds-app-header-styles';
    style.textContent = `
      .bds-app-header {
        background: #0b4d5e;
        border-bottom: 1px solid rgba(255, 255, 255, .12);
        box-shadow: 0 2px 10px rgba(8, 40, 50, .16);
      }
      .bds-app-header__nav {
        width: 100%;
        max-width: 640px;
        min-height: 60px;
        margin: 0 auto;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .bds-app-header__back {
        min-width: 42px;
        min-height: 42px;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 1.5px solid rgba(255, 255, 255, .42);
        border-radius: 12px;
        background: rgba(255, 255, 255, .12);
        color: #fff;
        font-size: .82rem;
        font-weight: 700;
        text-decoration: none;
        flex-shrink: 0;
      }
      .bds-app-header__back:hover,
      .bds-app-header__back:focus-visible {
        border-color: rgba(255, 255, 255, .8);
        background: rgba(255, 255, 255, .2);
        color: #fff;
      }
      .bds-app-header__identity {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .bds-app-header__icon {
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(255, 255, 255, .14);
        color: #d1fae5;
        font-size: 1.2rem;
        flex-shrink: 0;
      }
      .bds-app-header__copy { min-width: 0; }
      .bds-app-header__title,
      .bds-app-header__subtitle {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .bds-app-header__title {
        color: #fff;
        font-size: .95rem;
        font-weight: 800;
        line-height: 1.25;
      }
      .bds-app-header__subtitle {
        margin-top: 2px;
        color: rgba(255, 255, 255, .74);
        font-size: .7rem;
        font-weight: 600;
      }
      @media (max-width: 390px) {
        .bds-app-header__nav { gap: 9px; padding-inline: 12px; }
        .bds-app-header__back { width: 42px; padding: 0; }
        .bds-app-header__back-label { display: none; }
        .bds-app-header__icon { width: 36px; height: 36px; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderHeader() {
    if (!document.body || document.querySelector('.bds-app-header')) return;
    addStyles();

    const header = document.createElement('header');
    header.className = 'bds-app-header';

    const nav = document.createElement('nav');
    nav.className = 'bds-app-header__nav';
    nav.setAttribute('aria-label', 'Điều hướng trang');

    const back = document.createElement('a');
    back.className = 'bds-app-header__back';
    back.href = options.back;
    back.setAttribute('aria-label', 'Quay lại màn hình trước');
    back.innerHTML = '<i class="bi bi-arrow-left" aria-hidden="true"></i><span class="bds-app-header__back-label">Quay lại</span>';

    const identity = document.createElement('div');
    identity.className = 'bds-app-header__identity';

    const icon = document.createElement('span');
    icon.className = 'bds-app-header__icon';
    icon.setAttribute('aria-hidden', 'true');
    const iconGlyph = document.createElement('i');
    iconGlyph.className = 'bi ' + options.icon;
    icon.appendChild(iconGlyph);

    const copy = document.createElement('div');
    copy.className = 'bds-app-header__copy';
    const title = document.createElement('div');
    title.className = 'bds-app-header__title';
    title.textContent = options.title;
    copy.appendChild(title);

    if (options.subtitle) {
      const subtitle = document.createElement('div');
      subtitle.className = 'bds-app-header__subtitle';
      subtitle.textContent = options.subtitle;
      copy.appendChild(subtitle);
    }

    identity.appendChild(icon);
    identity.appendChild(copy);
    nav.appendChild(back);
    nav.appendChild(identity);
    header.appendChild(nav);
    document.body.insertBefore(header, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader, { once: true });
  } else {
    renderHeader();
  }
})();
