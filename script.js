(() => {
  const supported = ["en", "fr", "de", "es"];
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  const lang = supported.includes(urlLang) ? urlLang : "en";

  const i18n = {
    en: {
      meta: {
        title: "The Analytics Vault — Lifetime Access",
        description: "Lifetime access to deep, independent financial analysis."
      },
      headline: "The Analytics Vault",
      description: "Lifetime access to premium financial intelligence."
    },
    fr: {
      meta: {
        title: "Le Coffre d’Analyses — Accès à Vie",
        description: "Accès à vie à des analyses financières profondes et indépendantes."
      },
      headline: "Le Coffre d’Analyses",
      description: "Accès à vie à une intelligence financière premium."
    },
    de: {
      meta: {
        title: "Das Analyse-Archiv — Lebenslanger Zugang",
        description: "Lebenslanger Zugang zu tiefgehenden, unabhängigen Finanzanalysen."
      },
      headline: "Das Analyse-Archiv",
      description: "Lebenslanger Zugang zu premium Finanzwissen."
    },
    es: {
      meta: {
        title: "El Cofre de Análisis — Acceso de por Vida",
        description: "Acceso de por vida a análisis financieros profundos e independientes."
      },
      headline: "El Cofre de Análisis",
      description: "Acceso de por vida a inteligencia financiera premium."
    }
  };

  const dict = i18n[lang];

  // Update visible content
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  // Update meta tags for users
  document.title = dict.meta.title;

  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", dict.meta.description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", dict.meta.title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", dict.meta.description);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute("content", window.location.href);

  document.documentElement.lang = lang;
})();