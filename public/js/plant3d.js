// A small decorative 3D wheat-stalk scene for the login page. Purely
// visual flavor -- no dependencies beyond the Three.js <script> tag
// loaded in index.html before this file.

const container = document.getElementById('plant3d');

if (container) {
  const width = container.clientWidth || 320;
  const height = container.clientHeight || 160;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.4, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  // Builds one wheat stalk: a thin green stem with small golden "grain"
  // cones arranged in a spiral near the top.
  function createStalk() {
    const stalk = new THREE.Group();

    const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 2.6, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x6b8f3f });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 1.3;
    stalk.add(stem);

    const grainMat = new THREE.MeshStandardMaterial({ color: 0xd8a13a });
    for (let i = 0; i < 10; i++) {
      const grainGeo = new THREE.ConeGeometry(0.08, 0.3, 6);
      const grain = new THREE.Mesh(grainGeo, grainMat);
      const angle = (i / 10) * Math.PI * 2;
      const heightOnStalk = 2.2 + (i % 3) * 0.12;
      grain.position.set(Math.cos(angle) * 0.09, heightOnStalk, Math.sin(angle) * 0.09);
      grain.rotation.z = Math.cos(angle) * 0.3;
      grain.rotation.x = Math.sin(angle) * 0.3;
      stalk.add(grain);
    }

    return stalk;
  }

  const group = new THREE.Group();
  [-1.2, 0, 1.2].forEach((x, i) => {
    const stalk = createStalk();
    stalk.position.set(x, -1.3, 0);
    stalk.rotation.y = i * 0.6;
    stalk.scale.setScalar(i === 1 ? 1.1 : 0.9);
    group.add(stalk);
  });
  scene.add(group);

  function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += 0.004;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
