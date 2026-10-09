(function (root, factory) {
  "use strict";

  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && typeof root === "object") root.TownRenderer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /*
   * 晴雨电台统一等距小镇渲染器。
   * - 不读取剧情、不依赖 DOM 之外的全局状态，也不依赖网络资源。
   * - 所有关卡只改变同一座 12x12 沙盘；completed 决定永久保留的变化。
   * - 构造函数接受已有 svg/canvas，方便逐步接入旧版页面。
   */

  var PAL = {
    spring: { sky: "radial-gradient(ellipse 90% 70% at 50% 18%,#33507a 0%,#1d2a4a 45%,#0d1424 100%)", night: 1,
      grass: ["#4f7d5c", "#5a8a63", "#4a7556"], path: "#9c8b72", water: "#2f5d78", waterHi: "#5f93ad", soilL: "#6b4b36", soilR: "#4e3626",
      wallA: "#efe2c8", wallB: "#d9c6a4", wallC: "#b9a383", roof: ["#b8574a", "#7e8fb0", "#6f9a7a", "#c98b4f"], roofDark: .72,
      wood: ["#8a5a3a", "#6d462c"], tree: ["#3f6e4f", "#4f8560", "#2f5a40"], glow: 1 },
    summer: { sky: "radial-gradient(ellipse 90% 70% at 50% 10%,#bfe3ef 0%,#8cc4d9 45%,#5b98b3 100%)", night: 0,
      grass: ["#86b65f", "#93c26a", "#7aa957"], path: "#d8c39a", water: "#4fa6c4", waterHi: "#a5e0ee", soilL: "#a77a52", soilR: "#87603f",
      wallA: "#fff6e3", wallB: "#efdcbc", wallC: "#d4bd98", roof: ["#e0705b", "#6d9ad1", "#73b787", "#f0a85a"], roofDark: .78,
      wood: ["#a8704a", "#8a5937"], tree: ["#5b9a4e", "#6fb05a", "#4a8642"], glow: 0 },
    summerNight: { sky: "radial-gradient(ellipse 90% 70% at 50% 18%,#486d84 0%,#243c55 48%,#101928 100%)", night: 1,
      grass: ["#537754", "#5b8059", "#486b4d"], path: "#9d8f72", water: "#315f78", waterHi: "#6399aa", soilL: "#74543f", soilR: "#533c2d",
      wallA: "#eadfc9", wallB: "#d2c2a5", wallC: "#ad9a7e", roof: ["#ad594c", "#607da2", "#5b8568", "#b87b45"], roofDark: .72,
      wood: ["#80543a", "#603f2b"], tree: ["#416e43", "#4d7b4c", "#345b3a"], glow: 1 },
    winter: { sky: "radial-gradient(ellipse 90% 70% at 50% 18%,#56657e 0%,#323d55 50%,#151b2b 100%)", night: 1,
      grass: ["#e7ecf2", "#dde4ec", "#eef2f6"], path: "#c9cfd8", water: "#6a8199", waterHi: "#a9bdd0", soilL: "#5d4a3e", soilR: "#45362d",
      wallA: "#e6e1d8", wallB: "#c9c2b6", wallC: "#a9a196", roof: ["#f2f5f8", "#e9eef3", "#f2f5f8", "#e9eef3"], roofDark: .86,
      wood: ["#6f5444", "#57402f"], tree: ["#5d7a73", "#6c8a82", "#4c6760"], glow: 1 }
  };

  var S = 40, C = .866, SN = .5, OX = 590, OY = 150, N = 12;
  function P(x, y, z) { z = z || 0; return [OX + (x - y) * C * S, OY + (x + y) * SN * S - z * S]; }
  function pts(a) { return a.map(function (p) { return p.map(function (v) { return v.toFixed(1); }).join(","); }).join(" "); }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1)))); }
    return "#" + [f(r), f(g), f(b)].map(function (v) { return v.toString(16).padStart(2, "0"); }).join("");
  }
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]; }); }
  function copy(value) {
    var out, key;
    if (Array.isArray(value)) return value.map(copy);
    if (value && typeof value === "object") { out = {}; for (key in value) if (Object.prototype.hasOwnProperty.call(value, key)) out[key] = copy(value[key]); return out; }
    return value;
  }

  var MAP = [
    "ggggggggwgss", "ggggggggwgss", "ggggggggwggs", "ggggggggwggg",
    "ggggggggwggg", "rrrrrrrrrrrr", "ggggggggwggg", "ggggggggwggg",
    "gpppggggwggg", "gpppggggwggg", "gpppggggwggg", "ggggggggwggg"
  ];

  var LEVEL_FOCUS = {
    "1-1": { x: 1.15, y: 1.85, z: .8, zoom: 2.34 },
    "1-2": { x: 2.5, y: 8.9, z: .7, zoom: 2.18 },
    "1-3": { x: 11.0, y: .7, z: 1.8, zoom: 2.18 },
    "2-1": { x: 6.25, y: 8.0, z: .7, zoom: 2.4 },
    "2-2": { x: 9.4, y: 3.8, z: .7, zoom: 2.12 },
    "2-3": { x: 10.55, y: 7.85, z: .8, zoom: 2.18 },
    "3-1": { x: 1.7, y: 2.3, z: .9, zoom: 2.22 },
    "3-2": { x: 2.5, y: 8.9, z: .7, zoom: 2.18 },
    "3-3": { x: 10.25, y: 9.75, z: 1.2, zoom: 2.36 },
    radio: { x: 4.3, y: 3.1, z: 2.0, zoom: 2.0 },
    all: { x: 6, y: 6, z: 0, zoom: 1 }
  };

  var SUCCESS_STATE = {
    "1-1": { flowers: "open" },
    "1-2": { pond: "ice", kite: "ice", kiteWet: false },
    "1-3": { fog: false, lamp: true, boat: "home" },
    "2-1": { barrel: "ice", sold: true },
    "2-2": { clouds: false, rainedBefore: true, rainbow: true },
    "2-3": { power: true, fogScreen: true },
    "3-1": { fog: false, snowOnFlowers: false, flowers: "open" },
    "3-2": { fog: false, ice: "thick", elderHome: true, kiteRaised: true },
    "3-3": { fog: false, snowCount: 2, sunrise: true }
  };

  var FINALE_PHASES = {
    "dusk-wind": { weather: "wind", state: { fog: false, snowCount: 0, sunrise: false }, allLit: true },
    "night-snow": { weather: "snow", state: { fog: false, snowCount: 1, sunrise: false }, allLit: true },
    "dawn-snow": { weather: "snow", state: { fog: false, snowCount: 2, sunrise: false }, allLit: true },
    "morning-sun": { weather: "sun", state: { fog: false, snowCount: 2, sunrise: true }, allLit: true, persistWeather: true }
  };
  var FINALE_ALIASES = { dusk: "dusk-wind", wind: "dusk-wind", night: "night-snow", snow1: "night-snow", dawn: "dawn-snow", snow2: "dawn-snow", morning: "morning-sun", sun: "morning-sun" };

  var ICON = {
    sun: '<circle cx="21" cy="21" r="8" fill="#f2b632"/><g stroke="#e0962a" stroke-width="2.4" stroke-linecap="round"><line x1="21" y1="4" x2="21" y2="9"/><line x1="21" y1="33" x2="21" y2="38"/><line x1="4" y1="21" x2="9" y2="21"/><line x1="33" y1="21" x2="38" y2="21"/><line x1="9" y1="9" x2="12.5" y2="12.5"/><line x1="29.5" y1="29.5" x2="33" y2="33"/><line x1="9" y1="33" x2="12.5" y2="29.5"/><line x1="29.5" y1="12.5" x2="33" y2="9"/></g>',
    rain: '<path d="M10 23a7 7 0 0 1 3-13 9 9 0 0 1 17 3 6 6 0 0 1 0 12H13a6 6 0 0 1-3-2z" fill="#8aa6c4"/><g stroke="#4f7aa6" stroke-width="2.4" stroke-linecap="round"><line x1="14" y1="30" x2="12" y2="36"/><line x1="21" y1="30" x2="19" y2="38"/><line x1="28" y1="30" x2="26" y2="36"/></g>',
    wind: '<g fill="none" stroke="#6f9a7a" stroke-width="2.8" stroke-linecap="round"><path d="M5 15h22a5 5 0 1 0-5-5"/><path d="M5 22h28a5 5 0 1 1-5 5"/><path d="M5 29h14"/></g>',
    snow: '<g stroke="#6aa0c9" stroke-width="2.4" stroke-linecap="round"><line x1="21" y1="5" x2="21" y2="37"/><line x1="7" y1="13" x2="35" y2="29"/><line x1="7" y1="29" x2="35" y2="13"/></g><circle cx="21" cy="21" r="3" fill="#6aa0c9"/>',
    thunder: '<path d="M10 20a7 7 0 0 1 3-12 9 9 0 0 1 17 3 6 6 0 0 1 0 11" fill="#8f8aa8"/><polygon points="22,18 14,30 20,30 17,40 28,26 22,26 25,18" fill="#f2b632"/>',
    fog: '<g stroke="#9aa4b0" stroke-width="2.8" stroke-linecap="round"><line x1="6" y1="14" x2="34" y2="14"/><line x1="10" y1="21" x2="36" y2="21"/><line x1="6" y1="28" x2="30" y2="28"/></g>'
  };
  var WEATHER_NAME = { sun: "晴", rain: "雨", wind: "风", snow: "雪", thunder: "雷", fog: "雾" };

  var STYLE_ID = "sunrain-town-renderer-style";
  function ensureStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".town-renderer-host{position:relative;overflow:hidden;isolation:isolate;background:#0d1424;--town-ease:cubic-bezier(.6,.05,.25,1)}",
      ".town-renderer-sky,.town-renderer-stars,.town-renderer-world,.town-renderer-fog,.town-renderer-fx,.town-renderer-flash,.town-renderer-wash,.town-renderer-bolt,.town-renderer-room-wash,.town-renderer-season-veil{position:absolute;inset:0;pointer-events:none}",
      ".town-renderer-sky{z-index:0;transition:background 1.2s,filter 1.1s}.town-renderer-stars{z-index:1;width:100%;height:100%;transition:opacity 1.8s}.town-renderer-season-veil{z-index:1;opacity:0;transition:opacity var(--town-season-duration,2.5s) ease}.town-renderer-room-wash{z-index:1;opacity:0;background:radial-gradient(ellipse 85% 78% at 62% 28%,#fffdf7 0%,#f2e9dc 58%,#d8caba 100%);transition:opacity var(--town-room-duration,2.8s) ease}",
      ".town-renderer-world{z-index:2;left:46%;top:49%;right:auto;bottom:auto;width:min(1060px,112vh);aspect-ratio:1180/860;transform:translate(-50%,-50%);transform-origin:50% 50%;transition:transform 1.4s var(--town-ease),filter 1.2s,opacity 1.2s;will-change:transform,opacity}",
      ".town-renderer-world>svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 20px 22px rgba(0,0,0,.18))}",
      ".town-renderer-world>.town-season-ghost{position:absolute;z-index:2;inset:0;width:100%;height:100%;opacity:1;transition:opacity var(--town-season-duration,2.5s) ease;filter:drop-shadow(0 20px 22px rgba(0,0,0,.18));pointer-events:none}.town-renderer-world>.town-season-ghost.is-leaving{opacity:0}",
      ".town-renderer-fog{z-index:4;inset:-14%;opacity:0;overflow:hidden;transition:opacity 1.4s;filter:saturate(.76)}.town-renderer-fog i{position:absolute;border-radius:50%;background:radial-gradient(ellipse at center,rgba(226,232,240,.58) 0%,rgba(226,232,240,.28) 42%,rgba(226,232,240,0) 76%);filter:blur(14px);animation:townFogDrift 24s ease-in-out infinite alternate}",
      ".town-renderer-fx{z-index:5;width:100%;height:100%}.town-renderer-wash{z-index:3;opacity:0;background:linear-gradient(132deg,transparent 14%,rgba(255,224,151,.34) 45%,transparent 74%);mix-blend-mode:screen;transition:opacity .7s}",
      ".town-renderer-flash{z-index:8;background:#fff;opacity:0}.town-renderer-bolt{z-index:7;width:100%;height:100%;opacity:0}",
      ".town-weather-sun .town-renderer-wash{opacity:1}.town-weather-sun .town-renderer-sky{filter:brightness(1.2) saturate(1.08)}",
      ".town-weather-rain .town-renderer-world>svg{filter:brightness(.88) saturate(.82) drop-shadow(0 20px 22px rgba(0,0,0,.2))}",
      ".town-weather-rain .town-roof{filter:brightness(1.28) saturate(.72)}",
      ".town-renderer-host[data-town-level='2-1'].town-hail-cloudy .town-renderer-sky{filter:brightness(.58) saturate(.67) contrast(1.08)}.town-renderer-host[data-town-level='2-1'].town-hail-cloudy .town-renderer-world>svg{filter:brightness(.7) saturate(.72) drop-shadow(0 22px 26px rgba(0,0,0,.3))}.town-renderer-host[data-town-level='2-1'].town-weather-thunder .town-renderer-sky{filter:brightness(.42) saturate(.58) contrast(1.13)}",
      ".town-weather-wind .town-tree-crown,.town-weather-wind .town-willow{transform-box:fill-box;transform-origin:50% 100%;animation:townTreeSway .75s ease-in-out infinite alternate}.town-weather-wind .town-svg-fog{animation:townFogAway 1.6s forwards}",
      ".town-weather-snow .town-snow-cover{animation:townSnowCover 1.5s ease forwards}.town-weather-thunder .town-renderer-world{animation:townShake .36s linear 2}",
      ".town-thunder-flash{animation:townFlash .2s ease-out}.town-thunder-bolt{animation:townBolt .55s ease-out}",
      ".town-hail-clouds{filter:drop-shadow(0 10px 12px rgba(17,31,42,.32))}.town-hail-clouds .town-hail-cloud-edge{animation:townCloudPulse 1.8s ease-in-out infinite alternate}.town-hail-fall{transform-box:view-box;animation:townHailIntoBarrel .72s linear infinite}.town-hail-bounce{transform-box:view-box;animation:townHailBounce .86s ease-out infinite}.town-hailstone{filter:drop-shadow(0 1px 1px rgba(50,81,94,.44))}",
      ".town-kite-falling{transform-box:fill-box;transform-origin:center;animation:townKiteFall 1.4s var(--town-ease) both}.town-ice-growing{transform-box:fill-box;transform-origin:center;animation:townIceGrow 1.3s ease-out both}",
      ".town-flower{transform-box:fill-box;transform-origin:50% 100%;animation:townBloom .8s cubic-bezier(.2,.8,.3,1.35) both}.town-barrel-change{transform-box:fill-box;transform-origin:center;animation:townFill .9s ease-out both}.town-boat-home{animation:townBoatHome 1.55s var(--town-ease) both}.town-fog-screen{animation:townFogScreen 1.2s ease-out both}",
      ".town-barrel-status{filter:drop-shadow(0 3px 3px rgba(42,28,18,.42))}.town-barrel-status-card{transform-box:fill-box;transform-origin:center;animation:townStatusPop .38s var(--town-ease) both}.town-barrel-status-label,.town-shop-closed-sign text{paint-order:stroke;stroke:rgba(255,248,226,.5);stroke-width:.65px}.town-shop-closed-board{transform-box:fill-box;transform-origin:50% 0;animation:townClosedSwing 1.7s ease-in-out infinite alternate}",
      ".town-ice-shop-quiet{filter:saturate(.66) brightness(.9)}.town-ice-shop-queue{filter:drop-shadow(0 2px 2px rgba(32,23,18,.28))}.town-barrel-melting .town-hail-pile{transform-box:fill-box;transform-origin:50% 100%;animation:townIceMelt 2.2s ease-in forwards}.town-barrel-melting .town-melt-drop{animation:townMeltDrop 1.15s ease-in infinite}.town-melt-puddle{transform-box:fill-box;transform-origin:center;animation:townPuddleGrow 2.2s ease-out both}",
      ".town-light-pop{transform-box:fill-box;transform-origin:center;animation:townLightPop .65s ease-out both}.town-rainbow path{stroke-dasharray:760;stroke-dashoffset:760;animation:townRainbow 1.55s ease-out forwards}.town-rainbow path:nth-child(2){animation-delay:.08s}.town-rainbow path:nth-child(3){animation-delay:.16s}.town-rainbow path:nth-child(4){animation-delay:.24s}",
      ".town-movie{animation:townMovie 2.2s steps(3,end) infinite}.town-radio-wave{animation:townRadio 3s ease-out infinite}.town-radio-wave:nth-child(2){animation-delay:1s}.town-radio-wave:nth-child(3){animation-delay:2s}",
      ".town-lighthouse-beam{transform-box:fill-box;transform-origin:0 50%;animation:townBeam 8s linear infinite}.town-water-line{animation:townWater 3.5s ease-in-out infinite alternate}.town-star{animation:townTwinkle var(--twinkle,4s) ease-in-out infinite alternate}",
      ".town-title-drift .town-renderer-world>svg{animation:townTitleDrift 15s ease-in-out infinite alternate}",
      ".town-fog-swallowed .town-renderer-world{filter:saturate(.45) brightness(.75) drop-shadow(0 20px 22px rgba(0,0,0,.18))}.town-all-lit .town-window-dark{fill:#ffd98a!important}",
      ".town-season-summer .town-snow-cover{display:none!important}",
      ".town-renderer-host[data-town-level='2-3'] .town-rainbow{opacity:.46!important;filter:saturate(.72)}.town-season-winter .town-rainbow{display:none!important}",
      ".town-finale-dusk-wind .town-renderer-world>svg{filter:saturate(.82) brightness(.88) drop-shadow(0 20px 22px rgba(0,0,0,.2))}.town-finale-night-snow .town-renderer-world>svg{filter:saturate(.66) brightness(.82) drop-shadow(0 20px 22px rgba(0,0,0,.22))}.town-finale-dawn-snow .town-renderer-world>svg{filter:saturate(.76) brightness(.96) drop-shadow(0 20px 22px rgba(0,0,0,.18))}.town-finale-morning-sun .town-renderer-world>svg{filter:saturate(.92) brightness(1.13) drop-shadow(0 22px 25px rgba(75,54,35,.2))}",
      ".town-hospital-mode{background:#eee5d9}.town-hospital-mode .town-renderer-room-wash{opacity:1}.town-hospital-mode .town-renderer-stars{opacity:0}.town-hospital-mode .town-renderer-fog,.town-hospital-mode .town-renderer-fx,.town-hospital-mode .town-renderer-bolt{opacity:0!important}.town-hospital-mode .town-renderer-world>svg{filter:drop-shadow(0 24px 28px rgba(78,63,48,.22))}",
      ".town-window-open{transform-box:fill-box;transform-origin:center;animation:townWindowOpen 1.35s var(--town-ease) both}.town-hospital-badge .town-badge-copy{filter:blur(3.2px);opacity:.42;transition:filter 1.8s ease,opacity 1.8s ease}.town-badge-clear .town-hospital-badge .town-badge-copy{filter:blur(0);opacity:1}.town-hospital-radio{opacity:.58;transition:opacity 1.2s ease,filter 1.2s ease}.town-hospital-radio.is-on{opacity:1;filter:drop-shadow(0 0 8px rgba(244,190,102,.36))}.town-hospital-radio.is-on .town-hospital-radio-dial{animation:townRadioGlow 2.8s ease-in-out infinite alternate}.town-hospital-lamp{opacity:.52;transition:opacity 1.15s ease,filter 1.15s ease}.town-hospital-lamp.is-on{opacity:1;filter:drop-shadow(0 0 12px rgba(255,212,133,.7))}.town-hospital-lamp-glow{opacity:.08;transition:opacity 1.2s ease}.town-hospital-lamp.is-on .town-hospital-lamp-glow{opacity:.78}.town-hospital-room-card.is-clear{filter:drop-shadow(0 0 5px rgba(255,231,180,.58))}.town-hospital-head{transform-box:fill-box;transform-origin:48% 72%;transition:transform 1.25s var(--town-ease)}.town-hospital-face-side,.town-hospital-face-front{transition:opacity .72s ease,transform 1.25s var(--town-ease)}.town-hospital-face-side{opacity:1}.town-hospital-face-front{opacity:0;transform:translate(-5px,1px)}.town-mother-turned .town-hospital-head{transform:translate(4px,1px) rotate(5deg)}.town-mother-turned .town-hospital-face-side{opacity:0;transform:translate(5px,0)}.town-mother-turned .town-hospital-face-front{opacity:1;transform:translate(0,0)}",
      "@keyframes townFogDrift{from{transform:translateX(-8%) scale(.95)}to{transform:translateX(9%) scale(1.06)}}@keyframes townTreeSway{from{transform:rotate(-3deg)}to{transform:rotate(5deg)}}",
      "@keyframes townFogAway{to{opacity:0;transform:translateX(170px)}}@keyframes townSnowCover{from{opacity:0}to{opacity:1}}@keyframes townShake{0%,100%{margin-left:0}25%{margin-left:-5px}75%{margin-left:5px}}",
      "@keyframes townFlash{0%{opacity:0}20%{opacity:.94}100%{opacity:0}}@keyframes townBolt{0%{opacity:0}14%{opacity:1}75%{opacity:.72}100%{opacity:0}}",
      "@keyframes townCloudPulse{from{transform:translateY(-2px);opacity:.82}to{transform:translateY(2px);opacity:1}}@keyframes townHailIntoBarrel{0%{transform:translate(38px,-112px);opacity:0}9%{opacity:1}76%{transform:translate(1px,-2px);opacity:1}80%,100%{transform:translate(0,0);opacity:0}}@keyframes townHailBounce{0%,28%{transform:translate(0,0);opacity:0}31%{transform:translate(0,0);opacity:1}56%{transform:translate(var(--hail-bx,8px),-14px);opacity:1}82%{transform:translate(var(--hail-bx2,14px),1px);opacity:.72}100%{transform:translate(var(--hail-bx3,18px),4px);opacity:0}}",
      "@keyframes townStatusPop{from{transform:translateY(4px) scale(.72);opacity:.2}to{transform:translateY(0) scale(1);opacity:1}}@keyframes townClosedSwing{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}@keyframes townIceMelt{0%{transform:translateY(0) scale(1);opacity:1}72%{transform:translateY(3px) scale(.78,.48);opacity:.72}100%{transform:translateY(5px) scale(.58,.16);opacity:.05}}@keyframes townMeltDrop{0%,18%{transform:translateY(-2px);opacity:0}35%{opacity:.88}100%{transform:translateY(13px);opacity:0}}@keyframes townPuddleGrow{from{transform:scale(.2);opacity:.08}to{transform:scale(1);opacity:.78}}",
      "@keyframes townKiteFall{0%{transform:translate(-65px,-125px) rotate(22deg)}55%{transform:translate(28px,-42px) rotate(-18deg)}100%{transform:translate(0,0) rotate(0)}}@keyframes townIceGrow{from{transform:scale(.08);opacity:.2}to{transform:scale(1);opacity:1}}",
      "@keyframes townBloom{from{transform:scale(.18) rotate(-18deg);opacity:.25}to{transform:scale(1) rotate(0);opacity:1}}@keyframes townFill{0%{transform:scaleY(.45);opacity:.4}100%{transform:scaleY(1);opacity:1}}@keyframes townBoatHome{from{transform:translate(125px,-28px)}to{transform:translate(0,0)}}@keyframes townFogScreen{from{opacity:0;transform:scale(.25)}to{opacity:1;transform:scale(1)}}",
      "@keyframes townLightPop{0%{transform:scale(.3);opacity:.2}55%{transform:scale(1.35);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes townRainbow{to{stroke-dashoffset:0}}",
      "@keyframes townMovie{0%{opacity:.35}33%{opacity:.72}66%{opacity:.5}100%{opacity:.35}}@keyframes townRadio{from{r:8;opacity:.65}to{r:64;opacity:0}}@keyframes townBeam{from{transform:rotate(-28deg)}to{transform:rotate(332deg)}}",
      "@keyframes townWater{from{transform:translateX(-4px);opacity:.18}to{transform:translateX(5px);opacity:.5}}@keyframes townTwinkle{from{opacity:.18}to{opacity:.9}}",
      "@keyframes townTitleDrift{from{transform:translate(-7px,3px) scale(.995)}to{transform:translate(8px,-5px) scale(1.018)}}",
      "@keyframes townWindowOpen{from{opacity:.15;transform:scaleX(.22)}to{opacity:1;transform:scaleX(1)}}@keyframes townRadioGlow{from{opacity:.82}to{opacity:1;filter:drop-shadow(0 0 7px rgba(242,190,103,.7))}}",
      "@media(max-width:820px){.town-renderer-world{left:50%;top:43%;width:150vw}.town-renderer-host.town-is-focused .town-renderer-world{width:142vw}.town-hospital-mode .town-renderer-world{top:44%;width:132vw}}",
      "@media(prefers-reduced-motion:reduce){.town-renderer-world{transition-duration:.18s}.town-renderer-fog{transition-duration:.08s}.town-renderer-host *{animation-duration:.01ms!important;animation-iteration-count:1!important}}"
    ].join("");
    doc.head.appendChild(style);
  }

  function resolve(doc, value) {
    if (!value) return null;
    if (typeof value === "string") return doc.querySelector(value);
    return value;
  }
  function make(doc, tag, className, ns) {
    var node = ns ? doc.createElementNS("http://www.w3.org/2000/svg", tag) : doc.createElement(tag);
    node.setAttribute("class", className);
    return node;
  }

  function ParticleLayer(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.weather = "none";
    this.parts = [];
    this.raf = 0;
    this.w = 0; this.h = 0; this.dpr = 1;
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize(); this.loop();
  }
  ParticleLayer.prototype.resize = function () {
    var box = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.width = Math.max(1, Math.round(box.width * this.dpr));
    this.h = this.canvas.height = Math.max(1, Math.round(box.height * this.dpr));
  };
  ParticleLayer.prototype.set = function (weather) {
    this.weather = weather || "none"; this.parts = [];
    this.debug = { effect: this.weather, snowAbove: 0, snowBelow: 0, rainBelow: 0, groundRain: 0, meltLineRatio: .5, accumulation: false };
    var count = weather === "rain" ? 360 : weather === "hail" ? 330 : weather === "snow" ? 220 : weather === "snow-light" ? 76 : weather === "snow-melt" ? 300 : weather === "wind" ? 38 : weather === "fog" ? 18 : 0;
    for (var i = 0; i < count; i += 1) {
      var meltAt = .47 + (i % 9) * .006;
      this.parts.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        v: Math.random() * .65 + .55,
        vy: null,
        bounce: 0,
        kind: weather === "hail" && i % 4 === 0 ? "ice" : "rain",
        s: Math.random() * .8 + .55,
        p: Math.random() * 6.28,
        a: Math.random() * .4 + .2,
        meltAt: meltAt
      });
    }
  };
  ParticleLayer.prototype.loop = function () {
    var c = this.context, d = this.dpr, w = this.weather;
    var meltStats = w === "snow-melt" ? { effect: "snow-melt", snowAbove: 0, snowBelow: 0, rainBelow: 0, groundRain: 0, meltLineRatio: .5, accumulation: false } : null;
    c.clearRect(0, 0, this.w, this.h);
    for (var i = 0; i < this.parts.length; i += 1) {
      var p = this.parts[i];
      if (w === "rain" || (w === "hail" && p.kind === "rain")) {
        c.strokeStyle = "rgba(205,225,255,.5)"; c.lineWidth = d; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - 4 * d, p.y + 19 * d * p.s); c.stroke();
        p.y += 15 * d * p.v; p.x -= 2.8 * d * p.v;
        if (i % 12 === 0 && p.y > this.h * .72) { c.strokeStyle = "rgba(205,225,255,.22)"; c.beginPath(); c.ellipse(p.x, Math.min(p.y, this.h - 4), 10 * d * p.s, 3 * d * p.s, 0, 0, Math.PI * 2); c.stroke(); }
      } else if (w === "hail" && p.kind === "ice") {
        var hailRadius = (1.45 + p.s * 1.15) * d, hailFloor = this.h * (.76 + (i % 9) * .012);
        c.fillStyle = "rgba(247,252,255,.94)"; c.shadowColor = "rgba(184,221,235,.72)"; c.shadowBlur = 2.4 * d; c.beginPath(); c.arc(p.x, p.y, hailRadius, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
        if (p.vy == null) p.vy = 7.8 + p.v * 5.2;
        p.vy += .34; p.y += p.vy * d; p.x -= 4.8 * d * p.v;
        if (p.y >= hailFloor && p.bounce < 1) { p.y = hailFloor; p.vy = -(4.2 + p.v * 3.4); p.bounce += 1; }
      } else if (w === "snow" || w === "snow-light") {
        c.fillStyle = w === "snow-light" ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.88)"; c.beginPath(); c.arc(p.x, p.y, (w === "snow-light" ? 1.25 : 1.9) * d * p.s, 0, Math.PI * 2); c.fill(); p.y += (w === "snow-light" ? .72 : 1.15) * d * p.v; p.x += Math.sin(p.p += .025) * (w === "snow-light" ? .38 : .65) * d;
      } else if (w === "snow-melt") {
        var meltLine = this.h * p.meltAt;
        if (p.y < meltLine) {
          var flakeRadius = (1.9 + p.s * 1.3) * d;
          c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = Math.max(.75, .82 * d); c.lineCap = "round"; c.beginPath();
          c.moveTo(p.x - flakeRadius, p.y); c.lineTo(p.x + flakeRadius, p.y);
          c.moveTo(p.x, p.y - flakeRadius); c.lineTo(p.x, p.y + flakeRadius);
          c.moveTo(p.x - flakeRadius * .72, p.y - flakeRadius * .72); c.lineTo(p.x + flakeRadius * .72, p.y + flakeRadius * .72);
          c.moveTo(p.x + flakeRadius * .72, p.y - flakeRadius * .72); c.lineTo(p.x - flakeRadius * .72, p.y + flakeRadius * .72); c.stroke();
          p.y += 3.15 * d * p.v; p.x += Math.sin(p.p += .035) * .58 * d;
          meltStats.snowAbove += 1;
        } else {
          var meltProgress = Math.min(1, Math.max(.24, (p.y - meltLine) / Math.max(1, this.h * .08)));
          c.strokeStyle = "rgba(190,220,247," + (.48 + meltProgress * .4).toFixed(2) + ")"; c.lineWidth = Math.max(1.1, 1.18 * d); c.lineCap = "round"; c.beginPath();
          c.moveTo(p.x, p.y); c.lineTo(p.x - (3 + meltProgress * 3.2) * d, p.y + (10 + meltProgress * 16) * d * p.s); c.stroke();
          p.y += (5 + meltProgress * 5) * d * p.v; p.x -= (1.4 + meltProgress * 1.5) * d * p.v;
          meltStats.rainBelow += 1;
          if (p.y > this.h * .72) {
            meltStats.groundRain += 1;
            if (i % 11 === 0) { c.strokeStyle = "rgba(190,220,247,.25)"; c.beginPath(); c.ellipse(p.x, Math.min(p.y, this.h - 4), 8 * d * p.s, 2.4 * d * p.s, 0, 0, Math.PI * 2); c.stroke(); }
          }
        }
      } else if (w === "wind") {
        var windLength = (38 + 30 * p.s) * d, windLift = (4 + 5 * p.s) * d * Math.sin(p.p);
        var windFade = c.createLinearGradient(p.x, p.y, p.x + windLength, p.y);
        windFade.addColorStop(0, "rgba(255,255,255,0)"); windFade.addColorStop(.2, "rgba(255,255,255,.24)"); windFade.addColorStop(.76, "rgba(255,255,255,.18)"); windFade.addColorStop(1, "rgba(255,255,255,0)");
        c.strokeStyle = windFade; c.lineWidth = 1.15 * d; c.lineCap = "round"; c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x + windLength * .48, p.y - windLift, p.x + windLength, p.y); c.stroke(); p.x += 7.5 * d * p.v; p.p += .045;
      } else if (w === "fog") {
        var radius = 90 * d * p.s, gradient = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius); gradient.addColorStop(0, "rgba(230,236,240," + p.a + ")"); gradient.addColorStop(1, "rgba(230,236,240,0)"); c.fillStyle = gradient; c.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2); p.x += .22 * d * p.v;
      }
      if (p.y > this.h + 30 * d) { p.y = -30 * d; p.x = Math.random() * this.w * 1.1; p.vy = null; p.bounce = 0; }
      if (p.x > this.w + 160 * d) { p.x = -160 * d; p.y = Math.random() * this.h; }
      if (p.x < -30 * d) p.x = this.w;
    }
    if (meltStats) this.debug = meltStats;
    this.raf = window.requestAnimationFrame(this.loop);
  };
  ParticleLayer.prototype.destroy = function () { window.removeEventListener("resize", this.resize); if (this.raf) window.cancelAnimationFrame(this.raf); };

  function TownRenderer(options) {
    if (!(this instanceof TownRenderer)) return new TownRenderer(options);
    if (options && options.nodeType === 1) options = { root: options };
    if (typeof options === "string") options = { root: options };
    options = options || {};
    if (typeof document === "undefined") throw new Error("TownRenderer needs a browser DOM");
    this.document = options.document || document;
    ensureStyle(this.document);
    this.root = resolve(this.document, options.root) || this.document.getElementById("town-stage") || this.document.getElementById("scene-frame");
    if (!this.root) throw new Error("TownRenderer: root element is required");
    this.root.classList.add("town-renderer-host");
    this.season = options.season || "spring";
    this.labels = copy(options.labels || {});
    this.levelId = options.levelId || null;
    this.state = copy(options.state || {});
    this.completed = {};
    this.fogProgress = 0;
    this.allLit = false;
    this.hospital = false;
    this.hospitalState = { badgeClear: false, motherTurned: false, lampOn: false, radioOn: false, cardClear: false };
    this.finalePhase = null;
    this.activeWeather = null;
    this.playToken = 0;
    this.seasonToken = 0;
    this.transitionToken = 0;
    this.uid = "tr" + Math.random().toString(36).slice(2, 8);
    this._created = [];

    this.sky = resolve(this.document, options.sky) || this.root.querySelector(".town-renderer-sky,#town-sky,#sky");
    if (!this.sky) { this.sky = make(this.document, "div", "town-renderer-sky"); this.root.prepend(this.sky); this._created.push(this.sky); } else this.sky.classList.add("town-renderer-sky");
    this.stars = resolve(this.document, options.stars) || this.root.querySelector(".town-renderer-stars,#town-stars,#stars");
    if (!this.stars) { this.stars = make(this.document, "svg", "town-renderer-stars", true); this.root.appendChild(this.stars); this._created.push(this.stars); } else this.stars.classList.add("town-renderer-stars");
    this.roomWash = make(this.document, "div", "town-renderer-room-wash"); this.root.appendChild(this.roomWash); this._created.push(this.roomWash);

    this.world = resolve(this.document, options.world) || this.root.querySelector(".town-renderer-world,#town-world,#world");
    this.svg = resolve(this.document, options.svg) || this.root.querySelector("svg.town-svg,#town,#scene-svg");
    if (!this.world) { this.world = make(this.document, "div", "town-renderer-world"); this.root.appendChild(this.world); this._created.push(this.world); }
    else this.world.classList.add("town-renderer-world");
    if (!this.svg) { this.svg = make(this.document, "svg", "town-svg", true); this.world.appendChild(this.svg); this._created.push(this.svg); }
    else { this.svg.classList.add("town-svg"); if (this.svg.parentNode !== this.world) this.world.appendChild(this.svg); }
    this.svg.setAttribute("viewBox", "0 0 1180 860"); this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    this.wash = make(this.document, "div", "town-renderer-wash"); this.root.appendChild(this.wash); this._created.push(this.wash);
    this.fog = resolve(this.document, options.fog) || this.root.querySelector(".town-renderer-fog,#town-fog,#fog");
    if (!this.fog) { this.fog = make(this.document, "div", "town-renderer-fog"); this.root.appendChild(this.fog); this._created.push(this.fog); } else this.fog.classList.add("town-renderer-fog");
    this.canvas = resolve(this.document, options.canvas) || this.root.querySelector("canvas.town-renderer-fx,#town-fx,#weather-canvas");
    if (!this.canvas) { this.canvas = make(this.document, "canvas", "town-renderer-fx"); this.root.appendChild(this.canvas); this._created.push(this.canvas); } else this.canvas.classList.add("town-renderer-fx");
    this.bolt = make(this.document, "svg", "town-renderer-bolt", true); this.bolt.setAttribute("viewBox", "0 0 1000 700"); this.root.appendChild(this.bolt); this._created.push(this.bolt);
    this.flash = make(this.document, "div", "town-renderer-flash"); this.root.appendChild(this.flash); this._created.push(this.flash);
    this.particles = new ParticleLayer(this.canvas);
    this._buildFog();
    this.setCompleted(options.completed || []);
    this.drawSky(); this.render(); this.overview(true);
  }

  TownRenderer.prototype._buildFog = function () {
    this.fog.innerHTML = "";
    for (var i = 0; i < 16; i += 1) {
      var e = this.document.createElement("i"), w = 29 + (i * 17 % 38);
      e.style.cssText = "left:" + ((i * 37) % 92) + "%;top:" + (15 + (i * 29) % 72) + "%;width:" + w + "%;height:" + (w * .46) + "%;animation-duration:" + (18 + i % 7 * 3) + "s;animation-delay:-" + (i * 1.7) + "s";
      this.fog.appendChild(e);
    }
  };
  TownRenderer.prototype.setSeason = function (season, options) {
    options = options || {};
    if (season === "summer" && options.night) season = "summerNight";
    if (!PAL[season]) season = "spring";
    this.season = season; this.drawSky(); this.render(); return this;
  };
  TownRenderer.prototype.drawSky = function () {
    var pal = PAL[this.season], phase = this.finalePhase, starFactor = 1, showSun = !pal.night;
    if (this.hospital) {
      this.sky.style.background = "radial-gradient(ellipse 90% 78% at 62% 24%,#fffdf7 0%,#f1e8dc 58%,#d8cabc 100%)";
      this.stars.innerHTML = "";
      this.root.classList.toggle("town-season-winter", true);
      this.root.classList.toggle("town-season-summer", false);
      return;
    }
    if (phase === "dusk-wind") { this.sky.style.background = "radial-gradient(ellipse 94% 76% at 72% 20%,#d8a58f 0%,#765f78 38%,#25334d 76%,#151d2d 100%)"; starFactor = .34; showSun = false; }
    else if (phase === "night-snow") { this.sky.style.background = "radial-gradient(ellipse 90% 72% at 50% 18%,#49556d 0%,#273147 50%,#101624 100%)"; starFactor = .82; showSun = false; }
    else if (phase === "dawn-snow") { this.sky.style.background = "radial-gradient(ellipse 92% 78% at 72% 19%,#d7b5a7 0%,#7f8192 34%,#3b4860 65%,#1c2739 100%)"; starFactor = .22; showSun = false; }
    else if (phase === "morning-sun") { this.sky.style.background = "radial-gradient(ellipse 96% 84% at 76% 16%,#fff3c9 0%,#c8dbe1 34%,#8faebe 64%,#668398 100%)"; starFactor = 0; showSun = true; }
    else this.sky.style.background = pal.sky;
    this.root.classList.toggle("town-season-winter", this.season === "winter");
    this.root.classList.toggle("town-season-summer", this.season === "summer" || this.season === "summerNight");
    var html = "";
    if ((pal.night || phase) && starFactor > 0) {
      for (var i = 0; i < 105; i += 1) {
        var x = (i * 47.17) % 100, y = (i * 31.73) % 62, r = .35 + (i % 6) * .16;
        html += '<circle class="town-star" cx="' + x + '%" cy="' + y + '%" r="' + r + '" fill="#fff" opacity="' + ((.2 + (i % 7) * .09) * starFactor).toFixed(2) + '" style="--twinkle:' + (3 + i % 5) + 's"/>';
      }
      if (phase !== "dawn-snow" && phase !== "dusk-wind") html += '<circle cx="82%" cy="15%" r="26" fill="#fff4d8"/><circle cx="82%" cy="15%" r="74" fill="#fff4d8" opacity=".07"/>';
    }
    if (showSun) html += '<circle cx="80%" cy="14%" r="40" fill="#fff8e0" opacity=".94"/><circle cx="80%" cy="14%" r="112" fill="#fff8e0" opacity=".2"/>';
    this.stars.innerHTML = html;
  };
  TownRenderer.prototype._clearFinaleClasses = function () {
    var root = this.root;
    Object.keys(FINALE_PHASES).forEach(function (key) { root.classList.remove("town-finale-" + key); });
    root.removeAttribute("data-town-finale");
  };
  TownRenderer.prototype._clearEndingMode = function () {
    this._clearFinaleClasses();
    this.root.classList.remove("town-hospital-mode", "town-ending-shrink", "town-badge-clear", "town-mother-turned");
    this.root.removeAttribute("data-town-mother-turned");
    this.root.removeAttribute("data-town-hospital-lamp");
    this.root.removeAttribute("data-town-hospital-radio");
    this.root.removeAttribute("data-town-hospital-card");
    this.roomWash.style.opacity = "";
    this.stars.style.opacity = "";
    this.world.style.opacity = "1";
    this.world.style.transition = "";
  };
  TownRenderer.prototype.transitionSeason = function (season, options) {
    options = options || {};
    if (season === "summer" && options.night) season = "summerNight";
    if (!PAL[season]) season = "spring";
    var self = this, token = ++this.seasonToken;
    var reduced = options.reducedMotion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches);
    var duration = reduced ? 80 : Math.max(80, Number(options.duration) || 2500);
    var ghost = this.svg.cloneNode(true), veil = make(this.document, "div", "town-renderer-season-veil");
    ghost.removeAttribute("id"); ghost.setAttribute("aria-hidden", "true"); ghost.setAttribute("class", "town-svg town-season-ghost");
    veil.style.background = this.sky.style.background || PAL[this.season].sky; veil.style.opacity = "1";
    this.root.style.setProperty("--town-season-duration", duration + "ms");
    this.world.appendChild(ghost); this.root.appendChild(veil);
    this.hospital = false; this.finalePhase = null; this._clearEndingMode(); this.season = season; this.drawSky(); this.render();
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { ghost.classList.add("is-leaving"); veil.style.opacity = "0"; }); });
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        if (veil.parentNode) veil.parentNode.removeChild(veil);
        resolve({ cancelled: token !== self.seasonToken, season: season });
      }, duration + 34);
    });
  };
  TownRenderer.prototype.setCompleted = function (completed) {
    var map = {}, i;
    if (typeof completed === "number") { var order = Object.keys(SUCCESS_STATE); for (i = 0; i < completed && i < order.length; i += 1) map[order[i]] = true; }
    else if (Array.isArray(completed)) for (i = 0; i < completed.length; i += 1) map[completed[i]] = true;
    else if (completed && typeof completed === "object") Object.keys(completed).forEach(function (key) { if (completed[key]) map[key] = true; });
    this.completed = map; this.render(); return this;
  };
  TownRenderer.prototype.setLabels = function (labels) { this.labels = copy(labels || {}); this.render(); return this; };
  TownRenderer.prototype.markCompleted = function (levelId) { this.completed[levelId] = true; this.render(); return this; };
  TownRenderer.prototype.setLevel = function (levelId, state, options) {
    options = options || {}; this.transitionToken += 1; this.hospital = false; this.hospitalState = { badgeClear: false, motherTurned: false, lampOn: false, radioOn: false, cardClear: false }; this.finalePhase = null; this._clearEndingMode(); this.root.classList.remove("town-title-drift"); this.levelId = levelId; this.state = copy(state || {});
    this.root.setAttribute("data-town-level", levelId || "");
    var chapter = Number(String(levelId).charAt(0));
    this.season = chapter === 1 ? "spring" : chapter === 2 ? (levelId === "2-3" ? "summerNight" : "summer") : "winter";
    this.fogProgress = chapter === 3 ? (levelId === "3-1" ? .38 : levelId === "3-2" ? .68 : .9) : 0;
    this.drawSky(); this.render(); if (options.focus !== false) this.focus(levelId, { instant: options.instant }); return this;
  };
  TownRenderer.prototype.setState = function (levelId, state, options) {
    if (typeof levelId !== "string") { options = state; state = levelId; levelId = this.levelId; }
    this.levelId = levelId || this.levelId; this.root.setAttribute("data-town-level", this.levelId || ""); this.state = copy(state || {}); this.render(options); return this;
  };
  TownRenderer.prototype.setFogPhase = function (progress) {
    this.fogProgress = Math.max(0, Math.min(1, Number(progress) || 0));
    this._applyFog(this._effectiveFog());
    return this;
  };
  TownRenderer.prototype._effectiveFog = function () {
    if (this.allLit) return 0;
    if (this.levelId && String(this.levelId).charAt(0) === "3" && this.state && this.state.fog === false) {
      return this.levelId === "3-3" ? 0 : this.fogProgress * .34;
    }
    return this.fogProgress;
  };
  TownRenderer.prototype._applyFog = function (opacity) {
    opacity = Math.max(0, Math.min(1, Number(opacity) || 0));
    this.fog.style.opacity = opacity;
    this.root.classList.toggle("town-fog-swallowed", opacity > .56);
  };
  TownRenderer.prototype.focus = function (target, options) {
    options = options || {}; var f = typeof target === "string" ? LEVEL_FOCUS[target] : target;
    if (!f) f = LEVEL_FOCUS.all;
    var q = P(f.x, f.y, f.z || 0), zoom = Number(options.zoom || f.zoom || 1);
    if (options.instant) this.world.style.transition = "none";
    this.world.style.transform = "translate(-50%,-50%) scale(" + zoom + ") translate(" + ((590 - q[0]) / 1180 * 100) + "%," + ((430 - q[1]) / 860 * 100) + "%)";
    this.root.classList.toggle("town-is-focused", zoom > 1.05);
    if (options.instant) { var self = this; window.requestAnimationFrame(function () { self.world.style.transition = ""; }); }
    return this;
  };
  TownRenderer.prototype.overview = function (instant) { return this.focus("all", { instant: Boolean(instant) }); };
  TownRenderer.prototype.startDrift = function () { this.overview(false); this.root.classList.add("town-title-drift"); return this; };
  TownRenderer.prototype.stopDrift = function () { this.root.classList.remove("town-title-drift"); return this; };

  TownRenderer.prototype._stateFor = function (id) {
    var base = this.completed[id] ? copy(SUCCESS_STATE[id]) : {};
    if (this.levelId === id) Object.keys(this.state || {}).forEach(function (key) { base[key] = this.state[key]; }, this);
    return base;
  };
  TownRenderer.prototype._weatherClasses = function (card, on) {
    ["sun", "rain", "wind", "snow", "thunder", "fog"].forEach(function (name) { this.root.classList.toggle("town-weather-" + name, Boolean(on && card === name)); }, this);
  };
  TownRenderer.prototype.playWeather = function (card, nextState, options) {
    if (nextState && nextState.levelId && !options) { options = nextState; nextState = options.state; }
    options = options || {}; var self = this, token = ++this.playToken;
    var reduced = options.reducedMotion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches);
    var duration = Number(options.duration) || (reduced ? 320 : 2500);
    var isSummer = this.season === "summer" || this.season === "summerNight", particleWeather = card;
    var isSnowMelt = card === "snow" && isSummer && this.levelId === "2-1";
    if (isSnowMelt) particleWeather = "snow-melt";
    else if (card === "snow" && isSummer) particleWeather = "none";
    else if (card === "snow" && this.levelId === "1-2") particleWeather = "snow-light";
    else if (card === "thunder" && this.levelId === "2-1") particleWeather = "hail";
    this.activeWeather = card; this._weatherClasses(card, particleWeather !== "none" && !isSnowMelt); this.particles.set(particleWeather);
    this.root.classList.toggle("town-weather-snow-melt", isSnowMelt);
    if (isSnowMelt) this.root.setAttribute("data-town-weather-effect", "snow-melt");
    else this.root.setAttribute("data-town-weather-effect", particleWeather);
    this.root.classList.toggle("town-hail-cloudy", Boolean(this.levelId === "2-1" && card === "thunder"));
    if (this.levelId === "2-1" && card === "thunder") this.render();
    if (card === "fog") this.fog.style.opacity = Math.max(this.fogProgress, .82);
    if (card === "wind") this.fog.style.opacity = 0;
    if (card === "thunder") {
      var target = LEVEL_FOCUS[this.levelId] || LEVEL_FOCUS.radio, q = P(target.x, target.y, target.z || 0);
      var tx = q[0] / 1180 * 1000, ty = q[1] / 860 * 700;
      this.bolt.innerHTML = '<polyline points="820,0 710,145 756,165 625,292 674,312 ' + tx.toFixed(0) + ',' + ty.toFixed(0) + '" fill="none" stroke="#fff8c9" stroke-width="8" stroke-linejoin="bevel" filter="drop-shadow(0 0 12px #fff)"/><polyline points="820,0 710,145 756,165 625,292 674,312 ' + tx.toFixed(0) + ',' + ty.toFixed(0) + '" fill="none" stroke="#8cbcff" stroke-width="2"/>';
      [duration * .09, duration * .27].forEach(function (wait, index) { window.setTimeout(function () { if (token !== self.playToken) return; self.flash.classList.remove("town-thunder-flash"); self.bolt.classList.remove("town-thunder-bolt"); void self.flash.offsetWidth; self.flash.classList.add("town-thunder-flash"); if (!index) self.bolt.classList.add("town-thunder-bolt"); }, wait); });
    }
    if (nextState) window.setTimeout(function () { if (token === self.playToken) self.setState(options.levelId || self.levelId, Object.assign({}, nextState, { __lastCard: card })); }, Math.min(duration * .44, 980));
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        if (token === self.playToken) {
          self.activeWeather = null; self._weatherClasses(card, false); self.root.classList.remove("town-weather-snow-melt"); self.root.removeAttribute("data-town-weather-effect"); self.particles.set("none"); self.flash.classList.remove("town-thunder-flash"); self.bolt.classList.remove("town-thunder-bolt");
          if (self.levelId === "2-1" && card === "thunder") self.render();
          self.root.classList.remove("town-hail-cloudy");
          self._applyFog(self._effectiveFog());
        }
        resolve({ cancelled: token !== self.playToken, card: card });
      }, duration);
    });
  };
  TownRenderer.prototype.stopWeather = function () { this.playToken += 1; this.activeWeather = null; this._weatherClasses(null, false); this.root.classList.remove("town-weather-snow-melt", "town-hail-cloudy"); this.root.removeAttribute("data-town-weather-effect"); this.particles.set("none"); this._applyFog(this._effectiveFog()); return this; };
  TownRenderer.prototype._applyFinalePhase = function (phase, options) {
    options = options || {};
    var key = FINALE_PHASES[phase] ? phase : FINALE_ALIASES[phase];
    if (!key) throw new Error("TownRenderer: unknown finale phase " + phase);
    var config = FINALE_PHASES[key];
    this.hospital = false; this.hospitalState = { badgeClear: false, motherTurned: false, lampOn: false, radioOn: false, cardClear: false }; this._clearEndingMode();
    this.finalePhase = key; this.levelId = "3-3"; this.season = "winter"; this.fogProgress = 0; this.allLit = Boolean(config.allLit);
    this.state = Object.assign({}, copy(config.state), { __lastCard: config.weather });
    this.activeWeather = config.weather; this.root.setAttribute("data-town-level", "3-3"); this.root.setAttribute("data-town-finale", key); this.root.classList.add("town-finale-" + key);
    this._weatherClasses(config.weather, true); this.particles.set(config.weather === "sun" ? "none" : config.weather);
    this.drawSky(); this.render();
    if (options.focus !== false) this.overview(Boolean(options.instant));
    return { key: key, config: config };
  };
  TownRenderer.prototype.setFinalePhase = function (phase, options) {
    this.transitionToken += 1; this.playToken += 1; this._applyFinalePhase(phase, options); return this;
  };
  TownRenderer.prototype.playFinalePhase = function (phase, options) {
    options = options || {}; this.transitionToken += 1; var self = this, token = ++this.playToken;
    var applied = this._applyFinalePhase(phase, options), config = applied.config;
    var reduced = options.reducedMotion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches);
    var duration = reduced ? 180 : Math.max(180, Number(options.duration) || 3000);
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        if (token === self.playToken && !config.persistWeather) {
          self.activeWeather = null; self._weatherClasses(config.weather, false); self.particles.set("none"); self._applyFog(0);
        }
        resolve({ cancelled: token !== self.playToken, phase: applied.key, weather: config.weather });
      }, duration);
    });
  };
  TownRenderer.prototype.playEndingWeatherPhase = TownRenderer.prototype.playFinalePhase;
  TownRenderer.prototype.playFinale = function (options) {
    options = options || {}; if (!options.duration) options.duration = 3600; return this.playFinalePhase("dusk-wind", options);
  };

  TownRenderer.prototype.render = function () {
    if (!this.svg) return this;
    if (this.hospital) { this._renderHospital(); return this; }
    this.root.classList.toggle("town-hail-cloudy", Boolean(this.levelId === "2-1" && this.activeWeather === "thunder"));
    this.svg.innerHTML = this._townMarkup();
    if (this.activeWeather === "fog") this._applyFog(Math.max(this._effectiveFog(), .82));
    else if (this.activeWeather === "wind") this._applyFog(0);
    else this._applyFog(this._effectiveFog());
    this.root.classList.toggle("town-all-lit", this.allLit);
    return this;
  };

  TownRenderer.prototype._townMarkup = function () {
    var self = this, pal = PAL[this.season], out = [], items = [], uid = this.uid;
    var isWinter = this.season === "winter", isSummer = this.season === "summer" || this.season === "summerNight", isNight = Boolean(pal.night);
    var levelOrder = ["1-1", "1-2", "1-3", "2-1", "2-2", "2-3", "3-1", "3-2", "3-3"];
    var currentLevelIndex = levelOrder.indexOf(this.levelId);
    var labels = this.labels || {};
    function hasReached(levelId) {
      var targetIndex = levelOrder.indexOf(levelId);
      return Boolean(self.completed[levelId]) || (targetIndex >= 0 && currentLevelIndex >= targetIndex);
    }
    var s11 = this._stateFor("1-1"), s12 = this._stateFor("1-2"), s13 = this._stateFor("1-3");
    var s21 = this._stateFor("2-1"), s22 = this._stateFor("2-2"), s23 = this._stateFor("2-3");
    var s31 = this._stateFor("3-1"), s32 = this._stateFor("3-2"), s33 = this._stateFor("3-3");
    function add(markup) { out.push(markup); }
    function poly(points, fill, extra) { add('<polygon points="' + pts(points) + '" fill="' + fill + '" ' + (extra || "") + '/>'); }
    function box(x, y, z, w, d, h, top, left, right, extra) {
      poly([P(x,y,z+h),P(x+w,y,z+h),P(x+w,y+d,z+h),P(x,y+d,z+h)],top,extra);
      poly([P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)],left,extra);
      poly([P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)],right,extra);
    }
    function fy(x,y,z,w,d,h) { return function(u,v) { return P(x+u*w,y+d,z+v*h); }; }
    function fx(x,y,z,w,d,h) { return function(u,v) { return P(x+w,y+u*d,z+v*h); }; }
    function win(face,u,v,uw,vh,lit) {
      var q=[face(u,v),face(u+uw,v),face(u+uw,v+vh),face(u,v+vh)], c;
      if(lit && (pal.glow || self.allLit)){ c=q.reduce(function(a,p){return [a[0]+p[0]/4,a[1]+p[1]/4];},[0,0]); add('<circle cx="'+c[0]+'" cy="'+c[1]+'" r="20" fill="url(#'+uid+'WinGlow)"/>'); poly(q,"#ffd98a"); }
      else poly(q,isNight?'#2c3550':'#7fa6bf','class="town-window-dark"');
      add('<polyline points="'+pts([face(u+uw/2,v),face(u+uw/2,v+vh)])+'" stroke="'+(lit?'#c98c3e':'#30384b')+'" stroke-width="1"/>');
    }
    function house(o) {
      var x=o.x,y=o.y,w=o.w,d=o.d,h=o.h,z=o.z||0,rh=o.rh==null?.9:o.rh,rc=pal.roof[o.roof%4],fL=fy(x,y,z,w,d,h),fR=fx(x,y,z,w,d,h);
      box(x,y,z,w,d,h,pal.wallA,pal.wallB,pal.wallC,'class="town-building"');
      if(o.door!==false){var du=o.doorU==null?.42:o.doorU;poly([fL(du,0),fL(du+.18,0),fL(du+.18,.55),fL(du,.55)],shade(pal.wood[0],.9));}
      (o.winsL||[[.12,.45],[.68,.45]]).forEach(function(p,i){win(fL,p[0],p[1],.16,.28,o.lit&&((i+(o.seed||0))%3!==0));});
      (o.winsR||[[.2,.45],[.62,.45]]).forEach(function(p,i){win(fR,p[0],p[1],.2,.28,o.lit&&((i+(o.seed||0)+1)%2===0));});
      var zt=z+h,ov=.12,my=y+d/2;
      poly([P(x-ov,y-ov,zt),P(x+w+ov,y-ov,zt),P(x+w+ov,my,zt+rh),P(x-ov,my,zt+rh)],shade(rc,pal.roofDark),'class="town-roof"');
      poly([P(x-ov,my,zt+rh),P(x+w+ov,my,zt+rh),P(x+w+ov,y+d+ov,zt),P(x-ov,y+d+ov,zt)],rc,'class="town-roof"');
      poly([P(x+w,y,zt),P(x+w,my,zt+rh),P(x+w,y+d,zt)],pal.wallC);
      add('<polyline points="'+pts([P(x-ov,my,zt+rh),P(x+w+ov,my,zt+rh)])+'" stroke="'+(isWinter?'#fff':shade(rc,1.25))+'" stroke-width="'+(isWinter?3:1.5)+'" stroke-linecap="round"/>');
      if(isWinter) poly([P(x-ov,my,zt+rh+.03),P(x+w+ov,my,zt+rh+.03),P(x+w+ov,y+d+ov,zt+.03),P(x-ov,y+d+ov,zt+.03)],"#fff",'class="town-snow-cover" opacity=".75"');
      if(o.chimney){box(x+w*.7,my-.15,zt+.2,.28,.28,rh+.1,shade(pal.wallC,.9),shade(pal.wallC,.8),shade(pal.wallC,.7));}
    }
    function tree(x,y,s,kind){
      s=s||1;kind=kind||0;var b=P(x,y,0),c=pal.tree;
      add('<g class="town-tree"><ellipse cx="'+b[0]+'" cy="'+b[1]+'" rx="'+(14*s)+'" ry="'+(7*s)+'" fill="#000" opacity=".18"/><rect x="'+(b[0]-2.5*s)+'" y="'+(b[1]-22*s)+'" width="'+(5*s)+'" height="'+(22*s)+'" fill="'+pal.wood[1]+'" rx="2"/><g class="town-tree-crown">');
      if(!kind){[[0,-34,17],[-8,-28,12],[9,-27,12],[0,-46,12]].forEach(function(v,i){add('<circle cx="'+(b[0]+v[0]*s)+'" cy="'+(b[1]+v[1]*s)+'" r="'+(v[2]*s)+'" fill="'+c[i%3]+'"/>');});}
      else add('<polygon points="'+b[0]+','+(b[1]-64*s)+' '+(b[0]-15*s)+','+(b[1]-14*s)+' '+(b[0]+15*s)+','+(b[1]-14*s)+'" fill="'+c[2]+'"/><polygon points="'+b[0]+','+(b[1]-64*s)+' '+(b[0]+15*s)+','+(b[1]-14*s)+' '+b[0]+','+(b[1]-12*s)+'" fill="'+c[0]+'"/>');
      if(isWinter)add('<ellipse class="town-snow-cover" cx="'+b[0]+'" cy="'+(b[1]-(kind?50:44)*s)+'" rx="'+(10*s)+'" ry="'+(4*s)+'" fill="#fff" opacity=".9"/>');
      add('</g></g>');
    }
    function lamp(x,y){var b=P(x,y,0),t=P(x,y,1);if(pal.glow||self.allLit)add('<ellipse cx="'+b[0]+'" cy="'+b[1]+'" rx="46" ry="24" fill="url(#'+uid+'Pool)"/>');add('<line x1="'+b[0]+'" y1="'+b[1]+'" x2="'+t[0]+'" y2="'+t[1]+'" stroke="#2a2a33" stroke-width="2.5"/><circle cx="'+t[0]+'" cy="'+t[1]+'" r="4.5" fill="'+((pal.glow||self.allLit)?'#ffe2a0':'#e8e2d0')+'"/>');}
    function I(depth,fn){items.push([depth,fn]);}
    function person(x,y,color,old){var b=P(x,y,0);add('<g transform="translate('+b[0]+' '+b[1]+')"><ellipse rx="6" ry="3" fill="#000" opacity=".22"/><circle cy="-22" r="5" fill="#efc7a3"/><path d="M-5-25q5-'+(old?2:5)+' 10 0" fill="'+(old?'#d7d5cf':'#3c2b23')+'"/><path d="M-5-16h10l4 19h-18z" fill="'+color+'"/><path d="M-4 2l-3 12M4 2l3 12" stroke="#453d3b" stroke-width="2.5"/></g>');}
    function kite(x,y,wet,rotation,falling){var b=P(x,y,.05);add('<g class="'+(falling?'town-kite-falling ':'')+'town-kite"><g transform="translate('+b[0]+' '+b[1]+') rotate('+(rotation||0)+')" opacity="'+(wet?.62:1)+'"><polygon points="0,-13 9,0 0,15 -9,0" fill="#e0473a"/><polygon points="0,-13 9,0 0,0" fill="#ff7462"/><path d="M0-13v28M-9 0H9M0 15q6 10-2 18q-6 8 2 16" stroke="#7a1f16" stroke-width="1" fill="none"/></g></g>');}

    add('<defs><radialGradient id="'+uid+'WinGlow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".58"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient><radialGradient id="'+uid+'Pool"><stop offset="0" stop-color="#ffd98a" stop-opacity=".42"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient><radialGradient id="'+uid+'Red"><stop offset="0" stop-color="#ff5a46" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a46" stop-opacity="0"/></radialGradient><linearGradient id="'+uid+'Water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+pal.waterHi+'"/><stop offset="1" stop-color="'+pal.water+'"/></linearGradient><linearGradient id="'+uid+'Ice" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef8fb"/><stop offset=".48" stop-color="#aecddd"/><stop offset="1" stop-color="#dceef4"/></linearGradient><linearGradient id="'+uid+'ThinIce" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dff2f3" stop-opacity=".76"/><stop offset=".52" stop-color="#8ebdca" stop-opacity=".7"/><stop offset="1" stop-color="#d9edef" stop-opacity=".78"/></linearGradient><filter id="'+uid+'Soft"><feGaussianBlur stdDeviation="14"/></filter><filter id="'+uid+'Shadow"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#10202b" flood-opacity=".28"/></filter></defs>');
    add('<ellipse cx="'+OX+'" cy="'+(P(N,N,0)[1]+30)+'" rx="560" ry="70" fill="#000" opacity=".35" filter="url(#'+uid+'Soft)"/>');
    box(-.35,-.35,-1.45,N+.7,N+.7,.75,pal.wood[0],shade(pal.wood[0],.8),shade(pal.wood[0],.62));
    for(var k=0;k<6;k+=1)add('<polyline points="'+pts([P(-.35,N+.35,-1.39+.75*k/6),P(N+.35,N+.35,-1.39+.75*k/6)])+'" stroke="#000" stroke-opacity=".08"/>');
    poly([P(4.6,N+.35,-1.28),P(7.4,N+.35,-1.28),P(7.4,N+.35,-.82),P(4.6,N+.35,-.82)],"#c9a65a",'stroke="#8d6d2c" stroke-width="1"');
    var pc=P(6,N+.35,-1.05),townName=esc(labels.townName||"");add('<text transform="matrix('+C+','+SN+',0,1,'+pc[0]+','+pc[1]+')" text-anchor="middle" dominant-baseline="middle" font-size="13" letter-spacing="6" fill="#5a3f14" font-family="serif" font-weight="700">'+townName+'</text>');
    box(0,0,-.7,N,N,.7,pal.grass[0],pal.soilL,pal.soilR);
    var pondTilesFrozen=!isSummer&&(isWinter||s12.pond==='ice'||s32.ice==='thick');
    for(var y=0;y<N;y+=1)for(var x=0;x<N;x+=1){var t=MAP[y][x],fill=t==='g'?pal.grass[(x*7+y*13)%3]:t==='r'?pal.path:t==='s'?shade(pal.water,.8):'url(#'+uid+'Water)';if(t==='p'&&pondTilesFrozen)fill='url(#'+uid+(isWinter?'Ice':'ThinIce')+')';poly([P(x,y),P(x+1,y),P(x+1,y+1),P(x,y+1)],fill,t==='r'?'stroke="'+shade(pal.path,.92)+'" stroke-width=".6"':'');}
    for(k=0;k<12;k+=1){var a=P(8.2,(k*.89)%N),b=P(8.7,(k*.89)%N+.15);add('<line class="town-water-line" x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="#fff" stroke-opacity="'+(isNight?.22:.45)+'" stroke-width="1.2"/>');}

    I(13.5,function(){box(7.9,4.9,0,1.2,1.2,.18,shade(pal.wood[0],1.1),pal.wood[0],pal.wood[1]);});
    I(7.4,function(){
      house({x:3.2,y:2.2,w:2.2,d:1.8,h:2.2,roof:0,lit:1,seed:0,winsL:[[.1,.5],[.4,.5],[.72,.5]],winsR:[[.15,.5],[.6,.5]]});
      var f=fy(3.2,2.2,0,2.2,1.8,2.2);poly([f(.12,.8),f(.88,.8),f(.88,1),f(.12,1)],"#2b2230");var c=f(.5,.9),stationName=esc(labels.stationName||"");add('<text transform="matrix('+C+','+SN+',0,1,'+c[0]+','+c[1]+')" text-anchor="middle" dominant-baseline="middle" font-size="12" letter-spacing="4" fill="#ffcf7a" font-family="serif" font-weight="700" style="filter:drop-shadow(0 0 4px #ffb347)">'+stationName+'</text>');
      var base=P(4.3,3.1,3.1),top=P(4.3,3.1,5.6);add('<line x1="'+(base[0]-7)+'" y1="'+base[1]+'" x2="'+top[0]+'" y2="'+top[1]+'" stroke="#353541" stroke-width="2"/><line x1="'+(base[0]+7)+'" y1="'+base[1]+'" x2="'+top[0]+'" y2="'+top[1]+'" stroke="#353541" stroke-width="2"/><circle cx="'+top[0]+'" cy="'+top[1]+'" r="16" fill="url(#'+uid+'Red)"/><circle cx="'+top[0]+'" cy="'+top[1]+'" r="3.5" fill="#ff6b57"/>');
      for(var r=0;r<3;r+=1)add('<circle class="town-radio-wave" cx="'+top[0]+'" cy="'+top[1]+'" r="8" fill="none" stroke="#ffcf7a" stroke-width="1.2"/>');
    });
    I(3.4,function(){
      house({x:.8,y:1.2,w:1.6,d:1.3,h:1.3,roof:3,lit:1,seed:1,rh:.7,winsL:[[.12,.4]],winsR:[[.3,.4]],doorU:.55});
      var f=fy(.8,1.2,0,1.6,1.3,1.3);for(var i=0;i<6;i+=1){var u=.05+i*.15;poly([f(u,.78),f(u+.15,.78),P(.8+(u+.15)*1.6,2.85,1),P(.8+u*1.6,2.85,1)],i%2?'#f4ead6':'#d4584a');}
      var flowerState=self.levelId==='3-1'?s31:s11,open=flowerState.flowers==='open',snow=Boolean(flowerState.snowOnFlowers);
      for(i=0;i<6;i+=1){var fb=P(.95+i*.26,2.95,0),ft=P(.95+i*.26,2.95,.55);add('<line x1="'+fb[0]+'" y1="'+fb[1]+'" x2="'+ft[0]+'" y2="'+ft[1]+'" stroke="#4f7d3a" stroke-width="1.6"/>');if(open)add('<g class="town-flower"><circle cx="'+ft[0]+'" cy="'+ft[1]+'" r="6" fill="#f2b632"/><circle cx="'+ft[0]+'" cy="'+ft[1]+'" r="2.3" fill="#6b4520"/></g>');else add('<ellipse cx="'+ft[0]+'" cy="'+(ft[1]+3)+'" rx="4" ry="5" fill="#807b4f" transform="rotate(28 '+ft[0]+' '+(ft[1]+3)+')"/>');if(snow)add('<ellipse class="town-snow-cover" cx="'+ft[0]+'" cy="'+(ft[1]-4)+'" rx="7" ry="3" fill="#fff"/>');}
      person(.82,2.92,"#77716d",true);
    });
    I(11.0,function(){
      var springIce=!isSummer&&(s12.pond==='ice'||self.completed['1-2']),winterIce=isWinter&&((self.levelId==='3-2'&&s32.ice==='thick')||self.completed['3-2']),ice=springIce||winterIce,thinIce=ice&&!isWinter;var center=P(2.5,9.5,.04);
      add('<ellipse class="'+((ice&&self.state.__lastCard==='snow')?'town-ice-growing ':'')+'town-pond" cx="'+center[0]+'" cy="'+center[1]+'" rx="80" ry="27" fill="'+(ice?'url(#'+uid+(thinIce?'ThinIce':'Ice')+')':'url(#'+uid+'Water)')+'" stroke="'+(ice?(thinIce?'#cfe8ea':'#edf8fb'):pal.waterHi)+'" stroke-width="'+(thinIce?'1.2':'2')+'"/>');
      if(ice&&!thinIce)add('<path d="M'+(center[0]-48)+' '+center[1]+'q30-18 60-2t56-4M'+(center[0]-5)+' '+(center[1]+17)+'l18-17 22 9 18-15" fill="none" stroke="#fff" opacity=".58"/>');
      else if(thinIce)add('<path d="M'+(center[0]-42)+' '+(center[1]-2)+'q27-9 55 0t48-2" fill="none" stroke="#f4ffff" stroke-width="1.1" opacity=".48"/>');
      var wb=P(3.4,7.6,0);add('<g class="town-willow"><path d="M'+wb[0]+' '+wb[1]+'C'+(wb[0]-4)+' '+(wb[1]-30)+','+(wb[0]+8)+' '+(wb[1]-50)+','+(wb[0]+2)+' '+(wb[1]-70)+'" stroke="'+pal.wood[1]+'" stroke-width="7" fill="none"/><circle cx="'+(wb[0]+2)+'" cy="'+(wb[1]-78)+'" r="30" fill="'+pal.tree[2]+'"/>');
      for(var j=0;j<14;j+=1){var x0=wb[0]-24+j*4;add('<path d="M'+x0+' '+(wb[1]-88+Math.abs(7-j)*2)+'q'+((j-7)*1.3)+' 32 '+((j-7)*1.8)+' '+(52+j%3*7)+'" stroke="'+pal.tree[j%2]+'" stroke-width="2.3" fill="none"/>');}add('</g>');
      var ks=(self.levelId==='3-2'||self.completed['3-2'])?s32:s12,fall=self.state.__lastCard==='wind';if(ks.kiteRaised)kite(3.55,7.2,false,-10,fall);else if(isSummer)kite(3.15,7.45,false,12,false);else if(ks.kite==='ice')kite(2.55,9.35,false,-8,fall);else if(ks.kite==='water')kite(2.55,9.45,true,75,fall);else kite(3.15,7.45,Boolean(ks.kiteWet),18,false);
      person(4.15,8.25,"#3f6fa8",self.levelId==='3-2');if(s32.elderHome||self.completed['3-2'])person(.95,10.6,"#657984",true);
    });
    I(11.8,function(){
      box(10.6,.1,0,1,1,.35,"#7d7d84","#5c5c64","#48484f");var c=P(11.1,.6,.35),rx=.32*S*1.2247,H=3.2*S;
      add('<path d="M'+(c[0]-rx)+' '+c[1]+'L'+(c[0]-rx*.7)+' '+(c[1]-H)+'L'+(c[0]+rx*.7)+' '+(c[1]-H)+'L'+(c[0]+rx)+' '+c[1]+'A'+rx+' '+(.32*S*.707)+' 0 0 1 '+(c[0]-rx)+' '+c[1]+'Z" fill="#f2ede4"/>');
      for(var j=0;j<3;j+=1){var y0=c[1]-H*(j*2+1)/7,y1=c[1]-H*(j*2+2)/7,w0=rx*(1-.3*(j*2+1)/7),w1=rx*(1-.3*(j*2+2)/7);add('<path d="M'+(c[0]-w0)+' '+y0+'L'+(c[0]-w1)+' '+y1+'L'+(c[0]+w1)+' '+y1+'L'+(c[0]+w0)+' '+y0+'Z" fill="#c9483b"/>');}
      var tp=[c[0],c[1]-H],lit=Boolean(s13.lamp||self.allLit);add('<rect x="'+(tp[0]-9)+'" y="'+(tp[1]-16)+'" width="18" height="16" fill="'+(lit?'#ffe6a6':'#3d4650')+'" stroke="#333"/><path d="M'+(tp[0]-12)+' '+(tp[1]-16)+'L'+tp[0]+' '+(tp[1]-28)+'L'+(tp[0]+12)+' '+(tp[1]-16)+'Z" fill="#2e2e36"/>');
      if(lit)add('<g class="'+(self.state.__lastCard==='thunder'?'town-light-pop ':'')+'town-lighthouse-light"><circle cx="'+tp[0]+'" cy="'+(tp[1]-8)+'" r="34" fill="url(#'+uid+'WinGlow)"/><g transform="translate('+tp[0]+' '+(tp[1]-8)+')"><g class="town-lighthouse-beam"><polygon points="0,-5 260,-40 260,40 0,5" fill="#ffe6a6" opacity=".18"/></g></g></g>');
      var boat=s13.boat==='home'?P(9.7,1.7,0):P(11.6,2.4,0);add('<g class="'+(s13.boat==='home'&&self.state.__lastCard==='wind'?'town-boat-home':'')+'"><g transform="translate('+boat[0]+' '+boat[1]+')"><path d="M-18 0h36l-7 9h-23z" fill="#754d3c"/><path d="M0 0v-25l14 20H0z" fill="#eee1c8"/></g></g>');
      if(s13.fog)add('<g class="town-svg-fog" filter="url(#'+uid+'Soft)" opacity=".75"><ellipse cx="'+(tp[0]+35)+'" cy="'+(tp[1]+25)+'" rx="110" ry="34" fill="#dce5e8"/></g>');
    });
    I(13.2,function(){
      var isCurrentIceShop=self.levelId==='2-1',isQuiet=isCurrentIceShop&&self.state.__failKey==='cloudy_no_customers',isMorningClosed=isCurrentIceShop&&self.state.__event==='sun_morning';
      var shopMood=s21.sold?'queue':isQuiet?'quiet':'idle';
      add('<g class="town-ice-shop town-ice-shop-mood-'+shopMood+(isQuiet?' town-ice-shop-quiet':'')+'" data-shop-mood="'+shopMood+'">');
      if(self.activeWeather==='thunder'){
        var hc=P(6.15,7.55,3.45);
        add('<g class="town-hail-clouds town-svg-fog" fill="#435462" opacity=".94"><ellipse class="town-hail-cloud-edge" cx="'+hc[0]+'" cy="'+(hc[1]+8)+'" rx="87" ry="25"/><circle cx="'+(hc[0]-48)+'" cy="'+hc[1]+'" r="28"/><circle cx="'+(hc[0]-12)+'" cy="'+(hc[1]-13)+'" r="39"/><circle cx="'+(hc[0]+34)+'" cy="'+(hc[1]-7)+'" r="34"/><circle cx="'+(hc[0]+63)+'" cy="'+(hc[1]+5)+'" r="24"/><path d="M'+(hc[0]-71)+' '+(hc[1]+15)+'q34 18 69 1t72 0" fill="none" stroke="#718493" stroke-width="4" opacity=".46"/></g>');
      }
      house({x:5.4,y:6.7,w:1.5,d:1.3,h:1.2,roof:1,lit:1,seed:7,rh:.6,doorU:.3});
      var shopFace=fy(5.4,6.7,0,1.5,1.3,1.2),shopSign=shopFace(.56,.79),shopName=esc(labels.iceShop||""),openLabel=esc(labels.open||"");
      var shopText=shopName+(s21.sold&&openLabel?(shopName?' · ':'')+openLabel:'');
      add('<g class="town-shop-sign" transform="matrix('+C+','+SN+',0,1,'+shopSign[0]+','+shopSign[1]+')"><rect x="-34" y="-11" width="68" height="21" rx="1.5" fill="'+shade(pal.wood[0],.78)+'" stroke="'+shade(pal.wood[1],.68)+'" stroke-width="1.5"/><path d="M-30-7H30M-30 6H30" stroke="'+shade(pal.wood[0],1.18)+'" stroke-width=".7" opacity=".42"/><circle cx="-28" cy="-5" r="1" fill="#d7ad70"/><circle cx="28" cy="5" r="1" fill="#d7ad70"/><text text-anchor="middle" dominant-baseline="middle" y="1" font-size="10" letter-spacing="1" fill="#f4ddb0" font-family="serif" font-weight="700">'+shopText+'</text></g>');
      var closedText=esc(labels.shopClosed||"");
      if(isMorningClosed&&closedText){
        var closedAt=shopFace(.39,.3);
        add('<g class="town-shop-closed-sign" data-shop-event="sun_morning" transform="matrix('+C+','+SN+',0,1,'+closedAt[0]+','+closedAt[1]+')"><path d="M-12-9V-3M12-9V-3" fill="none" stroke="#6f4c36" stroke-width="1"/><g class="town-shop-closed-board"><rect x="-21" y="-4" width="42" height="16" rx="2" fill="#f5dfb5" stroke="#76513a" stroke-width="1.2"/><text text-anchor="middle" y="7" font-size="8.5" letter-spacing=".7" fill="#6b392d" font-family="serif" font-weight="700">'+closedText+'</text></g></g>');
      }
      var b=P(6.4,8.4,0),content=s21.barrel||'empty',fill=(content==='water'||isQuiet)?pal.water:content==='ice'?'#708892':'#47332e';
      var barrel='<g class="town-barrel town-barrel-'+esc(content)+' '+(isQuiet?'town-barrel-melting ':'')+((self.state.__lastCard==='rain'||self.state.__lastCard==='snow'||self.state.__lastCard==='thunder')?'town-barrel-change':'')+'" data-barrel-content="'+esc(content)+'" data-barrel-visual="'+(isQuiet?'melting':esc(content))+'" style="filter:drop-shadow(0 2px 2px rgba(45,28,17,.48))">'+(isQuiet?'<ellipse class="town-melt-puddle" cx="'+b[0]+'" cy="'+(b[1]+10)+'" rx="21" ry="7" fill="'+pal.water+'" stroke="'+pal.waterHi+'" stroke-width=".8"/>':'')+(content==='ice'?'<ellipse cx="'+b[0]+'" cy="'+(b[1]-15)+'" rx="23" ry="14" fill="#d6f0f5" opacity=".18" filter="url(#'+uid+'Soft)"/>':'')+'<ellipse cx="'+b[0]+'" cy="'+(b[1]-13)+'" rx="14" ry="6" fill="'+pal.wood[0]+'" stroke="#f1d2a3" stroke-width="1.1"/><path d="M'+(b[0]-14)+' '+(b[1]-13)+'L'+(b[0]-12)+' '+(b[1]+6)+'Q'+b[0]+' '+(b[1]+13)+' '+(b[0]+12)+' '+(b[1]+6)+'L'+(b[0]+14)+' '+(b[1]-13)+'Z" fill="'+pal.wood[1]+'" stroke="'+shade(pal.wood[0],1.24)+'" stroke-width="1.05"/><path d="M'+(b[0]-9.5)+' '+(b[1]-10)+'L'+(b[0]-8.2)+' '+(b[1]+3)+'" fill="none" stroke="#f5d4a4" stroke-width="1.15" stroke-linecap="round" opacity=".78"/><ellipse cx="'+b[0]+'" cy="'+(b[1]-13)+'" rx="11" ry="4.6" fill="'+fill+'" stroke="'+(content==='ice'?'#d8edf1':'#edc38c')+'" stroke-width="1.45"/>'+(content==='water'||isQuiet?'<path d="M'+(b[0]-7)+' '+(b[1]-14)+'q7-3 14 0" fill="none" stroke="#d7f5ff" stroke-width="1.2" opacity=".75"/>':'');
      if(content==='ice'){
        barrel+='<g class="town-hail-pile">';
        [[-7,-13,2.5],[-3,-15,2.8],[2,-14,3],[7,-13,2.4],[-5,-10.5,2.8],[.5,-10.8,3],[6,-10.5,2.6],[0,-17,2.7]].forEach(function(v,n){barrel+='<circle class="town-hailstone" data-hailstone="'+n+'" cx="'+(b[0]+v[0])+'" cy="'+(b[1]+v[1])+'" r="'+v[2]+'" fill="'+(n%3===0?'#ffffff':n%3===1?'#dceff3':'#edf7f8')+'" stroke="#9bbdca" stroke-width=".55"/>';});
        barrel+='</g>';
        if(isQuiet)barrel+='<circle class="town-melt-drop" cx="'+(b[0]-5)+'" cy="'+(b[1]-9)+'" r="1.5" fill="#bce6f2"/><circle class="town-melt-drop" cx="'+(b[0]+5)+'" cy="'+(b[1]-11)+'" r="1.35" fill="#d8f2f7" style="animation-delay:-.48s"/>';
      }
      barrel+='<ellipse cx="'+b[0]+'" cy="'+(b[1]+7)+'" rx="12" ry="4.5" fill="'+shade(pal.wood[1],.86)+'"/><path d="M'+(b[0]-13)+' '+(b[1]-3)+'h26" stroke="#c29362" stroke-width="2" opacity=".75"/></g>';add(barrel);
      if(isCurrentIceShop){
        var statusContent=isQuiet?'water':content,statusLabels={empty:labels.barrelEmpty,water:labels.barrelWater,ice:labels.barrelIce},statusText=esc(statusLabels[statusContent]||"");
        var statusIcon=statusContent==='water'?'<path d="M-10-7C-15-1-15 4-10 7C-5 4-5-1-10-7Z" fill="#67b8d2" stroke="#337a94" stroke-width=".8"/>':statusContent==='ice'?'<polygon points="-10,-7 -4,-3 -5,5 -11,8 -16,1" fill="#dff5f8" stroke="#739eac" stroke-width=".8"/><path d="M-10-7L-9 5M-16 1L-4-3" fill="none" stroke="#fff" stroke-width=".7" opacity=".82"/>':'<circle cx="-10" cy="0" r="6" fill="none" stroke="#8c6545" stroke-width="1.4"/><path d="M-14 4L-6-4" stroke="#b2865f" stroke-width="1" opacity=".72"/>';
        add('<g class="town-barrel-status town-barrel-status-'+esc(statusContent)+'" data-barrel-status="'+esc(statusContent)+'" data-barrel-simulated-status="'+esc(content)+'" data-status-label="'+statusText+'" transform="translate('+(b[0]+31)+' '+(b[1]-25)+')"><g class="town-barrel-status-card"><path d="M-20-12H24V11H-20V5L-25 8L-20 0Z" fill="#fff0cf" stroke="#785139" stroke-width="1.2"/><circle cx="20" cy="-8" r="1" fill="#bc8753"/>'+statusIcon+'<text class="town-barrel-status-label" x="8" y="4" text-anchor="middle" font-size="10" fill="#593b2b" font-family="serif" font-weight="700">'+statusText+'</text></g></g>');
      }
      if(self.activeWeather==='thunder'){
        var hailMarkup='<g class="town-hail-at-barrel">';
        for(var hi=0;hi<10;hi+=1){var hx=b[0]-9+(hi%5)*4.4,hy=b[1]-15-(hi%3)*3;hailMarkup+='<circle class="town-hail-fall" cx="'+hx+'" cy="'+hy+'" r="'+(1.7+hi%3*.45)+'" fill="#f8fdff" stroke="#b9dbe6" stroke-width=".55" style="animation-delay:-'+(hi*.09).toFixed(2)+'s;animation-duration:'+(0.58+(hi%4)*.08).toFixed(2)+'s"/>';}
        [[-1,-8,-14,-18],[-.17,7,13,17],[-.39,-6,-11,-15]].forEach(function(v,hi){hailMarkup+='<circle class="town-hail-bounce" cx="'+(b[0]+(hi-1)*4)+'" cy="'+(b[1]-13)+'" r="2.2" fill="#fff" stroke="#add0dc" stroke-width=".5" style="--hail-bx:'+v[1]+'px;--hail-bx2:'+v[2]+'px;--hail-bx3:'+v[3]+'px;animation-delay:'+v[0]+'s"/>';});
        add(hailMarkup+'</g>');
      }
      if(s21.sold){add('<g class="town-ice-shop-queue" data-queue-count="4">');for(var j=0;j<4;j+=1)person(5.1+j*.28,8.55+j*.08,j%2?'#c26c64':'#608b88',false);add('</g>');}
      add('</g>');
    });
    if(hasReached("2-2"))I(13.0,function(){
      var arch=P(9.3,3.65,0);add('<g class="town-wedding"><path d="M'+(arch[0]-34)+' '+(arch[1]+10)+'V'+(arch[1]-36)+'Q'+arch[0]+' '+(arch[1]-75)+' '+(arch[0]+34)+' '+(arch[1]-36)+'V'+(arch[1]+10)+'" fill="none" stroke="#eee2d1" stroke-width="6"/>');for(var j=0;j<8;j+=1)add('<circle cx="'+(arch[0]-32+j*9)+'" cy="'+(arch[1]-38-Math.sin(j/7*Math.PI)*27)+'" r="4" fill="'+(j%2?'#f1d7a6':'#d78884')+'"/>');add('</g>');person(9.05,4.0,"#eee2d1",false);person(9.4,3.92,"#5a7478",false);
      if(s22.clouds)add('<g class="town-svg-fog" fill="#536a74" opacity=".82"><ellipse cx="760" cy="172" rx="82" ry="24"/><circle cx="720" cy="161" r="30"/><circle cx="780" cy="156" r="36"/></g>');
      if(s22.rainbow&&!isWinter)add('<g class="town-rainbow" fill="none" opacity=".88"><path d="M660 340Q820 112 1010 322" stroke="#cf7670" stroke-width="13"/><path d="M674 340Q824 134 996 322" stroke="#e9b967" stroke-width="13"/><path d="M688 340Q828 156 982 322" stroke="#83aa91" stroke-width="13"/><path d="M702 340Q832 178 968 322" stroke="#789caf" stroke-width="13"/></g>');
    });
    if(hasReached("2-3"))I(17.7,function(){
      var a=P(9.8,7.1,0),b=P(11.4,7.1,0),a2=P(9.8,7.1,1.3),b2=P(11.4,7.1,1.3);add('<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+a2[0]+'" y2="'+a2[1]+'" stroke="'+pal.wood[1]+'" stroke-width="3"/><line x1="'+b[0]+'" y1="'+b[1]+'" x2="'+b2[0]+'" y2="'+b2[1]+'" stroke="'+pal.wood[1]+'" stroke-width="3"/>');
      var screenX=(a2[0]+b2[0])/2,screenY=(a2[1]+b2[1])/2+15;
      if(s23.fogScreen)add('<g class="town-svg-fog town-fog-screen"><ellipse cx="'+screenX+'" cy="'+screenY+'" rx="76" ry="49" fill="#edf3ed" opacity=".5" filter="url(#'+uid+'Soft)"/><ellipse cx="'+screenX+'" cy="'+screenY+'" rx="61" ry="39" fill="#edf3ed" opacity=".68"/><path d="M'+(screenX-52)+' '+(screenY+31)+'Q'+screenX+' '+(screenY+39)+' '+(screenX+52)+' '+(screenY+31)+'" fill="none" stroke="#fff" stroke-width="2" opacity=".62"/></g>');else poly([P(9.85,7.1,.45),P(11.35,7.1,.45),P(11.35,7.1,1.25),P(9.85,7.1,1.25)],"#e8e1d2",'opacity=".9"');
      if(s23.power&&s23.fogScreen){add('<polygon points="'+pts([P(8.8,8.35,.42),P(9.95,7.1,1.25),P(11.45,7.1,.38)])+'" fill="#f6dc8f" opacity=".3"/><g class="town-movie" opacity=".74"><rect x="'+(screenX-43)+'" y="'+(screenY-27)+'" width="86" height="57" rx="7" fill="#dce8dc" opacity=".26"/><circle cx="'+(screenX-23)+'" cy="'+(screenY-11)+'" r="7" fill="#ead39a" opacity=".8"/><path d="M'+(screenX-42)+' '+(screenY+18)+'Q'+(screenX-18)+' '+(screenY+4)+' '+screenX+' '+(screenY+18)+'T'+(screenX+42)+' '+(screenY+17)+'" fill="#6f8e89" opacity=".42"/><path d="M'+(screenX-16)+' '+(screenY+18)+'h35l-8 8h-19z" fill="#72584c"/><path d="M'+(screenX+2)+' '+(screenY+18)+'L'+(screenX+2)+' '+(screenY-7)+'L'+(screenX+19)+' '+(screenY+15)+'Z" fill="#f2e6c9"/><path d="M'+(screenX-38)+' '+(screenY+27)+'q16-5 31 0t32 0t29 0" fill="none" stroke="#f5f0da" stroke-width="1.6" opacity=".72"/></g>');}
      if(self.state.__failKey!=='rain_audience')[[9.9,8.0],[10.6,8.0],[11.3,8.0],[9.65,8.65],[10.3,8.65],[10.95,8.65],[11.6,8.65]].forEach(function(v,j){person(v[0],v[1],j%3===0?'#b96d66':j%3===1?'#6d8f8b':'#c39d67',false);});
    });
    I(19.5,function(){
      house({x:9.4,y:9,w:1.8,d:1.6,h:2,roof:3,lit:Boolean(s33.sunrise||self.allLit),seed:6,chimney:1,winsL:[[.15,.5],[.66,.5]],winsR:[[.4,.5]]});
      var f=fy(9.4,9,0,1.8,1.6,2),label=f(.23,.86),roomLabel=esc(labels.room707||"");
      add('<g transform="matrix('+C+','+SN+',0,1,'+label[0]+','+label[1]+')"><rect x="-19" y="-12" width="38" height="20" rx="2" fill="#4d3f3b" opacity=".9"/><text text-anchor="middle" y="3" font-size="12" fill="#ffdc9a" font-family="monospace" font-weight="700">'+roomLabel+'</text></g>');
      if(s33.sunrise){var q=f(.73,.64);add('<circle cx="'+q[0]+'" cy="'+q[1]+'" r="38" fill="url(#'+uid+'WinGlow)"/><g class="town-window-open" transform="matrix('+C+','+SN+',0,1,'+q[0]+','+q[1]+')"><rect x="-14" y="-17" width="28" height="34" rx="2" fill="#394451" stroke="#f5d88e" stroke-width="2"/><path d="M-14-16L-27-11V14L-14 17ZM14-16L27-11V14L14 17Z" fill="#8d654b" stroke="#5e4234" stroke-width="1.2"/><circle cy="-5" r="5.5" fill="#d5b49c"/><path d="M-8 4q8-9 16 0l5 16h-26z" fill="#76635d"/></g>');}
    });
    I(7.3,function(){house({x:5.9,y:.2,w:1.4,d:1.2,h:1.4,roof:1,lit:1,seed:2,chimney:1});});I(7.7,function(){house({x:.4,y:6.3,w:1.3,d:1.2,h:1.2,roof:2,lit:1,seed:3,chimney:1});});
    [[1.2,4.1,1,0],[2.6,4.2,.8,1],[6.8,3.6,.9,0],[7.3,1.3,.9,1],[.6,10.9,1,1],[5.2,11.3,.8,0],[7.2,10.6,.9,1],[10.8,4.1,.8,0],[11.3,11.2,.9,1],[7.55,9.45,.5,0],[3.6,.4,.8,1]].forEach(function(v){I(v[0]+v[1],function(){tree(v[0],v[1],v[2],v[3]);});});
    [[2,4.9],[5,4.9],[10.5,4.9],[7.5,6.15],[3.5,6.15]].forEach(function(v){I(v[0]+v[1],function(){lamp(v[0],v[1]);});});
    items.sort(function(a,b){return a[0]-b[0];}).forEach(function(item){item[1]();});
    if(isWinter){
      [[1.1,4.7,28,8],[4.6,1.1,24,7],[6.7,8.7,30,9],[10.8,5.5,25,7],[3.9,11.15,34,8]].forEach(function(v){var drift=P(v[0],v[1],.025);add('<ellipse class="town-snow-cover" cx="'+drift[0]+'" cy="'+drift[1]+'" rx="'+v[2]+'" ry="'+v[3]+'" fill="#fff" opacity=".42"/>');});
    }
    return out.join("");
  };

  TownRenderer.prototype.showEndingRoom = function (options) {
    options = options || {}; this.transitionToken += 1; this.stopWeather(); this._clearEndingMode();
    this.hospital = true; this.hospitalState = Object.assign({ badgeClear: false, motherTurned: false, lampOn: false, radioOn: false, cardClear: false }, this.hospitalState || {}, options.state || {});
    if (options.badgeClear != null) this.hospitalState.badgeClear = Boolean(options.badgeClear);
    this.finalePhase = null; this.season = "winter"; this.fogProgress = 0; this.root.classList.add("town-hospital-mode"); this.root.classList.toggle("town-badge-clear", Boolean(this.hospitalState.badgeClear));
    this._syncHospitalState();
    this.roomWash.style.opacity = "1"; this.world.style.opacity = "1"; this.drawSky(); this._renderHospital();
    var roomZoom=options.zoom||((this.root.clientWidth||window.innerWidth)<=820?1.34:1.58);
    this.focus({x:6.15,y:6.15,z:.9,zoom:roomZoom},{instant:options.instant}); return this;
  };
  TownRenderer.prototype.setHospitalState = function (state) {
    state = state || {}; var needsRender = Object.keys(state).some(function (key) { return key !== "badgeClear" && key !== "motherTurned"; });
    this.hospitalState = Object.assign({}, this.hospitalState || {}, state);
    this._syncHospitalState();
    if (this.hospital && needsRender) this._renderHospital();
    return this;
  };
  TownRenderer.prototype._syncHospitalState = function () {
    var state = this.hospitalState || {};
    this.root.classList.toggle("town-badge-clear", Boolean(state.badgeClear));
    this.root.classList.toggle("town-mother-turned", Boolean(state.motherTurned));
    this.root.setAttribute("data-town-mother-turned", String(Boolean(state.motherTurned)));
    this.root.setAttribute("data-town-hospital-lamp", state.lampOn ? "on" : "off");
    this.root.setAttribute("data-town-hospital-radio", state.radioOn ? "on" : "off");
    this.root.setAttribute("data-town-hospital-card", state.cardClear ? "full" : "room");
    return this;
  };
  TownRenderer.prototype.setHospitalBadgeClear = function (clear) { return this.setHospitalState({ badgeClear: clear !== false }); };
  TownRenderer.prototype.setHospitalMotherTurned = function (turned) { return this.setHospitalState({ motherTurned: turned !== false }); };
  TownRenderer.prototype.transitionToHospital = function (options) {
    options = options || {}; var self = this, token = ++this.transitionToken;
    var reduced = options.reducedMotion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches);
    var duration = reduced ? 220 : Math.max(700, Number(options.duration) || 3200);
    var shrinkTime = Math.round(duration * .56), revealTime = duration - shrinkTime;
    this.hospitalState = Object.assign({ badgeClear: false, motherTurned: false, lampOn: false, radioOn: false, cardClear: false }, this.hospitalState || {}, options.state || {});
    if (options.badgeClear != null) this.hospitalState.badgeClear = Boolean(options.badgeClear);
    this.stopWeather(); this.root.style.setProperty("--town-room-duration", duration + "ms"); this.root.classList.add("town-ending-shrink");
    this.roomWash.style.opacity = "1"; this.stars.style.opacity = "0";
    this.sky.style.transition = "background " + duration + "ms ease,filter " + duration + "ms ease";
    this.sky.style.background = "radial-gradient(ellipse 90% 78% at 62% 24%,#fffdf7 0%,#f1e8dc 58%,#d8cabc 100%)";
    this.world.style.transition = "transform " + shrinkTime + "ms var(--town-ease),opacity " + shrinkTime + "ms ease,filter " + shrinkTime + "ms ease";
    this.world.style.transform = "translate(-50%,-50%) scale(.43)"; this.world.style.opacity = ".12";
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        if (token !== self.transitionToken) { resolve({ cancelled: true }); return; }
        self.hospital = true; self.hospitalState = Object.assign({ badgeClear: false, motherTurned: false, lampOn: false, radioOn: false, cardClear: false }, self.hospitalState || {});
        self.finalePhase = null; self.season = "winter"; self.fogProgress = 0; self._clearFinaleClasses();
        self.root.classList.add("town-hospital-mode"); self._syncHospitalState();
        self.drawSky(); self._renderHospital(); void self.world.offsetWidth;
        window.requestAnimationFrame(function () {
          if (token !== self.transitionToken) return;
          self.world.style.transition = "transform " + revealTime + "ms var(--town-ease),opacity " + revealTime + "ms ease";
          var roomZoom=options.zoom||((self.root.clientWidth||window.innerWidth)<=820?1.34:1.58);
          self.world.style.opacity = "1"; self.focus({x:6.15,y:6.15,z:.9,zoom:roomZoom});
        });
      }, shrinkTime);
      window.setTimeout(function () {
        if (token === self.transitionToken) { self.root.classList.remove("town-ending-shrink"); self.world.style.transition = ""; }
        resolve({ cancelled: token !== self.transitionToken, hospital: token === self.transitionToken });
      }, duration + 40);
    });
  };
  TownRenderer.prototype._renderHospital = function () {
    var labels=this.labels||{},state=this.hospitalState||{},uid=this.uid,out=[],bedsideCard=esc((state.cardClear&&labels.bedsideCard)||labels.room707||""),radioStation=esc(labels.radioStation||labels.stationName||""),radioFrequency=esc(labels.radioFrequency||labels.frequency||""),badgeName=esc(labels.badgeName||""),p=function(a,f,e){out.push('<polygon points="'+pts(a)+'" fill="'+f+'" '+(e||'')+'/>');};
    function line(a,b,color,width,extra){out.push('<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+color+'" stroke-width="'+width+'" '+(extra||'')+'/>');}
    function bx(x,y,z,w,d,h,top,left,right){p([P(x,y,z+h),P(x+w,y,z+h),P(x+w,y+d,z+h),P(x,y+d,z+h)],top);p([P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)],left);p([P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)],right);}
    out.push('<defs><radialGradient id="'+uid+'WinGlow"><stop stop-color="#ffd98a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient><linearGradient id="'+uid+'Blanket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b7c8c8"/><stop offset="1" stop-color="#7e979d"/></linearGradient><linearGradient id="'+uid+'WindowSky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b9dce8"/><stop offset=".62" stop-color="#eaf0ea"/><stop offset="1" stop-color="#f8f6ea"/></linearGradient><radialGradient id="'+uid+'MorningSun"><stop stop-color="#fff8d5"/><stop offset=".36" stop-color="#ffe7a1" stop-opacity=".85"/><stop offset="1" stop-color="#ffe7a1" stop-opacity="0"/></radialGradient><filter id="'+uid+'Shadow"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-opacity=".24"/></filter><filter id="'+uid+'SoftGlow"><feGaussianBlur stdDeviation="9"/></filter></defs>');
    p([P(1,2,0),P(11,2,0),P(11,10,0),P(1,10,0)],'#e7dfd3','filter="url(#'+uid+'Shadow)"');
    for(var tile=2;tile<11;tile+=2){line(P(tile,2,.01),P(tile,10,.01),'#c9beb0','1','opacity=".28"');}
    for(tile=4;tile<10;tile+=2){line(P(1,tile,.01),P(11,tile,.01),'#d1c7ba','1','opacity=".24"');}
    p([P(1,2,0),P(11,2,0),P(11,2,4),P(1,2,4)],'#f0e9df');p([P(11,2,0),P(11,10,0),P(11,10,4),P(11,2,4)],'#d9cec0');
    var windowFace=function(u,v){return P(1+u*10,2,v*4);},w0=windowFace(.57,.33),w1=windowFace(.91,.33),w2=windowFace(.91,.83),w3=windowFace(.57,.83);
    out.push('<defs><clipPath id="'+uid+'WindowClip"><polygon points="'+pts([w0,w1,w2,w3])+'"/></clipPath></defs>');
    p([w0,w1,w2,w3],'url(#'+uid+'WindowSky)','stroke="#f8f4ea" stroke-width="9"');
    var winTop=Math.min(w2[1],w3[1]),winBottom=Math.max(w0[1],w1[1]),winLeft=Math.min(w0[0],w3[0]),winRight=Math.max(w1[0],w2[0]),sun=[w2[0]-25,winTop+23];
    out.push('<g clip-path="url(#'+uid+'WindowClip)"><circle cx="'+sun[0]+'" cy="'+sun[1]+'" r="48" fill="url(#'+uid+'MorningSun)"/><circle cx="'+sun[0]+'" cy="'+sun[1]+'" r="12" fill="#fff3c4"/><path d="M'+(winLeft-8)+' '+(winBottom-10)+'Q'+(winLeft+34)+' '+(winTop+43)+' '+(winLeft+76)+' '+(winBottom-9)+'T'+(winRight+15)+' '+(winBottom-13)+'V'+(winBottom+12)+'H'+(winLeft-8)+'Z" fill="#adc8d0" opacity=".72"/><path d="M'+(winLeft-8)+' '+(winBottom-18)+'Q'+(winLeft+36)+' '+(winTop+35)+' '+(winLeft+80)+' '+(winBottom-17)+'T'+(winRight+15)+' '+(winBottom-21)+'V'+(winBottom+12)+'H'+(winLeft-8)+'Z" fill="#f9fbf8"/><path d="M'+(winLeft-6)+' '+(winBottom-7)+'q34-16 68 0t70 0" fill="none" stroke="#9ebdc8" stroke-width="3" opacity=".78"/><path d="M'+(winLeft+22)+' '+(winBottom-6)+'v-34m-12 24l12-28 12 28" fill="#738b80" stroke="#647b72" stroke-width="3"/><path d="M'+(winLeft+10)+' '+(winBottom-30)+'q12-8 24 0M'+(winRight-40)+' '+(winBottom-24)+'q14-7 28 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>');
    line(windowFace(.74,.33),windowFace(.74,.83),'#f4f0e7','5');line(windowFace(.57,.58),windowFace(.91,.58),'#f4f0e7','5');
    p([w0,w1,P(9.7,7.05,.03),P(6.35,6.25,.03)],'#f7d993','opacity=".095"');
    // 病床、被褥、护栏和点滴架继续沿用等距盒体语言。
    // 六个主要物件都保留稳定的 data-ward-element，供全视口空间关系回归检查。
    out.push('<g class="town-hospital-bed" data-ward-element="bed" data-ward-x="3" data-ward-y="5" data-ward-w="5" data-ward-d="2.45" data-head-x="3" data-foot-x="8">');
    p([P(2.9,4.92,.015),P(8.12,4.92,.015),P(8.12,7.55,.015),P(2.9,7.55,.015)],'#5b5147','opacity=".13"');
    bx(3.0,5.0,.05,5.0,2.45,.45,'#e8eeeb','#c3cecc','#aebdbc');
    p([P(3.18,5.18,.54),P(7.78,5.18,.54),P(7.78,7.28,.54),P(3.18,7.28,.54)],'#f6f3ea');
    p([P(4.55,5.2,.57),P(7.75,5.2,.57),P(7.75,7.25,.57),P(4.55,7.25,.57)],'url(#'+uid+'Blanket)');
    p([P(3.3,5.28,.6),P(4.55,5.28,.6),P(4.55,6.82,.6),P(3.3,6.82,.6)],'#fffaf0','class="town-hospital-pillow" data-ward-anchor="pillow" stroke="#d8d8cf" stroke-width="2"');
    line(P(5.35,5.24,.6),P(5.35,7.2,.6),'#d9e3e2','1.6','opacity=".58"');line(P(6.35,5.24,.6),P(6.35,7.2,.6),'#d9e3e2','1.6','opacity=".44"');
    line(P(3.0,5.0,.12),P(3.0,5.0,1.15),'#75878b','5');line(P(3.0,7.45,.12),P(3.0,7.45,1.15),'#75878b','5');line(P(3.0,5.0,1.07),P(3.0,7.45,1.07),'#879a9d','4');
    out.push('<g class="town-hospital-footboard" data-ward-anchor="footboard">');
    line(P(7.98,5.0,.12),P(7.98,5.0,.9),'#77898d','4');line(P(7.98,7.45,.12),P(7.98,7.45,.9),'#77898d','4');line(P(7.98,5.0,.82),P(7.98,7.45,.82),'#91a1a4','3');
    out.push('</g>');
    out.push('</g>');
    var patient=P(4.18,6.03,.76);out.push('<g class="town-hospital-patient" transform="translate('+patient[0]+' '+patient[1]+')"><ellipse cx="19" cy="20" rx="35" ry="23" transform="rotate(29 19 20)" fill="#fffaf0" stroke="#d8d8cf" stroke-width="1.5"/><path d="M-9 3Q8-3 23 12L52 45Q28 50 4 47L-19 26Q-18 13-9 3Z" fill="#d9e4e4" stroke="#b6c8c8" stroke-width="1.2"/><path d="M8 10Q20 17 29 31" fill="none" stroke="#b1c5c6" stroke-width="3" stroke-linecap="round"/><path d="M-2-1L7 5L4 13L-7 8Z" fill="#d5b49c"/><g class="town-hospital-head"><g class="town-hospital-face-side"><path d="M-11-29Q1-38 11-29Q15-25 14-19L20-14L14-10Q12 2 0 3Q-11 2-14-11Q-16-23-11-29Z" fill="#d5b49c"/><path d="M-12-28Q0-42 14-29Q4-33-3-25Q-12-20-12-7Q-19-18-12-28Z" fill="#d8d6cf"/><circle cx="10" cy="-18" r="1.35" fill="#655950"/><path d="M11-8q3 2 6 0" fill="none" stroke="#8f6259" stroke-width="1" stroke-linecap="round"/></g><g class="town-hospital-face-front"><ellipse cy="-15" rx="13" ry="16" fill="#d5b49c"/><path d="M-13-18Q-9-34 2-34Q13-32 14-18Q8-27 0-26Q-8-26-13-18Z" fill="#d8d6cf"/><circle cx="-4.7" cy="-16" r="1.25" fill="#655950"/><circle cx="4.7" cy="-16" r="1.25" fill="#655950"/><path d="M-3-8q3 2 6 0" fill="none" stroke="#8f6259" stroke-width="1" stroke-linecap="round"/></g></g></g>');
    var iv=P(2.55,5.1,0);out.push('<g class="town-hospital-iv" data-ward-element="iv">');line(iv,P(2.55,5.1,2.65),'#6e7e81','3');var ivTop=P(2.55,5.1,2.65);out.push('<path d="M'+(ivTop[0]-16)+' '+ivTop[1]+'h32M'+ivTop[0]+' '+ivTop[1]+'v12" stroke="#6e7e81" stroke-width="3" fill="none"/><rect x="'+(ivTop[0]+7)+'" y="'+(ivTop[1]+8)+'" width="16" height="25" rx="4" fill="#dceef0" stroke="#91a6a9"/><path d="M'+(ivTop[0]+15)+' '+(ivTop[1]+33)+'q2 38 35 62" fill="none" stroke="#9bb1b5" stroke-width="1.4"/></g>');

    // 床头卡居中挂在床尾栏板上；先只露出房号，对应字幕出现时再显示完整姓名。
    var cardTopA=P(8.005,5.53,.72),cardTopB=P(8.005,6.92,.72),cardBottomB=P(8.005,6.92,.22),cardBottomA=P(8.005,5.53,.22),cardCenter=P(8.005,6.225,.47),hookA=P(8.005,5.78,.84),hookB=P(8.005,6.67,.84),cardClass='town-hospital-room-card'+(state.cardClear?' is-clear':'');
    out.push('<g class="'+cardClass+'" data-ward-element="bed-card" data-ward-x="8.005" data-ward-y="6.225" data-card-text="'+bedsideCard+'"><title>'+bedsideCard+'</title><path d="M'+hookA[0]+' '+hookA[1]+'q-3 5 0 10M'+hookB[0]+' '+hookB[1]+'q-3 5 0 10" fill="none" stroke="#9b7b56" stroke-width="1.5"/>');p([cardTopA,cardTopB,cardBottomB,cardBottomA],'#f5ead6','stroke="#c6a77a" stroke-width="1.8"');out.push('<text transform="matrix('+C+',-'+SN+',0,1,'+cardCenter[0]+','+cardCenter[1]+')" text-anchor="middle" y="4.5" fill="#4f4035" font-family="monospace" font-size="12" font-weight="700"'+(state.cardClear?' textLength="47" lengthAdjust="spacingAndGlyphs"':'')+'>'+bedsideCard+'</text></g>');

    // 柜子移到枕头旁的观众侧长边，和床架之间保留清楚的地面缝隙。
    var tableX=3.38,tableY=7.78,tableW=1.62,tableD=1.34;
    out.push('<g class="town-hospital-bedside-table" data-ward-element="bedside-table" data-ward-x="'+tableX+'" data-ward-y="'+tableY+'" data-ward-w="'+tableW+'" data-ward-d="'+tableD+'">');
    p([P(tableX-.08,tableY+.04,.018),P(tableX+tableW+.1,tableY+.04,.018),P(tableX+tableW+.1,tableY+tableD+.12,.018),P(tableX-.08,tableY+tableD+.12,.018)],'#594536','opacity=".17"');
    bx(tableX,tableY,.05,tableW,tableD,.9,'#a88968','#84674f','#705540');
    line(P(tableX+.03,tableY+tableD,.53),P(tableX+tableW-.03,tableY+tableD,.53),'#5f4737','1.2','opacity=".55"');var drawerKnob=P(tableX+tableW*.5,tableY+tableD,.52);out.push('<circle cx="'+drawerKnob[0]+'" cy="'+drawerKnob[1]+'" r="2" fill="#cfb18b"/></g>');

    // 收音机和夜灯跟随床头柜落位，彼此留有独立轮廓。
    var radioX=3.5,radioY=7.92,radioClass='town-hospital-radio'+(state.radioOn?' is-on':''),radioCenter=P(radioX+.51,radioY+.565,1.24),radioDial=P(radioX+.82,radioY+.565,1.18);
    out.push('<g class="'+radioClass+'" data-ward-element="radio" data-ward-x="'+radioX+'" data-ward-y="'+radioY+'" data-ward-w="1.02" data-ward-d=".56" data-frequency="'+radioFrequency+'"><title>'+radioStation+' '+radioFrequency+'</title>');
    bx(radioX,radioY,.96,1.02,.56,.6,'#8b5c3c','#69442f','#533424');
    p([P(radioX+.03,radioY+.565,1.02),P(radioX+.99,radioY+.565,1.02),P(radioX+.99,radioY+.565,1.49),P(radioX+.03,radioY+.565,1.49)],'#5d3b2a','stroke="#3f291f" stroke-width="1.5"');
    p([P(radioX+.08,radioY+.568,1.3),P(radioX+.93,radioY+.568,1.3),P(radioX+.93,radioY+.568,1.42),P(radioX+.08,radioY+.568,1.42)],'#e3c384','class="town-hospital-radio-dial" stroke="#f4dfa9" stroke-width="1"');
    out.push('<g transform="matrix('+C+','+SN+',0,1,'+radioCenter[0]+','+radioCenter[1]+')"><text x="0" y="-1" text-anchor="middle" fill="#59402e" font-family="serif" font-size="4.3" font-weight="700">'+radioStation+'</text><text x="0" y="11" text-anchor="middle" fill="#f0d39b" font-family="monospace" font-size="6.6" font-weight="700">'+radioFrequency+'</text></g><circle cx="'+radioDial[0]+'" cy="'+radioDial[1]+'" r="3.5" fill="#d7b06e" stroke="#3f291f" stroke-width="1.3"/>');
    line(P(radioX+.12,radioY+.06,1.54),P(radioX-.14,radioY-.02,2.02),'#514235','2','stroke-linecap="round"');out.push('</g>');

    var lampClass='town-hospital-lamp town-bedside-lamp'+(state.lampOn?' is-on':''),lampFootX=4.56,lampFootY=8.02,lampBase=P(4.72,8.18,.97),lampTop=P(4.72,8.18,1.92);
    out.push('<g class="'+lampClass+'" data-ward-effect="lamp-glow"><circle class="town-hospital-lamp-glow" cx="'+lampTop[0]+'" cy="'+(lampTop[1]+7)+'" r="43" fill="url(#'+uid+'WinGlow)"/><g class="town-hospital-lamp-body" data-ward-element="lamp" data-ward-x="'+lampFootX+'" data-ward-y="'+lampFootY+'" data-ward-w=".32" data-ward-d=".32">');
    line(lampBase,lampTop,'#806247','3.2','stroke-linecap="round"');out.push('<ellipse cx="'+lampBase[0]+'" cy="'+lampBase[1]+'" rx="13" ry="5.2" fill="#8a6a4d" stroke="#674b37" stroke-width="1.5"/><path d="M'+(lampTop[0]-9)+' '+(lampTop[1]-5)+'L'+(lampTop[0]-19)+' '+(lampTop[1]+20)+'Q'+lampTop[0]+' '+(lampTop[1]+26)+' '+(lampTop[0]+19)+' '+(lampTop[1]+20)+'L'+(lampTop[0]+9)+' '+(lampTop[1]-5)+'Z" fill="'+(state.lampOn?'#f4d39a':'#cbbda8')+'" stroke="#90765d" stroke-width="1.8"/><ellipse cx="'+lampTop[0]+'" cy="'+(lampTop[1]+19)+'" rx="17" ry="5.2" fill="'+(state.lampOn?'#ffe7ad':'#b6aa99')+'" opacity=".92"/></g></g>');
    var badgePoint=function(u,v){return P(3.53+u*.75,8.67+v*.43,.98);},badgeCenter=badgePoint(.53,.52),badgePhoto=badgePoint(.18,.5);
    out.push('<g class="town-hospital-badge">');p([badgePoint(0,0),badgePoint(1,0),badgePoint(1,1),badgePoint(0,1)],'#f7eedc','stroke="#b99e79" stroke-width="1.5"');p([badgePoint(.07,.14),badgePoint(.32,.14),badgePoint(.32,.86),badgePoint(.07,.86)],'#b8c6c5');out.push('<g transform="matrix('+C+','+SN+',-'+C+','+SN+','+badgePhoto[0]+','+badgePhoto[1]+')"><circle cy="-2" r="3" fill="#8d9e9c"/><path d="M-5 5q5-8 10 0" fill="#8d9e9c"/></g><g class="town-badge-copy" transform="matrix('+C+','+SN+',-'+C+','+SN+','+badgeCenter[0]+','+badgeCenter[1]+')"><text x="5" y="-1" text-anchor="middle" font-family="serif" font-size="3.8" font-weight="700" fill="#68544a">'+badgeName+'</text><path d="M-2 4H13M0 7H11" stroke="#9f8c7d" stroke-width=".8" opacity=".7"/></g></g>');

    // 椅子紧挨柜子、开口朝床，沿同一长边向床尾稍移；来信继续留在椅面。
    var chairX=5.3,chairY=7.82,chairW=1.28,chairD=.92;
    out.push('<g class="town-hospital-chair" data-ward-element="chair" data-ward-x="'+chairX+'" data-ward-y="'+chairY+'" data-ward-w="'+chairW+'" data-ward-d="'+chairD+'" data-ward-facing="bed" aria-hidden="true">');
    p([P(chairX-.06,chairY+.06,.016),P(chairX+chairW+.08,chairY+.06,.016),P(chairX+chairW+.08,chairY+chairD+.1,.016),P(chairX-.06,chairY+chairD+.1,.016)],'#594536','opacity=".15"');
    [[.12,.12],[chairW-.12,.12],[.12,chairD-.12],[chairW-.12,chairD-.12]].forEach(function(v){line(P(chairX+v[0],chairY+v[1],.05),P(chairX+v[0],chairY+v[1],.63),'#6c4932','4.4','stroke-linecap="round"');});
    line(P(chairX+.08,chairY+chairD-.08,.58),P(chairX+.08,chairY+chairD-.08,1.56),'#69472f','5.2','stroke-linecap="round"');
    line(P(chairX+chairW-.08,chairY+chairD-.08,.58),P(chairX+chairW-.08,chairY+chairD-.08,1.56),'#69472f','5.2','stroke-linecap="round"');
    bx(chairX,chairY,.57,chairW,chairD,.18,'#b88a5d','#8c613f','#765037');
    out.push('<g class="town-hospital-chair-back">');
    line(P(chairX+.08,chairY+chairD-.055,1.49),P(chairX+chairW-.08,chairY+chairD-.055,1.49),'#67452f','5','stroke-linecap="round"');
    line(P(chairX+.17,chairY+chairD-.055,1.29),P(chairX+chairW-.17,chairY+chairD-.055,1.29),'#9b6b45','4.2','stroke-linecap="round"');
    line(P(chairX+.17,chairY+chairD-.055,1.09),P(chairX+chairW-.17,chairY+chairD-.055,1.09),'#9b6b45','4.2','stroke-linecap="round"');
    out.push('</g>');
    out.push('<g class="town-hospital-letters">');
    p([P(chairX+.28,chairY+.22,.775),P(chairX+1.04,chairY+.22,.775),P(chairX+1.04,chairY+.64,.775),P(chairX+.28,chairY+.64,.775)],'#dfd3bd','stroke="#b99f79" stroke-width="1"');
    p([P(chairX+.23,chairY+.17,.805),P(chairX+.99,chairY+.17,.805),P(chairX+.99,chairY+.59,.805),P(chairX+.23,chairY+.59,.805)],'#f6edda','stroke="#c6ae87" stroke-width="1.15"');
    line(P(chairX+.23,chairY+.17,.815),P(chairX+.61,chairY+.4,.815),'#c8ad82','1');line(P(chairX+.99,chairY+.17,.815),P(chairX+.61,chairY+.4,.815),'#c8ad82','1');
    out.push('</g></g>');
    this.svg.innerHTML=out.join('');this.setFogPhase(0);
  };

  TownRenderer.prototype.serializeSvg = function () {
    var clone=this.svg.cloneNode(true);clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("width","1180");clone.setAttribute("height","860");return new XMLSerializer().serializeToString(clone);
  };
  TownRenderer.prototype.drawToCanvas = function (context, x, y, width, height) {
    var self=this,x0=x||0,y0=y||0,w=width||context.canvas.width,h=height||context.canvas.height;
    context.save();var gradient=context.createRadialGradient(x0+w*.5,y0+h*.12,10,x0+w*.5,y0+h*.32,Math.max(w,h));var colors=this.season==='summer'?['#bfe3ef','#5b98b3']:this.season==='winter'?['#56657e','#151b2b']:['#33507a','#0d1424'];gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);context.fillStyle=gradient;context.fillRect(x0,y0,w,h);context.restore();
    return new Promise(function(resolve,reject){var blob=new Blob([self.serializeSvg()],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),image=new Image();image.onload=function(){context.drawImage(image,x0,y0,w,h);URL.revokeObjectURL(url);resolve(context.canvas);};image.onerror=function(error){URL.revokeObjectURL(url);reject(error);};image.src=url;});
  };
  TownRenderer.prototype.snapshot = function (width, height) {
    var canvas=this.document.createElement('canvas');canvas.width=width||1180;canvas.height=height||860;var self=this;return this.drawToCanvas(canvas.getContext('2d'),0,0,canvas.width,canvas.height).then(function(){return canvas;});
  };
  TownRenderer.prototype.destroy = function () { this.stopWeather(); this.particles.destroy(); this._created.forEach(function(node){if(node.parentNode)node.parentNode.removeChild(node);}); this._created=[]; };

  TownRenderer.PAL = PAL;
  TownRenderer.P = P;
  TownRenderer.box = function (x,y,z,w,d,h,colors) { colors=colors||["#ddd","#bbb","#999"];return '<polygon points="'+pts([P(x,y,z+h),P(x+w,y,z+h),P(x+w,y+d,z+h),P(x,y+d,z+h)])+'" fill="'+colors[0]+'"/><polygon points="'+pts([P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)])+'" fill="'+colors[1]+'"/><polygon points="'+pts([P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)])+'" fill="'+colors[2]+'"/>'; };
  TownRenderer.house = function (options) {
    options=options||{};var x=options.x||0,y=options.y||0,z=options.z||0,w=options.w||1.6,d=options.d||1.3,h=options.h||1.4,rh=options.rh==null?.75:options.rh;
    var colors=options.colors||["#efe2c8","#d9c6a4","#b9a383"],roof=options.roofColor||"#b8574a",markup=TownRenderer.box(x,y,z,w,d,h,colors),my=y+d/2,zt=z+h;
    markup+='<polygon points="'+pts([P(x-.1,y-.1,zt),P(x+w+.1,y-.1,zt),P(x+w+.1,my,zt+rh),P(x-.1,my,zt+rh)])+'" fill="'+shade(roof,.74)+'"/><polygon points="'+pts([P(x-.1,my,zt+rh),P(x+w+.1,my,zt+rh),P(x+w+.1,y+d+.1,zt),P(x-.1,y+d+.1,zt)])+'" fill="'+roof+'"/>';
    return markup;
  };
  TownRenderer.tree = function (x,y,scale,colors) {
    var s=scale||1,b=P(x,y,0),c=colors||["#3f6e4f","#4f8560","#2f5a40"];
    return '<g class="town-tree"><rect x="'+(b[0]-2.5*s)+'" y="'+(b[1]-22*s)+'" width="'+(5*s)+'" height="'+(22*s)+'" rx="2" fill="#6d462c"/><g class="town-tree-crown"><circle cx="'+b[0]+'" cy="'+(b[1]-34*s)+'" r="'+(17*s)+'" fill="'+c[0]+'"/><circle cx="'+(b[0]-8*s)+'" cy="'+(b[1]-28*s)+'" r="'+(12*s)+'" fill="'+c[1]+'"/><circle cx="'+(b[0]+9*s)+'" cy="'+(b[1]-27*s)+'" r="'+(12*s)+'" fill="'+c[2]+'"/></g></g>';
  };
  TownRenderer.lamp = function (x,y,lit) {
    var b=P(x,y,0),t=P(x,y,1);return '<g class="town-lamp"><line x1="'+b[0]+'" y1="'+b[1]+'" x2="'+t[0]+'" y2="'+t[1]+'" stroke="#2a2a33" stroke-width="2.5"/><circle cx="'+t[0]+'" cy="'+t[1]+'" r="4.5" fill="'+(lit===false?'#889099':'#ffe2a0')+'"/></g>';
  };
  TownRenderer.primitives = { P: P, box: TownRenderer.box, house: TownRenderer.house, tree: TownRenderer.tree, lamp: TownRenderer.lamp };
  TownRenderer.ICON = ICON;
  TownRenderer.WEATHER_NAME = WEATHER_NAME;
  TownRenderer.LEVEL_FOCUS = LEVEL_FOCUS;
  TownRenderer.SUCCESS_STATE = SUCCESS_STATE;
  TownRenderer.FINALE_PHASES = copy(FINALE_PHASES);
  TownRenderer.MAP = MAP.slice();
  TownRenderer.mount = function (root, options) { options=options||{};options.root=root;return new TownRenderer(options); };

  return TownRenderer;
});
