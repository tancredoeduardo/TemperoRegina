(function () {
  "use strict";

  const routeMeta = {
    "/": {
      title: "Tempero Regina - Temperos e Condimentos desde 1967",
      description:
        "Conheça a Tempero Regina, indústria de temperos e condimentos de Mossoró que leva sabor à mesa dos brasileiros desde 1967.",
    },
    "/catalogo": {
      title: "Catálogo de Produtos - Tempero Regina",
      description:
        "Explore o catálogo da Tempero Regina com temperos, vinagres, molhos, alhos, especiarias e linhas comerciais.",
    },
    "/catalogo-impressao": {
      title: "Catálogo Imprimível - Tempero Regina",
      description:
        "Versão imprimível do catálogo de produtos Tempero Regina, organizada por categorias.",
    },
    "/receitas": {
      title: "Receitas - Tempero Regina",
      description:
        "Receitas com temperos Regina para pratos do dia a dia, carnes, acompanhamentos e refeições especiais.",
    },
    "/blog": {
      title: "Blog - Tempero Regina",
      description:
        "Notícias, dicas culinárias, lançamentos e histórias da Tempero Regina.",
    },
    "/contato": {
      title: "Contato - Tempero Regina",
      description:
        "Fale com a Tempero Regina, consulte endereço, telefone, e-mail e envie sua mensagem para a equipe.",
    },
    "/revendedores": {
      title: "Seja Revendedor - Tempero Regina",
      description:
        "Cadastre sua empresa para receber contato comercial e revender produtos Tempero Regina.",
    },
    "/faq": {
      title: "Dúvidas Frequentes - Tempero Regina",
      description:
        "Perguntas frequentes sobre produtos, atendimento comercial, receitas e a Tempero Regina.",
    },
    "/quem-somos": {
      title: "Quem Somos - Tempero Regina",
      description:
        "Conheça a história, tradição e estrutura da Tempero Regina.",
    },
    "/eventos": {
      title: "Eventos - Tempero Regina",
      description:
        "Eventos, feiras e ações comerciais com participação da Tempero Regina.",
    },
    "/admin": {
      title: "Admin - Leads Tempero Regina",
      description:
        "Painel administrativo para consulta de leads da Tempero Regina.",
    },
  };

  const REGION_STATES = {
    todos: ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
    nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    norte: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
    "centro-oeste": ["DF", "GO", "MS", "MT"],
    sudeste: ["ES", "MG", "RJ", "SP"],
    sul: ["PR", "RS", "SC"],
  };
  const LOCAL_MEDIA_FALLBACKS = {
    heroRed: "/assets/hero-banner-regina-red.png",
    heroPurple: "/assets/hero-banner-regina-purple.png",
  };
  const EXTERNAL_MEDIA_MIRRORS = {
    "https://temperoregina.com.br/lib/img/logo.png":
      "/assets/remote/logo-34d4ad8b213f.png",
    "https://temperoregina.com.br/lib/img/logo-icon.png":
      "/assets/remote/logo-icon-175566889191.png",
    "https://temperoregina.com.br/lib/img/quemsomos-logo.png":
      "/assets/remote/quemsomos-logo-aa0c8ad277fe.png",
    "https://temperoregina.com.br/adm/midia/image/a2412261540460.webp":
      "/assets/remote/a2412261540460-b4c6c950a69c.webp",
    "https://temperoregina.com.br/adm/midia/image/2412261540460.png":
      "/assets/remote/2412261540460-248376f5fd5f.png",
  };
  const PAGE_MEDIA_FALLBACKS = {
    "/quem-somos": LOCAL_MEDIA_FALLBACKS.heroRed,
    "/receitas": LOCAL_MEDIA_FALLBACKS.heroPurple,
    "/blog": LOCAL_MEDIA_FALLBACKS.heroRed,
    "/eventos": LOCAL_MEDIA_FALLBACKS.heroPurple,
  };
const CONTACT_MAP_LABEL = "Tempero Regina";
const CONTACT_ADDRESS = "Av. Alberto Maranhao, 100 - Belo Horizonte, Mossoro - RN, 59600-485";
const CONTACT_MAP_COORDS = "-5.187654321098765,-37.34456789012345";
const CONTACT_MAP_QUERY = encodeURIComponent(`${CONTACT_MAP_LABEL}, ${CONTACT_ADDRESS}`);
const CONTACT_MAP_EMBED_URL = `https://maps.google.com/maps?hl=pt-BR&q=${CONTACT_MAP_QUERY}&z=16&output=embed`;
const CONTACT_MAP_LINK = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CONTACT_MAP_COORDS)}`;
  const ORDER_WHATSAPP_PHONE = "558433161600";
  const ORDER_BASE_MESSAGE = "Ola! Quero fazer um pedido com a equipe comercial da Tempero Regina.";
const ADMIN_SESSION_KEY = "regina_admin_unlocked";
const ADMIN_LEAD_LIMIT = 300;
const ADMIN_CONTENT_STORAGE_KEY = "regina_admin_content_drafts";
const ADMIN_MODULES = [
  {
    id: "produtos",
    title: "Produtos",
    singular: "produto",
    description: "Organize destaques, lancamentos e ajustes que entram no catalogo.",
  },
  {
    id: "receitas",
    title: "Receitas",
    singular: "receita",
    description: "Planeje receitas, chamadas e pautas para publicacao no site.",
  },
  {
    id: "eventos",
    title: "Eventos",
    singular: "evento",
    description: "Acompanhe eventos, feiras e ativacoes comerciais da marca.",
  },
];
const ENHANCE_DEBOUNCE_MS = 120;
  let enhanceTimer = 0;
  let isEnhancing = false;
  let pendingEnhance = false;
  let adminRouteRetryTimer = 0;
  let adminRouteRetryCount = 0;
  let mirroredAssetMap = null;
  let mirroredAssetMapLoading = false;

  function normalizeMediaSrc(src) {
    if (!src) return "";
    try {
      return new URL(src, window.location.origin).href;
    } catch (error) {
      return String(src);
    }
  }

  function resolveMirroredExternalAsset(src) {
    const normalizedSrc = normalizeMediaSrc(src);
    if (EXTERNAL_MEDIA_MIRRORS[normalizedSrc]) {
      return EXTERNAL_MEDIA_MIRRORS[normalizedSrc];
    }

    let normalizedWithoutQuery = normalizedSrc;
    try {
      const parsed = new URL(normalizedSrc);
      normalizedWithoutQuery = `${parsed.origin}${parsed.pathname}`;
      if (EXTERNAL_MEDIA_MIRRORS[normalizedWithoutQuery]) {
        return EXTERNAL_MEDIA_MIRRORS[normalizedWithoutQuery];
      }
    } catch (error) {
      normalizedWithoutQuery = normalizedSrc.split("?")[0];
    }

    const mappedAsset =
      mirroredAssetMap?.[normalizedSrc] || mirroredAssetMap?.[normalizedWithoutQuery];
    if (!mappedAsset) return null;
    return normalizeMappedAssetPath(mappedAsset);
  }

  function normalizeMappedAssetPath(assetPath) {
    if (!assetPath) return null;
    return String(assetPath).replace(/^\.\//, "/").replace(/\\/g, "/");
  }

  function resolveRootAssetPath(src) {
    if (!src) return null;

    const rawSrc = String(src).trim();
    if (/^\.\/assets\//i.test(rawSrc)) return rawSrc.replace(/^\./, "");
    if (/^assets\//i.test(rawSrc)) return `/${rawSrc}`;

    try {
      const parsed = new URL(rawSrc, window.location.origin);
      if (parsed.origin !== window.location.origin) return null;

      const nestedAssetMatch = parsed.pathname.match(/\/assets\/.+$/i);
      if (nestedAssetMatch && !parsed.pathname.startsWith("/assets/")) {
        return nestedAssetMatch[0];
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function loadMirroredAssetMap() {
    if (mirroredAssetMap || mirroredAssetMapLoading) return;
    mirroredAssetMapLoading = true;
    fetch("/assets/asset-map.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((map) => {
        if (map && typeof map === "object") {
          mirroredAssetMap = map;
          enhanceProductPageLayout();
          enhanceMediaStates();
        }
      })
      .catch((error) => {
        console.debug("mapa de imagens locais indisponível", error);
      })
      .finally(() => {
        mirroredAssetMapLoading = false;
      });
  }

  function isExternalFragileMedia(src) {
    const normalizedSrc = normalizeMediaSrc(src);
    return (
      /readdy\.ai\/api\/search-image/i.test(normalizedSrc) ||
      Boolean(resolveMirroredExternalAsset(normalizedSrc))
    );
  }

  function resolveLocalImageFallback(img) {
    if (!img) return null;

    const currentSrc = img.currentSrc || img.getAttribute("src") || "";
    const alt = (img.getAttribute("alt") || "").toLowerCase();
    const pathname = window.location.pathname;
    const pageFallback = PAGE_MEDIA_FALLBACKS[pathname];
    const isHeroMedia = Boolean(
      img.closest("section#hero") ||
        img.closest(".rg-about-hero") ||
        img.closest("div.relative.w-full"),
    );
    const rootedAsset = resolveRootAssetPath(currentSrc);
    const mirroredAsset = resolveMirroredExternalAsset(currentSrc);

    if (rootedAsset) {
      return rootedAsset;
    }

    if (mirroredAsset) {
      return mirroredAsset;
    }

    if (
      pathname === "/quem-somos" &&
      (alt.includes("história") || alt.includes("regina") || isHeroMedia)
    ) {
      return LOCAL_MEDIA_FALLBACKS.heroRed;
    }

    if (pageFallback && (isHeroMedia || isExternalFragileMedia(currentSrc))) {
      return pageFallback;
    }

    return null;
  }

  function applyImageFallback(img, fallbackSrc) {
    if (!img || !fallbackSrc) return false;
    if (img.dataset.fallbackApplied === fallbackSrc) return true;

    img.dataset.fallbackApplied = fallbackSrc;
    img.removeAttribute("srcset");
    img.classList.remove("media-error");

    if (img.getAttribute("src") !== fallbackSrc) {
      img.setAttribute("src", fallbackSrc);
    }

    img.alt = img.alt || "Imagem Tempero Regina";
    return true;
  }

  function isLocalRuntime() {
    return ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  }

  function hasEnvPlaceholder(value) {
    return /%[A-Z0-9_]+%/i.test(String(value || ""));
  }

  function getBrowserSupabaseConfig() {
    const source = window.REGINA_SUPABASE_CONFIG || {};
    const url = String(source.url || "").trim().replace(/\/+$/, "");
    const key = String(source.publishableKey || source.anonKey || "").trim();
    const table = String(source.submissionsTable || "site_submissions").trim() || "site_submissions";
    const adminAccessKey = String(source.adminAccessKey || "").trim();

    if (!url || !key || hasEnvPlaceholder(url) || hasEnvPlaceholder(key)) return null;
    if (!/^https:\/\/.+\.supabase\.co$/i.test(url)) return null;
    return {
      url,
      key,
      table,
      adminAccessKey: !adminAccessKey || hasEnvPlaceholder(adminAccessKey) ? "" : adminAccessKey,
    };
  }

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  async function submitToSupabase(kind, payload) {
    const config = getBrowserSupabaseConfig();
    if (!config) return { ok: false, reason: "missing-config" };

    const row = {
      id: createSubmissionId(),
      kind,
      created_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      payload,
    };

    const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `Supabase retornou ${response.status}`);
    }

    return { ok: true };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatAdminDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  function getLeadPayload(lead) {
    return lead?.payload && typeof lead.payload === "object" ? lead.payload : {};
  }

  function pickPayloadValue(payload, keys) {
    for (const key of keys) {
      const value = payload[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
    return "";
  }

  function getLeadName(lead) {
    const payload = getLeadPayload(lead);
    return (
      pickPayloadValue(payload, ["name", "nome", "fullName", "empresa", "company"]) ||
      pickPayloadValue(lead, ["name", "nome"]) ||
      "Sem nome"
    );
  }

  function getLeadEmail(lead) {
    const payload = getLeadPayload(lead);
    return pickPayloadValue(payload, ["email", "emailAddress", "e_mail"]) || pickPayloadValue(lead, ["email"]);
  }

  function getLeadPhone(lead) {
    const payload = getLeadPayload(lead);
    return pickPayloadValue(payload, ["phone", "telefone", "whatsapp", "celular"]);
  }

  function getLeadMessage(lead) {
    const payload = getLeadPayload(lead);
    const message = pickPayloadValue(payload, [
      "message",
      "mensagem",
      "assunto",
      "cidade",
      "estado",
      "segmento",
    ]);
    if (message) return message;

    const ignored = new Set(["name", "nome", "fullName", "empresa", "company", "email", "emailAddress", "e_mail", "phone", "telefone", "whatsapp", "celular"]);
    const summary = Object.entries(payload)
      .filter(([key, value]) => !ignored.has(key) && value !== undefined && value !== null && String(value).trim())
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${String(value).trim()}`)
      .join(" | ");
    return summary || "-";
  }

function getLeadSearchText(lead) {
  return [
    getLeadName(lead),
    getLeadEmail(lead),
    getLeadPhone(lead),
      getLeadMessage(lead),
      lead?.kind,
      lead?.created_at,
    ]
    .join(" ")
    .toLowerCase();
}

function isAnalyticsSubmission(lead) {
  const payload = getLeadPayload(lead);
  const kind = String(lead?.kind || payload.kind || "").toLowerCase();
  const eventName = String(payload.event || "").toLowerCase();
  const path = String(payload.path || "").toLowerCase();
  const rawMessage = String(getLeadMessage(lead) || "").toLowerCase();
  const hasContactInfo = Boolean(
    getLeadEmail(lead) ||
      getLeadPhone(lead) ||
      pickPayloadValue(payload, ["name", "nome", "fullName", "empresa", "company"])
  );

  return (
    kind === "analytics" ||
    (!hasContactInfo && Boolean(eventName || path || payload.ts)) ||
    rawMessage.startsWith("analytics") ||
    rawMessage.includes("event: page_view") ||
    rawMessage.includes("path: /admin") ||
    rawMessage.includes("page_view") ||
    rawMessage.includes("payload: [object object]")
  );
}

function isAdminContentSubmission(lead) {
  return String(lead?.kind || "").toLowerCase().startsWith("admin_");
}

function getAdminModuleKind(moduleId) {
  return `admin_${moduleId}`;
}

function getModuleItems(leadsList, moduleId) {
  return leadsList.filter(
    (lead) => String(lead?.kind || "").toLowerCase() === getAdminModuleKind(moduleId)
  );
}

function renderAdminModuleItem(module, lead) {
  const payload = getLeadPayload(lead);
  const title =
    pickPayloadValue(payload, ["title", "titulo", "name", "nome"]) ||
    `Novo ${module.singular}`;
  const status = pickPayloadValue(payload, ["status", "situacao"]) || "Rascunho";
  const notes = pickPayloadValue(payload, ["notes", "observacoes", "message", "mensagem"]);

  return `
    <article class="rg-admin-module-item">
      <div>
        <h3>${escapeHtml(title)}</h3>
        ${notes ? `<p>${escapeHtml(notes)}</p>` : ""}
        <span>${escapeHtml(status)} - ${escapeHtml(formatAdminDate(lead.created_at))}</span>
      </div>
      <button class="rg-admin-secondary-action" type="button" data-admin-module-delete="${escapeHtml(
        lead.id
      )}" data-admin-module-id="${escapeHtml(module.id)}">Remover</button>
    </article>
  `;
}

function renderAdminModulePanel(module) {
  return `
    <section class="rg-admin-panel rg-admin-card" data-admin-panel="${escapeHtml(module.id)}" hidden>
      <div class="rg-admin-module-layout">
        <div class="rg-admin-module-copy">
          <span class="rg-admin-kicker">${escapeHtml(module.title)}</span>
          <h2>Administrar ${escapeHtml(module.title)}</h2>
          <p>${escapeHtml(module.description)}</p>
        </div>
        <form class="rg-admin-module-form" data-admin-module-form>
          <input type="hidden" name="module" value="${escapeHtml(module.id)}" />
          <label>
            Titulo
            <input name="title" type="text" placeholder="Nome do ${escapeHtml(module.singular)}" required />
          </label>
          <label>
            Status
            <input name="status" type="text" placeholder="Ex.: destaque, publicado, rascunho" />
          </label>
          <label>
            Observacoes
            <textarea name="notes" placeholder="Anote ajustes, chamadas ou proximas acoes"></textarea>
          </label>
          <button type="submit">Salvar no painel</button>
          <span class="rg-admin-module-state" data-admin-module-state></span>
        </form>
      </div>
      <div class="rg-admin-module-list" data-admin-module-list="${escapeHtml(module.id)}"></div>
    </section>
  `;
}

  async function fetchAdminLeads() {
    const config = getBrowserSupabaseConfig();
    if (!config) throw new Error("Supabase nao configurado.");

    const select = "id,kind,created_at,user_agent,payload";
    const url = `${config.url}/rest/v1/${encodeURIComponent(config.table)}?select=${encodeURIComponent(select)}&order=created_at.desc&limit=${ADMIN_LEAD_LIMIT}`;
    const response = await fetch(url, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || "Nao foi possivel carregar os leads.");
    }

    return response.json();
  }

  async function deleteAdminLead(id) {
    const config = getBrowserSupabaseConfig();
    if (!config) throw new Error("Supabase nao configurado.");

    const url = `${config.url}/rest/v1/${encodeURIComponent(config.table)}?id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Prefer: "return=minimal",
      },
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || "Nao foi possivel deletar o lead.");
    }
  }

  function clearAdminRouteRetry() {
    if (adminRouteRetryTimer) {
      window.clearTimeout(adminRouteRetryTimer);
      adminRouteRetryTimer = 0;
    }
    adminRouteRetryCount = 0;
  }

  function scheduleAdminRouteRetry() {
    if (location.pathname !== "/admin") {
      clearAdminRouteRetry();
      return;
    }

    if (adminRouteRetryTimer || adminRouteRetryCount >= 8) return;

    const delay = adminRouteRetryCount < 3 ? 120 : 350;
    adminRouteRetryTimer = window.setTimeout(() => {
      adminRouteRetryTimer = 0;
      adminRouteRetryCount += 1;

      const root = document.getElementById("root");
      const hasAdminPage = Boolean(root?.querySelector(".rg-admin-page"));

      if (location.pathname !== "/admin") {
        clearAdminRouteRetry();
        return;
      }

      if (root && !hasAdminPage) {
        delete root.dataset.rgAdminReady;
        renderAdminRoute();
        return;
      }

      if (adminRouteRetryCount < 8) {
        scheduleAdminRouteRetry();
      }
    }, delay);
  }

  function renderAdminRoute() {
    if (location.pathname !== "/admin") {
      document.body.classList.remove("rg-admin-body");
      clearAdminRouteRetry();
      return false;
    }

    const root = document.getElementById("root");
    if (!root) {
      scheduleAdminRouteRetry();
      return true;
    }

    const hasAdminPage = Boolean(root.querySelector(".rg-admin-page"));
    if (root.dataset.rgAdminReady === "true" && hasAdminPage) {
      scheduleAdminRouteRetry();
      return true;
    }

    root.dataset.rgAdminReady = "true";
    document.body.classList.add("rg-admin-body");
    document.title = routeMeta["/admin"].title;
    root.innerHTML = `
      <main class="rg-admin-page">
        <header class="rg-admin-header">
          <a class="rg-admin-logo" href="/" aria-label="Voltar para o site">
            <img src="/assets/remote/logo-34d4ad8b213f.png" alt="Tempero Regina" />
          </a>
          <a class="rg-admin-back" href="/">Voltar ao site</a>
        </header>

        <section class="rg-admin-shell" aria-labelledby="admin-title">
          <div class="rg-admin-hero">
            <p>Painel administrativo</p>
            <h1 id="admin-title">Painel Regina</h1>
            <span>Acompanhe contatos comerciais e organize produtos, receitas e eventos em um so lugar.</span>
          </div>

          <div class="rg-admin-login rg-admin-card" data-admin-login>
            <div class="rg-admin-login-copy">
              <span class="rg-admin-kicker">Acesso restrito</span>
              <h2>Entrar no painel</h2>
              <p>Entre com a senha administrativa para acessar os contatos e as areas de conteudo do site.</p>
              <div class="rg-admin-config-note">
                <strong>Protecao ativa</strong>
                <span>Acesso protegido por senha e dados conectados ao Supabase.</span>
              </div>
            </div>
            <form data-admin-login-form>
              <label for="admin-password">Senha admin</label>
              <div class="rg-admin-password-field">
                <input id="admin-password" type="password" name="password" autocomplete="current-password" placeholder="Digite sua senha" required />
                <button class="rg-admin-password-toggle" type="button" data-admin-password-toggle aria-controls="admin-password" aria-pressed="false">Mostrar</button>
              </div>
              <button type="submit">Entrar no painel</button>
            </form>
            <div class="rg-admin-state" data-admin-login-state></div>
          </div>

          <div class="rg-admin-dashboard" data-admin-dashboard hidden>
            <div class="rg-admin-toolbar rg-admin-card">
              <div>
                <strong data-admin-count>0 leads</strong>
                <span>Ordenados por data mais recente</span>
              </div>
              <div class="rg-admin-actions">
                <button type="button" data-admin-refresh>Atualizar</button>
                <button type="button" data-admin-logout>Sair</button>
              </div>
            </div>

            <nav class="rg-admin-tabs rg-admin-card" aria-label="Areas do painel">
              <button class="rg-admin-tab is-active" type="button" data-admin-tab="leads" aria-selected="true">Leads</button>
              ${ADMIN_MODULES.map(
                (module) =>
                  `<button class="rg-admin-tab" type="button" data-admin-tab="${escapeHtml(
                    module.id
                  )}" aria-selected="false">${escapeHtml(module.title)}</button>`
              ).join("")}
            </nav>

            <section class="rg-admin-panel is-active" data-admin-panel="leads">
            <label class="rg-admin-search">
              <span>Buscar por nome, e-mail ou mensagem</span>
              <input type="search" data-admin-search placeholder="Buscar leads..." />
            </label>

            <div class="rg-admin-stats" data-admin-stats></div>

            <div class="rg-admin-table-wrap rg-admin-card">
              <table class="rg-admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Contato</th>
                    <th>Tipo</th>
                    <th>Mensagem</th>
                    <th>Data</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody data-admin-table></tbody>
              </table>
              <div class="rg-admin-empty" data-admin-empty hidden>Nenhum lead encontrado.</div>
            </div>
            </section>

            ${ADMIN_MODULES.map(renderAdminModulePanel).join("")}
          </div>
        </section>
      </main>
    `;

    setupAdminPanel(root);
    scheduleAdminRouteRetry();
    return true;
  }

  function setupAdminPanel(root) {
    const config = getBrowserSupabaseConfig();
    const login = root.querySelector("[data-admin-login]");
    const dashboard = root.querySelector("[data-admin-dashboard]");
    const loginForm = root.querySelector("[data-admin-login-form]");
    const loginState = root.querySelector("[data-admin-login-state]");
    const passwordInput = root.querySelector("#admin-password");
    const passwordToggle = root.querySelector("[data-admin-password-toggle]");
    const table = root.querySelector("[data-admin-table]");
    const empty = root.querySelector("[data-admin-empty]");
    const searchInput = root.querySelector("[data-admin-search]");
    const countNode = root.querySelector("[data-admin-count]");
    const statsNode = root.querySelector("[data-admin-stats]");
    const refreshButton = root.querySelector("[data-admin-refresh]");
    const logoutButton = root.querySelector("[data-admin-logout]");
    const tabButtons = root.querySelectorAll("[data-admin-tab]");
    const panels = root.querySelectorAll("[data-admin-panel]");
    const moduleForms = root.querySelectorAll("[data-admin-module-form]");
    let leads = [];
    let search = "";

    function setLoginMessage(message, isError = true) {
      if (!loginState) return;
      loginState.textContent = message || "";
      loginState.classList.toggle("is-error", Boolean(isError));
    }

    function showLogin() {
      login.hidden = false;
      dashboard.hidden = true;
    }

    function showDashboard() {
      login.hidden = true;
      dashboard.hidden = false;
      loadLeads();
    }

    function getVisibleLeadRows() {
      return leads.filter((lead) => !isAnalyticsSubmission(lead) && !isAdminContentSubmission(lead));
    }

    function renderModuleList(moduleId) {
      const module = ADMIN_MODULES.find((item) => item.id === moduleId);
      const list = root.querySelector(`[data-admin-module-list="${moduleId}"]`);
      if (!module || !list) return;

      const items = getModuleItems(leads, moduleId);
      list.innerHTML = items.length
        ? items.map((lead) => renderAdminModuleItem(module, lead)).join("")
        : `<div class="rg-admin-module-empty">Nenhum ${escapeHtml(
            module.singular
          )} salvo ainda.</div>`;
    }

    function renderAllModules() {
      ADMIN_MODULES.forEach((module) => renderModuleList(module.id));
    }

    function setActivePanel(panelId) {
      tabButtons.forEach((button) => {
        const isActive = button.getAttribute("data-admin-tab") === panelId;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      panels.forEach((panel) => {
        const isActive = panel.getAttribute("data-admin-panel") === panelId;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });
    }

    function renderRows() {
      const visibleLeads = getVisibleLeadRows();
      const filtered = visibleLeads.filter((lead) => getLeadSearchText(lead).includes(search));
      table.innerHTML = filtered
        .map((lead) => {
          const email = getLeadEmail(lead);
          const phone = getLeadPhone(lead);
          return `
            <tr>
              <td><strong>${escapeHtml(getLeadName(lead))}</strong></td>
              <td>
                ${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : "<span>-</span>"}
                ${phone ? `<small>${escapeHtml(phone)}</small>` : ""}
              </td>
              <td><span class="rg-admin-badge">${escapeHtml(lead.kind || "lead")}</span></td>
              <td>${escapeHtml(getLeadMessage(lead))}</td>
              <td>${escapeHtml(formatAdminDate(lead.created_at))}</td>
              <td><button class="rg-admin-danger" type="button" data-admin-delete="${escapeHtml(lead.id)}">Deletar</button></td>
            </tr>
          `;
        })
        .join("");

      empty.hidden = filtered.length > 0;
      countNode.textContent = `${filtered.length} lead${filtered.length === 1 ? "" : "s"}`;

      const hiddenInternal = Math.max(0, leads.length - visibleLeads.length);
      const withEmail = visibleLeads.filter((lead) => getLeadEmail(lead)).length;
      const withPhone = visibleLeads.filter((lead) => getLeadPhone(lead)).length;
      statsNode.innerHTML = `
        <span><strong>${visibleLeads.length}</strong>Leads exibidos</span>
        <span><strong>${withEmail}</strong>Com e-mail</span>
        <span><strong>${withPhone}</strong>Com telefone</span>
        <span><strong>${hiddenInternal}</strong>Registros tecnicos ocultos</span>
      `;
    }

    async function loadLeads() {
      table.innerHTML = `<tr><td colspan="6">Carregando leads...</td></tr>`;
      empty.hidden = true;
      try {
        leads = await fetchAdminLeads();
        renderRows();
        renderAllModules();
      } catch (error) {
        table.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message || "Erro ao carregar leads.")}</td></tr>`;
      }
    }

    passwordToggle?.addEventListener("click", () => {
      if (!passwordInput) return;
      const shouldShow = passwordInput.type === "password";
      passwordInput.type = shouldShow ? "text" : "password";
      passwordToggle.textContent = shouldShow ? "Ocultar" : "Mostrar";
      passwordToggle.setAttribute("aria-pressed", shouldShow ? "true" : "false");
      passwordInput.focus();
    });

    if (!config) {
      setLoginMessage("Painel ainda nao conectado ao Supabase. Confira as variaveis publicas no ambiente de deploy.");
      return;
    }

    if (!config.adminAccessKey) {
      setLoginMessage("Senha administrativa ainda nao configurada no ambiente de deploy.");
      return;
    }

    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
      showDashboard();
    } else {
      showLogin();
    }

    loginForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const password = String(new FormData(loginForm).get("password") || "");
      if (password !== config.adminAccessKey) {
        setLoginMessage("Senha invalida.");
        return;
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setLoginMessage("", false);
      showDashboard();
    });

    searchInput?.addEventListener("input", () => {
      search = searchInput.value.trim().toLowerCase();
      renderRows();
    });

    refreshButton?.addEventListener("click", loadLeads);
    logoutButton?.addEventListener("click", () => {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      showLogin();
    });

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActivePanel(button.getAttribute("data-admin-tab") || "leads");
      });
    });

    moduleForms.forEach((moduleForm) => {
      moduleForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(moduleForm);
        const moduleId = String(formData.get("module") || "");
        const module = ADMIN_MODULES.find((item) => item.id === moduleId);
        const state = moduleForm.querySelector("[data-admin-module-state]");
        const submitButton = moduleForm.querySelector('button[type="submit"]');
        if (!module) return;

        const title = String(formData.get("title") || "").trim();
        const status = String(formData.get("status") || "").trim();
        const notes = String(formData.get("notes") || "").trim();
        if (!title) return;

        if (state) {
          state.textContent = "Salvando...";
          state.classList.remove("is-error");
        }
        if (submitButton) submitButton.disabled = true;

        try {
          const result = await submitToSupabase(getAdminModuleKind(module.id), {
            title,
            status: status || "Rascunho",
            notes,
            name: title,
            message: notes || status || title,
            updated_at: new Date().toISOString(),
          });
          if (result && result.ok === false) {
            throw new Error("Nao foi possivel salvar no Supabase.");
          }
          moduleForm.reset();
          if (state) state.textContent = `${module.singular} salvo com sucesso.`;
          await loadLeads();
          setActivePanel(module.id);
        } catch (error) {
          if (state) {
            state.textContent = error.message || "Erro ao salvar.";
            state.classList.add("is-error");
          }
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      });
    });

    dashboard?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-admin-module-delete]");
      if (!button) return;
      const id = button.getAttribute("data-admin-module-delete");
      const moduleId = button.getAttribute("data-admin-module-id") || "leads";
      if (!id || !confirm("Remover este item do painel?")) return;
      button.disabled = true;
      button.textContent = "Removendo...";
      try {
        await deleteAdminLead(id);
        leads = leads.filter((lead) => lead.id !== id);
        renderAllModules();
        renderRows();
        setActivePanel(moduleId);
      } catch (error) {
        alert(error.message || "Nao foi possivel remover o item.");
        button.disabled = false;
        button.textContent = "Remover";
      }
    });

    table?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-admin-delete]");
      if (!button) return;
      const id = button.getAttribute("data-admin-delete");
      if (!id || !confirm("Deletar este lead?")) return;
      button.disabled = true;
      button.textContent = "Deletando...";
      try {
        await deleteAdminLead(id);
        leads = leads.filter((lead) => lead.id !== id);
        renderRows();
      } catch (error) {
        alert(error.message || "Nao foi possivel deletar o lead.");
        button.disabled = false;
        button.textContent = "Deletar";
      }
    });
  }

  function postLocalApi(endpoint, payload, options = {}) {
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: Boolean(options.keepalive),
    });
  }

  function postAnalytics(event, payload) {
    if (location.pathname === "/admin") return;

    const analyticsPayload = {
      event,
      payload: payload || {},
      path: location.pathname,
      ts: new Date().toISOString(),
    };

    if (getBrowserSupabaseConfig()) {
      submitToSupabase("analytics", analyticsPayload).catch((error) => {
        console.debug("analytics supabase indisponível", error);
      });
      return;
    }

    if (!isLocalRuntime()) return;

    const body = JSON.stringify(analyticsPayload);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
        return;
      }
      postLocalApi("/api/analytics", analyticsPayload, { keepalive: true });
    } catch (error) {
      console.debug("analytics local indisponível", error);
    }
  }

  function setMeta(name, content, attr) {
    const key = attr || "name";
    let node = document.querySelector(`meta[${key}="${name}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(key, name);
      document.head.appendChild(node);
    }
    node.setAttribute("content", content);
  }

  function applySeo() {
    const productMatch = location.pathname.match(/^\/produto\/([^/]+)/);
    const eventMatch = location.pathname.match(/^\/eventos\/([^/]+)/);
    const meta =
      (productMatch && {
        title: "Produto Tempero Regina",
        description: "Detalhes do produto, categoria e download de imagem no catálogo Tempero Regina.",
      }) ||
      (eventMatch && {
        title: "Detalhe do Evento - Tempero Regina",
        description: "Informações do evento selecionado da Tempero Regina.",
      }) ||
      routeMeta[location.pathname] ||
      routeMeta["/"];
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("og:title", meta.title, "property");
    setMeta("og:description", meta.description, "property");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
  }

  function patchHistory() {
    ["pushState", "replaceState"].forEach((method) => {
      const original = history[method];
      history[method] = function () {
        const result = original.apply(this, arguments);
        setTimeout(onRouteChange, 0);
        return result;
      };
    });
    window.addEventListener("popstate", onRouteChange);
  }

  function onRouteChange() {
    applySeo();
    postAnalytics("page_view");
    if (location.pathname === "/admin") {
      adminRouteRetryCount = 0;
      renderAdminRoute();
      return;
    }
    clearAdminRouteRetry();
    scheduleEnhance(140);
  }

  function runEnhanceSafely() {
    if (isEnhancing) {
      pendingEnhance = true;
      return;
    }
    isEnhancing = true;
    try {
      enhanceDom();
    } finally {
      isEnhancing = false;
      if (pendingEnhance) {
        pendingEnhance = false;
        scheduleEnhance(90);
      }
    }
  }

  function scheduleEnhance(delay = ENHANCE_DEBOUNCE_MS) {
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(runEnhanceSafely, delay);
  }

  function decodeBrokenText(root) {
    const replacements = {
      "CatÃ¡logo": "Catálogo",
      "VisualizaÃ§Ã£o": "Visualização",
      "EndereÃ§o": "Endereço",
      "HorÃ¡rio": "Horário",
      "vocÃª": "você",
      "fÃ¡brica": "fábrica",
      "Ã¡": "á",
      "Ã©": "é",
      "Ã­": "í",
      "Ã³": "ó",
      "Ãº": "ú",
      "Ã£": "ã",
      "Ã§": "ç",
      "Ãª": "ê",
      "Ã": "Á",
      "Ã‰": "É",
      "Ã": "Í",
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let text = node.nodeValue;
      Object.keys(replacements).forEach((from) => {
        text = text.split(from).join(replacements[from]);
      });
      node.nodeValue = text;
    });
  }

  function enhanceForms() {
    function sanitizeFormPayload(payload) {
      return Object.entries(payload).reduce((accumulator, [key, value]) => {
        if (typeof value !== "string") {
          accumulator[key] = value;
          return accumulator;
        }
        const sanitizedValue = value.trim();
        if (sanitizedValue) {
          accumulator[key] = sanitizedValue;
        }
        return accumulator;
      }, {});
    }

    function resolveFormEndpoint(data) {
      return data.mensagem || data.assunto || data.telefone
        ? "/api/contact"
        : "/api/newsletter";
    }

    function resolveSubmissionKind(data) {
      return data.mensagem || data.assunto || data.telefone ? "contact" : "newsletter";
    }

    async function submitFormData(kind, endpoint, data) {
      if (getBrowserSupabaseConfig()) {
        return submitToSupabase(kind, data);
      }
      if (!isLocalRuntime()) {
        throw new Error("Supabase não configurado para receber o formulário.");
      }
      const response = await postLocalApi(endpoint, data);
      if (!response.ok) throw new Error("Falha ao enviar");
      return { ok: true };
    }

    function resolveSuccessMessage(endpoint) {
      return endpoint === "/api/newsletter"
        ? "Cadastro realizado com sucesso. Você receberá nossas novidades em breve."
        : "Recebemos sua mensagem. Nossa equipe retornará em breve.";
    }

    document.querySelectorAll("form").forEach((form) => {
      if (form.dataset.localEnhanced) return;
      const action = form.getAttribute("action") || "";
      if (!action.includes("readdy.ai/api/form")) return;
      form.dataset.localEnhanced = "true";
      form.setAttribute("action", "#");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const originalText = button ? button.textContent : "";
        const rawData = Object.fromEntries(new FormData(form).entries());
        const data = sanitizeFormPayload(rawData);
        const endpoint = resolveFormEndpoint(data);
        const kind = resolveSubmissionKind(data);
        if (button) {
          button.disabled = true;
          button.textContent = "Enviando...";
        }
        form.setAttribute("aria-busy", "true");
        form.classList.remove("form-error", "form-success");
        try {
          await submitFormData(kind, endpoint, data);
          form.reset();
          form.classList.add("form-success");
          showFormMessage(form, resolveSuccessMessage(endpoint), "success");
          postAnalytics("form_submit_success", { endpoint, kind });
        } catch (error) {
          form.classList.add("form-error");
          showFormMessage(form, "Não foi possível enviar agora. Tente novamente em instantes.", "error");
          postAnalytics("form_submit_error", { endpoint, kind, message: error.message });
        } finally {
          form.setAttribute("aria-busy", "false");
          if (button) {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      });
    });
  }

  function showFormMessage(form, text, type) {
    let message = form.querySelector(".local-form-message");
    if (!message) {
      message = document.createElement("p");
      message.className = "local-form-message";
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");
      message.setAttribute("aria-atomic", "true");
      form.appendChild(message);
    }
    message.textContent = text;
    message.dataset.type = type;
  }

  function enhanceCatalogCta() {
    const catalogPdfHref = "/download/catalogo-regina.pdf";
    const catalogPdfName = "catalogo-regina.pdf";

    document.querySelectorAll("a").forEach((link) => {
      const text = (link.textContent || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const href = link.getAttribute("href") || "";
      const pointsToPrintableCatalog =
        href.includes("catalogo-regina.pdf") ||
        href.includes("catalogo-impressao") ||
        text.includes("catalogo imprimivel");

      if (!pointsToPrintableCatalog) return;

      link.href = catalogPdfHref;
      link.setAttribute("download", catalogPdfName);
      link.setAttribute("type", "application/pdf");
      link.setAttribute("aria-label", "Baixar catálogo imprimível da Tempero Regina em PDF");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.textContent = "Ver catálogo imprimível";

      if (link.dataset.catalogDownloadEnhanced === "true") return;
      link.dataset.catalogDownloadEnhanced = "true";
      link.addEventListener("click", () => postAnalytics("catalog_pdf_download"));
    });
  }

  function repositionHomeNewsletter() {
    if (location.pathname !== "/") return;

    const productsSection = document.querySelector("section#nossos-produtos");
    const recipesSection = document.querySelector("section#receitas");
    const newsletterSection =
      document.querySelector("form#newsletter-form")?.closest("section") ||
      Array.from(document.querySelectorAll("section")).find((section) =>
        /fique por dentro das novidades|newsletter/i.test(section.textContent || ""),
      );

    if (!productsSection || !recipesSection || !newsletterSection) return;
    if (newsletterSection === recipesSection || newsletterSection === productsSection) return;
    if (newsletterSection.nextElementSibling === recipesSection) return;

    recipesSection.parentElement?.insertBefore(newsletterSection, recipesSection);
  }

  function enhanceHomeRecipesCompact() {
    if (location.pathname !== "/") return;

    const recipesSection = document.querySelector("section#receitas");
    if (!recipesSection || recipesSection.dataset.compactEnhanced === "true") return;

    recipesSection.dataset.compactEnhanced = "true";
    recipesSection.classList.add("rg-home-recipes-compact");
  }

  function enhanceNavigation() {
    // Mantem o topo mais limpo: remove itens "Blog" e "Revendedores".
    document.querySelectorAll("header a, nav a").forEach((link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      const text = (link.textContent || "").trim().toLowerCase();
      if (href === "/blog" || href === "/revendedores" || text === "blog" || text.includes("revendedor")) {
        const parent = link.parentElement;
        link.remove();
        if (
          parent &&
          (parent.tagName === "LI" || parent.tagName === "DIV") &&
          parent.children.length === 0 &&
          !parent.textContent?.trim()
        ) {
          parent.remove();
        }
      }
    });
  }

  function enhanceClickableCards() {
    document.querySelectorAll(".cursor-pointer").forEach((element) => {
      if (element.dataset.a11yEnhanced) return;
      element.dataset.a11yEnhanced = "true";
      if (!element.getAttribute("role")) element.setAttribute("role", "button");
      if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "0");
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          element.click();
        }
      });
    });
  }

  function enhanceMediaStates() {
    document.querySelectorAll("img").forEach((img) => {
      const rootedSrc = resolveRootAssetPath(img.getAttribute("src") || "");
      if (rootedSrc && img.getAttribute("src") !== rootedSrc) {
        img.removeAttribute("srcset");
        img.setAttribute("src", rootedSrc);
      }

      const localFallback = resolveLocalImageFallback(img);
      const currentSrc = img.currentSrc || img.getAttribute("src") || "";
      if (localFallback && (isExternalFragileMedia(currentSrc) || resolveRootAssetPath(currentSrc))) {
        applyImageFallback(img, localFallback);
      }

      if (img.dataset.mediaEnhanced) return;
      img.dataset.mediaEnhanced = "true";
      const isCriticalImage = Boolean(img.closest("#hero, section#hero, header"));
      if (isCriticalImage) {
        img.loading = "eager";
        img.fetchPriority = "high";
        } else if (!img.getAttribute("loading")) {
          img.loading = "lazy";
        }
        if (!img.getAttribute("decoding")) img.decoding = "async";
        img.addEventListener("error", () => {
          const fallbackSrc = resolveLocalImageFallback(img);
          if (fallbackSrc && img.dataset.fallbackApplied !== fallbackSrc) {
            if (applyImageFallback(img, fallbackSrc)) return;
          }
          img.classList.add("media-error");
          img.alt = img.alt || "Imagem indisponível";
          if (!img.dataset.fallbackApplied) {
            img.dataset.fallbackApplied = "true";
            img.removeAttribute("srcset");
        }
        postAnalytics("image_error", { src: img.currentSrc || img.src });
      });
    });

    document.querySelectorAll("iframe").forEach((frame) => {
      if (frame.dataset.mediaEnhanced) return;
      frame.dataset.mediaEnhanced = "true";
      const holder = frame.parentElement;
      if (holder) holder.classList.add("map-loading");
      const timer = setTimeout(() => {
        if (holder) holder.classList.add("map-slow");
      }, 4000);
      frame.addEventListener("load", () => {
        clearTimeout(timer);
        if (holder) holder.classList.remove("map-loading", "map-slow");
      });
      frame.addEventListener("error", () => {
        clearTimeout(timer);
        if (holder) holder.classList.add("map-error");
        postAnalytics("map_error");
      });
    });
  }

  function enhanceContactMap() {
    if (location.pathname !== "/contato") return;

    const frame = document.querySelector(
      'iframe[src*="google.com/maps"], iframe[title*="Localização" i], iframe[title*="Localizacao" i]'
    );
    if (!frame) return;

    const holder = frame.parentElement;
    const currentSrc = frame.getAttribute("src") || "";

    if (holder) {
      holder.classList.add("rg-contact-map-card");
      holder.classList.remove("map-error");
    }

    if (currentSrc !== CONTACT_MAP_EMBED_URL) {
      frame.removeAttribute("data-media-enhanced");
      frame.setAttribute("src", CONTACT_MAP_EMBED_URL);
    }

  frame.classList.add("rg-contact-map-frame");
  frame.setAttribute("title", "Mapa com a localizacao da Tempero Regina em Mossoro");
  frame.setAttribute("aria-label", "Mapa com a localizacao da Tempero Regina em Mossoro");
  frame.setAttribute("loading", "lazy");
  frame.setAttribute("allowfullscreen", "");
  frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    frame.setAttribute("width", "100%");
    frame.setAttribute("height", "100%");
    frame.style.border = "0";
    frame.style.minHeight = "";

  if (holder) {
    let actions = holder.querySelector("[data-rg-map-actions]");
    if (!actions) {
      actions = document.createElement("div");
      actions.dataset.rgMapActions = "true";
      holder.appendChild(actions);
    }

    actions.className = "rg-contact-map-actions";

    let link = actions.querySelector("a");
    if (!link) {
      link = document.createElement("a");
      actions.appendChild(link);
    }

    link.href = CONTACT_MAP_LINK;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Abrir rota no Google Maps";
    link.setAttribute("aria-label", "Abrir rota para a Tempero Regina no Google Maps");

    if (!link.dataset.rgMapClick) {
      link.dataset.rgMapClick = "true";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const opened = window.open(CONTACT_MAP_LINK, "_blank", "noopener,noreferrer");
        if (!opened) {
          window.location.href = CONTACT_MAP_LINK;
        }
      });
    }
  }
}

  function shouldObserveMutationNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    const element = /** @type {Element} */ (node);
    if (
      element.matches("main,section,header,nav,form,img,iframe,svg,[id],[class]") ||
      element.querySelector("form, img, iframe, section, header, nav, #map, svg")
    ) {
      return true;
    }
    return false;
  }

  let searchTimer = 0;
  function enhanceSearchAnalytics() {
    document.querySelectorAll('input[placeholder*="Buscar"]').forEach((input) => {
      if (input.dataset.searchEnhanced) return;
      input.dataset.searchEnhanced = "true";
      input.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          const noResult = document.body.innerText.includes("Nenhum produto encontrado") ||
            document.body.innerText.includes("Nenhuma notícia encontrada") ||
            document.body.innerText.includes("Nenhuma pergunta encontrada");
          if (input.value.trim() && noResult) {
            postAnalytics("search_no_results", {
              query: input.value.trim(),
              placeholder: input.getAttribute("placeholder"),
            });
          }
        }, 800);
      });
    });
  }

  function enhanceClickAnalytics() {
    if (document.body.dataset.clickAnalytics) return;
    document.body.dataset.clickAnalytics = "true";
    document.body.addEventListener("click", (event) => {
      const target = event.target.closest("a,button");
      if (!target) return;
      const href = target.getAttribute("href") || "";
      const label = target.getAttribute("aria-label") || target.textContent.trim();
      if (href.startsWith("mailto:") || href.startsWith("tel:")) {
        postAnalytics("contact_click", { href, label });
      }
      if (href.includes("/adm/midia/image/") || label.toLowerCase().includes("download")) {
        postAnalytics("download_click", { href, label });
      }
      if (label.toLowerCase().includes("lista") || label.toLowerCase().includes("desejo")) {
        postAnalytics("wishlist_action", { label });
      }
    });
  }

  function getProductOrderMessage() {
    const title = document.querySelector("section h1, h1");
    const productName = title?.textContent?.replace(/\s+/g, " ").trim();
    if (!productName) return ORDER_BASE_MESSAGE;
    return `Ola! Quero fazer um pedido do produto ${productName}.`;
  }

  function enhanceProductOrderButton() {
    if (!location.pathname.startsWith("/produto/")) return;

    const title = document.querySelector("section h1, h1");
    if (!title) return;

    const infoPanel = title.closest(".flex-1") || title.parentElement;
    if (!infoPanel || infoPanel.querySelector("[data-rg-product-order]")) return;

    const actionRow =
      Array.from(infoPanel.querySelectorAll("div")).find((node) => {
        const text = node.textContent || "";
        return text.includes("Download da Imagem") && text.includes("Compartilhar");
      }) || title.parentElement;

    if (!actionRow) return;

    const orderLink = document.createElement("a");
    const message = getProductOrderMessage();
    orderLink.dataset.rgProductOrder = "true";
    orderLink.className = "rg-product-order-button";
    orderLink.href = `https://wa.me/${ORDER_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    orderLink.target = "_blank";
    orderLink.rel = "noopener noreferrer";
    orderLink.setAttribute("aria-label", "Fazer pedido pelo WhatsApp");
    orderLink.innerHTML = '<span>Fazer pedido</span><span aria-hidden="true">→</span>';
    orderLink.addEventListener("click", () => {
      postAnalytics("product_order_click", { href: orderLink.href });
    });

    actionRow.classList.add("rg-product-action-row");
    actionRow.prepend(orderLink);
  }

  function enhanceBackToTopButton() {
    document.body.classList.add("rg-back-to-top-ready");

    const collectWishlistButtons = () =>
      Array.from(
        document.querySelectorAll(
          [
            'button[aria-label="Lista de Desejos"]',
            'button[title="Lista de Desejos"]',
            "div#root > button.fixed.bottom-5",
          ].join(","),
        ),
      ).filter((button) => button.id !== "rg-back-to-top");

    const hideWishlistButtons = () => {
      collectWishlistButtons().forEach((button) => {
        button.dataset.rgBackToTopDuplicate = "true";
        button.setAttribute("aria-hidden", "true");
        button.setAttribute("tabindex", "-1");
        button.style.display = "none";
      });
    };

    let floatingButton = document.getElementById("rg-back-to-top");

    if (!floatingButton) {
      floatingButton = document.createElement("button");
      floatingButton.id = "rg-back-to-top";
      document.body.appendChild(floatingButton);
    }

    floatingButton.dataset.rgBackToTop = "true";
    floatingButton.className = `${floatingButton.className} rg-back-to-top`
      .split(/\s+/)
      .filter(Boolean)
      .filter((className, index, all) => all.indexOf(className) === index)
      .join(" ");
    floatingButton.removeAttribute("style");
    floatingButton.setAttribute("type", "button");
    floatingButton.setAttribute("aria-label", "Voltar ao topo da pagina");
    floatingButton.setAttribute("title", "Voltar ao topo");
    floatingButton.innerHTML = `
      <span class="rg-back-to-top-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M12 5.5 5.5 12l1.7 1.7 3.6-3.6V19h2.4v-8.9l3.6 3.6 1.7-1.7z"></path>
        </svg>
      </span>
    `;

    if (!floatingButton.dataset.rgBackToTopClick) {
      floatingButton.dataset.rgBackToTopClick = "true";
      floatingButton.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        postAnalytics("back_to_top_click", {
          page: location.pathname,
        });
      });
    }

    const updateVisibility = () => {
      const currentButton = document.getElementById("rg-back-to-top");
      if (!currentButton) return;
      hideWishlistButtons();
      const footer = document.querySelector("footer");
      const footerNearViewport = footer
        ? footer.getBoundingClientRect().top <= window.innerHeight + 140
        : false;
      const scrolledEnough = window.scrollY > Math.max(160, window.innerHeight * 0.18);
      currentButton.classList.toggle("is-visible", scrolledEnough || footerNearViewport);
    };

    window.rgBackToTopUpdate = updateVisibility;
    hideWishlistButtons();
    updateVisibility();

    if (!document.body.dataset.rgBackToTopScroll) {
      document.body.dataset.rgBackToTopScroll = "true";
      window.addEventListener("scroll", updateVisibility, { passive: true });
      window.addEventListener("resize", updateVisibility, { passive: true });
    }

    if (!document.body.dataset.rgBackToTopObserver) {
      document.body.dataset.rgBackToTopObserver = "true";
      const observer = new MutationObserver(() => {
        if (window.rgBackToTopMutationPending) return;
        window.rgBackToTopMutationPending = true;
        window.requestAnimationFrame(() => {
          window.rgBackToTopMutationPending = false;
          hideWishlistButtons();
          window.rgBackToTopUpdate?.();
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function enhanceProductPageLayout() {
    if (!location.pathname.startsWith("/produto/")) return;

    document.body.classList.add("rg-product-page");

    const title = document.querySelector("section h1, h1");
    if (!title) return;

    const productSection = title.closest("section");
    if (productSection) {
      productSection.classList.add("rg-product-section");
    }

    const infoPanel = title.closest(".flex-1") || title.parentElement;
    const detailRow = infoPanel?.parentElement;
    if (detailRow) {
      detailRow.classList.add("rg-product-detail");
    }

    const productImages = Array.from(
      (productSection || document).querySelectorAll("img"),
    ).filter((img) => {
      const src = normalizeMediaSrc(img.currentSrc || img.getAttribute("src") || "");
      const alt = (img.getAttribute("alt") || "").toLowerCase();
      return !/logo|quemsomos|hero-banner/i.test(src) && !alt.includes("logo");
    });
    const productImage = productImages[0];
    if (!productImage) return;

    productImage.classList.add("rg-product-main-image");
    const mediaCard = productImage.closest(".aspect-square") || productImage.parentElement;
    const mediaShell = mediaCard?.parentElement;
    const mediaColumn = mediaShell?.parentElement;

    mediaCard?.classList.add("rg-product-media-card");
    mediaShell?.classList.add("rg-product-media-shell");
    mediaColumn?.classList.add("rg-product-image-column");

    const fallbackSrc = resolveLocalImageFallback(productImage);
    const currentSrc = productImage.currentSrc || productImage.getAttribute("src") || "";
    if (fallbackSrc && isExternalFragileMedia(currentSrc)) {
      applyImageFallback(productImage, fallbackSrc);
    }
  }

  function findPreviewArtifactRoot(node) {
    if (!(node instanceof Element)) return null;

    if (node.matches("#watermark, [id*='watermark']")) {
      return node;
    }

    const imageSource = node.getAttribute("src") || "";
    if (node.tagName === "IMG" && imageSource.includes("watermark.png") && imageSource.includes("readdy")) {
      return node.closest("#watermark, [id*='watermark'], div[style*='position: fixed']") || node;
    }

    const fixedParent = node.closest?.("div[style*='position: fixed']");
    if (!fixedParent) return null;

    const parentStyle = fixedParent.getAttribute("style") || "";
    const hasPreviewImage = Boolean(fixedParent.querySelector('img[src*="watermark.png"][src*="readdy"]'));
    const hasPreviewControls = Boolean(fixedParent.querySelector("#generate-button, #close-button"));

    if (parentStyle.includes("2147483647") && (hasPreviewImage || hasPreviewControls)) {
      return fixedParent;
    }

    return null;
  }

  function removePreviewArtifacts(root = document) {
    const scope = root instanceof Document ? root : root?.ownerDocument || document;
    const candidates = new Set([
      ...scope.querySelectorAll("#watermark, [id*='watermark']"),
      ...scope.querySelectorAll('img[src*="watermark.png"][src*="readdy"]'),
      ...scope.querySelectorAll("#generate-button, #close-button"),
    ]);

    if (root instanceof Element) {
      candidates.add(root);
      root.querySelectorAll?.("#watermark, [id*='watermark'], img[src*='watermark.png'][src*='readdy'], #generate-button, #close-button").forEach((node) =>
        candidates.add(node),
      );
    }

    candidates.forEach((node) => {
      const artifactRoot = findPreviewArtifactRoot(node);
      artifactRoot?.remove();
    });

    scope.querySelectorAll('script[src*="posthog"], script[src*="readdy"]').forEach((node) => node.remove());
  }

  function enhanceHomeHeroBannerWhenReady(attempt = 0) {
    if (location.pathname !== "/") return;

    enhanceHomeHeroBanner();

    const hasCta = Boolean(document.querySelector("section#hero .rg-home-hero-news-cta"));
    if (!hasCta && attempt < 6) {
      setTimeout(() => enhanceHomeHeroBannerWhenReady(attempt + 1), attempt < 2 ? 90 : 220);
    }
  }

  function enhanceDom() {
    if (renderAdminRoute()) return;
    removePreviewArtifacts();
    decodeBrokenText(document.body);
    enhanceForms();
    enhanceCatalogCta();
    enhanceNavigation();
    enhanceClickableCards();
    enhanceContactMap();
    loadMirroredAssetMap();
    enhanceProductPageLayout();
    enhanceMediaStates();
    enhanceSearchAnalytics();
    enhanceClickAnalytics();
    enhanceBackToTopButton();
    enhanceProductOrderButton();
    enhanceHeaderFixes();
    enhanceHomeHeroBannerWhenReady();
    repositionHomeNewsletter();
    enhanceHomeRecipesCompact();
    enhanceQuemSomosHero();
    enhanceNossasMarcasAlignment();
    enhancePresencaNacionalSectionV2();
  }

  function enhanceHeaderFixes() {
    // Evita problema de seções escondidas sob menu fixo.
    document.querySelectorAll("[id]").forEach((el) => {
      if (!el.dataset.scrollFixed) {
        el.style.scrollMarginTop = "120px";
        el.dataset.scrollFixed = "true";
      }
    });

    // Melhora leitura e clique do menu superior.
    document.querySelectorAll("header a, nav a").forEach((link) => {
      if (!link.dataset.menuEnhanced) {
        link.dataset.menuEnhanced = "true";
        link.style.minHeight = "36px";
        link.style.display = link.style.display || "inline-flex";
        link.style.alignItems = "center";
        link.style.paddingInline = link.style.paddingInline || "8px";
      }
    });
  }

  function enhanceHomeHeroBanner() {
    if (location.pathname !== "/") return;

    const hero = document.querySelector("section#hero");
    if (!hero) return;

    hero.classList.add("rg-home-hero-banner");

    const banners = [
      {
        src: "/assets/hero-banner-regina-red.png",
        alt: "Banner Tempero Regina com sabor nordestino e molho original",
      },
      {
        src: "/assets/hero-banner-regina-purple.png",
        alt: "Banner Tempero Regina com pasta de alho e massas",
      },
    ];

    const activeDot = Array.from(hero.querySelectorAll('button[aria-label^="Slide"]')).findIndex(
      (button) => button.querySelector("div"),
    );
    const currentIndex = activeDot >= 0 ? activeDot : 0;

    hero.querySelectorAll("img").forEach((img) => {
      const banner = banners[currentIndex % banners.length];
      if (img.getAttribute("src") !== banner.src) {
        img.setAttribute("src", banner.src);
      }
      img.removeAttribute("srcset");
      img.setAttribute("alt", banner.alt);
      img.loading = "eager";
      img.fetchPriority = currentIndex === 0 ? "high" : "auto";
      img.classList.add("rg-home-hero-banner-img");
    });

    const contentLayer = hero.querySelector(":scope > .absolute.inset-0.z-20.flex.items-center.justify-center");
    if (contentLayer) {
      contentLayer.classList.add("rg-home-hero-content-hidden");
      contentLayer.setAttribute("aria-hidden", "true");
    }

    if (!hero.querySelector(".rg-home-hero-news-cta")) {
      const cta = document.createElement("a");
      cta.className = "rg-home-hero-news-cta";
      cta.href = "/catalogo";
      cta.setAttribute("aria-label", "Conferir novidades do Tempero Regina");
      cta.innerHTML = '<span>Conferir novidades</span><span aria-hidden="true">→</span>';
      hero.appendChild(cta);
    }
  }

  function enhanceQuemSomosHero() {
    if (location.pathname !== "/quem-somos") return;

    const pageRoot = document.querySelector("div.min-h-screen.bg-regina-gray-warm");
    if (!pageRoot) return;

    const hero =
      pageRoot.querySelector(":scope > div.relative.w-full") ||
      pageRoot.querySelector("div.relative.w-full");
    if (!hero || hero.dataset.quemSomosEnhanced === "true") return;
    hero.dataset.quemSomosEnhanced = "true";
    hero.classList.add("rg-about-hero");

    const heroImage =
      hero.querySelector('img[alt*="história tempero regina" i]') ||
      hero.querySelector('img[alt*="história" i]') ||
      hero.querySelector("img");

    if (heroImage) {
      heroImage.style.display = "";
      heroImage.classList.add("rg-about-hero-media");
      const heroFallbackSrc = LOCAL_MEDIA_FALLBACKS.heroRed;
      const hasSource = Boolean(heroImage.getAttribute("src") || heroImage.getAttribute("srcset"));
      if (!hasSource) {
        if (!applyImageFallback(heroImage, heroFallbackSrc)) {
          hero.classList.add("rg-about-hero--media-fallback");
        }
      } else {
        heroImage.addEventListener(
          "error",
          () => {
            if (!applyImageFallback(heroImage, heroFallbackSrc)) {
              hero.classList.add("rg-about-hero--media-fallback");
            }
          },
          { once: true },
        );
      }
    } else {
      hero.classList.add("rg-about-hero--media-fallback");
    }

    const overlay = hero.querySelector(":scope > .absolute.inset-0:nth-of-type(2)");
    if (overlay) overlay.classList.add("rg-about-hero-overlay");

    const contentLayer = hero.querySelector(":scope > .absolute.inset-0.flex.items-center.justify-center");
    if (contentLayer) contentLayer.classList.add("rg-about-hero-content");

    if (!hero.querySelector(".rg-about-hero-glow")) {
      const glow = document.createElement("div");
      glow.className = "rg-about-hero-glow";
      hero.insertBefore(glow, hero.firstChild);
    }
  }

  function enhanceNossasMarcasAlignment() {
    const heading = Array.from(document.querySelectorAll("h1, h2, h3")).find((node) =>
      node.textContent && node.textContent.trim().toLowerCase().includes("nossas marcas"),
    );
    if (!heading) return;

    const section = heading.closest("section");
    if (!section || section.dataset.marcasCentered === "true") return;
    section.dataset.marcasCentered = "true";

    section.style.textAlign = "center";
    heading.style.marginInline = "auto";

    const intro = heading.parentElement ? heading.parentElement.querySelector("p") : null;
    if (intro) {
      intro.style.marginInline = "auto";
    }

    section.querySelectorAll(".grid, .flex").forEach((container) => {
      container.style.justifyContent = "center";
      container.style.marginInline = "auto";
    });
  }

  function extractPresencaCounts(section) {
    const numbers = (section.textContent || "").match(/\d+/g) || [];
    return {
      repsCount: numbers[0] || "58",
      statesCount: numbers[1] || "27",
    };
  }

  function buildPresencaSectionMarkup(repsCount, statesCount, panelVersion) {
    return `
      <div class="rg-presenca-v3" data-rg-presenca-v3="true" data-rg-version="${panelVersion}">
        <header class="rg-presenca-v3-header">
          <h2>Nossos Vendedores</h2>
          <p>Com ${repsCount} representantes em ${statesCount} estados do Brasil, clique na região para visualizar a cobertura.</p>
        </header>

        <div class="rg-presenca-v3-top">
          <div class="rg-presenca-v3-filters" data-rg-region-controls="true">
            <button type="button" class="rg-region-btn is-active" data-rg-region="todos">Todos</button>
            <button type="button" class="rg-region-btn" data-rg-region="nordeste">Nordeste</button>
            <button type="button" class="rg-region-btn" data-rg-region="norte">Norte</button>
            <button type="button" class="rg-region-btn" data-rg-region="centro-oeste">Centro-Oeste</button>
            <button type="button" class="rg-region-btn" data-rg-region="sudeste">Sudeste</button>
            <button type="button" class="rg-region-btn" data-rg-region="sul">Sul</button>
          </div>
          <div class="rg-presenca-v3-legend">
            <span class="rg-presenca-v3-legend-item"><i class="rg-dot rg-dot-on"></i>Com vendedor</span>
            <span class="rg-presenca-v3-legend-item"><i class="rg-dot rg-dot-off"></i>Sem vendedor</span>
          </div>
        </div>

        <div class="rg-presenca-v3-stats">
          <article class="rg-presenca-v3-stat-card">
            <span>Representantes</span>
            <strong data-rg-stat-reps>${repsCount}</strong>
          </article>
          <article class="rg-presenca-v3-stat-card">
            <span>Estados atendidos</span>
            <strong data-rg-stat-states>${statesCount}</strong>
          </article>
        </div>

        <div class="rg-presenca-v3-map-card">
          <div class="rg-presenca-v3-map-badge" aria-hidden="true">
            <img src="/assets/remote/logo-34d4ad8b213f.png" alt="Tempero Regina" />
            <strong>Nossos Vendedores</strong>
          </div>
          <div class="rg-presenca-v3-map-stage" data-rg-map-stage="true"></div>
        </div>

        <div class="rg-presenca-v3-legend rg-presenca-v3-legend--bottom">
          <span class="rg-presenca-v3-legend-item"><i class="rg-dot rg-dot-on"></i>Com vendedor</span>
          <span class="rg-presenca-v3-legend-item"><i class="rg-dot rg-dot-off"></i>Sem vendedor</span>
        </div>
      </div>
    `;
  }

  function enhancePresencaNacionalSectionV2() {
    const section =
      document.querySelector("section#parceiros") ||
      Array.from(document.querySelectorAll("section")).find((node) =>
        /presen[cç]a nacional|nossos vendedores/i.test(node.textContent || ""),
      );
    if (!section) return;

    const mapSource =
      section.querySelector("#map svg") ||
      section.querySelector("svg#Camada_1") ||
      section.querySelector("svg.w-full.h-auto") ||
      section.querySelector("div.relative.w-full > svg");
    if (!mapSource) return;

    const PANEL_VERSION = "v4";
    const existingShell = section.querySelector('[data-rg-presenca-v3="true"]');
    if (existingShell && existingShell.dataset.rgVersion === PANEL_VERSION) return;

    const { repsCount, statesCount } = extractPresencaCounts(section);

    const mapSvg = mapSource.cloneNode(true);
    mapSvg.removeAttribute("style");
    mapSvg.classList.add("rg-brazil-map");
    mapSvg.setAttribute("role", "img");
    mapSvg.setAttribute("aria-label", "Mapa do Brasil com cobertura comercial por estado");

    mapSvg.querySelectorAll("style").forEach((node) => node.remove());
    mapSvg.querySelectorAll("circle, text").forEach((node) => node.remove());
    mapSvg.querySelectorAll("g").forEach((group) => {
      if (!group.querySelector('[id^="BR-"]')) group.remove();
    });
    mapSvg.querySelectorAll("path").forEach((pathNode) => {
      if (!pathNode.id || !pathNode.id.startsWith("BR-")) pathNode.remove();
    });

    const stateNodes = Array.from(mapSvg.querySelectorAll('[id^="BR-"]'));
    if (!stateNodes.length) return;

    stateNodes.forEach((stateNode) => {
      const uf = stateNode.id.replace("BR-", "").toUpperCase();
      stateNode.dataset.uf = uf;
      stateNode.setAttribute("tabindex", "0");
      stateNode.setAttribute("role", "button");
      stateNode.setAttribute("aria-label", `Estado ${uf}`);
      stateNode.style.cursor = "pointer";
      stateNode.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          stateNode.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      });
      stateNode.addEventListener("click", () => {
        postAnalytics("state_map_click", { uf });
      });
    });

    const highlightedSellers = new Set(["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"]);

    section.style.paddingTop = "1.75rem";
    section.style.paddingBottom = "2.3rem";
    section.style.background = "#f3f4f6";
    section.innerHTML = buildPresencaSectionMarkup(repsCount, statesCount, PANEL_VERSION);

    const mapStage = section.querySelector('[data-rg-map-stage="true"]');
    if (!mapStage) return;
    mapStage.appendChild(mapSvg);

    const regionButtons = Array.from(section.querySelectorAll("[data-rg-region]"));
    const statesCountNode = section.querySelector("[data-rg-stat-states]");

    function paintRegion(regionKey) {
      const key = REGION_STATES[regionKey] ? regionKey : "todos";
      const selectedRegionStates = new Set(REGION_STATES[key] || []);

      stateNodes.forEach((stateNode) => {
        const uf = stateNode.dataset.uf || "";
        const hasSeller = highlightedSellers.has(uf);
        const activeInFilter =
          key === "todos" ? hasSeller : selectedRegionStates.has(uf) && hasSeller;
        stateNode.dataset.active = activeInFilter ? "true" : "false";
      });

      regionButtons.forEach((button) => {
        const isActive = button.dataset.rgRegion === key;
        button.classList.toggle("is-active", isActive);
      });

      if (statesCountNode) {
        if (key === "todos") {
          statesCountNode.textContent = statesCount;
        } else {
          let visibleSellerCount = 0;
          selectedRegionStates.forEach((uf) => {
            if (highlightedSellers.has(uf)) visibleSellerCount += 1;
          });
          statesCountNode.textContent = String(visibleSellerCount);
        }
      }
    }

    regionButtons.forEach((button) => {
      button.addEventListener("click", () => paintRegion(button.dataset.rgRegion || "todos"));
    });

    paintRegion("todos");
  }

  patchHistory();
  applySeo();
  postAnalytics("page_view");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runEnhanceSafely);
  } else {
    runEnhanceSafely();
  }
  new MutationObserver((mutations) => {
    let shouldEnhance = false;

    mutations.forEach((mutation) => {
      Array.from(mutation.addedNodes || []).forEach((node) => {
        removePreviewArtifacts(node);
        if (shouldObserveMutationNode(node)) {
          shouldEnhance = true;
        }
      });
    });

    if (shouldEnhance) {
      scheduleEnhance();
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
