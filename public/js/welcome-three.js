(function () {
  if (window.__welcomeThreeInit) {
    return;
  }
  var banner = document.querySelector('.welcome-banner');
  var container = document.getElementById('welcome-bg');
  if (!banner || !container || typeof THREE === 'undefined') {
    return;
  }

  // Respect reduced motion
  try {
    var media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media && media.matches) {
      return;
    }
  } catch (e) {}

  var width = container.clientWidth || banner.clientWidth || window.innerWidth;
  var height = container.clientHeight || banner.clientHeight || 80;

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  // Orthographic camera mapping to banner pixel-like units
  var camera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    -1000,
    1000
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // Wireframe bordered cubes
  var cubes = [];
  var cubeCount = Math.max(14, Math.floor(width / 70)); // scale with width
  var boxGeoSmall = new THREE.BoxGeometry(16, 16, 16);
  var boxGeoLarge = new THREE.BoxGeometry(24, 24, 24);
  function makeCube() {
    var geo = Math.random() < 0.5 ? boxGeoSmall : boxGeoLarge;
    var mat = new THREE.MeshBasicMaterial({
      color: 0xf7a400,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = (Math.random() - 0.5) * width;
    mesh.position.y = (Math.random() - 0.3) * height; // slightly biased lower
    mesh.position.z = (Math.random() - 0.5) * 40;
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.userData.vx = (Math.random() - 0.5) * 0.15; // subtle drift
    mesh.userData.vy = 0.18 + Math.random() * 0.25; // rise speed
    mesh.userData.vrx = (Math.random() - 0.5) * 0.01;
    mesh.userData.vry = (Math.random() - 0.5) * 0.012;
    scene.add(mesh);
    cubes.push(mesh);
  }
  for (var i = 0; i < cubeCount; i++) makeCube();

  // Resize handling bound to banner size
  function onResize() {
    if (!banner || !container) return;
    var w = container.clientWidth || banner.clientWidth || window.innerWidth;
    var h = banner.clientHeight || container.clientHeight || 80;
    width = w;
    height = h;
    renderer.setSize(w, h);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // Mild parallax on mouse inside banner
  var mx = 0,
    my = 0;
  window.addEventListener(
    'mousemove',
    function (e) {
      if (!banner) return;
      var rect = banner.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;
      mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    },
    { passive: true }
  );

  var raf = 0;
  function animate() {
    if (!banner || !document.body.contains(banner)) {
      cleanup();
      return;
    }

    for (var i = 0; i < cubes.length; i++) {
      var c = cubes[i];
      c.position.x += c.userData.vx + mx * 0.05;
      c.position.y += c.userData.vy - my * 0.05;
      c.rotation.x += c.userData.vrx;
      c.rotation.y += c.userData.vry;

      // Wrap around bounds
      if (c.position.y > height / 2 + 30) {
        c.position.y = -height / 2 - 30 - Math.random() * 20;
        c.position.x = (Math.random() - 0.5) * width;
      }
      if (c.position.x < -width / 2 - 40) c.position.x = width / 2 + 40;
      if (c.position.x > width / 2 + 40) c.position.x = -width / 2 - 40;
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  // Observe removal of banner to cleanup
  var mo;
  try {
    mo = new MutationObserver(function () {
      if (!document.body.contains(banner)) {
        cleanup();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  function cleanup() {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    try {
      if (mo) mo.disconnect();
    } catch (e) {}
    try {
      cubes.forEach(function (c) {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      renderer.dispose();
    } catch (e) {}
    try {
      if (renderer.domElement && renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    } catch (e) {}
    window.__welcomeThreeInit = false;
  }

  onResize();
  animate();
  window.__welcomeThreeInit = true;
})();
