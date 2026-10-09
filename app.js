(() => {
  "use strict";

  const copy = {
    zh: {
      navFilm: "电影",
      navSeries: "漫剧",
      navOriginals: "原创 IP",
      navAbout: "关于",
      navContact: "合作",
      ipStatusLabel: "原创 IP",
      ipStatusTitle: "原创 IP · 筹备中",
      ipStatusTagline: "一个正在生长的世界，敬请期待。",
      heroTitle: "一个人，也可以把故事做成电影。",
      heroSubtitle: "莊女士 ｜ AIGC 导演 · 原创 IP 创作者",
      about: "我是庄微 Elsa，深圳龙岗人。做了八年展馆和空间叙事，2026 年开始用 AI 拍片，创办了一灵视界。我相信 AI 不会替我做创作判断，但它让一个人也有机会把想象变成完整的作品。我想做的，是一个能慢慢长大、让人记住的 IP。",
      contact: "寻找制片、发行、IP 开发与联名的伙伴。",
      contactPlaceholder: "【待补充：对外公开用哪个邮箱/微信】",
      socialBilibili: "B站",
      icp: "【待补充：备案号】",
      comingSoon: "即将上线"
    },
    en: {
      navFilm: "Films",
      navSeries: "Series",
      navOriginals: "Originals",
      navAbout: "About",
      navContact: "Contact",
      ipStatusLabel: "Original IP",
      ipStatusTitle: "Original IP · In development",
      ipStatusTagline: "A world in the making. Coming soon.",
      heroTitle: "One creator. Stories made into films.",
      heroSubtitle: "Zhuang Wei (Elsa) | AIGC Director · Original IP Creator",
      about: "I'm Zhuang Wei (Elsa), from Longgang, Shenzhen. After eight years in spatial storytelling for museums and exhibitions, I began making films with AI in 2026 and founded Yiling Vision. AI doesn't make creative decisions for me — but it lets one person turn imagination into finished work. What I want to build is an IP that grows over time and stays with people.",
      contact: "Open to producers, distributors, and IP partners.",
      contactPlaceholder: "【待补充：对外公开用哪个邮箱/微信】",
      socialBilibili: "Bilibili",
      icp: "【待补充：备案号】",
      comingSoon: "Coming soon"
    }
  };

  const params = new URLSearchParams(window.location.search);
  const language = params.get("lang") === "en" ? "en" : "zh";
  const currentCopy = copy[language];
  const categoryLabels = {
    zh: { film: "电影", series: "漫剧", ip: "原创 IP", interactive: "互动作品" },
    en: { film: "Film", series: "Series", ip: "Original IP", interactive: "Interactive" }
  }[language];
  const works = Array.isArray(window.PORTFOLIO_DATA?.works) ? window.PORTFOLIO_DATA.works : [];
  let toastTimer = 0;

  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  if (document.body.classList.contains("ip-page")) {
    document.title = language === "en"
      ? `${currentCopy.ipStatusTitle} | Zhuang Wei`
      : `${currentCopy.ipStatusTitle}｜莊女士`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = currentCopy.ipStatusTagline;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = currentCopy.ipStatusTitle;
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = currentCopy.ipStatusTagline;
  } else if (!document.body.classList.contains("not-found-page")) {
    document.title = language === "en"
      ? "Zhuang Wei (Elsa) | AIGC Director · Original IP Creator"
      : "莊女士｜AIGC 导演 · 原创 IP 创作者";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = currentCopy.heroSubtitle;
  }

  document.querySelectorAll("[data-copy]").forEach((node) => {
    const key = node.dataset.copy;
    if (currentCopy[key]) node.textContent = currentCopy[key];
  });

  const languageSwitch = document.querySelector("[data-language-switch]");
  if (languageSwitch) {
    const nextUrl = new URL(window.location.href);
    if (language === "en") {
      nextUrl.searchParams.delete("lang");
      languageSwitch.textContent = "中";
    } else {
      nextUrl.searchParams.set("lang", "en");
      languageSwitch.textContent = "EN";
    }
    languageSwitch.href = nextUrl.href;
  }

  const localize = (value) => {
    if (!value || typeof value !== "object") return "【待补充】";
    return value[language] || "【待补充】";
  };

  const createElement = (tagName, className, text) => {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const createLaurelIcon = () => {
    const namespace = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(namespace, "svg");
    icon.setAttribute("class", "laurel-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", "M8.2 20.2C4.6 17.6 3 13.8 4 9.8M15.8 20.2c3.6-2.6 5.2-6.4 4.2-10.4M5.1 13.5 2.8 12M6.5 16.7l-2.6-.5M7 10.3 5.1 8.2M18.9 13.5l2.3-1.5M17.5 16.7l2.6-.5M17 10.3l1.9-2.1M9.5 21.3h5");
    icon.append(path);
    return icon;
  };

  const hasAwardHighlight = (value) => /入围|奖|榜/.test(value);

  const workDestination = (work) => {
    if (work.category === "interactive") return work.play_url || "";
    if (work.category === "ip") return "";
    return (language === "en" ? work.link_global : work.link_cn) || "";
  };

  const showComingSoon = () => {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = currentCopy.comingSoon;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  };

  const buildWorkShell = (work, cardClass, index) => {
    const article = createElement("article", `${cardClass} reveal`);
    const destination = workDestination(work);
    const link = createElement(destination ? "a" : "button", "work-link");
    const isIpInDevelopment = work.category === "ip";
    const title = isIpInDevelopment ? currentCopy.ipStatusTitle : localize(work.title);
    const englishTitle = isIpInDevelopment
      ? ""
      : (work.title && typeof work.title === "object" ? work.title.en : "");
    const highlight = isIpInDevelopment ? currentCopy.ipStatusTagline : localize(work.highlight);

    article.style.setProperty("--orb-offset", `${-10 + (index % 4) * 3}%`);
    if (destination) {
      link.href = destination;
      if (work.category !== "ip") {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    } else {
      link.type = "button";
      link.addEventListener("click", showComingSoon);
    }
    link.setAttribute("aria-label", title);

    const visual = createElement("div", "work-visual");
    if (work.cover) {
      const image = createElement("img");
      image.src = String(work.cover).replaceAll("\\", "/");
      image.alt = title;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => image.remove(), { once: true });
      visual.append(image);
    }
    visual.append(createElement("span", "work-ghost-title", title));

    const meta = createElement("div", "work-meta");
    const titleGroup = createElement("div", "work-title-group");
    titleGroup.append(createElement("h3", "work-title", title));
    if (englishTitle && englishTitle !== title) {
      titleGroup.append(createElement("p", "work-title-en", englishTitle));
    }

    if (cardClass === "film-card") {
      const facts = createElement("dl", "work-facts");
      const appendFact = (label, value, className = "") => {
        const row = createElement("div", `work-fact${className ? ` ${className}` : ""}`);
        row.append(createElement("dt", "work-fact__label", label));
        const description = createElement("dd", "work-fact__value");
        if (value instanceof Node) description.append(value);
        else description.textContent = value;
        row.append(description);
        facts.append(row);
      };
      appendFact("YEAR", work.year || "【待补充】");
      appendFact("CATEGORY", categoryLabels[work.category] || work.category || "【待补充】");
      const highlightContent = createElement("span", "work-highlight-text");
      if (hasAwardHighlight(work.highlight?.zh || "")) highlightContent.append(createLaurelIcon());
      highlightContent.append(document.createTextNode(highlight));
      appendFact("HIGHLIGHT", highlightContent, "work-fact--highlight");
      meta.append(titleGroup, facts);
    } else {
      if (!isIpInDevelopment) {
        titleGroup.prepend(createElement("p", "work-year", work.year || "【待补充】"));
      }
      const highlightNode = createElement("p", "work-highlight");
      if (hasAwardHighlight(work.highlight?.zh || "")) highlightNode.append(createLaurelIcon());
      highlightNode.append(document.createTextNode(highlight));
      meta.append(titleGroup, highlightNode);
    }
    link.append(visual, meta);
    article.append(link);
    return article;
  };

  const filmList = document.querySelector("[data-film-list]");
  works.filter((work) => work.category === "film").forEach((work, index) => {
    filmList?.append(buildWorkShell(work, "film-card", index));
  });

  const seriesGrid = document.querySelector("[data-series-grid]");
  works.filter((work) => work.category === "series").forEach((work, index) => {
    seriesGrid?.append(buildWorkShell(work, "series-card", index));
  });

  const ipFeature = document.querySelector("[data-ip-feature]");
  works.filter((work) => work.category === "ip").forEach((work, index) => {
    ipFeature?.append(buildWorkShell(work, "ip-card", index));
  });

  const interactiveGrid = document.querySelector("[data-interactive-grid]");
  works.filter((work) => work.category === "interactive").forEach((work, index) => {
    interactiveGrid?.append(buildWorkShell(work, "interactive-card", index));
  });

  const hero = document.querySelector(".hero");
  const heroVideo = document.querySelector(".hero__video");
  if (window.PORTFOLIO_META?.heroVideo && hero && heroVideo) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncHeroPlayback = () => {
      if (reducedMotion.matches) {
        heroVideo.pause();
        return;
      }
      heroVideo.play().catch(() => {});
    };
    heroVideo.addEventListener("canplay", () => hero.classList.add("is-video-ready"), { once: true });
    heroVideo.src = "assets/hero.mp4";
    syncHeroPlayback();
    reducedMotion.addEventListener?.("change", syncHeroPlayback);
  }

  const revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealNodes.forEach((node) => revealObserver.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  const header = document.querySelector(".site-header");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (language === "en" && (document.body.classList.contains("ip-page") || document.body.classList.contains("not-found-page"))) {
    document.querySelectorAll('a[href^="index.html"]').forEach((link) => {
      const target = new URL(link.getAttribute("href"), window.location.href);
      target.searchParams.set("lang", "en");
      link.href = target.href;
    });
  }
})();
