window.__ModuleLoader__.load({
	id: "dsh-wallpaper",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");

		//#region styles
		/**
		* Plugin-owned stylesheet. The wallpaper lives behind the shell: it is
		* pinned to the viewport, ignores pointer events, and only lifts the
		* frame's own opaque background while the plugin is active. Every colour
		* is a semantic `--dsw-*` token, so light/dark switching needs no
		* plugin-side media query and no theme selector appears here.
		*/
		const css = [
			// A backdrop has to paint below the shell's columns, and the overlay
			// seat cannot do that: its layer carries `z-index: 20`, so anything
			// rendered inside it stays above the sidebar, center column and
			// rightbar. The layer is therefore portalled onto the body and given
			// `z-index: 0`, which paints it before the shell's own in-flow root
			// while the frame's fill is made transparent by the rules below.
			//
			// It lives on the body rather than inside the frame because the frame
			// sets `overflow: hidden`, so a child sized to the viewport is still
			// clipped to the frame's own box — which is what left a bare band
			// along the bottom however it was sized. On the body there is no clip.
			".wpq_root{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;overflow:hidden;background:var(--wpq-page)}",
			".wpq_layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}",
			".wpq_scrim{position:absolute;inset:0;background:var(--wpq-scrim);pointer-events:none}",
			// Control affordances sit above the inert wallpaper layer and take
			// pointer events back.
			".wpq_ui{position:absolute;right:16px;bottom:16px;z-index:25;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}",
			".wpq_ui>*{pointer-events:auto}",
			// Visually hidden but still in the tree: the file input stays reachable
			// for assistive tech and for direct programmatic use.
			".wpq_file{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
			// Floating surfaces use the shell's own menu material: the themed fill
			// paired with the themed backdrop blur, `border: 0`, and a single
			// elevation shadow. That shadow already carries the hairline, so
			// stacking a neutral `--dsw-alias-border-*` rule on top of it is the
			// one combination the theme's elevation spec rejects.
			//
			// Radii come from the shared scale rather than local literals: a
			// compact control is R8, a standard input is R12, a floating panel is
			// R28, and the 8px inset inside that panel lands its inner surface on
			// R20 — the concentric rule, inner = outer − inset.
			".wpq_tab{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:0;border-radius:var(--dsw-radius-sm);background:var(--dsw-menu-surface-fill,var(--dsw-specific-menu));backdrop-filter:var(--dsw-menu-backdrop-filter);-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter);box-shadow:var(--dsw-elevation-panel);color:inherit;font:inherit;font-size:13px;line-height:20px;cursor:pointer}",
			".wpq_tab:hover{filter:brightness(1.08)}",
			// A count badge is a deliberate capsule, so it pairs the full-round
			// radius with the matching corner curve.
			".wpq_badge{min-width:16px;height:16px;padding:0 4px;border-radius:999px;corner-shape:round;background:var(--dsw-alias-border-l3);font-size:11px;line-height:16px;text-align:center}",
			".wpq_panel{width:288px;max-height:60vh;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:8px;border:0;border-radius:var(--dsw-radius-panel);background:var(--dsw-menu-surface-fill,var(--dsw-specific-menu));backdrop-filter:var(--dsw-menu-backdrop-filter);-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter);box-shadow:var(--dsw-elevation-panel);font-size:12px;line-height:16px}",
			".wpq_panelHead{display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:var(--dsw-radius-xl)}",
			".wpq_title{font-size:13px;line-height:20px;font-weight:600}",
			".wpq_row{display:flex;align-items:center;justify-content:space-between;gap:8px}",
			".wpq_label{opacity:.75}",
			// Inputs take the input-specific soft elevation, not the panel one.
			".wpq_input{width:96px;height:32px;padding:0 8px;border:0;border-radius:var(--dsw-radius-md);background:transparent;box-shadow:var(--dsw-elevation-soft);color:inherit;font:inherit;font-size:12px;line-height:16px}",
			".wpq_btn{height:28px;padding:0 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;font-size:11px;line-height:16px;cursor:pointer}",
			".wpq_btn:hover{filter:brightness(1.1)}",
			// Keyboard focus stays visible on every affordance; the outline is
			// drawn outside the surface so no clipping rule can hide it.
			".wpq_tab:focus-visible,.wpq_btn:focus-visible,.wpq_input:focus-visible{outline:2px solid var(--dsw-alias-link);outline-offset:2px}",
			".wpq_list{display:flex;flex-direction:column;gap:4px;margin-top:4px}",
			".wpq_item{display:flex;align-items:center;gap:6px}",
			".wpq_itemName{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.85}",
			".wpq_empty{opacity:.6;padding:6px 0}",
			".wpq_note{opacity:.6;padding:0 2px;font-size:11px;line-height:16px}",
			// While a wallpaper is showing, the shell's own opaque fills are the
			// only things hiding it. Two surfaces carry the opaque base token:
			// the frame, and the conversation root that fills the center column.
			// Everything between them (centerCol, rightbarCol, body, scrollBody)
			// is already transparent, so lifting these two is sufficient.
			//
			// The frame is matched by its class fragment; the conversation root
			// is matched through the `data-slot` contract instead, which is a
			// stable seam, so no panel, dock or modal is caught by the rule. Both
			// key off the attribute the plugin sets on the frame, so the whole
			// override stops applying the moment the layer unmounts.
			'div[class*="_frame"][data-wp-active="1"]{background:transparent!important;position:relative;z-index:1}',
			'div[class*="_frame"][data-wp-active="1"] [data-slot="main.conversation"]>*{background:transparent!important}',
			// The desktop shell (0.2.x) grew fills the web profile never had.
			// The centre column is painted with the base token to carry the
			// rounded top-left corner under the Windows title bar, and the
			// sidebar's own scroll root repaints the base token on top of the
			// glass below it. Both are keyed off the same attribute as the rest,
			// so they go transparent with the layer and nothing else changes.
			'div[class*="_frame"][data-wp-active="1"] [class*="_centerCol"]{background:transparent!important}',
			'div[class*="_frame"][data-wp-active="1"] [class*="_sidebarCol"] [data-slot="sidebar"]>*{background:transparent!important}',
			// The session list fades its last rows out into the sidebar fill
			// with a gradient, which on a glass sidebar is a bright bar lying
			// across the wallpaper. Fading to nothing keeps the same softening
			// without painting anything. Matched on the semantic suffix rather
			// than the hash, which changes every build.
			'[data-wp-active="1"] [class*="_sidebarCol"] span[class$="_fade"]{background-image:none!important}',
			// The composer seat fades conversation content out behind the input
			// with a gradient to the base fill — transparent for 36px, then solid
			// for the rest of the strip. Harmless on an opaque page, but against a
			// wallpaper it paints a white band across the bottom of the window.
			'div[class*="_frame"][data-wp-active="1"] [class*="_composerSeat"]{background-image:none!important}',
			// Dialogs and the right rail share the shell's own floating-menu recipe
			// — the themed menu fill and the menu backdrop blur — so they read as
			// the same kind of surface as the popovers the shell already raises.
			// Reached through tokens so a light/dark switch re-maps instead of
			// inverting into an unreadable slab. Dialogs are portalled to <body>,
			// outside the frame, which is why that rule keys off the root
			// attribute.
			'div[class*="_frame"][data-wp-active="1"] [data-slot="rightbar.session"] section[class*="_pane"]{background:var(--dsw-specific-menu)!important;backdrop-filter:var(--dsw-menu-backdrop-filter)!important;-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter)!important}',
			'html[data-wp-active="1"] [role="dialog"]{background:var(--dsw-specific-menu)!important;backdrop-filter:var(--dsw-menu-backdrop-filter)!important;-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter)!important;box-shadow:var(--dsw-elevation-prominent)}',
			// The Windows title bar is a pseudo-element on the frame itself, so
			// it is not a descendant of anything the rules above can reach. It
			// gets the same glass as the sidebar rather than a bare band.
			'div[class*="_frame"][data-wp-active="1"]:before{background:color-mix(in srgb,var(--dsw-alias-bg-base) 22%,transparent)!important;backdrop-filter:var(--wpq-glass-blur) saturate(1.35);-webkit-backdrop-filter:var(--wpq-glass-blur) saturate(1.35)}',
			// Backstop for anything outside the frame. Once the frame is
			// transparent, an unpainted strip of document would show the shell's
			// own light fill as a bare band along the bottom. Painting the page
			// and app roots with the scrim colour means any such gap reads as
			// part of the wallpaper instead of as a white bar. Scoped to
			// `data-wp-active` reaching the root, so it disappears with the
			// layer.
			'html:has(div[class*="_frame"][data-wp-active="1"]),body:has(div[class*="_frame"][data-wp-active="1"]),body:has(div[class*="_frame"][data-wp-active="1"])>div:first-child{background:var(--wpq-page,transparent)}',
			// The sidebar's own fill is an opaque light panel, which reads as a
			// hard white slab against the wallpaper. Give it glass instead: a
			// lightly tinted copy of the shell's own base colour so the wallpaper
			// shows through rather than through a hole.
			//
			// The blur radius is a plugin-owned custom property rather than a
			// literal, and it defaults to the `none` keyword. A large
			// `backdrop-filter` radius is the single most expensive thing this
			// plugin can ask the compositor for — several full-height blurred
			// surfaces over a playing video is the combination that takes the
			// renderer down on integrated GPUs — so the cost is opt-in and
			// bounded instead of being paid by every install.
			'[data-wp-active="1"] [class*="_sidebarCol"]{background:color-mix(in srgb,var(--dsw-alias-bg-base) 22%,transparent)!important;backdrop-filter:var(--wpq-glass-blur) saturate(1.35);-webkit-backdrop-filter:var(--wpq-glass-blur) saturate(1.35);opacity:1!important}',
		].join("");
		const styleTagId = "dsh-wallpaper/styles";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(styleTagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-wallpaper";
			tag.dataset.pluginCss = styleTagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region text
		/** User-facing copy, in one table so the panel has a single place to localize. */
		const TEXT = {
			tab: "Wallpaper",
			panel: "Wallpaper",
			close: "Close",
			library: "Library",
			add: "Add images / videos…",
			appearance: "Appearance",
			reset: "Reset",
			dim: "Dim",
			blur: "Blur (px)",
			glass: "Glass blur (px)",
			opacity: "Opacity (0=hidden)",
			interval: "Interval (s)",
			repeat: "Repeat",
			play: "Play video",
			pause: "Pause video",
			empty: "No wallpapers yet.",
			remove: "Remove",
			pick: "Choose wallpaper files",
			store: "Media is stored locally in IndexedDB."
		};
		//#endregion

		//#region media store
		/**
		* Blob store for the wallpaper library.
		*
		* The library used to inline each file as a base64 data URL inside
		* `localStorage`. That is what made a 25 MB video a 33 MB string, and
		* `localStorage` has no incremental write: every settings change rewrote
		* the whole thing, so the leveldb behind it grew a second full copy per
		* write. Blobs in IndexedDB keep the bytes out of the settings document
		* entirely and leave the panel free to store only scalar state.
		*/
		const DB_NAME = "dsh-wallpaper";
		const DB_STORE = "media";
		const DB_VERSION = 1;

		/**
		* Open the media database, creating the object store on first use.
		* @returns {Promise<IDBDatabase>} The open database.
		*/
		function openMediaDb() {
			return new Promise((resolve, reject) => {
				if (typeof indexedDB === "undefined") {
					reject(new Error("IndexedDB is unavailable"));
					return;
				}
				const request = indexedDB.open(DB_NAME, DB_VERSION);
				request.onupgradeneeded = () => {
					if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
				};
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
		}

		/**
		* Run one transaction against the media store and close it afterwards.
		* @param {IDBTransactionMode} mode - Transaction mode.
		* @param {(store: IDBObjectStore) => IDBRequest} run - The request to issue.
		* @returns {Promise<any>} The request result, resolved on commit.
		*/
		function withMediaStore(mode, run) {
			return openMediaDb().then((db) => new Promise((resolve, reject) => {
				const transaction = db.transaction(DB_STORE, mode);
				const request = run(transaction.objectStore(DB_STORE));
				transaction.oncomplete = () => {
					db.close();
					resolve(request === undefined ? undefined : request.result);
				};
				transaction.onerror = () => {
					db.close();
					reject(transaction.error);
				};
				transaction.onabort = () => {
					db.close();
					reject(transaction.error);
				};
			}));
		}

		/** The blob operations the library needs, each self-contained per call. */
		const mediaStore = {
			/** @param {string} id - Library item id. @param {Blob} blob - Bytes to keep. */
			put: (id, blob) => withMediaStore("readwrite", (store) => store.put(blob, id)),
			/** @param {string} id - Library item id. @returns {Promise<Blob|undefined>} The stored bytes. */
			get: (id) => withMediaStore("readonly", (store) => store.get(id)),
			/** @param {string} id - Library item id. */
			remove: (id) => withMediaStore("readwrite", (store) => store.delete(id))
		};
		//#endregion

		//#region settings
		/** Durable, plugin-owned settings. Kept in localStorage so a reload keeps the choice. */
		const STORAGE_KEY = "dsh-wallpaper:settings";
		/** Settings schema version; a mismatch triggers the media migration below. */
		const SETTINGS_VERSION = 2;
		/**
		* Defaults: no wallpaper until the user picks one, gently dimmed, and no
		* video playback and no backdrop blur until they are asked for.
		*/
		const DEFAULTS = {
			version: SETTINGS_VERSION,
			items: [],
			index: 0,
			playing: false,
			repeat: "one",
			intervalSec: 30,
			dim: 0.35,
			blurPx: 0,
			glassBlurPx: 0,
			opacity: 1
		};
		/** Upper bound for the glass blur, in px. Beyond this the compositor cost is not worth it. */
		const MAX_GLASS_BLUR = 24;

		/**
		* Clamp one stored number into its field range.
		* @param {unknown} raw - Stored value.
		* @param {number} min - Field lower bound.
		* @param {number} max - Field upper bound.
		* @param {number} fallback - Value used when the stored one is unusable.
		* @returns {number} A usable number.
		*/
		function numberOr(raw, min, max, fallback) {
			const value = Number(raw);
			if (!Number.isFinite(value)) return fallback;
			return Math.min(max, Math.max(min, value));
		}

		/**
		* Read the persisted settings, falling back to defaults per key so a
		* settings file written by an older version still loads.
		* @returns {typeof DEFAULTS} The effective settings object.
		*/
		function loadSettings() {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (!raw) return { ...DEFAULTS };
				const parsed = JSON.parse(raw);
				const items = Array.isArray(parsed.items) ? parsed.items : [];
				return {
					version: SETTINGS_VERSION,
					// A legacy entry carries its bytes inline; the migration moves
					// them into the blob store and rewrites the entry.
					items: items.map((item) => ({ id: item.id, name: item.name, kind: item.kind, type: item.type || "", size: item.size, src: item.src })),
					index: numberOr(parsed.index, 0, Math.max(0, items.length - 1), 0),
					playing: parsed.playing === true,
					repeat: ["one", "all", "off"].includes(parsed.repeat) ? parsed.repeat : DEFAULTS.repeat,
					intervalSec: numberOr(parsed.intervalSec, 5, 3600, DEFAULTS.intervalSec),
					dim: numberOr(parsed.dim, 0, 0.9, DEFAULTS.dim),
					blurPx: numberOr(parsed.blurPx, 0, 40, DEFAULTS.blurPx),
					glassBlurPx: numberOr(parsed.glassBlurPx, 0, MAX_GLASS_BLUR, DEFAULTS.glassBlurPx),
					opacity: numberOr(parsed.opacity, 0, 1, DEFAULTS.opacity)
				};
			} catch {
				return { ...DEFAULTS };
			}
		}

		/**
		* Persist settings, ignoring quota/private-mode failures so playback is
		* never interrupted by a storage problem.
		* @param {object} next - Settings to store.
		*/
		function saveSettings(next) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch {
				/* non-fatal */
			}
		}

		/**
		* Strip the inline payload from a library entry, leaving its metadata.
		* @param {object} item - Stored library entry.
		* @returns {object} The same entry without inline bytes.
		*/
		function withoutBytes(item) {
			return { id: item.id, name: item.name, kind: item.kind, type: item.type || "", size: item.size };
		}

		/**
		* Move any legacy inline media into the blob store.
		*
		* Older versions stored every file as a data URL inside the settings
		* document. This copies those bytes into IndexedDB once, then rewrites
		* the settings so the multi-megabyte string is gone from `localStorage`
		* for good. An entry whose bytes cannot be read back is dropped rather
		* than kept as a permanently broken row.
		* @param {object} settings - Settings as loaded.
		* @param {(next: object) => void} commit - Writer for the cleaned-up settings.
		* @returns {Promise<boolean>} Whether anything was migrated.
		*/
		async function migrateInlineMedia(settings, commit) {
			const legacy = settings.items.filter((item) => typeof item.src === "string" && item.src.startsWith("data:"));
			if (legacy.length === 0) return false;
			const moved = new Map();
			for (const item of legacy) {
				try {
					const response = await fetch(item.src);
					await mediaStore.put(item.id, await response.blob());
					moved.set(item.id, withoutBytes(item));
				} catch {
					/* drop the entry: its bytes are not recoverable */
				}
			}
			commit({ ...settings, items: settings.items.map((item) => moved.get(item.id) ?? withoutBytes(item)) });
			return true;
		}
		//#endregion

		//#region library
		const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;

		/**
		* Classify a picked file as a video or a still image by extension first,
		* then by MIME type. Returns null for anything else.
		* @param {File} file - picked file.
		* @returns {"video"|"image"|null} the wallpaper kind.
		*/
		function kindOf(file) {
			const name = file.name || "";
			if (VIDEO_EXT.test(name)) return "video";
			const type = file.type || "";
			if (type.startsWith("video/")) return "video";
			if (type.startsWith("image/")) return "image";
			return null;
		}

		/**
		* Turn picked files into library entries and keep their bytes in the blob
		* store. Nothing is copied into the settings document.
		* @param {FileList|File[]} files - picked files.
		* @returns {Promise<object[]>} the accepted library entries.
		*/
		async function buildItems(files) {
			const items = [];
			for (const file of Array.from(files)) {
				const kind = kindOf(file);
				if (kind === null) continue;
				const id = `${file.name}-${file.size}-${file.lastModified || 0}`;
				try {
					await mediaStore.put(id, file);
				} catch {
					/* storage refused this file; skip it rather than list a dead row */
					continue;
				}
				items.push({ id, name: file.name, kind, type: file.type || "", size: file.size });
			}
			return items;
		}

		/**
		* Resolve the current entry to an object URL, revoking it when the entry
		* changes or the component unmounts.
		* @param {object|null} item - Current library entry.
		* @returns {string|null} An object URL, or null while it resolves or on failure.
		*/
		function useItemUrl(item) {
			const [url, setUrl] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!item) {
					setUrl(null);
					return;
				}
				let cancelled = false;
				let created = null;
				mediaStore.get(item.id).then((blob) => {
					if (cancelled || !(blob instanceof Blob)) return;
					created = URL.createObjectURL(blob);
					setUrl(created);
				}).catch(() => {
					if (!cancelled) setUrl(null);
				});
				return () => {
					cancelled = true;
					if (created) URL.revokeObjectURL(created);
				};
			}, [item && item.id]);
			return url;
		}

		/**
		* Whether motion should be suppressed for this session.
		* @returns {boolean} True when the user asked for reduced motion.
		*/
		function prefersReducedMotion() {
			try {
				return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			} catch {
				return false;
			}
		}
		//#endregion

		//#region components
		// React is reached through runtime property access (`react.useState`)
		// rather than destructured at module scope: the bundle graph is lazy, so
		// `require("react")` resolves to a placeholder that only carries real
		// exports once this factory is materialized.

		/**
		* The wallpaper surface itself: one media element for the current item, a
		* dim scrim on top of it, and the frame attribute that lets the shell's
		* stylesheet go transparent. Renders nothing when the library is empty.
		* @param {object} props - Wallpaper state.
		* @returns {object} the wallpaper layer, or null.
		*/
		function WallpaperLayer({ item, playing, dim, blurPx, opacity, pageColor }) {
			const url = useItemUrl(item);
			const videoRef = (0, react.useRef)(null);
			const isVideo = item != null && item.kind === "video";
			// Reduced motion wins over the play toggle: a user who asked the
			// system to cut animation does not get a looping background video.
			const shouldPlay = isVideo && playing && !prefersReducedMotion();

			(0, react.useEffect)(() => {
				const el = videoRef.current;
				if (!el) return;
				if (shouldPlay) {
					const started = el.play();
					if (started && typeof started.catch === "function") started.catch(() => {});
				} else {
					el.pause();
				}
			}, [shouldPlay, url]);

			// A background video has no business decoding while its window is
			// hidden. Reconnecting on the way back keeps the loop seamless.
			(0, react.useEffect)(() => {
				if (!isVideo) return;
				const sync = () => {
					const el = videoRef.current;
					if (!el) return;
					if (document.hidden) {
						el.pause();
					} else if (shouldPlay) {
						const started = el.play();
						if (started && typeof started.catch === "function") started.catch(() => {});
					}
				};
				document.addEventListener("visibilitychange", sync);
				return () => document.removeEventListener("visibilitychange", sync);
			}, [isVideo, shouldPlay]);

			if (!item) return null;
			const style = { opacity, filter: blurPx > 0 ? `blur(${blurPx}px)` : void 0 };
			return (0, react_jsx_runtime.jsx)("div", {
				className: "wpq_root",
				style: {
					"--wpq-scrim": `rgba(0,0,0,${dim})`,
					"--wpq-page": pageColor
				},
				children: [
					url ? isVideo ? (0, react_jsx_runtime.jsx)("video", {
						ref: videoRef,
						className: "wpq_layer",
						src: url,
						muted: true,
						loop: true,
						playsInline: true,
						autoPlay: shouldPlay,
						preload: "metadata",
						disablePictureInPicture: true,
						style
					}) : (0, react_jsx_runtime.jsx)("img", {
						className: "wpq_layer",
						src: url,
						alt: "",
						style
					}) : (0, react_jsx_runtime.jsx)("div", { className: "wpq_scrim" }),
					(0, react_jsx_runtime.jsx)("div", { className: "wpq_scrim" })
				]
			});
		}

		/**
		* The settings panel. Plain DOM inputs styled with the shell's own tokens
		* so it matches the app in both palettes without a theme listener.
		* @param {object} props - Settings plus a change callback.
		* @returns {object} the panel element.
		*/
		function SettingsPanel({ settings, onChange, onPick, onReset, onRemove, onClose }) {
			/**
			* Commit a numeric field.
			*
			* An emptied `<input type="number">` reports `""`, and `Number("")` is
			* 0 — writing that straight through meant clearing a field silently
			* stored 0. For Opacity that hides the wallpaper completely with no
			* obvious way back, because the stored value persists. An empty or
			* unparseable draft is therefore ignored and the previous value stands,
			* and a parsed value is clamped into the field's own range so a
			* half-typed number never lands out of bounds.
			* @param {string} key - Setting to write.
			* @param {string|number} raw - Raw input value.
			* @param {number} min - Field lower bound.
			* @param {number} max - Field upper bound.
			*/
			const commitNumber = (key, raw, min, max) => {
				if (raw === "" || raw === null || raw === void 0) return;
				const value = Number(raw);
				if (!Number.isFinite(value)) return;
				onChange(key, Math.min(max, Math.max(min, value)));
			};
			const numberField = (key, label, min, max, step) => (0, react_jsx_runtime.jsx)("label", {
				className: "wpq_row",
				children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: label }), (0, react_jsx_runtime.jsxs)("input", {
					type: "number",
					className: "wpq_input",
					min,
					max,
					step,
					value: settings[key],
					onChange: (e) => commitNumber(key, e.target.value, min, max)
				})]
			});
			const currentIsVideo = (settings.items[settings.index] || {}).kind === "video";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "wpq_panel",
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_panelHead",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_title", children: TEXT.panel }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onClose, children: TEXT.close })]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.library }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onPick, children: TEXT.add })]
					}),
					currentIsVideo ? (0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.play }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: () => onChange("playing", !settings.playing), children: settings.playing ? TEXT.pause : TEXT.play })]
					}) : null,
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.appearance }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onReset, children: TEXT.reset })]
					}),
					numberField("dim", TEXT.dim, 0, 0.9, 0.05),
					numberField("blurPx", TEXT.blur, 0, 40, 1),
					numberField("glassBlurPx", TEXT.glass, 0, MAX_GLASS_BLUR, 1),
					numberField("opacity", TEXT.opacity, 0, 1, 0.05),
					numberField("intervalSec", TEXT.interval, 5, 3600, 5),
					(0, react_jsx_runtime.jsx)("label", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.repeat }), (0, react_jsx_runtime.jsxs)("select", {
							className: "wpq_input",
							value: settings.repeat,
							onChange: (e) => onChange("repeat", e.target.value),
							children: ["one", "all", "off"].map((mode) => (0, react_jsx_runtime.jsx)("option", { value: mode, key: mode, children: mode }))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "wpq_list",
						children: settings.items.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "wpq_empty", children: TEXT.empty }) : settings.items.map((item, i) => (0, react_jsx_runtime.jsxs)("div", {
							className: "wpq_item",
							key: item.id,
							children: [(0, react_jsx_runtime.jsxs)("button", { className: "wpq_btn", onClick: () => onChange("index", i), title: item.name, children: i === settings.index ? "●" : "○" }), (0, react_jsx_runtime.jsx)("span", { className: "wpq_itemName", children: item.name }), (0, react_jsx_runtime.jsx)("button", {
								className: "wpq_btn",
								onClick: () => onRemove(item.id),
								children: TEXT.remove
							})]
						}))
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "wpq_note", children: TEXT.store })
				]
			});
		}
		//#endregion

		//#region plugin
		/** Required service: the UI slot registry. */
		const inject = ["slots"];
		/**
		* The plugin root, registered as a real React component.
		*
		* Hooks may only run while React is rendering, so all plugin state lives
		* here rather than in `apply`, which runs outside any render pass. The
		* plugin owns one settings object and every control writes through a
		* single updater, so persistence never drifts from what is on screen.
		* @returns {object} the wallpaper layer plus its control affordances.
		*/
		function WallpaperRoot() {
			const [settings, setSettings] = (0, react.useState)(loadSettings);
			const [panelOpen, setPanelOpen] = (0, react.useState)(false);
			const fileRef = (0, react.useRef)(null);

			const update = (0, react.useCallback)((key, value) => {
				setSettings((prev) => {
					const next = { ...prev, [key]: value };
					saveSettings(next);
					return next;
				});
			}, []);

			// Escape hatch for settings that were already persisted in a state
			// that hides the wallpaper — most easily reached before numeric
			// fields clamped their input, when clearing one stored 0. Restores
			// every non-library value; the wallpaper library itself is untouched.
			const reset = (0, react.useCallback)(() => {
				setSettings((prev) => {
					const next = { ...DEFAULTS, items: prev.items, index: prev.index };
					saveSettings(next);
					return next;
				});
			}, []);

			const pick = (0, react.useCallback)(() => {
				if (fileRef.current) fileRef.current.click();
			}, []);

			const onFiles = (0, react.useCallback)((event) => {
				const files = event.target.files;
				if (!files || files.length === 0) return;
				buildItems(files).then((items) => {
					if (items.length === 0) return;
					setSettings((prev) => {
						const next = { ...prev, items: [...prev.items, ...items], index: prev.items.length };
						saveSettings(next);
						return next;
					});
				});
				event.target.value = "";
			}, []);

			// Move any bytes left inline by an older version into the blob store
			// on first mount, then drop them from the settings document.
			(0, react.useEffect)(() => {
				let cancelled = false;
				migrateInlineMedia(settings, (cleaned) => {
					if (cancelled) return;
					setSettings(cleaned);
				}).catch(() => {});
				return () => {
					cancelled = true;
				};
				// Runs once: later edits already produce inline-free entries.
			}, []);

			// Dropping a library row also drops its bytes, so the blob store does
			// not keep growing behind a shrinking list. The row is removed from
			// the settings first — a blob the store refused to delete is a far
			// smaller problem than a row pointing at nothing.
			const removeItem = (0, react.useCallback)((id) => {
				setSettings((prev) => {
					const items = prev.items.filter((entry) => entry.id !== id);
					const next = { ...prev, items, index: items.length === 0 ? 0 : Math.min(prev.index, items.length - 1) };
					saveSettings(next);
					return next;
				});
				mediaStore.remove(id).catch(() => {});
			}, []);

			const item = settings.items[settings.index] ?? null;

			// Rotate through the library on the configured interval. Videos keep
			// looping on their own, so the timer only advances stills.
			(0, react.useEffect)(() => {
				if (settings.items.length < 2) return;
				if (settings.repeat === "off") return;
				const timer = setInterval(() => {
					setSettings((prev) => {
						if (prev.items.length < 2) return prev;
						if (prev.repeat === "one") return prev;
						const nextIndex = (prev.index + 1) % prev.items.length;
						const next = { ...prev, index: nextIndex };
						saveSettings(next);
						return next;
					});
				}, Math.max(5, settings.intervalSec) * 1000);
				return () => clearInterval(timer);
			}, [settings.items.length, settings.repeat, settings.intervalSec]);

			// The frame only goes transparent while a wallpaper is on screen; the
			// attribute is the switch the stylesheet keys off, so removing the
			// layer restores the shell's own background with no extra cleanup.
			//
			// The glass radius is published on the document element because the
			// surfaces it applies to — sidebar, dialogs, title bar — are siblings
			// of the portalled layer, not descendants of it. It is a plugin-owned
			// property, restored on unmount, and defaults to the `none` keyword
			// so an untouched install asks the compositor for no backdrop filter
			// at all.
			// The layer is only mounted once the desktop frame is actually on the
			// page. The web profile has no such frame, and a wallpaper covering
			// the whole web UI would be a surprise there rather than a feature.
			const [backdropReady, setBackdropReady] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (!item) {
					setBackdropReady(false);
					return;
				}
				const frame = document.querySelector('[class*="_frame"]');
				if (frame === null) {
					setBackdropReady(false);
					return;
				}
				const root = document.documentElement;
				const previousBlur = root.style.getPropertyValue("--wpq-glass-blur");
				root.style.setProperty("--wpq-glass-blur", settings.glassBlurPx > 0 ? `${settings.glassBlurPx}px` : "none");
				frame.setAttribute("data-wp-active", "1");
				// Dialogs are portalled to <body>, outside the frame, so the flag
				// has to exist on the root as well for them to be reachable.
				root.setAttribute("data-wp-active", "1");
				setBackdropReady(true);
				return () => {
					setBackdropReady(false);
					frame.removeAttribute("data-wp-active");
					root.removeAttribute("data-wp-active");
					if (previousBlur) root.style.setProperty("--wpq-glass-blur", previousBlur);
					else root.style.removeProperty("--wpq-glass-blur");
				};
			}, [item, settings.glassBlurPx]);

			// Derived from the shell's own base token so the backstop follows the
			// light/dark palette instead of hardcoding one.
			const pageColor = "color-mix(in srgb, var(--dsw-alias-bg-base) 70%, black)";

			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
				children: [
					// Portalled to the body so the backdrop paints behind the
					// columns; the controls stay in the overlay seat, where the
					// shell already keeps floating surfaces.
					backdropReady ? (0, react_dom.createPortal)((0, react_jsx_runtime.jsx)(WallpaperLayer, {
						item,
						playing: settings.playing,
						dim: settings.dim,
						blurPx: settings.blurPx,
						opacity: settings.opacity,
						pageColor
					}), document.body) : null,
					(0, react_jsx_runtime.jsxs)("div", {
						className: "wpq_ui",
						children: [
							(0, react_jsx_runtime.jsx)("input", { ref: fileRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: onFiles, className: "wpq_file", "aria-label": TEXT.pick }),
							(0, react_jsx_runtime.jsxs)("button", {
								className: "wpq_tab",
								onClick: () => setPanelOpen((open) => !open),
								title: TEXT.tab,
								children: [
									(0, react_jsx_runtime.jsx)("span", { children: "🖼" }),
									settings.items.length > 0 ? (0, react_jsx_runtime.jsx)("span", { className: "wpq_badge", children: String(settings.items.length) }) : null
								]
							}),
							panelOpen ? (0, react_jsx_runtime.jsx)(SettingsPanel, { settings, onChange: update, onPick: pick, onReset: reset, onRemove: removeItem, onClose: () => setPanelOpen(false) }) : null
						]
					})
				]
			});
		}
		//#endregion

		/**
		* Register the wallpaper root into the shell's overlay slot. `apply` only
		* declares work for the slot registry; every hook call lives in the
		* component above, which React renders.
		*
		* `shell.overlay` is declared by ui-layout's root entry, so registration
		* goes through `slots.inject` to wait for that declaration instead of
		* racing it. The slot is an additive list seat, so entries are keyed by
		* their own `id` and sit beside the shipped occupants rather than
		* shadowing them; the layer is click-through until an occupant opts into
		* pointer events.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({ name: "shell.overlay", id: "dsh-wallpaper" }, WallpaperRoot));
		}

		exports.WallpaperRoot = WallpaperRoot;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
