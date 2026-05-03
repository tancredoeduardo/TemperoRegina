const { safeLower, trimText, nowIso } = require("./utils");

function validateEmail(value) {
  const text = trimText(value);
  if (!text || text.length > 160) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(text);
}

function validateCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcCheck = (base, factors) => {
    let sum = 0;
    for (let i = 0; i < factors.length; i += 1) sum += Number(base[i]) * factors[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcCheck(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcCheck(`${digits.slice(0, 12)}${d1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${d1}${d2}`);
}

function assertStringLength(payload, key, min, max) {
  const value = trimText(payload[key]);
  if (value.length < min || value.length > max) {
    throw new Error(`Campo invalido: ${key}`);
  }
}

function requireFields(payload, fields) {
  const missing = fields.filter((name) => !trimText(payload[name]));
  if (missing.length) {
    throw new Error(`Campos obrigatorios ausentes: ${missing.join(", ")}`);
  }
}

function sanitizePayload(kind, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload invalido");
  }

  const out = {};
  const assign = (key, max = 600) => {
    const value = trimText(payload[key]);
    if (!value) return;
    out[key] = value.slice(0, max);
  };

  if (kind === "newsletter") {
    requireFields(payload, ["email"]);
    if (!validateEmail(payload.email)) throw new Error("E-mail invalido");
    assign("email", 160);
    return out;
  }

  if (kind === "contact") {
    requireFields(payload, ["nome", "email", "assunto", "mensagem"]);
    if (!validateEmail(payload.email)) throw new Error("E-mail invalido");
    assign("nome", 120);
    assign("email", 160);
    assign("assunto", 140);
    assign("mensagem", 4000);
    assertStringLength(out, "nome", 2, 120);
    assertStringLength(out, "assunto", 2, 140);
    assertStringLength(out, "mensagem", 5, 4000);
    return out;
  }

  if (kind === "revendedores") {
    requireFields(payload, ["empresa", "cnpj", "nome", "email", "telefone", "estado", "cidade", "perfil"]);
    if (!validateEmail(payload.email)) throw new Error("E-mail invalido");
    if (!validateCnpj(payload.cnpj)) throw new Error("CNPJ invalido");

    assign("empresa", 160);
    assign("cnpj", 18);
    assign("nome", 120);
    assign("cargo", 80);
    assign("email", 160);
    assign("telefone", 30);
    assign("estado", 2);
    assign("cidade", 120);
    assign("perfil", 60);
    assign("mensagem", 4000);
    out.estado = safeLower(out.estado).toUpperCase();

    assertStringLength(out, "empresa", 2, 160);
    assertStringLength(out, "nome", 2, 120);
    assertStringLength(out, "telefone", 8, 30);
    assertStringLength(out, "cidade", 2, 120);
    if (!/^[A-Z]{2}$/.test(out.estado)) throw new Error("Estado invalido");
    return out;
  }

  if (kind === "analytics") {
    requireFields(payload, ["event"]);
    assign("event", 80);
    assign("path", 240);
    out.payload = payload.payload && typeof payload.payload === "object" ? payload.payload : {};
    out.ts = trimText(payload.ts).slice(0, 40) || nowIso();
    if (!/^[a-z0-9_:-]{2,80}$/i.test(out.event)) throw new Error("Evento invalido");
    return out;
  }

  throw new Error("Tipo de payload invalido");
}

module.exports = {
  sanitizePayload,
};
