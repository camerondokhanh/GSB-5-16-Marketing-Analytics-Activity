(() => {
  'use strict';

  const app = window.NorthstarApp;
  const engine = window.NorthstarPythonEngine;
  const config = window.NORTHSTAR_PYTHON_CONFIG;
  const data = window.NORTHSTAR_PYTHON_DATA;

  if (!app || !engine || !config || !data) {
    console.error('Python challenge dependencies did not load.');
    return;
  }

  const { $ } = app;
  const state = {
    code: config.starterCode,
    attempts: 0,
    completed: false,
    engineReady: false,
    selectedCampaign: ''
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(config.storageKey) || '{}');
      state.code = typeof saved.code === 'string' ? saved.code : config.starterCode;
      state.attempts = Number.isFinite(saved.attempts) ? saved.attempts : 0;
      state.completed = Boolean(saved.completed);
    } catch (_) {}
  }

  function saveState() {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify({
        code: state.code,
        attempts: state.attempts,
        completed: state.completed
      }));
    } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatValue(key, value) {
    if (['predicted_conversion_rate', 'profit_margin', 'email_open_rate'].includes(key)) {
      return `${Math.round(Number(value) * 100)}%`;
    }
    if (['average_order_value', 'contact_cost'].includes(key)) {
      return `$${Number(value).toFixed(Number.isInteger(Number(value)) ? 0 : 2)}`;
    }
    return value;
  }

  function renderDataTable() {
    const columns = [
      'campaign_id',
      'segment',
      'audience_size',
      'predicted_conversion_rate',
      'average_order_value',
      'profit_margin',
      'contact_cost',
      'email_open_rate',
      'avg_site_visits'
    ];

    const head = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
    const body = data.map((row) => {
      const selected = row.campaign_id === state.selectedCampaign ? ' class="python-selected-row"' : '';
      const cells = columns.map((column) => {
        const value = formatValue(column, row[column]);
        const numeric = typeof row[column] === 'number' ? ' class="number"' : '';
        return `<td${numeric}>${escapeHtml(value)}</td>`;
      }).join('');
      return `<tr${selected}>${cells}</tr>`;
    }).join('');

    $('#python-data-table').innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    $('#python-row-count').textContent = `${data.length} rows`;
  }

  function syncFromWorkflow() {
    state.selectedCampaign = String(app.getWorkflowValue('selectedCampaign') || '');
    const campaignLabel = state.selectedCampaign || 'not selected yet';
    $('#python-selected-campaign').textContent = campaignLabel;
    $('#python-handoff-value').textContent = campaignLabel;
    renderDataTable();
  }

  function setOutput(title, message, isError = false) {
    $('#python-output-title').textContent = title;
    const output = $('#python-output');
    output.className = `python-output${isError ? ' error' : ''}`;
    output.textContent = message || '(No output)';
  }

  async function initializeEngine() {
    const status = $('#python-engine-status');
    const button = $('#run-python-button');

    try {
      await engine.load();
      state.engineReady = true;
      status.textContent = 'Python ready';
      button.disabled = false;
    } catch (error) {
      status.textContent = 'Python failed to load';
      setOutput('Engine error', error.message, true);
    }
  }

  async function runCode() {
    if (!state.engineReady) return;

    syncFromWorkflow();
    if (!state.selectedCampaign) {
      setOutput('Missing SQL result', 'Complete the SQL challenge before running Python.', true);
      return;
    }

    state.code = $('#python-editor').value;
    saveState();

    const button = $('#run-python-button');
    button.disabled = true;
    button.textContent = 'Running…';
    $('#python-engine-status').textContent = 'Running code…';

    try {
      const result = await engine.run(state.code, {
        segmentData: data,
        previousCampaign: state.selectedCampaign
      });

      if (result.stderr.trim()) {
        setOutput('Python error', result.stderr.trim(), true);
      } else {
        setOutput('Python output', result.stdout.trim() || '(Code ran with no printed output)');
      }
    } catch (error) {
      setOutput('Python error', error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = 'Run Python';
      $('#python-engine-status').textContent = 'Python ready';
    }
  }

  function normalizeSegment(value) {
    return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function hintForAttempt(attempt) {
    if (attempt === 1) {
      return 'Start with the error message. The campaign variable should come from the previous SQL result.';
    }
    if (attempt === 2) {
      return 'Compare the code with the formula. A contact cost should reduce expected profit, not increase it.';
    }
    return 'Northstar wants the highest expected profit. Check whether sorted() is placing low or high values first.';
  }

  function markComplete() {
    state.completed = true;
    saveState();
    app.setWorkflowValue('selectedSegment', config.correctDisplayName);
    app.unlock('visualization');
    $('#python-success-section').hidden = false;
  }

  function submitAnswer(event) {
    event.preventDefault();
    const answer = normalizeSegment($('#python-segment-answer').value);
    const feedback = $('#python-answer-feedback');

    if (answer === config.correctSegment) {
      markComplete();
      feedback.className = 'feedback success is-visible';
      feedback.innerHTML = `<strong>Correct.</strong> ${config.correctDisplayName} has the highest expected profit per contacted customer.`;
      $('#python-success-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    state.attempts += 1;
    saveState();
    feedback.className = 'feedback error is-visible';
    feedback.innerHTML = `<strong>Not yet.</strong> ${hintForAttempt(state.attempts)}`;
  }

  function clearUi() {
    state.code = config.starterCode;
    state.attempts = 0;
    state.completed = false;
    $('#python-editor').value = config.starterCode;
    $('#python-segment-answer').value = '';
    $('#python-answer-feedback').className = 'feedback';
    $('#python-answer-feedback').innerHTML = '';
    $('#python-success-section').hidden = true;
    setOutput('Python output', 'Run the code to see its output.');
    syncFromWorkflow();
  }

  function resetChallenge(confirmUser = true) {
    if (confirmUser && !window.confirm('Reset your Python code, attempts, and answer?')) return;

    try { localStorage.removeItem(config.storageKey); } catch (_) {}
    app.clearWorkflowValue('selectedSegment');
    clearUi();
    app.lock('visualization');
  }

  function bindEvents() {
    $('#run-python-button').addEventListener('click', runCode);
    $('#python-answer-form').addEventListener('submit', submitAnswer);
    $('#python-reset-button').addEventListener('click', () => resetChallenge(true));
    $('#python-continue-button').addEventListener('click', () => app.showView('visualization'));

    $('#python-editor').addEventListener('input', (event) => {
      state.code = event.target.value;
      saveState();
    });

    $('#python-editor').addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        runCode();
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        const target = event.target;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        target.value = `${target.value.slice(0, start)}    ${target.value.slice(end)}`;
        target.selectionStart = target.selectionEnd = start + 4;
        target.dispatchEvent(new Event('input'));
      }
    });
  }

  function init() {
    loadState();
    $('#python-editor').value = state.code;
    $('#python-success-section').hidden = !state.completed;
    syncFromWorkflow();

    if (state.completed && app.isUnlocked('python')) {
      app.setWorkflowValue('selectedSegment', config.correctDisplayName);
      app.unlock('visualization');
    }

    bindEvents();
    initializeEngine();
  }

  window.NorthstarPythonChallenge = {
    reset: resetChallenge,
    resetSilently: () => resetChallenge(false),
    syncFromWorkflow
  };

  init();
})();
