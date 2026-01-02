(function () {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('customDesignBG');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 6;

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffd467, 0.6);
  dir.position.set(2, 2, 5);
  scene.add(dir);

  // Gradient particles
  const particleCount = 220;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // z
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.04,
    color: 0xf7a400,
    transparent: true,
    opacity: 0.85,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Subtle wave plane
  const planeGeo = new THREE.PlaneGeometry(10, 4, 50, 20);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0xfff2cc,
    transparent: true,
    opacity: 0.18,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.position.z = -1;
  scene.add(plane);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.006;
    // wave animation
    const pos = plane.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(
        i,
        Math.sin(x * 0.45 + t) * 0.06 + Math.cos(y * 0.6 + t * 0.8) * 0.04
      );
    }
    pos.needsUpdate = true;

    // subtle particle drift
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + Math.sin(t + i * 0.02) * 0.0008;
      p.setY(i, y);
    }
    p.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function resize() {
    const parent = canvas.parentElement || document.body;
    const w = parent.clientWidth;
    const h = parent.clientHeight || 300;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);
  resize();
  animate();
})();
