(() => {
  'use strict';

  let pyodidePromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) => script.src === src);
      if (existing) {
        if (typeof window.loadPyodide === 'function') resolve();
        else existing.addEventListener('load', resolve, { once: true });
        return;
      }

      const script = document.createElement('script');
      const timeout = window.setTimeout(() => {
        script.remove();
        reject(new Error('The Python engine took too long to load. Refresh and try again.'));
      }, 30000);

      script.src = src;
      script.onload = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('The Python engine could not be downloaded. Check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  }

  async function load() {
    if (pyodidePromise) return pyodidePromise;

    pyodidePromise = (async () => {
      const baseUrl = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
      if (typeof window.loadPyodide !== 'function') {
        await loadScript(`${baseUrl}pyodide.js`);
      }
      return window.loadPyodide({ indexURL: baseUrl });
    })();

    try {
      return await pyodidePromise;
    } catch (error) {
      pyodidePromise = null;
      throw error;
    }
  }

  async function run(code, context = {}) {
    const pyodide = await load();

    pyodide.globals.set('__northstar_user_code', code);
    pyodide.globals.set('__northstar_segment_data_json', JSON.stringify(context.segmentData || []));
    pyodide.globals.set('__northstar_previous_campaign', String(context.previousCampaign || ''));

    const proxy = await pyodide.runPythonAsync(`
import io
import traceback

_namespace = {
    "segment_data_json": __northstar_segment_data_json,
    "previous_campaign": __northstar_previous_campaign,
}
_stdout = io.StringIO()
_stderr = io.StringIO()

try:
    with __import__("contextlib").redirect_stdout(_stdout), __import__("contextlib").redirect_stderr(_stderr):
        exec(__northstar_user_code, _namespace, _namespace)
except Exception:
    traceback.print_exc(file=_stderr)

(_stdout.getvalue(), _stderr.getvalue())
    `);

    const [stdout, stderr] = proxy.toJs();
    proxy.destroy();

    return { stdout, stderr };
  }

  window.NorthstarPythonEngine = { load, run };
})();
