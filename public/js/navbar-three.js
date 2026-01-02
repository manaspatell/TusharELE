(function () {
  if (window.__navbarThreeInit) {
    return;
  }
  // Guard: ensure THREE and navbar container exist
  var container = document.getElementById('navbar-bg');
  if (!container || typeof THREE === 'undefined') {
    return;
  }

  // Respect reduced motion
  try {
    var media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media && media.matches) {
      return;
    }
  } catch (e) {}

  var nav = container.closest('nav');
  var width = (nav && nav.clientWidth) || window.innerWidth;
  var height = (nav && nav.clientHeight) || 72; // typical navbar height

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0); // transparent
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  // Orthographic camera to map directly to navbar dimensions
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

  // Background grid
  var gridDiv = Math.max(12, Math.floor(width / 70));
  // Use brand orange (not yellow)
  var BRAND_ORANGE = 0xff7a00;
  var grid = new THREE.GridHelper(
    width * 1.3,
    gridDiv,
    BRAND_ORANGE,
    BRAND_ORANGE
  );
  try {
    if (Array.isArray(grid.material)) {
      grid.material.forEach(function (m) {
        m.transparent = true;
        m.opacity = 0.14;
      });
    } else {
      grid.material.transparent = true;
      grid.material.opacity = 0.14;
    }
  } catch (e) {}
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -40;
  scene.add(grid);

  // Wireframe cubes (opaque, solid orange) with simple separation to reduce overlap
  var cubes = [];
  // Slightly reduce density to lower chances of overlap
  var cubeCount = Math.max(10, Math.floor(width / 110));
  var geoSmall = new THREE.BoxGeometry(18, 18, 18);
  var geoLarge = new THREE.BoxGeometry(22, 22, 22);
  function makeCube() {
    var geo = Math.random() < 0.5 ? geoSmall : geoLarge;
    var mat = new THREE.MeshBasicMaterial({
      color: BRAND_ORANGE,
      wireframe: true,
      transparent: false,
      opacity: 1.0,
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Try to spawn with spacing from existing cubes
    var size = geo === geoSmall ? 18 : 22;
    var attempts = 0;
    var placed = false;
    while (!placed && attempts < 25) {
      mesh.position.x = (Math.random() - 0.5) * width;
      mesh.position.y = (Math.random() - 0.3) * height;
      placed = true;
      for (var k = 0; k < cubes.length; k++) {
        var other = cubes[k];
        var dx0 = mesh.position.x - other.position.x;
        var dy0 = mesh.position.y - other.position.y;
        var d2 = dx0 * dx0 + dy0 * dy0;
        var minSep =
          (size + ((other.userData && other.userData.size) || 20)) * 0.55; // rough spacing
        if (d2 < minSep * minSep) {
          placed = false;
          break;
        }
      }
      attempts++;
    }
    mesh.position.z = (Math.random() - 0.5) * 40;
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.userData.vx = (Math.random() - 0.5) * 0.12;
    mesh.userData.vy = 0.14 + Math.random() * 0.22;
    mesh.userData.vrx = (Math.random() - 0.5) * 0.01;
    mesh.userData.vry = (Math.random() - 0.5) * 0.012;
    mesh.userData.size = size;
    mesh.userData.mat = mat;
    scene.add(mesh);
    cubes.push(mesh);
  }
  for (var i = 0; i < cubeCount; i++) makeCube();

  // Resize handler (responsive)
  function onResize() {
    var w = (nav && nav.clientWidth) || window.innerWidth;
    var h = (nav && nav.clientHeight) || 72;
    width = w;
    height = h;
    renderer.setSize(w, h);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    // update grid
    try {
      scene.remove(grid);
      grid.geometry.dispose();
    } catch (e) {}
    gridDiv = Math.max(12, Math.floor(w / 70));
    grid = new THREE.GridHelper(w * 1.3, gridDiv, BRAND_ORANGE, BRAND_ORANGE);
    try {
      if (Array.isArray(grid.material)) {
        grid.material.forEach(function (m) {
          m.transparent = true;
          m.opacity = 0.12;
        });
      } else {
        grid.material.transparent = true;
        grid.material.opacity = 0.12;
      }
    } catch (e) {}
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -40;
    scene.add(grid);
  }
  window.addEventListener('resize', onResize);

  // Cursor reaction removed: keep static animation without mouse parallax
  var mx = 0,
    my = 0;

  // Animation loop
  // Pulse between two close oranges to avoid yellow hue
  var t = 0;
  function animate() {
    t += 0.01;

    // gentle camera roll for dynamism
    camera.rotation.z = Math.sin(t * 0.45) * 0.015;

    for (var i = 0; i < cubes.length; i++) {
      var c = cubes[i];
      c.position.x += c.userData.vx; // no mouse parallax
      c.position.y += c.userData.vy; // no mouse parallax
      c.rotation.x += c.userData.vrx;
      c.rotation.y += c.userData.vry;

      // Wrap within narrow navbar bounds
      if (c.position.y > height / 2 + 24) {
        c.position.y = -height / 2 - 24 - Math.random() * 10;
        c.position.x = (Math.random() - 0.5) * width;
      }
      if (c.position.x < -width / 2 - 40) c.position.x = width / 2 + 40;
      if (c.position.x > width / 2 + 40) c.position.x = -width / 2 - 40;
    }

    // Simple pairwise separation to reduce visible collisions (small N so OK)
    for (var a = 0; a < cubes.length; a++) {
      for (var b = a + 1; b < cubes.length; b++) {
        var A = cubes[a],
          B = cubes[b];
        var dx = B.position.x - A.position.x;
        var dy = B.position.y - A.position.y;
        var dist2 = dx * dx + dy * dy;
        var minDist =
          ((A.userData.size || 20) + (B.userData.size || 20)) * 0.55;
        if (dist2 > 0 && dist2 < minDist * minDist) {
          var dist = Math.sqrt(dist2);
          var overlap = (minDist - dist) * 0.5;
          var nx = dx / dist;
          var ny = dy / dist;
          // push apart slightly
          A.position.x -= nx * overlap;
          A.position.y -= ny * overlap;
          B.position.x += nx * overlap;
          B.position.y += ny * overlap;
        }
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // Start
  onResize();
  animate();
  window.__navbarThreeInit = true;
})();
