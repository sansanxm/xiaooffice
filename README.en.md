<p align="center">
  <img src="docs/assets/readme/hero.png" alt="Xiao Office — the open-source AI Office suite: Docs, Sheets, Slides, PDF, Markdown and HTML with a built-in AI panel" width="100%">
</p>

<h1 align="center">Xiao Office (xiaooffice)</h1>

<p align="center"><b>The full-featured open-source AI Office suite.</b><br>
Word (.docx), Excel (.xlsx), PowerPoint (.pptx) and PDF files, edited by you and your AI, saved back in native real formats.</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License: Apache-2.0"></a>
  <a href="https://github.com/sansanxm/xiaooffice/releases"><img src="https://img.shields.io/badge/Release-v0.12.0-brightgreen" alt="Release"></a>
  <a href="https://github.com/sansanxm/xiaooffice/stargazers"><img src="https://img.shields.io/github/stars/sansanxm/xiaooffice?style=flat&color=yellow" alt="GitHub stars"></a>
  <a href="https://github.com/sansanxm/xiaooffice"><img src="https://img.shields.io/badge/GitHub-xiaooffice-blue?logo=github" alt="GitHub Repo"></a>
</p>

<p align="center"><a href="README.md">Tiếng Việt</a> · <b>English</b></p>

<p align="center">
  <a href="#key-features"><b>Features</b></a> ·
  <a href="#download--installation"><b>Download</b></a> ·
  <a href="#development--building"><b>Development</b></a> ·
  <a href="#ai-providers-setup"><b>AI Setup</b></a> ·
  <a href="#the-six-office-apps"><b>Apps</b></a> ·
  <a href="LICENSE"><b>License</b></a>
</p>

---

## What is Xiao Office?

**Xiao Office** is a free, modern, and open-source alternative to Microsoft Office for macOS, Windows, and Linux. It opens and saves native `.docx`, `.xlsx`, and `.pptx` files, edits PDF, Markdown, and HTML, and pairs each document with a deeply integrated AI assistant that can inspect content, draft edits, run live formulas, and highlight changes directly.

- **Native formats, byte-preserving:** Only the sections you edit are rewritten. Everything else in your documents survives byte-for-byte, ensuring full compatibility with Microsoft Office.
- **Auditable & transparent AI:** AI suggestions appear as visual diffs and tracked changes with one-click rollback. Spreadsheets receive live calculated formulas instead of raw numbers.
- **Local-first privacy:** Files open, edit, save, and convert entirely on your computer. Conversions (PDF → Word/Excel/PowerPoint, Markdown → Word, HTML → Word) execute on-device. Only AI prompts are transmitted to the provider you choose.
- **Fast local search:** Search file names, folders, and full text across all `.docx`, `.xlsx`, `.pptx`, PDF, Markdown, and HTML files via a local SQLite index.
- **Bring Your Own Key (BYOK):** Connect directly to OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini 2.0 / 1.5), DeepSeek, Ollama (offline local models), OpenRouter, and any OpenAI-compatible server.

---

## Key Features & Recent Enhancements

- 📄 **Page Layout View for Sheets:**
  - View spreadsheets formatted into discrete printed pages matching selected paper sizes (**A4: 210 × 297 mm**, **A3**, **A5**, Letter, Legal...).
  - Displays page frames, margin guidelines (Normal, Wide, Narrow), page headers/footers, and automatically zooms to fit the page width.
- 🎛️ **Status Bar View Switcher:**
  - Three convenient view mode buttons located right on the bottom-right status bar (before the zoom slider) and under the View ribbon tab:
    - `▦` **Normal View:** Unbounded spreadsheet grid.
    - `▤` **Page Layout View:** Formatted printed pages matching paper size.
    - `┆` **Page Break Preview:** Page boundary lines and watermarks.
- ▽ **Prominent Filter Button:**
  - One-click **Filter** button with funnel icon `▽` prominently placed on both the **Home tab** and **Data tab**, with active state illumination.
- ↔️ **Double-Click Gridlines Auto-Fit (MS Excel Behavior):**
  - Double-clicking vertical gridlines or column dividers automatically auto-fits column width to the widest content.
  - Double-clicking horizontal gridlines or row dividers automatically auto-fits row height.
- 💾 **Smart Save As Dialog:**
  - Saving a newly created document (`⌘S` / `Ctrl+S`) always triggers the Save As dialog, allowing users to choose the destination folder, filename, and format (`.xlsx`, `.docx`, `.pptx`, `.csv`...).
- 🖨️ **Reliable macOS Printing:**
  - Direct integration with macOS system print sheets for sheets and documents without print failures.

---

## Download & Installation

Pre-built binaries are available on the [Releases](https://github.com/sansanxm/xiaooffice/releases) page:
- **macOS:** `.dmg` installer or `.zip` (supports Apple Silicon M1/M2/M3/M4 and Intel x64).
- **Windows:** `.exe` installer (NSIS installer for Windows 10/11 x64 and Arm64).
- **Linux:** `.AppImage`, `.deb`, and `.rpm` packages.

---

## Development & Building

Xiao Office is built with TypeScript, Electron, Vite, React, and high-performance native engines.

### 1. Prerequisites
- **Node.js**: `>= 22.12.0` (Node.js 22 LTS recommended).
- **npm**: `>= 10`.
- **Rust & Cargo**: (Optional) Only required if modifying the native `xlsx-writer` sidecar.

### 2. Clone & Install
```bash
git clone https://github.com/sansanxm/xiaooffice.git
cd xiaooffice
npm install
```

### 3. Run Development Server
Launches all six editors and the shell concurrently with hot-reloading:
```bash
npm run dev
```

### 4. Quality Checks & Testing
```bash
# Typecheck across all workspaces
npm run typecheck

# Run the test suite (>2,800 unit tests)
npm run test
```

### 5. Build Desktop Packages
- **macOS:**
  ```bash
  npm run dist:mac
  ```
  Generates `Xiao Office-0.12.0-arm64.dmg` in `apps/shell/release/`.

- **Windows:**
  ```bash
  npm run dist:win
  ```

- **Linux:**
  ```bash
  npm run dist:linux
  ```

---

## AI Providers Setup

Xiao Office stores your API credentials securely in your local machine keychain:
1. Open any document and expand the **AI panel** on the right side.
2. Select your preferred provider:
   - **OpenAI:** GPT-4o, GPT-4o-mini...
   - **Anthropic:** Claude 3.5 Sonnet, Claude 3 Opus...
   - **Google Gemini:** Gemini 2.0 Flash, Gemini 1.5 Pro...
   - **DeepSeek:** DeepSeek-Chat, DeepSeek-Reasoner...
   - **Ollama:** Completely offline local LLMs.
   - **OpenRouter & Custom Endpoints:** Connect to any OpenAI-compatible API.
3. Enter your API key. The key is never sent to third-party tracking servers.

---

## The Six Office Apps

| Application | Supported Formats | Key Capabilities |
| :--- | :--- | :--- |
| **Docs** | `.docx`, `.doc` | Faithful Word rendering, track changes, diffs, tables, headers, footers, full-bleed images. |
| **Sheets** | `.xlsx`, `.csv`, `.xls` | Rust-powered Excel engine, Page Layout view (A4/A3/A5), filter toggle, double-click auto-fit gridlines, pivot tables. |
| **Slides** | `.pptx`, `.ppt` | Generates 10–12 slide decks from a single prompt, master layouts, consistent typography and themes. |
| **PDF** | `.pdf` | In-place text editing, on-device conversion to Word, Excel, and PowerPoint with local OCR. |
| **Markdown** | `.md` | Block editor on plain `.md`, LaTeX math support, Mermaid diagrams, task lists. |
| **HTML** | `.html` | AI UI generation, single-file HTML sites, one-click restyling, export to Word / PDF. |

---

## Contributing

Contributions, bug reports, and feature requests are welcome!
- Issue Tracker: [GitHub Issues](https://github.com/sansanxm/xiaooffice/issues)
- Pull Requests: [GitHub Pull Requests](https://github.com/sansanxm/xiaooffice/pulls)

---

## License

Xiao Office is licensed under the open-source [Apache License 2.0](LICENSE).
