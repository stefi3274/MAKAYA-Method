/* ============================================================
   Admin — Gestion des témoignages (Makaya Method)
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const status = (el, m, t) => { if (el) { el.textContent = m; el.className = "status-msg " + (t || ""); } };

  let editId = null;

  async function getEnt(db) {
    const { data: prof } = await db.from("profils").select("entreprise_id").maybeSingle();
    if (!prof) return null;
    const { data: ent } = await db.from("entreprises").select("id, slug").eq("id", prof.entreprise_id).maybeSingle();
    return ent || null;
  }

  async function chargerTemoignages() {
    const db = window._db; if (!db) return;
    const liste = $("temListe"), cmp = $("temCompteur");
    if (!liste) return;

    const { data, error } = await db.from("temoignages").select("*").order("created_at", { ascending: false });
    if (error) { if (cmp) cmp.textContent = "Erreur de chargement."; return; }

    if (cmp) cmp.textContent = data.length === 0 ? "Aucun témoignage." : `${data.length} témoignage${data.length > 1 ? "s" : ""}`;

    if (data.length === 0) {
      liste.innerHTML = "<p style='color:var(--muted)'>Vous n'avez pas encore publié de témoignage.</p>";
      return;
    }

    liste.innerHTML = data.map(t => {
      const note = Math.min(5, Math.max(1, t.note || 5));
      return `<div class="rec">
        <div class="rec-head">
          <b>${esc(t.auteur)}</b>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="color:var(--terra-l);letter-spacing:1px;font-size:.85rem">${"★".repeat(note)}</span>
            ${t.publie ? "" : '<span class="badge type">brouillon</span>'}
          </div>
        </div>
        <div class="rec-body">
          <span style="font-style:italic">« ${esc(t.texte)} »</span>
          ${t.contexte ? `<span style="color:var(--muted);font-size:.84rem;margin-top:4px">${esc(t.contexte)}</span>` : ""}
        </div>
        <div class="rec-actions">
          <button data-edit="${t.id}">Modifier</button>
          <button data-del="${t.id}">Supprimer</button>
        </div>
      </div>`;
    }).join("");

    liste.querySelectorAll("[data-edit]").forEach(b =>
      b.onclick = () => editer(data.find(x => x.id === b.getAttribute("data-edit"))));
    liste.querySelectorAll("[data-del]").forEach(b =>
      b.onclick = () => supprimer(b.getAttribute("data-del")));
  }
  window.chargerTemoignages = chargerTemoignages;

  function editer(t) {
    if (!t) return;
    editId = t.id;
    $("temAuteur").value = t.auteur || "";
    $("temContexte").value = t.contexte || "";
    $("temTexte").value = t.texte || "";
    $("temNote").value = t.note || 5;
    $("temPublie").checked = t.publie !== false;
    $("temFormTitre").textContent = "Modifier le témoignage";
    $("temSubmit").textContent = "Enregistrer";
    $("temAnnuler").style.display = "inline-flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reinitialiser() {
    editId = null;
    const f = $("temForm");
    if (f) f.reset();
    $("temFormTitre").textContent = "Nouveau témoignage";
    $("temSubmit").textContent = "Publier le témoignage";
    $("temAnnuler").style.display = "none";
    $("temNote").value = 5;
    $("temPublie").checked = true;
    status($("temStatus"), "", "");
  }

  const btnAnnuler = $("temAnnuler");
  if (btnAnnuler) btnAnnuler.addEventListener("click", reinitialiser);

  const temForm = $("temForm");
  if (temForm) temForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const db = window._db;
    const st = $("temStatus"), btn = $("temSubmit");
    status(st, "", "");

    const auteur = $("temAuteur").value.trim();
    const texte = $("temTexte").value.trim();
    if (!auteur || !texte) { status(st, "Le nom et le témoignage sont obligatoires.", "err"); return; }

    btn.disabled = true;
    status(st, "Enregistrement…", "");

    const ent = await getEnt(db);
    if (!ent) { status(st, "Entreprise introuvable.", "err"); btn.disabled = false; return; }

    const champs = {
      entreprise_id: ent.id,
      auteur,
      contexte: $("temContexte").value.trim() || null,
      texte,
      note: parseInt($("temNote").value, 10) || 5,
      publie: $("temPublie").checked
    };

    const { error } = editId
      ? await db.from("temoignages").update(champs).eq("id", editId)
      : await db.from("temoignages").insert(champs);

    if (error) { status(st, "Erreur : " + error.message, "err"); btn.disabled = false; return; }

    status(st, editId ? "Témoignage modifié ✓" : "Témoignage publié ✓", "ok");
    btn.disabled = false;
    reinitialiser();
    chargerTemoignages();
  });

  async function supprimer(id) {
    if (!confirm("Supprimer ce témoignage ?")) return;
    const db = window._db;
    const { error } = await db.from("temoignages").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message);
    else { if (editId === id) reinitialiser(); chargerTemoignages(); }
  }
})();
