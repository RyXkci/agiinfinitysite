// fonts
// Supports weights 100-900
import '@fontsource-variable/montserrat';
// Supports weights 400-900
import '@fontsource-variable/orbitron';

  import * as THREE from "three";
  import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { gsap } from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, SplitText, TextPlugin);

// Check for mobile/touch devices
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
  || window.innerWidth <= 1024 
  || 'ontouchstart' in window;

if (isMobile) {
  ScrollTrigger.normalizeScroll(true);
}


// GSAP TEXT STUFF

let wiresSplit = SplitText.create(".wires", { type: "words, chars" });
let wavesSplit = SplitText.create(".waves", { type: "words, chars" });

gsap.to(".hero-title", {
  opacity: 0,
  y: 100,
  scale: 2,
  stagger: 0.05,
  scrollTrigger: {
    trigger: ".intro",
    toggleActions: "play none none reverse",
  },
});

gsap.from(wiresSplit.chars, {
  duration: 1,
  y: -100, // animate from 100px below
  autoAlpha: 0, // fade in from opacity: 0 and visibility: hidden
  stagger: 0.05, // 0.05 seconds between each
  scrollTrigger: {
    trigger: ".wires",
    toggleActions: "play none none reverse",
  },
});

gsap.from(wavesSplit.chars, {
  duration: 1,
  y: -100, // animate from 100px below
  opacity: 1,
  autoAlpha: 0, // fade in from opacity: 0 and visibility: hidden
  stagger: 0.05, // 0.05 seconds between each
  scrollTrigger: {
    trigger: ".scroller-one",
    toggleActions: "play none none reverse",
    start: "top center",
  },
});

gsap.to(".wires", {
  y: -15,
  opacity: 0,
  scrollTrigger: {
    trigger: ".scroller-two",
    start: "top center",
    toggleActions: "play none none reverse",
  },
});
gsap.to(".waves", {
  y: 15,
  opacity: 0,
  scrollTrigger: {
    trigger: ".scroller-two",
    start: "top center",
    toggleActions: "play none none reverse",
  },
});

const maxRadius = Math.sqrt(
  Math.pow(window.innerWidth / 2, 2) + Math.pow(window.innerHeight / 2, 2)
);

// Quick opacity fade
gsap.fromTo(
  "#canvasTorus",
  {
    opacity: 0,
  },
  {
    opacity: 1,
    duration: 0.2,
    scrollTrigger: {
      trigger: ".scroller-one",
      start: "top bottom", // When scroller-one enters viewport
      toggleActions: "play none none reverse",
    },
  }
);

// Scale and clipPath with scrub (sync to scroll)
gsap.fromTo(
  "#canvasTorus",
  {
    scale: 0,
    clipPath: "circle(0px at center)",
  },
  {
    scale: 1,
    clipPath: `circle(${maxRadius}px at center)`,
    ease: "sine.in",
    scrollTrigger: {
      trigger: ".scroller-one",
      start: "top bottom", // Starts when scroller-one enters from bottom
      end: "top top", // Completes when scroller-one is fully in viewport
      scrub: true,
      toggleActions: "play none none reverse",
      // markers: true // Uncomment to debug
    },
  }
);



gsap.to(".partner_text", {
  opacity: 0,
  scrollTrigger: {
    trigger: ".scroller-four",
    start: "top center",
    toggleActions: "play none none reverse",
  },
});

// Fade out canvasTorus
gsap.fromTo(
  "#canvasTorus",
  { opacity: 1 },
  {
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".scroller-four",
      start: "top center", // Start when section hits center
      end: "center center", // End halfway through - much shorter!
      scrub: 1,
      invalidateOnRefresh: true,
    },
  }
);

gsap.fromTo(
  "#canvasClear",
  { opacity: 0 },
  {
    opacity: 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".scroller-four",
      start: "top center",
      end: "center center", // Same short distance
      scrub: 1,
      invalidateOnRefresh: true,
    },
  }
);

gsap.to(".nanni_title", {
  x: -200,
  opacity: 0,
  scrollTrigger: {
    trigger: ".nanni-scope-inner",
    start: "top bottom",
    end: "top center",
    scrub: 1,
  },
});

gsap.to(".nanni_intro", {
  x: 200,
  opacity: 0,
  scrollTrigger: {
    trigger: ".nanni-scope-inner",
    start: "top-=100 bottom", // Starts 100px later
    end: "top+=100 center",
    scrub: 1,
  },
});

gsap.to(".nanni_text-big", {
  x: -200,
  opacity: 0,
  scrollTrigger: {
    trigger: ".nanni-scope-inner",
    start: "top-=200 bottom", // Starts 200px later
    end: "top+=200 center",
    scrub: 1,
  },
});

gsap.to(".nanni_text-sm-accent", {
  x: 200,
  opacity: 0,
  scrollTrigger: {
    trigger: ".nanni-scope-inner",
    start: "top bottom", // Starts 300px later
    end: "top+=200 center",
    scrub: 1,
  },
});

const scopeItems = gsap.utils.toArray(".nanni-scope-item");

scopeItems.forEach((item, index) => {
  gsap.fromTo(
    item,
    {
      scale: 2, // Start big
      opacity: 0,
      y: 100, // Start from below
    },
    {
      scale: 1, // Scale to normal
      opacity: 1,
      y: 0,
      scrollTrigger: {
        trigger: item,
        start: "top bottom", // When item enters from bottom
        end: "top center", // Completes when item reaches center
        scrub: 1,
        // markers: true, // Remove after testing
      },
    }
  );
});

const outlookItems = gsap.utils.toArray(".nanni-outlook-item");

outlookItems.forEach((item, index) => {
  gsap.fromTo(
    item,
    {
      scale: 2, // Start big
      opacity: 0,
      y: 100, // Start from below
    },
    {
      scale: 1, // Scale to normal
      opacity: 1,
      y: 0,
      scrollTrigger: {
        trigger: item,
        start: "top bottom", // When item enters from bottom
        end: "top center", // Completes when item reaches center
        scrub: 1,
        // markers: true, // Remove after testing
      },
    }
  );
});

// gsap.fromTo(
//   ".agi-outro",
//   {
//     scale: 0,
//     clipPath: "circle(0px at center)",
//   },
//   {
//     scale: 1,
//     clipPath: `circle(${maxRadius}px at center)`,
//     ease: "sine.in",
//     scrollTrigger: {
//       trigger: ".scroller-six",
//       start: "top bottom",
//       end: "top top",
//       scrub: true,
//     },
//   }
// );


window.addEventListener("load", () => {
  window.scrollTo(0, 0);  
});

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
  gsap.globalTimeline.restart(true, false);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    location.reload();
  }
});
