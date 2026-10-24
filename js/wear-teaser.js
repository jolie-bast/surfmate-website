// Surfmate Wear — Drop 01 teaser (/shop/)
// Countdown to early access + MailerLite sign-up for the separate Wear list.

(function () {
  // ---- Config -------------------------------------------------------------
  // MailerLite: create a separate form that adds subscribers to the "Wear"
  // group (NOT the app newsletter form used in js/waitlist.js) and paste its
  // subscribe URL here, e.g.
  // "https://assets.mailerlite.com/jsonp/2025965/forms/<FORM_ID>/subscribe"
  var WEAR_FORM_URL = "";

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

  var input = document.getElementById("wt-email");
  var button = document.getElementById("wt-submit");
  var errorEl = document.getElementById("wt-error");
  var successEl = document.getElementById("wt-success");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var showError = function (msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();
  };

  input.addEventListener("input", function () {
    errorEl.hidden = true;
    input.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!emailRe.test(email)) return showError("Please enter a valid email.");
    if (!WEAR_FORM_URL) {
      console.warn("wear-teaser: WEAR_FORM_URL is not set");
      return showError("Sign-up isn't open yet — follow @surfmate.wear.");
    }

    button.disabled = true;
    button.textContent = "Joining…";

    var body = new URLSearchParams();
    body.append("fields[email]", email);
    body.append("ml-submit", "1");
    body.append("anticsrf", "true");

    var done = function () {
      form.hidden = true;
      successEl.hidden = false;
      if (typeof gtag === "function") {
        gtag("event", "sign_up", { method: "wear_waitlist" });
      }
    };

    // no-cors: the response is opaque, so treat a completed request as success.
    fetch(WEAR_FORM_URL, { method: "POST", body: body, mode: "no-cors" })
      .then(done)
      .catch(function () {
        button.disabled = false;
        button.textContent = "Get early access";
        showError("Something went wrong — please try again.");
      });
  });
})();
