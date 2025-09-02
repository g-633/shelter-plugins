(function(exports) {

"use strict";

//#region plugins/NoFlair/index.jsx
const LOCALES = {
	en: {
		header: "Nameplates & Tags & Gradient",
		hideNameplates_title: "Hide nameplates",
		hideNameplates_note: "Hide decorative nameplates.",
		hideTags_title: "Hide tags",
		hideTags_note: "Hide guild tags next to nicknames.",
		roleSolidColor_title: "Solid color instead of gradient",
		roleSolidColor_note: "Gradient nicknames/mentions become a single (average) color. All animations/hover effects are disabled.",
		footer_note: "Changes are applied immediately, no restart required."
	},
	ru: {
		header: "Nameplates & Tags & Gradient",
		hideNameplates_title: "Скрывать nameplates",
		hideNameplates_note: "Скрывать nameplates.",
		hideTags_title: "Скрывать теги",
		hideTags_note: "Скрывать гильдейские теги рядом с ником.",
		roleSolidColor_title: "Однородный цвет вместо градиента",
		roleSolidColor_note: "Градиентные ники/упоминания становятся сплошным (средним) цветом. Анимации и hover-эффекты отключены.",
		footer_note: "Изменения применяются сразу, перезапуск не требуется."
	}
};
function detectLang() {
	const l = (document?.documentElement?.lang || "").toLowerCase();
	return l.startsWith("ru") ? "ru" : "en";
}
function t(key) {
	const lang = detectLang();
	return LOCALES[lang] && LOCALES[lang][key] || LOCALES.en[key] || key;
}
function onLoad() {
	const { plugin: { store, scoped } } = shelter;
	if (store.hideInMembers !== undefined || store.hideInDMs !== undefined) {
		const prev = Boolean(store.hideInMembers ?? store.hideInDMs ?? true);
		if (store.hideNameplates === undefined) store.hideNameplates = prev;
		if (store.hideTags === undefined) store.hideTags = prev;
		try {
			delete store.hideInMembers;
			delete store.hideInDMs;
		} catch {}
	}
	if (store.hideTags === undefined && store.hideNameplates !== undefined) store.hideTags = store.hideNameplates;
	if (store.hideNameplates === undefined) store.hideNameplates = true;
	if (store.hideTags === undefined) store.hideTags = true;
	if (store.roleSolidColor === undefined) store.roleSolidColor = false;
	const CSS_NAMEPLATES = `
[class*="nameplated"] > [class*="container"] { display: none !important; }
[class*="nameplated"] > [class*="container"] {
  background: none !important;
  background-image: none !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  backdrop-filter: none !important;
  filter: none !important;
}
video[src*="collectibles/nameplates"],
img[src*="collectibles/nameplates"] { display: none !important; }
li[class*="dm__"] > div[class*="interactive"] > div[class*="container"][aria-hidden="true"] { display: none !important; }
li[class*="dm__"] > div[class*="interactive"] > div[class*="container"][aria-hidden="true"],
li[class*="dm__"] div[class*="videoContainer"] {
  background: none !important; background-image: none !important;
  -webkit-mask-image: none !important; mask-image: none !important;
  backdrop-filter: none !important; filter: none !important;
}
li[class*="dm__"] video[src*="collectibles/nameplates"],
li[class*="dm__"] img[src*="collectibles/nameplates"] { display: none !important; }
li[class*="dm__"] .iconsContainer__972a0,
li[class*="dm__"] [class*="iconsContainer"] {
  --custom-nameplate: transparent !important;
  --custom-nameplate-neutral: transparent !important;
  --custom-nameplate-neutral-hovered: var(--background-modifier-hover) !important;
}
li[class*="dm__"] .closeButtonPlated__972a0,
li[class*="dm__"] [class*="closeButtonPlated"] { background: transparent !important; }
`;
	const CSS_TAGS = `
[class*="guildTagContainer"],
[class*="guildTag"],
[class*="clanTagChiplet"],
[class*="clanTag"] { display: none !important; }
[class*="lineClamp"]:has([class*="tagText"]),
[class*="text__"]:has([class*="tagText"]) { display: none !important; }
`;
	const CSS_ROLE_SOLID = `
.srgc {
  color: var(--srgc-color) !important;
  -webkit-text-fill-color: var(--srgc-color) !important;
}
.srgc,
.srgc :is([class*="twoColorGradient"], [class*="usernameGradient"], [class*="convenienceGlowGradient"]) {
  background: none !important;
  background-image: none !important;
  -webkit-background-clip: initial !important;
  background-clip: initial !important;
  text-shadow: none !important;
  animation: none !important;
  transition: none !important;
  -webkit-text-fill-color: var(--srgc-color) !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  filter: none !important;
  backdrop-filter: none !important;
}
.srgc [class*="nameGlow__"] { display: none !important; }
.srgc[style*="text-decoration-color"],
.srgc *[style*="text-decoration-color"] { text-decoration-color: var(--srgc-color) !important; }
`;
	const GRAD_SELECTOR = "[style*=\"--custom-gradient-color-1\"], [style*=\"--custom-gradient-color-2\"], [style*=\"--custom-gradient-color-3\"]";
	const GRAD_CLASS_SELECTOR = "[class*=\"twoColorGradient\"], [class*=\"usernameGradient\"], [class*=\"convenienceGlowGradient\"]";
	const COLOR_PARSER = document.createElement("div");
	const parseCssColor = (raw) => {
		if (!raw) return null;
		COLOR_PARSER.style.color = "";
		COLOR_PARSER.style.color = raw;
		const s = COLOR_PARSER.style.color;
		if (!s) return null;
		const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
		return m ? {
			r: +m[1],
			g: +m[2],
			b: +m[3],
			a: m[4] ? +m[4] : 1
		} : null;
	};
	function readVarColor(el, name) {
		let raw = el.style.getPropertyValue(name);
		if (!raw) raw = getComputedStyle(el).getPropertyValue(name);
		raw = raw.trim();
		if (!raw || raw.startsWith("var(")) return null;
		return parseCssColor(raw);
	}
	const toLin = (c) => c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
	const toGam = (c) => c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, .4166666666666667) - .055;
	const averageLinear = (colors) => {
		const n = colors.length || 1;
		let rl = 0, gl = 0, bl = 0, al = 0;
		for (const { r, g, b, a } of colors) {
			rl += toLin(r / 255);
			gl += toLin(g / 255);
			bl += toLin(b / 255);
			al += a;
		}
		const R = Math.round(toGam(rl / n) * 255);
		const G = Math.round(toGam(gl / n) * 255);
		const B = Math.round(toGam(bl / n) * 255);
		const A = Math.max(0, Math.min(1, al / n));
		return {
			r: R,
			g: G,
			b: B,
			a: A
		};
	};
	const rgbaToCss = ({ r, g, b, a }) => a < 1 ? `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})` : `rgb(${r}, ${g}, ${b})`;
	const lastSig = new WeakMap();
	const queue = new Set();
	let scheduled = false;
	const CHUNK = 200;
	const sig = (cols) => cols.map((c) => `${c.r},${c.g},${c.b},${c.a}`).join(";");
	const KILL_PROPS = [
		["background", "none"],
		["background-image", "none"],
		["-webkit-background-clip", "initial"],
		["background-clip", "initial"],
		["animation", "none"],
		["transition", "none"],
		["text-shadow", "none"],
		["-webkit-mask-image", "none"],
		["mask-image", "none"],
		["filter", "none"],
		["backdrop-filter", "none"]
	];
	function hardKillStyles(el, colorCss) {
		el.style.setProperty("--srgc-color", colorCss);
		el.style.setProperty("--custom-gradient-color-1", "var(--srgc-color)", "important");
		el.style.setProperty("--custom-gradient-color-2", "var(--srgc-color)", "important");
		el.style.setProperty("--custom-gradient-color-3", "var(--srgc-color)", "important");
		for (const [prop, val] of KILL_PROPS) el.style.setProperty(prop, val, "important");
		el.style.setProperty("-webkit-text-fill-color", colorCss, "important");
		el.style.setProperty("text-decoration-color", "var(--srgc-color)", "important");
	}
	function undoHardKill(el) {
		el.style.removeProperty("--srgc-color");
		el.style.removeProperty("--custom-gradient-color-1");
		el.style.removeProperty("--custom-gradient-color-2");
		el.style.removeProperty("--custom-gradient-color-3");
		for (const [prop] of KILL_PROPS) el.style.removeProperty(prop);
		el.style.removeProperty("-webkit-text-fill-color");
		el.style.removeProperty("text-decoration-color");
	}
	function applySolid(el) {
		if (!(el instanceof HTMLElement)) return;
		const cols = [];
		for (let i = 1; i <= 3; i++) {
			const c = readVarColor(el, `--custom-gradient-color-${i}`);
			if (c) cols.push(c);
		}
		if (!cols.length) return;
		const key = sig(cols.length === 1 ? cols.concat(cols) : cols);
		if (lastSig.get(el) === key) return;
		const mid = averageLinear(cols);
		const colorCss = rgbaToCss(mid);
		const gradientNode = el.matches(GRAD_CLASS_SELECTOR) ? el : el.querySelector(GRAD_CLASS_SELECTOR);
		const target = gradientNode instanceof HTMLElement ? gradientNode : el;
		target.classList.add("srgc");
		hardKillStyles(target, colorCss);
		el.style.setProperty("--srgc-color", colorCss);
		lastSig.set(el, key);
	}
	function schedule(el) {
		if (!(el instanceof HTMLElement)) return;
		queue.add(el);
		if (!scheduled) {
			scheduled = true;
			requestAnimationFrame(flush);
		}
	}
	function flush() {
		let i = 0;
		for (const el of queue) {
			queue.delete(el);
			applySolid(el);
			if (++i >= CHUNK) break;
		}
		if (queue.size) requestAnimationFrame(flush);
else scheduled = false;
	}
	function cleanupSolid() {
		lastSig.clear();
		document.querySelectorAll(".srgc").forEach((el) => {
			el.classList.remove("srgc");
			undoHardKill(el);
		});
	}
	let unNP, unTags, unSolidCss, unObs;
	shelter.solid.createRoot((dispose) => {
		shelter.solid.createEffect(() => {
			unNP?.();
			unNP = undefined;
			if (store.hideNameplates) unNP = scoped.ui.injectCss(CSS_NAMEPLATES);
			unTags?.();
			unTags = undefined;
			if (store.hideTags) unTags = scoped.ui.injectCss(CSS_TAGS);
		});
		shelter.solid.createEffect(() => {
			if (unObs) {
				try {
					unObs.now?.();
				} catch {}
				unObs = undefined;
			}
			if (unSolidCss) {
				try {
					unSolidCss();
				} catch {}
				unSolidCss = undefined;
			}
			queue.clear();
			scheduled = false;
			if (store.roleSolidColor) {
				unSolidCss = scoped.ui.injectCss(CSS_ROLE_SOLID);
				document.querySelectorAll(GRAD_SELECTOR).forEach((n) => schedule(n));
				unObs = scoped.observeDom(GRAD_SELECTOR, (node) => schedule(node));
			} else cleanupSolid();
		});
		scoped.onDispose(() => {
			try {
				unObs?.now?.();
			} catch {}
			try {
				unSolidCss?.();
			} catch {}
			try {
				unNP?.();
			} catch {}
			try {
				unTags?.();
			} catch {}
			cleanupSolid();
			queue.clear();
			scheduled = false;
			dispose();
		});
		return dispose;
	});
	console.log("[NoFlair] onLoad");
}
function onUnload() {}
function settings() {
	const { plugin: { store }, ui: { SwitchItem, Divider, Header, HeaderTags }, solidH: { html } } = shelter;
	return html`
    <${Header} tag=${HeaderTags.H3}>${t("header")}</${Header}>

    <${SwitchItem}
      value=${store.hideNameplates}
      onChange=${(v) => store.hideNameplates = v}
      note=${t("hideNameplates_note")}
    >${t("hideNameplates_title")}</${SwitchItem}>

    <${SwitchItem}
      value=${store.hideTags}
      onChange=${(v) => store.hideTags = v}
      note=${t("hideTags_note")}
    >${t("hideTags_title")}</${SwitchItem}>

    <${SwitchItem}
      value=${store.roleSolidColor}
      onChange=${(v) => store.roleSolidColor = v}
      note=${t("roleSolidColor_note")}
    >${t("roleSolidColor_title")}</${SwitchItem}>

    <${Divider} mt=${true} />
    <small style=${{ opacity: .7 }}>
      ${t("footer_note")}
    </small>
  `;
}

//#endregion
exports.onLoad = onLoad
exports.onUnload = onUnload
exports.settings = settings
return exports;
})({});