/* ============================================================
   Témoignages publics — chargés depuis Supabase.
   Si aucun témoignage, l'état vide reste affiché.
   ============================================================ */
(function () {
  if (typeof SUPABASE_READY === "undefined" || !SUPABASE_READY || !window.supabase) return;
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("quotesGrid");
    if (!grid) return;

    try {
      const { data: ent } = await db.from("entreprises").select("id").eq("slug", ENTREPRISE_SLUG).maybeSingle();
      if (!ent) return;

      const { data, error } = await db.from("temoignages")
        .select("*").eq("entreprise_id", ent.id).eq("publie", true)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) return; // garder l'état vide

      const vide = document.getElementById("temoinsVide");
      if (vide) vide.style.display = "none";

      grid.innerHTML = data.map((t, i) => {
        const note = Math.min(5, Math.max(1, t.note || 5));
        const initiale = (t.auteur || "?").trim().charAt(0).toUpperCase();
        return `<div class="quote reveal${i % 3 === 1 ? " d1" : i % 3 === 2 ? " d2" : ""}">
          <div class="stars">${"★".repeat(note)}</div>
          <p>« ${esc(t.texte)} »</p>
          <div class="who">
            <span class="av">${esc(initiale)}</span>
            <span><b>${esc(t.auteur)}</b>${t.contexte ? `<span>${esc(t.contexte)}</span>` : ""}</span>
          </div>
        </div>`;
      }).join("");

      grid.querySelectorAll(".reveal").forEach(el => el.classList.add("in"));
    } catch (_) { /* silencieux */ }
  });
})();
