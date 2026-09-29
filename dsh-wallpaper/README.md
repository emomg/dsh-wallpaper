# dsh-wallpaper

A wallpaper layer for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
(`dsh`) web client. It puts an image or a looping video behind the whole app —
the in-app equivalent of what Wallpaper Engine does for the desktop — with a
local library, a playlist, and dim / blur / opacity controls.

## What it does

- **Image and video wallpapers.** Videos loop silently; autoplay-policy
  rejections are swallowed rather than surfaced as errors.
- **A local library.** Pick images and videos from disk; they are inlined as
  data URLs and stored in `localStorage`, so the library survives restarts
  without any server or file-system access.
- **A playlist.** Rotate the library on an interval, with `one` / `all` / `off`
  repeat modes and per-item selection.
- **Dim, blur, opacity.** Tuned so conversation text stays readable over any
  wallpaper.
- **Theme-aware.** Every colour is a semantic `--dsw-*` token, so the plugin
  follows dsh's light/dark palette with no theme listener of its own.

## Install

```
dsh-wallpaper\remount.cmd
```

Then start dsh. The wallpaper control appears in the bottom-right corner of
the web UI; click it to open the panel and add wallpapers.

## Uninstall

```
dsh-wallpaper\unmount.cmd
```

## How it is mounted

The plugin is mounted through dsh's **home-level patch layer**, a single file:

```
%USERPROFILE%\.dsh\cordis.patch.yml
```

```yaml
- insert:
    - id: wallpaper
      name: '<path to dsh-wallpaper/lib/index.js>'
```

That one line is the entire footprint inside the dsh installation. dsh's own
packages under `.dsh\profiles\node_modules` are never modified, so a dsh
upgrade cannot clobber the plugin and the plugin cannot break an upgrade.

The browser half ships through the package's `./client` export and is served by
dsh like any other client plugin, over `/plugins/dsh-wallpaper/client.js`.

## How the backdrop gets behind the shell

The shell's `root` slot owns three columns and a `shell.overlay` floating layer.
The overlay layer is the natural seat for a floating surface, but it carries
`z-index: 20`, so anything rendered inside it sits *above* the columns and hides
the app. So the layer is split:

- **The wallpaper** is portalled onto the frame element itself and given
  `z-index: -1`, which paints it after the frame's own fill but before its
  in-flow children — the sidebar, center column and rightbar.
- **The controls** stay in the `shell.overlay` seat, where the shell already
  keeps floating surfaces.

Two surfaces carry an opaque `--dsw-alias-bg-base` fill: the frame, and the
conversation root that fills the center column. Both go transparent while a
wallpaper is showing, driven by a single `data-wp-active` attribute the plugin
sets on the frame and removes on cleanup. Nothing else is restyled, and the
override stops applying the moment the layer unmounts.

## Working on the code

The repository is the rollback mechanism. Commit before experimenting:

```
git status
git add -A
git commit -m "..."
```

Revert a change that broke something:

```
git log --oneline
git revert <sha>        # keep history
git checkout <sha> -- dsh-wallpaper   # or just take one file back
```

After editing `lib/client.js`, restart dsh — the served bundle is snapshotted
at boot. `dsh --profile web --dump-config` prints the composed tree and is the
fastest way to confirm the plugin is mounted:

```
node "%USERPROFILE%\.dsh\profiles\node_modules\@deepseek-ai\dsh\lib\bin.js" --profile web --dump-config
```

## Notes on the runtime

Two constraints shape the browser half, both learned the hard way:

1. **Hooks only run inside a React render.** `apply(ctx)` runs outside one, so
   all state lives in the registered `WallpaperRoot` component, not in `apply`.
2. **React is reached through runtime property access** (`react.useState`),
   never destructured at module scope — the module graph is lazy, so
   `require("react")` resolves to a placeholder until the factory is
   materialized.

`shell.overlay` is a list slot, so registration needs an explicit `id`, and it
is declared by the ui-layout root entry, so registration goes through
`ctx.slots.inject` to wait for that declaration.

## Limitations

- Wallpapers are inlined as data URLs, so the library is bounded by
  `localStorage` (roughly 5 MB). Video wallpapers in particular will hit that
  ceiling quickly; a folder-backed library would need host-side file access.
- One wallpaper spans the whole window. Per-monitor assignment is not
  meaningful in a single-window web client.
- There is no screensaver mode — that is an OS-level concern outside the app.
