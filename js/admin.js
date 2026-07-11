/* ============================================================
   Admin Makaya Method — gestion des demandes
   (contact / seminaire / questionnaire)
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const status = (el, m, t) => { if (el) { el.textContent = m; el.className = "status-msg " + (t || ""); } };

  if (typeof SUPABASE_READY === "undefined" || !SUPABASE_READY || !window.supabase) {
    const n = $("setupNote"); if (n) n.style.display = "block"; return;
  }
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window._db = db;
  let filtre = "tous", data = [];

  const LABELS = { contact: "Contact", seminaire: "Séminaire", questionnaire: "Questionnaire" };

  async function refreshAuth() {
    const { data: { session } } = await db.auth.getSession();
    $("loginView").style.display = session ? "none" : "block";
    $("panel").style.display = session ? "block" : "none";
    if (session) {
      charger();
      if (window.chargerGalerie) window.chargerGalerie();
      if (window.chargerAbonnes) window.chargerAbonnes();
      if (window.chargerReglages) window.chargerReglages();
      if (window.chargerArticles) window.chargerArticles();
    }
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    status($("loginStatus"), "", "");
    const { error } = await db.auth.signInWithPassword({ email: $("admEmail").value.trim(), password: $("admPass").value });
    if (error) status($("loginStatus"), "Connexion impossible : " + error.message, "err");
    else refreshAuth();
  });

  $("logoutBtn").addEventListener("click", async () => { await db.auth.signOut(); refreshAuth(); });

  document.querySelectorAll(".admin-filter button").forEach(b => {
    b.addEventListener("click", () => {
      filtre = b.getAttribute("data-f");
      document.querySelectorAll(".admin-filter button").forEach(x => x.classList.toggle("on", x === b));
      rendre();
    });
  });

  async function charger() {
    const { data: rows, error } = await db.from("enregistrements")
      .select("*").in("type", ["contact", "seminaire", "questionnaire"]).order("created_at", { ascending: false });
    if (error) { $("liste").innerHTML = "<p style='color:var(--terra)'>Erreur : " + esc(error.message) + "</p>"; return; }
    data = rows || [];
    stats();
    rendre();
  }

  // --- Tableau de bord ---
  function stats() {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    const nouvelles = data.filter(r => r.statut === "nouveau").length;
    const q = data.filter(r => r.type === "questionnaire").length;
    const sem = data.filter(r => r.type === "seminaire").length;
    const con = data.filter(r => r.type === "contact").length;

    // Ce mois-ci
    const now = new Date();
    const ceMois = data.filter(r => {
      const d = new Date(r.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    set("statTotal", data.length);
    set("statNouvelles", nouvelles);
    set("statMois", ceMois);
    set("statQuestionnaire", q);
    set("statSeminaire", sem);
    set("statContact", con);

    // Dernières demandes (aperçu)
    const box = document.getElementById("statRecent");
    if (box) {
      const recent = data.slice(0, 4);
      const LBL = { contact: "Contact", seminaire: "Séminaire", questionnaire: "Questionnaire" };
      box.innerHTML = recent.length === 0
        ? "<p style='color:var(--muted);font-size:.9rem'>Aucune demande pour le moment.</p>"
        : recent.map(r => {
            const d = r.donnees || {};
            const dt = new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
            return `<div class="mini-rec">
              <span class="mr-nom">${esc(d.nom || "—")}</span>
              <span class="mr-type">${esc(LBL[r.type] || r.type)}</span>
              <span class="mr-date">${dt}</span>
            </div>`;
          }).join("");
    }
  }

  function rendre() {
    const box = $("liste");
    let rows = data;
    if (["contact","seminaire","questionnaire"].includes(filtre)) rows = data.filter(r => r.type === filtre);
    else if (filtre === "nouveau") rows = data.filter(r => r.statut === "nouveau");
    else if (filtre === "traite") rows = data.filter(r => r.statut === "traite");

    $("compteur").textContent = `${rows.length} demande${rows.length > 1 ? "s" : ""}`;
    if (rows.length === 0) { box.innerHTML = "<p style='color:var(--muted)'>Aucune demande.</p>"; return; }

    box.innerHTML = rows.map(r => {
      const d = r.donnees || {};
      const lignes = Object.entries(d).filter(([k]) => k !== "nom")
        .map(([k, v]) => `<span><b>${esc(k.replace(/_/g," "))} :</b> ${esc(v)}</span>`).join("");
      const st = r.statut === "traite" ? "traite" : "nouveau";
      return `<div class="rec">
        <div class="rec-head">
          <b>${esc(d.nom || "—")}</b>
          <div style="display:flex;gap:6px">
            <span class="badge type">${esc(LABELS[r.type] || r.type)}</span>
            <span class="badge ${st}">${st === "traite" ? "traité" : "nouveau"}</span>
          </div>
        </div>
        <div class="rec-body">${lignes || "<span>—</span>"}</div>
        <div class="rec-actions">
          ${st === "nouveau" ? `<button data-done="${r.id}">Marquer traité</button>` : `<button data-undone="${r.id}">Rouvrir</button>`}
          <button data-del="${r.id}">Supprimer</button>
        </div>
      </div>`;
    }).join("");

    box.querySelectorAll("[data-done]").forEach(b => b.onclick = () => maj(b.getAttribute("data-done"), "traite"));
    box.querySelectorAll("[data-undone]").forEach(b => b.onclick = () => maj(b.getAttribute("data-undone"), "nouveau"));
    box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => supprimer(b.getAttribute("data-del")));
  }

  async function maj(id, statut) {
    const { error } = await db.from("enregistrements").update({ statut }).eq("id", id);
    if (error) alert("Erreur : " + error.message); else charger();
  }
  async function supprimer(id) {
    if (!confirm("Supprimer cette demande ?")) return;
    const { error } = await db.from("enregistrements").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message); else charger();
  }

  refreshAuth();
})();
