function shouldReduceMotionForFaq() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getFaqItemParts(item) {
  const trigger = item.querySelector(".faq-trigger");
  const panel = item.querySelector(".faq-panel");
  return { trigger, panel };
}

function collapseFaqItem(item) {
  const { trigger, panel } = getFaqItemParts(item);
  if (!trigger || !panel || trigger.getAttribute("aria-expanded") === "false") {
    return;
  }

  trigger.setAttribute("aria-expanded", "false");
  item.classList.remove("is-open");

  if (shouldReduceMotionForFaq()) {
    panel.hidden = true;
    panel.style.maxHeight = "0px";
    panel.style.opacity = "0";
    return;
  }

  const currentHeight = panel.scrollHeight;
  panel.style.maxHeight = `${currentHeight}px`;
  panel.style.opacity = "1";

  requestAnimationFrame(() => {
    panel.style.maxHeight = "0px";
    panel.style.opacity = "0";
  });

  const onTransitionEnd = () => {
    if (trigger.getAttribute("aria-expanded") === "false") {
      panel.hidden = true;
    }
  };

  panel.addEventListener("transitionend", onTransitionEnd, { once: true });
}

function maybeScrollFaqItemIntoView(item) {
  const topOffset = 96;
  const rect = item.getBoundingClientRect();
  const isAboveViewport = rect.top < topOffset;
  const isBelowViewport = rect.bottom > window.innerHeight - 20;

  if (!isAboveViewport && !isBelowViewport) return;

  item.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function expandFaqItem(item) {
  const { trigger, panel } = getFaqItemParts(item);
  if (!trigger || !panel || trigger.getAttribute("aria-expanded") === "true") {
    return;
  }

  trigger.setAttribute("aria-expanded", "true");
  item.classList.add("is-open");
  panel.hidden = false;

  if (shouldReduceMotionForFaq()) {
    panel.style.maxHeight = "none";
    panel.style.opacity = "1";
    return;
  }

  panel.style.maxHeight = "0px";
  panel.style.opacity = "0";

  requestAnimationFrame(() => {
    panel.style.maxHeight = `${panel.scrollHeight}px`;
    panel.style.opacity = "1";
  });

  const onTransitionEnd = () => {
    if (trigger.getAttribute("aria-expanded") === "true") {
      panel.style.maxHeight = "none";
    }
  };

  panel.addEventListener("transitionend", onTransitionEnd, { once: true });

  setTimeout(() => {
    maybeScrollFaqItemIntoView(item);
  }, 180);
}

function initFaqGroup(groupElement) {
  if (!groupElement || groupElement.dataset.faqBound === "true") return;

  const items = Array.from(groupElement.querySelectorAll(".faq-item"));
  items.forEach((item) => {
    const { trigger, panel } = getFaqItemParts(item);
    if (!trigger || !panel) return;

    panel.hidden = true;
    panel.style.maxHeight = "0px";
    panel.style.opacity = "0";
    trigger.setAttribute("aria-expanded", "false");

    trigger.addEventListener("click", () => {
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        collapseFaqItem(item);
        return;
      }

      const allFaqItems = document.querySelectorAll(".faq-item");
      allFaqItems.forEach((candidate) => {
        if (candidate !== item) collapseFaqItem(candidate);
      });

      expandFaqItem(item);
    });
  });

  groupElement.dataset.faqBound = "true";
}

window.initFaq = function initFaq() {
  const groups = document.querySelectorAll("[data-faq-group]");
  groups.forEach((group) => initFaqGroup(group));
};
