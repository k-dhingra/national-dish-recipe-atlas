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

  function bindMap() {
    const wrap = document.getElementById("world-wrap");
    const pop = popupEl();
    if (!wrap) return;
    colourMap();

    wrap.addEventListener("pointerover", function (e) {
      if (!finePointer.matches) return;
      const path = e.target.closest && e.target.closest("path[data-iso]");
      if (!path || path.classList.contains("other") || path.classList.contains("ws")) return;
      const iso = path.getAttribute("data-iso");
      if (!byIso[iso]) return;
      if (path.blur) path.blur();
      clearTimeout(hideTimer);
      showPopup(iso, e.clientX, e.clientY);
    });

    wrap.addEventListener("pointerout", function (e) {
      if (!finePointer.matches) return;
      const to = e.relatedTarget;
      if (to && pop && (to === pop || pop.contains(to))) return;
      if (to && wrap.contains(to) && to.closest && to.closest("path[data-iso]")) return;
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
      const path = e.target.closest("path[data-iso]");
      if (!path) return;
      const iso = path.getAttribute("data-iso");
      if (!byIso[iso]) return;
      if (path.blur) path.blur();
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
      if (e.target.closest && e.target.closest("#world-wrap path[data-iso]")) return;
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
