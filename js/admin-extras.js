/* ============================================================
   Admin Makaya — Galerie (photos/flyers) + Abonnés newsletter
   Bucket Supabase : "Images", dossier = slug entreprise.
   Réutilise window._db ouvert par admin.js.
   ============================================================ */
(function () {
  /* ---------- ONGLETS (indépendant de Supabase) ---------- */
  document.querySelectorAll(".admin-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const t = tab.getAttribute("data-tab");
      document.querySelectorAll(".admin-tabs .tab").forEach(x => x.classList.toggle("on", x === tab));
      ["bord", "demandes", "blog", "galerie", "abonnes", "image"].forEach(k => {
        const el = document.getElementById("tab-" + k);
        if (el) el.style.display = (t === k) ? "block" : "none";
      });
    });
  });

  const BUCKET = "Images";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const status = (el, m, t) => { if (el) { el.textContent = m; el.className = "status-msg " + (t || ""); } };

  async function getEnt(db) {
    const { data: prof } = await db.from("profils").select("entreprise_id").maybeSingle();
    if (!prof) return null;
    const { data: ent } = await db.from("entreprises").select("id, slug").eq("id", prof.entreprise_id).maybeSingle();
    return ent || null;
  }

  /* ---------- GALERIE / FLYERS ---------- */
  async function chargerGalerie() {
    const db = window._db; if (!db) return;
    const liste = $("galListe"), cmp = $("galCompteur");
    if (!liste) return;
    const { data, error } = await db.from("galerie").select("*").order("created_at", { ascending: false });
    if (error) { if (cmp) cmp.textContent = "Erreur de chargement."; return; }
    if (cmp) cmp.textContent = data.length === 0 ? "Aucune image publiée." : `${data.length} image${data.length > 1 ? "s" : ""}`;
    liste.innerHTML = data.map(g => `
      <div class="gal-item">
        <img src="${esc(g.url)}" alt="${esc(g.titre || "")}" loading="lazy">
        ${g.titre ? `<div class="gal-cap">${esc(g.titre)}</div>` : ""}
        <button class="gal-del" data-id="${g.id}" data-chemin="${esc(g.chemin || "")}">✕</button>
      </div>`).join("");
    liste.querySelectorAll(".gal-del").forEach(b =>
      b.onclick = () => supprimerImage(b.getAttribute("data-id"), b.getAttribute("data-chemin")));
  }
  window.chargerGalerie = chargerGalerie;

  const galForm = $("galForm");
  if (galForm) galForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const db = window._db;
    const st = $("galStatus"), btn = $("galSubmit");
    status(st, "", "");
    const file = $("galFile").files[0];
    if (!file) { status(st, "Choisissez une image.", "err"); return; }
    if (file.size > 5 * 1024 * 1024) { status(st, "Image trop lourde (max 5 Mo).", "err"); return; }

    btn.disabled = true; status(st, "Envoi en cours…", "");
    const ent = await getEnt(db);
    if (!ent) { status(st, "Entreprise introuvable.", "err"); btn.disabled = false; return; }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const chemin = `${ent.slug}/${Date.now()}.${ext}`;
    const up = await db.storage.from(BUCKET).upload(chemin, file, { cacheControl: "3600", upsert: false });
    if (up.error) { status(st, "Échec de l'envoi : " + up.error.message, "err"); btn.disabled = false; return; }

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(chemin);
    const ins = await db.from("galerie").insert({
      entreprise_id: ent.id, titre: $("galTitre").value.trim() || null, chemin, url: pub.publicUrl
    });
    if (ins.error) {
      await db.storage.from(BUCKET).remove([chemin]);
      status(st, "Erreur : " + ins.error.message, "err"); btn.disabled = false; return;
    }
    status(st, "Image publiée ✓", "ok");
    galForm.reset(); btn.disabled = false;
    chargerGalerie();
  });

  async function supprimerImage(id, chemin) {
    if (!confirm("Supprimer cette image ?")) return;
    const db = window._db;
    if (chemin) await db.storage.from(BUCKET).remove([chemin]);
    const { error } = await db.from("galerie").delete().eq("id", id);
    if (error) alert("Erreur : " + error.message); else chargerGalerie();
  }

  /* ---------- ABONNÉS NEWSLETTER ---------- */
  async function chargerAbonnes() {
    const db = window._db; if (!db) return;
    const liste = $("abListe"), cmp = $("abCompteur");
    if (!liste) return;
    const { data, error } = await db.from("abonnes").select("*").order("created_at", { ascending: false });
    if (error) { if (cmp) cmp.textContent = "Erreur de chargement."; return; }
    if (cmp) cmp.textContent = data.length === 0 ? "Aucun abonné." : `${data.length} abonné${data.length > 1 ? "s" : ""}`;

    if (data.length === 0) { liste.innerHTML = "<p style='color:var(--muted)'>Personne ne s'est encore abonné.</p>"; return; }

    liste.innerHTML = data.map(a => `
      <div class="rec" style="padding:14px 18px">
        <div class="rec-head" style="margin-bottom:4px">
          <b>${esc(a.email)}</b>
          <button class="rec-actions" style="border:1px solid var(--border);background:none;color:var(--muted-d);border-radius:8px;padding:5px 12px;font-size:.78rem;cursor:pointer;font-family:inherit" data-del="${a.id}">Retirer</button>
        </div>
        ${a.nom ? `<div class="rec-body"><span>${esc(a.nom)}</span></div>` : ""}
      </div>`).join("");

    liste.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (!confirm("Retirer cet abonné ?")) return;
      const { error } = await db.from("abonnes").delete().eq("id", b.getAttribute("data-del"));
      if (error) alert("Erreur : " + error.message); else chargerAbonnes();
    });
  }
  window.chargerAbonnes = chargerAbonnes;

  // Exporter les emails (copier dans le presse-papier)
  const btnExport = $("abExport");
  if (btnExport) btnExport.addEventListener("click", async () => {
    const db = window._db;
    const { data } = await db.from("abonnes").select("email");
    if (!data || data.length === 0) { alert("Aucun abonné à exporter."); return; }
    const emails = data.map(a => a.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      alert(`${data.length} email(s) copié(s) dans le presse-papier.`);
    } catch (_) {
      prompt("Copiez les emails ci-dessous :", emails);
    }
  });

  /* ---------- MON IMAGE : logo + photo ---------- */
  async function chargerReglages() {
    const db = window._db; if (!db) return;
    const ent = await getEnt(db);
    if (!ent) return;
    const { data: reg } = await db.from("reglages").select("*").eq("entreprise_id", ent.id).maybeSingle();

    const apercuLogo = $("apercuLogo");
    const apercuPhoto = $("apercuPhoto");

    if (apercuLogo) {
      apercuLogo.innerHTML = (reg && reg.logo_url)
        ? `<img src="${esc(reg.logo_url)}" alt="Logo"><button type="button" class="img-del" data-quoi="logo">Retirer</button>`
        : `<div class="img-vide">Aucun logo</div>`;
    }
    if (apercuPhoto) {
      apercuPhoto.innerHTML = (reg && reg.photo_url)
        ? `<img src="${esc(reg.photo_url)}" alt="Photo"><button type="button" class="img-del" data-quoi="photo">Retirer</button>`
        : `<div class="img-vide">Aucune photo</div>`;
    }

    const apercuCouv = $("apercuCouverture");
    if (apercuCouv) {
      apercuCouv.innerHTML = (reg && reg.couverture_url)
        ? `<img src="${esc(reg.couverture_url)}" alt="Couverture"><button type="button" class="img-del" data-quoi="couverture">Retirer</button>`
        : `<div class="img-vide">Aucune image de couverture</div>`;
    }

    document.querySelectorAll(".img-del").forEach(b =>
      b.onclick = () => retirerImage(b.getAttribute("data-quoi")));
  }
  window.chargerReglages = chargerReglages;

  async function uploaderImage(quoi, file, statusEl, btn, maxMo) {
    const db = window._db;
    const limite = maxMo || 3;
    status(statusEl, "", "");
    if (!file) { status(statusEl, "Choisissez une image.", "err"); return; }
    if (file.size > limite * 1024 * 1024) { status(statusEl, `Image trop lourde (max ${limite} Mo).`, "err"); return; }

    if (btn) btn.disabled = true;
    status(statusEl, "Envoi en cours…", "");

    const ent = await getEnt(db);
    if (!ent) { status(statusEl, "Entreprise introuvable.", "err"); if (btn) btn.disabled = false; return; }

    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const chemin = `${ent.slug}/branding/${quoi}-${Date.now()}.${ext}`;

    const up = await db.storage.from(BUCKET).upload(chemin, file, { cacheControl: "3600", upsert: false });
    if (up.error) { status(statusEl, "Échec : " + up.error.message, "err"); if (btn) btn.disabled = false; return; }

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(chemin);

    // Récupérer l'ancien chemin pour le supprimer ensuite
    const { data: ancien } = await db.from("reglages").select("*").eq("entreprise_id", ent.id).maybeSingle();
    const ancienChemin = ancien ? ancien[quoi + "_chemin"] : null;

    const champs = { entreprise_id: ent.id, updated_at: new Date().toISOString() };
    champs[quoi + "_url"] = pub.publicUrl;
    champs[quoi + "_chemin"] = chemin;

    const { error } = await db.from("reglages").upsert(champs, { onConflict: "entreprise_id" });
    if (error) {
      await db.storage.from(BUCKET).remove([chemin]);
      status(statusEl, "Erreur : " + error.message, "err");
      if (btn) btn.disabled = false; return;
    }

    if (ancienChemin) await db.storage.from(BUCKET).remove([ancienChemin]);

    const NOM = { logo: "Logo", photo: "Photo", couverture: "Image de couverture" };
    status(statusEl, (NOM[quoi] || "Image") + " mise à jour ✓ Rechargez le site pour voir le résultat.", "ok");
    if (btn) btn.disabled = false;
    chargerReglages();
  }

  const logoForm = $("logoForm");
  if (logoForm) logoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    uploaderImage("logo", $("logoFile").files[0], $("logoStatus"), $("logoSubmit"));
  });

  const photoForm = $("photoForm");
  if (photoForm) photoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    uploaderImage("photo", $("photoFile").files[0], $("photoStatus"), $("photoSubmit"));
  });

  const couvForm = $("couvertureForm");
  if (couvForm) couvForm.addEventListener("submit", (e) => {
    e.preventDefault();
    uploaderImage("couverture", $("couvertureFile").files[0], $("couvertureStatus"), $("couvertureSubmit"), 4);
  });

  async function retirerImage(quoi) {
    const LBL = { logo: "le logo", photo: "la photo", couverture: "l'image de couverture" };
    if (!confirm(`Retirer ${LBL[quoi] || "cette image"} ?`)) return;
    const db = window._db;
    const ent = await getEnt(db);
    if (!ent) return;
    const { data: reg } = await db.from("reglages").select("*").eq("entreprise_id", ent.id).maybeSingle();
    if (reg && reg[quoi + "_chemin"]) await db.storage.from(BUCKET).remove([reg[quoi + "_chemin"]]);

    const champs = { entreprise_id: ent.id, updated_at: new Date().toISOString() };
    champs[quoi + "_url"] = null;
    champs[quoi + "_chemin"] = null;
    const { error } = await db.from("reglages").upsert(champs, { onConflict: "entreprise_id" });
    if (error) alert("Erreur : " + error.message); else chargerReglages();
  }
})();
