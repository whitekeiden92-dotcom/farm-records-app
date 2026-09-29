// A small animated 3D "assistant" orb -- purely visual. Exposes
// window.assistantOrb.setThinking(true/false) so education.js can
// speed up the animation while waiting for a real API response.

const orbContainer = document.getElementById('assistantOrb');

if (orbContainer && window.THREE) {
  // Defensive fallback -- learned this the hard way on the login page:
  // clientWidth/clientHeight can read 0 if measured before CSS applies.
  const width = orbContainer.clientWidth || 64;
  const height = orbContainer.clientHeight || 64;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  orbContainer.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.PointLight(0x74c69d, 1.4);
  light.position.set(2, 2, 3);
  scene.add(light);

  const coreGeo = new THREE.IcosahedronGeometry(0.9, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    emissive: 0x40916c,
    emissiveIntensity: 0.45,
    flatShading: true,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  const shellGeo = new THREE.IcosahedronGeometry(1.3, 1);
  const shellMat = new THREE.MeshBasicMaterial({
    color: 0x95d5b2,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  scene.add(shell);

  let thinking = false;
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += thinking ? 0.08 : 0.015;
    core.rotation.y += thinking ? 0.05 : 0.008;
    core.rotation.x += 0.004;
    shell.rotation.y -= thinking ? 0.035 : 0.005;
    const pulse = thinking ? 1 + Math.sin(t * 4) * 0.14 : 1 + Math.sin(t) * 0.04;
    core.scale.setScalar(pulse);
    shell.scale.setScalar(pulse * 1.05);
    renderer.render(scene, camera);
  }
  animate();

  // The only way education.js talks to this animation -- a tiny public
  // interface, rather than reaching into Three.js internals directly.
  window.assistantOrb = {
    setThinking(value) { thinking = value; },
  };

  window.addEventListener('resize', () => {
    const w = orbContainer.clientWidth || 64;
    const h = orbContainer.clientHeight || 64;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
