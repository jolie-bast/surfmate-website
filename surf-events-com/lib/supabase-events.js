// Public Supabase client config (same project as the Surfmate app), trimmed
// to the two RPCs this mirror page needs.
const SUPABASE_URL = "https://jycbthjasldnqavajrlf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Q1q7u9-B8zs4JZuA7HMigw_LPyMkagk";
const RPC_TIMEOUT_MS = 10000;

async function callRpc(fnName, payload = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`RPC ${fnName} timed out after ${RPC_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`RPC ${fnName} failed (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) && fnName.startsWith("get_website_event_") ? data[0] ?? null : data;
}

export async function getWebsiteEvents() {
  try {
    return await callRpc("get_website_events");
  } catch (error) {
    console.error("getWebsiteEvents failed:", error.message);
    return [];
  }
}

export async function getWebsiteEventGoingCount(eventId) {
  try {
    return await callRpc("get_website_event_going_count", { p_event_id: eventId });
  } catch (error) {
    console.error("getWebsiteEventGoingCount failed:", error.message);
    return 0;
  }
}
