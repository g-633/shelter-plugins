// NoFlair — Nameplates & Tags + Vanilla nicknames (no gradients/fonts), JS

/* ── i18n ─────────────────────────────────────────────────────────────── */
const LOCALES = {
  en: {
    vanillaNick_title: "Vanilla nicknames (font & color)",
    vanillaNick_note:
      "Removes nitro name styles.",
    hideNameplates_title: "Hide nameplates",
    hideNameplates_note: "Hide decorative nameplates.",
    hideTags_title: "Hide tags",
    hideTags_note: "Hide guild tags next to nicknames.",
    footer_note: "Changes are applied immediately, no restart required.",
  },
  ru: {
    vanillaNick_title: "Обычные ники (шрифт и цвет)",
    vanillaNick_note:
      "Убирает донатные стили ников.",
    hideNameplates_title: "Скрывать nameplates",
    hideNameplates_note: "Скрывать декоративные nameplates.",
    hideTags_title: "Скрывать теги",
    hideTags_note: "Скрывать гильдейские теги рядом с ником.",
    footer_note: "Изменения применяются сразу, перезапуск не требуется.",
  },
};

function detectLang() {
  const l = (document?.documentElement?.lang || "").toLowerCase();
  return l.startsWith("ru") ? "ru" : "en";
}
function t(key) {
  const lang = detectLang();
  return (LOCALES[lang] && LOCALES[lang][key]) || LOCALES.en[key] || key;
}

/* ── main ──────────────────────────────────────────────────────────────── */
export function onLoad() {
  const {
    plugin: { store, scoped },
  } = shelter;

  /* ── migration / defaults ────────────────────────────────────────────── */
  if (store.hideInMembers !== undefined || store.hideInDMs !== undefined) {
    const prev = Boolean(store.hideInMembers ?? store.hideInDMs ?? true);
    if (store.hideNameplates === undefined) store.hideNameplates = prev;
    if (store.hideTags === undefined) store.hideTags = prev;
    try { delete store.hideInMembers; delete store.hideInDMs; } catch {}
  }
  if (store.hideTags === undefined && store.hideNameplates !== undefined) {
    store.hideTags = store.hideNameplates;
  }

  if (store.hideNameplates === undefined)   store.hideNameplates   = true;
  if (store.hideTags === undefined)         store.hideTags         = true;
  if (store.vanillaNicknames === undefined) store.vanillaNicknames = true;

  /* ── CSS: nameplates ─────────────────────────────────────────────────── */
  const CSS_NAMEPLATES = `
/* Members list: декоративная подложка у nameplated-карточек */
[class*="nameplated"] > [class*="container__4bbc6"],
[class*="nameplated"] > [class*="container"] {
  display: none !important;
}
[class*="nameplated"] > [class*="container__4bbc6"],
[class*="nameplated"] > [class*="container"],
[class*="nameplated"] [class*="videoContainer"] {
  background: none !important;
  background-image: none !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  backdrop-filter: none !important;
  filter: none !important;
  pointer-events: none !important;
}

/* Любые источники nameplate-ассетов */
video[src*="/collectibles/nameplates"],
video[poster*="/collectibles/nameplates"],
img[src*="/collectibles/nameplates"],
source[src*="/collectibles/nameplates"] {
  display: none !important;
}

/* DM list: убираем оверлей/полоску выбранного DM */
li[class*="dm__"] > div[class*="interactive"] > div[class*="container__4bbc6"][aria-hidden="true"],
li[class*="dm__"] > div[class*="interactive"] > div[class*="container"][aria-hidden="true"] {
  display: none !important;
}
li[class*="dm__"] div[class*="videoContainer"],
li[class*="dm__"] div[class*="container__4bbc6"][aria-hidden="true"] {
  background: none !important;
  background-image: none !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  backdrop-filter: none !important;
  filter: none !important;
}

/* DM list: нейтрализуем переменные «плашки» справа */
li[class*="dm__"] .iconsContainer__972a0,
li[class*="dm__"] [class*="iconsContainer"] {
  --custom-nameplate: transparent !important;
  --custom-nameplate-neutral: transparent !important;
  --custom-nameplate-neutral-hovered: var(--background-modifier-hover) !important;
}
li[class*="dm__"] .closeButtonPlated__972a0,
li[class*="dm__"] [class*="closeButtonPlated"] {
  background: transparent !important;
}
`;

  /* ── CSS: robust guild/clan tags hide ────────────────────────────────── */
  const CSS_TAGS = `
/* Классовые селекторы (DM, сообщения, сайдбар участников, профиль) */
[class^="guildTag_"], [class*=" guildTag_"],
[class^="guildTagContainer_"], [class*=" guildTagContainer_"],
[class^="clanTag_"], [class*=" clanTag_"],
[class^="clanTagChiplet_"], [class*=" clanTagChiplet_"] {
  display: none !important;
  visibility: hidden !important;
}

/* По aria-label (локали EN/RU) */
[aria-label^="Server Tag"], [aria-label*="Server Tag:"],
[aria-label^="Тег сервера"], [aria-label*="Тег сервера:"] {
  display: none !important;
  visibility: hidden !important;
}

/* Если осталась только эмблема */
img[src*="/clan-badges/"] {
  display: none !important;
  visibility: hidden !important;
}

/* Пунктир-точку перед чиплетом в профиле скрываем, если браузер поддерживает :has */
.dotSpacer__63ed3:has(+ [class^="guildTag_"]),
.dotSpacer__63ed3:has(+ [class*=" guildTag_"]),
.dotSpacer__63ed3:has(+ [aria-label^="Server Tag"]),
.dotSpacer__63ed3:has(+ [aria-label^="Тег сервера"]) {
  display: none !important;
}
`;

  /* ── CSS: vanilla nicknames (scoped to effect containers only) ───────── */
  const CSS_VANILLA_NICKS = `
/* 1) Root nodes with username effects — nuke flashy styling, keep theme color */
:where(
  [data-username-with-effects],
  [style*="--custom-display-name-styles-"],
  [class*="withDisplayNameStyles"],
  [class*="nicknameWithDisplayNameStyles"],
  [class*="dnsFont"]
) {
  animation: none !important;
  transition: none !important;
  filter: none !important;
  text-shadow: none !important;
  background: none !important;
  background-image: none !important;
  -webkit-background-clip: initial !important;
  background-clip: initial !important;
  -webkit-text-fill-color: currentColor !important;
  mask-image: none !important;
  -webkit-mask-image: none !important;
  mix-blend-mode: normal !important;
}

/* 2) Actual text inside — force default font, DO NOT set color (inherit theme) */
:where(
  [data-username-with-effects],
  [style*="--custom-display-name-styles-"],
  [class*="withDisplayNameStyles"],
  [class*="nicknameWithDisplayNameStyles"],
  [class*="dnsFont"]
) :is(
  [data-username-with-effects],
  [class*="innerContainer_"],
  [class*="username"],
  [class*="displayUsername"]
) {
  font-family: var(--font-primary) !important;
  font-style: normal !important;
  font-weight: 500 !important;
  letter-spacing: normal !important;
  -webkit-text-fill-color: currentColor !important;
}

/* 2b) Discord иногда вешает шрифт прямо на узел ника (pixelify__*, chicle__*, ...).
   Принудительно откатываем шрифт и там тоже. */
:where([class*="username__"], [class*="displayUsername"]) {
  font-family: var(--font-primary) !important;
  font-style: normal !important;
  font-weight: 500 !important;
  letter-spacing: normal !important;
  -webkit-text-fill-color: currentColor !important;
}

/* 3) Popular effect classes, but only within effect-root scope */
:where(
  [data-username-with-effects],
  [style*="--custom-display-name-styles-"],
  [class*="withDisplayNameStyles"],
  [class*="nicknameWithDisplayNameStyles"],
  [class*="dnsFont"]
) :is(
  [class*="gradient_"],
  [class*="toon_"],
  [class*="underlineOnHover_"],
  [class*="animated_"],
  [class*="loop_"],
  [class*="cherryBomb"],
  [class*="sinistre"]
) {
  animation: none !important;
  background: none !important;
  -webkit-background-clip: initial !important;
  background-clip: initial !important;
  -webkit-text-fill-color: currentColor !important;
  font-family: var(--font-primary) !important;
}
`;

  /* ── Vanilla nicknames DOM handling ──────────────────────────────────── */
  const VANILLA_QUERY = [
    "[data-username-with-effects]",
    "[style*='--custom-display-name-styles-']",
    "[class*='withDisplayNameStyles']",
    "[class*='nicknameWithDisplayNameStyles']",
    "[class*='dnsFont']",
    "[class*='gradient_']",
    "[class*='toon_']",
    "[class*='underlineOnHover_']",
    "[class*='animated_']",
    "[class*='loop_']",
  ].join(",");

  function neutralizeNickname(node) {
    const el = /** @type {HTMLElement} */ (node);
    if (!el) return;

    if (el.hasAttribute?.("data-username-with-effects")) {
      el.removeAttribute("data-username-with-effects");
    }

    for (const p of [
      "background","background-image","text-shadow","animation","transition",
      "-webkit-text-fill-color","-webkit-background-clip","background-clip",
      "mask-image","-webkit-mask-image","mix-blend-mode",
      "font-family","color","font-style","font-weight","letter-spacing"
    ]) el.style.removeProperty(p);

    [
      "--custom-display-name-styles-gradient-start-color",
      "--custom-display-name-styles-gradient-end-color",
      "--custom-display-name-styles-main-color",
      "--custom-display-name-styles-light-1-color",
      "--custom-display-name-styles-light-2-color",
      "--custom-display-name-styles-dark-1-color",
      "--custom-display-name-styles-dark-2-color",
      "--custom-display-name-styles-wrap",
      "--custom-display-name-styles-font-opacity"
    ].forEach(v => el.style.removeProperty(v));

    for (const c of [...el.classList]) {
      if (["gradient_","toon_","underlineOnHover_","animated_","loop_","dnsFont","cherryBomb","sinistre"].some(b => c.includes(b))) {
        el.classList.remove(c);
      }
    }
  }

  /* ── Guild tag hider (CSS + JS fallback) ─────────────────────────────── */
  const TAG_SELECTORS = [
    // Classes
    '[class^="guildTag_"]','[class*=" guildTag_"]',
    '[class^="guildTagContainer_"]','[class*=" guildTagContainer_"]',
    '[class^="clanTag_"]','[class*=" clanTag_"]',
    '[class^="clanTagChiplet_"]','[class*=" clanTagChiplet_"]',
    // aria-label (EN/RU)
    '[aria-label^="Server Tag"]','[aria-label*="Server Tag:"]',
    '[aria-label^="Тег сервера"]','[aria-label*="Тег сервера:"]',
    // Only badge image
    'img[src*="/clan-badges/"]'
  ].join(',');

  /** Hide node + clean nearby dot separator */
  function hideGuildTagNode(node) {
    if (!node || !(node instanceof HTMLElement)) return;

    // already hidden?
    if (node.dataset.gtHidden === "1") return;

    node.dataset.gtHidden = "1";
    node.setAttribute("hidden", "");
    node.style.setProperty("display", "none", "important");
    node.style.setProperty("visibility", "hidden", "important");

    // Hide empty wrapper to avoid gaps
    const wrap = node.closest('span,div');
    if (wrap && (wrap.childElementCount <= 1 || wrap.textContent.trim() === "")) {
      wrap.dataset.gtWrapHidden = "1";
      wrap.style.setProperty("display", "none", "important");
    }

    // Hide preceding dot spacer commonly used in profiles
    const prev = node.previousElementSibling;
    if (prev && prev instanceof HTMLElement && /dotSpacer/i.test(prev.className)) {
      prev.dataset.gtDotHidden = "1";
      prev.style.setProperty("display", "none", "important");
      prev.setAttribute("hidden", "");
    }
  }

  /** Undo inline hiding done by JS fallback */
  function unhideGuildTags(root = document) {
    root.querySelectorAll("[data-gt-hidden='1']").forEach((el) => {
      el.removeAttribute("hidden");
      el.style.removeProperty("display");
      el.style.removeProperty("visibility");
      el.removeAttribute("data-gt-hidden");
    });
    root.querySelectorAll("[data-gt-wrap-hidden='1']").forEach((el) => {
      el.style.removeProperty("display");
      el.removeAttribute("data-gt-wrap-hidden");
    });
    root.querySelectorAll("[data-gt-dot-hidden='1']").forEach((el) => {
      el.removeAttribute("hidden");
      el.style.removeProperty("display");
      el.removeAttribute("data-gt-dot-hidden");
    });
  }

  function runGuildTagsSweep(root = document) {
    root.querySelectorAll(TAG_SELECTORS).forEach(hideGuildTagNode);
  }

  /* ── reactive wiring ─────────────────────────────────────────────────── */
  let unCssNP, unCssTags, unVanCss, unVanObs;
  let moTags;

  shelter.solid.createRoot((dispose) => {
    // Nameplates / Tags CSS + JS fallback
    shelter.solid.createEffect(() => {
      /* NAMEPLATES */
      unCssNP?.(); unCssNP = undefined;
      if (store.hideNameplates) unCssNP = scoped.ui.injectCss(CSS_NAMEPLATES);

      /* TAGS */
      // Clean previous
      try { moTags?.disconnect(); } catch {}
      unCssTags?.(); unCssTags = undefined;
      // When disabling tags, make sure to remove our inline fallbacks
      if (!store.hideTags) {
        unhideGuildTags(document);
        return;
      }

      // 1) CSS (strong specificity + !important)
      unCssTags = scoped.ui.injectCss(CSS_TAGS);

      // 2) Initial sweep (JS fallback)
      runGuildTagsSweep();

      // 3) Observe dynamic UI
      moTags = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === "childList") {
            m.addedNodes.forEach((n) => {
              if (n.nodeType === 1) runGuildTagsSweep(n);
            });
          } else if (m.type === "attributes" && m.attributeName === "aria-label") {
            const target = /** @type {HTMLElement} */ (m.target);
            const al = target.getAttribute("aria-label") || "";
            if (al.startsWith("Server Tag") || al.startsWith("Тег сервера")) {
              hideGuildTagNode(target);
            }
          }
        }
      });
      moTags.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-label"],
      });
    });

    // Vanilla nicknames
    shelter.solid.createEffect(() => {
      // cleanup prior
      if (unVanObs) { try { unVanObs.now?.(); } catch {} unVanObs = undefined; }
      if (unVanCss) { try { unVanCss(); } catch {} unVanCss = undefined; }

      if (store.vanillaNicknames) {
        unVanCss = scoped.ui.injectCss(CSS_VANILLA_NICKS);
        document.querySelectorAll(VANILLA_QUERY).forEach(neutralizeNickname);
        unVanObs = scoped.observeDom(VANILLA_QUERY, neutralizeNickname);
      }
    });

    scoped.onDispose(() => {
      try { moTags?.disconnect(); } catch {}
      try { unhideGuildTags(document); } catch {}
      try { unVanObs?.now?.(); } catch {}
      try { unVanCss?.(); } catch {}
      try { unCssNP?.(); } catch {}
      try { unCssTags?.(); } catch {}
      dispose();
    });

    return dispose;
  });

  console.log("[NoFlair] onLoad (nameplates/tags + vanilla nicknames)");
}

export function onUnload() {}

/* ── settings UI ───────────────────────────────────────────────────────── */
export function settings() {
  const {
    plugin: { store },
    ui: { SwitchItem, Divider },
    solidH: { html },
  } = shelter;

  return html`
    <${SwitchItem}
      value=${store.vanillaNicknames}
      onChange=${(v) => (store.vanillaNicknames = v)}
      note=${t("vanillaNick_note")}
    >${t("vanillaNick_title")}</${SwitchItem}>

    <${SwitchItem}
      value=${store.hideNameplates}
      onChange=${(v) => (store.hideNameplates = v)}
      note=${t("hideNameplates_note")}
    >${t("hideNameplates_title")}</${SwitchItem}>

    <${SwitchItem}
      value=${store.hideTags}
      onChange=${(v) => (store.hideTags = v)}
      note=${t("hideTags_note")}
    >${t("hideTags_title")}</${SwitchItem}>

    <${Divider} mt=${true} />
    <small style=${{ opacity: 0.7 }}>
      ${t("footer_note")}
    </small>
  `;
}
