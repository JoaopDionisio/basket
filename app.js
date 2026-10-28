(() => {
  "use strict";

  /* ---------------- Data ---------------- */
  const STORE_KEY = "basket.v1";
  const I18N = window.BASKET_I18N;

  // Item ids are the English name in lower case; display names come from i18n.js.
  const DEFAULT_CATEGORIES = [
    { id: "food", em: "🥕", items: [
      ["eggs", "🥚"], ["bacon", "🥓"], ["spinach", "🥬"], ["almonds", "🌰"], ["bread", "🍞"],
      ["milk", "🥛"], ["cheese", "🧀"], ["tomatoes", "🍅"], ["bananas", "🍌"], ["apples", "🍎"],
      ["chicken", "🍗"], ["rice", "🍚"], ["pasta", "🍝"], ["onions", "🧅"], ["avocado", "🥑"],
    ] },
    { id: "drinks", em: "☕", items: [
      ["coffee", "☕"], ["tea", "🍵"], ["water", "💧"], ["juice", "🧃"], ["wine", "🍷"], ["beer", "🍺"],
    ] },
    { id: "home", em: "🧺", items: [
      ["paper towels", "🧻"], ["dish soap", "🫧"], ["detergent", "🧴"], ["trash bags", "🗑️"], ["sponges", "🧽"], ["candles", "🕯️"],
    ] },
    { id: "care", em: "🌿", items: [
      ["toothpaste", "🪥"], ["shampoo", "🧴"], ["soap", "🧼"], ["deodorant", "🌸"], ["tissues", "🤧"],
    ] },
  ].map(c => ({ ...c, items: c.items.map(([key, em]) => ({ key, em })) }));

  // A list with no name shows the translated "My list".
  const blankList = () => ({ id: null, name: null, items: [] });

  let db = loadDb();
  let current = db.draft ? db.draft.list : null;
  let dirty = db.draft ? db.draft.dirty : false;
  if (!current) current = db.lastId && db.saved[db.lastId] ? clone(db.saved[db.lastId]) : blankList();
  if (current.name === "My list") current.name = null;    // lists from before translations existed

  function loadDb() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (_) {}
    return {
      lang: (navigator.language || "").toLowerCase().startsWith("pt") ? "pt" : "en",
      custom: {},        // categoryId -> [{name, em}]
      collapsed: {},     // categoryId -> bool
      saved: {},         // listId -> {id, name, items, updatedAt}
      lastId: null,      // the saved list that opens on launch
      draft: null,       // {list, dirty} — work in progress, so nothing is lost if the app closes
      ...(raw || {}),
    };
  }
  function persist() {
    db.draft = { list: current, dirty };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (_) {}
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  const keyOf = name => name.trim().toLowerCase();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------------- Language ---------------- */
  function t(key, vars) {
    const s = (I18N.STRINGS[db.lang] || I18N.STRINGS.en)[key] ?? I18N.STRINGS.en[key] ?? key;
    return vars ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k]) : s;
  }
  const plural = (key, n) => t(`${key}_${n === 1 ? "one" : "other"}`, { n });
  const locale = () => (I18N.LANGS.find(l => l.id === db.lang) || I18N.LANGS[0]).locale;
  const itemName = it => I18N.ITEMS[it.key]?.[db.lang] ?? it.name;
  const catName = cat => I18N.CATEGORIES[cat.id][db.lang];
  const listName = l => l.name || t("myList");

  function applyStaticText() {
    document.documentElement.lang = locale();
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
  }
  function setLang(lang) {
    db.lang = lang;
    persist();
    applyStaticText(); renderPantry(); renderList();
  }

  /* ---------------- Elements ---------------- */
  const $ = s => document.querySelector(s);
  const pantry = $("#pantry"), catsEl = $("#categories"), board = $("#board"), itemsEl = $("#items");
  const listNameEl = $("#listName"), listMetaEl = $("#listMeta"), titleBtn = $("#listTitle");
  const btnDelete = $("#btnDelete");
  const sheet = $("#sheet"), sheetBody = $("#sheetBody"), backdrop = $("#sheetBackdrop");
  const toastEl = $("#toast");

  const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
  const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- Pantry ---------------- */
  let editing = false;

  function renderPantry() {
    catsEl.innerHTML = DEFAULT_CATEGORIES.map(cat => {
      const custom = db.custom[cat.id] || [];
      const chips = [
        ...cat.items.map(it => chipHtml(cat, it.key, itemName(it), it.em, false)),
        ...custom.map(it => chipHtml(cat, keyOf(it.name), it.name, it.em, true)),
        `<button class="chip chip-add" data-add="${cat.id}">${t("add")}</button>`,
      ].join("");
      return `<section class="cat ${db.collapsed[cat.id] ? "collapsed" : ""}" data-cat="${cat.id}">
        <button class="cat-head" data-toggle="${cat.id}" aria-expanded="${!db.collapsed[cat.id]}">
          <span class="cat-emoji">${cat.em}</span>${esc(catName(cat))}${ICON_CHEV}
        </button>
        <div class="cat-body"><div class="cat-chips">${chips}</div></div>
      </section>`;
    }).join("");
  }
  function chipHtml(cat, key, name, em, custom) {
    return `<button class="chip ${custom ? "custom" : ""}" data-cat="${cat.id}" data-key="${esc(key)}" data-name="${esc(name)}" data-em="${em}">
      <span class="em">${em}</span>${esc(name)}${custom ? '<span class="x">×</span>' : ""}
    </button>`;
  }

  catsEl.addEventListener("click", e => {
    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      const id = toggle.dataset.toggle;
      db.collapsed[id] = !db.collapsed[id];
      toggle.parentElement.classList.toggle("collapsed", db.collapsed[id]);
      toggle.setAttribute("aria-expanded", !db.collapsed[id]);
      persist();
      return;
    }
    const add = e.target.closest("[data-add]");
    if (add) return startAddChip(add);
    const chip = e.target.closest(".chip.custom");
    if (chip && editing) {
      const list = db.custom[chip.dataset.cat] || [];
      db.custom[chip.dataset.cat] = list.filter(i => keyOf(i.name) !== chip.dataset.key);
      persist(); renderPantry();
    }
  });

  function startAddChip(addBtn) {
    const cat = DEFAULT_CATEGORIES.find(c => c.id === addBtn.dataset.add);
    const input = document.createElement("input");
    input.className = "chip-input";
    input.placeholder = t("newItem");
    input.enterKeyHint = "done";
    addBtn.replaceWith(input);
    input.focus();
    let finished = false;
    const finish = save => {
      if (finished) return; finished = true;
      const name = input.value.trim();
      if (save && name) {
        const k = keyOf(name);
        // Skip duplicates of a built-in item (in any language) or of an item added before.
        const exists = cat.items.some(i => i.key === k || Object.values(I18N.ITEMS[i.key]).some(n => keyOf(n) === k))
          || (db.custom[cat.id] || []).some(i => keyOf(i.name) === k);
        if (!exists) (db.custom[cat.id] ||= []).push({ name: name[0].toUpperCase() + name.slice(1), em: cat.em });
        persist();
      }
      renderPantry();
    };
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  $("#editToggle").addEventListener("click", e => {
    editing = !editing;
    pantry.classList.toggle("editing", editing);
    e.currentTarget.setAttribute("aria-pressed", editing);
    if (editing) toast(t("editHint"));
  });

  /* ---------------- Drag & drop (pointer events: works with mouse + touch) ---------------- */
  let drag = null;
  const LONG_PRESS = 200, MOVE_TOL = 8;

  catsEl.addEventListener("pointerdown", e => {
    const chip = e.target.closest(".chip");
    if (!chip || chip.classList.contains("chip-add") || editing || e.button > 0) return;
    drag = { chip, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, active: false, touch: e.pointerType !== "mouse" };
    if (drag.touch) drag.timer = setTimeout(() => drag && beginDrag(), LONG_PRESS);
  });

  window.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag.x = e.clientX; drag.y = e.clientY;
    const dx = drag.x - drag.sx, dy = drag.y - drag.sy;
    const moved = Math.hypot(dx, dy) > MOVE_TOL;
    if (!drag.active) {
      if (!moved) return;
      // Touch: a sideways swipe picks the item up; an up/down swipe scrolls the pantry.
      if (drag.touch && Math.abs(dy) > Math.abs(dx)) { cancelDrag(); return; }
      clearTimeout(drag.timer);
      beginDrag();
      return;
    }
    moveGhost();
    board.classList.toggle("drag-over", overBoard());
  });

  window.addEventListener("pointerup", e => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    clearTimeout(d.timer);
    if (!d.active) {                               // simple tap → add
      drag = null;
      addFromChip(d.chip, true);
      return;
    }
    if (overBoard()) {
      const el = addFromChip(d.chip, false);
      flyGhost(d.ghost, el);
    } else {
      returnGhost(d.ghost, d.chip);
    }
    endDragUi(d);
    drag = null;
  });
  window.addEventListener("pointercancel", () => drag && cancelDrag());

  // Keep the browser from starting a scroll during a drag (or a sideways swipe that's about to become one),
  // otherwise it cancels the pointer and the item gets dropped mid-air.
  document.addEventListener("touchmove", e => {
    if (!drag) return;
    const t = e.touches[0];
    const dx = t ? t.clientX - drag.sx : 0, dy = t ? t.clientY - drag.sy : 0;
    const sideways = Math.hypot(dx, dy) > 4 && Math.abs(dx) > Math.abs(dy);
    if (drag.active || sideways) e.preventDefault();
  }, { passive: false });
  catsEl.addEventListener("contextmenu", e => { if (e.target.closest(".chip")) e.preventDefault(); });
  // Keyboard users: Enter/Space on a chip adds it (pointer taps are handled on pointerup).
  catsEl.addEventListener("click", e => {
    const chip = e.target.closest(".chip:not(.chip-add)");
    if (chip && e.detail === 0 && !editing) addFromChip(chip, true);
  });

  function beginDrag() {
    const { chip } = drag;
    drag.active = true;
    const r = chip.getBoundingClientRect();
    drag.ox = drag.x - r.left; drag.oy = drag.y - r.top;
    const ghost = chip.cloneNode(true);
    ghost.classList.add("ghost");
    ghost.style.width = r.width + "px";
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    chip.classList.add("picked");
    board.classList.add("dragging");
    document.body.classList.add("is-dragging");
    if (navigator.vibrate) navigator.vibrate(8);
    moveGhost();
  }
  function moveGhost() {
    const { ghost, x, y, ox, oy } = drag;
    ghost.style.transform = `translate(${x - ox}px, ${y - oy}px) rotate(-4deg) scale(1.08)`;
  }
  function overBoard() {
    const r = board.getBoundingClientRect();
    return drag.x >= r.left && drag.x <= r.right && drag.y >= r.top && drag.y <= r.bottom;
  }
  function endDragUi(d) {
    d.chip.classList.remove("picked");
    board.classList.remove("dragging", "drag-over");
    document.body.classList.remove("is-dragging");
  }
  function cancelDrag() {
    clearTimeout(drag.timer);
    if (drag.active) { returnGhost(drag.ghost, drag.chip); endDragUi(drag); }
    drag = null;
  }
  function flyGhost(ghost, target) {
    if (!target) { ghost.remove(); return; }
    const t = target.getBoundingClientRect();
    ghost.classList.add("fly");
    void ghost.offsetWidth;                        // lock in the start position so the flight animates
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${t.left + 10}px, ${t.top + 6}px) scale(.9)`;
      ghost.style.opacity = "0";
    });
    setTimeout(() => ghost.remove(), 460);
  }
  function returnGhost(ghost, chip) {
    const r = chip.getBoundingClientRect();
    ghost.classList.add("fly");
    requestAnimationFrame(() => { ghost.style.transform = `translate(${r.left}px, ${r.top}px)`; });
    setTimeout(() => ghost.remove(), 460);
  }

  function addFromChip(chip, animate) {
    const { key, name, em } = chip.dataset;
    let start = animate ? chip.getBoundingClientRect() : null;
    const el = addItem(key, name, em);
    if (start && el) {                              // tap: a little flying copy
      const g = chip.cloneNode(true);
      g.classList.add("ghost", "fly");
      g.style.width = start.width + "px";
      g.style.transform = `translate(${start.left}px, ${start.top}px)`;
      document.body.appendChild(g);
      flyGhost(g, el);
    }
    return el;
  }

  /* ---------------- List ---------------- */
  function addItem(key, name, em) {
    let item = current.items.find(i => i.key === key);
    if (item) { item.qty += 1; item.done = false; }
    else { item = { key, name, em, qty: 1, done: false }; current.items.push(item); }
    markDirty();
    renderList(key);
    const el = itemsEl.querySelector(`[data-key="${CSS.escape(key)}"]`);
    // Instant scroll, so the flying copy aims at where the item really ends up.
    if (el) el.scrollIntoView({ block: "nearest" });
    return el;
  }

  function renderList(bumpKey) {
    listNameEl.textContent = listName(current);
    titleBtn.classList.toggle("dirty", dirty);
    const n = current.items.length, left = current.items.filter(i => !i.done).length;
    listMetaEl.textContent = n === 0 ? t(current.id ? "savedEmpty" : "notSaved")
      : t("toBuy", { n: left }) + (n - left ? t("inBasket", { n: n - left }) : "");
    board.classList.toggle("has-items", n > 0);
    btnDelete.disabled = !current.id;

    const existing = new Map([...itemsEl.children].map(li => [li.dataset.key, li]));
    let prev = null;
    current.items.forEach(it => {
      let li = existing.get(it.key);
      if (!li) {
        li = document.createElement("li");
        li.className = "item";
        li.dataset.key = it.key;
        li.innerHTML = `<button class="check">${ICON_CHECK}</button>
          <span class="item-name"></span><span class="qty"></span>
          <button class="remove">${ICON_X}</button>`;
      }
      existing.delete(it.key);
      li.classList.toggle("done", it.done);
      li.querySelector(".check").setAttribute("aria-label", t("markBought"));
      li.querySelector(".remove").setAttribute("aria-label", t("remove"));
      li.querySelector(".item-name").innerHTML = `<span class="em">${it.em}</span>${esc(itemName(it))}`;
      const q = li.querySelector(".qty");
      q.textContent = "×" + it.qty;
      q.hidden = it.qty < 2;
      if (it.key === bumpKey && li.isConnected) { li.classList.remove("bump"); void li.offsetWidth; li.classList.add("bump"); }
      // Only move nodes that are out of place, so existing items don't replay their entry animation.
      const want = prev ? prev.nextSibling : itemsEl.firstChild;
      if (li !== want) itemsEl.insertBefore(li, want);
      prev = li;
    });
    existing.forEach(li => li.remove());
  }

  itemsEl.addEventListener("click", e => {
    const li = e.target.closest(".item");
    if (!li) return;
    const idx = current.items.findIndex(i => i.key === li.dataset.key);
    if (idx < 0) return;
    if (e.target.closest(".remove")) {
      const [removed] = current.items.splice(idx, 1);
      li.classList.add("leaving");
      markDirty();
      setTimeout(() => renderList(), 220);
      toast(t("removed", { name: itemName(removed) }), t("undo"), () => {
        current.items.splice(Math.min(idx, current.items.length), 0, removed);
        markDirty(); renderList();
      });
      return;
    }
    if (e.target.closest(".qty")) {                 // tap quantity to decrease it
      const it = current.items[idx];
      if (it.qty > 1) { it.qty -= 1; markDirty(); renderList(); }
      return;
    }
    current.items[idx].done = !current.items[idx].done;
    markDirty();
    renderList();
  });

  function markDirty() { dirty = true; persist(); }
  function setClean() { dirty = false; persist(); }

  /* ---------------- Actions ---------------- */
  $("#btnClear").addEventListener("click", () => {
    if (!current.items.length) return toast(t("alreadyEmpty"));
    const backup = current.items;
    current.items = [];
    markDirty(); renderList();
    toast(t("cleared"), t("undo"), () => { current.items = backup; markDirty(); renderList(); });
  });

  $("#btnSave").addEventListener("click", () => {
    if (current.id) return saveCurrent();
    askName(t("saveTitle"), t("saveSub"), current.name || "", t("save"), name => {
      current.name = name;
      current.id = uid();
      saveCurrent();
    });
  });

  function saveCurrent() {
    db.saved[current.id] = { ...clone(current), updatedAt: Date.now() };
    db.lastId = current.id;
    setClean(); renderList();
    toast(t("savedToast", { name: listName(current) }));
  }

  $("#btnLoad").addEventListener("click", () => {
    const lists = Object.values(db.saved).sort((a, b) => b.updatedAt - a.updatedAt);
    openSheet(`
      <h2>${t("yourLists")}</h2>
      <p class="sub">${t("pickOne")}</p>
      ${lists.length ? `<ul class="saved-list">${lists.map(l => `
        <li><button class="saved ${l.id === current.id ? "current" : ""}" data-load="${l.id}">
          <span class="badge">${esc(listName(l).trim()[0] || "•").toUpperCase()}</span>
          <span class="info"><span class="name">${esc(listName(l))}</span>
          <span class="when">${plural("items", l.items.length)} · ${when(l.updatedAt)}</span></span>
        </button></li>`).join("")}</ul>`
        : `<p class="saved-empty">${t("noLists")}</p>`}
      <button class="btn new-list" data-new>${t("newList")}</button>
    `);
    sheetBody.onclick = e => {
      const b = e.target.closest("[data-load]");
      if (b) {
        current = clone(db.saved[b.dataset.load]);
        delete current.updatedAt;
        db.lastId = current.id;
        setClean(); renderList(); closeSheet();
        toast(t("opened", { name: listName(current) }));
      }
      if (e.target.closest("[data-new]")) {
        current = blankList();
        setClean(); renderList(); closeSheet();
      }
    };
  });

  btnDelete.addEventListener("click", () => {
    if (!current.id) return;
    openSheet(`
      <h2>${esc(t("deleteTitle", { name: listName(current) }))}</h2>
      <p class="sub">${t("deleteSub")}</p>
      <div class="sheet-row">
        <button class="btn" data-cancel>${t("keep")}</button>
        <button class="btn btn-danger" data-confirm>${t("delete")}</button>
      </div>`);
    sheetBody.onclick = e => {
      if (e.target.closest("[data-cancel]")) closeSheet();
      if (e.target.closest("[data-confirm]")) {
        const name = listName(current);
        delete db.saved[current.id];
        if (db.lastId === current.id) db.lastId = null;
        current = blankList();
        setClean(); renderList(); closeSheet();
        toast(t("deleted", { name }));
      }
    };
  });

  titleBtn.addEventListener("click", () => {
    askName(t("renameList"), "", current.name || "", t("done"), name => {
      current.name = name;
      markDirty(); renderList();
    });
  });

  $("#settingsBtn").addEventListener("click", openSettings);
  function openSettings() {
    openSheet(`
      <h2>${t("settings")}</h2>
      <p class="sub">${t("language")}</p>
      <ul class="saved-list">${I18N.LANGS.map(l => `
        <li><button class="saved choice ${l.id === db.lang ? "current" : ""}" data-lang="${l.id}" aria-pressed="${l.id === db.lang}">
          <span class="badge">${l.id.toUpperCase()}</span>
          <span class="info"><span class="name">${l.label}</span></span>
          ${l.id === db.lang ? `<span class="tick">${ICON_CHECK}</span>` : ""}
        </button></li>`).join("")}</ul>
    `);
    sheetBody.onclick = e => {
      const b = e.target.closest("[data-lang]");
      if (b && b.dataset.lang !== db.lang) { setLang(b.dataset.lang); openSettings(); }
    };
  }

  function when(ts) {
    const d = new Date(ts), today = new Date();
    const days = Math.round((new Date(today.toDateString()) - new Date(d.toDateString())) / 864e5);
    const time = d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    if (days === 0) return t("today", { time });
    if (days === 1) return t("yesterday", { time });
    return d.toLocaleDateString(locale(), { day: "numeric", month: "short" });
  }

  /* ---------------- Sheet & toast ---------------- */
  function openSheet(html) {
    sheetBody.innerHTML = html;
    sheet.hidden = backdrop.hidden = false;
    sheet.classList.remove("closing"); backdrop.classList.remove("closing");
  }
  function closeSheet() {
    sheet.classList.add("closing"); backdrop.classList.add("closing");
    setTimeout(() => { sheet.hidden = backdrop.hidden = true; sheetBody.onclick = null; }, 190);
  }
  backdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });

  function askName(title, sub, value, cta, onOk) {
    openSheet(`
      <h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}
      <form data-form>
        <input type="text" maxlength="40" placeholder="${esc(t("placeholder"))}" value="${esc(value)}" enterkeyhint="done" />
        <div class="sheet-row">
          <button type="button" class="btn" data-cancel>${t("cancel")}</button>
          <button type="submit" class="btn btn-primary">${cta}</button>
        </div>
      </form>`);
    if (!sub) sheetBody.querySelector("form").style.marginTop = "14px";
    const input = sheetBody.querySelector("input");
    setTimeout(() => input.focus(), 60);
    sheetBody.querySelector("form").onsubmit = e => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      closeSheet(); onOk(name);
    };
    sheetBody.onclick = e => { if (e.target.closest("[data-cancel]")) closeSheet(); };
  }

  let toastTimer;
  function toast(msg, actionLabel, action) {
    toastEl.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button>${actionLabel}</button>` : ""}`;
    if (actionLabel) toastEl.querySelector("button").onclick = () => { action(); hide(); };
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, actionLabel ? 4500 : 2200);
    function hide() { toastEl.classList.remove("show"); }
  }

  /* ---------------- Boot ---------------- */
  applyStaticText();
  renderPantry();
  renderList();
  persist();

  // The Android app already has every file on the device, so only the web version needs the offline cache.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !window.Capacitor) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
