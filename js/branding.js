/* ============================================================
   Branding — charge le logo et la photo depuis Supabase
   et remplace les placeholders sur le site public.
   Si rien n'est défini, les placeholders restent (pas de casse).
   ============================================================ */
(function () {
  if (typeof SUPABASE_READY === "undefined" || !SUPABASE_READY || !window.supabase) return;
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const { data: ent } = await db.from("entreprises").select("id").eq("slug", ENTREPRISE_SLUG).maybeSingle();
      if (!ent) return;

      const { data: reg } = await db.from("reglages").select("logo_url, photo_url, couverture_url").eq("entreprise_id", ent.id).maybeSingle();
      if (!reg) return;

      // --- COUVERTURE : image de fond du hero (accueil) ---
      if (reg.couverture_url) {
        const hero = document.querySelector(".hero");
        if (hero) {
          hero.classList.add("has-cover");
          hero.style.backgroundImage = `url("${reg.couverture_url}")`;
        }
      }

      // --- LOGO : remplace le logo par défaut si Mélissa en uploade un ---
      if (reg.logo_url) {
        document.querySelectorAll(".brand .mk").forEach(el => {
          el.innerHTML = "";
          const img = document.createElement("img");
          img.src = reg.logo_url;
          img.alt = "Makaya Method";
          img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block";
          el.appendChild(img);
        });
      }

      // --- PHOTO : remplace le placeholder du portrait (hero) et des visuels ---
      if (reg.photo_url) {
        // Hero portrait
        const heroPh = document.querySelector(".hero-portrait .ph");
        if (heroPh) {
          const parent = heroPh.parentElement;
          heroPh.remove();
          const img = document.createElement("img");
          img.src = reg.photo_url;
          img.alt = "Mélissa Paultre";
          img.style.cssText = "width:100%;height:100%;object-fit:cover;position:absolute;inset:0";
          parent.appendChild(img);
        }
        // Visuel de la section "qui suis-je" / à-propos
        document.querySelectorAll(".split-visual .ph").forEach(ph => {
          const parent = ph.parentElement;
          ph.remove();
          const img = document.createElement("img");
          img.src = reg.photo_url;
          img.alt = "Mélissa Paultre";
          img.style.cssText = "width:100%;height:100%;object-fit:cover;position:absolute;inset:0";
          parent.appendChild(img);
        });
        // Petite carte du hero (avatar)
        const av = document.querySelector(".hero-card .av");
        if (av) {
          av.textContent = "";
          av.style.background = "transparent";
          const img = document.createElement("img");
          img.src = reg.photo_url;
          img.alt = "";
          img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%";
          av.appendChild(img);
        }
      }
    } catch (_) { /* silencieux : le site marche sans */ }
  });
})();
