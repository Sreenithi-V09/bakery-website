(() => {
  "use strict";

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#primary-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    nav.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation");
      });
    });
  }

  // Product category filtering
  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const productCards = [...document.querySelectorAll(".product-card")];
  const emptyState = document.querySelector("#empty-state");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;

      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      productCards.forEach((card) => {
        const visible = filter === "all" || card.dataset.category === filter;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount > 0;
    });
  });

  // Product-specific enquiry buttons prefill the enquiry form.
  const productInput = document.querySelector("#product-name");
  const enquiryType = document.querySelector("#enquiry-type");
  document.querySelectorAll(".enquire-product").forEach((button) => {
    button.addEventListener("click", () => {
      if (productInput) productInput.value = button.dataset.product || "";
      if (enquiryType) enquiryType.value = "Product Enquiry";
      document.querySelector("#enquiry")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
      window.setTimeout(() => document.querySelector("#full-name")?.focus({ preventScroll: true }), reducedMotion() ? 0 : 350);
    });
  });

  document.querySelectorAll("[data-enquiry-type]").forEach((button) => {
    button.addEventListener("click", () => {
      if (enquiryType) enquiryType.value = button.dataset.enquiryType;
    });
  });

  // Date picker cannot select a date in the past.
  const dateInput = document.querySelector("#required-date");
  if (dateInput) {
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    dateInput.min = localDate;
  }

  const form = document.querySelector("#bakery-enquiry");
  const status = document.querySelector("#form-status");

  function showStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status show ${type}`;
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isValidContact(value) {
    const trimmed = value.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const phoneValid = /^[+()\d\s.-]{7,}$/.test(trimmed) && trimmed.replace(/\D/g, "").length >= 7;
    return emailValid || phoneValid;
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (status) {
        status.textContent = "";
        status.className = "form-status";
      }

      if (!form.reportValidity()) return;

      const contact = document.querySelector("#contact-detail");
      if (contact && !isValidContact(contact.value)) {
        contact.setCustomValidity("Enter a valid email address or phone number.");
        contact.reportValidity();
        contact.addEventListener("input", () => contact.setCustomValidity(""), { once: true });
        return;
      }

      // Netlify Forms works after deployment when the site is built/deployed on Netlify.
      // On other hosts or local previews, do not pretend that an enquiry was delivered.
      const isNetlify = window.location.hostname.endsWith(".netlify.app") ||
        window.location.hostname === "netlify.app" ||
        document.querySelector('form[data-netlify="true"]') !== null;

      if (!window.location.hostname.endsWith(".netlify.app") &&
          window.location.hostname !== "netlify.app" &&
          (window.location.protocol === "file:" || window.location.hostname === "localhost" ||
           window.location.hostname === "127.0.0.1" || window.location.hostname.endsWith("github.io"))) {
        showStatus("Demo mode: your details have not been sent. Deploy this site to Netlify and test the configured Netlify Form to receive enquiries.", "info");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.innerHTML : "";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
      }

      try {
        const formData = new FormData(form);
        const encoded = new URLSearchParams();
        for (const [key, value] of formData.entries()) encoded.append(key, value);

        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encoded.toString()
        });

        if (!response.ok) throw new Error("The form service did not accept the submission.");
        showStatus("Thank you! Your enquiry was submitted. The bakery can follow up using the contact details you provided.", "success");
        form.reset();
      } catch (error) {
        showStatus("Sorry, your enquiry could not be sent. Please try again later or contact the bakery directly.", "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        }
      }
    });
  }

  // Back-to-top button
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("visible", window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
      document.querySelector("#top")?.focus({ preventScroll: true });
    });
  }

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
