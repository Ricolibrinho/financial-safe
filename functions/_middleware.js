export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Only handle the main HTML document
  const accept = request.headers.get("Accept") || "";
  const isHtml = accept.includes("text/html") || accept.includes("*/*");

  // Detect common social crawlers (WhatsApp/Facebook/Twitter/Telegram/Discord)
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();
  const isCrawler =
    ua.includes("facebookexternalhit") ||
    ua.includes("facebot") ||
    ua.includes("whatsapp") ||
    ua.includes("twitterbot") ||
    ua.includes("telegrambot") ||
    ua.includes("discordbot") ||
    ua.includes("linkedinbot") ||
    ua.includes("slackbot");

  if (!isHtml || !isCrawler) {
    return next();
  }

  // We only need to adjust the TITLE (and og:title) based on ?lang=
  const lang = (url.searchParams.get("lang") || "").toLowerCase();
  const metaMap = {"fr": {"title": "Le Coffre d’Analyses — Accès à Vie", "og_title": "Le Coffre d’Analyses — Accès à Vie"}, "de": {"title": "Das Analyse-Archiv — Lebenslanger Zugang", "og_title": "Das Analyse-Archiv — Lebenslanger Zugang"}, "es": {"title": "El Cofre de Análisis — Acceso de por Vida", "og_title": "El Cofre de Análisis — Acceso de por Vida"}, "eua": {"title": "The Analytics Vault — Lifetime Access", "og_title": "The Analytics Vault — Lifetime Access"}, "pt": {"title": "O Cofre de Análises — Acesso Vitalício", "og_title": "O Cofre de Análises — Acesso Vitalício"}};

  const selected = metaMap[lang] || metaMap["pt"] || null;
  if (!selected || !selected.title) {
    return next();
  }

  const res = await next();
  const ct = res.headers.get("Content-Type") || "";
  if (!ct.includes("text/html")) return res;

  let html = await res.text();

  // Replace <title>...</title>
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${selected.title}</title>`);

  // Replace og:title content (if present)
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta property="og:title" content="${selected.og_title || selected.title}" />`
  );

  // NOTE: user requested ONLY title fix. We keep links and all other content unchanged.

  const newHeaders = new Headers(res.headers);
  newHeaders.set("Content-Length", String(new TextEncoder().encode(html).length));

  return new Response(html, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}