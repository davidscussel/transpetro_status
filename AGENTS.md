# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains a small, static study resource for Transpetro exam preparation.

- `layout/dashboard_de_assuntos.html` is the main standalone dashboard. It includes HTML, CSS, and JavaScript in one file and is localized in Brazilian Portuguese.
- `layout/Caderno ultimas provas da transpetro.pdf` is the source/reference booklet used by the dashboard content.
- There is no package manifest, build directory, backend service, or dedicated test tree yet.

Keep new study assets under `layout/` unless a larger structure becomes necessary. If the dashboard grows, split reusable CSS or JavaScript into clearly named files such as `layout/styles.css` or `layout/dashboard.js`.

## Build, Test, and Development Commands

No dependency installation is required.

- `xdg-open layout/dashboard_de_assuntos.html` opens the dashboard locally on Linux.
- `python3 -m http.server 8000` serves the repository at `http://localhost:8000/` if browser behavior differs between `file://` and HTTP.
- `pdfinfo "layout/Caderno ultimas provas da transpetro.pdf"` checks PDF metadata, page count, and basic validity.

Because this is static HTML, there is no formal build step.

## Coding Style & Naming Conventions

Use two-space indentation for HTML, CSS, and JavaScript edits, matching the compact style already present in the dashboard. Prefer semantic class names that describe UI roles, for example `filter-bar`, `area-head`, or `qrow`. Keep visible interface text in Portuguese unless the project intentionally changes language.

For filenames, prefer lowercase descriptive names with underscores or hyphens. Avoid spaces in new filenames even though the existing PDF name contains spaces.

## Testing Guidelines

There is no automated test framework at present. For dashboard changes, manually verify:

- the HTML opens without console errors;
- progress, filters, search, and sorting still work;
- layout remains usable on desktop and narrow/mobile widths;
- local storage behavior does not lose existing user progress unexpectedly.

If logic expands, add a lightweight browser-based or Node-compatible test setup before making large behavior changes.

## Commit & Pull Request Guidelines

The current history uses concise Portuguese commit messages, for example `Adiciona o html inicial e o pdf de questões da prova`. Continue with short, present-tense summaries that name the changed artifact or behavior.

Pull requests should include a brief description, screenshots for visual dashboard changes, and notes about any manual checks performed. Link related issues or source material when updating question data.
