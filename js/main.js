/* Makaya Method — interactions */
const WA = "50948956823";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".year").forEach(e => e.textContent = new Date().getFullYear());

  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  if (burger && menu) {
    burger.addEventListener("click", () => { menu.classList.toggle("open"); burger.classList.toggle("open"); });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { menu.classList.remove("open"); burger.classList.remove("open"); }));
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));

  const waLink = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Bonjour Mélissa, je souhaite des informations sur Makaya Method.");
  const waFloat = document.getElementById("waFloat");
  if (waFloat) { waFloat.href = waLink; waFloat.target = "_blank"; waFloat.rel = "noopener"; }
  const ciWa = document.getElementById("ciWa");
  if (ciWa) { ciWa.href = waLink; ciWa.target = "_blank"; ciWa.rel = "noopener"; }
});
