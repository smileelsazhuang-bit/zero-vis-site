// T28 — 首页 v4「空间画廊」交互，移植自 design/home-v4/home-v4.js。
// 依赖 data.js（作品数据）与 app.js 暴露的 window.ZV（B站弹窗、抖音面板、即将上线提示、语言）。
(() => {
  "use strict";
  const room = document.querySelector(".room");
  const track = document.querySelector("[data-gallery-track]");
  if (!room || !track) return;

  const ZV = window.ZV || {};
  const en = ZV.language === "en";
  const works = Array.isArray(window.PORTFOLIO_DATA?.works) ? window.PORTFOLIO_DATA.works : [];
  const L = (o) => (o && (en ? o.en || o.zh : o.zh || o.en)) || "";
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>';
  const IP = "assets/ip/dengrong-gutuan/";
  const ipHref = (hash) => `ip.html?id=dengrong-gutuan${en ? "&lang=en" : ""}${hash || ""}`;
  const T = en
    ? { play: "Play ▶", douyin: "Watch on Douyin ↗", game: "Play now →", soon: "Coming soon", making: "In production", full: "⤢ Fullscreen", open: "⤢ Open game", expand: "⤢ Open",
        bili: "Plays on site", dy: "Watch on Douyin", web: "Plays in browser", works: "works", hint: "Drag or swipe", prev: "Previous", next: "Next" }
    : { play: "播放 ▶", douyin: "抖音观看 ↗", game: "开始游玩 →", soon: "即将上线", making: "制作中", full: "⤢ 全屏观看", open: "⤢ 打开游戏", expand: "⤢ 展开",
        bili: "B 站站内播放", dy: "抖音观看", web: "网页即玩", works: "部作品", hint: "拖动或左右滑动", prev: "上一部", next: "下一部" };

  const fromData = (cat, kind) => works.filter((w) => w.category === cat).map((w) => {
    const live = kind === "film" ? ZV.hasVideo?.(w) : kind === "series" ? !!w.link_cn : !!w.play_url;
    return {
      work: w, kind, live, title: L(w.title), en: (en ? w.title?.zh : w.title?.en) || "", desc: L(w.highlight), img: w.cover || "",
      meta: `${w.year || "2026"} · ${live ? (kind === "film" ? T.bili : kind === "series" ? T.dy : T.web) : (kind === "film" ? T.making : T.soon)}`,
      go: live ? (kind === "film" ? T.play : kind === "series" ? T.douyin : T.game) : (kind === "film" ? T.making : T.soon),
      chip: live && kind === "film" ? T.full : live && kind === "game" ? T.open : "",
    };
  });
  const ipItems = en
    ? [
        { title: "Dengrong", en: "灯绒", img: IP + "cutout/dengrong-main.webp", fit: 1, desc: "A moon moth carrying a warm lamp — careful, curious, and always the first to notice a little light in ordinary days.", meta: "“Look, it got a little brighter here.”", go: "Meet Dengrong →", href: ipHref() },
        { title: "Gutuan", en: "菇团", img: IP + "cutout/gutuan-main.webp", fit: 1, desc: "A forest friend in a crooked mushroom hat — unhurried and steady, tending small wishes until they come true.", meta: "“Come on, let’s plant something fun.”", go: "Meet Gutuan →", href: ipHref() },
        { title: "Today, a Little Magic", en: "今天也有小魔法", img: IP + "p158.jpg", desc: "An original picture book in 180 illustrations.", meta: "Picture book · 180 illustrations", go: "Open the book →", chip: T.expand, href: ipHref() },
        { title: "Character Sheets", en: "角色设定图", img: IP + "sheet-dengrong.jpg", desc: "Turnarounds and expressions for Dengrong and Gutuan.", meta: "Official model sheets · 2026", go: "View sheets →", chip: T.expand, href: ipHref() },
      ]
    : [
        { title: "灯绒", en: "Dengrong", img: IP + "cutout/dengrong-main.webp", fit: 1, desc: "一只带着暖灯的月蛾。细心、好奇、想象力丰盛，总能先发现日常里一点点特别的光。", meta: "「你看，这里亮了一点。」", go: "认识灯绒 →", href: ipHref() },
        { title: "菇团", en: "Gutuan", img: IP + "cutout/gutuan-main.webp", fit: 1, desc: "戴着歪尖蘑菇帽的森林小伙伴。慢悠悠、踏实，喜欢亲手把一个小愿望照顾成真。", meta: "「来，种点好玩的。」", go: "认识菇团 →", href: ipHref() },
        { title: "今天也有小魔法", en: "Today, a Little Magic", img: IP + "p158.jpg", desc: "原创绘本，180 幅画面。我们把两声问候叠起来，渡口便开出七色的帆。", meta: "原创绘本 · 180 幅画面", go: "翻看绘本 →", chip: T.expand, href: ipHref() },
        { title: "角色设定图", en: "Character Sheets", img: IP + "sheet-dengrong.jpg", desc: "三视图与表情设定，灯绒的灯苞触角、月纹斗篷与菇团的歪尖帽都在这里定稿。", meta: "官方设定 · 2026", go: "查看设定 →", chip: T.expand, href: ipHref() },
      ];
  ipItems.forEach((it) => { it.kind = "ip"; it.live = true; });

  const CATS = {
    film: { name: en ? "Films" : "电影", en: "Films", accent: "#d6b072", items: fromData("film", "film") },
    series: { name: en ? "Series" : "漫剧", en: "Series", accent: "#e0705a", items: fromData("series", "series") },
    ip: { name: en ? "Originals" : "原创 IP", en: "Originals", accent: "#f2b84b", items: ipItems },
    game: { name: en ? "Games" : "游戏", en: "Games", accent: "#86c1b5", items: fromData("interactive", "game") },
  };
  Object.keys(CATS).forEach((k) => { if (!CATS[k].items.length) delete CATS[k]; });

  const $ = (sel) => room.querySelector(sel);
  const dots = $("[data-gallery-dots]");
  const hint = $("[data-gallery-hint]");
  const dock = $(".room__dock");
  const dockGo = $("[data-dock-go]");
  const bgs = room.querySelectorAll(".room__bg i");
  const tabs = [...room.querySelectorAll(".room__tabs [data-cat]")];
  let cat = "film", items = [], cards = [], idx = 0, pos = 0, flip = 0;

  if (hint) hint.querySelector("span").textContent = T.hint;
  room.querySelectorAll('[data-step="-1"]').forEach((b) => b.setAttribute("aria-label", T.prev));
  room.querySelectorAll('[data-step="1"]').forEach((b) => b.setAttribute("aria-label", T.next));
  // 语言按钮与原顶栏保持一致
  const langSrc = document.querySelector("[data-language-switch]");
  const langDst = $("[data-room-lang]");
  if (langSrc && langDst) { langDst.href = langSrc.href; langDst.textContent = langSrc.textContent; }

  function build(c, animate) {
    if (!CATS[c]) return;
    cat = c; items = CATS[c].items; idx = pos = 0;
    room.style.setProperty("--accent", CATS[c].accent);
    const land = c === "film" || c === "game";
    track.innerHTML = items.map((it, i) => `<div class="gcard${land ? " is-land" : ""}" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${esc(it.title)} · ${i + 1} / ${items.length}">
      ${it.img ? `<div class="gcard__frost" style="background-image:url('${esc(it.img)}')"></div>` : ""}<div class="gcard__glaze"></div>
      ${it.img ? `<img class="gcard__img${it.fit ? " is-fit" : ""}" src="${esc(it.img)}" alt="" draggable="false" decoding="async"${i > 2 && i < items.length - 1 ? ' loading="lazy"' : ""}>` : `<span class="gcard__ph">${esc(it.title)}</span>`}
      ${it.chip ? `<span class="gchip gchip--c" aria-hidden="true">${esc(it.chip)}</span>` : ""}<span class="gchip gchip--r" aria-hidden="true">···</span>
      <div class="gcard__body"><h3>${esc(it.title)}</h3><span class="gcard__num">${i + 1} / ${items.length}</span><span class="gcard__en">${esc(it.en)}</span>
        <p>${esc(it.desc)}</p><div class="gcard__meta">${pin}<span>${esc(it.meta)}</span></div></div>
      <div class="gcard__side" aria-hidden="true"><b>${esc(it.title)}</b><small>${esc(it.en)}</small></div></div>`).join("");
    cards = [...track.children];
    // 竖版图（漫剧海报、角色抠图）在横版卡里放右侧
    cards.forEach((card) => {
      const img = card.querySelector(".gcard__img"); if (!img) return;
      const mark = () => card.classList.toggle("is-tall", img.naturalHeight > img.naturalWidth * .9);
      if (img.complete && img.naturalWidth) mark(); else img.addEventListener("load", mark, { once: true });
    });
    if (dots) dots.innerHTML = items.map((it, i) => `<button type="button" data-i="${i}" aria-label="${esc(it.title)}"></button>`).join("");
    const addr = $("[data-room-addr]"); if (addr) addr.textContent = CATS[c].name;
    tabs.forEach((b) => { const on = b.dataset.cat === c; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    if (animate && !reduce) cards.forEach((el, i) => { el.classList.add("is-enter"); setTimeout(() => el.classList.remove("is-enter"), 60 + i * 70); });
    update();
  }

  function place() {
    const n = cards.length, cw = cards[0] ? cards[0].offsetWidth : 300, mobile = innerWidth <= 640;
    cards.forEach((c, i) => {
      let d = i - pos; if (n > 2) { if (d > n / 2) d -= n; if (d < -n / 2) d += n; }
      const a = Math.abs(d), s = Math.sign(d);
      // 中心卡正对；两侧卡向内转，越外越窄越后
      // 手机：竖版卡；电脑：16:9 横版卡，两侧卡转得更深、靠得更近
      const x = s * (Math.min(a, 1) * cw * (mobile ? .78 : .62) + Math.max(0, a - 1) * cw * (mobile ? .32 : .2));
      const rot = -s * Math.min(a, 1) * (mobile ? 32 : 46);
      const z = -Math.min(a, 1) * (mobile ? 160 : 260) - Math.max(0, a - 1) * (mobile ? 120 : 160);
      c.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${1 - Math.min(a, 2) * .04})`;
      c.style.zIndex = 100 - Math.round(a * 10);
      c.style.opacity = a > (mobile ? 2.6 : 2.4) ? 0 : 1;
      c.style.filter = a < .5 ? "none" : `brightness(${Math.max(.62, 1 - a * .18)})`;
      c.classList.toggle("is-on", a < .5);
      c.setAttribute("aria-hidden", a < .5 ? "false" : "true");
    });
    // 手机提示条放在中心卡图片区域
    const gal = track.parentElement;
    if (hint && gal && cards[0]) hint.style.top = `${gal.offsetTop + cards[0].offsetHeight * .3}px`;
  }

  function update() {
    place();
    const it = items[idx], C = CATS[cat];
    if (!it) return;
    if (dots) [...dots.children].forEach((d, i) => d.classList.toggle("is-on", i === idx));
    const thumb = $("[data-dock-thumb]"); if (thumb) { if (it.img) thumb.src = it.img; else thumb.removeAttribute("src"); }
    $("[data-dock-title]").textContent = it.title;
    $("[data-dock-sub]").textContent = `${C.name}${en ? "" : " · " + C.en} · ${String(idx + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    dockGo.textContent = it.go;
    dockGo.classList.toggle("is-soon", !it.live);
    if (it.kind === "ip") { dockGo.href = it.href; dockGo.removeAttribute("target"); dockGo.removeAttribute("rel"); }
    else if (it.kind === "game" && it.live) { dockGo.href = it.work.play_url; dockGo.target = "_blank"; dockGo.rel = "noopener noreferrer"; }
    else { dockGo.href = `#${it.kind === "film" ? "films" : it.kind === "series" ? "series" : "games"}`; dockGo.removeAttribute("target"); dockGo.removeAttribute("rel"); }
    dockGo.setAttribute("aria-haspopup", it.live && (it.kind === "film" || it.kind === "series") ? "dialog" : "false");
    if (dock) { dock.classList.remove("is-pop"); void dock.offsetWidth; dock.classList.add("is-pop"); }
    if (it.img && bgs.length === 2) {
      flip ^= 1; bgs[flip].style.backgroundImage = `url('${it.img}')`;
      bgs[flip].classList.add("is-on"); bgs[flip ^ 1].classList.remove("is-on");
    }
  }
  const go = (n) => { if (!items.length) return; idx = ((n % items.length) + items.length) % items.length; pos = idx; room.classList.remove("is-dragging"); update(); };

  // 主按钮：电影 → B站弹窗；漫剧 → 抖音面板；游戏/IP → 链接；未上线 → 提示
  dockGo.addEventListener("click", (e) => {
    const it = items[idx]; if (!it) return;
    stopAuto();
    if (it.kind === "ip" || (it.kind === "game" && it.live)) return;
    e.preventDefault();
    if (!it.live) { ZV.comingSoon?.(); return; }
    if (it.kind === "film") ZV.openVideo?.(it.work, dockGo);
    else if (it.kind === "series") ZV.openDouyin?.(it.work, it.work.link_cn, dockGo, { seasonName: it.work.link_cn_2 ? ZV.copy?.seasonOneName || "" : "" });
  });

  room.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => { stopAuto(); go(idx + Number(b.dataset.step)); }));
  tabs.forEach((b) => {
    if (!CATS[b.dataset.cat]) { b.hidden = true; return; }
    b.addEventListener("click", () => { stopAuto(); if (b.dataset.cat !== cat) build(b.dataset.cat, true); });
  });
  dots?.addEventListener("click", (e) => { const i = e.target.closest("[data-i]"); if (i) { stopAuto(); go(Number(i.dataset.i)); } });

  // 跟手拖动 + 惯性吸附
  let dragging = false, x0 = 0, y0 = 0, p0 = 0, lx = 0, lt = 0, v = 0, moved = false;
  track.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; moved = false; x0 = lx = e.clientX; y0 = e.clientY; lt = performance.now(); p0 = pos; v = 0;
    room.classList.add("is-dragging"); hint?.classList.add("is-gone"); stopAuto();
  });
  track.addEventListener("pointermove", (e) => {
    if (dragging && cards.length) {
      const unit = cards[0].offsetWidth * .8, dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - y0)) { moved = true; try { track.setPointerCapture(e.pointerId); } catch {} }
      if (!moved) return;
      const now = performance.now(); v = (e.clientX - lx) / Math.max(1, now - lt); lx = e.clientX; lt = now;
      pos = p0 - dx / unit; place(); return;
    }
    // 桌面：当前卡跟随鼠标倾斜 + 反光
    if (reduce || !matchMedia("(hover: hover)").matches) return;
    const c = track.querySelector(".gcard.is-on"); if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) { place(); return; }
    c.style.setProperty("--mx", px * 100 + "%"); c.style.setProperty("--my", py * 100 + "%");
    c.style.transform = `translateZ(40px) rotateY(${(px - .5) * 12}deg) rotateX(${(.5 - py) * 9}deg)`;
  });
  track.addEventListener("pointerleave", () => { if (!dragging) place(); });
  const end = (e) => {
    if (!dragging) return; dragging = false;
    if (!moved) {
      room.classList.remove("is-dragging");
      const c = e.target.closest?.(".gcard");
      if (!c || e.type === "pointercancel") return;
      if (Number(c.dataset.i) !== idx) go(Number(c.dataset.i)); else dockGo.click();
      return;
    }
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch {} }
    go(Math.round(pos - v * 2.2));
  };
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", (e) => { if (dragging && moved) end(e); else { dragging = false; room.classList.remove("is-dragging"); } });

  const roomVisible = () => room.getBoundingClientRect().bottom > 200;
  const modalOpen = () => !!document.querySelector("dialog[open]");
  addEventListener("keydown", (e) => {
    if (modalOpen() || !roomVisible() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) return;
    if (e.key === "ArrowRight") { stopAuto(); go(idx + 1); }
    if (e.key === "ArrowLeft") { stopAuto(); go(idx - 1); }
  });
  let rz = 0; addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(place); });

  // 自动轮播（首次交互后停止）
  let auto = reduce ? null : setInterval(() => { if (!document.hidden && !modalOpen() && roomVisible()) go(idx + 1); }, 5200);
  function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
  setTimeout(() => hint?.classList.add("is-gone"), 5200);

  // 首屏可见时隐藏原顶栏
  const body = document.body;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => body.classList.toggle("is-room-view", entry.isIntersecting), { rootMargin: "-90px 0px 0px 0px" }).observe(room);
  }
  body.classList.add("is-room-view");

  build(CATS.film ? "film" : Object.keys(CATS)[0], true);
})();
