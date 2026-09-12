(() => {
  "use strict";

  const ACCESS_KEY = "mastersPhysicsLab.toeflAccess.v1";
  const ACCESS_VALUE = "granted";
  const HASH_SALT = "masters-physics-lab|";
  const PASSWORD_HASH = "210f0df2a4fb544eb15127e60b8884ec791dc9cf4ce77999253b42baf6d6af30";

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function unlock(gate, app) {
    gate.hidden = true;
    app.hidden = false;
    document.dispatchEvent(new CustomEvent("toefl:unlocked"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const gate = document.getElementById("toefl-access-gate");
    const app = document.getElementById("toefl-app");
    const form = document.getElementById("toefl-access-form");
    const input = document.getElementById("toefl-password");
    const toggle = document.getElementById("toefl-password-toggle");
    const error = document.getElementById("toefl-access-error");
    const submit = form?.querySelector('button[type="submit"]');
    if (!gate || !app || !form || !input || !toggle || !error || !submit) return;

    try {
      if (window.sessionStorage.getItem(ACCESS_KEY) === ACCESS_VALUE) {
        unlock(gate, app);
        return;
      }
    } catch (storageError) {
      console.warn("Session storage is unavailable", storageError);
    }

    input.focus();
    toggle.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      toggle.textContent = showing ? "Show" : "Hide";
      toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      input.focus();
    });

    input.addEventListener("input", () => {
      error.hidden = true;
      input.removeAttribute("aria-invalid");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.hidden = true;
      submit.disabled = true;
      submit.textContent = "Checking…";

      try {
        if (!window.crypto?.subtle) throw new Error("Web Crypto is unavailable");
        const candidateHash = await sha256(`${HASH_SALT}${input.value}`);
        if (candidateHash !== PASSWORD_HASH) {
          error.hidden = false;
          input.setAttribute("aria-invalid", "true");
          input.select();
          return;
        }

        try {
          window.sessionStorage.setItem(ACCESS_KEY, ACCESS_VALUE);
        } catch (storageError) {
          console.warn("Session storage is unavailable", storageError);
        }
        input.value = "";
        unlock(gate, app);
        document.getElementById("start-button")?.focus();
      } catch (authError) {
        console.error(authError);
        error.textContent = "このブラウザでは認証機能を利用できません。HTTPSで開き直してください。";
        error.hidden = false;
      } finally {
        submit.disabled = false;
        submit.textContent = "Enter the Lab";
      }
    });
  });
})();
