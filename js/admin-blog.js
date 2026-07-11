/* ============================================================
   Admin — Gestion des articles de blog (Makaya Method)
   Créer / modifier / supprimer, avec image d'illustration.
   ============================================================ */
(function () {
  const BUCKET = "Images";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const status = (el, m, t) => { if (el) { el.textContent = m; el.className = "status-msg " + (t || ""); } };

  let editId = null; // article en cours d'édition

  async function getEnt(db) {
    const { data: prof } = await db.from("profils").select("entreprise_id").maybeSingle();
    if (!prof) return null;
    const { data: ent } = await db.from("entreprises").select("id, slug").eq("id", prof.entreprise_id).maybeSingle();
    return ent || null;
  }

  async function chargerArticles() {
    const db = window._db; if (!db) return;
    const liste = $("artListe"), cmp = $("artCompteur");
    if (!liste) return;

    const { data, error } = await db.from("articles").select("*").order("created_at", { ascending: false });
    if (error) { if (cmp) cmp.textContent = "Erreur de chargement."; return; }

    if (cmp) cmp.textContent = data.length === 0 ? "Aucun article." : `${data.length} article${data.length > 1 ? "s" : ""}`;

    if (data.length === 0) {
      liste.innerHTML = "<p style='color:var(--muted)'>Vous n'avez pas encore publié d'article.</p>";
      return;
    }

    liste.innerHTML = data.map(a => {
      const d = new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
      const vign = a.image_url
        ? `<img src="${esc(a.image_url)}" alt="" class="art-vign">`
        : `<div class="art-vign art-vign-vide">✦</div>`;
      return `<div class="art-row">
        ${vign}
        <div class="art-info">
          <b>${esc(a.titre)}</b>
          <span class="art-meta">${a.categorie ? esc(a.categorie) + " · " : ""}${d}${a.publie ? "" : " · <i>brouillon</i>"}</span>
        </div>
        <div class="art-act">
          <button data-edit="${a.id}">Modifier</button>
          <button data-del="${a.id}">Supprimer</button>
        </div>
      </div>`;
    }).join("");

    liste.querySelectorAll("[data-edit]").forEach(b =>
      b.onclick = () => editer(data.find(x => x.id === b.getAttribute("data-edit"))));
    liste.querySelectorAll("[data-del]").forEach(b =>
      b.onclick = () => supprimer(b.getAttribute("data-del")));
  }
  window.chargerArticles = chargerArticles;

  function editer(a) {
    if (!a) return;
    editId = a.id;
    $("artTitre").value = a.titre || "";
    $("artCategorie").value = a.categorie || "";
    $("artExtrait").value = a.extrait || "";
    $("artContenu").value = a.contenu || "";
    $("artPublie").checked = a.publie !== false;
    $("artFormTitre").textContent = "Modifier l'article";
    $("artSubmit").textContent = "Enregistrer les modifications";
    $("artAnnuler").style.display = "inline-flex";
    $("artApercuImg").innerHTML = a.image_url
      ? `<img src="${esc(a.image_url)}" alt="">`
      : `<div class="img-vide">Aucune image</div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reinitialiser() {
    editId = null;
    const f = $("artForm");
    if (f) f.reset();
    $("artFormTitre").textContent = "Nouvel article";
    $("artSubmit").textContent = "Publier l'article";
    $("artAnnuler").style.display = "none";
    $("artApercuImg").innerHTML = `<div class="img-vide">Aucune image</div>`;
    $("artPublie").checked = true;
    status($("artStatus"), "", "");
  }

  const btnAnnuler = $("artAnnuler");
  if (btnAnnuler) btnAnnuler.addEventListener("click", reinitialiser);

  const artForm = $("artForm");
  if (artForm) artForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const db = window._db;
    const st = $("artStatus"), btn = $("artSubmit");
    status(st, "", "");

    const titre = $("artTitre").value.trim();
    if (!titre) { status(st, "Le titre est obligatoire.", "err"); return; }

    btn.disabled = true;
    status(st, "Enregistrement…", "");

    const ent = await getEnt(db);
    if (!ent) { status(st, "Entreprise introuvable.", "err"); btn.disabled = false; return; }

    const champs = {
      entreprise_id: ent.id,
      titre,
      categorie: $("artCategorie").value.trim() || null,
      extrait: $("artExtrait").value.trim() || null,
      contenu: $("artContenu").value.trim() || null,
      publie: $("artPublie").checked
    };

    // Image (optionnelle)
    const file = $("artImage").files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { status(st, "Image trop lourde (max 4 Mo).", "err"); btn.disabled = false; return; }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const chemin = `${ent.slug}/blog/${Date.now()}.${ext}`;
      const up = await db.storage.from(BUCKET).upload(chemin, file, { cacheControl: "3600", upsert: false });
      if (up.error) { status(st, "Échec de l'image : " + up.error.message, "err"); btn.disabled = false; return; }
      const { data: pub } = db.storage.from(BUCKET).getPublicUrl(chemin);
      champs.image_url = pub.publicUrl;
      champs.image_chemin = chemin;
    }

    let error, ancienChemin = null;
    if (editId) {
      if (file) {
        const { data: old } = await db.from("articles").select("image_chemin").eq("id", editId).maybeSingle();
        ancienChemin = old ? old.image_chemin : null;
      }
      ({ error } = await db.from("articles").update(champs).eq("id", editId));
    } else {
      ({ error } = await db.from("articles").insert(champs));
    }

    if (error) {
      if (champs.image_chemin) await db.storage.from(BUCKET).remove([champs.image_chemin]);
      status(st, "Erreur : " + error.message, "err");
      btn.disabled = false; return;
    }

    if (ancienChemin) await db.storage.from(BUCKET).remove([ancienChemin]);

    status(st, editId ? "Article modifié ✓" : "Article publié ✓", "ok");
    btn.disabled = false;
    reinitialiser();
    chargerArticles();
  });

  async function supprimer(id) {
    if (!confirm("Supprimer cet article ? Cette action est définitive.")) return;
    const db = window._db;
    const { data: a } = await db.from("articles").select("image_chemin").eq("id", id).maybeSingle();
    if (a && a.image_chemin) await db.storage.from(BUCKET).remove([a.image_chemin]);
    const { error } = await db.from("articles").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message);
    else { if (editId === id) reinitialiser(); chargerArticles(); }
  }
})();
