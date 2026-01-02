(function () {
  // Animate a subtle gradient blob behind the mobile navbar dropdown using Three.js
  const isMobile = () => window.matchMedia('(max-width: 991.98px)').matches;
  let renderer, scene, camera, mesh, rafId;

  function ensureCanvas() {
    const container = document.querySelector('.navbar .container');
    if (!container) return null;
    let canvasHost = document.getElementById('navbar-dropdown-bg');
    if (!canvasHost) {
      canvasHost = document.createElement('div');
      canvasHost.id = 'navbar-dropdown-bg';
      canvasHost.style.position = 'absolute';
      canvasHost.style.top = '44px'; // just below toggler baseline
      canvasHost.style.right = '0';
      canvasHost.style.width = 'min(92vw, 380px)';
      canvasHost.style.height = '0px'; // will expand when menu opens
      canvasHost.style.zIndex = '1'; // below the dropdown panel (zIndex 2 in CSS)
      canvasHost.style.pointerEvents = 'none';
      container.appendChild(canvasHost);
    }
    return canvasHost;
  }

  function initThree(canvasHost) {
    const width = canvasHost.clientWidth || 360;
    const height = 220; // background height
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasHost.innerHTML = '';
    canvasHost.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    const geometry = new THREE.SphereGeometry(3.2, 64, 64);
    const uniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x0d2a55) },
      uColor2: { value: new THREE.Color(0x0c3560) },
      uAlpha: { value: 0.85 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main(){
          vUv = uv;
          vec3 pos = position;
          pos.z += sin(pos.x*2.0 + uTime*0.8)*0.12 + cos(pos.y*2.0 + uTime*0.6)*0.12;
          pos.x += sin(uTime*0.6 + position.y)*0.06;
          pos.y += cos(uTime*0.4 + position.x)*0.06;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1; uniform vec3 uColor2; uniform float uAlpha; varying vec2 vUv;
        void main(){
          float g = smoothstep(0.0,1.0,vUv.y);
          vec3 col = mix(uColor1, uColor2, g);
          gl_FragColor = vec4(col, uAlpha);
        }
      `,
      transparent: true,
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.2, 0);
    scene.add(mesh);

    const light = new THREE.PointLight(0xffffff, 0.6);
    light.position.set(2, 3, 6);
    scene.add(light);

    function animate() {
      uniforms.uTime.value += 0.016;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }
    animate();

    // Handle resize while open
    window.addEventListener('resize', () => {
      if (!renderer) return;
      const w = canvasHost.clientWidth || 360;
      const h = 220;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
  }

  function teardown() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (renderer) {
      renderer.dispose();
      renderer.domElement && renderer.domElement.remove();
      renderer = null;
    }
    scene = null;
    camera = null;
    mesh = null;
  }

  function syncWithCollapse() {
    const collapse = document.getElementById('navbarNav');
    if (!collapse) return;
    const host = ensureCanvas();
    if (!host) return;

    const updateHostHeight = () => {
      const isShown = collapse.classList.contains('show');
      host.style.height = isShown ? '220px' : '0px';
      host.style.opacity = isShown ? '1' : '0';
      if (isShown && !renderer) initThree(host);
      if (!isShown) teardown();
    };

    // Bootstrap collapse events (custom) using MutationObserver fallback
    const obs = new MutationObserver(() => updateHostHeight());
    obs.observe(collapse, { attributes: true, attributeFilter: ['class'] });
    // Initial state
    updateHostHeight();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.THREE) return; // Three.js is loaded in header
    if (isMobile()) {
      syncWithCollapse();
    }
  });
})();
