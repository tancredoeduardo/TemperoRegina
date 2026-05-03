function nowIso() {
  return new Date().toISOString();
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeLower(value) {
  return trimText(value).toLowerCase();
}

module.exports = {
  nowIso,
  trimText,
  safeLower,
};
