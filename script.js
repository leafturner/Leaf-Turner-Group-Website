const slider = document.getElementById("sliderBtn");
const track = document.querySelector(".slider-track");

let isDragging = false;
let startX = 0;
let currentX = 0;

const maxTranslate = () => track.clientWidth - slider.clientWidth;

function startDrag(x) {
  isDragging = true;
  startX = x;
  slider.style.transition = "none";
}

function doDrag(x) {
  if (!isDragging) return;
  currentX = x - startX;
  const max = maxTranslate();
  currentX = Math.max(0, Math.min(currentX, max));
  slider.style.transform = `translateX(${currentX}px)`;

  if (currentX >= max - 10) {
    isDragging = false;
    slider.style.backgroundColor = "#0f0";
    setTimeout(() => {
      window.location.href = "transition.html";
    }, 150);
  }
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  slider.style.transition = "transform 0.3s";
  slider.style.transform = "translateX(0)";
}

slider.addEventListener("mousedown", (e) => startDrag(e.clientX));
document.addEventListener("mousemove", (e) => doDrag(e.clientX));
document.addEventListener("mouseup", endDrag);

slider.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientX);
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 1) doDrag(e.touches[0].clientX);
  },
  { passive: false }
);

document.addEventListener("touchend", endDrag);
