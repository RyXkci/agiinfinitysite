import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { gsap } from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, SplitText, TextPlugin);
ScrollTrigger.normalizeScroll(true);

const canvas = document.querySelector("#canvasParticles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const opts = {
  // Hexagon mode settings
  hexLen: 20,
  hexCount: 50,
  hexBaseTime: 10,
  hexAddedTime: 10,
  hexDieChance: 0.05,
  hexSpawnChance: 1,
  hexSparkChance: 0.1,
  hexSparkDist: 10,
  hexSparkSize: 2,
  hexShadowToTimePropMult: 6,
  hexBaseLightInputMultiplier: 0.01,
  hexAddedLightInputMultiplier: 0.02,
  hexRepaintAlpha: 0.04,

  // Chip mode settings
  chipLen: 15,
  chipCount: 30,
  chipBaseTime: 15,
  chipAddedTime: 15,
  chipDieChance: 0.02,
  chipSpawnChance: 1,
  chipSparkChance: 0.15,
  chipSparkDist: 8,
  chipSparkSize: 2,
  chipShadowToTimePropMult: 8,
  chipRepaintAlpha: 0.05,
  chipSize: 120,

  colors: ["#9cffff", "#1c84b9"],
  cx: canvas.width / 2,
  cy: canvas.height / 2,
  currentShape: "hexagon",
};

let tick = 0;
let lines = [];
let isAnimating = true;
let animationId = null;
let dieX, dieY;
const baseRad = (Math.PI * 2) / 6;

ctx.fillStyle = "blue";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Calculate die bounds for hexagon mode
function updateDieBounds() {
  const len = opts.currentShape === "hexagon" ? opts.hexLen : opts.chipLen;
  dieX = canvas.width / 2 / len;
  dieY = canvas.height / 2 / len;
}
updateDieBounds();

class Line {
  constructor() {
    this.reset();
  }

  reset() {
    if (opts.currentShape === "hexagon") {
      this.resetHexagon();
    } else {
      this.resetChip();
    }
  }

  resetHexagon() {
    // Original hexagon reset - starts from center
    this.x = 0;
    this.y = 0;
    this.addedX = 0;
    this.addedY = 0;
    this.rad = 0;
    this.lightInputMultiplier =
      opts.hexBaseLightInputMultiplier +
      opts.hexAddedLightInputMultiplier * Math.random();
    this.color = opts.colors[Math.floor(Math.random() * opts.colors.length)];
    this.cumulativeTime = 0;
    this.beginPhase();
  }

  resetChip() {
    const side = Math.floor(Math.random() * 4);
    const offset = ((Math.random() - 0.5) * opts.chipSize) / opts.chipLen;

    switch (side) {
      case 0: // top
        this.x = offset;
        this.y = -opts.chipSize / (2 * opts.chipLen);
        this.rad = -Math.PI / 2;
        break;
      case 1: // right
        this.x = opts.chipSize / (2 * opts.chipLen);
        this.y = offset;
        this.rad = 0;
        break;
      case 2: // bottom
        this.x = offset;
        this.y = opts.chipSize / (2 * opts.chipLen);
        this.rad = Math.PI / 2;
        break;
      case 3: // left
        this.x = -opts.chipSize / (2 * opts.chipLen);
        this.y = offset;
        this.rad = Math.PI;
        break;
    }

    this.addedX = Math.cos(this.rad);
    this.addedY = Math.sin(this.rad);
    this.color = opts.colors[Math.floor(Math.random() * opts.colors.length)];
    this.cumulativeTime = 0;
    this.segmentCount = 0;
    this.maxSegments = 3 + Math.floor(Math.random() * 4);
    this.beginPhase();
  }

  beginPhase() {
    this.x += this.addedX;
    this.y += this.addedY;
    this.time = 0;

    if (opts.currentShape === "hexagon") {
      this.targetTime = Math.floor(
        opts.hexBaseTime + opts.hexAddedTime * Math.random()
      );
      this.rad += baseRad * (Math.random() < 0.5 ? 1 : -1);
      this.addedX = Math.cos(this.rad);
      this.addedY = Math.sin(this.rad);

      if (
        Math.random() < opts.hexDieChance ||
        this.x > dieX ||
        this.x < -dieX ||
        this.y > dieY ||
        this.y < -dieY
      ) {
        this.reset();
      }
    } else {
      this.targetTime = Math.floor(
        opts.chipBaseTime + opts.chipAddedTime * Math.random()
      );
      const turn = Math.random();
      if (turn < 0.3) {
        this.rad += Math.PI / 2;
      } else if (turn < 0.6) {
        this.rad -= Math.PI / 2;
      }
      this.addedX = Math.cos(this.rad);
      this.addedY = Math.sin(this.rad);

      this.segmentCount++;
      const maxDist =
        Math.max(canvas.width, canvas.height) / (2 * opts.chipLen);
      if (
        this.segmentCount >= this.maxSegments ||
        Math.abs(this.x) > maxDist ||
        Math.abs(this.y) > maxDist ||
        Math.random() < opts.chipDieChance
      ) {
        this.reset();
      }
    }
  }

  step() {
    this.time++;
    this.cumulativeTime++;

    if (this.time >= this.targetTime) {
      this.beginPhase();
    }

    const prop = this.time / this.targetTime;
    const wave = Math.sin((prop * Math.PI) / 2);
    const x = this.addedX * wave;
    const y = this.addedY * wave;

    const len = opts.currentShape === "hexagon" ? opts.hexLen : opts.chipLen;
    const shadowMult =
      opts.currentShape === "hexagon"
        ? opts.hexShadowToTimePropMult
        : opts.chipShadowToTimePropMult;
    const sparkChance =
      opts.currentShape === "hexagon"
        ? opts.hexSparkChance
        : opts.chipSparkChance;
    const sparkDist =
      opts.currentShape === "hexagon" ? opts.hexSparkDist : opts.chipSparkDist;
    const sparkSize =
      opts.currentShape === "hexagon" ? opts.hexSparkSize : opts.chipSparkSize;

    ctx.shadowBlur = prop * shadowMult;
    ctx.fillStyle = ctx.shadowColor = this.color;
    ctx.fillRect(
      opts.cx + (this.x + x) * len,
      opts.cy + (this.y + y) * len,
      2,
      2
    );

    if (Math.random() < sparkChance) {
      ctx.fillRect(
        opts.cx +
          (this.x + x) * len +
          Math.random() * sparkDist * (Math.random() < 0.5 ? 1 : -1) -
          sparkSize / 2,
        opts.cy +
          (this.y + y) * len +
          Math.random() * sparkDist * (Math.random() < 0.5 ? 1 : -1) -
          sparkSize / 2,
        sparkSize,
        sparkSize
      );
    }
  }
}

function drawChip() {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#1c84b9";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    opts.cx - opts.chipSize / 2,
    opts.cy - opts.chipSize / 2,
    opts.chipSize,
    opts.chipSize
  );

  const positions = [
    [opts.cx - opts.chipSize / 2, opts.cy - opts.chipSize / 2],
    [opts.cx + opts.chipSize / 2, opts.cy - opts.chipSize / 2],
    [opts.cx + opts.chipSize / 2, opts.cy + opts.chipSize / 2],
    [opts.cx - opts.chipSize / 2, opts.cy + opts.chipSize / 2],
  ];

  ctx.strokeStyle = "#9cffff";
  ctx.lineWidth = 1;
  positions.forEach(([x, y]) => {
    ctx.strokeRect(x - 2, y - 2, 4, 4);
  });
}

function animateParticles() {
  if (!isAnimating) return;

  tick++;

  const repaintAlpha =
    opts.currentShape === "hexagon"
      ? opts.hexRepaintAlpha
      : opts.chipRepaintAlpha;
  const maxCount =
    opts.currentShape === "hexagon" ? opts.hexCount : opts.chipCount;
  const spawnChance =
    opts.currentShape === "hexagon"
      ? opts.hexSpawnChance
      : opts.chipSpawnChance;

  ctx.globalCompositeOperation = "source-over";
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(0,0,0,${repaintAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (opts.currentShape === "chip") {
    drawChip();
  }

  ctx.globalCompositeOperation = "lighter";

  if (lines.length < maxCount && Math.random() < spawnChance) {
    lines.push(new Line());
  }

  lines.forEach((line) => line.step());

  animationId = requestAnimationFrame(animateParticles);
}

function pauseAnimation() {
  isAnimating = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function resumeAnimation() {
  if (!isAnimating) {
    isAnimating = true;
    animateParticles();
  }
}

function resetAnimation() {
  lines = [];
  tick = 0;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function changeShape(shapeName) {
  if (shapeName === "hexagon" || shapeName === "chip") {
    opts.currentShape = shapeName;
    updateDieBounds();
    lines.forEach((line) => line.reset());
  }
}

window.addEventListener("resize", function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  opts.cx = canvas.width / 2;
  opts.cy = canvas.height / 2;
  updateDieBounds();
});

// Start the animation
animateParticles();

// Export functions for external control using module pattern
const hexAnimation = (function () {
  return {
    pause: pauseAnimation,
    resume: resumeAnimation,
    reset: resetAnimation,
    changeShape: changeShape,
  };
})();

// OPTIONS OBJECT is the key fix here
const options = {
  root: null, // use the viewport
  rootMargin: "0px",
  // Threshold 0.5 means: Trigger only when 50% of the element is visible.
  // This prevents it from firing immediately when it's just touching the bottom edge.
  threshold: 0.2,
};

const particleShifter = document.querySelector(".intro");

const particleShiftObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      console.log("Element is 50% visible!");
      hexAnimation.changeShape("chip"); // Switch to chip mode
    } else {
      console.log("Element left view");
      hexAnimation.changeShape("hexagon"); // Switch to chip mode
    }
  });
}, options); // Pass the options here

particleShiftObserver.observe(particleShifter);

const particlePauser = document.querySelector(".scroller-two");

const particlePauserObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      console.log("Pauser has entered");
      hexAnimation.pause(); // Switch to chip mode
      canvas.style.visibility = "hidden";
    } else {
      console.log("Pauser has left");
      hexAnimation.resume(); // Switch to chip mode
      canvas.style.visibility = "visible";
    }
  });
}, options); // Pass the options here

particlePauserObserver.observe(particlePauser);

// BEGIN 3d CANVAS STUFF

const torusCanvas = document.querySelector("#canvasTorus");
// create scene
const scene = new THREE.Scene();

// camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 4;

let torus;
let mixer;
const loader = new GLTFLoader();
loader.load(
  "models/torus.glb",
  function (gltf) {
    torus = gltf.scene;
    console.log("TORUS", torus);
    scene.add(torus);

    // Move to right and rotate on scroller-three
    // Move to right and rotate on scroller-three
    gsap.to(torus.rotation, {
      x: Math.PI * 0.5,
      duration: 4,
      scrollTrigger: {
        trigger: ".scroller-three",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        toggleActions: "play none none reverse",
      },
    });

    gsap.to(torus.position, {
      x: 4,
      duration: 4,

      scrollTrigger: {
        trigger: ".scroller-three",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        toggleActions: "play none none reverse",
      },
    });

    // Move back to center and top on partner-section
    gsap.to(torus.position, {
      x: 0,
      y: 1,
      duration: 4,
      immediateRender: false,
      scrollTrigger: {
        trigger: ".partner-section",
        start: "top center",
        end: "top top",
        scrub: 1,
        toggleActions: "play none none reverse",
      },
    });

    gsap.to(torus.rotation, {
      x: 0,
      duration: 4,
      ease: "power1.out",
      immediateRender: false,
      scrollTrigger: {
        trigger: ".partner-section",
        start: "top bottom",
        end: "top top",
        // scrub: 1,
        toggleActions: "play none none reverse",
      },
    });

    // ZOOM

    // gsap.to(camera.position, {
    //   z: 2,
    //   duration: 4,
    //   scrollTrigger: {
    //     trigger: ".scroller-four",
    //     start: "top bottom",
    //     end: "bottom top",
    //     scrub: 1,
    //     onEnter: () => {
    //       mixer.clipAction(gltf.animations[0]).stop(); // Stop animation
    //     },
    //     onLeaveBack: () => {
    //       mixer.clipAction(gltf.animations[0]).play(); // Resume when scrolling back up
    //     },
    //   },
    // });

    // gsap.to(torus.position, {
    //   x: 0,
    //   y: 0,
    //   duration: 4,
    //   scrollTrigger: {
    //     trigger: ".scroller-four",
    //     start: "top bottom",
    //     end: "bottom top",
    //     scrub: 1,
    //   },
    // });

    // Change the color of all meshes in the model
    torus.traverse((child) => {
      if (child.isMesh) {
        console.log(child);
        // Option 1: Replace material with a new colored material
        child.material = new THREE.MeshStandardMaterial({
          color: 0x98fefe, // Your custom magenta/pink color
          metalness: 0.3,
          roughness: 0.4,
        });

        // Option 2: If you want to keep existing material properties and just change color
        // Uncomment this instead of Option 1
        // if (child.material) {
        //   child.material.color.setHex(0x00ff00); // Green
        // }
      }
    });

    mixer = new THREE.AnimationMixer(torus);
    mixer.clipAction(gltf.animations[0]).play();
  },
  function (xhr) {},
  function (error) {}
);

const renderer = new THREE.WebGLRenderer({ canvas: torusCanvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const controls = new OrbitControls(camera, torusCanvas);
controls.enableDamping = true;
// controls.autoRotate = true;
const reRenderer3d = () => {
  renderer.render(scene, camera);
  requestAnimationFrame(reRenderer3d);
  if (mixer) mixer.update(0.02);
  controls.update();
};

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
scene.add(topLight);
reRenderer3d();

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

gsap.fromTo(
  ".agi-outro",
  {
    scale: 0,
    clipPath: "circle(0px at center)",
  },
  {
    scale: 1,
    clipPath: `circle(${maxRadius}px at center)`,
    ease: "sine.in",
    scrollTrigger: {
      trigger: ".scroller-six",
      start: "top bottom",
      end: "top top",
      scrub: true,
    },
  }
);

const autoRotateObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // User has scrolled to second section
        console.log("rotator has entered");
        controls.autoRotate = false;
      } else {
        // User scrolled back up
        // controls.autoRotate = true;
      }
    });
  },
  {
    threshold: 0.1, // Adjust based on when you want the transition
  }
);

const rotateObserver = document.querySelector(".scroller-three");

autoRotateObserver.observe(rotateObserver);


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
