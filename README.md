# Mindly

**Mindly** is a **mind map** editor that runs entirely on your computer.
No accounts, cloud, online databases or Internet connection are needed: your projects are simple files saved in the `projects/` folder.

---

## Table of contents

1. [Requirements](#1-requirements)
2. [Folder structure](#2-folder-structure)
3. [Starting and closing](#3-starting-and-closing)
4. [How it works (overview)](#4-how-it-works-overview)
5. [The interface](#5-the-interface)
6. [Managing projects](#6-managing-projects)
7. [Working with blocks](#7-working-with-blocks)
8. [Links (lines)](#8-links-lines)
9. [Tidy mode and free mode](#9-tidy-mode-and-free-mode)
10. [The canvas: panning, zoom, grid](#10-the-canvas-panning-zoom-grid)
11. [Properties panel](#11-properties-panel)
12. [Undo and Redo](#12-undo-and-redo)
13. [Copy, paste, duplicate](#13-copy-paste-duplicate)
14. [Saving and autosave](#14-saving-and-autosave)
15. [Import, export and preview](#15-import-export-and-preview)
16. [Theme](#16-theme)
17. [All keyboard shortcuts](#17-all-keyboard-shortcuts)
18. [Mouse commands](#18-mouse-commands)
19. [Menus: full list of items](#19-menus-full-list-of-items)
20. [Context menu (right-click)](#20-context-menu-right-click)
21. [Notifications](#21-notifications)
22. [Where data is stored](#22-where-data-is-stored)
23. [Security and privacy](#23-security-and-privacy)
24. [Technical details](#24-technical-details)
25. [Known limitations](#25-known-limitations)
26. [Troubleshooting](#26-troubleshooting)
27. [Frequently asked questions](#27-frequently-asked-questions)

---

## 1. Requirements

- **Windows** (the `start.bat` launcher is designed for Windows).
- **Python 3** installed. During Python's installation, check the **"Add Python to PATH"** option. It can be downloaded from <https://www.python.org/downloads/>.
- A **modern browser** (Chrome, Edge, Firefox).
- **No libraries to install**: the server uses only Python's standard library.
- **No Internet connection** required: no CDNs, fonts or external services are used.

---

## 2. Folder structure

```
Mindly/
├── start.bat          ← double-click to start everything
├── server.py          ← local server (project saving and API)
├── README.md          ← this file
├── static/           ← all the site's code
│   ├── index.html     ← page structure
│   ├── style.css      ← visual appearance (light and dark theme)
│   └── app.js         ← all the editor's logic
└── projects/          ← your projects (empty at first)
    ├── Project_Name/
    │   ├── project.json    ← the map (blocks, links, settings, view)
    │   └── metadata.json   ← name, ID, dates, version
    └── ...
```

The `projects/` folder contains **only** the projects you create. Each project is independent from the others.

---

## 3. Starting and closing

### Starting

1. Unzip the `Mindly` folder wherever you like (for example on the Desktop).
2. **Double-click `start.bat`**.
3. A black window (the server) opens and, after a moment, the browser opens Mindly at `http://127.0.0.1:8765`.

What `start.bat` does:

1. Checks whether Python is installed (it tries `py -3` first, then `python`).
2. If Python is missing, it shows a clear message with the download link.
3. Creates the `projects/` folder if it doesn't exist.
4. Starts `server.py` and opens the browser automatically.
5. Keeps the server running until you close the window.

### Closing

- Before closing, make sure **"Saved"** appears at the top (see [Saving](#14-saving-and-autosave)).
- Close the browser tab, then the **black window** of the server (or press `Ctrl+C` inside it).

### Port already in use

Mindly uses port **8765**. If it is already in use (for example because Mindly is already open), the program reports it, opens the browser anyway, and the window waits for a key press before closing.

---

## 4. How it works (overview)

Mindly consists of two parts that communicate only within your computer:

- **The server (`server.py`)**: serves the site's pages and manages projects on disk (create, read, save, rename, duplicate, delete). It listens **only on `127.0.0.1`** (localhost), so it cannot be reached from other computers.
- **The site (`static/`)**: the actual editor, which runs in the browser. It draws the map, handles mouse and keyboard, and asks the server to save.

Every time you modify the map, after about a second and a half the site sends the data to the server, which writes it to the project folder.

**Every time you start the site**, the **Projects** window always opens, where you choose whether to create a new project or open an existing one.

---

## 5. The interface

### Top bar

From left to right:

- **Mindly logo**.
- **Menus**: File, Edit, Insert, View, Help.
- **Project name**: click it to rename the project.
- **Save status**: *Saved*, *Saving…*, *Unsaved changes*, *Save error* (or *No project*).
- **Projects**: opens the project management window.
- **Theme button** (☾ / ☀): switches between light and dark theme.

### Toolbar (below the top bar)

| Button | Function |
|---|---|
| ↶ | Undo |
| ↷ | Redo |
| ⧉ | Duplicate the selected blocks |
| ✕ | Delete the selection |
| − | Zoom out |
| `100%` | Zoom percentage; click it to return to 100% |
| + | Zoom in |
| ⤢ | Fit the map to the screen |
| ▦ | Show/hide the grid |
| ⌗ | Turn snap to grid on/off |
| ⊞ | Tidy mode / free mode |
| ◫ | Show/hide the minimap |
| ☰ | Show/hide the Properties panel |

The grid, snap, tidy mode and link buttons are highlighted when active.

### Tools panel (left bar)

From top to bottom:

- **T / Title** (dark button): creates a **title block**.
- **↖ Select**: normal mode.
- **＋ New block**: creates a block.
- **→ Child block**: creates a block linked to the selected one.
- **↓ Sibling block**: creates a block next to the selected one, with the same parent.
- **⟷ Link mode**: links two blocks with two clicks.
- **Five shapes**: rectangle, rounded rectangle, circle, ellipse, pill (they create a block with that shape).

### Canvas (central area)

This is your workspace, virtually infinite. A grid may appear in the background.

### Properties panel (right bar)

It is **hidden by default**. It opens with the ☰ button, from the View → Properties menu, or from "Properties" in a block's context menu. If you leave it open, it stays open the next time you start. See [Properties panel](#11-properties-panel).

### Status bar (bottom)

Shows a hint about the current command, the number of blocks and links, and the zoom percentage.

---

## 6. Managing projects

The **Projects** window (it opens at startup and from the *Projects* button / File menu → Open project) contains:

- **Search projects…**: filters the list as you type.
- **Sort by**: *Last modified*, *Creation date* or *Name*.
- **New project**: creates a project.
- **Recent**: quick buttons with the most recently opened projects (up to 8). They don't appear while you are searching.
- **List**: for each project you see the name, last modified date and creation date.

For each project:

| Action | How |
|---|---|
| **Open** | click the name or the *Open* button |
| **Rename** | ✎ button |
| **Duplicate** | ⧉ button (asks for the name of the copy, suggested as "Copy of …") |
| **Delete** | ✕ button (always asks for confirmation; the operation cannot be undone) |

### New project

Asks for the name and creates a project that already contains a **title block** in the center ("Central idea"), in **tidy mode**.

### Project names

- You can use **spaces** and accented letters.
- Characters that are invalid on Windows (`< > : " / \ | ? *` and control characters) are removed from the folder name.
- Trailing dots and spaces are stripped.
- Reserved Windows names (`CON`, `PRN`, `AUX`, `NUL`, `COM0–9`, `LPT0–9`) are not accepted.
- Maximum length: **60 characters**.
- If a folder with the same name already exists, one with the suffix `_2`, `_3`, … is created.
- The name you typed is still the one displayed inside Mindly.

### Closing a project

File menu → *Close project* (`Ctrl+W`): saves and returns to the empty screen with the Projects window.

### If no project is open

If you press a command that creates blocks (T, ＋, shapes, `N`…) with no project open, a warning appears and **New project** opens by itself.

---

## 7. Working with blocks

### Creating blocks

| How | What it creates |
|---|---|
| **Double-click on an empty space** | a block at the clicked point |
| **`N`** key | a block where the mouse is (or in a free spot at the center) |
| **＋** button | a block in a free spot near the center of the view |
| **Shape** buttons (rectangle, circle, etc.) | a block with that shape |
| **`T`** key, **T Title** button, **right double-click** on an empty space, Insert menu → *Title block* | a **title block** |
| **`Tab`** (with a block selected) | a linked **child block**, on the right |
| **`Shift + Tab`** | a linked child block, on the **left** |
| **`Enter`** (with a block selected) | a **sibling block** below, linked to the same parent |

Important details:

- For "free" spots (buttons and keys without a mouse position) Mindly looks for a space that **does not overlap** existing blocks.
- **`Tab`** creates the child on the side where the branch already extends: to the right of the main block, to the left if the block is already on the left side.
- If a block **has no parent**, `Enter` creates a child on the right (like `Tab`).
- Blocks created with `Tab`, `Shift+Tab` and `Enter` are **standard secondary blocks**: they do not inherit color, bold or size from the starting block.
- Links created this way are **lines without arrowheads**.
- As soon as it is created, the block is already in typing mode with the text "New block" selected: type to replace it.

### Title block

It has a different style from the normal block: **dark gray (almost black)** background, **white** text, **bold**, larger font (20 px). It serves as the main block of the map. You can create as many as you want.

**Project name sync:** the default title block (the one created with a new project) is linked to the project name. When you edit its text, the project name changes too: top bar, browser tab title, Projects window and the project folder. The name is cut to 60 characters and line breaks become spaces; if you delete all the text the name stays as it was. Extra title blocks created with `T`, and pasted or duplicated ones, do not change the name. Projects created with older versions have no default title block: use *Rename project* for them.

### Selecting

- **Click** on a block: selects it.
- **`Shift + click`** or **`Ctrl + click`**: adds/removes a block from the selection.
- **`Shift + drag`** (or `Ctrl + drag`) on an empty background: area selection (rectangle).
- **`Ctrl + A`**: selects all blocks.
- **Click on an empty space** or **`Esc`**: deselects.

### Editing text

- **Double-click** on the block (or two quick clicks, or `F2`): the text is edited **directly inside the block**.
- While typing:
  - `Enter` → confirms the text.
  - `Shift + Enter` → new line (multi-line text).
  - `Esc` → cancels the edit.
  - `Tab` → confirms and creates a child on the right.
  - `Shift + Tab` → confirms and creates a child on the left.
  - `Ctrl + B` / `Ctrl + I` → bold / italic.
  - `Ctrl + Shift + E` → centers the text.
- Clicking elsewhere confirms the edit.

### Quick bar above the block

When you select a block, a small bar appears with just two buttons: **B** (bold) and *I* (italic). For colors and everything else, use the Properties panel (☰).

### Automatic sizing

Blocks **fit themselves to the text**:

- Width ranges from about **90 px** to about **340 px**.
- If the text is longer, it wraps and the block grows in height.
- Fitting happens when you change text, font size, font, bold, italic or shape.
- New blocks are born already the right size.
- If you resize a block **manually** (dragging an edge or typing width/height), that block **keeps the chosen size** (it only grows in height if the text no longer fits).
- To return to automatic fitting: select the block and press **Fit to text** at the bottom of the Properties panel.
- Blocks from old projects do not change size on opening: they fit the first time you change their text or style.

### Resizing

Select **a single block**: **8 handles** appear (4 corners and 4 sides).

- Drag a handle to resize freely.
- Hold **`Shift`** to **keep proportions** (like in Illustrator):
  - from the **corners** the block scales keeping the opposite corner fixed;
  - from the **sides** the other dimension changes too, staying centered.
- You can press or release `Shift` even in the middle of dragging.
- Minimum size: **40 × 24 px**.
- With snap active, resizing follows the grid.

### Moving

- **Drag** a block to move it.
- Together with the block, **all blocks linked "downstream"** move (those its arrows point to, and in a chain theirs): the whole **branch** moves. It works to the right and to the left.
- Hold **`Alt`** while dragging to move **only that block**, leaving the linked ones in place.
- With multiple blocks selected they all move, each with its own branch.

### Attaching a block to another (changing parent)

Drag a block **onto another**: the target is highlighted in **orange**. When you release:

- the link with the **old parent disappears**;
- a link is created from the **new block** (with the same style as the old line);
- the blocks linked below the moved one follow it.

You cannot attach a block to one of its own descendants (it would create a closed loop). If you release on an empty space, the parent does not change. `Ctrl+Z` undoes position and link together. In tidy mode, if the new parent is the main block, the side (right/left) depends on where you release.

### Deleting

`Delete` or `Backspace` (or the ✕ button or the menu). Deleting a block also deletes its links.

### Available shapes

- Rectangle
- Rounded rectangle (default, slightly rounded corners: radius 6)
- Circle
- Ellipse
- Pill

### Default block style

White background, dark gray text, 2 px dark gray border, Sans font at 16 px, centered text, 100% opacity.

---

## 8. Links (lines)

### Creating a link

You have four ways:

1. **Drag the dot ●**: select a block and drag one of the two arrow dots (on the **right** or **left** of the block) onto another block. While dragging you see a dashed line and the target block is highlighted in orange. It is enough to release on the block or close to its edge (about 28 px).
2. **Link mode (`L` or ⟷ button)**: click the starting block, then the target block.
3. **Context menu** on a block → *Link*, then click the target block.
4. **`Tab` / `Shift+Tab` / `Enter`**: create a new block already linked.

If a link already exists in the same direction between two blocks, a second one is not created. After manual creation the link stays **selected**.

### Where lines attach

Lines always start and end at the **center of one of the four sides** of a block, never at a corner. In tidy mode, parent-to-child lines always leave from the side facing the child (right or left) so they stay neat; in free mode the side is chosen by where the target block is. When you move a block, the line switches to the most suitable side on its own.

### Direction

A link goes **from** a block (parent) **to** a block (child). Direction matters for moving branches and for tidy mode.

### Line appearance

| Property | Options |
|---|---|
| **Type** | Straight line, **Curve** (default), Orthogonal |
| **Color** | any |
| **Thickness** | from 1 to 30 |
| **Dashed** | yes / no |
| **Start end** | None, Arrow, Dot |
| **End end** | None, Arrow, Dot |

New links have no arrowhead. Lines **automatically follow** the blocks when you move or resize them.

### Editing or deleting a link

- **Click the line** to select it.
- A bar appears above the line with: **color**, **arrow yes/no** (→) and **dashed** (┅).
- All properties are in the Properties panel.
- `Delete` removes the selected line.

---

## 9. Tidy mode and free mode

### Tidy (geometric) mode — default

Blocks **arrange themselves** as in MindMup, with regular spacing and an invisible grid:

- The **main block** (the one with no parent) stays fixed.
- Children are distributed **to the right and to the left**, one below the other, and each parent is **centered** relative to its children.
- Spacing is constant (about 70 px horizontally and 18 px vertically).
- The layout is **recalculated after every change**: creation, deletion, text, size, links, moves.
- **Sibling order**: depends on vertical position; if you drag a block up or down you change the order.
- **Side**: if you drag a direct child of the main block to the other side, it switches sides.
- Blocks **without links** are not moved by the layout.
- A block with multiple parents is placed under the first one.

### Free mode

Blocks stay **exactly where you put them**, with no automatic rearrangement.

### Switching between modes

- **⊞** button in the toolbar or menu *View → Tidy mode*.
- **Every project always opens in tidy mode** (even old projects); the choice of free mode only applies to the current session.
- Switching from tidy to free, blocks stay where tidy mode put them.
- When you open an old project, the rearrangement happens immediately on screen, but is written to the file only at the first change or save.
- `Ctrl+Z` in tidy mode undoes changes, but the layout is recalculated immediately; if you want to return to free positions, switch to free mode first and then undo.

---

## 10. The canvas: panning, zoom, grid

### Moving the view

- **Hold the left button on an empty space and move the mouse**: pans the whole map.
- **Mouse wheel** (without other keys): scrolls the map up and down.
- **`Shift + wheel`**: scrolls horizontally (if the mouse has side tilt, it uses that).
- **`Space + drag`** or the **middle button** of the mouse: pans the map even when starting over a block.

### Zoom

- **`Ctrl + wheel`**: zoom around the pointer. **The wheel alone does not zoom.**
- **`+`** and **`-`** keys (or `Ctrl++` and `Ctrl+-`), **+** and **−** buttons.
- **`0`** key: resets to 100%.
- **`1`** key or **`Ctrl+0`** or the **⤢** button: fits the map to the screen (maximum zoom 150% in this function).
- Zoom range: from **10%** to **400%**.
- The percentage is always visible in the toolbar and at the bottom right.

### Grid and snap

- **Grid** (▦): shows a background grid (20 px cells).
- **Snap** (⌗): moves and resizes blocks in 20 px "steps".
- Both settings are saved with the project.

### Minimap

A small overview of the whole map, in the top-right corner of the canvas.

- **Off by default**: at every startup the minimap is hidden. Turn it on with the **◫** button in the toolbar or *View → Minimap*; close it with the **✕** in its top bar (or the same button/menu again).
- **Navigate**: click or drag inside the minimap to move the view there. The dashed rectangle shows the part of the map you currently see.
- **Minimap zoom**: the **+** and **−** buttons, or `Ctrl + wheel` over the minimap. The percentage at the bottom right shows its zoom.
- **Reset to 100%**: click **the percentage itself** (there is no separate button). It also brings the minimap window back to its default size.
- **Pin**: the 📌 button pins it to the top-right corner. When unpinned, drag its top bar to move it anywhere in the work area.
- **Resize**: drag **only the four corners** (the small rounded marks); the sides do not resize. The opposite corner stays fixed and the dragged corner stays under the cursor. There is no maximum size, but the minimap always stays inside the work area, **at least 20 px from every edge** (minimum size 120 × 80 px).

### Saved view

The view's position and zoom are saved in the project and restored on reopening. If a project has no saved view, it is centered.

---

## 11. Properties panel

Opens with ☰. The content changes depending on what is selected. With **multiple blocks selected**, changes apply to **all** of them.

### Block

| Field | Description |
|---|---|
| **Text** | the text (only with a single block selected) |
| **Fill color** | block fill |
| **Text color** | font color |
| **Shape** | rectangle, rounded rectangle, circle, ellipse, pill |
| **Width / Height** | in pixels (typing them sets a "manual" size) |
| **Font** | Sans, Serif, Mono, Script (system fonts, work offline) |
| **Font size** | from 6 to 200 |
| **Style** | **B** bold, *I* italic, left / center / right alignment |
| **Border** | border color |
| **Border thickness** | from 0 to 30 |
| **Border radius** | from 0 to 200 (affects the rounded rectangle) |
| **Opacity** | from 10% to 100% |
| **Fit to text** | returns to automatic sizing |

### Link

Color, thickness, type (straight / curve / orthogonal), dashed, start end, end end, Delete button.

### No selection

Shows a short reminder.

---

## 12. Undo and Redo

- **Undo**: `Ctrl+Z`, ↶ button, Edit menu.
- **Redo**: `Ctrl+Y` or `Ctrl+Shift+Z`, ↷ button, Edit menu.
- Up to **300 steps** are remembered.
- Undoable: block creation and deletion, text changes, style and property changes, moving, resizing, links, duplication, paste, parent change.
- Repeated changes to the same property in quick succession (for example dragging a color picker) are **grouped** into a single step.
- View movements, zoom and settings (grid, snap) are not part of the history.

---

## 13. Copy, paste, duplicate

- **Copy** (`Ctrl+C`): copies the selected blocks **and the links between them**.
- **Cut** (`Ctrl+X`): copies and deletes.
- **Paste** (`Ctrl+V`): pastes with a 30 px offset (each subsequent paste shifts a bit more), and selects the pasted blocks.
- **Duplicate** (`Ctrl+D` or ⧉ button): immediately creates a copy of the selected blocks (with the links between them) without touching the clipboard.
- The clipboard is internal to Mindly (it does not use the Windows one).

---

## 14. Saving and autosave

- **Autosave**: about **1.5 seconds** after every change.
- **Manual save**: `Ctrl+S` or File menu → Save (shows the "Project saved" notification).
- **Save as / duplicate** (`Ctrl+Shift+S`): saves and creates a copy of the project with a new name, then opens it.
- **Status indicator** at the top:
  - *Saved* (green)
  - *Saving…*
  - *Unsaved changes* (orange)
  - *Save error* (red) — Mindly retries on the next change
- Changing the **view** (panning, zoom) and settings still triggers saving, without showing "Unsaved changes".
- If you close the tab with changes not yet saved, the browser asks for confirmation and Mindly attempts one last save on exit.
- Files are written **safely**: first to a temporary file and then replaced, so an error halfway through writing does not ruin the project.

---

## 15. Import, export and preview

Everything happens **locally**. The items are in the **File** menu, in this order: **Export ▸**, **Import…**, Preview. *Export* has an arrow (▸): click it, or just hover over it with the cursor, and a submenu opens with the export methods: PDF, PNG, SVG and JSON. *Import…* imports a JSON file.

### Important: always a light background

The site's dark theme **does not affect** exported files: PDF, PNG and SVG always have a **white** background. The colors of blocks and lines are those chosen in the project.

### Export PDF

Creates a **single-page** PDF the size of the map, with a small margin. The map is inserted as a **high-resolution image** (text is not selectable and the quality is not vector; for a vector result use SVG). Very large maps are scaled down to respect PDF limits.

### Export PNG

PNG image at **double resolution (2×)**, with a 40 px margin.

### Export SVG

Vector file, scalable without quality loss and editable with graphics programs.

### Export JSON

File with the whole map, useful as a backup or to move it to another computer. It contains the `mindly` format, the metadata (name, export date) and the complete project.

### Import JSON

Chooses a `.json` file (exported from Mindly, or a project with `nodes` and `links`) and creates **a new project** with that data, then opens it. If the file is not valid, "Invalid file" appears. An imported project never overwrites an existing one.

### Preview

Opens a window with the **entire map** as it will appear in the file (white background), scaled down to fit. At the bottom there are the **Export JSON**, **Export SVG**, **Export PDF**, **Export PNG** and **Close** buttons; the window stays open after each export, so you can download multiple formats.

### Empty map

If the map has no blocks, exports and preview show the warning "The map is empty".

Exported files take the project's name (invalid characters become `_`) and are downloaded by the browser to the downloads folder.

---

## 16. Theme

- Mindly's interface is in **English**.
- **Theme**: light or dark with the ☾ / ☀ button. Accent colors are black and dark gray (light gray in the dark theme).
- Theme, recent projects and Properties panel visibility are remembered by the browser, even after closing. The minimap is **not** remembered: it always starts off.

---

## 17. All keyboard shortcuts

You can also view them inside Mindly with **`F1`** or **`?`** ("Keyboard shortcuts" window), and next to menu items and in button hints.

### File and project

| Keys | Action |
|---|---|
| `Ctrl + N` | New project |
| `Ctrl + O` | Open project |
| `Ctrl + S` | Save |
| `Ctrl + Shift + S` | Save as / duplicate |
| `Ctrl + W` | Close project |

### Edit

| Keys | Action |
|---|---|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + Shift + Z` | Redo (alternative) |
| `Ctrl + C` | Copy |
| `Ctrl + X` | Cut |
| `Ctrl + V` | Paste |
| `Ctrl + D` | Duplicate |
| `Delete` / `Backspace` | Delete |
| `Ctrl + A` | Select all |
| `Esc` | Deselect / cancel the current operation |

### Creating blocks

| Keys | Action |
|---|---|
| `Tab` | Create a child block (on the right, linked) |
| `Shift + Tab` | Create a child block on the left |
| `Enter` | Create a sibling block (below, linked to the same parent) |
| `F2` | Edit the text of the selected block |
| `T` | Create a title block |
| `N` | Create a new block |
| `L` | Link mode |

### Canvas navigation

| Keys | Action |
|---|---|
| `+` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom to 100% |
| `1` | Fit the map to the screen |
| `Space + drag` | Pan the map |
| `Ctrl + wheel` | Zoom with the wheel |
| `Wheel` | Scroll the map |

### Selection

| Keys | Action |
|---|---|
| `Shift + click` | Add/remove a block from the selection |
| `Ctrl + click` | Multiple selection |
| `Shift + drag` (on the background) | Area selection |
| `Alt + drag` | Move only that block, without the linked ones |
| `Shift + resize` | Resize keeping proportions |
| Drag a block onto another | Attach it to the new block |
| `Esc` | Deselect |

### Formatting (with a block selected or while typing)

| Keys | Action |
|---|---|
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + Shift + E` | Center the text |

### View

| Keys | Action |
|---|---|
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Fit/reset view |
| `F11` | Full screen |

### Help

| Keys | Action |
|---|---|
| `F1` | Show shortcuts |
| `?` | Show the list of quick commands |

### While typing in a block

| Keys | Action |
|---|---|
| `Enter` | Confirm the text |
| `Shift + Enter` | New line |
| `Esc` | Cancel the edit |
| `Tab` | Confirm and create a child on the right |
| `Shift + Tab` | Confirm and create a child on the left |
| `Ctrl + B` / `Ctrl + I` | Bold / italic |
| `Ctrl + Shift + E` | Center the text |

### When typing in a text field

To avoid conflicts, while you type inside a field (project name, Properties panel, search…) the editor's shortcuts are **disabled**. Only `Ctrl+S`, `Ctrl+Shift+S`, `Ctrl+O`, `Ctrl+N` and `F1` remain active. If a window is open, `Esc` closes it.

### Beware of browser shortcuts

Some browsers **reserve** certain combinations and do not allow sites to intercept them, in particular `Ctrl+N` (new window) and `Ctrl+W` (close tab). The same actions are always available from the **File** menu.

---

## 18. Mouse commands

| Action | What it does |
|---|---|
| Click on a block | Selects |
| **Double-click** on a block | Edits the text |
| Double-click on an empty background | Creates a block |
| **Right double-click** on an empty background | Creates a title block |
| Right-click on an empty background | Canvas context menu (appears after about 0.3 seconds) |
| Right-click on a block | Block context menu |
| Click on a line | Selects the link |
| Drag a block | Moves the block and its branch |
| `Alt` + drag | Moves only the block |
| Drag a block onto another | Changes parent |
| Drag a block's handles | Resizes (with `Shift`: proportional) |
| Drag the dot ● | Links the block to another |
| Drag the background | Pans the map |
| `Shift` + drag on the background | Area selection |
| Wheel | Scroll up/down |
| `Shift` + wheel | Scroll right/left |
| `Ctrl` + wheel | Zoom |
| Middle button + drag | Pans the map |

---

## 19. Menus: full list of items

### File
New project · Open project… · Save · Save as / duplicate… · Rename project… · Close project · *(separator)* · **Export ▸** (submenu: PDF · PNG · SVG · JSON) · **Import…** · *(separator)* · Preview…

### Edit
Undo · Redo · *(separator)* · Cut · Copy · Paste · Duplicate · Delete · *(separator)* · Select all · Deselect / cancel operation

### Insert
Title block (main node) · New block · Create child block · Create child block on the left · Create sibling block · Link mode

### View
Properties · Minimap ✓ · Zoom in · Zoom out · Reset zoom (100%) · Fit map to screen · *(separator)* · Grid ✓ · Snap to grid ✓ · Tidy mode ✓ · *(separator)* · Full screen · Light/dark theme

(The ✓ sign indicates the active option.)

### Help
Keyboard shortcuts · About Mindly

---

## 20. Context menu (right-click)

### On an empty canvas space
New block · Paste · Select all · *(separator)* · Zoom in · Zoom out · Fit map · Grid ✓

A quick **right double-click**, instead of the menu, creates a title block.

### On a block
Edit text · Create child block · Create sibling block · Duplicate · Copy · Delete · Link · Properties

"Properties" opens the right side panel.

---

## 21. Notifications

Small, unobtrusive messages at the bottom right (they last about 3 seconds; red if they are errors). They appear for: project created, saved, deleted, renamed, duplicated; export completed; import completed; save error; load error; invalid file; empty map; "Select a block first"; "Open or create a project"; tidy/free mode change.

---

## 22. Where data is stored

All data is in the `projects/` folder next to `start.bat`.

### `project.json`

Contains everything needed to rebuild the map:

```json
{
  "version": 1,
  "nodes": [
    {
      "id": "a1b2c3d4", "x": -85, "y": -35, "w": 170, "h": 70,
      "text": "Central idea",
      "fill": "#6366f1", "color": "#ffffff",
      "font": "Segoe UI, Arial, sans-serif", "size": 20,
      "bold": true, "italic": false, "align": "center",
      "stroke": "#4f46e5", "sw": 2, "radius": 6,
      "opacity": 1, "shape": "rounded"
    }
  ],
  "links": [
    {
      "id": "e5f6g7h8", "from": "a1b2c3d4", "to": "i9j0k1l2",
      "color": "#64748b", "width": 2, "type": "curve",
      "dashed": false, "start": "none", "end": "none"
    }
  ],
  "settings": { "grid": true, "snap": false, "layout": "tidy" },
  "view": { "x": 400, "y": 300, "z": 1 }
}
```

- `nodes`: blocks (text, coordinates, size, colors, font, style, shape, opacity, `side` and manual size `manual` when present).
- `links`: links (from / to, color, thickness, type, dashing, ends).
- `settings`: grid, snap, mode.
- `view`: position (`x`, `y`) and zoom (`z`) of the view.

### `metadata.json`

```json
{
  "id": "4fc81d1843144b60a7d4e1161f8323a4",
  "name": "My map",
  "created": "2026-10-03T20:29:48+00:00",
  "modified": "2026-10-03T20:35:10+00:00",
  "version": 1,
  "app": "Mindly"
}
```

Name, unique ID, creation and modification dates (in UTC), version and application.

### Browser settings

Theme, recent projects and Properties panel visibility are saved in the browser (`localStorage`), not in the project folder.

### Backups and transfers

To make a backup, just **copy the `projects/` folder** (or the folder of a single project). To take a project to another computer, copy its folder into that computer's `projects/`, or use Export JSON → Import JSON.

---

## 23. Security and privacy

- The server listens **only on `127.0.0.1`**: it is not visible to other devices on the network.
- API requests are accepted only with host `localhost` or `127.0.0.1`.
- **No data is sent to the Internet**: no cloud, no accounts, no statistics.
- The site works **offline** and uses no CDNs, fonts or external libraries.
- The server **prevents access to files outside the projects folder** (path traversal protection).
- **Project names are validated** (invalid characters, reserved names, length).
- **Received JSON data is checked** (structure, maximum number of blocks and links, maximum size about 25 MB); malformed requests receive a clear error response.
- Pages are served without caching, so the latest version is always shown.

---

## 24. Technical details

- **Browser tab icon**: an inline 🧠 (brain) emoji written in `static/index.html`; no extra file is needed.
- **Frontend**: HTML5, CSS3 and modern JavaScript, no frameworks. The map is drawn in **SVG**.
- **Backend**: Python 3, standard library only (`http.server`), local HTTP server with REST API.
- **Port**: 8765, address `http://127.0.0.1:8765/`.

### Local APIs (used by the site)

| Method | Path | Function |
|---|---|---|
| `GET` | `/api/projects` | list of projects |
| `POST` | `/api/projects` | creates a project (`name`, optional `project`) |
| `GET` | `/api/projects/<id>` | reads a project (metadata and map) |
| `PUT` | `/api/projects/<id>` | saves the map |
| `DELETE` | `/api/projects/<id>` | deletes the project |
| `POST` | `/api/projects/<id>/rename` | renames (`name`) |
| `POST` | `/api/projects/<id>/duplicate` | duplicates (`name`) |

The `<id>`s are the project folder names. Possible errors: invalid name, project not found, invalid data, bad request, data too large.

### Notable behaviors

- **Atomic** saving of JSON files.
- The tidy layout is a two-sided tree algorithm, with subbranch heights recalculated at every change.
- For exports, the site generates an SVG, draws it on a canvas (PNG/PDF) and builds the PDF directly in the browser, without libraries.

---

## 25. Known limitations

- **Bold and italic** apply to the whole block, not to individual words.
- The **PDF** contains an image (text not selectable) and is a single page; huge maps are scaled down.
- **Fonts** are system fonts (Sans, Serif, Mono, Script): if a font is not installed on the computer, the browser uses a similar one.
- The **clipboard** (copy/paste) works only inside Mindly.
- The **moved branch** follows the direction of the arrows (from the source to the target).
- Some shortcuts (`Ctrl+N`, `Ctrl+W`) may be blocked by the browser: use the File menu.
- The program is designed for Windows (`start.bat`); on other systems it can be started with `python3 server.py --open` from the `Mindly` folder.

---

## 26. Troubleshooting

**Double-clicking `start.bat` says Python is not installed.**
Install Python 3 from <https://www.python.org/downloads/> and check "Add Python to PATH" during installation. Then try again.

**The browser doesn't open by itself.**
Open the browser yourself and go to `http://127.0.0.1:8765`. Check that the server's black window is still open.

**The message says the port is in use.**
Mindly is probably already open (look for another black window or an already open browser tab). Close the previous instance and restart.

**I updated the files but still see the old version.**
Reload the page without cache with `Ctrl + F5`.

**My projects don't appear in the list.**
Check that you are using the right `Mindly` folder and that the projects are inside `projects/`, each in its own subfolder with `project.json` and `metadata.json`.

**"Save error" appears.**
Check that the server window is still open and that the `projects/` folder is writable (not protected, not on a full or read-only disk). Mindly retries at the next save; meanwhile you can use *Export JSON* to keep your work safe.

**I press T (or ＋) and nothing happens.**
Check that you have a project open (if there isn't one, "New project" opens). The new block appears in a free spot near the center of the view: if you zoomed or moved the map, use `1` to fit the map to the screen.

**`Ctrl+N` or `Ctrl+W` don't work.**
They are reserved by the browser. Use the File menu.

**The exported map is blank.**
This happens if the map is empty (in that case the warning appears). Otherwise make sure you exported after creating blocks and try the *Preview*.

**I want to remove arrowheads from lines already created.**
Click the line and use the → button in the bar above the line, or set "End end: None" in the Properties panel.

---

## 27. Frequently asked questions

**Does Mindly need the Internet?**
No. It works completely offline.

**Where is my data?**
In the `projects/` folder, in readable JSON files.

**Can I open Mindly on two computers?**
Yes: copy the project folder (or use Export/Import JSON).

**Can I edit the files by hand?**
Yes, they are normal JSON, but make a backup first.

**How do I make a copy of a project?**
From the Projects window with the ⧉ (Duplicate) button, or with `Ctrl+Shift+S`.

**How do I change the theme?**
With the ☾/☀ button at the top right.

**Does the dark theme change exported files?**
No, exports are always on a white background.

**What happens if I close the server's black window?**
The site can no longer save. Restart `start.bat` to continue.

**How do I quickly create a map?**
Create a project (it already contains a title block), select it, press `Tab` and type, then `Enter` for a sibling, `Tab` for a child, `Esc` to stop. In tidy mode the map arranges itself.

---

*Mindly — local mind map editor. All data stays on your computer.*
