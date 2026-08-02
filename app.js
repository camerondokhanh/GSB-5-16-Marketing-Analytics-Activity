(() => {
  'use strict';

  const STORAGE_KEY = 'northstar-sql-simple-v1';
  const STARTER_SQL = '-- Write or paste a query here.\n';
  const tableOrder = ['campaigns', 'campaign_performance', 'customers'];

  const state = {
    db: null,
    ready: false,
    currentView: 'welcome',
    sql: STARTER_SQL,
    selectedTable: 'campaigns',
    attempts: 0,
    completed: false
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.sql = typeof saved.sql === 'string' ? saved.sql : STARTER_SQL;
      state.selectedTable = tableOrder.includes(saved.selectedTable) ? saved.selectedTable : 'campaigns';
      state.attempts = Number.isFinite(saved.attempts) ? saved.attempts : 0;
      state.completed = Boolean(saved.completed);
    } catch (_) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sql: state.sql,
        selectedTable: state.selectedTable,
        attempts: state.attempts,
        completed: state.completed
      }));
    } catch (_) {}
  }

  function showView(name) {
    if (name === 'python' && !state.completed) return;
    state.currentView = name;
    $$('.view').forEach((view) => view.classList.remove('is-visible'));
    $(`#view-${name}`)?.classList.add('is-visible');
    $$('.progress-step[data-step]').forEach((step) => {
      step.classList.toggle('is-active', step.dataset.step === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderTable(columns, rows) {
    const head = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
    const body = rows.map((row) => {
      const cells = row.map((value) => {
        const numeric = typeof value === 'number' ? ' class="number"' : '';
        const display = typeof value === 'number' && !Number.isInteger(value)
          ? Number(value.toFixed(4)).toString()
          : String(value);
        return `<td${numeric}>${escapeHtml(display)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
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

    tableOrder.forEach((table) => {
      const names = columns[table];
      const statement = db.prepare(`INSERT INTO ${table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`);
      try {
        window.NORTHSTAR_DATA[table].forEach((row) => statement.run(names.map((name) => row[name])));
      } finally {
        statement.free();
      }
    });

    return db;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => {
        script.remove();
        reject(new Error(`Timed out while loading ${src}`));
      }, 12000);
      script.src = src;
      script.onload = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error(`Could not load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  async function loadSqlLibrary() {
    const sources = [
      {
        script: 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js',
        wasm: 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/'
      },
      {
        script: 'https://unpkg.com/sql.js@1.13.0/dist/sql-wasm.js',
        wasm: 'https://unpkg.com/sql.js@1.13.0/dist/'
      }
    ];

    let lastError;
    for (const source of sources) {
      try {
        if (typeof window.initSqlJs !== 'function') await loadScript(source.script);
        return await window.initSqlJs({ locateFile: (file) => source.wasm + file });
      } catch (error) {
        lastError = error;
        delete window.initSqlJs;
      }
    }
    throw lastError || new Error('The SQL engine could not be loaded.');
  }

  async function initializeDatabase() {
    try {
      const SQL = await loadSqlLibrary();
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
    $('#table-tabs').innerHTML = tableOrder.map((table) => {
      const count = window.NORTHSTAR_DATA[table].length;
      return `<button class="table-tab${state.selectedTable === table ? ' is-selected' : ''}" data-table="${table}" role="tab">${table} · ${count} rows</button>`;
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
    table.innerHTML = renderTable(result.columns, result.values);
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

  function isReadOnlyQuery(query) {
    const cleaned = query
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--.*$/gm, ' ')
      .trim();
    if (!cleaned) return false;
    const statements = cleaned.split(';').map((part) => part.trim()).filter(Boolean);
    return statements.length === 1 && /^(SELECT|WITH|PRAGMA|EXPLAIN)\b/i.test(statements[0]);
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

    if (!isReadOnlyQuery(query)) {
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
    return 'Join campaigns to campaign_performance using campaign_id, then sort the completed campaigns by conversion rate from highest to lowest.';
  }

  function submitAnswer(event) {
    event.preventDefault();
    const answer = normalizeCampaign($('#campaign-answer').value);
    const feedback = $('#answer-feedback');

    if (answer === 'C104') {
      state.completed = true;
      saveState();
      feedback.className = 'feedback success is-visible';
      feedback.innerHTML = '<strong>Correct.</strong> C104 has the highest conversion rate among completed campaigns.';
      $('#success-section').hidden = false;
      $('#success-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    state.attempts += 1;
    saveState();
    feedback.className = 'feedback error is-visible';
    feedback.innerHTML = `<strong>Not yet.</strong> ${hintForAttempt(state.attempts)}`;
  }

  function resetChallenge() {
    if (!window.confirm('Reset your query, attempts, and answer?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    state.sql = STARTER_SQL;
    state.selectedTable = 'campaigns';
    state.attempts = 0;
    state.completed = false;
    $('#sql-editor').value = STARTER_SQL;
    $('#campaign-answer').value = '';
    $('#answer-feedback').className = 'feedback';
    $('#answer-feedback').innerHTML = '';
    $('#success-section').hidden = true;
    renderTabs();
    showTable('campaigns');
  }

  function bindEvents() {
    $('#begin-button').addEventListener('click', () => showView('sql'));
    $('#run-sql-button').addEventListener('click', runQuery);
    $('#answer-form').addEventListener('submit', submitAnswer);
    $('#reset-button').addEventListener('click', resetChallenge);
    $('#continue-button').addEventListener('click', () => showView('python'));

    $$('[data-go]').forEach((element) => {
      element.addEventListener('click', () => showView(element.dataset.go));
    });

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
    bindEvents();
    initializeDatabase();
  }

  init();
})();
