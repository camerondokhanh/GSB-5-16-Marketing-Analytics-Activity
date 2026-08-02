# Marketing Analytics AI Challenge

This static classroom site now contains two working stages:

1. Data cleaning with SQL
2. Campaign analysis with SQL

Python and visualization remain isolated placeholders for the next build.

## Run locally

Open Terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish updates

This folder can be connected to Netlify through GitHub.

1. Save changes in VS Code.
2. Commit and push them with GitHub Desktop.
3. Netlify automatically republishes the same public link.

## Project structure

```text
index.html
styles/
  base.css
  cleaning-challenge.css
  sql-challenge.css
scripts/
  app.js
  shared/
    sql-engine.js
  cleaning/
    cleaning-data.js
    cleaning-challenge.js
  sql/
    sql-data.js
    sql-challenge.js
  python/
    python-challenge.js
  visualization/
    visualization-challenge.js
netlify.toml
```

## What to edit

### Shared site

- `index.html` — page structure, navigation, and visible wording
- `styles/base.css` — shared typography, colors, buttons, and layout
- `scripts/app.js` — shared routing and challenge unlocking
- `scripts/shared/sql-engine.js` — shared browser SQL loader and table renderer

### Cleaning challenge

- `styles/cleaning-challenge.css` — cleaning-specific layout
- `scripts/cleaning/cleaning-data.js` — messy revenue data and correct total
- `scripts/cleaning/cleaning-challenge.js` — cleaning database, query execution, hints, and validation

### Campaign SQL challenge

- `styles/sql-challenge.css` — shared SQL workspace, answer form, tabs, and result styling
- `scripts/sql/sql-data.js` — campaign tables and correct campaign
- `scripts/sql/sql-challenge.js` — campaign database, query execution, hints, and validation

### Future challenges

- `scripts/python/python-challenge.js`
- `scripts/visualization/visualization-challenge.js`
