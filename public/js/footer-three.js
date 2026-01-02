(function () {
  if (window.__footerThreeInit) {
    return;
  }
  // Guard: ensure THREE and footer container exist
  var container = document.getElementById('footer-bg');
  if (!container || typeof THREE === 'undefined') {
    return;
  }

  var width = container.clientWidth || window.innerWidth;
  var height = container.clientHeight || 240; // footer typical height

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0); // transparent
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 0, 60);

  // Gradient-like background using particles
  var particleCount = 140;
  var geometry = new THREE.BufferGeometry();
  var positions = new Float32Array(particleCount * 3);
  var speeds = new Float32Array(particleCount);
  var velocities = new Float32Array(particleCount * 2); // vx, vy per particle for interaction

  for (var i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 160; // x
    positions[i * 3 + 1] = (Math.random() - 0.2) * 80; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40; // z
    speeds[i] = 0.15 + Math.random() * 0.45;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  var material = new THREE.PointsMaterial({
    color: 0xf7a400,
    size: 1.8,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthTest: false,
  });

  var points = new THREE.Points(geometry, material);
  scene.add(points);

  // Subtle vignette plane
  var planeGeo = new THREE.PlaneGeometry(200, 100);
  var planeMat = new THREE.MeshBasicMaterial({
    color: 0x0d1a29,
    transparent: true,
    opacity: 0.04,
  });
  var plane = new THREE.Mesh(planeGeo, planeMat);
  plane.position.z = -10;
  scene.add(plane);

  // Resize handler
  function onResize() {
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight || 240;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // Mouse tracking within footer bounds (store normalized coords)
  var mx = 0,
    my = 0,
    cursorInside = false;
  window.addEventListener(
    'mousemove',
    function (e) {
      var rect = container.getBoundingClientRect();
      cursorInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (cursorInside) {
        mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }
    },
    { passive: true }
  );

  // Animation
  var t = 0;
  function animate() {
    t += 0.006;
    // gentle parallax + mild cursor influence
    camera.position.x +=
      (Math.sin(t * 0.6) * 2.2 + mx * 2.2 - camera.position.x) * 0.08;
    camera.position.y +=
      (Math.cos(t * 0.4) * 1.4 - my * 1.6 - camera.position.y) * 0.08;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // compute cursor world point on z=0 plane for repulsion
    var cx = null,
      cy = null;
    if (cursorInside) {
      var ndcX = mx;
      var ndcY = -my; // flip Y for NDC
      var vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      var dir = vec.sub(camera.position).normalize();
      var tz = -camera.position.z / dir.z; // intersection with z=0
      cx = camera.position.x + dir.x * tz;
      cy = camera.position.y + dir.y * tz;
    }

    // move particles upward, apply repulsion, and wrap
    var pos = geometry.attributes.position.array;
    var radius = 18,
      r2 = radius * radius,
      strength = 1.2,
      damp = 0.9;
    for (var i = 0; i < particleCount; i++) {
      var ix = i * 3,
        iv = i * 2;
      // upward drift
      pos[ix + 1] += speeds[i] * 0.2;
      // repulsion within radius
      if (cx !== null && cy !== null) {
        var dx = pos[ix + 0] - cx;
        var dy = pos[ix + 1] - cy;
        var d2 = dx * dx + dy * dy;
        if (d2 < r2) {
          var d = Math.sqrt(Math.max(d2, 1e-4));
          var f = strength * (1 - d / radius);
          velocities[iv + 0] += (dx / d) * f;
          velocities[iv + 1] += (dy / d) * f;
        }
      }
      // apply velocity + damping
      pos[ix + 0] += velocities[iv + 0];
      pos[ix + 1] += velocities[iv + 1];
      velocities[iv + 0] *= damp;
      velocities[iv + 1] *= damp;
      // wrap vertically
      if (pos[ix + 1] > 50) {
        pos[ix + 1] = -50 - Math.random() * 10;
        pos[ix + 0] = (Math.random() - 0.5) * 160;
        pos[ix + 2] = (Math.random() - 0.5) * 40;
        velocities[iv + 0] = 0;
        velocities[iv + 1] = 0;
      }
      // soft horizontal bounds
      if (pos[ix + 0] < -85) {
        pos[ix + 0] = -85;
        velocities[iv + 0] *= -0.4;
      }
      if (pos[ix + 0] > 85) {
        pos[ix + 0] = 85;
        velocities[iv + 0] *= -0.4;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // Start
  onResize();
  animate();
  window.__footerThreeInit = true;

  // Respect reduced motion
  try {
    var media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media && media.matches) {
      speeds.fill(0); // static scene
      for (var i = 0; i < velocities.length; i++) {
        velocities[i] = 0;
      }
    }
  } catch (e) {}
})();
