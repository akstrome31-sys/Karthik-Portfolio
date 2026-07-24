/* three-bg.js — architected 3D hero scene built natively with Three.js (no external 3D assets needed).
   A lit "test-automation network" composition: a core geometric node, orbiting satellite nodes
   connected by edges, PBR materials with real lighting/shadows for a realistic (non-flat) look.
   Degrades silently if Three.js fails to load or the user prefers reduced motion. */
(function () {
  var canvas = document.getElementById('hero-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  var container = canvas.parentElement;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.set(0, 3, 34);

  function isDark() { return document.body.classList.contains('dark-mode'); }

  // ---------- Lighting rig (what makes this read as "real" 3D vs. flat lines) ----------
  var ambient = new THREE.AmbientLight(0xffffff, isDark() ? 0.35 : 0.55);
  scene.add(ambient);

  var keyLight = new THREE.DirectionalLight(0x8fb2ff, 1.1);
  keyLight.position.set(18, 22, 20);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  var rimLight = new THREE.PointLight(0x2563eb, 2.2, 120);
  rimLight.position.set(-20, -6, 10);
  scene.add(rimLight);

  var accentLight = new THREE.PointLight(0x60a5fa, 1.4, 100);
  accentLight.position.set(10, -10, 18);
  scene.add(accentLight);

  // ---------- Core node: a rounded icosahedron "hub" with real PBR shading ----------
  var coreGeo = new THREE.IcosahedronGeometry(6.5, 2);
  var coreMat = new THREE.MeshPhysicalMaterial({
    color: isDark() ? 0x1e3a8a : 0x2563eb,
    metalness: 0.55,
    roughness: 0.25,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    transparent: true,
    opacity: 0.92
  });
  var core = new THREE.Mesh(coreGeo, coreMat);
  core.castShadow = true;
  core.receiveShadow = true;
  scene.add(core);

  var coreWireGeo = new THREE.IcosahedronGeometry(6.65, 1);
  var coreWireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.12 });
  var coreWire = new THREE.Mesh(coreWireGeo, coreWireMat);
  scene.add(coreWire);

  // ---------- Satellite nodes orbiting the hub, connected by edges (a "test architecture" graph) ----------
  var satelliteCount = 7;
  var satellites = [];
  var satGeoOptions = [
    new THREE.OctahedronGeometry(1.15, 0),
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.TetrahedronGeometry(1.35, 0),
    new THREE.TorusGeometry(0.9, 0.32, 12, 24)
  ];
  var satColor = isDark() ? 0x93c5fd : 0x3b82f6;

  var linePositions = [];
  for (var i = 0; i < satelliteCount; i++) {
    var geo = satGeoOptions[i % satGeoOptions.length];
    var mat = new THREE.MeshStandardMaterial({
      color: satColor,
      metalness: 0.4,
      roughness: 0.35,
      emissive: isDark() ? 0x1d4ed8 : 0x1e40af,
      emissiveIntensity: 0.15
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    var radius = 13 + (i % 3) * 2.4;
    var phi = Math.acos(1 - 2 * (i + 0.5) / satelliteCount);
    var theta = Math.PI * (1 + Math.sqrt(5)) * i;
    mesh.userData.baseAngle = theta;
    mesh.userData.phi = phi;
    mesh.userData.radius = radius;
    mesh.userData.speed = 0.05 + Math.random() * 0.05;
    mesh.userData.spin = 0.3 + Math.random() * 0.4;

    scene.add(mesh);
    satellites.push(mesh);
    linePositions.push(0, 0, 0, 0, 0, 0); // placeholder pair, updated each frame
  }

  var lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  var lineMat = new THREE.LineBasicMaterial({ color: satColor, transparent: true, opacity: 0.35 });
  var edgeLines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(edgeLines);

  // ---------- Ambient particle field for depth ----------
  var particleCount = 110;
  var positions = new Float32Array(particleCount * 3);
  for (var p = 0; p < particleCount; p++) {
    positions[p * 3] = (Math.random() - 0.5) * 70;
    positions[p * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[p * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
  }
  var particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var particleMat = new THREE.PointsMaterial({
    size: 0.4,
    color: isDark() ? 0x60a5fa : 0x93c5fd,
    transparent: true,
    opacity: 0.5
  });
  var particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---------- Soft ground shadow catcher (adds grounding/realism without a visible floor) ----------
  var shadowGeo = new THREE.PlaneGeometry(80, 80);
  var shadowMat = new THREE.ShadowMaterial({ opacity: isDark() ? 0.18 : 0.1 });
  var shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -14;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  function resize() {
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  var mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });

  var posAttr = lineGeo.attributes.position;
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    core.rotation.y = t * 0.08;
    core.rotation.x = Math.sin(t * 0.15) * 0.08;
    coreWire.rotation.copy(core.rotation);

    for (var i = 0; i < satellites.length; i++) {
      var s = satellites[i];
      var angle = s.userData.baseAngle + t * s.userData.speed;
      var r = s.userData.radius;
      var phi = s.userData.phi;
      var x = r * Math.sin(phi) * Math.cos(angle);
      var y = r * Math.cos(phi) * 0.55;
      var z = r * Math.sin(phi) * Math.sin(angle);
      s.position.set(x, y, z);
      s.rotation.x += 0.006 * s.userData.spin;
      s.rotation.y += 0.008 * s.userData.spin;

      posAttr.setXYZ(i * 2, 0, 0, 0);
      posAttr.setXYZ(i * 2 + 1, x, y, z);
    }
    posAttr.needsUpdate = true;

    particles.rotation.y = t * 0.015 + mouseX * 0.2;

    camera.position.x += (mouseX * 6 - camera.position.x) * 0.02;
    camera.position.y += (3 - mouseY * 3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTimeout(function () {
        var dark = isDark();
        ambient.intensity = dark ? 0.35 : 0.55;
        coreMat.color.set(dark ? 0x1e3a8a : 0x2563eb);
        particleMat.color.set(dark ? 0x60a5fa : 0x93c5fd);
        shadowMat.opacity = dark ? 0.18 : 0.1;
        var newSatColor = dark ? 0x93c5fd : 0x3b82f6;
        lineMat.color.set(newSatColor);
        for (var i = 0; i < satellites.length; i++) {
          satellites[i].material.color.set(newSatColor);
          satellites[i].material.emissive.set(dark ? 0x1d4ed8 : 0x1e40af);
        }
      }, 0);
    });
  }
})();

/* Subtle 3D tilt on the profile photo, following the cursor */
(function () {
  var wrap = document.querySelector('.hero-img-wrap');
  var img = document.querySelector('.hero-img');
  if (!wrap || !img) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  wrap.addEventListener('mousemove', function (e) {
    var rect = wrap.getBoundingClientRect();
    var px = (e.clientX - rect.left) / rect.width - 0.5;
    var py = (e.clientY - rect.top) / rect.height - 0.5;
    img.style.transform = 'rotateY(' + (px * 18) + 'deg) rotateX(' + (-py * 18) + 'deg) scale(1.04)';
  });
  wrap.addEventListener('mouseleave', function () {
    img.style.transform = '';
  });
})();
