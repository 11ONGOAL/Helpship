(() => {
  const products = window.PRODUCTS || [];
  const grid = document.querySelector("#products-grid");
  const searchInput = document.querySelector("#catalog-search");
  const heroSearch = document.querySelector("#hero-search");
  const heroSearchInput = document.querySelector("#hero-search-input");
  const filters = [...document.querySelectorAll(".filter")];
  const categoryCards = [...document.querySelectorAll(".category-card")];
  const resultsCount = document.querySelector("#results-count");
  const noResults = document.querySelector("#no-results");
  const modal = document.querySelector("#product-modal");
  const modalContent = document.querySelector("#modal-content");
  const closeModal = document.querySelector(".modal-close");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");

  let activeCategory = "Toate";
  let query = "";

  const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const safe = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  function isOutOfStock(stock) {
    const raw = normalize(stock);
    return raw === "0" || raw.startsWith("0 ") || raw.includes("indisponibil") || raw.includes("epuizat");
  }

  function whatsappLink(product) {
    const text = `Bună ziua, doresc oferta finală prin euShipments pentru produsul: ${product.name}.`;
    return `https://wa.me/40774663283?text=${encodeURIComponent(text)}`;
  }

  // Prețurile din window.PRODUCTS sunt FĂRĂ TVA.
  // Pentru toate produsele existente și adăugate ulterior, TVA = 21%.
  const VAT_PERCENT = 21;
  const moneyRO = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function priceWithVat(netPrice) {
    const input = String(netPrice ?? "");
    const currencyAmount = /(\d+(?:[.,]\d+)?)\s*(?:Lei|RON)\b/gi;
    const numberOnly = /^\s*(\d+(?:[.,]\d+)?)\s*$/;
    const inclVat = (amount) => {
      const netCents = Math.round(Number(amount.replace(",", ".")) * 100);
      const grossCents = Math.round(netCents * (100 + VAT_PERCENT) / 100);
      return `${moneyRO.format(grossCents / 100)} Lei`;
    };
    if (currencyAmount.test(input)) {
      currencyAmount.lastIndex = 0;
      return input.replace(currencyAmount, (_, amount) => inclVat(amount));
    }
    const match = input.match(numberOnly);
    return match ? inclVat(match[1]) : "";
  }

  function updateDetailPriceVat() {
    document.querySelectorAll(".detail-price").forEach(priceEl => {
      const vat = priceWithVat(priceEl.textContent);
      let vatEl = priceEl.parentElement.querySelector(".detail-vat");
      if (!vatEl) {
        vatEl = document.createElement("span");
        vatEl.className = "detail-vat";
        priceEl.insertAdjacentElement("afterend", vatEl);
      }
      vatEl.textContent = vat ? `(cu TVA ${VAT_PERCENT}%: ${vat})` : "";
      vatEl.hidden = !vat;
    });
  }

  function updateRelatedPrices() {
    document.querySelectorAll(".related-card strong").forEach(priceEl => {
      const vat = priceWithVat(priceEl.textContent);
      if (!vat) return;
      let vatEl = priceEl.nextElementSibling;
      if (!vatEl || !vatEl.classList.contains("related-vat")) {
        vatEl = document.createElement("small");
        vatEl.className = "related-vat";
        priceEl.insertAdjacentElement("afterend", vatEl);
      }
      vatEl.textContent = `(cu TVA ${VAT_PERCENT}%: ${vat})`;
    });
  }

  // Aceeași informație de contact pentru paginile noi create după acest șablon.
  function ensureContactShortcuts() {
    const navWrap = document.querySelector(".site-header .nav-wrap");
    if (navWrap && !navWrap.querySelector(".header-phone")) {
      const phone = document.createElement("a");
      phone.className = "header-phone";
      phone.href = "tel:+40774663283";
      phone.setAttribute("aria-label", "Sună la 0774 663 283");
      phone.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7l-1.7 1.7a16 16 0 0 0 6 6l1.7-1.7a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.3 2.6Z"/></svg><span>0774 663 283</span>`;
      const brand = navWrap.querySelector(".brand");
      if (brand) brand.insertAdjacentElement("afterend", phone);
    }
    if (!document.querySelector(".floating-whatsapp")) {
      const anchor = document.createElement("a");
      anchor.className = "floating-whatsapp";
      anchor.href = "https://wa.me/40774663283";
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("aria-label", "Contact pe WhatsApp: 0774 663 283");
      const img = document.createElement("img");
      img.src = `${grid ? "" : "../"}assets/images/whatsapp-logo.svg`;
      img.alt = "";
      img.width = 34;
      img.height = 34;
      anchor.appendChild(img);
      document.body.appendChild(anchor);
    }
  }

  function productCard(product) {
    const out = isOutOfStock(product.stock);
    const detailUrl = `products/${product.slug}.html`;
    return `
      <article class="product-card">
        <a class="product-image" href="${detailUrl}" aria-label="Vezi pagina produsului ${safe(product.name)}">
          <img src="${safe(product.image)}" alt="${safe(product.name)}" loading="lazy">
          <span class="category-pill">${safe(product.category)}</span>
          <span class="stock-pill ${out ? "out" : ""}">${out ? "Indisponibil" : "Disponibil"}</span>
        </a>
        <div class="product-body">
          <h3><a href="${detailUrl}">${safe(product.name)}</a></h3>
          <p class="product-description">${safe(product.description)}</p>
          <div class="product-meta">
            <div class="price-stack"><span class="product-price">${safe(product.price)}</span>${priceWithVat(product.price) ? `<span class="price-with-vat">(cu TVA ${VAT_PERCENT}%: ${safe(priceWithVat(product.price))})</span>` : ""}</div>
            <span class="product-stock">Stoc exact: ${safe(product.stock)}</span>
          </div>
          <div class="card-actions">
            <a class="btn btn-secondary" href="${detailUrl}">Vezi produsul</a>
            <a class="btn btn-primary" href="${whatsappLink(product)}" target="_blank" rel="noopener">WhatsApp</a>
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    if (!grid) return;
    const q = normalize(query);
    const filtered = products.filter(product => {
      const categoryMatches = activeCategory === "Toate" || product.category === activeCategory;
      const haystack = normalize(`${product.name} ${product.description} ${product.category}`);
      return categoryMatches && (!q || haystack.includes(q));
    });
    grid.innerHTML = filtered.map(productCard).join("");
    if (resultsCount) {
      resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? "produs afișat" : "produse afișate"}`;
    }
    if (noResults) noResults.hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;
  }

  function setCategory(category) {
    activeCategory = category;
    filters.forEach(btn => btn.classList.toggle("active", btn.dataset.category === category));
    render();
  }

  function openProduct(id) {
    if (!modalContent || !modal) return;
    const product = products.find(p => Number(p.id) === Number(id));
    if (!product) return;
    const out = isOutOfStock(product.stock);
    modalContent.innerHTML = `
      <div class="modal-image">
        <img src="${safe(product.image)}" alt="${safe(product.name)}">
      </div>
      <div class="modal-copy">
        <span class="category-pill" style="position:static;display:inline-flex">${safe(product.category)}</span>
        <h2>${safe(product.name)}</h2>
        <p>${safe(product.description)}</p>
        <div class="modal-price">${safe(product.price)}</div>
        ${priceWithVat(product.price) ? `<div class="modal-vat">(cu TVA ${VAT_PERCENT}%: ${safe(priceWithVat(product.price))})</div>` : ""}
        <div class="modal-stock">Stoc exact: ${safe(product.stock)} · ${out ? "Momentan indisponibil" : "Cantitate disponibilă la Alexa Imports"}</div>
        <div class="modal-actions">
          <a class="btn btn-primary" href="${whatsappLink(product)}" target="_blank" rel="noopener">Solicită oferta finală</a>
          <a class="btn btn-secondary" href="tel:+40774663283">Sună euShipments</a>
        </div>
        ${product.video ? `<a class="video-link" href="${safe(product.video)}" target="_blank" rel="noopener">Vezi video produs ↗</a>` : ""}
      </div>
    `;
    if (typeof modal.showModal === "function") modal.showModal();
  }

  filters.forEach(button => {
    button.addEventListener("click", () => setCategory(button.dataset.category));
  });

  categoryCards.forEach(button => {
    button.addEventListener("click", () => {
      setCategory(button.dataset.category);
      const productsSection = document.querySelector("#produse");
      if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", event => {
      query = event.target.value;
      render();
    });
  }

  if (heroSearch && heroSearchInput) {
    heroSearch.addEventListener("submit", event => {
      event.preventDefault();
      query = heroSearchInput.value;
      if (searchInput) searchInput.value = query;
      setCategory("Toate");
      const productsSection = document.querySelector("#produse");
      if (productsSection) productsSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (closeModal && modal) closeModal.addEventListener("click", () => modal.close());
  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) modal.close();
    });
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    mainNav.addEventListener("click", event => {
      if (event.target.matches("a")) {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
  ensureContactShortcuts();
  updateDetailPriceVat();
  updateRelatedPrices();
  render();
})();
