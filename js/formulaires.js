/* ============================================================
   Formulaires Makaya Method
   - contactForm      → type 'contact'
   - seminaireForm    → type 'seminaire'
   - questionnaireForm→ type 'questionnaire'
   Enregistre en base (Supabase) + ouvre WhatsApp.
   ============================================================ */
(function () {
  let db = null;
  if (typeof SUPABASE_READY !== "undefined" && SUPABASE_READY && window.supabase && window.supabase.createClient) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async function entrepriseId() {
    if (!db) return null;
    const { data } = await db.from("entreprises").select("id").eq("slug", ENTREPRISE_SLUG).maybeSingle();
    return data ? data.id : null;
  }

  function handle(formId, statusId, type, buildWa) {
    const form = document.getElementById(formId);
    if (!form) return;
    const statusEl = document.getElementById(statusId);
    const status = (m, t) => { if (statusEl) { statusEl.textContent = m; statusEl.className = "status-msg " + (t || ""); } };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const d = {};
      new FormData(form).forEach((v, k) => {
        if (d[k]) d[k] = d[k] + ", " + v; else d[k] = (typeof v === "string" ? v.trim() : v);
      });
      if (!d.nom || !d.telephone) { status("Merci d'indiquer au moins votre nom et votre téléphone.", "err"); return; }

      if (btn) btn.disabled = true;
      status("Envoi en cours…", "");

      let saved = false;
      if (db) {
        try {
          const eid = await entrepriseId();
          if (eid) {
            const { error } = await db.from("enregistrements").insert({ entreprise_id: eid, type, donnees: d });
            if (!error) saved = true;
          }
        } catch (_) {}
      }

      const num = (typeof WA !== "undefined") ? WA : "";
      window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(buildWa(d)), "_blank");
      status(saved ? "Envoyé ✓ Ouverture de WhatsApp…" : "Ouverture de WhatsApp…", "ok");
      form.reset();
      if (btn) btn.disabled = false;
    });
  }

  // Contact
  handle("contactForm", "contactStatus", "contact", (d) => [
    "Bonjour Mélissa,", "",
    "Nom : " + (d.nom || ""),
    "Téléphone : " + (d.telephone || ""),
    d.email ? "Email : " + d.email : "",
    d.communication ? "Préfère être contacté(e) par : " + d.communication : "",
    d.moment ? "Meilleur moment : " + d.moment : "",
    d.service ? "Service : " + d.service : "",
    d.message ? "Message : " + d.message : ""
  ].filter(Boolean).join("\n"));

  // Inscription séminaire / atelier
  handle("seminaireForm", "seminaireStatus", "seminaire", (d) => [
    "Bonjour Mélissa, inscription à un séminaire :", "",
    "Nom : " + (d.nom || ""),
    "Téléphone : " + (d.telephone || ""),
    d.email ? "Email : " + d.email : "",
    d.programme ? "Programme : " + d.programme : "",
    d.format ? "Format : " + d.format : "",
    d.participants ? "Participants : " + d.participants : "",
    d.communication ? "Préfère être contacté(e) par : " + d.communication : "",
    d.message ? "Message : " + d.message : ""
  ].filter(Boolean).join("\n"));

  // Questionnaire avant 1re séance
  handle("questionnaireForm", "questionnaireStatus", "questionnaire", (d) => [
    "Bonjour Mélissa, questionnaire préalable :", "",
    "Nom : " + (d.nom || ""),
    "Téléphone : " + (d.telephone || ""),
    d.email ? "Email : " + d.email : "",
    d.situation ? "Situation : " + d.situation : "",
    d.objectif ? "Objectif : " + d.objectif : "",
    d.obstacle ? "Obstacle principal : " + d.obstacle : "",
    d.deja_coach ? "Déjà fait du coaching : " + d.deja_coach : "",
    d.disponibilite ? "Disponibilité : " + d.disponibilite : "",
    d.communication ? "Préfère être contacté(e) par : " + d.communication : "",
    d.message ? "Autre : " + d.message : ""
  ].filter(Boolean).join("\n"));
})();
