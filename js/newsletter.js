/* ============================================================
   Newsletter — inscription publique (Makaya Method)
   Enregistre l'email dans la table 'abonnes'.
   ============================================================ */
(function () {
  const form = document.getElementById("newsletterForm");
  if (!form) return;

  const statusEl = document.getElementById("newsletterStatus");
  const status = (m, t) => { if (statusEl) { statusEl.textContent = m; statusEl.className = "nl-status " + (t || ""); } };

  let db = null;
  if (typeof SUPABASE_READY !== "undefined" && SUPABASE_READY && window.supabase && window.supabase.createClient) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const email = form.email.value.trim();
    const nom = form.nom ? form.nom.value.trim() : "";

    if (!email || !email.includes("@")) { status("Merci d'indiquer un email valide.", "err"); return; }
    if (!db) { status("Inscription indisponible pour le moment.", "err"); return; }

    if (btn) btn.disabled = true;
    status("Inscription en cours…", "");

    try {
      const { data: ent } = await db.from("entreprises").select("id").eq("slug", ENTREPRISE_SLUG).maybeSingle();
      if (!ent) { status("Une erreur est survenue.", "err"); if (btn) btn.disabled = false; return; }

      const { error } = await db.from("abonnes").insert({ entreprise_id: ent.id, email, nom: nom || null });

      if (error) {
        // doublon = déjà inscrit (contrainte unique)
        if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
          status("Vous êtes déjà inscrit(e). Merci ! 🤍", "ok");
          form.reset();
        } else {
          status("Une erreur est survenue. Réessayez.", "err");
        }
      } else {
        status("Merci ! Vous êtes bien inscrit(e). 🤍", "ok");
        form.reset();
      }
    } catch (_) {
      status("Une erreur est survenue. Réessayez.", "err");
    }
    if (btn) btn.disabled = false;
  });
})();
