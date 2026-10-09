(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const language = params.get("lang") === "en" ? "en" : "zh";
  const requestedId = params.get("id") || "xxx";
  const ipRecords = window.IP_DATA && typeof window.IP_DATA === "object" ? window.IP_DATA : {};
  const ip = ipRecords[requestedId] || ipRecords.xxx || {
    id: requestedId,
    name: {},
    tagline: {},
    world: [],
    characters: [],
    work_ids: [],
    visual_style: { palette: [], keyframes: [] }
  };
  const works = Array.isArray(window.PORTFOLIO_DATA?.works) ? window.PORTFOLIO_DATA.works : [];
  const labels = {
    zh: {
      original: "原创 IP",
      world: "世界观",
      characters: "角色",
      works: "作品",
      visual: "视觉风格",
      missing: "【待补充】",
      missingWorld: "【待补充：世界观】",
      missingCharacter: "【待补充：角色】",
      missingWork: "【待补充：关联作品】",
      missingColor: "【待补充：色板】",
      missingKeyframe: "【待补充：关键帧】",
      comingSoon: "即将上线"
    },
    en: {
      original: "Originals",
      world: "World",
      characters: "Characters",
      works: "Works",
      visual: "Visual Style",
      missing: "【待补充】",
      missingWorld: "【待补充】",
      missingCharacter: "【待补充】",
      missingWork: "【待补充】",
      missingColor: "【待补充】",
      missingKeyframe: "【待补充】",
      comingSoon: "Coming soon"
    }
  };
  const currentLabels = labels[language];
  const fallbackSwatches = [
    "linear-gradient(145deg, rgba(200, 164, 106, 0.42), rgba(9, 9, 8, 0.98))",
    "linear-gradient(145deg, rgba(242, 237, 227, 0.28), rgba(9, 9, 8, 0.98))",
    "linear-gradient(145deg, rgba(200, 164, 106, 0.12), rgba(242, 237, 227, 0.12))",
    "linear-gradient(145deg, rgba(242, 237, 227, 0.08), rgba(9, 9, 8, 0.98))"
  ];
  let toastTimer = 0;

  const localize = (value, fallback = currentLabels.missing) => {
    const localized = value && typeof value === "object" ? value[language] : "";
    return typeof localized === "string" && localized.trim() ? localized : fallback;
  };

  const createElement = (tagName, className, text) => {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const addImage = (container, source, alt) => {
    if (!source) return;
    const image = createElement("img");
    image.src = String(source).replaceAll("\\", "/");
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("load", () => container.classList.add("has-image"), { once: true });
    image.addEventListener("error", () => image.remove(), { once: true });
    container.append(image);
  };

  const makeMediaFrame = (source, label, index, className = "media-frame") => {
    const frame = createElement("div", className);
    frame.append(
      createElement("span", "media-frame__number", String(index + 1).padStart(2, "0")),
      createElement("span", "media-frame__label", label)
    );
    addImage(frame, source, label);
    return frame;
  };

  const workDestination = (work) => {
    if (work.category === "interactive") return work.play_url || "";
    if (work.category === "ip") return work.ip_page || "";
    return (language === "en" ? work.link_global : work.link_cn) || "";
  };

  const showComingSoon = () => {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = currentLabels.comingSoon;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  };

  document.querySelectorAll("[data-ip-copy]").forEach((node) => {
    const value = currentLabels[node.dataset.ipCopy];
    if (value) node.textContent = value;
  });

  const ipName = localize(ip.name, currentLabels.missing);
  const ipTagline = localize(ip.tagline, currentLabels.missing);
  const titleNode = document.querySelector("[data-ip-name]");
  const taglineNode = document.querySelector("[data-ip-tagline]");
  if (titleNode) titleNode.textContent = ipName;
  if (taglineNode) taglineNode.textContent = ipTagline;
  document.title = `${ipName}｜莊女士`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = ipTagline;

  const heroMedia = document.querySelector("[data-ip-hero-media]");
  if (heroMedia) {
    heroMedia.append(createElement("span", "ip-hero__ghost", ipName));
    addImage(heroMedia, ip.hero, ipName);
  }

  const worldEntries = Array.isArray(ip.world) && ip.world.length
    ? ip.world
    : [{ id: "world-placeholder", text: {}, image: "" }];
  const worldList = document.querySelector("[data-world-list]");
  worldEntries.forEach((entry, index) => {
    const article = createElement("article", "world-entry reveal");
    const text = localize(entry.text, currentLabels.missingWorld);
    article.append(
      makeMediaFrame(entry.image, text, index, "media-frame world-entry__media"),
      createElement("p", "world-entry__copy", text)
    );
    worldList?.append(article);
  });

  const characterEntries = Array.isArray(ip.characters) && ip.characters.length
    ? ip.characters
    : [{ id: "character-placeholder", name: {}, quote: {}, description: {}, image: "" }];
  const characterGrid = document.querySelector("[data-character-grid]");
  characterEntries.forEach((character, index) => {
    const details = createElement("details", "character-card reveal");
    const summary = createElement("summary", "character-card__summary");
    const name = localize(character.name, currentLabels.missingCharacter);
    const quote = localize(character.quote);
    const descriptionText = localize(character.description);
    const characterMedia = makeMediaFrame(character.image, name, index, "media-frame character-card__media");
    const text = createElement("div", "character-card__text");
    text.append(
      createElement("h3", "character-card__name", name),
      createElement("p", "character-card__quote", quote)
    );
    summary.append(characterMedia, text);
    details.append(summary, createElement("p", "character-card__description", descriptionText));
    characterGrid?.append(details);
  });

  const relatedGrid = document.querySelector("[data-related-grid]");
  const relatedWorks = (Array.isArray(ip.work_ids) ? ip.work_ids : [])
    .map((id) => works.find((work) => work.id === id))
    .filter(Boolean);
  if (!relatedWorks.length) {
    const placeholder = createElement("article", "related-card related-card--empty reveal");
    placeholder.append(
      makeMediaFrame("", localize(ip.empty_work, currentLabels.missingWork), 0, "media-frame related-card__media"),
      createElement("h3", "related-card__title", localize(ip.empty_work, currentLabels.missingWork))
    );
    relatedGrid?.append(placeholder);
  } else {
    relatedWorks.forEach((work, index) => {
      const destination = workDestination(work);
      const wrapper = createElement(destination ? "a" : "button", "related-card reveal");
      const title = localize(work.title);
      if (destination) {
        wrapper.href = destination;
        wrapper.target = "_blank";
        wrapper.rel = "noopener noreferrer";
      } else {
        wrapper.type = "button";
        wrapper.addEventListener("click", showComingSoon);
      }
      wrapper.append(
        makeMediaFrame(work.cover, title, index, "media-frame related-card__media"),
        createElement("p", "work-year", work.year || currentLabels.missing),
        createElement("h3", "related-card__title", title),
        createElement("p", "related-card__highlight", localize(work.highlight))
      );
      relatedGrid?.append(wrapper);
    });
  }

  const paletteEntries = Array.isArray(ip.visual_style?.palette) && ip.visual_style.palette.length
    ? ip.visual_style.palette
    : [{ id: "color-placeholder", name: {}, hex: "" }];
  const palette = document.querySelector("[data-palette]");
  paletteEntries.forEach((color, index) => {
    const item = createElement("div", "swatch reveal");
    const chip = createElement("div", "swatch__color");
    const isHex = /^#[0-9a-f]{6}$/i.test(color.hex || "");
    chip.style.background = isHex ? color.hex : fallbackSwatches[index % fallbackSwatches.length];
    if (!isHex) chip.classList.add("is-placeholder");
    const name = localize(color.name, currentLabels.missingColor);
    item.append(
      chip,
      createElement("span", "swatch__name", name),
      createElement("span", "swatch__hex", isHex ? color.hex.toUpperCase() : currentLabels.missing)
    );
    palette?.append(item);
  });

  const keyframeEntries = Array.isArray(ip.visual_style?.keyframes) && ip.visual_style.keyframes.length
    ? ip.visual_style.keyframes
    : [{ id: "keyframe-placeholder", image: "", caption: {} }];
  const keyframeGrid = document.querySelector("[data-keyframe-grid]");
  keyframeEntries.forEach((frame, index) => {
    const figure = createElement("figure", "keyframe reveal");
    const caption = localize(frame.caption, currentLabels.missingKeyframe);
    figure.append(
      makeMediaFrame(frame.image, caption, index, "media-frame keyframe__media"),
      createElement("figcaption", "keyframe__caption", caption)
    );
    keyframeGrid?.append(figure);
  });
})();
