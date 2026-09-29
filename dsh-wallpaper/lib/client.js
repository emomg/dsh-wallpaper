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
		* pinned to the frame box, ignores pointer events, and only lifts the
		* frame's own opaque background while the plugin is active. Every colour
		* is a semantic `--dsw-*` token, so light/dark switching needs no
		* plugin-side media query.
		*/
		const css = [
			// A backdrop has to paint below the shell's columns, and the overlay
			// seat cannot do that: its layer carries `z-index: 20`, so anything
			// rendered inside it stays above the sidebar, center column and
			// rightbar. The layer is therefore portalled onto the frame element
			// and given a negative z-index, which paints it after the frame's own
			// fill but before its in-flow children — the columns — exactly the
			// ordering a background needs.
			".wpq_root{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}",
			".wpq_layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}",
			".wpq_scrim{position:absolute;inset:0;background:var(--wpq-scrim,transparent);pointer-events:none}",
			// Control affordances sit above the inert wallpaper layer and take
			// pointer events back.
			".wpq_ui{position:absolute;right:16px;bottom:16px;z-index:25;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}",
			".wpq_ui>*{pointer-events:auto}",
			// Visually hidden but still in the tree: the file input stays reachable
			// for assistive tech and for direct programmatic use.
			".wpq_file{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
			".wpq_tab{position:relative;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-elevation-panel,var(--dsw-specific-sidebar-fill));color:inherit;font:inherit;font-size:13px;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 1px 4px var(--dsw-elevation-stroke-color,#0000001f)}",
			".wpq_tab:hover{filter:brightness(1.08)}",
			".wpq_badge{min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--dsw-elevation-stroke,var(--dsw-alias-border-l3));font-size:11px;line-height:16px;text-align:center}",
			".wpq_panel{width:280px;max-height:60vh;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-elevation-panel,var(--dsw-specific-sidebar-fill));backdrop-filter:blur(12px);box-shadow:0 4px 16px var(--dsw-elevation-stroke-color,#0000001f);font-size:12px}",
			".wpq_panelHead{display:flex;align-items:center;justify-content:space-between}",
			".wpq_title{font-size:13px;font-weight:600}",
			".wpq_row{display:flex;align-items:center;justify-content:space-between;gap:8px}",
			".wpq_label{opacity:.75}",
			".wpq_input{width:96px;padding:3px 6px;border-radius:6px;border:.5px solid var(--dsw-alias-border-l3);background:transparent;color:inherit;font:inherit}",
			".wpq_btn{padding:3px 8px;border-radius:6px;border:.5px solid var(--dsw-alias-border-l3);background:transparent;color:inherit;font:inherit;font-size:11px;cursor:pointer}",
			".wpq_btn:hover{filter:brightness(1.1)}",
			".wpq_list{display:flex;flex-direction:column;gap:4px;margin-top:4px}",
			".wpq_item{display:flex;align-items:center;gap:6px}",
			".wpq_itemName{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.85}",
			".wpq_empty{opacity:.6;padding:6px 0}",
			// While a wallpaper is showing, the shell's own opaque fills are the
			// only things hiding it. Four surfaces carry one: the frame, the
			// conversation root that fills the center column, the sidebar column,
			// and the right panel that slides over the frame.
			//
			// The sidebar and the right panel become fully transparent. The
			// conversation root becomes a soft veil instead: dropping its fill
			// entirely would leave message text sitting straight on the
			// wallpaper, and a veil restores contrast without reintroducing a hard
			// surface. It mixes the shell's own base token, so it follows the
			// light/dark palette automatically, and it sits on top of the scrim
			// — so the panel's dim slider still governs how much wallpaper shows
			// through.
			//
			// Every selector is keyed off `data-wp-active`, the attribute the
			// plugin sets on the frame and removes on cleanup, so the whole
			// override stops applying the moment the layer unmounts. The
			// conversation root is reached through the `data-slot` contract — a
			// stable seam, matched structurally rather than by depth, so it keeps
			// working across the conversation's own `data-phase` changes (hero /
			// settling / active) that rebuild the subtree. Panels, docks, modals
			// and the composer card are never caught.
			'div[class*="_frame"][data-wp-active="1"]{background:transparent!important}',
			'div[class*="_frame"][data-wp-active="1"] [class*="_sidebarCol"],div[class*="_frame"][data-wp-active="1"] [class*="_panel"]{background:transparent!important}',
			'div[class*="_frame"][data-wp-active="1"] [data-slot="main.conversation"]>*{background:color-mix(in srgb,var(--dsw-alias-bg-base) 55%,transparent)!important}'
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

		//#region settings
		/** Durable, plugin-owned settings. Kept in localStorage so a reload keeps the choice. */
		const STORAGE_KEY = "dsh-wallpaper:settings";
		/** Defaults: no wallpaper until the user picks one, gently dimmed. */
		const DEFAULTS = {
			items: [],
			index: 0,
			playing: true,
			shuffle: false,
			repeat: "one",
			intervalSec: 30,
			dim: 0.35,
			blurPx: 0,
			opacity: 1,
			blurMode: false
		};
		/**
		* Read the persisted settings, falling back to defaults per key so a
		* settings file written by an older version still loads.
		* @returns the effective settings object.
		*/
		function loadSettings() {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (!raw) return { ...DEFAULTS };
				const parsed = JSON.parse(raw);
				return { ...DEFAULTS, ...parsed, items: Array.isArray(parsed.items) ? parsed.items : [] };
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
		* Resolve one object URL to a data URL so the wallpaper survives a reload.
		 * Fails over to the object URL when the file is too large to inline.
		* @param {string} url - object URL to inline.
		* @returns {Promise<string>} a persistent URL.
		*/
		function inlineUrl(url) {
			return fetch(url).then((res) => res.blob()).then((blob) => new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result));
				reader.onerror = () => resolve(url);
				reader.readAsDataURL(blob);
			}));
		}
		/**
		* Turn picked files into library entries, inlining their bytes.
		* @param {FileList|File[]} files - picked files.
		* @returns {Promise<Array>} the accepted library entries.
		*/
		function buildItems(files) {
			return Promise.all(Array.from(files).map(async (file) => {
				const kind = kindOf(file);
				if (kind === null) return null;
				const objectUrl = URL.createObjectURL(file);
				const src = await inlineUrl(objectUrl);
				URL.revokeObjectURL(objectUrl);
				return {
					id: `${file.name}-${file.size}-${src.length}`,
					name: file.name,
					kind,
					src
				};
			})).then((list) => list.filter((item) => item !== null));
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
		* @returns the wallpaper layer, or null.
		*/
		function WallpaperLayer({ item, playing, dim, blurPx, opacity }) {
			const videoRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const el = videoRef.current;
				if (!el) return;
				if (playing) {
					const p = el.play();
					if (p && typeof p.catch === "function") p.catch(() => {});
				} else {
					el.pause();
				}
			}, [playing, item && item.src]);
			if (!item) return null;
			const style = { opacity };
			return (0, react_jsx_runtime.jsx)("div", {
				className: "wpq_root",
				style: { "--wpq-scrim": `rgba(0,0,0,${dim})` },
				children: [
					item.kind === "video" ? (0, react_jsx_runtime.jsx)("video", {
						ref: videoRef,
						className: "wpq_layer",
						src: item.src,
						muted: true,
						loop: true,
						playsInline: true,
						autoPlay: true,
						style: { ...style, filter: blurPx > 0 ? `blur(${blurPx}px)` : void 0 }
					}) : (0, react_jsx_runtime.jsx)("img", {
						className: "wpq_layer",
						src: item.src,
						alt: "",
						style: { ...style, filter: blurPx > 0 ? `blur(${blurPx}px)` : void 0 }
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "wpq_scrim" })
				]
			});
		}

		/**
		* The settings panel. Plain DOM inputs styled with the shell's own tokens
		* so it matches the app in both palettes without a theme listener.
		* @param {object} props - Settings plus a change callback.
		* @returns the panel element.
		*/
		function SettingsPanel({ settings, onChange, onPick, onClose }) {
			const numberField = (key, label, min, max, step) => (0, react_jsx_runtime.jsx)("label", {
				className: "wpq_row",
				children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: label }), (0, react_jsx_runtime.jsxs)("input", {
					type: "number",
					className: "wpq_input",
					min,
					max,
					step,
					value: settings[key],
					onChange: (e) => onChange(key, Number(e.target.value))
				})]
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "wpq_panel",
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_panelHead",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_title", children: "Wallpaper" }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onClose, children: "Close" })]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: "Library" }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onPick, children: "Add images / videos…" })]
					}),
					numberField("dim", "Dim", 0, 0.9, 0.05),
					numberField("blurPx", "Blur (px)", 0, 40, 1),
					numberField("opacity", "Opacity", 0, 1, 0.05),
					numberField("intervalSec", "Interval (s)", 5, 3600, 5),
					(0, react_jsx_runtime.jsx)("label", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: "Repeat" }), (0, react_jsx_runtime.jsxs)("select", {
							className: "wpq_input",
							value: settings.repeat,
							onChange: (e) => onChange("repeat", e.target.value),
							children: ["one", "all", "off"].map((mode) => (0, react_jsx_runtime.jsx)("option", { value: mode, key: mode, children: mode }))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "wpq_list",
						children: settings.items.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "wpq_empty", children: "No wallpapers yet." }) : settings.items.map((item, i) => (0, react_jsx_runtime.jsxs)("div", {
							className: "wpq_item",
							key: item.id,
							children: [(0, react_jsx_runtime.jsxs)("button", { className: "wpq_btn", onClick: () => onChange("index", i), children: i === settings.index ? "●" : "○" }), (0, react_jsx_runtime.jsx)("span", { className: "wpq_itemName", children: item.name }), (0, react_jsx_runtime.jsx)("button", {
								className: "wpq_btn",
								onClick: () => onChange("items", settings.items.filter((entry) => entry.id !== item.id)),
								children: "Remove"
							})]
						}))
					})
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
		* @returns the wallpaper layer plus its control affordances.
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
			// The same lookup yields the portal target: the layer is rendered
			// there instead of inside the overlay seat, which sits above the
			// columns and would hide it.
			//
			// The frame is not guaranteed to exist when this runs — the plugin
			// can be applied before ui-layout has mounted it — so a miss schedules
			// a retry instead of giving up, and the element is re-resolved on
			// every attempt. Giving up on the first `null` left the wallpaper
			// permanently invisible.
			const [frame, setFrame] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!item) return;
				let cancelled = false;
				let timer;
				let target = null;
				const attach = () => {
					if (cancelled) return;
					const el = document.querySelector('[class*="_frame"]');
					if (el === null) {
						timer = setTimeout(attach, 100);
						return;
					}
					target = el;
					el.setAttribute("data-wp-active", "1");
					setFrame(el);
				};
				attach();
				return () => {
					cancelled = true;
					if (timer !== undefined) clearTimeout(timer);
					if (target !== null) target.removeAttribute("data-wp-active");
				};
			}, [item]);

			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
				children: [
					// Portalled to the frame so the backdrop paints behind the
					// columns; the controls stay in the overlay seat, where the
					// shell already keeps floating surfaces.
					frame ? (0, react_dom.createPortal)((0, react_jsx_runtime.jsx)(WallpaperLayer, {
						item,
						playing: settings.playing,
						dim: settings.dim,
						blurPx: settings.blurPx,
						opacity: settings.opacity
					}), frame) : null,
					(0, react_jsx_runtime.jsxs)("div", {
						className: "wpq_ui",
						children: [
							(0, react_jsx_runtime.jsx)("input", { ref: fileRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: onFiles, className: "wpq_file", "aria-label": "Choose wallpaper files" }),
							(0, react_jsx_runtime.jsxs)("button", {
								className: "wpq_tab",
								onClick: () => setPanelOpen((open) => !open),
								title: "Wallpaper",
								children: [
									(0, react_jsx_runtime.jsx)("span", { children: "🖼" }),
									settings.items.length > 0 ? (0, react_jsx_runtime.jsx)("span", { className: "wpq_badge", children: String(settings.items.length) }) : null
								]
							}),
							panelOpen ? (0, react_jsx_runtime.jsx)(SettingsPanel, { settings, onChange: update, onPick: pick, onClose: () => setPanelOpen(false) }) : null
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
