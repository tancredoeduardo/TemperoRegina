const { getSupabaseClient } = require("../lib/supabaseClient");

const DEFAULT_TABLE = "site_submissions";

function getSubmissionsTable() {
  return process.env.SUPABASE_SUBMISSIONS_TABLE || DEFAULT_TABLE;
}

function toSupabaseRow(record) {
  return {
    id: record.id,
    kind: record.kind,
    created_at: record.createdAt,
    ip: record.ip,
    user_agent: record.userAgent,
    payload: record.payload,
  };
}

async function saveSubmissionToSupabase(record) {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, reason: "missing-config" };

  const { error } = await supabase.from(getSubmissionsTable()).insert(toSupabaseRow(record));
  if (error) throw error;

  return { ok: true, table: getSubmissionsTable() };
}

module.exports = {
  getSubmissionsTable,
  saveSubmissionToSupabase,
};
