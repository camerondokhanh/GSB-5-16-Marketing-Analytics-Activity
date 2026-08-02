(() => {
  'use strict';

  let sqlPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) => script.src === src);
      if (existing) {
        if (typeof window.initSqlJs === 'function') resolve();
        else existing.addEventListener('load', resolve, { once: true });
        return;
      }

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
    if (sqlPromise) return sqlPromise;

    sqlPromise = (async () => {
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
    })();

    try {
      return await sqlPromise;
    } catch (error) {
      sqlPromise = null;
      throw error;
    }
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
          : String(value ?? '');
        return `<td${numeric}>${escapeHtml(display)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
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

  window.NorthstarSqlEngine = {
    load: loadSqlLibrary,
    renderTable,
    isReadOnlyQuery
  };
})();
