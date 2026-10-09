(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const language = params.get("lang") === "en" ? "en" : "zh";
  const defaultId = "dengrong-gutuan";
  const requestedId = params.get("id") || defaultId;
  const ipRecords = window.IP_DATA && typeof window.IP_DATA === "object" ? window.IP_DATA : {};
  const ip = ipRecords[requestedId] || ipRecords[defaultId];
  if (!ip) return;

  const labels = {
    zh: {
      original: "原创 IP",
      world: "世界观",
      characters: "角色",
      visual: "视觉风格",
      palette: "色板",
      keyframes: "关键帧",
      pictureBook: "原创绘本",
      viewImage: "全屏查看",
      closeImage: "关闭大图",
      previousImage: "上一张",
      nextImage: "下一张"
    },
    en: {
      original: "Original IP",
      world: "World",
      characters: "Characters",
      visual: "Visual Style",
      palette: "Palette",
      keyframes: "Keyframes",
      pictureBook: "Picture Book",
      viewImage: "View fullscreen",
      closeImage: "Close image",
      previousImage: "Previous image",
      nextImage: "Next image"
    }
  };
  const currentLabels = labels[language];
  const localize = (value, fallback = "") => {
    if (!value || typeof value !== "object") return fallback;
    const localized = value[language];
    if (typeof localized === "string" && localized.trim()) return localized;
    const alternate = language === "en" ? value.zh : value.en;
    return typeof alternate === "string" ? alternate : fallback;
  };
  const createElement = (tagName, className, text) => {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const normalizeSource = (source) => String(source || "").replaceAll("\\", "/");
  const addWatermark = (container) => {
    const watermark = createElement("span", "ip-watermark", "© 莊女士");
    watermark.dataset.ipWatermark = "";
    watermark.setAttribute("aria-hidden", "true");
    container.append(watermark);
  };
  const addImage = (container, source, alt, { priority = false } = {}) => {
    if (!source) return null;
    const image = createElement("img", "ip-art-image");
    image.src = normalizeSource(source);
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;
    if (priority) image.setAttribute("fetchpriority", "high");
    image.addEventListener("contextmenu", (event) => event.preventDefault());
    image.addEventListener("load", () => container.classList.add("has-image"), { once: true });
    image.addEventListener("error", () => container.classList.add("has-image-error"), { once: true });
    container.append(image);
    addWatermark(container);
    return image;
  };
  const makeMediaFrame = (source, alt, className) => {
    const frame = createElement("div", `ip-media ${className}`);
    addImage(frame, source, alt);
    return frame;
  };
  const setMetaContent = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.content = value;
  };

  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  document.querySelectorAll("[data-ip-copy]").forEach((node) => {
    const value = currentLabels[node.dataset.ipCopy];
    if (value) node.textContent = value;
  });

  const ipName = localize(ip.name);
  const ipTagline = localize(ip.tagline);
  const bookTitle = localize(ip.book?.title);
  const titleNode = document.querySelector("[data-ip-name]");
  const taglineNode = document.querySelector("[data-ip-tagline]");
  const heroBookNode = document.querySelector("[data-ip-hero-book]");
  if (titleNode) titleNode.textContent = ipName;
  if (taglineNode) taglineNode.textContent = ipTagline;
  if (heroBookNode) heroBookNode.textContent = bookTitle;

  const canonicalUrl = `https://zero-vis.cn/ip.html?id=${encodeURIComponent(ip.id)}`;
  const pageUrl = language === "en" ? `${canonicalUrl}&lang=en` : canonicalUrl;
  const pageTitle = language === "en" ? `${ipName} | Zhuang Wei` : `${ipName}｜莊女士`;
  document.title = pageTitle;
  setMetaContent('meta[name="description"]', `${ipTagline} ${bookTitle}`.trim());
  setMetaContent('meta[property="og:title"]', pageTitle);
  setMetaContent('meta[property="og:description"]', ipTagline);
  setMetaContent('meta[property="og:locale"]', language === "en" ? "en_US" : "zh_CN");
  setMetaContent('meta[property="og:url"]', pageUrl);
  setMetaContent('meta[property="og:image:alt"]', ipName);
  setMetaContent('meta[name="twitter:title"]', pageTitle);
  setMetaContent('meta[name="twitter:description"]', ipTagline);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = pageUrl;

  const heroMedia = document.querySelector("[data-ip-hero-media]");
  if (heroMedia && ip.hero) {
    const heroSource = normalizeSource(ip.hero);
    heroMedia.style.setProperty("--ip-hero-art", `url("${heroSource.replaceAll('"', "%22")}")`);
    addImage(heroMedia, heroSource, localize(ip.hero_text, ipName), { priority: true });
  }

  const worldList = document.querySelector("[data-world-list]");
  worldList?.replaceChildren();
  (Array.isArray(ip.world) ? ip.world : []).forEach((entry, index) => {
    const text = localize(entry.text);
    const article = createElement("article", "world-entry reveal");
    const copy = createElement("p", "world-entry__copy", text);
    copy.dataset.index = String(index + 1).padStart(2, "0");
    article.append(
      makeMediaFrame(entry.image, text, "world-entry__media"),
      copy
    );
    worldList?.append(article);
  });

  const characterGrid = document.querySelector("[data-character-grid]");
  characterGrid?.replaceChildren();
  (Array.isArray(ip.characters) ? ip.characters : []).forEach((character) => {
    const name = localize(character.name);
    const quote = localize(character.quote);
    const description = localize(character.description);
    const article = createElement("article", "character-card reveal");
    const body = createElement("div", "character-card__body");
    body.append(
      createElement("h3", "character-card__name", name),
      createElement("blockquote", "character-card__quote", `“${quote}”`),
      createElement("p", "character-card__description", description)
    );
    article.append(
      makeMediaFrame(character.image, name, "character-card__media"),
      body
    );
    characterGrid?.append(article);
  });

  const palette = document.querySelector("[data-palette]");
  palette?.replaceChildren();
  (Array.isArray(ip.visual_style?.palette) ? ip.visual_style.palette : []).forEach((color) => {
    const item = createElement("div", "swatch reveal");
    const chip = createElement("div", "swatch__color");
    chip.style.backgroundColor = color.hex;
    chip.setAttribute("aria-hidden", "true");
    item.append(
      chip,
      createElement("span", "swatch__name", localize(color.name)),
      createElement("span", "swatch__hex", String(color.hex || "").toUpperCase())
    );
    palette?.append(item);
  });

  const keyframes = Array.isArray(ip.visual_style?.keyframes) ? ip.visual_style.keyframes : [];
  const keyframeGrid = document.querySelector("[data-keyframe-grid]");
  keyframeGrid?.replaceChildren();

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxMedia = document.querySelector("[data-lightbox-media]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");
  const lightboxCount = document.querySelector("[data-lightbox-count]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");
  const lightboxPrevious = document.querySelector("[data-lightbox-prev]");
  const lightboxNext = document.querySelector("[data-lightbox-next]");
  let activeFrameIndex = 0;
  let activeFrameTrigger = null;

  const renderLightbox = () => {
    const frame = keyframes[activeFrameIndex];
    if (!frame || !lightboxMedia) return;
    const caption = localize(frame.caption);
    lightboxMedia.replaceChildren();
    addImage(lightboxMedia, frame.image, caption);
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxCount) lightboxCount.textContent = `${activeFrameIndex + 1} / ${keyframes.length}`;
  };
  const stepLightbox = (direction) => {
    if (!keyframes.length) return;
    activeFrameIndex = (activeFrameIndex + direction + keyframes.length) % keyframes.length;
    renderLightbox();
  };
  const clearLightbox = () => {
    lightboxMedia?.replaceChildren();
    document.body.classList.remove("is-ip-lightbox-open");
    const trigger = activeFrameTrigger;
    activeFrameTrigger = null;
    trigger?.focus({ preventScroll: true });
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    if (typeof lightbox.close === "function" && lightbox.open) lightbox.close();
    else {
      lightbox.removeAttribute("open");
      clearLightbox();
    }
  };
  const openLightbox = (index, trigger) => {
    if (!lightbox || !keyframes.length) return;
    activeFrameIndex = index;
    activeFrameTrigger = trigger;
    renderLightbox();
    document.body.classList.add("is-ip-lightbox-open");
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else lightbox.setAttribute("open", "");
    lightboxClose?.focus({ preventScroll: true });
  };

  lightboxClose?.setAttribute("aria-label", currentLabels.closeImage);
  lightboxPrevious?.setAttribute("aria-label", currentLabels.previousImage);
  lightboxNext?.setAttribute("aria-label", currentLabels.nextImage);
  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxPrevious?.addEventListener("click", () => stepLightbox(-1));
  lightboxNext?.addEventListener("click", () => stepLightbox(1));
  lightbox?.addEventListener("close", clearLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepLightbox(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepLightbox(1);
    }
  });

  keyframes.forEach((frame, index) => {
    const caption = localize(frame.caption);
    const figure = createElement("figure", "keyframe reveal");
    const button = createElement("button", "keyframe__button");
    button.type = "button";
    button.setAttribute("aria-label", `${currentLabels.viewImage}: ${caption}`);
    button.append(makeMediaFrame(frame.image, caption, "keyframe__media"));
    button.addEventListener("click", () => openLightbox(index, button));
    figure.append(button, createElement("figcaption", "keyframe__caption", caption));
    keyframeGrid?.append(figure);
  });

  const bookSection = document.querySelector("[data-book-section]");
  const bookTitleNode = document.querySelector("[data-book-title]");
  const bookMetaNode = document.querySelector("[data-book-meta]");
  const bookEnding = document.querySelector("[data-book-ending]");
  if (!ip.book) {
    bookSection?.remove();
  } else {
    if (bookTitleNode) bookTitleNode.textContent = bookTitle;
    if (bookMetaNode) bookMetaNode.textContent = localize(ip.book.meta);
    if (bookEnding && ip.book.ending) {
      const endingText = localize(ip.book.ending.text);
      bookEnding.replaceChildren(
        makeMediaFrame(ip.book.ending.image, endingText, "book-ending__media"),
        createElement("figcaption", "book-ending__caption", endingText)
      );
    }
  }
})();
