// iOS Safari can't lock orientation via JS (ADR-0001 consequence). Instead we
// nudge the user to rotate while a show is on and the device is portrait.
export function initIosHints(): void {
  const hint = document.createElement("div");
  hint.className = "rotate-hint";
  hint.innerHTML = `<div>🔄<div class="rotate-hint__t">หมุนเครื่องเป็นแนวนอน</div><small>เพื่อป้ายไฟที่ใหญ่ที่สุด</small></div>`;
  document.body.appendChild(hint);

  const update = (): void => {
    const portrait = window.innerHeight > window.innerWidth;
    const showing = document.body.classList.contains("showing");
    hint.classList.toggle("rotate-hint--show", portrait && showing);
  };

  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);
  // react to entering/leaving a show (body.showing toggled by main)
  new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  update();
}
