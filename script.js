/* ==========================================================
   Rohan Das Kathabaniya - script.js  (Version 1)
   Builds the navigation and footer on every page, so you only
   edit them here once. Change your links in CONFIG below.
   ========================================================== */

(function () {
  "use strict";

  /* ---------- EDIT THESE ---------- */
  var CONFIG = {
    name: "Rohan Das Kathabaniya",
    brand: "Rohan Das",
    email: "contact@rohandaskathabaniya.com.np",
    github: "https://github.com/rohandaskathabaniya-art",
    linkedin: "https://www.linkedin.com/in/rohan-das-kathabaniya-435199326",
    cv: "assets/Rohan-Das-Kathabaniya-CV.pdf"
  };

  var NAV = [
    ["Home", "index.html"],
    ["About", "about.html"],
    ["Projects", "projects.html"],
    ["Services", "services.html"],
    ["Free Tools", "tools.html"],
    ["Work With Me", "career.html"],
    ["Resume", "resume.html"],
    ["Blog", "blog.html"],
    ["Contact", "contact.html"]
  ];

  var ICON_THEME =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>';
  var ICON_MENU =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  /* ---------- Header ---------- */
  var page = location.pathname.split("/").pop() || "index.html";
  var header = document.getElementById("site-header");

  if (header) {
    var links = NAV.map(function (item) {
      var current = item[1] === page ? ' aria-current="page"' : "";
      return '<li><a href="' + item[1] + '"' + current + ">" + item[0] + "</a></li>";
    }).join("");

    header.className = "site-header";
    header.innerHTML =
      '<div class="wrap bar">' +
      '<a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">RD</span><span>' + CONFIG.brand + "</span></a>" +
      '<nav aria-label="Main navigation"><ul id="nav-menu" class="nav">' + links + "</ul></nav>" +
      '<div class="bar-actions">' +
      '<button class="icon-btn" id="theme-btn" type="button" aria-label="Switch between light and dark theme">' + ICON_THEME + "</button>" +
      '<button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu">' + ICON_MENU + "</button>" +
      "</div></div>";

    var menuBtn = document.getElementById("menu-btn");
    var menu = document.getElementById("nav-menu");

    function setMenu(open) {
      menu.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    menuBtn.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { setMenu(false); menuBtn.focus(); }
    });

    /* Theme toggle: remembers the choice in this browser only */
    document.getElementById("theme-btn").addEventListener("click", function () {
      var root = document.documentElement;
      var isDark =
        root.getAttribute("data-theme") === "dark" ||
        (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (err) { /* storage blocked: ignore */ }
    });
  }

  /* ---------- Footer ---------- */
  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML =
      '<div class="wrap">' +
      '<div class="footer-grid">' +
      "<div><h2>" + CONFIG.name + "</h2><p>B.E. Computer Engineering Student</p><p>Nepal</p></div>" +
      '<nav aria-label="Quick links"><h2>Quick Links</h2><ul>' +
      '<li><a href="projects.html">Projects</a></li>' +
      '<li><a href="tools.html">Free Tools</a></li>' +
      '<li><a href="resources.html">Resources</a></li>' +
      '<li><a href="privacy.html">Privacy</a></li></ul></nav>' +
      '<nav aria-label="Social links"><h2>Connect</h2><ul>' +
      '<li><a href="' + CONFIG.github + '" target="_blank" rel="noopener">GitHub</a></li>' +
      '<li><a href="' + CONFIG.linkedin + '" target="_blank" rel="noopener">LinkedIn</a></li>' +
      '<li><a href="mailto:' + CONFIG.email + '">Email</a></li></ul></nav>' +
      "</div>" +
      '<p class="copyright">&copy; ' + new Date().getFullYear() + " " + CONFIG.name + ". All rights reserved.</p>" +
      "</div>";
  }

  /* ---------- Fill links marked data-link="github|linkedin|email|cv" ---------- */
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var key = el.getAttribute("data-link");
    if (!CONFIG[key]) return;
    el.href = key === "email" ? "mailto:" + CONFIG.email : CONFIG[key];
    if (key === "github" || key === "linkedin") { el.target = "_blank"; el.rel = "noopener"; }
  });

  /* ---------- Profile photo: show initials if assets/profile.jpg is missing ---------- */
  document.querySelectorAll(".avatar").forEach(function (box) {
    var img = box.querySelector("img");
    if (!img) return;
    function fallback() { box.classList.add("no-photo"); }
    img.addEventListener("error", fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  });
})();
