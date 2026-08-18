window.SurfmateRpc = (function () {
  function getConfig() {
    return window.SURFMATE_SUPABASE || {};
  }

  function unwrap(data) {
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }

  async function call(fnName, payload, timeoutMs) {
    var config = getConfig();
    if (!config.url || !config.anonKey) {
      throw new Error("Supabase is not configured.");
    }

    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = window.setTimeout(function () {
      if (controller) controller.abort();
    }, timeoutMs || 8000);

    try {
      var response = await fetch(config.url.replace(/\/$/, "") + "/rest/v1/rpc/" + fnName, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          Authorization: "Bearer " + config.anonKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload || {}),
        signal: controller ? controller.signal : undefined,
      });

      var data = null;
      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        var message =
          (data && (data.message || data.error || data.hint)) ||
          "RPC " + fnName + " failed (" + response.status + ")";
        var err = new Error(message);
        err.status = response.status;
        err.payload = data;
        throw err;
      }

      return unwrap(data);
    } finally {
      window.clearTimeout(timer);
    }
  }

  return { call: call, unwrap: unwrap };
})();
