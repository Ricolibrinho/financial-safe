(() => {
  const CONFIG = {
    defaultLang: "de",
    langStorageKey: "cofre_lang_v2",
    countdownStoragePrefix: "cofre_countdown_end_v2_", // + lang
    i18nPath: ".", // pasta dos JSON
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function getLangFromUrl() {
    const url = new URL(window.location.href);
    const lang = (url.searchParams.get("lang") || "").toLowerCase();
    return ["pt", "fr", "de", "es", "eua"].includes(lang) ? lang : null;
  }

  function setTextSmart(el, value) {
    if (typeof value === "string" && /<\/?[a-z][\s\S]*>/i.test(value)) el.innerHTML = value;
    else el.textContent = value ?? "";
  }

  function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  async function loadJson(lang) {
    const res = await fetch(`${CONFIG.i18nPath}/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar i18n: ${lang}.json`);
    return res.json();
  }

  function applyI18n(lang, dict) {
    document.documentElement.dataset.lang = lang;
    document.documentElement.setAttribute("lang", dict?.meta?.htmlLang || (lang === "pt" ? "pt-BR" : lang));

    // title/description (com data-i18n e data-i18n-attr)
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = getPath(dict, key);
      if (value !== undefined) setTextSmart(el, value);
    });

    $$("[data-i18n-attr]").forEach((el) => {
      const raw = el.getAttribute("data-i18n-attr"); // "attr:key"
      const [attr, key] = raw.split(":");
      const value = getPath(dict, key);
      if (value !== undefined) el.setAttribute(attr, value);
    });

    // ativa botão do idioma
    $$("[data-lang-link]").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("data-lang-link") === lang);
    });

    // ano
    const yearEl = $("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function setAllButtonsToCheckout(checkoutUrl) {
    // 1) Todo elemento marcado explicitamente
    $$("[data-checkout]").forEach((el) => {
      if (el.tagName.toLowerCase() === "a") el.setAttribute("href", checkoutUrl);
      el.addEventListener("click", (e) => {
        // se for button, redireciona
        if (el.tagName.toLowerCase() !== "a") {
          e.preventDefault();
          window.location.href = checkoutUrl;
        }
      });
    });

    // 2) GARANTIA: qualquer .btn que seja link e não seja link de idioma
    $$("a.btn").forEach((a) => {
      const isLang = a.hasAttribute("data-lang-link");
      if (isLang) return;
      // todos os outros botões-link vão pro checkout
      a.setAttribute("href", checkoutUrl);
    });

    // 3) Qualquer <button class="btn"> vira redirect
    $$("button.btn").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = checkoutUrl;
      });
    });
  }

  // Ripple
  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function enableRipple() {
    $$("[data-ripple]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = clamp(e.clientX - rect.left, 0, rect.width);
        const y = clamp(e.clientY - rect.top, 0, rect.height);

        const ripple = document.createElement("span");
        ripple.className = "ripple";
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });
    });
  }

  // Accordion
  function enableAccordion() {
    const accordion = $("[data-accordion]");
    if (!accordion) return;

    $$(".faq__item", accordion).forEach((item) => {
      const q = $(".faq__q", item);
      const a = $(".faq__a", item);
      const icon = $(".faq__icon", item);
      if (!q || !a) return;

      q.addEventListener("click", () => {
        const isOpen = q.getAttribute("aria-expanded") === "true";

        $$(".faq__q", accordion).forEach((btn) => btn.setAttribute("aria-expanded", "false"));
        $$(".faq__a", accordion).forEach((ans) => (ans.hidden = true));
        $$(".faq__icon", accordion).forEach((ic) => (ic.textContent = "+"));

        if (!isOpen) {
          q.setAttribute("aria-expanded", "true");
          a.hidden = false;
          if (icon) icon.textContent = "–";
        }
      });
    });
  }

  // Countdown “mais tentador”
  function initCountdown(lang, countdownConfig) {
    const els = $$("[data-countdown]");
    if (!els.length) return;

    // Config vindo do JSON
    const hours = Number(countdownConfig?.hours ?? 2);
    const endText = String(countdownConfig?.endText ?? "—");

    const key = `${CONFIG.countdownStoragePrefix}${lang}`;
    const now = Date.now();
    const saved = localStorage.getItem(key);

    let endTime = 0;
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed > now) endTime = parsed;
    }
    if (!endTime) {
      endTime = now + hours * 60 * 60 * 1000;
      localStorage.setItem(key, String(endTime));
    }

    const pad = (n) => String(n).padStart(2, "0");
    const format = (ms) => {
      const total = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    };

    const tick = () => {
      const left = endTime - Date.now();
      if (left <= 0) {
        els.forEach((el) => (el.textContent = endText));
        clearInterval(timer);
        return;
      }
      els.forEach((el) => (el.textContent = format(left)));
    };

    const timer = setInterval(tick, 250);
    tick();
  }
  function updateMetaTags(dict) {
    if (!dict?.meta) return;
  
    if (dict.meta.title) {
      document.title = dict.meta.title;
    }
  
    const desc = document.querySelector('meta[name="description"]');
    if (desc && dict.meta.description) {
      desc.setAttribute("content", dict.meta.description);
    }
  
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && dict.meta.og_title) {
      ogTitle.setAttribute("content", dict.meta.og_title);
    }
  
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && dict.meta.description) {
      ogDesc.setAttribute("content", dict.meta.description);
    }
  
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", window.location.href);
    }
  }
  async function init() {
    const urlLang = getLangFromUrl();
    const savedLang = localStorage.getItem(CONFIG.langStorageKey);
    const lang = urlLang || savedLang || CONFIG.defaultLang;

    let dict;
    try {
      dict = await loadJson(lang);
    } catch (e) {
      // fallback para pt
      dict = await loadJson(CONFIG.defaultLang);
    }

    localStorage.setItem(CONFIG.langStorageKey, dict?.meta?.lang || lang);

    applyI18n(dict?.meta?.lang || lang, dict);
    updateMetaTags(dict);

    // checkout por idioma (no JSON)
    const checkoutUrl = dict?.checkoutUrl;
    if (!checkoutUrl) {
      console.warn("checkoutUrl não definido no JSON do idioma.");
    } else {
      setAllButtonsToCheckout(checkoutUrl);
    }

    enableRipple();
    enableAccordion();
    initCountdown(dict?.meta?.lang || lang, dict?.countdown);

    // troca de idioma sem reload (mantém link fixo, mas faz SPA-like)
    $$("[data-lang-link]").forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        const next = a.getAttribute("data-lang-link");
        if (!next) return;

        const url = new URL(window.location.href);
        url.searchParams.set("lang", next);
        window.history.replaceState({}, "", url.toString());

        const nextDict = await loadJson(next);
        localStorage.setItem(CONFIG.langStorageKey, next);

        applyI18n(next, nextDict);
        updateMetaTags(nextDict);


        // atualiza checkout para esse idioma
        if (nextDict?.checkoutUrl) setAllButtonsToCheckout(nextDict.checkoutUrl);

        // reinicia countdown pro idioma
        initCountdown(next, nextDict?.countdown);
      });
    });
  }

  // IMPORTANTE: fetch de JSON precisa de servidor (não funciona abrindo file://)
  // Use Live Server / Vite / Netlify / etc.
  init().catch(console.error);
})();
