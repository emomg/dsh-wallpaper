window.__ModuleLoader__.load({
	id: "dsh-wallpaper",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");

		//#region glass
		/**
		* Build the complete `backdrop-filter` value for the frosted surfaces.
		*
		* The surfaces are built from the shell's own *fill* token
		* (`--dsw-menu-surface-fill`) so a light/dark switch re-maps them
		* instead of inverting into an unreadable slab; the blur radius is the
		* part that has to be this plugin's own, because the shell's 40px is
		* sized for a 288px menu and not for full-height panels stacked over a
		* video. See `DEFAULTS.glassBlurPx`.
		*
		* 0 means "the shell's own menu blur", not "no glass" — the two are
		* different, and the difference is exactly what makes a surface read as
		* a panel rather than as a hole.
		*
		* The whole function list has to be built here, not in the stylesheet.
		* Written as `backdrop-filter: var(--x) saturate(1.35)`, a variable
		* holding a bare length expands to something that is not a filter
		* function, and `none` cannot sit beside another function either — so
		* both cases are dropped at parse time, silently, and the `!important`
		* background next to them keeps applying. Holding the finished list
		* makes every case valid.
		* @param {number} px - User override for the blur radius; 0 keeps the shell's.
		* @returns {string} A `backdrop-filter` value.
		*/
		function glassFilter(px) {
			return px > 0 ? `blur(${px}px) saturate(1.35)` : "var(--dsw-menu-backdrop-filter)";
		}

		/**
		* Tint for the trajectory's turn list — the one large reading surface,
		* and the one the kind tags live on.
		*
		* Thinner than the menu fill on purpose. The menu fill is sized for a
		* 288px popover, where you are looking *through* the surface at a control
		* you already aimed at; the turn list is a full-width reading pane, and at
		* the same 58% it flattens into the white slab this plugin is meant to
		* get rid of. At this weight the wallpaper's colour comes through and the
		* row text still holds its contrast.
		*
		* Mixed from the theme's own base token rather than pasted in as a
		* literal, so a light/dark switch re-maps it instead of inverting into an
		* unreadable slab.
		*/
		const GLASS_READ_TINT = "34%";
		/** The resolved read-surface fill, shared by the list and anything that has to match it. */
		const GLASS_READ_FILL = `color-mix(in srgb, var(--dsw-alias-bg-base) ${GLASS_READ_TINT}, transparent)`;
		//#endregion

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
			// A segmented control rather than a native `<select>`: the shell owns
			// the `Menu` primitive for real dropdowns, and a functional plugin
			// must not import another package's runtime, so a three-way
			// segmented control is both the honest substitute and the shape the
			// shared `SegmentedControl` already uses — outer R12, a 4px inset,
			// R8 segments.
			".wpq_seg{display:inline-flex;gap:2px;padding:2px;border:0;border-radius:var(--dsw-radius-md);background:transparent;box-shadow:var(--dsw-elevation-soft)}",
			".wpq_segBtn{height:24px;padding:0 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;font-size:11px;line-height:16px;cursor:pointer;opacity:.65}",
			'.wpq_segBtn[aria-pressed="true"]{opacity:1;background:var(--dsw-alias-bg-layer-2,var(--dsw-specific-menu))}',
			".wpq_segBtn:hover{opacity:1}",
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
			// The trajectory view paints its own chrome, so the rule above never
			// reaches it: its surfaces are grandchildren of `main.conversation`,
			// not children. What the view owns hangs off one stable seam —
			// `[data-slot="conversation.view"]` — and that seam is a slot
			// contract, not a build hash, so it survives a rebuild:
			//
			//   conversation.view
			//   └─ <view root>            the view container itself
			//      ├─ <toolbar>           filter row and search
			//      ├─ <plot section>      └─ <plot>   the token meter bars
			//      └─ <ledger>            the turn list
			//         └─ <split>           └─ <table pane> └─ <table>
			//
			// The inner pieces are matched on their semantic class suffixes, the
			// same way the rightbar pane is, so a rebuild that reshuffles the
			// CSS-module hashes does not break them. `_root` is safe to match
			// here because everything it reaches is chrome of the same view;
			// the token meter bars, the search field and the composer card sit
			// deeper and keep their own fills, which is what keeps the view
			// readable over any wallpaper.
			// The reading area goes fully transparent, but the two thin control
			// strips do not: a 32px filter row and a 50px meter row with no
			// backing float straight on the wallpaper, which is exactly the
			// "too transparent to use" case. They get the same frosted surface
			// as the sidebar instead — the meter bars and the search field sit
			// on top of it and keep their own fills, so the view stays legible
			// over any wallpaper.
			//
			// The `> *:has([class*="_plot"])` hop is what keeps this out of the
			// chat view. `conversation.view` renders *either* chat or
			// trajectory, and both have a `_root` child, so a plain depth match
			// paints a band across the conversation header too. The plot row
			// exists only in the trajectory, so anchoring on it identifies which
			// of the two views is mounted.
			'div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"]>*{background-color:transparent!important}',
			`div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"]>:has([class*="_plot"])>[class*="_root"]{background:var(--dsw-menu-surface-fill,var(--dsw-specific-menu))!important;backdrop-filter:var(--wpq-glass-filter)!important;-webkit-backdrop-filter:var(--wpq-glass-filter)!important;isolation:auto!important}`,
			// The plot row inside the meter section paints its own opaque fill,
			// which buries the glass the parent just gained — a solid white band
			// across the top of the trajectory. The meter bars themselves are
			// deeper and keep their own colours, so only the backing goes.
			'div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"]>:has([class*="_plot"]) [class*="_plot"]{background-color:transparent!important}',
			// The turn list is the one large reading surface in the trajectory, and
			// it is where the kind tags — 用户 / 助手 / 工具 / 子工具 — sit. Left
			// fully transparent it floats straight on the wallpaper, which is the
			// "too transparent to use" case this plugin exists to answer; left on
			// the shell's 58% menu fill it is a white slab, which is the other
			// half of the same problem. It gets glass instead, on a tint thin
			// enough that the wallpaper's colour actually reads through it.
			//
			// The tint is mixed from `--dsw-alias-bg-base` rather than pasted in
			// as a literal so a light/dark switch re-maps it instead of inverting
			// into an unreadable slab.
			//
			// The ledger is the outermost of the three nested boxes, so glassing it
			// alone is enough — `_split`, `_tablePane` and the table itself stay
			// transparent and let it show through, rather than stacking four
			// separate `backdrop-filter` layers on the same pixels, which is
			// exactly the cost that takes an integrated GPU down.
			`div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"] [class*="_ledger"]{background:${GLASS_READ_FILL}!important;backdrop-filter:var(--wpq-glass-filter)!important;-webkit-backdrop-filter:var(--wpq-glass-filter)!important;isolation:auto!important}`,
			'div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"] [class*="_split"]{background-color:transparent!important}',
			'div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"] [class*="_tablePane"]{background-color:transparent!important}',
			'div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"] table{background-color:transparent!important}',
			// The meter's own label column ("输入 / 模型 / 工具") is painted with
			// `--dsw-alias-label-caption`, a deliberately quiet grey. On the shell's
			// own opaque fill that reads as a caption; on a frosted strip the
			// wallpaper decides the backdrop, and `#adb2b8` on a pale one lands at
			// roughly 1.9:1 — the labels disappear into the surface, which is what
			// "it doesn't sit together" looks like. The meter strip is one of only
			// two places the plugin puts glass *under* the shell's own text, so it
			// is also the one place the text has to come up a step.
			//
			// Still a token, not a literal, so the dark palette re-maps instead of
			// turning into light grey on a dark strip.
			`div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"]>:has([class*="_plot"]) [class*="_labels"]{color:var(--dsw-alias-label-secondary)!important}`,
			// The detail drawer a kind tag opens. It is an `<aside>` inside the
			// trajectory view, not a `rightbar.session` pane, so the rail rule
			// below never reached it — it stayed a flat opaque white slab, and at
			// 379x623 it is the largest single white block left in the view.
			// Matched on the tag plus the class fragment so it cannot pick up
			// `_detailsHeader` / `_detailTabs` and their transparent siblings.
			`div[class*="_frame"][data-wp-active="1"] [data-slot="conversation.view"] aside[class*="_details"]{background:var(--dsw-menu-surface-fill,var(--dsw-specific-menu))!important;backdrop-filter:var(--wpq-glass-filter)!important;-webkit-backdrop-filter:var(--wpq-glass-filter)!important;isolation:auto!important}`,
			// The "加载更早的历史" row is deliberately left alone. The shell paints
			// that button with `--dsw-alias-bg-layer-1`, an opaque layer token, and
			// it spans the full table width — it is meant to read as a solid button
			// floating on the list, and frosting it would dissolve the one control
			// in the view that a user has to find to page backwards.
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
			// The fill is the themed menu token so a light/dark switch re-maps
			// instead of inverting into an unreadable slab. The *blur* is not
			// `--dsw-menu-backdrop-filter`: the rightbar is a full-height dock
			// and a dialog can be almost the size of the window, so the shell's
			// 40px — sized for a 288px popover — is several times the sampling
			// cost for the same look. They go through the plugin's own radius like
			// every other full-height surface here.
			// Dialogs are portalled to <body>, outside the frame, which is why
			// that rule keys off the root attribute.
			'div[class*="_frame"][data-wp-active="1"] [data-slot="rightbar.session"] section[class*="_pane"]{background:var(--dsw-specific-menu)!important;backdrop-filter:var(--wpq-glass-filter)!important;-webkit-backdrop-filter:var(--wpq-glass-filter)!important}',
			'html[data-wp-active="1"] [role="dialog"]{background:var(--dsw-specific-menu)!important;backdrop-filter:var(--wpq-glass-filter)!important;-webkit-backdrop-filter:var(--wpq-glass-filter)!important;box-shadow:var(--dsw-elevation-prominent)}',
			// The Windows title bar is a pseudo-element on the frame itself, so
			// it is not a descendant of anything the rules above can reach. It
			// gets the same glass as the sidebar rather than a bare band.
			`div[class*="_frame"][data-wp-active="1"]:before{background:var(--dsw-menu-surface-fill,var(--dsw-specific-menu))!important;backdrop-filter:var(--wpq-glass-filter)!important;-webkit-backdrop-filter:var(--wpq-glass-filter)!important}`,
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
			// The tint is shared with the title bar and the trajectory's control
			// strips; the blur radius stays a setting, published on the document
			// element because those surfaces are siblings of the portalled
			// layer rather than descendants of it.
			// `!important` is not decoration here. The shell paints its own
			// backdrop-filter onto these surfaces and wins on specificity, so a
			// plain declaration silently loses while the `!important` background
			// next to it still applies — leaving exactly the flat tint this
			// plugin is trying to frost.
			`[data-wp-active="1"] [class*="_sidebarCol"]{background:var(--dsw-menu-surface-fill,var(--dsw-specific-menu))!important;backdrop-filter:var(--wpq-glass-filter)!important;-webkit-backdrop-filter:var(--wpq-glass-filter)!important;opacity:1!important}`,		].join("");
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
			glassHelp: "Frosts the sidebar, dialogs, title bar, the trajectory's control strips and its turn list. 0 uses the shell's own 40px menu blur — that is what a small GPU cannot afford over a full-height panel. Higher is smoother and more expensive.",
			opacity: "Opacity (0=hidden)",
			interval: "Interval (s)",
			repeat: "Repeat",
			repeatOne: "One",
			repeatAll: "All",
			repeatOff: "Off",
			play: "Play video",
			pause: "Pause video",
			empty: "No wallpapers yet.",
			remove: "Remove",
			pick: "Choose wallpaper files",
			gallery: "Gallery",
			galleryImport: "Import…",
			galleryBusy: "Importing…",
			galleryAlreadyThere: "The gallery is already in your library — nothing new to add.",
			galleryEmpty: "The gallery returned nothing.",
			galleryFailed: "The gallery could not be reached.",
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
			remove: (id) => withMediaStore("readwrite", (store) => store.delete(id)),
			/** @returns {Promise<string[]>} Every id the store currently holds bytes for. */
			keys: () => withMediaStore("readonly", (store) => store.getAllKeys())
		};
		//#endregion

		//#region settings
		/** Durable, plugin-owned settings. Kept in localStorage so a reload keeps the choice. */
		const STORAGE_KEY = "dsh-wallpaper:settings";
		/**
		* Settings schema version. Bump it when a default changes in a way the
		* stored document cannot express: a value written by an older version is
		* still *valid*, so `numberOr` would happily keep it and the new default
		* would never reach an existing install. The version is what tells the
		* two apart.
		*/
		const SETTINGS_VERSION = 7;
		/**
		* Where the bundled gallery lives. A setting, not a constant: a different
		* deployment points this at its own manifest without editing the bundle.
		* Declared ahead of DEFAULTS because the default value below reads it.
		*/
		const DEFAULT_GALLERY = "https://raw.githubusercontent.com/emomg/dsh-wallpaper/main/wallpapers/manifest.json";
		/**
		* Defaults: no wallpaper until the user picks one, gently dimmed, and no
		* video playback until they ask for it.
		*
		* The glass blur defaults to 20px rather than the shell's own 40px
		* (`--dsw-menu-backdrop-filter`, which 0 selects). 40px is right for a
		* 288px menu over a blurred backdrop; it is not right for what this
		* plugin frosts, which is several *full-height* panels over a video. That
		* combination is what the crash reports are made of: on an integrated
		* GPU, 40px across the sidebar, the title bar, the rightbar and the
		* trajectory's turn list is enough to stall the compositor outright —
		* measured here, the renderer stopped producing frames altogether and
		* the app had to be restarted. 20px still reads as glass over a
		* wallpaper, at roughly a quarter of the sampling cost. 0 stays
		* available as the escape hatch, and the setting is still there for
		* anyone on hardware that can afford more.
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
			glassBlurPx: 20,
			opacity: 1,
			gallery: DEFAULT_GALLERY
		};
		/** Upper bound for the glass blur, in px. Beyond this the compositor cost is not worth it — 40px across the full-height panels is what stalls an integrated GPU. */
		const MAX_GLASS_BLUR = 24;
		/** Repeat modes, named so the panel and the persisted value cannot drift apart. */
		const modeOne = "one";
		const modeAll = "all";
		const modeOff = "off";
		const REPEAT_MODES = [modeOne, modeAll, modeOff];

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
				// A document written before the current version predates the
				// current defaults, so those fields take the new default rather
				// than the value that happened to be stored. Everything else
				// keeps whatever the user last chose.
				const upgrading = numberOr(parsed.version, 0, SETTINGS_VERSION - 1, 0) < SETTINGS_VERSION;
				return {
					version: SETTINGS_VERSION,
					// A legacy entry carries its bytes inline; the migration moves
					// them into the blob store and rewrites the entry.
					items: items.map((item) => ({ id: item.id, name: item.name, kind: item.kind, type: item.type || "", size: item.size, src: item.src })),
					index: numberOr(parsed.index, 0, Math.max(0, items.length - 1), 0),
					// The play toggle is gone from the panel, so a `true` left over from
					// an older install would keep a video decoding with nothing on screen
					// to turn it off. The upgrade is what stops it.
					playing: upgrading ? DEFAULTS.playing : parsed.playing === true,
					repeat: REPEAT_MODES.includes(parsed.repeat) ? parsed.repeat : DEFAULTS.repeat,
					intervalSec: numberOr(parsed.intervalSec, 5, 3600, DEFAULTS.intervalSec),
					dim: numberOr(parsed.dim, 0, 0.9, DEFAULTS.dim),
					blurPx: numberOr(parsed.blurPx, 0, 40, DEFAULTS.blurPx),
					glassBlurPx: upgrading ? DEFAULTS.glassBlurPx : numberOr(parsed.glassBlurPx, 0, MAX_GLASS_BLUR, DEFAULTS.glassBlurPx),
					opacity: numberOr(parsed.opacity, 0, 1, DEFAULTS.opacity),
					gallery: typeof parsed.gallery === "string" && /^https?:\/\//.test(parsed.gallery) ? parsed.gallery : DEFAULTS.gallery
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
		*
		* The digest rides along: it is metadata, it is what the next import
		* checks against, and dropping it here would quietly downgrade every
		* re-import back to the name+size guess.
		* @param {object} item - Stored library entry.
		* @returns {object} The same entry without inline bytes.
		*/
		function withoutBytes(item) {
			return { id: item.id, name: item.name, kind: item.kind, type: item.type || "", size: item.size, digest: item.digest || "" };
		}

		/**
		* Plan the cleanup of any media still stored inline.
		*
		* Older versions stored every file as a data URL inside the settings
		* document. This copies those bytes into IndexedDB and hands back a
		* *transform* rather than a finished settings object: the caller applies
		* it to whatever the settings are at that moment and persists the
		* result.
		*
		* That indirection is the whole point. The copy takes seconds for a
		* 25 MB video, and the previous version rebuilt the settings from the
		* snapshot taken at mount — so anything the user added while the copy
		* ran was silently replaced by the pre-copy state on the next render,
		* and the rewritten document was never written back to `localStorage`
		* either, so the same multi-megabyte string was re-migrated on every
		* single start. Returns `null` when there is nothing inline to move.
		* @param {object} settings - Settings as loaded.
		* @returns {Promise<((prev: object) => object) | null>} The transform, or null.
		*/
		async function planInlineMediaMigration(settings) {
			const legacy = settings.items.filter((item) => typeof item.src === "string" && item.src.startsWith("data:"));
			if (legacy.length === 0) return null;
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
			// Applied to the live settings, not the mount-time snapshot, so an
			// entry added during the copy passes through untouched.
			return (prev) => ({
				...prev,
				items: prev.items.map((item) => moved.get(item.id) ?? withoutBytes(item))
			});
		}

		/**
		* List the ids the blob store actually holds bytes for.
		*
		* A list row whose blob is gone would otherwise render as an empty
		* layer with no explanation, which is indistinguishable from the whole
		* wallpaper having failed to mount. The caller filters its list against
		* this set. Orphans are deliberately *not* deleted here: a blob written
		* microseconds ago by a concurrent import would look exactly like one,
		* and deleting it would break the row that is about to be written.
		* @returns {Promise<Set<string>>} The ids with stored bytes.
		*/
		async function storedIds() {
			return new Set(await mediaStore.keys());
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
		* A short content fingerprint for one blob.
		*
		* Name and size are not a fingerprint: renaming a file makes a different
		* name for the same bytes, and two different files routinely land on the
		* same round size. Hashing is the only thing that answers "do I already
		* have this exact wallpaper".
		*
		* Eight bytes of SHA-256 is plenty for a personal library — collisions
		* would need two wallpapers picked at random to agree on 64 bits. The
		* full digest is deliberately not kept: this is a duplicate check, not
		* an integrity guarantee, and there is no reason to write 64 hex
		* characters per row into the settings document.
		* @param {Blob} blob - bytes to fingerprint.
		* @returns {Promise<string>} lowercase hex, or "" when hashing is unavailable.
		*/
		async function digestOf(blob) {
			try {
				if (typeof crypto === "undefined" || !crypto.subtle) return "";
				const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
				return Array.from(bytes.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
			} catch {
				// A file that cannot be read in full (quota, a revoked handle)
				// still deserves a row; it just loses the duplicate check.
				return "";
			}
		}

		/**
		* The key a library entry is recognised by.
		*
		* Falls back to name+size for rows written before digests were kept, so
		* an existing install still de-duplicates on the first import after the
		* upgrade — just on a weaker signal, which is better than nothing.
		* @param {object} entry - a library row.
		* @returns {string} the key.
		*/
		function itemKey(entry) {
			return entry.digest ? `d:${entry.digest}` : `n:${entry.name}:${entry.size}`;
		}

		/**
		* Keep one blob in the store and return its library entry.
		*
		* The id carries a timestamp and a random suffix on purpose: a
		* name/size/timestamp triple collides the moment the same file is added
		* twice, and two rows sharing one id mean removing either one takes
		* both, while the second row silently shows the first row's bytes.
		* Uniqueness of the id is not the same as uniqueness of the *file*, which
		* is what `seen` is for — it is the set of keys already in the library,
		* and the import adds to it as it goes so a batch containing the same
		* file twice still yields one row.
		* @param {string} name - Display name.
		* @param {Blob} blob - Bytes to keep.
		* @param {Set<string>} seen - Keys already present; mutated as the batch proceeds.
		* @returns {Promise<object | null>} The entry, or null when unsupported, already held, or the store refused it.
		*/
		async function importBlob(name, blob, seen) {
			const type = blob.type || "";
			const kind = kindOf({ name, type });
			if (kind === null) return null;
			const digest = await digestOf(blob);
			const key = digest ? `d:${digest}` : `n:${name}:${blob.size}`;
			if (seen && seen.has(key)) return null;
			if (seen) seen.add(key);
			const id = `${name}-${blob.size}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
			try {
				await mediaStore.put(id, blob);
			} catch {
				/* storage refused this file; skip it rather than list a dead row */
				return null;
			}
			return { id, name, kind, type, size: blob.size, digest };
		}

		/**
		* Turn picked files into library entries and keep their bytes in the blob
		* store. Nothing is copied into the settings document.
		* @param {FileList|File[]} files - picked files.
		* @param {Set<string>} seen - keys already in the library.
		* @returns {Promise<object[]>} the accepted library entries.
		*/
		async function buildItems(files, seen) {
			const items = [];
			for (const file of Array.from(files)) {
				const item = await importBlob(file.name, file, seen);
				if (item !== null) items.push(item);
			}
			return items;
		}

		/**
		* Fetch a wallpaper manifest and import everything it lists.
		*
		* The manifest URL is a setting rather than a constant: a different
		* deployment should be able to point at its own gallery without editing
		* the bundle, which is the same rule the harness applies to every other
		* value that might differ per install.
		*
		* Pressing the button twice must be a no-op, not a second copy of every
		* wallpaper — and these are 20–25 MB videos, so "no-op" has to mean *not
		* downloading them again*, not merely "not storing them twice". The
		* manifest carries a name and a size but no hash, so there are two gates:
		* name+size is checked *before* the fetch, which is what actually saves the
		* bandwidth, and the content digest is checked after it, which is what
		* catches the same bytes under a different name. Rows written before
		* digests existed only match the first gate; that is the weaker check, and
		* it is still the right one for them.
		* @param {string} manifestUrl - URL of the manifest document.
		* @param {Set<string>} seen - keys already in the library.
		* @returns {Promise<{items: object[], skipped: number}>} what was added and how many were already there.
		*/
		async function importGallery(manifestUrl, seen) {
			const response = await fetch(manifestUrl, { cache: "no-cache" });
			if (!response.ok) throw new Error(`manifest responded ${response.status}`);
			const manifest = await response.json();
			const entries = Array.isArray(manifest) ? manifest : Array.isArray(manifest.wallpapers) ? manifest.wallpapers : [];
			const base = new URL(manifestUrl, document.baseURI);
			const items = [];
			let skipped = 0;
			for (const entry of entries) {
				if (!entry || typeof entry.url !== "string") continue;
				// Entry names are relative to the manifest, so a gallery folder
				// can move without rewriting every row.
				const assetUrl = new URL(entry.url, base);
				const name = entry.name || assetUrl.pathname.split("/").pop() || "wallpaper";
				if (seen && typeof entry.size === "number" && seen.has(`n:${name}:${entry.size}`)) {
					skipped++;
					continue;
				}
				const asset = await fetch(assetUrl.href, { cache: "no-cache" });
				if (!asset.ok) continue;
				const item = await importBlob(name, await asset.blob(), seen);
				if (item !== null) items.push(item);
				else skipped++;
			}
			return { items, skipped };
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
		function WallpaperLayer({ item, playing, repeat, dim, blurPx, opacity, pageColor }) {
			const url = useItemUrl(item);
			const videoRef = (0, react.useRef)(null);
			const isVideo = item != null && item.kind === "video";
			// Reduced motion wins over the play toggle: a user who asked the
			// system to cut animation does not get a looping background video.
			// A video plays. There is no play toggle: it was one control for one
			// decision the user can already make here — `off` means no wallpaper at
			// all, so a video on screen is a video the user asked to see running.
			// Reduced motion still wins, because a user who asked the system to cut
			// animation did not ask for a looping background.
			const shouldPlay = isVideo && repeat !== modeOff && !prefersReducedMotion();

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
		function SettingsPanel({ settings, onChange, onPick, onReset, onRemove, onGallery, galleryBusy, galleryError, onClose }) {
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
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_title", children: TEXT.panel }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onClose, children: TEXT.close })]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.library }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onPick, children: TEXT.add })]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.gallery }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onGallery, disabled: galleryBusy, children: galleryBusy ? TEXT.galleryBusy : TEXT.galleryImport })]
					}),
					galleryError ? (0, react_jsx_runtime.jsx)("div", { className: "wpq_note", children: galleryError }) : null,
					
					(0, react_jsx_runtime.jsx)("div", {
						className: "wpq_row",
						children: [(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.appearance }), (0, react_jsx_runtime.jsx)("button", { className: "wpq_btn", onClick: onReset, children: TEXT.reset })]
					}),
					numberField("dim", TEXT.dim, 0, 0.9, 0.05),
					numberField("blurPx", TEXT.blur, 0, 40, 1),
					numberField("glassBlurPx", TEXT.glass, 0, MAX_GLASS_BLUR, 1),
					numberField("opacity", TEXT.opacity, 0, 1, 0.05),
					numberField("intervalSec", TEXT.interval, 5, 3600, 5),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "wpq_row",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "wpq_label", children: TEXT.repeat }),
							(0, react_jsx_runtime.jsxs)("div", {
								className: "wpq_seg",
								role: "group",
								"aria-label": TEXT.repeat,
								children: [[modeOne, TEXT.repeatOne], [modeAll, TEXT.repeatAll], [modeOff, TEXT.repeatOff]].map((pair) => (0, react_jsx_runtime.jsx)("button", {
									key: pair[0],
									type: "button",
									className: "wpq_segBtn",
									"aria-pressed": settings.repeat === pair[0],
									onClick: () => onChange("repeat", pair[0]),
									children: pair[1]
								}))
							})
						]
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
				buildItems(files, new Set(settings.items.map(itemKey))).then((items) => {
					if (items.length === 0) return;
					setSettings((prev) => {
						const next = { ...prev, items: [...prev.items, ...items], index: prev.items.length };
						saveSettings(next);
						return next;
					});
				});
				event.target.value = "";
			}, []);

			// Startup repair, run once. Two steps, both writing through the
			// functional updater and persisting the result: move anything an
			// older version left inline into the blob store, then check the list
			// against the bytes that are actually stored. Neither step is
			// allowed to rebuild the settings from the mount-time snapshot —
			// that is what used to eat wallpapers added while the copy ran.
			(0, react.useEffect)(() => {
				let cancelled = false;
				(async () => {
					const transform = await planInlineMediaMigration(settings);
					if (cancelled) return;
					if (transform !== null) {
						setSettings((prev) => {
							const next = transform(prev);
							saveSettings(next);
							return next;
						});
					}
					const withBytes = await storedIds();
					if (cancelled) return;
					setSettings((prev) => {
						const items = prev.items.filter((item) => withBytes.has(item.id));
						if (items.length === prev.items.length) return prev;
						const next = {
							...prev,
							items,
							index: items.length === 0 ? 0 : Math.min(prev.index, items.length - 1)
						};
						saveSettings(next);
						return next;
					});
				})().catch(() => {
					/* a storage failure must not take the shell down with it */
				});
				return () => {
					cancelled = true;
				};
				// Runs once: later edits already produce inline-free entries.
			}, []);

			// Pull the bundled gallery in. The manifest URL is a setting, so a
			// different deployment can point it elsewhere; the bytes are copied
			// into the blob store exactly like a hand-picked file, which keeps
			// one storage path and one failure mode.
			const [galleryBusy, setGalleryBusy] = (0, react.useState)(false);
			const [galleryError, setGalleryError] = (0, react.useState(""));
			const importFromGallery = (0, react.useCallback)(() => {
				setGalleryBusy(true);
				setGalleryError("");
				importGallery(settings.gallery, new Set(settings.items.map(itemKey)))
					.then(({ items, skipped }) => {
						setGalleryBusy(false);
						if (items.length === 0) {
							setGalleryError(skipped > 0 ? TEXT.galleryAlreadyThere : TEXT.galleryEmpty);
							return;
						}
						setSettings((prev) => {
							const next = { ...prev, items: [...prev.items, ...items], index: prev.items.length };
							saveSettings(next);
							return next;
						});
					})
					.catch(() => {
						setGalleryBusy(false);
						setGalleryError(TEXT.galleryFailed);
					});
			}, [settings.gallery, settings.items]);

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
						if (prev.repeat === modeOne) return prev;
						const nextIndex = (prev.index + 1) % prev.items.length;
						const next = { ...prev, index: nextIndex };
						saveSettings(next);
						return next;
					});
				}, Math.max(5, settings.intervalSec) * 1000);
				return () => clearInterval(timer);
			}, [settings.items.length, settings.repeat, settings.intervalSec]);

			// The layer is only mounted once the desktop frame is actually on the
			// page. The web profile has no such frame, and a wallpaper covering
			// the whole web UI would be a surprise there rather than a feature.
			const [backdropReady, setBackdropReady] = (0, react.useState)(false);

			// The frame only goes transparent while a wallpaper is on screen; the
			// attribute is the switch the stylesheet keys off, so removing the
			// layer restores the shell's own background with no extra cleanup.
			//
			// The glass filter is published on the *body*, because that is where
			// the theme declares its own material tokens — a custom property
			// only resolves against the scope it is declared in, so hanging a
			// `var(--dsw-menu-backdrop-filter)` reference on the document
			// element resolves against the parent of where the token actually
			// lives and quietly computes to `none`. The surfaces this reaches
			// — sidebar, title bar, body-portalled dialogs, the trajectory's
			// control strips — are all inside the body, so scoping it there is
			// both correct and sufficient.
			(0, react.useEffect)(() => {
				// "Off" is the pause, and pause means *no wallpaper*: the layer
				// is not mounted and the shell is never flagged, so the shell paints
				// its own background and nothing of this plugin is left on screen.
				// Pausing the video instead would keep a full-screen decode and a
				// half-faded surface alive, which is the opposite of what the user
				// asked for and the exact cost this plugin is careful to avoid.
				if (!item || settings.repeat === modeOff) {
					setBackdropReady(false);
					return;
				}
				const frame = document.querySelector('[class*="_frame"]');
				if (frame === null) {
					setBackdropReady(false);
					return;
				}
				const root = document.documentElement;
				const carrier = document.body;
				const previousFilter = carrier.style.getPropertyValue("--wpq-glass-filter");
				carrier.style.setProperty("--wpq-glass-filter", glassFilter(settings.glassBlurPx));
				frame.setAttribute("data-wp-active", "1");
				// Dialogs are portalled to <body>, outside the frame, so the flag
				// has to exist on the root as well for them to be reachable.
				root.setAttribute("data-wp-active", "1");
				setBackdropReady(true);
				return () => {
					setBackdropReady(false);
					frame.removeAttribute("data-wp-active");
					root.removeAttribute("data-wp-active");
					if (previousFilter) carrier.style.setProperty("--wpq-glass-filter", previousFilter);
					else carrier.style.removeProperty("--wpq-glass-filter");
				};
			}, [item, settings.repeat, settings.glassBlurPx]);

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
						repeat: settings.repeat,
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
							panelOpen ? (0, react_jsx_runtime.jsx)(SettingsPanel, { settings, onChange: update, onPick: pick, onReset: reset, onRemove: removeItem, onGallery: importFromGallery, galleryBusy, galleryError, onClose: () => setPanelOpen(false) }) : null
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
