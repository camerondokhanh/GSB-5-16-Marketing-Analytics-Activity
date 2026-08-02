(() => {
  'use strict';

  const unlockedSteps = new Set(['welcome', 'cleaning']);
  let currentView = 'welcome';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function setStepLock(step, locked) {
    const button = $(`.progress-step[data-step="${step}"]`);
    if (!button) return;
    button.disabled = locked;
    button.classList.toggle('is-locked', locked);
  }

  function unlock(step) {
    unlockedSteps.add(step);
    setStepLock(step, false);
  }

  function lock(step) {
    if (step === 'welcome' || step === 'cleaning') return;
    unlockedSteps.delete(step);
    setStepLock(step, true);
  }

  function isUnlocked(step) {
    return unlockedSteps.has(step);
  }

  function showView(name) {
    if (!isUnlocked(name)) return;

    currentView = name;
    $$('.view').forEach((view) => view.classList.remove('is-visible'));
    $(`#view-${name}`)?.classList.add('is-visible');

    $$('.progress-step[data-step]').forEach((step) => {
      step.classList.toggle('is-active', step.dataset.step === name);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindNavigation() {
    $$('[data-go]').forEach((element) => {
      element.addEventListener('click', () => showView(element.dataset.go));
    });

    $('#begin-button')?.addEventListener('click', () => showView('cleaning'));
  }

  function init() {
    setStepLock('sql', true);
    setStepLock('python', true);
    setStepLock('visualization', true);
    bindNavigation();
  }

  window.NorthstarApp = {
    $,
    $$,
    unlock,
    lock,
    isUnlocked,
    showView,
    getCurrentView: () => currentView
  };

  init();
})();
