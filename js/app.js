/* National dishes A to Z. No build step. Works from file:// and GitHub Pages. */
(function () {
  const DATA = window.RECIPE_DATA || [];
  const grid = document.getElementById("grid");
  const search = document.getElementById("search");
  const az = document.getElementById("az");
  const detail = document.getElementById("detail");
  const detailInner = document.getElementById("detail-inner");
  const statusLine = document.getElementById("status-line");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const byIso = {};
  DATA.forEach(function (c) { byIso[c.iso3] = c; });

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
    if (!q) return DATA;
    return DATA.filter(function (c) {
      return (
        (c.country || "").toLowerCase().indexOf(q) >= 0 ||
        (c.dish || "").toLowerCase().indexOf(q) >= 0
      );
    });
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

  function bindMap() {
    const wrap = document.getElementById("world-wrap");
    if (!wrap) return;
    wrap.addEventListener("click", function (e) {
      const path = e.target.closest("path[data-iso]");
      if (!path) return;
      const iso = path.getAttribute("data-iso");
      if (byIso[iso]) openCard(iso);
    });
  }

  function bindSearch() {
    search.addEventListener("input", function () {
      renderGrid(filterQuery(search.value));
    });
  }

  detail.addEventListener("click", function (e) {
    if (e.target === detail) closeCard();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && detail.open) closeCard();
  });

  function counts() {
    var full = 0, linked = 0, desc = 0, none = 0, unresolved = 0;
    DATA.forEach(function (c) {
      if (!c.dish) none += 1;
      else if (c.status === "full_recipe") full += 1;
      else if (c.status === "link_only") {
        if (c.link_url && c.link_ok) linked += 1;
        else desc += 1;
      } else unresolved += 1;
    });
    statusLine.textContent =
      DATA.length + " countries in A to Z order. " +
      full + " with a Wikibooks Cookbook recipe. " +
      linked + " with a description and a recipe link. " +
      desc + " with a Wikipedia description only. " +
      none + " with no listed national dish.";
  }

  renderAz();
  renderGrid(DATA);
  bindGrid();
  bindMap();
  bindSearch();
  counts();

  if (location.hash) {
    const iso = location.hash.replace("#", "").toUpperCase();
    if (byIso[iso]) setTimeout(function () { openCard(iso); }, 0);
  }
})();
