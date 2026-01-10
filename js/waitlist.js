// Waitlist Form Handler
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded - waitlist script starting");

  // Wait a bit for includes to load
  setTimeout(function () {
    const form = document.getElementById("waitlist-form");
    const emailInput = document.getElementById("waitlist-email");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");
    const submitButton = document.getElementById("waitlist-submit");

    console.log("Elements found:", {
      form: !!form,
      emailInput: !!emailInput,
      errorMessage: !!errorMessage,
      successMessage: !!successMessage,
      submitButton: !!submitButton,
    });

    if (form && emailInput && errorMessage && successMessage && submitButton) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Set fixed width for button to prevent size changes
      const buttonWidth = submitButton.offsetWidth;
      submitButton.style.width = buttonWidth + "px";
      submitButton.style.minWidth = buttonWidth + "px";

      function showError(message) {
        console.log("Showing error:", message);
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        emailInput.style.borderColor = "var(--surfmate-blue)";
        emailInput.focus();
      }

      function hideError() {
        console.log("Hiding error");
        errorMessage.style.display = "none";
        emailInput.style.borderColor = "#444444";
      }

      function showSuccess() {
        console.log("Showing success message");
        form.style.opacity = "0";
        form.style.visibility = "hidden";
        successMessage.style.display = "block";
        successMessage.style.opacity = "1";
        console.log(
          "Success message display set to:",
          successMessage.style.display
        );
      }

      emailInput.addEventListener("input", function () {
        if (errorMessage.style.display === "block") hideError();
      });

      form.addEventListener("submit", function (e) {
        console.log("Form submit event triggered");
        e.preventDefault();
        e.stopPropagation();
        handleFormSubmission();
        return false;
      });

      function handleFormSubmission() {
        console.log("handleFormSubmission called");
        const email = emailInput.value.trim();
        console.log("Email:", email);

        if (!email) return showError("Please enter your email");
        if (!emailRegex.test(email))
          return showError("Please enter a valid email address");

        hideError();
        submitButton.textContent = "Joining...";
        submitButton.disabled = true;

        const formData = new URLSearchParams();
        formData.append("fields[email]", email);
        formData.append("ml-submit", "1");
        formData.append("anticsrf", "true");

        console.log("Sending request to MailerLite...");

        fetch(
          "https://assets.mailerlite.com/jsonp/2025965/forms/176152449210385721/subscribe",
          {
            method: "POST",
            body: formData,
            mode: "no-cors",
          }
        )
          .then(() => {
            console.log("MailerLite request completed successfully");
            submitButton.textContent = "Join Waitlist";
            submitButton.disabled = false;
            emailInput.value = "";
            showSuccess();
          })
          .catch((error) => {
            console.log("MailerLite request error:", error);
            submitButton.textContent = "Join Waitlist";
            submitButton.disabled = false;
            emailInput.value = "";
            showSuccess();
          });
      }
    } else {
      console.error(
        "Some waitlist elements not found! Retrying in 1 second..."
      );

      // Retry after another second if elements not found
      setTimeout(arguments.callee, 1000);
    }
  }, 500); // Wait 500ms for includes to load
});
