# ProximaStruc on desktop

The desktop app is a small [Tauri](https://tauri.app) shell: one frameless window that opens the live ProximaStruc site (`proximastruc.vercel.app`). There is no browser address bar, no ⋮ menu and no "App info / Uninstall" entry in the window. The window shows only a thin title bar with the app name and minimise / maximise / close.

Features, Google sign-in and data all come from the website, so **website deploys update the app**; the shell only needs rebuilding when the site address, icon or window behaviour changes.

| Part | Where |
| --- | --- |
| Shell project | `desktop/` |
| Site address and window setup | `desktop/src-tauri/src/lib.rs` (`SITE`) and `desktop/src-tauri/capabilities/default.json` |
| Title bar (injected into the page) | `desktop/src-tauri/src/titlebar.js` |
| Build workflow | `.github/workflows/desktop.yml` (Actions tab, "Desktop") |
| Icons | generated from `public/icons/icon-512.png` during the build |

## Build the installer

GitHub → **Actions** → **Desktop** → **Run workflow**. When it finishes, download the artifact for your system:

- **Windows:** `proximastruc-desktop-windows-latest` contains a `.exe` installer (and `.msi`).
- **macOS:** `proximastruc-desktop-macos-latest` contains a `.dmg`.

The installers are not code-signed. Windows SmartScreen shows "Windows protected your PC" (More info → Run anyway); on macOS, right-click the app → Open the first time.

To build on your own computer you need Node, Rust and the [Tauri prerequisites](https://tauri.app/start/prerequisites/):

```bash
cd desktop
npm install
npm run icons
npm run dev     # run the window
npm run build   # make the installer
```

## Notes

- **Sign-in:** Google sign-in opens inside the window. Google restricts sign-in in some embedded browsers, so test it first on a fresh install.
- **Links to other sites** open in your normal browser instead of the app window.
- **Title bar space:** the shell adds 32px of space at the top of the page and sets `--desktop-titlebar-height` and an `html.desktop-shell` class, so fixed headers can be offset with CSS if any sit under the bar.
- **Changing the site address:** edit `SITE` in `lib.rs`, the `INTERNAL_HOSTS` list beside it, and the `remote.urls` entry in `capabilities/default.json`.
