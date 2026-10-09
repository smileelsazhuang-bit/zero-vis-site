(() => {
  "use strict";

  const copy = {
    zh: {
      navFilm: "电影",
      navSeries: "漫剧",
      navOriginals: "原创 IP",
      navGames: "游戏",
      navAboutContact: "关于 · 合作",
      navAbout: "关于",
      navContact: "合作",
      heroTitle: "一个人，也可以把故事做成电影。",
      heroTitleLine1: "一个人，",
      heroTitleLine2: "也可以把故事",
      heroTitleLine3: "做成电影。",
      heroEnglish: "One creator. Stories made into films.",
      heroSubtitle: "莊女士 ｜ AIGC 导演 · 原创 IP 创作者",
      filmLede: "用 AI 完成编剧、导演、画面与配乐的短片作品。",
      seriesLede: "长篇 AIGC 漫剧，点开海报扫码或跳转抖音观看。",
      gamesLede: "可以直接在网页里玩的叙事游戏。",
      pillarsLabel: "作品方向",
      ipName: "灯绒与菇团",
      ipTagline: "今天也有小魔法。",
      ipBody: "灯绒常先看见可能，菇团常先动手试试。一只带着暖灯的月蛾，和一位戴着歪尖蘑菇帽的森林小伙伴，把普通日子过得有趣。",
      dengrongName: "灯绒",
      dengrongQuote: "「你看，这里亮了一点。」",
      gutuanName: "菇团",
      gutuanQuote: "「来，种点好玩的。」",
      ipMeta: "原创绘本《今天也有小魔法》 · 180 幅画面",
      ipButton: "进入 IP 世界 →",
      featured: "FEATURED",
      production: "制作中",
      playNow: "开始游玩 →",
      about: "我是庄微 Elsa，深圳龙岗人。做了八年展馆和空间叙事，2026 年开始用 AI 拍片，创办了一灵视界。我相信 AI 不会替我做创作判断，但它让一个人也有机会把想象变成完整的作品。我想做的，是一个能慢慢长大、让人记住的 IP。",
      contact: "寻找制片、发行、IP 开发与联名的伙伴。",
      studioLabel: "一灵视界 · 公司",
      studioIntro: "一灵视界（深圳）文化科技有限公司是一家入驻深圳龙岗风行OPC-AIGC产业园的OPC-AIGC内容公司，以“一人核心+AI工作流+项目制协作”模式，专注AIGC影视化、展馆数字化与AI工业化生产。",
      studioQuote: "从创意到成片，从空间到屏幕，从IP到爆款。",
      studioServicesLead: "核心业务包括",
      studioServiceContentTitle: "AIGC 内容制作",
      studioServiceContent: "AIGC漫剧、短剧、AI电影、AIMV、广告宣传片、数字人及互动内容的策划、生成与全流程制作；",
      studioServiceWorkflowTitle: "AIGC 工作流",
      studioServiceWorkflow: "AIGC内容工作台与创作工作流搭建、迭代和咨询；",
      studioServiceExhibitionTitle: "展馆与文旅多媒体",
      studioServiceExhibition: "城市展馆、企业展厅、文旅项目、光影秀的多媒体策划设计与影片制作。",
      studioClosing: "公司以“叙事”与“体验”为内核，坚持用AI放大想象力，面向城市、企业、平台与IP方提供从策划、设计、制作到AIGC工作流落地的全流程服务，做“一人成片”时代的OPC内容探路者。",
      contactNameLabel: "称呼",
      contactName: "莊微 Elsa",
      contactEmailLabel: "邮箱",
      contactEmailAria: "发送邮件",
      contactCopy: "复制",
      contactCopied: "已复制",
      contactCopyFailed: "复制失败",
      contactQrLabel: "联系方式二维码",
      socialBilibili: "B站",
      socialEmail: "邮箱",
      footerLinksLabel: "社交与邮箱链接",
      qrWechatAlt: "微信二维码：莊微 Elsa",
      qrWechatCaption: "微信二维码：莊微 Elsa",
      qrWechatOpen: "放大微信二维码",
      qrDouyinAlt: "抖音二维码：@零的漫剧",
      qrDouyinCaption: "抖音二维码：@零的漫剧",
      qrDouyinOpen: "放大抖音二维码",
      qrXiaohongshuAlt: "小红书二维码：宇宙手记",
      qrXiaohongshuCaption: "小红书二维码：宇宙手记",
      qrXiaohongshuOpen: "放大小红书二维码",
      qrXiaohongshuLink: "打开小红书 ↗",
      qrBilibiliAlt: "B 站二维码：莊女士啊",
      qrBilibiliCaption: "B 站二维码：莊女士啊",
      qrBilibiliOpen: "放大 B 站二维码",
      qrBilibiliLink: "打开 B 站 ↗",
      qrClose: "关闭二维码",
      icp: "【待补充：备案号】",
      comingSoon: "即将上线",
      videoClose: "关闭播放器",
      videoWatch: "在 B 站观看 ↗",
      videoFrameTitle: "B 站播放器",
      douyinWatch: "抖音观看 ↗",
      douyinPanelLabel: "观看方式",
      douyinClose: "关闭观看方式",
      douyinQrLabel: "打开抖音扫一扫",
      douyinOpen: "打开抖音 ↗",
      douyinOpenWeb: "在网页打开 ↗",
      douyinCopy: "复制链接",
      douyinCopied: "已复制，打开抖音 App 即可识别",
      douyinCopyFallback: "链接已选中，请手动复制",
      douyinCopyValueLabel: "抖音分享链接",
      douyinWechatTip: "微信内无法直接打开抖音，可长按识别二维码、复制链接，或点右上角 ··· 选择在浏览器打开",
      seasonOne: "第一季 ↗",
      seasonTwo: "第二季 ↗",
      seasonOneName: "第一季",
      seasonTwoName: "第二季"
    },
    en: {
      navFilm: "Films",
      navSeries: "Series",
      navOriginals: "Originals",
      navGames: "Games",
      navAboutContact: "About · Contact",
      navAbout: "About",
      navContact: "Contact",
      heroTitle: "One creator. Stories made into films.",
      heroTitleLine1: "One creator.",
      heroTitleLine2: "Stories made",
      heroTitleLine3: "into films.",
      heroEnglish: "One creator. Stories made into films.",
      heroSubtitle: "Zhuang Wei (Elsa) | AIGC Director · Original IP Creator",
      filmLede: "Short films written, directed, rendered and scored with AI.",
      seriesLede: "Long-form AIGC series — tap a poster to scan or watch on Douyin.",
      gamesLede: "Story games you can play right in the browser.",
      pillarsLabel: "Creative directions",
      ipName: "Dengrong & Gutuan",
      ipTagline: "A little magic, every day.",
      ipBody: "Dengrong is often the first to spot a possibility; Gutuan is often the first to try it. A moon moth with a warm lantern and a forest friend in a crooked mushroom cap, making ordinary days more fun.",
      dengrongName: "Dengrong",
      dengrongQuote: ": “Look, it's a little brighter here.”",
      gutuanName: "Gutuan",
      gutuanQuote: ": “Come on, let's grow something fun.”",
      ipMeta: "Picture book Today, a Little Magic · 180 illustrations",
      ipButton: "Enter the world →",
      featured: "FEATURED",
      production: "In production",
      playNow: "Play now →",
      about: "I'm Zhuang Wei (Elsa), from Longgang, Shenzhen. After eight years in spatial storytelling for museums and exhibitions, I began making films with AI in 2026 and founded Yiling Vision. AI doesn't make creative decisions for me — but it lets one person turn imagination into finished work. What I want to build is an IP that grows over time and stays with people.",
      contact: "Open to producers, distributors, and IP partners.",
      studioLabel: "The Studio",
      studioIntro: "Yiling Vision (Shenzhen) Culture & Technology Co., Ltd. is an OPC-AIGC content company based in the Fengxing OPC-AIGC Industrial Park in Longgang, Shenzhen. Working on a \"one core creator + AI workflow + project-based collaboration\" model, it focuses on AIGC filmmaking, digital exhibitions and industrialized AI production.",
      studioQuote: "From idea to final cut, from space to screen, from IP to hit.",
      studioServicesLead: "Core services include",
      studioServiceContentTitle: "AIGC Content Production",
      studioServiceContent: "planning, generation and end-to-end production of AIGC dramas, short series, AI films, AI music videos, commercials, digital humans and interactive content;",
      studioServiceWorkflowTitle: "AIGC Workflows",
      studioServiceWorkflow: "building, iterating and consulting on AIGC content workstations and creative workflows;",
      studioServiceExhibitionTitle: "Exhibitions & Cultural Tourism",
      studioServiceExhibition: "and multimedia planning, design and film production for city museums, corporate showrooms, cultural-tourism projects and light shows.",
      studioClosing: "With storytelling and experience at its core, the studio uses AI to amplify imagination, offering cities, enterprises, platforms and IP owners full-service support from planning, design and production to AIGC workflow deployment — an OPC pathfinder for the age of the one-person film.",
      contactNameLabel: "Name",
      contactName: "Zhuang Wei (Elsa)",
      contactEmailLabel: "Email",
      contactEmailAria: "Send email",
      contactCopy: "Copy",
      contactCopied: "Copied",
      contactCopyFailed: "Copy failed",
      contactQrLabel: "Contact QR codes",
      socialBilibili: "Bilibili",
      socialEmail: "Email",
      footerLinksLabel: "Social and email links",
      qrWechatAlt: "WeChat QR code: Zhuang Wei (Elsa)",
      qrWechatCaption: "WeChat QR code: Zhuang Wei (Elsa)",
      qrWechatOpen: "Enlarge WeChat QR code",
      qrDouyinAlt: "Douyin QR code: @零的漫剧",
      qrDouyinCaption: "Douyin QR code: @零的漫剧",
      qrDouyinOpen: "Enlarge Douyin QR code",
      qrXiaohongshuAlt: "Xiaohongshu QR code: 宇宙手记",
      qrXiaohongshuCaption: "Xiaohongshu QR code: 宇宙手记",
      qrXiaohongshuOpen: "Enlarge Xiaohongshu QR code",
      qrXiaohongshuLink: "Open Xiaohongshu ↗",
      qrBilibiliAlt: "Bilibili QR code: 莊女士啊",
      qrBilibiliCaption: "Bilibili QR code: 莊女士啊",
      qrBilibiliOpen: "Enlarge Bilibili QR code",
      qrBilibiliLink: "Open Bilibili ↗",
      qrClose: "Close QR code",
      icp: "【待补充：备案号】",
      comingSoon: "Coming soon",
      videoClose: "Close player",
      videoWatch: "Watch on Bilibili ↗",
      videoFrameTitle: "Bilibili player",
      douyinWatch: "Watch on Douyin ↗",
      douyinPanelLabel: "Ways to watch",
      douyinClose: "Close viewing options",
      douyinQrLabel: "Scan with Douyin",
      douyinOpen: "Open in Douyin ↗",
      douyinOpenWeb: "Open on web ↗",
      douyinCopy: "Copy link",
      douyinCopied: "Copied. Open Douyin to use the link.",
      douyinCopyFallback: "Link selected. Copy it manually.",
      douyinCopyValueLabel: "Douyin share link",
      douyinWechatTip: "Douyin cannot open directly inside WeChat. Press and hold the QR code, copy the link, or tap ··· in the top-right corner and open it in your browser.",
      seasonOne: "Season 1 ↗",
      seasonTwo: "Season 2 ↗",
      seasonOneName: "Season 1",
      seasonTwoName: "Season 2"
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
  let contactCopyTimer = 0;
  let activeVideoTrigger = null;
  let activeDouyinTrigger = null;
  let activeQrTrigger = null;

  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  if (!document.body.classList.contains("ip-page") && !document.body.classList.contains("not-found-page")) {
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

  document.querySelectorAll("[data-copy-alt]").forEach((node) => {
    const value = currentCopy[node.dataset.copyAlt];
    if (value) node.setAttribute("alt", value);
  });

  document.querySelectorAll("[data-copy-aria]").forEach((node) => {
    const value = currentCopy[node.dataset.copyAria];
    if (value) node.setAttribute("aria-label", value);
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

  const awardEntries = language === "en"
    ? [
        ["FILM FESTIVAL", "Selected, 2026 Beijing International Film Festival × Baidu AIGC League"],
        ["HACKATHON", "2nd Aranya Wave Film Festival Hackathon"],
        ["AIMV", "AI music video | Second Prize, Waka Awards (Longgang)"],
        ["SERIES", "More than ten AIGC series; The Fragile Beauty Who Flirts with the Boss reached #1 on the new suspense drama chart; Eggy King of the Stars entered the Douyin Future Drama Chart Top 30"]
      ]
    : [
        ["FILM FESTIVAL", "《解限 0.03%》入围 2026 北京国际电影节百度 AIGC 未来创作联赛"],
        ["HACKATHON", "入围第二届阿那亚海浪电影节黑客松"],
        ["AIMV", "AIMV《星河落在龙岗》瓦卡奖龙岗赛区二等奖"],
        ["SERIES", "十余部 AIGC 漫剧；《病美人在无限游戏里撩 BOSS》悬疑类漫剧新剧榜一；《星际蛋仔王》抖音短剧未来榜 Top30"]
      ];

  const awardsStrip = document.querySelector("[data-awards-strip]");
  if (awardsStrip) {
    const list = createElement("ul", "hero__awards");
    awardEntries.forEach(([label, value]) => {
      const item = document.createElement("li");
      item.append(createElement("b", "", label), document.createTextNode(value));
      list.append(item);
    });
    awardsStrip.replaceChildren(list);
    awardsStrip.setAttribute("aria-label", language === "en" ? "Selected achievements" : "已有成绩");
  }

  document.querySelectorAll("[data-count]").forEach((node) => {
    const category = node.dataset.count;
    const count = works.filter((work) => work.category === category).length;
    const number = String(count).padStart(2, "0");
    node.textContent = language === "en"
      ? `${number} works`
      : `${number} ${category === "interactive" ? "个作品" : "部作品"}`;
  });

  const ipEntry = document.querySelector("[data-ip-entry]");
  if (ipEntry && language === "en") {
    const target = new URL(ipEntry.getAttribute("href"), window.location.href);
    target.searchParams.set("lang", "en");
    ipEntry.href = target.href;
  }

  const ipMeta = document.querySelector("[data-ip-meta]");
  if (ipMeta && language === "en") {
    const title = createElement("em", "", "Today, a Little Magic");
    ipMeta.replaceChildren(
      document.createTextNode("Picture book "),
      title,
      document.createTextNode(" · 180 illustrations")
    );
  }

  const copyPlainText = async (value) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // Fall through to the selection-based copy path.
      }
    }

    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.inset = "0 auto auto -9999px";
    document.body.append(field);
    field.select();
    field.setSelectionRange(0, value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    field.remove();
    return copied;
  };

  const contactEmail = `${["429", "596", "433"].join("")}@${["qq", "com"].join(".")}`;
  const contactEmailLink = document.querySelector("[data-contact-email]");
  const footerEmailLink = document.querySelector("[data-contact-email-footer]");
  const contactCopyButton = document.querySelector("[data-contact-copy]");
  const contactStatus = document.querySelector("[data-contact-status]");

  if (contactEmailLink) {
    contactEmailLink.textContent = contactEmail;
    contactEmailLink.href = `mailto:${contactEmail}`;
    contactEmailLink.setAttribute("aria-label", `${currentCopy.contactEmailAria}: ${contactEmail}`);
  }
  if (footerEmailLink) {
    footerEmailLink.href = `mailto:${contactEmail}`;
    footerEmailLink.setAttribute("aria-label", `${currentCopy.contactEmailAria}: ${contactEmail}`);
  }

  contactCopyButton?.addEventListener("click", async () => {
    const copied = await copyPlainText(contactEmail);
    const feedback = copied ? currentCopy.contactCopied : currentCopy.contactCopyFailed;
    window.clearTimeout(contactCopyTimer);
    contactCopyButton.textContent = feedback;
    if (contactStatus) contactStatus.textContent = feedback;
    contactCopyTimer = window.setTimeout(() => {
      contactCopyButton.textContent = currentCopy.contactCopy;
      if (contactStatus) contactStatus.textContent = "";
    }, 1800);
  });

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
  const hasBilibiliVideo = (work) => /^BV[0-9A-Za-z]{10}$/.test(work?.bvid || "");
  const getDouyinUrlDetails = (value) => {
    if (!value) return null;
    try {
      const originalUrl = new URL(value);
      if (originalUrl.protocol !== "https:" || !["douyin.com", "www.douyin.com"].includes(originalUrl.hostname.toLowerCase())) {
        return null;
      }
      const parts = originalUrl.pathname.split("/").filter(Boolean);
      const kind = parts[0];
      const id = parts[1];
      if (!/^\d+$/.test(id || "")) return null;
      if (kind === "video") {
        return {
          originalUrl: originalUrl.href,
          shareUrl: `https://m.douyin.com/share/video/${id}/`
        };
      }
      if (kind === "collection") {
        return {
          originalUrl: originalUrl.href,
          shareUrl: `https://www.iesdouyin.com/share/mix/detail/${id}/`
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  const douyinMode = (() => {
    const userAgent = navigator.userAgent || "";
    if (/MicroMessenger/i.test(userAgent)) return "wechat";
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return "mobile";
    return "desktop";
  })();

  const videoModal = document.querySelector("[data-video-modal]");
  const videoFrame = document.querySelector("[data-video-frame]");
  const videoTitle = document.querySelector("[data-video-title]");
  const videoLink = document.querySelector("[data-video-link]");
  const videoClose = document.querySelector("[data-video-close]");

  const clearVideoModal = () => {
    videoFrame?.replaceChildren();
    document.body.classList.remove("is-video-modal-open");
    if (activeVideoTrigger?.isConnected) activeVideoTrigger.focus();
    activeVideoTrigger = null;
  };

  const closeVideoModal = () => {
    if (!videoModal) return;
    if (videoModal.open && typeof videoModal.close === "function") {
      videoModal.close();
    } else {
      videoModal.removeAttribute("open");
      clearVideoModal();
    }
  };

  const openVideoModal = (work, trigger) => {
    if (!videoModal || !videoFrame || !videoTitle || !videoLink || !hasBilibiliVideo(work)) return;

    const playerUrl = new URL("https://player.bilibili.com/player.html");
    playerUrl.searchParams.set("bvid", work.bvid);
    playerUrl.searchParams.set("autoplay", "1");
    playerUrl.searchParams.set("high_quality", "1");
    playerUrl.searchParams.set("danmaku", "0");

    const iframe = document.createElement("iframe");
    iframe.src = playerUrl.href;
    iframe.title = `${localize(work.title)} · ${currentCopy.videoFrameTitle}`;
    iframe.allow = "autoplay; fullscreen";
    iframe.setAttribute("allowfullscreen", "");
    videoFrame.replaceChildren(iframe);
    videoTitle.textContent = localize(work.title);
    videoLink.textContent = currentCopy.videoWatch;
    videoLink.href = work.link_cn || `https://www.bilibili.com/video/${work.bvid}`;
    videoClose?.setAttribute("aria-label", currentCopy.videoClose);
    activeVideoTrigger = trigger;
    document.body.classList.add("is-video-modal-open");

    if (typeof videoModal.showModal === "function") videoModal.showModal();
    else videoModal.setAttribute("open", "");
    videoClose?.focus();
  };

  videoClose?.addEventListener("click", closeVideoModal);
  videoModal?.addEventListener("close", clearVideoModal);
  videoModal?.addEventListener("click", (event) => {
    if (event.target === videoModal) closeVideoModal();
  });

  const qrModal = document.querySelector("[data-qr-modal]");
  const qrModalImage = document.querySelector("[data-qr-modal-image]");
  const qrModalCaption = document.querySelector("[data-qr-modal-caption]");
  const qrClose = document.querySelector("[data-qr-close]");

  const clearQrModal = () => {
    const focusTarget = activeQrTrigger?.isConnected ? activeQrTrigger : null;
    document.body.classList.remove("is-qr-modal-open");
    qrModalImage?.removeAttribute("src");
    if (qrModalImage) qrModalImage.alt = "";
    if (qrModalCaption) qrModalCaption.textContent = "";
    activeQrTrigger = null;
    if (focusTarget) {
      window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    }
  };

  const closeQrModal = () => {
    if (!qrModal) return;
    if (qrModal.open && typeof qrModal.close === "function") {
      qrModal.close();
    } else {
      qrModal.removeAttribute("open");
      clearQrModal();
    }
  };

  const openQrModal = (trigger) => {
    const sourceImage = trigger.querySelector("img");
    const caption = trigger.closest(".qr-card")?.querySelector("figcaption");
    if (!qrModal || !qrModalImage || !qrModalCaption || !sourceImage) return;

    qrModalImage.src = sourceImage.getAttribute("src") || "";
    qrModalImage.alt = sourceImage.alt;
    qrModalCaption.textContent = caption?.textContent || sourceImage.alt;
    activeQrTrigger = trigger;
    document.body.classList.add("is-qr-modal-open");
    if (typeof qrModal.showModal === "function") qrModal.showModal();
    else qrModal.setAttribute("open", "");
    qrClose?.focus();
  };

  document.querySelectorAll("[data-qr-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => openQrModal(trigger));
  });
  qrClose?.addEventListener("click", closeQrModal);
  qrModal?.addEventListener("close", clearQrModal);
  qrModal?.addEventListener("click", (event) => {
    if (event.target === qrModal) closeQrModal();
  });

  const douyinModal = document.querySelector("[data-douyin-modal]");
  const douyinClose = document.querySelector("[data-douyin-close]");
  const douyinCover = document.querySelector("[data-douyin-cover]");
  const douyinTitle = document.querySelector("[data-douyin-title]");
  const douyinWechatTip = document.querySelector("[data-douyin-wechat-tip]");
  const douyinQr = document.querySelector("[data-douyin-qr]");
  const douyinQrLabel = document.querySelector("[data-douyin-qr-label]");
  const douyinOpen = document.querySelector("[data-douyin-open]");
  const douyinCopy = document.querySelector("[data-douyin-copy]");
  const douyinCopyValue = document.querySelector("[data-douyin-copy-value]");
  const douyinStatus = document.querySelector("[data-douyin-status]");

  const clearDouyinModal = () => {
    document.body.classList.remove("is-douyin-modal-open");
    douyinModal?.classList.remove("is-wechat", "is-mobile", "is-desktop");
    douyinCopyValue?.classList.remove("is-copy-fallback");
    if (douyinStatus) douyinStatus.textContent = "";
    if (activeDouyinTrigger?.isConnected) activeDouyinTrigger.focus();
    activeDouyinTrigger = null;
  };

  const closeDouyinModal = () => {
    if (!douyinModal) return;
    if (douyinModal.open && typeof douyinModal.close === "function") {
      douyinModal.close();
    } else {
      douyinModal.removeAttribute("open");
      clearDouyinModal();
    }
  };

  const openDouyinModal = (work, value, trigger, options = {}) => {
    const linkDetails = getDouyinUrlDetails(value);
    if (
      !linkDetails || !douyinModal || !douyinCover || !douyinTitle || !douyinWechatTip ||
      !douyinQr || !douyinQrLabel || !douyinOpen || !douyinCopy || !douyinCopyValue || !douyinStatus
    ) return;

    const seasonName = options.seasonName || "";
    const title = `${localize(work.title)}${seasonName ? ` · ${seasonName}` : ""}`;
    const qrSuffix = options.secondary ? "-2" : "";
    const safeId = /^[a-z0-9-]+$/.test(work.id || "") ? work.id : "series";

    douyinModal.classList.remove("is-wechat", "is-mobile", "is-desktop");
    douyinModal.classList.add(`is-${douyinMode}`);
    douyinModal.dataset.mode = douyinMode;
    douyinTitle.textContent = title;
    douyinClose?.setAttribute("aria-label", currentCopy.douyinClose);

    if (work.cover) {
      douyinCover.src = String(work.cover).replaceAll("\\", "/");
      douyinCover.alt = title;
      douyinCover.hidden = false;
    } else {
      douyinCover.removeAttribute("src");
      douyinCover.alt = "";
      douyinCover.hidden = true;
    }

    douyinQr.src = `assets/qr/${safeId}${qrSuffix}.svg`;
    douyinQr.alt = `${title} · ${currentCopy.douyinQrLabel}`;
    douyinQrLabel.textContent = currentCopy.douyinQrLabel;
    douyinWechatTip.textContent = currentCopy.douyinWechatTip;
    douyinWechatTip.hidden = douyinMode !== "wechat";
    douyinOpen.href = douyinMode === "desktop" ? linkDetails.originalUrl : linkDetails.shareUrl;
    douyinOpen.textContent = douyinMode === "desktop" ? currentCopy.douyinOpenWeb : currentCopy.douyinOpen;
    douyinOpen.hidden = douyinMode === "wechat";
    douyinCopy.textContent = currentCopy.douyinCopy;
    douyinCopyValue.value = linkDetails.shareUrl;
    douyinCopyValue.setAttribute("aria-label", currentCopy.douyinCopyValueLabel);
    douyinCopyValue.classList.remove("is-copy-fallback");
    douyinStatus.textContent = "";

    activeDouyinTrigger = trigger;
    activeDouyinTrigger?.focus({ preventScroll: true });
    document.body.classList.add("is-douyin-modal-open");
    if (typeof douyinModal.showModal === "function") douyinModal.showModal();
    else douyinModal.setAttribute("open", "");
    douyinClose?.focus();
  };

  const copyDouyinLink = async () => {
    if (!douyinCopyValue || !douyinStatus) return;
    const value = douyinCopyValue.value;
    let copied = false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      douyinCopyValue.focus();
      douyinCopyValue.select();
      douyinCopyValue.setSelectionRange(0, value.length);
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
    }

    if (copied) {
      douyinCopyValue.classList.remove("is-copy-fallback");
      douyinStatus.textContent = currentCopy.douyinCopied;
      douyinCopy?.focus();
    } else {
      douyinCopyValue.classList.add("is-copy-fallback");
      douyinStatus.textContent = currentCopy.douyinCopyFallback;
    }
  };

  douyinClose?.addEventListener("click", closeDouyinModal);
  douyinCopy?.addEventListener("click", copyDouyinLink);
  douyinModal?.addEventListener("close", clearDouyinModal);
  douyinModal?.addEventListener("click", (event) => {
    if (event.target === douyinModal) closeDouyinModal();
  });

  const workDestination = (work) => {
    if (work.category === "interactive") return work.play_url || "";
    if (work.category === "ip") return work.ip_page || "";
    if (work.category === "series") return work.link_cn || "";
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

  const createLazyImage = (work, className = "") => {
    const image = createElement("img", className);
    image.src = String(work.cover).replaceAll("\\", "/");
    image.alt = localize(work.title);
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.remove(), { once: true });
    return image;
  };

  const bindFilmAction = (button, work) => {
    button.type = "button";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-label", localize(work.title));
    button.addEventListener("click", () => openVideoModal(work, button));
  };

  const renderFilmFeature = (work) => {
    const container = document.querySelector("[data-film-feature]");
    if (!container || !work) return;
    container.dataset.workId = work.id;

    const media = createElement("button", "film-feature__media work-link");
    bindFilmAction(media, work);
    if (work.cover) media.append(createLazyImage(work));
    const play = createElement("span", "play");
    play.setAttribute("aria-hidden", "true");
    media.append(play);

    const copyBlock = document.createElement("div");
    copyBlock.append(
      createElement("span", "film-feature__tag", `${currentCopy.featured} · ${work.year || ""}`),
      createElement("h3", "", localize(work.title)),
      createElement("span", "en", work.title?.en || ""),
      createElement("p", "hl", localize(work.highlight))
    );
    container.replaceChildren(media, copyBlock);
  };

  const renderFilmCard = (work) => {
    const article = createElement("article", "card film-card-small reveal");
    article.dataset.workId = work.id;
    const action = createElement("button", "card__action work-link");
    if (hasBilibiliVideo(work)) {
      bindFilmAction(action, work);
    } else {
      action.type = "button";
      action.setAttribute("aria-label", localize(work.title));
      action.addEventListener("click", showComingSoon);
    }

    const media = createElement("div", "card__media");
    if (work.cover) {
      media.append(createLazyImage(work));
    } else {
      media.append(
        createElement("span", "card__placeholder", localize(work.title)),
        createElement("span", "badge", currentCopy.production)
      );
    }
    if (hasBilibiliVideo(work)) {
      const play = createElement("span", "play");
      play.setAttribute("aria-hidden", "true");
      media.append(play);
    }
    action.append(
      media,
      createElement("h4", "", localize(work.title)),
      createElement("span", "en", work.title?.en || ""),
      createElement("p", "hl", localize(work.highlight))
    );
    article.append(action);
    return article;
  };

  const renderSeriesCard = (work) => {
    const article = createElement("article", "card poster series-card reveal");
    article.dataset.workId = work.id;
    const details = getDouyinUrlDetails(work.link_cn);
    const action = createElement("button", "card__action work-link");
    action.type = "button";
    action.setAttribute("aria-label", localize(work.title));
    if (details) {
      article.classList.add("has-watch-link");
      action.setAttribute("aria-haspopup", "dialog");
      action.addEventListener("click", () => openDouyinModal(work, work.link_cn, action, {
        seasonName: work.link_cn_2 ? currentCopy.seasonOneName : ""
      }));
    } else {
      action.addEventListener("click", showComingSoon);
    }

    const media = createElement("div", "card__media");
    if (work.cover) media.append(createLazyImage(work));
    if (details) {
      const watch = createElement("span", "watch series-watch-badge", currentCopy.douyinWatch);
      watch.setAttribute("aria-hidden", "true");
      media.append(watch);
    }
    action.append(
      media,
      createElement("h4", "", localize(work.title)),
      createElement("span", "en", work.title?.en || "")
    );
    article.append(action);

    if (details && work.link_cn_2) {
      const seasonLinks = createElement("nav", "series-season-links");
      seasonLinks.setAttribute("aria-label", localize(work.title));
      [
        [currentCopy.seasonOne, currentCopy.seasonOneName, work.link_cn, false],
        [currentCopy.seasonTwo, currentCopy.seasonTwoName, work.link_cn_2, true]
      ].forEach(([label, seasonName, value, secondary]) => {
        const seasonLink = createElement("button", "series-season-link", label);
        seasonLink.type = "button";
        seasonLink.setAttribute("aria-haspopup", "dialog");
        seasonLink.addEventListener("click", () => openDouyinModal(work, value, seasonLink, { seasonName, secondary }));
        seasonLinks.append(seasonLink);
      });
      article.append(seasonLinks);
    }
    return article;
  };

  const renderGameCard = (work) => {
    const article = createElement("article", "game-wrap reveal");
    article.dataset.workId = work.id;
    const action = createElement(work.play_url ? "a" : "button", "game work-link");
    action.setAttribute("aria-label", localize(work.title));
    if (work.play_url) {
      action.href = work.play_url;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
    } else {
      action.type = "button";
      action.addEventListener("click", showComingSoon);
    }

    const media = createElement("div", "game__media");
    if (work.cover) media.append(createLazyImage(work));
    else media.append(createElement("span", "game__title-art", localize(work.title)));
    const body = createElement("div", "game__body");
    body.append(
      createElement("h4", "", localize(work.title)),
      createElement("span", "en", work.title?.en || ""),
      createElement("p", "hl", localize(work.highlight)),
      createElement("span", `go${work.play_url ? "" : " go--soon"}`, work.play_url ? currentCopy.playNow : currentCopy.comingSoon)
    );
    action.append(media, body);
    article.append(action);
    return article;
  };

  const films = works.filter((work) => work.category === "film");
  renderFilmFeature(films[0]);
  const filmRail = document.querySelector("[data-film-rail]");
  films.slice(1).forEach((work) => filmRail?.append(renderFilmCard(work)));

  const seriesGrid = document.querySelector("[data-series-grid]");
  works.filter((work) => work.category === "series").forEach((work) => seriesGrid?.append(renderSeriesCard(work)));

  const gamesList = document.querySelector("[data-games-list]");
  works.filter((work) => work.category === "interactive").forEach((work) => gamesList?.append(renderGameCard(work)));

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
