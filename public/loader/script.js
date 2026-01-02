// Minimal Loader Script - restores visibility and avoids null/audio errors
const preloader = document.getElementById('preloader');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const siteContent = document.getElementById('siteContent');

// Show once per session unless overridden
function hasForceLoader() {
  try {
    return (
      new URLSearchParams(window.location.search).get('forceLoader') === '1'
    );
  } catch {
    return false;
  }
}
try {
  if (!hasForceLoader() && sessionStorage.getItem('seenLoader') === '1') {
    if (preloader) preloader.style.display = 'none';
    if (siteContent) {
      siteContent.hidden = false;
      siteContent.classList.add('visible');
    }
    throw new Error('SkipLoaderOnce');
  }
  if (hasForceLoader()) {
    try {
      sessionStorage.removeItem('seenLoader');
    } catch {}
  }
} catch (e) {
  if (e && e.message === 'SkipLoaderOnce') {
    /* skip init */
  }
}

// Typewriter brand text (guarded)
(function () {
  if (
    !preloader ||
    (sessionStorage.getItem('seenLoader') === '1' && !hasForceLoader())
  )
    return;
  const brandEl = document.querySelector('.tw-brand');
  const caretEl = document.querySelector('.tw-caret');
  if (!brandEl || !caretEl) return;
  const fullText = brandEl.textContent || 'Tushar Electronics';
  brandEl.textContent = '';
  caretEl.style.visibility = 'visible';
  let i = 0;
  const speed = 60;
  function step() {
    if (i <= fullText.length) {
      brandEl.textContent = fullText.slice(0, i);
      i++;
      setTimeout(step, speed);
    }
  }
  step();
})();

// Three.js wireframe cube (guarded)
(function () {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('loaderCanvas');
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  camera.position.set(0, 0.6, 4.6);
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const cubeGeo = new THREE.BoxGeometry(1.35, 1.35, 1.35);
  const cube = new THREE.Mesh(
    cubeGeo,
    new THREE.MeshStandardMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
    })
  );
  const cubeWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(cubeGeo),
    new THREE.LineBasicMaterial({ color: 0xd6a000 })
  );
  cube.add(cubeWire);
  scene.add(cube);
  (function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.004;
    cube.rotation.y += 0.007;
    renderer.render(scene, camera);
  })();
})();

// Progress simulation (~3s)
(function () {
  const total = 3000;
  const start = performance.now();
  let rafId = null;
  function tick(now) {
    const p = Math.min((now - start) / total, 1);
    const pct = Math.min(p * 100, 100);
    if (progressFill) progressFill.style.width = `${pct.toFixed(0)}%`;
    if (progressText) progressText.textContent = `${pct.toFixed(0)}%`;
    if (pct < 100) {
      rafId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafId);
      onComplete();
    }
  }
  requestAnimationFrame(tick);
})();

function onComplete() {
  try {
    sessionStorage.setItem('seenLoader', '1');
  } catch {}
  if (preloader) preloader.classList.add('fade-out');
  setTimeout(() => {
    if (preloader) preloader.style.display = 'none';
    if (siteContent) {
      siteContent.hidden = false;
      siteContent.classList.add('visible');
    }
  }, 720);
}
