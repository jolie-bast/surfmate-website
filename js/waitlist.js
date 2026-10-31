// Newsletter signup. MailerLite returns JSON; only success:true counts as subscribed.
(function () {
  var SUBSCRIBE_URL =
    "https://assets.mailerlite.com/jsonp/2025965/forms/176152449210385721/subscribe";
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function firstError(data) {
    var emailErrors = data && data.errors && data.errors.fields && data.errors.fields.email;
    if (emailErrors && emailErrors.length) return emailErrors[0];
    if (data && typeof data.message === "string" && data.message) return data.message;
    return "Something went wrong. Please try again.";
  }

  function initWaitlistForm() {
    var form = document.getElementById("waitlist-form");
    if (!form || form.dataset.bound === "true") return;

    var emailInput = document.getElementById("waitlist-email");
    var errorMessage = document.getElementById("error-message");
    var successMessage = document.getElementById("success-message");
    var submitButton = document.getElementById("waitlist-submit");
    if (!emailInput || !errorMessage || !successMessage || !submitButton) return;

    form.dataset.bound = "true";

    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.hidden = false;
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
    }

    function hideError() {
      errorMessage.hidden = true;
      errorMessage.textContent = "";
      emailInput.removeAttribute("aria-invalid");
    }

    emailInput.addEventListener("input", function () {
      if (!errorMessage.hidden) hideError();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var email = emailInput.value.trim();
      if (!email) {
        showError("Please enter your email address.");
        return;
      }
      if (!emailPattern.test(email)) {
        showError("Please enter a valid email address.");
        return;
      }

      hideError();
      submitButton.disabled = true;
      var previousLabel = submitButton.textContent;
      submitButton.textContent = "Subscribing...";

      var body = new URLSearchParams();
      body.set("fields[email]", email);
      body.set("ml-submit", "1");
      body.set("anticsrf", "true");

      fetch(SUBSCRIBE_URL, { method: "POST", body: body })
        .then(function (response) {
          return response
            .json()
            .then(function (data) {
              return { ok: response.ok, data: data };
            })
            .catch(function () {
              return { ok: false, data: null };
            });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.success === true) {
            emailInput.value = "";
            form.hidden = true;
            successMessage.hidden = false;
            return;
          }
          submitButton.disabled = false;
          submitButton.textContent = previousLabel;
          showError(firstError(result.data));
        })
        .catch(function () {
          submitButton.disabled = false;
          submitButton.textContent = previousLabel;
          showError("Something went wrong. Please try again.");
        });
    });
  }

  window.initWaitlistForm = initWaitlistForm;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWaitlistForm);
  } else {
    initWaitlistForm();
  }
})();
