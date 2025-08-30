let disposeRoot;

export function onLoad() {
  const {
    plugin: { store, scoped },
    solid,
  } = shelter;

  // --- миграция со старых ключей ---
  if (store.hideInMembers !== undefined || store.hideInDMs !== undefined) {
    const prev = Boolean(store.hideInMembers ?? store.hideInDMs ?? true);
    if (store.hideNameplates === undefined) store.hideNameplates = prev;
    if (store.hideTags === undefined)       store.hideTags       = prev;
    try { delete store.hideInMembers; delete store.hideInDMs; } catch {}
  }

  if (store.hideTags === undefined && store.hideNameplates !== undefined) {
    store.hideTags = store.hideNameplates;
  }

  if (store.hideNameplates === undefined) store.hideNameplates = true;
  if (store.hideTags === undefined)       store.hideTags       = true;

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

  let unNP, unTags;

  disposeRoot = shelter.solid.createRoot((dispose) => {
    shelter.solid.createEffect(() => {
      unNP?.(); unNP = undefined;
      if (store.hideNameplates) unNP = scoped.ui.injectCss(CSS_NAMEPLATES);

      unTags?.(); unTags = undefined;
      if (store.hideTags) unTags = scoped.ui.injectCss(CSS_TAGS);
    });
    return dispose;
  });

  console.log("[Rem-Tag-And-Nameplate] onLoad");
}

export function onUnload() {
  try { disposeRoot?.(); } catch {}
}

export function settings() {
  const {
    plugin: { store },
    ui: { SwitchItem, Divider, Header, HeaderTags },
    solidH: { html },
  } = shelter;

  return html`
    <${Header} tag=${HeaderTags.H3}>Donat Nameplates & Tags</${Header}>

    <${SwitchItem}
      value=${store.hideNameplates}
      onChange=${(v) => (store.hideNameplates = v)}
      note="Hide decorative nameplates."
    >Скрывать nameplates</${SwitchItem}>

    <${SwitchItem}
      value=${store.hideTags}
      onChange=${(v) => (store.hideTags = v)}
      note="Hide guild tags next to nicknames."
    >Скрывать теги</${SwitchItem}>

    <${Divider} mt=${true} />
    <small style=${{ opacity: 0.7 }}>
      Changes are applied immediately, no restart required.
    </small>
  `;
}
