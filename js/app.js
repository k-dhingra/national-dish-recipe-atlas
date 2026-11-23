/* National dishes A to Z. No build step. Works from file:// and GitHub Pages. */
(function () {
  const DATA = window.RECIPE_DATA || [];
  const stapleMeta = window.STAPLE_META || [];
  const stapleByKey = {};
  stapleMeta.forEach(function (m) { stapleByKey[m.key] = m; });

  const grid = document.getElementById("grid");
  const search = document.getElementById("search");
  const az = document.getElementById("az");
  const detail = document.getElementById("detail");
  const detailInner = document.getElementById("detail-inner");
  const statusLine = document.getElementById("status-line");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const byIso = {};
  DATA.forEach(function (c) { byIso[c.iso3] = c; });

  let stapleFilter = null;
  let popupIso = null;
  let hideTimer = null;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function letterOf(country) {
    const ch = (country || "").trim().charAt(0).toUpperCase();
    return letters.indexOf(ch) >= 0 ? ch : "#";
  }

  function usedLetters() {
    const set = {};
    DATA.forEach(function (c) { set[letterOf(c.country)] = true; });
    return set;
  }

  function renderAz() {
    const used = usedLetters();
    az.innerHTML = letters.map(function (L) {
      if (used[L]) return '<a href="#letter-' + L + '">' + L + "</a>";
      return '<a class="is-empty" tabindex="-1">' + L + "</a>";
    }).join("");
  }

  function filterQuery(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return DATA.slice();
    return DATA.filter(function (c) {
      return (
        (c.country || "").toLowerCase().indexOf(q) >= 0 ||
        (c.dish || "").toLowerCase().indexOf(q) >= 0
      );
    });
  }

  function stapleOf(c) {
    return (c && c.staple_key) ? c.staple_key : "none";
  }

  function visibleList() {
    let list = filterQuery(search ? search.value : "");
    if (stapleFilter) {
      list = list.filter(function (c) { return stapleOf(c) === stapleFilter; });
    }
    return list;
  }

  function dishImage(c) {
    if (c.image) return c.image;
    return null;
  }

  function outlineUrl(iso) {
    return "images/outlines/" + iso + ".svg";
  }

  function cardHTML(c) {
    const gap = !c.dish;
    const dish = gap ? "No single national dish" : c.dish;
    const img = dishImage(c);
    const photo = img
      ? '<img class="dish-photo" src="' + img + '" alt="' + escapeAttr(dish) + '" loading="lazy">'
      : '<div class="dish-photo" aria-hidden="true"></div>';
    const hint = gap
      ? "Not listed on the Wikipedia National dish page"
      : c.status === "full_recipe"
        ? "Reusable recipe inside"
        : (c.link_url && c.link_ok)
          ? "Description and a recipe link"
          : "Wikipedia description";
    return (
      '<button class="card' + (gap ? " gap" : "") + '" type="button" data-iso="' + c.iso3 + '" id="card-' + c.iso3 + '">' +
        '<div class="art">' +
          '<img class="outline" src="' + outlineUrl(c.iso3) + '" alt="">' +
          photo +
        "</div>" +
        "<h2>" + escapeHtml(c.country) + "</h2>" +
        '<p class="dish">' + escapeHtml(dish) + "</p>" +
        '<p class="hint">' + escapeHtml(hint) + "</p>" +
      "</button>"
    );
  }

  function renderGrid(list) {
    if (!list.length) {
      grid.innerHTML = "<p>No countries match that search.</p>";
      return;
    }
    let html = "";
    let last = "";
    list.forEach(function (c) {
      const L = letterOf(c.country);
      if (L !== last) {
        html += '<h2 class="letter-head" id="letter-' + L + '">' + L + "</h2>";
        last = L;
      }
      html += cardHTML(c);
    });
    grid.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  function listify(items, tag) {
    if (!items || !items.length) return "";
    return "<" + tag + ">" + items.map(function (it) {
      return "<li>" + escapeHtml(it) + "</li>";
    }).join("") + "</" + tag + ">";
  }

  function openCard(iso) {
    const c = byIso[iso];
    if (!c) return;
    document.querySelectorAll("#world-wrap path.is-active").forEach(function (p) {
      p.classList.remove("is-active");
    });
    document.querySelectorAll('#world-wrap path[data-iso="' + iso + '"]').forEach(function (p) {
      p.classList.add("is-active");
    });
    const gap = !c.dish;
    const img = dishImage(c);
    let body = "";
    body += '<button type="button" id="close-detail">Close</button>';
    body += '<div class="hero">';
    body += '<img class="outline" src="' + outlineUrl(c.iso3) + '" alt="Outline of ' + escapeAttr(c.country) + '">';
    if (img) body += '<img class="dish-photo" src="' + img + '" alt="' + escapeAttr(c.dish || c.country) + '">';
    body += "</div>";
    body += "<h2>" + escapeHtml(c.country) + "</h2>";
    body += '<p class="dish">' + escapeHtml(gap ? "No single national dish" : c.dish) + "</p>";
    if (!gap && c.staple) {
      body += '<p class="source">Built on: ' + escapeHtml(c.staple) + "</p>";
    }

    if (gap) {
      body += '<p class="desc">' + escapeHtml(c.note || "This country has no entry on the Wikipedia National dish list, so no dish is shown.") + "</p>";
    } else if (c.status === "full_recipe") {
      body += "<h3>Ingredients</h3>" + listify(c.ingredients, "ul");
      body += "<h3>Method</h3>" + listify(c.method, "ol");
      body += '<p class="source">' + escapeHtml(c.attribution || "") + " ";
      if (c.source_url) body += '<a href="' + escapeAttr(c.source_url) + '" rel="noopener noreferrer" target="_blank">Open the Wikibooks page</a>.';
      body += "</p>";
      if (c.description) {
        body += "<h3>About the dish</h3><p class=\"desc\">" + escapeHtml(c.description) + "</p>";
        if (c.description_attribution) body += '<p class="source">' + escapeHtml(c.description_attribution) + "</p>";
      }
    } else {
      if (c.description) {
        body += "<h3>About the dish</h3><p class=\"desc\">" + escapeHtml(c.description) + "</p>";
      } else {
        body += "<p class=\"desc\">A reusable, freely licensed recipe was not found for this dish. No recipe text is invented here.</p>";
      }
      if (c.description_attribution) {
        body += '<p class="source">' + escapeHtml(c.description_attribution) + "</p>";
      }
      if (c.link_url && c.link_ok) {
        body += '<p class="source"><a href="' + escapeAttr(c.link_url) + '" rel="noopener noreferrer" target="_blank">Open a recipe for ' + escapeHtml(c.dish) + "</a></p>";
      } else if (c.wikipedia_url) {
        body += '<p class="source"><a href="' + escapeAttr(c.wikipedia_url) + '" rel="noopener noreferrer" target="_blank">Read more on Wikipedia</a></p>';
      }
    }
    detailInner.innerHTML = body;
    if (typeof detail.showModal === "function") {
      if (!detail.open) detail.showModal();
    } else {
      detail.setAttribute("open", "");
    }
    history.replaceState(null, "", "#" + iso);
    document.getElementById("close-detail").addEventListener("click", closeCard);
    const cardEl = document.getElementById("card-" + iso);
    if (cardEl) cardEl.scrollIntoView({ block: "nearest" });
  }

  function closeCard() {
    if (detail.open && typeof detail.close === "function") detail.close();
    else detail.removeAttribute("open");
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    document.querySelectorAll("#world-wrap path.is-active").forEach(function (p) {
      p.classList.remove("is-active");
    });
  }

  function bindGrid() {
    grid.addEventListener("click", function (e) {
      const btn = e.target.closest(".card");
      if (btn && btn.dataset.iso) openCard(btn.dataset.iso);
    });
  }

  function colourMap() {
    document.querySelectorAll("#world-wrap path[data-iso]").forEach(function (p) {
      if (p.classList.contains("ws") || p.classList.contains("other")) return;
      const iso = p.getAttribute("data-iso");
      const c = byIso[iso];
      const key = c && c.staple_key ? c.staple_key : "none";
      p.setAttribute("data-staple", key);
    });
  }

  function stapleCounts() {
    const counts = {};
    DATA.forEach(function (c) {
      const k = stapleOf(c);
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }

  function renderLegend() {
    const el = document.getElementById("staple-legend");
    if (!el) return;
    const counts = stapleCounts();
    el.innerHTML = stapleMeta.map(function (m) {
      const n = counts[m.key] || 0;
      const pressed = stapleFilter === m.key ? "true" : "false";
      return (
        '<button type="button" data-staple="' + m.key + '" aria-pressed="' + pressed + '">' +
          '<span class="swatch' + (m.hatched ? " hatch" : "") + '" style="background:' + m.color + '"></span>' +
          '<span class="label">' + escapeHtml(m.label) + "</span>" +
          '<span class="count">' + n + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function applyFilter() {
    const wrap = document.getElementById("world-wrap");
    document.querySelectorAll("#world-wrap path.c").forEach(function (p) {
      const on = stapleFilter && p.getAttribute("data-staple") === stapleFilter;
      p.classList.toggle("is-filtered", !!on);
    });
    if (wrap) wrap.classList.toggle("filter-on", !!stapleFilter);
    renderGrid(visibleList());
    renderLegend();
    counts();
  }

  function bindLegend() {
    const el = document.getElementById("staple-legend");
    if (!el) return;
    el.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-staple]");
      if (!btn) return;
      const key = btn.getAttribute("data-staple");
      stapleFilter = stapleFilter === key ? null : key;
      applyFilter();
    });
  }

  function popupEl() {
    const el = document.getElementById("map-popup");
    if (!el) return null;
    if (el.parentElement !== document.body) document.body.appendChild(el);
    return el;
  }

  const photoCache = {};
  function whenPhotoReady(src, done) {
    if (!src) { done(null); return; }
    if (photoCache[src]) { done(src); return; }
    const im = new Image();
    let settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      if (ok) photoCache[src] = true;
      done(ok ? src : null);
    }
    im.onload = function () { finish(true); };
    im.onerror = function () { finish(false); };
    im.src = src;
    if (im.complete && im.naturalWidth) finish(true);
    setTimeout(function () {
      finish(im.complete && im.naturalWidth > 0);
    }, 2000);
  }

  function highlightCountry(iso) {
    const wrap = document.getElementById("world-wrap");
    const svg = wrap && wrap.querySelector("svg");
    document.querySelectorAll("#world-wrap path.is-hot").forEach(function (p) {
      p.classList.remove("is-hot");
    });
    document.querySelectorAll('#world-wrap path[data-iso="' + iso + '"]').forEach(function (p) {
      p.classList.add("is-hot");
      if (svg) svg.appendChild(p);
    });
    if (svg) {
      svg.querySelectorAll("circle.hit").forEach(function (c) { svg.appendChild(c); });
    }
    if (wrap) wrap.classList.add("has-hot");
  }

  function clearHighlight() {
    const wrap = document.getElementById("world-wrap");
    if (wrap) wrap.classList.remove("has-hot");
    document.querySelectorAll("#world-wrap path.is-hot").forEach(function (p) {
      p.classList.remove("is-hot");
    });
  }

  function showPopup(iso, x, y) {
    const c = byIso[iso];
    if (!c) return;
    popupIso = iso;
    highlightCountry(iso);
    const src = dishImage(c);
    whenPhotoReady(src, function (readySrc) {
      if (popupIso !== iso) return;
      paintPopup(c, readySrc, x, y);
    });
  }

  function paintPopup(c, readySrc, x, y) {
    const el = popupEl();
    if (!el) return;
    const gap = !c.dish;
    const dish = gap ? "No single national dish" : c.dish;
    const stapleLabel = gap ? "No listed dish" : (c.staple || "");
    const meta = stapleByKey[c.staple_key] || (gap ? stapleByKey.none : null);
    const photo = readySrc
      ? '<img class="dish-photo" src="' + readySrc + '" alt="' + escapeAttr(dish) + '" width="64" height="64" decoding="async" loading="eager">'
      : '<div class="dish-photo" aria-hidden="true"></div>';
    const swatch = meta
      ? '<span class="swatch' + (meta.hatched ? " hatch" : "") + '" style="background:' + meta.color + '"></span>'
      : "";
    el.innerHTML =
      '<button type="button" class="popup-card" data-iso="' + c.iso3 + '">' +
        photo +
        "<div>" +
          '<p class="popup-country">' + escapeHtml(c.country) + "</p>" +
          '<p class="popup-dish">' + escapeHtml(dish) + "</p>" +
          '<p class="popup-staple">' + swatch + escapeHtml(stapleLabel) + "</p>" +
        "</div>" +
      "</button>";
    el.hidden = false;
    el.style.visibility = "visible";
    placePopup(el, x, y);
  }

  function placePopup(el, x, y) {
    el.style.position = "fixed";
    if (!finePointer.matches) {
      el.classList.add("sheet");
      el.style.left = "8px";
      el.style.right = "8px";
      el.style.bottom = "8px";
      el.style.top = "auto";
      el.style.width = "auto";
      return;
    }
    el.classList.remove("sheet");
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.width = "";
    el.style.visibility = "hidden";
    el.style.left = "0px";
    el.style.top = "0px";
    const r = el.getBoundingClientRect();
    const pad = 8;
    let left = x + 14;
    let top = y + 14;
    if (left + r.width + pad > window.innerWidth) left = x - r.width - 14;
    if (top + r.height + pad > window.innerHeight) top = y - r.height - 14;
    left = Math.max(pad, Math.min(left, window.innerWidth - r.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - r.height - pad));
    el.style.left = Math.round(left) + "px";
    el.style.top = Math.round(top) + "px";
    el.style.visibility = "visible";
  }

  function hidePopup() {
    const el = document.getElementById("map-popup");
    if (el) {
      el.hidden = true;
      el.innerHTML = "";
      el.classList.remove("sheet");
    }
    popupIso = null;
    clearHighlight();
  }

  function isoFromEvent(e) {
    const el = e.target.closest && e.target.closest("path[data-iso], circle.hit[data-iso]");
    if (!el) return null;
    if (el.classList.contains("other") || el.classList.contains("ws")) return null;
    let iso = el.getAttribute("data-iso");
    // Overlapping hit circles (Caribbean, Mediterranean) would otherwise
    // give the topmost neighbour. Pick the centre closest to the pointer.
    if (el.classList.contains("hit") && e.clientX != null) {
      const svg = el.ownerSVGElement;
      const ctm = svg && svg.getScreenCTM && svg.getScreenCTM();
      if (ctm && typeof ctm.inverse === "function") {
        const p = svg.createSVGPoint();
        p.x = e.clientX;
        p.y = e.clientY;
        const loc = p.matrixTransform(ctm.inverse());
        let best = iso, bestD = Infinity;
        svg.querySelectorAll("circle.hit").forEach(function (c) {
          const dx = loc.x - Number(c.getAttribute("cx"));
          const dy = loc.y - Number(c.getAttribute("cy"));
          const r = Number(c.getAttribute("r")) || 8;
          const d = Math.hypot(dx, dy);
          if (d <= r + 0.25 && d < bestD) {
            bestD = d;
            best = c.getAttribute("data-iso");
          }
        });
        iso = best;
      }
    }
    return byIso[iso] ? iso : null;
  }

  function addHitTargets(svg) {
    if (!svg || svg.querySelector("circle.hit")) return;
    const groups = {};
    svg.querySelectorAll("path[data-iso]").forEach(function (p) {
      if (p.classList.contains("other") || p.classList.contains("ws")) return;
      const iso = p.getAttribute("data-iso");
      if (!byIso[iso]) return;
      let b;
      try { b = p.getBBox(); } catch (err) { return; }
      const area = b.width * b.height;
      if (!groups[iso] || area > groups[iso].area) groups[iso] = { b: b, area: area };
    });
    Object.keys(groups).forEach(function (iso) {
      const g = groups[iso];
      if (Math.max(g.b.width, g.b.height) >= 10) return;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("class", "hit");
      c.setAttribute("data-iso", iso);
      c.setAttribute("cx", String(g.b.x + g.b.width / 2));
      c.setAttribute("cy", String(g.b.y + g.b.height / 2));
      c.setAttribute("r", "8");
      c.setAttribute("fill", "transparent");
      c.setAttribute("stroke", "none");
      svg.appendChild(c);
    });
  }

  function bindZoom(wrap) {
    const svg = wrap.querySelector("svg");
    if (!svg) return;
    const BASE_W = 1200, BASE_H = 640, MIN_Z = 1, MAX_Z = 12;
    let z = 1, vx = 0, vy = 0;
    const pointers = new Map();
    let pinch = null;
    let panStart = null;
    let gesturing = false;
    const btnIn = document.getElementById("zoom-in");
    const btnOut = document.getElementById("zoom-out");
    const btnReset = document.getElementById("zoom-reset");

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function viewSize() { return { w: BASE_W / z, h: BASE_H / z }; }
    function applyView() {
      const s = viewSize();
      vx = clamp(vx, 0, Math.max(0, BASE_W - s.w));
      vy = clamp(vy, 0, Math.max(0, BASE_H - s.h));
      svg.setAttribute("viewBox", vx + " " + vy + " " + s.w + " " + s.h);
      if (btnIn) btnIn.disabled = z >= MAX_Z - 1e-6;
      if (btnOut) btnOut.disabled = z <= MIN_Z + 1e-6;
      wrap.classList.toggle("is-zoomed", z > 1.001);
      // Keep hit circles about 8px on screen so they do not swallow neighbours when zoomed.
      const hr = Math.max(1.1, 8 / z);
      svg.querySelectorAll("circle.hit").forEach(function (c) {
        c.setAttribute("r", String(hr));
      });
    }
    function clientToSvg(clientX, clientY) {
      const r = svg.getBoundingClientRect();
      const s = viewSize();
      return {
        x: vx + ((clientX - r.left) / r.width) * s.w,
        y: vy + ((clientY - r.top) / r.height) * s.h
      };
    }
    function setZoomAt(clientX, clientY, newZ) {
      newZ = clamp(newZ, MIN_Z, MAX_Z);
      if (Math.abs(newZ - z) < 1e-6) { applyView(); return; }
      const pt = clientToSvg(clientX, clientY);
      const r = svg.getBoundingClientRect();
      z = newZ;
      const s = viewSize();
      vx = pt.x - ((clientX - r.left) / r.width) * s.w;
      vy = pt.y - ((clientY - r.top) / r.height) * s.h;
      applyView();
    }
    function zoomBy(factor) {
      const r = svg.getBoundingClientRect();
      setZoomAt(r.left + r.width / 2, r.top + r.height / 2, z * factor);
    }
    function resetView() {
      z = 1; vx = 0; vy = 0;
      applyView();
    }

    wrap._mapDidPan = function () { return gesturing; };
    wrap._clearMapPan = function () { gesturing = false; };

    wrap.addEventListener("wheel", function (e) {
      if (!wrap.contains(e.target)) return;
      const overZoom = e.target.closest && e.target.closest("#map-zoom, #map-popup");
      if (overZoom) return;
      const intended = e.ctrlKey || e.metaKey || z > 1.001;
      if (!intended) return;
      e.preventDefault();
      hidePopup();
      const factor = Math.exp(-e.deltaY * 0.01);
      setZoomAt(e.clientX, e.clientY, z * factor);
    }, { passive: false });

    function onPointerDown(e) {
      if (e.target.closest && e.target.closest("#map-zoom, #map-popup, button, a, input")) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        panStart = { x: e.clientX, y: e.clientY, vx: vx, vy: vy, z: z };
        try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
        pinch = {
          dist: Math.hypot(dx, dy) || 1,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
          z: z
        };
        gesturing = true;
        hidePopup();
      }
    }
    function onPointerMove(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2 && pinch) {
        e.preventDefault();
        const pts = Array.from(pointers.values());
        const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
        const dist = Math.hypot(dx, dy) || 1;
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        setZoomAt(midX, midY, pinch.z * (dist / pinch.dist));
        gesturing = true;
        return;
      }
      if (!panStart || pointers.size !== 1) return;
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      if (!gesturing && Math.hypot(dx, dy) < 8) return;
      if (z <= 1.001) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          window.scrollBy(0, -dy);
          panStart.x = e.clientX;
          panStart.y = e.clientY;
        }
        return;
      }
      e.preventDefault();
      if (!gesturing) hidePopup();
      gesturing = true;
      const r = svg.getBoundingClientRect();
      const s = viewSize();
      vx = panStart.vx - (dx / r.width) * s.w;
      vy = panStart.vy - (dy / r.height) * s.h;
      applyView();
    }
    function onPointerUp(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        panStart = null;
        try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("lostpointercapture", onPointerUp);

    if (btnIn) btnIn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      hidePopup();
      zoomBy(1.6);
    });
    if (btnOut) btnOut.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      hidePopup();
      zoomBy(1 / 1.6);
    });
    if (btnReset) btnReset.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      hidePopup();
      resetView();
    });
    applyView();
  }

  function bindMap() {
    const wrap = document.getElementById("world-wrap");
    const pop = popupEl();
    if (!wrap) return;
    colourMap();
    const svg = wrap.querySelector("svg");
    if (svg) addHitTargets(svg);
    bindZoom(wrap);

    wrap.addEventListener("pointerover", function (e) {
      if (!finePointer.matches) return;
      if (wrap._mapDidPan && wrap._mapDidPan()) return;
      const iso = isoFromEvent(e);
      if (!iso) return;
      const path = e.target.closest && e.target.closest("path[data-iso], circle.hit[data-iso]");
      if (path && path.blur) path.blur();
      clearTimeout(hideTimer);
      showPopup(iso, e.clientX, e.clientY);
    });

    wrap.addEventListener("pointerout", function (e) {
      if (!finePointer.matches) return;
      const to = e.relatedTarget;
      if (to && pop && (to === pop || pop.contains(to))) return;
      if (to && wrap.contains(to) && to.closest && to.closest("path[data-iso], circle.hit[data-iso]")) return;
      hideTimer = setTimeout(hidePopup, 200);
    });

    if (pop) {
      pop.addEventListener("pointerenter", function () { clearTimeout(hideTimer); });
      pop.addEventListener("pointerleave", function () {
        if (finePointer.matches) hideTimer = setTimeout(hidePopup, 150);
      });
      pop.addEventListener("click", function (e) {
        const btn = e.target.closest(".popup-card");
        if (btn && btn.dataset.iso) {
          e.preventDefault();
          e.stopPropagation();
          const iso = btn.dataset.iso;
          hidePopup();
          openCard(iso);
        }
      });
    }

    wrap.addEventListener("click", function (e) {
      if (wrap._mapDidPan && wrap._mapDidPan()) {
        if (wrap._clearMapPan) wrap._clearMapPan();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.target.closest && e.target.closest("#map-zoom")) return;
      const iso = isoFromEvent(e);
      if (!iso) return;
      const path = e.target.closest("path[data-iso], circle.hit[data-iso]");
      if (path && path.blur) path.blur();
      if (finePointer.matches) {
        hidePopup();
        openCard(iso);
        return;
      }
      if (popupIso === iso) {
        hidePopup();
        openCard(iso);
      } else {
        showPopup(iso, e.clientX, e.clientY);
      }
    });

    document.addEventListener("click", function (e) {
      const p = document.getElementById("map-popup");
      if (!p || p.hidden) return;
      if (p.contains(e.target)) return;
      if (e.target.closest && e.target.closest("#world-wrap path[data-iso], #world-wrap circle.hit")) return;
      if (e.target.closest && e.target.closest("#map-zoom")) return;
      hidePopup();
    });
  }

  function bindSearch() {
    search.addEventListener("input", function () {
      renderGrid(visibleList());
    });
  }

  detail.addEventListener("click", function (e) {
    if (e.target === detail) closeCard();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (detail.open) closeCard();
      hidePopup();
    }
  });

  function counts() {
    if (statusLine) statusLine.textContent = "";
  }

  renderAz();
  renderLegend();
  renderGrid(visibleList());
  bindGrid();
  bindMap();
  bindLegend();
  bindSearch();
  counts();
  ["BRA","ITA","JPN","USA","SEN","AUS","IND","CHN","MEX","FRA"].forEach(function (iso) {
    const c = byIso[iso];
    const src = c && dishImage(c);
    if (src) whenPhotoReady(src, function () {});
  });

  if (location.hash) {
    const iso = location.hash.replace("#", "").toUpperCase();
    if (byIso[iso]) setTimeout(function () { openCard(iso); }, 0);
  }
})();
