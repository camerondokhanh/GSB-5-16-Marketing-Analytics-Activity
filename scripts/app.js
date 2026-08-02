(() => {
  'use strict';

  const WORKFLOW_STORAGE_KEY = 'mccarthys-workflow-v1';
  const unlockedSteps = new Set(['welcome', 'cleaning']);
  let currentView = 'welcome';
  let workflow = loadWorkflow();

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function loadWorkflow() {
    try {
      const saved = JSON.parse(localStorage.getItem(WORKFLOW_STORAGE_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (_) {
      return {};
    }
  }

  function saveWorkflow() {
    try {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflow));
    } catch (_) {}
  }

  function setWorkflowValue(key, value) {
    workflow[key] = value;
    saveWorkflow();
  }

  function getWorkflowValue(key) {
    return workflow[key];
  }

  function clearWorkflowValue(key) {
    delete workflow[key];
    saveWorkflow();
  }

  function clearWorkflow() {
    workflow = {};
    try { localStorage.removeItem(WORKFLOW_STORAGE_KEY); } catch (_) {}
  }

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

  window.MarketingAnalyticsApp = {
    $,
    $$,
    unlock,
    lock,
    isUnlocked,
    showView,
    setWorkflowValue,
    getWorkflowValue,
    clearWorkflowValue,
    clearWorkflow,
    getCurrentView: () => currentView
  };

  init();
})();
