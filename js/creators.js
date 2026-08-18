(function () {
  var wizard = document.querySelector("[data-creators-wizard]");
  if (!wizard) return;

  var total = 4;
  var current = 1;
  var kicker = wizard.querySelector("[data-wizard-kicker]");
  var panels = Array.from(wizard.querySelectorAll("[data-wizard-step]"));
  var dots = Array.from(wizard.querySelectorAll("[data-wizard-goto]"));
  var back = wizard.querySelector("[data-wizard-back]");
  var next = wizard.querySelector("[data-wizard-next]");
  var apply = wizard.querySelector("[data-wizard-apply]");

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = hidden;
  }

  function goTo(step) {
    current = Math.min(total, Math.max(1, step));

    if (kicker) {
      kicker.textContent = "Step " + current + " of " + total;
    }

    panels.forEach(function (panel) {
      var isActive = Number(panel.getAttribute("data-wizard-step")) === current;
      panel.classList.toggle("is-active", isActive);
      setHidden(panel, !isActive);
    });

    dots.forEach(function (dot) {
      var isActive = Number(dot.getAttribute("data-wizard-goto")) === current;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    setHidden(back, current === 1);
    setHidden(next, current === total);
    setHidden(apply, current !== total);
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      goTo(Number(dot.getAttribute("data-wizard-goto")));
    });
  });

  if (back) {
    back.addEventListener("click", function () {
      goTo(current - 1);
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      goTo(current + 1);
    });
  }

  goTo(1);
})();

(function () {
  var form = document.querySelector("[data-creators-apply]");
  if (!form) return;

  var errorEl = form.querySelector("[data-apply-error]");
  var platformInputs = Array.from(form.querySelectorAll('input[name="platform"]'));
  var applyMailto = "jolie@surfmate.eu";

  function trimValue(name) {
    var field = form.elements[name];
    return field && typeof field.value === "string" ? field.value.trim() : "";
  }

  function selectedPlatforms() {
    return platformInputs.filter(function (input) {
      return input.checked;
    }).map(function (input) {
      return input.value;
    });
  }

  function syncPlatformFields() {
    form.querySelectorAll(".creators-platform-pick").forEach(function (pick) {
      var checkbox = pick.querySelector('input[name="platform"]');
      var field = pick.querySelector("[data-platform-field]");
      var isSelected = Boolean(checkbox && checkbox.checked);
      pick.classList.toggle("is-open", isSelected);
      if (!field) return;
      field.hidden = !isSelected;
      var input = field.querySelector("input");
      if (input && !isSelected) {
        input.value = "";
      }
    });
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.hidden = !message;
    errorEl.textContent = message || "";
  }

  platformInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      syncPlatformFields();
      showError("");
      if (!input.checked) return;
      var field = form.querySelector('[data-platform-field="' + input.value + '"]');
      var username = field && field.querySelector("input");
      if (username) username.focus();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = trimValue("name");
    var email = trimValue("email");
    var platforms = selectedPlatforms();
    var instagram = trimValue("instagram");
    var tiktok = trimValue("tiktok");
    var surfmate = trimValue("surfmate");

    if (!name) {
      showError("Add your name.");
      form.elements.name.focus();
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Add a valid email.");
      form.elements.email.focus();
      return;
    }

    if (!platforms.length) {
      showError("Pick Instagram, TikTok, or both.");
      return;
    }

    if (platforms.indexOf("instagram") !== -1 && !instagram) {
      showError("Add your Instagram username.");
      form.elements.instagram.focus();
      return;
    }

    if (platforms.indexOf("tiktok") !== -1 && !tiktok) {
      showError("Add your TikTok username.");
      form.elements.tiktok.focus();
      return;
    }

    if (!surfmate) {
      showError("Add your Surfmate username.");
      form.elements.surfmate.focus();
      return;
    }

    showError("");

    var lines = [
      "Hi Jolie,",
      "",
      "I'd like to apply as a Surfmate Creator.",
      "",
      "Name: " + name,
      "Email: " + email,
      "Surfmate username: " + surfmate,
      "Instagram: " + (instagram || "—"),
      "TikTok: " + (tiktok || "—"),
      "Creating on: " + platforms.join(" & ")
    ];

    window.location.href =
      "mailto:" +
      applyMailto +
      "?subject=" +
      encodeURIComponent("Apply to become a Surfmate Creator") +
      "&body=" +
      encodeURIComponent(lines.join("\n"));
  });

  syncPlatformFields();
})();
