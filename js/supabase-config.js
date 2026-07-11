/* ============================================================
   CONFIGURATION — Mélissa Paultre (coaching)
   Projet Supabase partagé multi-entreprises (même que SteFi/Sandoo).
   ENTREPRISE_SLUG identifie ce site dans la base.
   ============================================================ */

const SUPABASE_URL = "https://darzhfamxnycdglcglgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnpoZmFteG55Y2RnbGNnbGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDUzNjcsImV4cCI6MjA5NTkyMTM2N30.uHMDHR4df8oYGIqLonLwAgEDzzdu1s7yj7VWtp3KUBQ";
const ENTREPRISE_SLUG = "makaya";

const SUPABASE_READY =
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("VOTRE_") &&
  !SUPABASE_ANON_KEY.includes("VOTRE_");
