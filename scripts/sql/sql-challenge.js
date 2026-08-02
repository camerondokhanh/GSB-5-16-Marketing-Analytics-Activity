(() => {
  'use strict';

  const app = window.NorthstarApp;
  const engine = window.NorthstarSqlEngine;
  const config = window.NORTHSTAR_SQL_CONFIG;
  const data = window.NORTHSTAR_SQL_DATA;

  if (!app || !engine || !config || !data) {
    console.error('SQL challenge dependencies did not load.');
    return;
  }

  const { $, $$ } = app;
  const state = {
    db: null,
    ready: false,
    sql: config.starterSql,
    selectedTable: config.tableOrder[0],
    attempts: 0,
    completed: false
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(config.storageKey) || '{}');
      state.sql = typeof saved.sql === 'string' ? saved.sql : config.starterSql;
      state.selectedTable = config.tableOrder.includes(saved.selectedTable)
        ? saved.selectedTable
        : config.tableOrder[0];
      state.attempts = Number.isFinite(saved.attempts) ? saved.attempts : 0;
      state.completed = Boolean(saved.completed);
    } catch (_) {}
  }

  function saveState() {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify({
        sql: state.sql,
        selectedTable: state.selectedTable,
        attempts: state.attempts,
        completed: state.completed
      }));
    } catch (_) {}
  }

  function createDatabase(SQL) {
    const db = new SQL.Database();
    db.run(`
      CREATE TABLE campaigns (
        campaign_id TEXT PRIMARY KEY,
        campaign_name TEXT NOT NULL,
        channel TEXT NOT NULL,
        status TEXT NOT NULL,
        budget REAL NOT NULL,
        region TEXT NOT NULL,
        launch_date TEXT NOT NULL
      );

      CREATE TABLE campaign_performance (
        campaign_id TEXT PRIMARY KEY,
        impressions INTEGER NOT NULL,
        clicks INTEGER NOT NULL,
        conversions INTEGER NOT NULL,
        revenue REAL NOT NULL,
        avg_session_seconds INTEGER NOT NULL,
        coupon_uses INTEGER NOT NULL
      );

      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        segment TEXT NOT NULL,
        region TEXT NOT NULL,
        age INTEGER NOT NULL,
        loyalty_status TEXT NOT NULL,
        email_opt_in INTEGER NOT NULL
      );
    `);

    const columns = {
      campaigns: ['campaign_id', 'campaign_name', 'channel', 'status', 'budget', 'region', 'launch_date'],
      campaign_performance: ['campaign_id', 'impressions', 'clicks', 'conversions', 'revenue', 'avg_session_seconds', 'coupon_uses'],
      customers: ['customer_id', 'segment', 'region', 'age', 'loyalty_status', 'email_opt_in']
    };

    config.tableOrder.forEach((table) => {
      const names = columns[table];
      const placeholders = names.map(() => '?').join(',');
      const statement = db.prepare(`INSERT INTO ${table} (${names.join(',')}) VALUES (${placeholders})`);
      try {
        data[table].forEach((row) => statement.run(names.map((name) => row[name])));
      } finally {
        statement.free();
      }
    });

    return db;
  }

  async function initializeDatabase() {
    try {
      const SQL = await engine.load();
      state.db = createDatabase(SQL);
      state.ready = true;
      $('#database-status').textContent = 'Database ready';
      $('#run-sql-button').disabled = false;
      renderTabs();
      showTable(state.selectedTable);
    } catch (error) {
      $('#database-status').textContent = 'Database failed to load';
      showMessage(`The SQL engine could not load.\n${error.message}`, true);
    }
  }

  function execOne(sql) {
    const results = state.db.exec(sql);
    return results.length ? results[results.length - 1] : null;
  }

  function renderTabs() {
    $('#table-tabs').innerHTML = config.tableOrder.map((table) => {
      const count = data[table].length;
      const selected = state.selectedTable === table ? ' is-selected' : '';
      return `<button class="table-tab${selected}" data-table="${table}" role="tab">${table} · ${count} rows</button>`;
    }).join('');

    $$('#table-tabs [data-table]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedTable = button.dataset.table;
        saveState();
        renderTabs();
        showTable(state.selectedTable);
      });
    });
  }

  function showMessage(message, isError = false) {
    const messageBox = $('#data-message');
    $('#data-table').hidden = true;
    messageBox.hidden = false;
    messageBox.className = `data-message${isError ? ' error' : ''}`;
    messageBox.textContent = message;
  }

  function showResult(title, result) {
    $('#data-title').textContent = title;
    $('#data-message').hidden = true;
    const table = $('#data-table');
    table.innerHTML = engine.renderTable(result.columns, result.values);
    table.hidden = false;
    $('#row-count').textContent = `${result.values.length} row${result.values.length === 1 ? '' : 's'}`;
  }

  function showTable(table) {
    if (!state.ready) return;
    try {
      const result = execOne(`SELECT * FROM ${table};`);
      showResult(table, result);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  function runQuery() {
    if (!state.ready) return;

    const query = $('#sql-editor').value.trim();
    state.sql = $('#sql-editor').value;
    saveState();

    if (!query || query.split('\n').every((line) => !line.trim() || line.trim().startsWith('--'))) {
      showMessage('Write a query before running SQL.');
      $('#row-count').textContent = '';
      return;
    }

    if (!engine.isReadOnlyQuery(query)) {
      showMessage('Run one read-only SELECT query at a time.', true);
      $('#row-count').textContent = '';
      return;
    }

    try {
      const result = execOne(query);
      if (!result) {
        showMessage('The query ran, but it did not return a table.');
        $('#row-count').textContent = '0 rows';
        return;
      }

      state.selectedTable = '';
      renderTabs();
      showResult('Query results', result);
    } catch (error) {
      showMessage(`SQL error\n${error.message}`, true);
      $('#row-count').textContent = 'Query failed';
    }
  }

  function normalizeCampaign(value) {
    return value.toUpperCase().replace(/\s+/g, '').trim();
  }

  function hintForAttempt(attempt) {
    if (attempt === 1) return 'Calculate conversion rate as conversions divided by clicks.';
    if (attempt === 2) return 'Only campaigns whose status is Complete should be considered.';
    return 'Join campaigns to campaign_performance using campaign_id, then sort completed campaigns by conversion rate from highest to lowest.';
  }

  function markComplete() {
    state.completed = true;
    saveState();
    app.unlock('python');
    $('#success-section').hidden = false;
  }

  function submitAnswer(event) {
    event.preventDefault();
    const answer = normalizeCampaign($('#campaign-answer').value);
    const feedback = $('#answer-feedback');

    if (answer === config.correctCampaign) {
      markComplete();
      feedback.className = 'feedback success is-visible';
      feedback.innerHTML = '<strong>Correct.</strong> C104 has the highest conversion rate among completed campaigns.';
      $('#success-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    state.attempts += 1;
    saveState();
    feedback.className = 'feedback error is-visible';
    feedback.innerHTML = `<strong>Not yet.</strong> ${hintForAttempt(state.attempts)}`;
  }

  function clearUi() {
    state.sql = config.starterSql;
    state.selectedTable = config.tableOrder[0];
    state.attempts = 0;
    state.completed = false;
    $('#sql-editor').value = config.starterSql;
    $('#campaign-answer').value = '';
    $('#answer-feedback').className = 'feedback';
    $('#answer-feedback').innerHTML = '';
    $('#success-section').hidden = true;
    if (state.ready) {
      renderTabs();
      showTable(state.selectedTable);
    }
  }

  function resetChallenge(confirmUser = true) {
    if (confirmUser && !window.confirm('Reset your SQL query, attempts, and answer?')) return;

    try { localStorage.removeItem(config.storageKey); } catch (_) {}
    clearUi();
    app.lock('python');
    app.lock('visualization');
  }

  function bindEvents() {
    $('#run-sql-button').addEventListener('click', runQuery);
    $('#answer-form').addEventListener('submit', submitAnswer);
    $('#reset-button').addEventListener('click', () => resetChallenge(true));
    $('#continue-button').addEventListener('click', () => app.showView('python'));

    $('#sql-editor').addEventListener('input', (event) => {
      state.sql = event.target.value;
      saveState();
    });

    $('#sql-editor').addEventListener('keydown', (event) => {
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
    $('#sql-editor').value = state.sql;
    $('#success-section').hidden = !state.completed;

    if (state.completed && app.isUnlocked('sql')) app.unlock('python');

    bindEvents();
    initializeDatabase();
  }

  window.NorthstarSqlChallenge = {
    reset: resetChallenge,
    resetSilently: () => resetChallenge(false),
    syncUnlock: () => {
      if (state.completed && app.isUnlocked('sql')) app.unlock('python');
    }
  };

  init();
})();
