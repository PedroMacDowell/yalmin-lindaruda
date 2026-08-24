const body = document.body;
const unlockButton = document.getElementById("unlockButton");
const lockAgainButton = document.getElementById("lockAgain");
const keyCursor = document.querySelector(".key-cursor");
const site = document.getElementById("site");

let cursorX = -100;
let cursorY = -100;
let currentX = -100;
let currentY = -100;

function unlockPage() {
  if (body.classList.contains("opening")) return;

  body.classList.add("opening");

  window.setTimeout(() => {
    body.classList.remove("locked", "opening");
    body.classList.add("unlocked");
    site.setAttribute("tabindex", "-1");
    site.focus({ preventScroll: true });
  }, 720);
}

function lockPage() {
  body.classList.remove("unlocked");
  body.classList.add("locked");
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.setTimeout(() => unlockButton.focus({ preventScroll: true }), 250);
}

unlockButton.addEventListener("click", unlockPage);
unlockButton.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    unlockPage();
  }
});
lockAgainButton.addEventListener("click", lockPage);

function moveKeyCursor() {
  currentX += (cursorX - currentX) * 0.22;
  currentY += (cursorY - currentY) * 0.22;
  keyCursor.style.transform = `translate3d(${currentX - 10}px, ${currentY - 38}px, 0) rotate(-18deg)`;
  requestAnimationFrame(moveKeyCursor);
}

if (window.matchMedia("(pointer: fine)").matches) {
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    cursorX = event.clientX;
    cursorY = event.clientY;
    keyCursor.classList.add("is-visible");
  });

  document.addEventListener("mouseleave", () => {
    keyCursor.classList.remove("is-visible");
  });

  moveKeyCursor();
}

document.querySelectorAll("[contenteditable][data-storage-key]").forEach((element) => {
  const key = `birthday-site:${element.dataset.storageKey}`;
  const savedValue = localStorage.getItem(key);

  if (savedValue) {
    element.innerHTML = savedValue;
  }

  element.addEventListener("input", () => {
    localStorage.setItem(key, element.innerHTML);
  });
});

function drawCover(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#d50e2f");
  gradient.addColorStop(0.48, "#f06b7a");
  gradient.addColorStop(1, "#7ea892");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#fff7f4";
  const size = Math.max(20, Math.min(36, width * 0.09));
  ctx.font = `700 ${size}px Georgia, serif`;

  for (let y = size; y < height + size; y += size * 2.25) {
    for (let x = size * 0.5; x < width + size; x += size * 2.35) {
      const offset = (Math.floor(y / size) % 2) * size;
      ctx.fillText("\u2665", x + offset, y);
    }
  }

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#25090d";
  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillRect(x, y, Math.random() * 2 + 0.7, Math.random() * 2 + 0.7);
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255, 253, 251, 0.86)";
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d50e2f";
  ctx.font = `700 ${Math.max(26, width * 0.12)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2665", width / 2, height / 2 + 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function setupScratchCard(card) {
  const photo = card.querySelector(".scratch-photo");
  const canvas = card.querySelector(".scratch-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let isDrawing = false;
  let scratchCount = 0;
  let revealed = false;

  function resizeCanvas() {
    if (revealed) return;

    const rect = photo.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawCover(ctx, rect.width, rect.height);
  }

  function revealCard() {
    revealed = true;
    card.classList.add("is-revealed");
    canvas.setAttribute("aria-hidden", "true");
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function createSpark(x, y) {
    if (scratchCount % 6 !== 0) return;

    const spark = document.createElement("span");
    spark.className = "scratch-spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    photo.appendChild(spark);
    window.setTimeout(() => spark.remove(), 620);
  }

  function scratchAt(event) {
    if (revealed) return;

    const { x, y } = getPoint(event);
    const rect = canvas.getBoundingClientRect();
    const brush = Math.max(24, Math.min(46, rect.width * 0.095));

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brush, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    card.classList.add("scratching");
    scratchCount += 1;
    createSpark(x, y);

    if (scratchCount % 12 === 0) {
      checkReveal();
    }
  }

  function checkReveal() {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let total = 0;

    for (let i = 3; i < pixels.length; i += 64) {
      total += 1;
      if (pixels[i] < 40) transparent += 1;
    }

    if (transparent / total > 0.45) {
      revealCard();
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    isDrawing = true;
    canvas.setPointerCapture(event.pointerId);
    scratchAt(event);
  });

  canvas.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      scratchAt(event);
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" && !isDrawing) return;
    scratchAt(event);
  });

  canvas.addEventListener("pointerup", (event) => {
    isDrawing = false;
    canvas.releasePointerCapture(event.pointerId);
    window.setTimeout(() => card.classList.remove("scratching"), 260);
    checkReveal();
  });

  canvas.addEventListener("pointercancel", () => {
    isDrawing = false;
    card.classList.remove("scratching");
  });

  canvas.addEventListener("dblclick", revealCard);

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(photo);
  window.addEventListener("load", resizeCanvas);
  resizeCanvas();
}

document.querySelectorAll(".memory-card").forEach(setupScratchCard);
