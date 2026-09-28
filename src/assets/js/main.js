/* SafeCity – μενού κινητού (προσβάσιμο κουμπί με aria-expanded).
   Χωρίς JavaScript το μενού εμφανίζεται πάντα ανοιχτό. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  function init() {
    var button = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!button || !nav) return;

    var mq = window.matchMedia("(max-width: 47.99em)");

    function setOpen(open) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { nav.removeAttribute("hidden"); } else { nav.setAttribute("hidden", ""); }
    }

    function sync() {
      if (mq.matches) {
        setOpen(false);
      } else {
        nav.removeAttribute("hidden");
        button.setAttribute("aria-expanded", "false");
      }
    }

    button.addEventListener("click", function () {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mq.matches && button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    });

    if (mq.addEventListener) { mq.addEventListener("change", sync); } else if (mq.addListener) { mq.addListener(sync); }
    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
