// Surfmate Wear — Drop 01 teaser (/shop/)
// Countdown to early access + MailerLite sign-up for the separate Wear list.

(function () {
  // ---- Config -------------------------------------------------------------
  // MailerLite: create a separate form that adds subscribers to the "Wear"
  // group (NOT the app newsletter form used in js/waitlist.js) and paste its
  // subscribe URL here, e.g.
  // "https://assets.mailerlite.com/jsonp/2025965/forms/<FORM_ID>/subscribe"
  var WEAR_FORM_URL =
    "https://assets.mailerlite.com/jsonp/2025965/forms/202215834903381236/subscribe";

  // Shopify store URL — once the drop is live the countdown turns into a link.
  var SHOP_URL = "";
  // -------------------------------------------------------------------------

  var wrap = document.querySelector("[data-countdown]");
  if (wrap) {
    var openAt = new Date(wrap.getAttribute("data-countdown")).getTime();
    var label = document.getElementById("wt-countdown-label");
    var els = {
      days: wrap.querySelector('[data-unit="days"]'),
      hours: wrap.querySelector('[data-unit="hours"]'),
      mins: wrap.querySelector('[data-unit="mins"]'),
    };
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };

    var tick = function () {
      var diff = openAt - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        label.textContent = "Drop 01 is live";
        var box = wrap.querySelector(".wt-countdown");
        if (SHOP_URL) {
          box.innerHTML =
            '<a class="wt-live" href="' + SHOP_URL + '">Shop now →</a>';
        } else {
          box.hidden = true;
        }
        return;
      }
      els.days.textContent = Math.floor(diff / 86400000);
      els.hours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
      els.mins.textContent = pad(Math.floor((diff % 3600000) / 60000));
    };

    var timer = setInterval(tick, 30000);
    tick();
  }

  // ---- Sign-up -------------------------------------------------------------
  var form = document.getElementById("wt-form");
  if (!form) return;

  var nameInput = document.getElementById("wt-name");
  var emailInput = document.getElementById("wt-email");
  var button = document.getElementById("wt-submit");
  var errorEl = document.getElementById("wt-error");
  var successEl = document.getElementById("wt-success");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var submitting = false;

  // MailerLite JSON: only success:true is a signup. Field errors come back
  // on errors.fields (email, name, …).
  var firstError = function (data) {
    var fields = data && data.errors && data.errors.fields;
    if (fields) {
      var keys = Object.keys(fields);
      for (var i = 0; i < keys.length; i++) {
        var list = fields[keys[i]];
        if (list && list.length) return list[0];
      }
    }
    if (data && typeof data.message === "string" && data.message) return data.message;
    return "Something went wrong — please try again.";
  };

  var showError = function (msg, field) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  };

  var clearError = function () {
    errorEl.hidden = true;
    nameInput.removeAttribute("aria-invalid");
    emailInput.removeAttribute("aria-invalid");
  };

  nameInput.addEventListener("input", clearError);
  emailInput.addEventListener("input", clearError);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    if (name.length < 2) {
      return showError("Please enter your name.", nameInput);
    }
    if (!emailRe.test(email)) {
      return showError("Please enter a valid email.", emailInput);
    }
    if (!WEAR_FORM_URL) {
      console.warn("wear-teaser: WEAR_FORM_URL is not set");
      return showError("Sign-up isn't open yet — follow @surfmate.wear.");
    }

    if (submitting) return;
    submitting = true;

    var body = new URLSearchParams();
    body.append("fields[name]", name);
    body.append("fields[email]", email);
    body.append("ml-submit", "1");
    body.append("anticsrf", "true");

    var resetButton = function () {
      submitting = false;
      button.disabled = false;
      button.textContent = "Get early access";
    };

    // iOS Safari cancels a fetch started in the submit turn if the submit
    // button is disabled there. Run the request on the next turn.
    window.setTimeout(function () {
      button.disabled = true;
      button.textContent = "Joining…";

      fetch(WEAR_FORM_URL, { method: "POST", body: body })
        .then(function (response) {
          return response.json().then(
            function (data) {
              return { ok: response.ok, data: data };
            },
            function () {
              return { ok: false, data: null };
            }
          );
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.success === true) {
            form.hidden = true;
            successEl.hidden = false;
            if (typeof gtag === "function") {
              gtag("event", "sign_up", { method: "wear_waitlist" });
            }
            return;
          }
          resetButton();
          showError(firstError(result.data));
        })
        .catch(function () {
          resetButton();
          showError("Something went wrong — please try again.");
        });
    }, 0);
  });
})();
