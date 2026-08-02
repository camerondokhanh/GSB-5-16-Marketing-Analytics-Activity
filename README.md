# Marketing Analytics AI Challenge

This static classroom site contains three working stages:

1. Data cleaning with SQL
2. Campaign analysis with SQL
3. Audience prioritization with Python

The visualization stage remains an isolated placeholder for the next build.

## Run locally

Open Terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

An internet connection is required the first time the browser loads the SQL and Python engines.

## Publish updates

This folder can be connected to Netlify through GitHub.

1. Save changes.
2. Commit and push them to the `main` branch.
3. Netlify automatically republishes the same public link.

## Project structure

```text
index.html
styles/
  base.css
  cleaning-challenge.css
  sql-challenge.css
  python-challenge.css
scripts/
  app.js
  shared/
    sql-engine.js
    python-engine.js
  cleaning/
    cleaning-data.js
    cleaning-challenge.js
  sql/
    sql-data.js
    sql-challenge.js
  python/
    python-data.js
    python-challenge.js
  visualization/
    visualization-challenge.js
netlify.toml
```

## What to edit

### Shared site

- `index.html` — page structure, navigation, and visible wording
- `styles/base.css` — shared typography, colors, buttons, and layout
- `scripts/app.js` — navigation, unlocking, and workflow values passed between challenges
- `scripts/shared/sql-engine.js` — browser SQL loader and table renderer
- `scripts/shared/python-engine.js` — browser Python loader and code runner

### Cleaning challenge

- `styles/cleaning-challenge.css`
- `scripts/cleaning/cleaning-data.js`
- `scripts/cleaning/cleaning-challenge.js`

### Campaign SQL challenge

- `styles/sql-challenge.css`
- `scripts/sql/sql-data.js`
- `scripts/sql/sql-challenge.js`

### Python challenge

- `styles/python-challenge.css` — Python editor, output, handoff, and table styling
- `scripts/python/python-data.js` — segment data, starter code, and correct answer
- `scripts/python/python-challenge.js` — Python execution, hints, state, and answer validation

### Visualization challenge

- `scripts/visualization/visualization-challenge.js`

## Python challenge dependency

When the SQL answer is correct, the site stores the selected campaign as a workflow value. The Python engine receives that value as `previous_campaign`. The starter code must use it to filter the segment data.
