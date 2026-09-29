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
			//
			// It is sized to the viewport rather than to the frame. The frame is a
			// grid that resolves against its own box, and any strip of page
			// outside it stayed unpainted, which showed up as a bare band along
			// the bottom once a wallpaper was set. Locking the layer to the
			// viewport closes that gap for any frame geometry.
			".wpq_root{position:absolute;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;overflow:hidden}",
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
			'div[class*="_frame"][data-wp-active="1"]{background:transparent!important}',
			'div[class*="_frame"][data-wp-active="1"] [data-slot="main.conversation"]>*{background:transparent!important}',
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
			// heavily blurred, lightly tinted copy of the shell's own base colour
			// so the wallpaper shows through blurred rather than through a hole.
			// `backdrop-filter` does the blurring, so the sidebar keeps its text
			// contrast in both palettes without pinning a colour of its own, and
			// the wallpaper's own brightness still varies the result. The theme
			// token means this follows light/dark on its own.
			'[data-wp-active="1"] [class*="_sidebarCol"]{background:color-mix(in srgb,var(--dsw-alias-bg-base) 42%,transparent)!important;backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6);opacity:1!important}'
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
		function SettingsPanel({ settings, onChange, onPick, onReset, onClose }) {
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
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: "Appearance" }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onReset, children: "Reset" })]
					}),
					numberField("dim", "Dim", 0, 0.9, 0.05),
					numberField("blurPx", "Blur (px)", 0, 40, 1),
					numberField("opacity", "Opacity (0=hidden)", 0, 1, 0.05),
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
			const [frame, setFrame] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!item) return;
				const el = document.querySelector('[class*="_frame"]');
				if (el === null) return;
				setFrame(el);
				el.setAttribute("data-wp-active", "1");
				// Paint the page roots dark for as long as a wallpaper is showing.
				// Any strip of document outside the frame would otherwise show
				// the shell's own light fill as a white band along the bottom,
				// and the layer cannot cover that strip because the frame clips
				// it. The tone mixes the shell's base token with black, so it
				// follows the light/dark palette instead of pinning a colour.
				const root = document.documentElement;
				const previous = root.style.getPropertyValue("--wpq-page");
				root.style.setProperty("--wpq-page", `color-mix(in srgb, var(--dsw-alias-bg-base) 70%, black)`);
				return () => {
					el.removeAttribute("data-wp-active");
					if (previous) root.style.setProperty("--wpq-page", previous);
					else root.style.removeProperty("--wpq-page");
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
							panelOpen ? (0, react_jsx_runtime.jsx)(SettingsPanel, { settings, onChange: update, onPick: pick, onReset: reset, onClose: () => setPanelOpen(false) }) : null
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
