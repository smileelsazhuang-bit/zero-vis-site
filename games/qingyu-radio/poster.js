(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SharePoster = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var WIDTH = 1080;
  var HEIGHT = 1440;
  var WEATHER_IDS = ["sun", "rain", "wind", "snow", "thunder", "fog"];
  var WEATHER_SET = Object.create(null);
  WEATHER_IDS.forEach(function (id) { WEATHER_SET[id] = true; });

  function codePointLength(value) {
    return Array.from(String(value == null ? "" : value)).length;
  }

  function normalizeName(value) {
    return String(value == null ? "" : value).trim();
  }

  function allowedMap(cards) {
    var map = Object.create(null);
    if (cards && typeof cards === "object") {
      Object.keys(cards).forEach(function (id) { map[id] = true; });
    } else {
      WEATHER_IDS.forEach(function (id) { map[id] = true; });
    }
    return map;
  }

  /**
   * Validate share-poster input without creating any player-visible copy.
   * Error values are stable machine codes for the caller to map to UI text.
   */
  function validate(input) {
    input = input || {};
    var name = normalizeName(input.name);
    var sequence = Array.isArray(input.weathers) ? input.weathers.slice() : [];
    var allowed = allowedMap(input.cards);
    var errors = [];
    var seen = Object.create(null);

    if (!name) errors.push("name_required");
    if (codePointLength(name) > 8) errors.push("name_too_long");
    if (sequence.length < 1) errors.push("weather_required");
    if (sequence.length > 3) errors.push("weather_too_many");

    sequence.forEach(function (id) {
      if (typeof id !== "string" || !allowed[id] || !WEATHER_SET[id]) {
        errors.push("weather_invalid");
      } else if (seen[id]) {
        errors.push("weather_duplicate");
      }
      seen[id] = true;
    });

    return {
      ok: errors.length === 0,
      name: name,
      weathers: sequence,
      errors: errors.filter(function (code, index, all) {
        return all.indexOf(code) === index;
      })
    };
  }

  function appendWeather(sequence, id) {
    var next = Array.isArray(sequence) ? sequence.slice(0, 3) : [];
    if (WEATHER_SET[id] && next.indexOf(id) < 0 && next.length < 3) next.push(id);
    return next;
  }

  function removeWeather(sequence, value) {
    var next = Array.isArray(sequence) ? sequence.slice(0, 3) : [];
    if (typeof value === "number") {
      if (value >= 0 && value < next.length) next.splice(value, 1);
    } else {
      var index = next.indexOf(value);
      if (index >= 0) next.splice(index, 1);
    }
    return next;
  }

  function toggleWeather(sequence, id) {
    var current = Array.isArray(sequence) ? sequence : [];
    return current.indexOf(id) >= 0 ? removeWeather(current, id) : appendWeather(current, id);
  }

  function moveWeather(sequence, fromIndex, toIndex) {
    var next = Array.isArray(sequence) ? sequence.slice(0, 3) : [];
    if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length || fromIndex === toIndex) return next;
    var item = next.splice(fromIndex, 1)[0];
    next.splice(toIndex, 0, item);
    return next;
  }

  function seededRandom(seed) {
    var value = seed >>> 0;
    return function () {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function hashString(text) {
    var hash = 2166136261;
    Array.from(String(text)).forEach(function (ch) {
      hash ^= ch.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    });
    return hash >>> 0;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    var r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function isoProject(originX, originY, scale, x, y, z) {
    return [
      originX + (x - y) * 0.866 * scale,
      originY + (x + y) * 0.5 * scale - (z || 0) * scale
    ];
  }

  function polygon(ctx, points, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function drawFallbackTown(ctx, area, weatherSequence, seed) {
    var random = seededRandom(seed);
    var P = function (x, y, z) { return isoProject(area.x + area.w * 0.5, area.y + 82, 35, x, y, z); };
    var tile = function (x, y, fill) {
      polygon(ctx, [P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], fill, "rgba(20,31,48,.14)");
    };
    var block = function (x, y, z, w, d, h, top, left, right) {
      polygon(ctx, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top);
      polygon(ctx, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], left);
      polygon(ctx, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], right);
    };
    var windowGlow = function (point) {
      var glow = ctx.createRadialGradient(point[0], point[1], 2, point[0], point[1], 26);
      glow.addColorStop(0, "rgba(255,211,125,.78)");
      glow.addColorStop(1, "rgba(255,211,125,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(point[0], point[1], 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd98a";
      ctx.fillRect(point[0] - 5, point[1] - 7, 10, 13);
    };
    var house = function (x, y, w, d, h, roof, lit) {
      block(x, y, 0, w, d, h, "#efe2c8", "#d9c6a4", "#b9a383");
      var mid = y + d / 2;
      polygon(ctx, [P(x - 0.1, y - 0.1, h), P(x + w + 0.1, y - 0.1, h), P(x + w + 0.1, mid, h + 0.72), P(x - 0.1, mid, h + 0.72)], "#8f3f3b");
      polygon(ctx, [P(x - 0.1, mid, h + 0.72), P(x + w + 0.1, mid, h + 0.72), P(x + w + 0.1, y + d + 0.1, h), P(x - 0.1, y + d + 0.1, h)], roof || "#c15b4d");
      if (lit) windowGlow(P(x + w * 0.75, y + d, h * 0.54));
    };
    var tree = function (x, y, size) {
      var base = P(x, y, 0), top = P(x, y, 0.8 * size);
      ctx.strokeStyle = "#60432e"; ctx.lineWidth = 6 * size; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
      [
        [-11, -14, 20, "#3f6e4f"], [12, -13, 19, "#4f8560"], [0, -30, 22, "#2f5a40"]
      ].forEach(function (item) {
        ctx.fillStyle = item[3]; ctx.beginPath();
        ctx.arc(top[0] + item[0] * size, top[1] + item[1] * size, item[2] * size, 0, Math.PI * 2); ctx.fill();
      });
    };

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.44)"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 24;
    block(-0.35, -0.35, -1.1, 12.7, 12.7, 0.7, "#8a5a3a", "#6d462c", "#4e321f");
    ctx.restore();
    block(0, 0, -0.42, 12, 12, 0.42, "#4f7d5c", "#6b4b36", "#4e3626");

    var last = weatherSequence[weatherSequence.length - 1];
    for (var y = 0; y < 12; y += 1) {
      for (var x = 0; x < 12; x += 1) {
        var fill = (x === 8) ? "#346982" : (y === 5 ? "#9c8b72" : ["#4f7d5c", "#5a8a63", "#4a7556"][(x * 7 + y * 13) % 3]);
        if (x < 4 && y > 7) fill = last === "snow" ? "#cfe0ee" : "#2f5d78";
        if (last === "snow" && fill.charAt(0) === "#" && x !== 8 && y !== 5) fill = ["#e7ecf2", "#dde4ec", "#eef2f6"][(x + y) % 3];
        tile(x, y, fill);
      }
    }

    var objects = [
      [2.5, function () { house(0.8, 1.2, 1.55, 1.25, 1.3, "#c98b4f", true); }],
      [7.3, function () { house(3.2, 2.2, 2.1, 1.7, 2, "#b8574a", true); }],
      [11.7, function () { house(5.4, 6.7, 1.5, 1.25, 1.2, "#7e8fb0", true); }],
      [13.5, function () { house(9.4, 2.4, 1.3, 1.2, 1.25, "#6f9a7a", false); }],
      [19.3, function () { house(9.4, 9, 1.8, 1.6, 1.9, "#c98b4f", true); }]
    ];
    [[1.2, 4.1], [2.7, 4.1], [7.1, 3.5], [7.3, 1.2], [0.8, 10.8], [5.2, 11.1], [7.1, 10.4], [10.8, 4.1], [6.9, 8.9]].forEach(function (xy) {
      objects.push([xy[0] + xy[1], function () { tree(xy[0], xy[1], 0.76 + random() * 0.2); }]);
    });
    objects.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (entry) { entry[1](); });

    // Radio mast and pulse rings.
    var mastBase = P(4.25, 3.05, 2.6), mastTop = P(4.25, 3.05, 5.2);
    ctx.strokeStyle = "#30333d"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(mastBase[0] - 8, mastBase[1]); ctx.lineTo(mastTop[0], mastTop[1]); ctx.lineTo(mastBase[0] + 8, mastBase[1]); ctx.stroke();
    ctx.strokeStyle = "rgba(255,207,122,.44)"; ctx.lineWidth = 2;
    [20, 40, 61].forEach(function (r) { ctx.beginPath(); ctx.arc(mastTop[0], mastTop[1], r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    ctx.fillStyle = "#ff6b57"; ctx.beginPath(); ctx.arc(mastTop[0], mastTop[1], 5, 0, Math.PI * 2); ctx.fill();

    // Lighthouse on the sea corner.
    block(10.6, 0.1, 0, 1, 1, 0.28, "#7d7d84", "#5c5c64", "#48484f");
    var lightBase = P(11.1, 0.6, 0.28), lightTop = P(11.1, 0.6, 3.4);
    polygon(ctx, [[lightBase[0] - 18, lightBase[1]], [lightTop[0] - 10, lightTop[1]], [lightTop[0] + 10, lightTop[1]], [lightBase[0] + 18, lightBase[1]]], "#eee9df");
    ctx.fillStyle = "#c9483b"; ctx.fillRect(lightTop[0] - 11, lightTop[1] + 42, 22, 25);
    windowGlow([lightTop[0], lightTop[1] - 6]);
  }

  function weatherLabel(cards, id) {
    var card = cards && cards[id];
    return card && typeof card.name === "string" ? card.name : "";
  }

  function drawWeatherIcon(ctx, id, cx, cy, size) {
    var k = size / 84;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (id === "sun") {
      ctx.fillStyle = "#f2b632"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#d78e26"; ctx.lineWidth = 4;
      for (var i = 0; i < 8; i += 1) {
        var a = i * Math.PI / 4;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 25, Math.sin(a) * 25); ctx.lineTo(Math.cos(a) * 36, Math.sin(a) * 36); ctx.stroke();
      }
    } else if (id === "rain" || id === "thunder") {
      ctx.fillStyle = id === "rain" ? "#8aa6c4" : "#8f8aa8";
      ctx.beginPath(); ctx.arc(-15, 0, 14, Math.PI, 0); ctx.arc(3, -8, 19, Math.PI, 0); ctx.arc(22, 2, 13, Math.PI, 0); ctx.lineTo(-29, 3); ctx.closePath(); ctx.fill();
      if (id === "rain") {
        ctx.strokeStyle = "#4f7aa6"; ctx.lineWidth = 5;
        [-18, 0, 18].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, 17); ctx.lineTo(x - 5, 34); ctx.stroke(); });
      } else {
        ctx.fillStyle = "#f2b632"; ctx.beginPath(); ctx.moveTo(5, 9); ctx.lineTo(-8, 30); ctx.lineTo(3, 30); ctx.lineTo(-2, 47); ctx.lineTo(19, 23); ctx.lineTo(7, 23); ctx.closePath(); ctx.fill();
      }
    } else if (id === "wind") {
      ctx.strokeStyle = "#6f9a7a"; ctx.lineWidth = 6;
      [[-36, -14, 22, -14], [-36, 2, 34, 2], [-36, 18, 4, 18]].forEach(function (p, i) {
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]);
        if (i < 2) ctx.arc(p[2], p[3] + (i ? 9 : -9), 9, i ? -Math.PI / 2 : Math.PI / 2, i ? Math.PI / 2 : Math.PI * 1.5);
        ctx.stroke();
      });
    } else if (id === "snow") {
      ctx.strokeStyle = "#6aa0c9"; ctx.lineWidth = 5;
      for (var j = 0; j < 3; j += 1) {
        var angle = j * Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(-Math.cos(angle) * 34, -Math.sin(angle) * 34); ctx.lineTo(Math.cos(angle) * 34, Math.sin(angle) * 34); ctx.stroke();
      }
      ctx.fillStyle = "#6aa0c9"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    } else if (id === "fog") {
      ctx.strokeStyle = "#9aa4b0"; ctx.lineWidth = 6;
      [[-34, -16, 32], [-26, 0, 38], [-34, 16, 26]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[1]); ctx.stroke(); });
    }
    ctx.restore();
  }

  function drawWeatherOverlay(ctx, area, sequence, random) {
    sequence.forEach(function (id, weatherIndex) {
      ctx.save();
      ctx.beginPath(); ctx.rect(area.x, area.y, area.w, area.h); ctx.clip();
      if (id === "sun") {
        var sun = ctx.createRadialGradient(area.x + area.w * 0.82, area.y + 100, 0, area.x + area.w * 0.82, area.y + 100, 420);
        sun.addColorStop(0, "rgba(255,235,176,.42)"); sun.addColorStop(1, "rgba(255,210,120,0)");
        ctx.fillStyle = sun; ctx.fillRect(area.x, area.y, area.w, area.h);
      } else if (id === "rain") {
        ctx.strokeStyle = "rgba(199,220,246,.43)"; ctx.lineWidth = 2;
        for (var r = 0; r < 135; r += 1) {
          var rx = area.x + random() * area.w, ry = area.y + random() * area.h;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 7, ry + 31); ctx.stroke();
        }
      } else if (id === "wind") {
        ctx.strokeStyle = "rgba(239,247,245,.36)"; ctx.lineWidth = 3;
        for (var w = 0; w < 18; w += 1) {
          var wx = area.x + random() * area.w * 0.9, wy = area.y + 90 + random() * (area.h - 140), len = 70 + random() * 150;
          ctx.beginPath(); ctx.moveTo(wx, wy); ctx.bezierCurveTo(wx + len * 0.35, wy - 18, wx + len * 0.72, wy + 19, wx + len, wy); ctx.stroke();
        }
      } else if (id === "snow") {
        ctx.fillStyle = "rgba(255,255,255,.84)";
        for (var s = 0; s < 150; s += 1) {
          ctx.beginPath(); ctx.arc(area.x + random() * area.w, area.y + random() * area.h, 1.5 + random() * 3.4, 0, Math.PI * 2); ctx.fill();
        }
      } else if (id === "thunder") {
        ctx.fillStyle = "rgba(236,242,255,.1)"; ctx.fillRect(area.x, area.y, area.w, area.h);
        var lx = area.x + area.w * (0.68 + weatherIndex * 0.03), ly = area.y + 72;
        ctx.strokeStyle = "rgba(255,234,135,.9)"; ctx.shadowColor = "#fff6bd"; ctx.shadowBlur = 20; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 35, ly + 90); ctx.lineTo(lx + 6, ly + 84); ctx.lineTo(lx - 48, ly + 190); ctx.stroke();
      } else if (id === "fog") {
        for (var f = 0; f < 12; f += 1) {
          var fx = area.x - 40 + random() * (area.w + 80), fy = area.y + 160 + random() * (area.h - 140);
          var fog = ctx.createRadialGradient(fx, fy, 0, fx, fy, 125 + random() * 95);
          fog.addColorStop(0, "rgba(226,232,240,.36)"); fog.addColorStop(1, "rgba(226,232,240,0)");
          ctx.fillStyle = fog; ctx.fillRect(fx - 230, fy - 130, 460, 260);
        }
      }
      ctx.restore();
    });
  }

  function serializeSvg(source) {
    if (typeof source === "string") return source;
    if (!source || typeof XMLSerializer === "undefined") return "";
    var clone = source.cloneNode(true);
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("width")) clone.setAttribute("width", "1180");
    if (!clone.getAttribute("height")) clone.setAttribute("height", "860");
    return new XMLSerializer().serializeToString(clone);
  }

  function svgImage(source) {
    return new Promise(function (resolve, reject) {
      var markup = serializeSvg(source);
      if (!markup || typeof Image === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") {
        reject(new Error("svg_unavailable")); return;
      }
      var blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var image = new Image();
      image.onload = function () { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = function () { URL.revokeObjectURL(url); reject(new Error("svg_load_failed")); };
      image.src = url;
    });
  }

  function drawContained(ctx, source, area, padding) {
    var sw = source.naturalWidth || source.videoWidth || source.width;
    var sh = source.naturalHeight || source.videoHeight || source.height;
    if (!sw || !sh) return false;
    var scale = Math.min((area.w - padding * 2) / sw, (area.h - padding * 2) / sh);
    var dw = sw * scale, dh = sh * scale;
    ctx.drawImage(source, area.x + (area.w - dw) / 2, area.y + (area.h - dh) / 2, dw, dh);
    return true;
  }

  function fillPaperTexture(ctx, area, random) {
    var paper = ctx.createLinearGradient(area.x, area.y, area.x, area.y + area.h);
    paper.addColorStop(0, "#f7edda"); paper.addColorStop(0.52, "#f1e4cd"); paper.addColorStop(1, "#ead9bd");
    ctx.fillStyle = paper; ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.strokeStyle = "rgba(125,90,55,.075)"; ctx.lineWidth = 1;
    for (var y = area.y + 28; y < area.y + area.h; y += 32) {
      ctx.beginPath(); ctx.moveTo(area.x, y); ctx.lineTo(area.x + area.w, y); ctx.stroke();
    }
    ctx.fillStyle = "rgba(85,55,35,.04)";
    for (var i = 0; i < 950; i += 1) {
      ctx.fillRect(area.x + random() * area.w, area.y + random() * area.h, 1 + random() * 1.6, 1 + random() * 1.6);
    }
  }

  function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily) {
    var size = startSize;
    do {
      ctx.font = size + "px " + fontFamily;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 2;
    } while (size >= minSize);
    return minSize;
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(",");
    var mime = (parts[0].match(/:(.*?);/) || [null, "image/png"])[1];
    var binary = atob(parts[1]);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function canvasBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) { if (blob) resolve(blob); else reject(new Error("png_encode_failed")); }, "image/png");
      } else {
        try { resolve(dataUrlToBlob(canvas.toDataURL("image/png"))); }
        catch (error) { reject(error); }
      }
    });
  }

  async function generate(options) {
    options = options || {};
    var checked = validate(options);
    if (!checked.ok) {
      var validationError = new Error("invalid_share_poster_input");
      validationError.codes = checked.errors.slice();
      throw validationError;
    }
    if (!options.share || !options.cards) {
      var copyError = new Error("share_copy_required");
      copyError.codes = ["share_copy_required"];
      throw copyError;
    }
    if (typeof document === "undefined") throw new Error("canvas_unavailable");

    var canvas = options.canvas || document.createElement("canvas");
    canvas.width = WIDTH; canvas.height = HEIGHT;
    var ctx = canvas.getContext("2d", { alpha: false });
    var seed = hashString(checked.name + "|" + checked.weathers.join("|"));
    var random = seededRandom(seed);
    var top = { x: 0, y: 0, w: WIDTH, h: 790 };

    var sky = ctx.createRadialGradient(540, 95, 20, 540, 250, 760);
    sky.addColorStop(0, "#35517b"); sky.addColorStop(0.54, "#1d2b4a"); sky.addColorStop(1, "#0d1424");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    for (var i = 0; i < 105; i += 1) {
      var radius = 0.7 + random() * 1.7;
      ctx.globalAlpha = 0.22 + random() * 0.58;
      ctx.beginPath(); ctx.arc(random() * WIDTH, random() * 430, radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    var renderedSource = false;
    ctx.save(); ctx.beginPath(); ctx.rect(top.x, top.y, top.w, top.h); ctx.clip();
    if (options.sceneCanvas) renderedSource = drawContained(ctx, options.sceneCanvas, { x: 36, y: 24, w: 1008, h: 730 }, 0);
    if (!renderedSource && options.townSvg) {
      try {
        var image = await svgImage(options.townSvg);
        renderedSource = drawContained(ctx, image, { x: 24, y: 18, w: 1032, h: 750 }, 0);
      } catch (_) { renderedSource = false; }
    }
    if (!renderedSource) drawFallbackTown(ctx, { x: 25, y: 32, w: 1030, h: 715 }, checked.weathers, seed);
    ctx.restore();
    drawWeatherOverlay(ctx, top, checked.weathers, random);

    var vignette = ctx.createRadialGradient(540, 365, 240, 540, 365, 660);
    vignette.addColorStop(0, "rgba(4,8,18,0)"); vignette.addColorStop(1, "rgba(4,8,18,.62)");
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, WIDTH, 790);

    // The lower portion is a physical programme sheet laid over the town.
    var paper = { x: 58, y: 740, w: 964, h: 655 };
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.56)"; ctx.shadowBlur = 38; ctx.shadowOffsetY = 20;
    roundedRect(ctx, paper.x, paper.y, paper.w, paper.h, 5); ctx.fillStyle = "#f3e5ce"; ctx.fill(); ctx.restore();
    fillPaperTexture(ctx, paper, random);

    // Two translucent strips make the sheet feel pinned to the miniature set.
    ctx.save(); ctx.fillStyle = "rgba(226,194,124,.54)";
    ctx.translate(280, 748); ctx.rotate(-0.035); ctx.fillRect(-70, -13, 140, 27); ctx.restore();
    ctx.save(); ctx.fillStyle = "rgba(226,194,124,.54)";
    ctx.translate(800, 748); ctx.rotate(0.042); ctx.fillRect(-70, -13, 140, 27); ctx.restore();

    var serif = '"Noto Serif SC","Songti SC","STSong","SimSun",serif';
    var kai = '"KaiTi","STKaiti","Kaiti SC","SimSun",serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#8f463a"; ctx.font = "600 31px " + serif;
    ctx.fillText(String(options.share.poster_head || ""), 540, 826);
    ctx.strokeStyle = "rgba(122,82,49,.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(150, 868); ctx.lineTo(930, 868); ctx.stroke();

    var line = String(options.share.poster_line || "").replace(/\{name\}/g, checked.name);
    fitText(ctx, line, 820, 42, 28, kai);
    ctx.fillStyle = "#4a3a2c"; ctx.fillText(line, 540, 930);

    var gap = 238, startX = 540 - (checked.weathers.length - 1) * gap / 2;
    checked.weathers.forEach(function (id, index) {
      var cx = startX + index * gap, cy = 1080;
      ctx.save(); ctx.shadowColor = "rgba(88,62,38,.23)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
      roundedRect(ctx, cx - 82, cy - 79, 164, 178, 13); ctx.fillStyle = "#fbf2df"; ctx.fill(); ctx.restore();
      ctx.strokeStyle = "rgba(112,81,52,.16)"; ctx.lineWidth = 1.3; roundedRect(ctx, cx - 82, cy - 79, 164, 178, 13); ctx.stroke();
      drawWeatherIcon(ctx, id, cx, cy - 17, 82);
      ctx.font = "600 28px " + serif; ctx.fillStyle = "#4a3a2c";
      ctx.fillText(weatherLabel(options.cards, id), cx, cy + 62);
      if (index < checked.weathers.length - 1) {
        ctx.strokeStyle = "rgba(132,91,54,.42)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + 105, cy + 8); ctx.lineTo(cx + gap - 105, cy + 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + gap - 114, cy + 1); ctx.lineTo(cx + gap - 105, cy + 8); ctx.lineTo(cx + gap - 114, cy + 15); ctx.stroke();
      }
    });

    var tail = String(options.share.poster_tail || "");
    fitText(ctx, tail, 800, 35, 26, kai);
    ctx.fillStyle = "#4a3a2c"; ctx.fillText(tail, 540, 1268);
    ctx.strokeStyle = "rgba(122,82,49,.28)"; ctx.beginPath(); ctx.moveTo(160, 1310); ctx.lineTo(920, 1310); ctx.stroke();
    ctx.font = "23px " + serif; ctx.fillStyle = "rgba(74,58,44,.64)";
    ctx.fillText(String(options.share.poster_footer || ""), 540, 1352);

    // A very light grain unifies SVG/canvas sources without external assets.
    ctx.fillStyle = "rgba(255,255,255,.025)";
    for (var g = 0; g < 1500; g += 1) ctx.fillRect(random() * WIDTH, random() * HEIGHT, 1, 1);

    var blob = await canvasBlob(canvas);
    return {
      canvas: canvas,
      blob: blob,
      dataUrl: canvas.toDataURL("image/png"),
      width: WIDTH,
      height: HEIGHT,
      name: checked.name,
      weathers: checked.weathers.slice()
    };
  }

  function downloadPNG(source, filename) {
    if (typeof document === "undefined" || typeof URL === "undefined") throw new Error("download_unavailable");
    var blob = source && source.blob ? source.blob : source;
    if (source && source.canvas && !blob) blob = dataUrlToBlob(source.canvas.toDataURL("image/png"));
    if (!blob && source && typeof source.toDataURL === "function") blob = dataUrlToBlob(source.toDataURL("image/png"));
    if (!(blob instanceof Blob)) throw new Error("png_blob_required");
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "poster.png";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    return true;
  }

  return Object.freeze({
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    WEATHER_IDS: WEATHER_IDS.slice(),
    codePointLength: codePointLength,
    validate: validate,
    appendWeather: appendWeather,
    removeWeather: removeWeather,
    toggleWeather: toggleWeather,
    moveWeather: moveWeather,
    generate: generate,
    downloadPNG: downloadPNG
  });
});
