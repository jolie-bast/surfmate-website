"use client";

import { useEffect } from "react";

export default function EventSubmitScripts() {
  useEffect(() => {
    if (window.__surfmateEventSubmitLoading) return;
    window.__surfmateEventSubmitLoading = true;

    const config = document.createElement("script");
    config.src = "/js/supabase-config.js";
    config.onload = () => {
      const wizard = document.createElement("script");
      wizard.type = "module";
      wizard.src = "/js/event-submit.js";
      document.body.appendChild(wizard);
    };
    document.body.appendChild(config);
  }, []);

  return null;
}
