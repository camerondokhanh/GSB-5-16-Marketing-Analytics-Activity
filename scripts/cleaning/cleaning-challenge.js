(() => {
  'use strict';

  const app = window.NorthstarApp;
  const engine = window.NorthstarSqlEngine;
  const config = window.NORTHSTAR_CLEANING_CONFIG;
  const data = window.NORTHSTAR_CLEANING_DATA;

  if (!app || !engine || !config || !data) {
    console.error('Cleaning challenge dependencies did not load.');
    return;
  }

  const { $, $$ } = app;
  const state = {
    db: null,
    ready: false,
    sql: config.starterSql,
    attempts: 0,
    completed: false
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(config.storageKey) || '{}');
      state.sql = typeof saved.sql === 'string' ? saved.sql : config.starterSql;
      state.attempts = Number.isFinite(saved.attempts) ? saved.attempts : 0;
      state.completed = Boolean(saved.completed);
    } catch (_) {}
  }

  function saveState() {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify({
        sql: state.sql,
        attempts: state.attempts,
        completed: state.completed
      }));
    } catch (_) {}
  }

  function createDatabase(SQL) {
    const db = new SQL.Database();
    db.run(`
      CREATE TABLE raw_campaign_revenue (
        transaction_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        revenue TEXT,
        converted INTEGER NOT NULL,
        is_test_record INTEGER NOT NULL,
        export_note TEXT NOT NULL
      );
    `);

    const columns = [
      'transaction_id', 'campaign_id', 'channel', 'revenue',
      'converted', 'is_test_record', 'export_note'
    ];
    const statement = db.prepare(`
      INSERT INTO raw_campaign_revenue (${columns.join(',')})
      VALUES (${columns.map(() => '?').join(',')})
    `);

    try {
      data.forEach((row) => statement.run(columns.map((column) => row[column])));
    } finally {
      statement.free();
    }

    return db;
  }

  async function initializeDatabase() {
    try {
      const SQL = await engine.load();
      state.db = createDatabase(SQL);
      state.ready = true;
      $('#clean-database-status').textContent = 'Database ready';
      $('#clean-run-sql-button').disabled = false;
      renderTableTab();
      showRawTable();
    } catch (error) {
      $('#clean-database-status').textContent = 'Database failed to load';
      showMessage(`The SQL engine could not load.\n${error.message}`, true);
    }
  }

  function execOne(sql) {
    const results = state.db.exec(sql);
    return results.length ? results[results.length - 1] : null;
  }

  function renderTableTab() {
    $('#clean-table-tabs').innerHTML = `
      <button class="table-tab is-selected" data-clean-table="${config.tableName}" role="tab">
        ${config.tableName} · ${data.length} rows
      </button>
    `;

    $$('[data-clean-table]').forEach((button) => {
      button.addEventListener('click', showRawTable);
    });
  }

  function showMessage(message, isError = false) {
    const messageBox = $('#clean-data-message');
    $('#clean-data-table').hidden = true;
    messageBox.hidden = false;
    messageBox.className = `data-message${isError ? ' error' : ''}`;
    messageBox.textContent = message;
  }

  function showResult(title, result) {
    $('#clean-data-title').textContent = title;
    $('#clean-data-message').hidden = true;
    const table = $('#clean-data-table');
    table.innerHTML = engine.renderTable(result.columns, result.values);
    table.hidden = false;
    $('#clean-row-count').textContent = `${result.values.length} row${result.values.length === 1 ? '' : 's'}`;
  }

  function showRawTable() {
    if (!state.ready) return;
    try {
      const result = execOne(`SELECT * FROM ${config.tableName};`);
      showResult(config.tableName, result);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  function runQuery() {
    if (!state.ready) return;

    const query = $('#clean-sql-editor').value.trim();
    state.sql = $('#clean-sql-editor').value;
    saveState();

    if (!query || query.split('\n').every((line) => !line.trim() || line.trim().startsWith('--'))) {
      showMessage('Write a query before running SQL.');
      $('#clean-row-count').textContent = '';
      return;
    }

    if (!engine.isReadOnlyQuery(query)) {
      showMessage('Run one read-only SELECT query at a time.', true);
      $('#clean-row-count').textContent = '';
      return;
    }

    try {
      const result = execOne(query);
      if (!result) {
        showMessage('The query ran, but it did not return a table.');
        $('#clean-row-count').textContent = '0 rows';
        return;
      }
      showResult('Query results', result);
    } catch (error) {
      showMessage(`SQL error\n${error.message}`, true);
      $('#clean-row-count').textContent = 'Query failed';
    }
  }

  function parseMoney(value) {
    const normalized = String(value).replace(/[$,\s]/g, '');
    if (!normalized) return NaN;
    return Number(normalized);
  }

  function hintForAttempt(attempt) {
    if (attempt === 1) return 'The export contains a duplicate transaction. Keep only one copy of each transaction ID.';
    if (attempt === 2) return 'Rows marked as test records should not count toward real revenue.';
    if (attempt === 3) return 'Revenue is text. Remove dollar signs and commas before converting it to a number.';
    return 'Ignore blank and N/A revenue values, then sum the cleaned valid transactions.';
  }

  function markComplete() {
    state.completed = true;
    saveState();
    app.unlock('sql');
    window.NorthstarSqlChallenge?.syncUnlock?.();
    $('#clean-success-section').hidden = false;
  }

  function submitAnswer(event) {
    event.preventDefault();
    const answer = parseMoney($('#clean-total-answer').value);
    const feedback = $('#clean-answer-feedback');

    if (Number.isFinite(answer) && Math.abs(answer - config.correctTotal) < 0.01) {
      markComplete();
      feedback.className = 'feedback success is-visible';
      feedback.innerHTML = '<strong>Correct.</strong> The cleaned valid revenue is $6,925.';
      $('#clean-success-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    state.attempts += 1;
    saveState();
    feedback.className = 'feedback error is-visible';
    feedback.innerHTML = `<strong>Not yet.</strong> ${hintForAttempt(state.attempts)}`;
  }

  function clearUi() {
    state.sql = config.starterSql;
    state.attempts = 0;
    state.completed = false;
    $('#clean-sql-editor').value = config.starterSql;
    $('#clean-total-answer').value = '';
    $('#clean-answer-feedback').className = 'feedback';
    $('#clean-answer-feedback').innerHTML = '';
    $('#clean-success-section').hidden = true;
    if (state.ready) showRawTable();
  }

  function resetChallenge(confirmUser = true) {
    if (confirmUser && !window.confirm('Reset the cleaning challenge and all later progress?')) return;

    try { localStorage.removeItem(config.storageKey); } catch (_) {}
    clearUi();
    app.lock('sql');
    app.lock('python');
    app.lock('visualization');
    window.NorthstarSqlChallenge?.resetSilently?.();
    window.NorthstarPythonChallenge?.resetSilently?.();
    app.clearWorkflow();
  }

  function bindEvents() {
    $('#clean-run-sql-button').addEventListener('click', runQuery);
    $('#clean-answer-form').addEventListener('submit', submitAnswer);
    $('#clean-reset-button').addEventListener('click', () => resetChallenge(true));
    $('#clean-continue-button').addEventListener('click', () => app.showView('sql'));

    $('#clean-sql-editor').addEventListener('input', (event) => {
      state.sql = event.target.value;
      saveState();
    });

    $('#clean-sql-editor').addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        runQuery();
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
    $('#clean-sql-editor').value = state.sql;
    $('#clean-success-section').hidden = !state.completed;
    if (state.completed) app.unlock('sql');
    bindEvents();
    initializeDatabase();
  }

  window.NorthstarCleaningChallenge = {
    reset: resetChallenge
  };

  init();
})();
