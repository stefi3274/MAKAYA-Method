/* ============================================================
   Blog public — charge les articles depuis Supabase.
   Si aucun article en base, les articles d'exemple restent.
   Clic sur un article → ouvre la lecture complète (modale).
   ============================================================ */
(function () {
  if (typeof SUPABASE_READY === "undefined" || !SUPABASE_READY || !window.supabase) return;
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.querySelector(".posts");
    if (!grid) return;

    try {
      const { data: ent } = await db.from("entreprises").select("id").eq("slug", ENTREPRISE_SLUG).maybeSingle();
      if (!ent) return;

      const { data, error } = await db.from("articles")
        .select("*").eq("entreprise_id", ent.id).eq("publie", true)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) return; // garder l'état vide

      // Masquer le message "articles bientôt"
      const vide = document.getElementById("blogVide");
      if (vide) vide.style.display = "none";

      grid.innerHTML = data.map((a, i) => {
        const visuel = a.image_url
          ? `<div class="ph" style="background-image:url('${esc(a.image_url)}');background-size:cover;background-position:center"></div>`
          : `<div class="ph">✦</div>`;
        const d = new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        return `<article class="post reveal${i % 3 === 1 ? " d1" : i % 3 === 2 ? " d2" : ""}" data-id="${a.id}">
          ${visuel}
          <div class="body">
            ${a.categorie ? `<span class="cat">${esc(a.categorie)}</span>` : ""}
            <h3>${esc(a.titre)}</h3>
            ${a.extrait ? `<p>${esc(a.extrait)}</p>` : "<p></p>"}
            <span class="more">Lire l'article →</span>
            <span class="post-date">${d}</span>
          </div>
        </article>`;
      }).join("");

      // Révéler
      grid.querySelectorAll(".reveal").forEach(el => el.classList.add("in"));

      // Ouvrir l'article
      grid.querySelectorAll(".post").forEach(el => {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          const art = data.find(x => x.id === el.getAttribute("data-id"));
          if (art) ouvrirArticle(art);
        });
      });
    } catch (_) { /* silencieux */ }
  });

  function ouvrirArticle(a) {
    let m = document.getElementById("artModal");
    if (!m) {
      m = document.createElement("div");
      m.id = "artModal";
      m.className = "art-modal";
      m.innerHTML = `<div class="art-box">
        <button class="art-close" aria-label="Fermer">✕</button>
        <div class="art-content"></div>
      </div>`;
      document.body.appendChild(m);
      m.addEventListener("click", (e) => { if (e.target === m) fermer(); });
      m.querySelector(".art-close").addEventListener("click", fermer);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermer(); });
    }
    const d = new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const corps = (a.contenu || a.extrait || "")
      .split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join("");

    m.querySelector(".art-content").innerHTML = `
      ${a.image_url ? `<img class="art-img" src="${esc(a.image_url)}" alt="">` : ""}
      ${a.categorie ? `<span class="cat">${esc(a.categorie)}</span>` : ""}
      <h2>${esc(a.titre)}</h2>
      <div class="art-date">${d}</div>
      <div class="art-body">${corps || "<p>—</p>"}</div>`;
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function fermer() {
    const m = document.getElementById("artModal");
    if (m) m.classList.remove("open");
    document.body.style.overflow = "";
  }
})();
