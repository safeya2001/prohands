/**
 * Pro Hands — Three.js Interactive 3D Globe
 * ==========================================
 * Creates a real-time WebGL globe with:
 *  - Canvas-generated texture (ocean + land masses)
 *  - Mouse-parallax tilt (up to 20°)
 *  - Auto-rotation
 *  - Orbit rings + animated dot
 *  - Atmosphere glow
 *  - Star field
 *  - Responsive sizing
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Wait for THREE to be available then boot
  ------------------------------------------------------------------ */
  function waitForThree(cb, tries) {
    tries = tries || 0;
    if (typeof THREE !== 'undefined') { cb(); return; }
    if (tries > 30) return; // give up after ~3 s
    setTimeout(function () { waitForThree(cb, tries + 1); }, 100);
  }

  /* ------------------------------------------------------------------
     Globe Object
  ------------------------------------------------------------------ */
  var Globe = {

    scene:       null,
    camera:      null,
    renderer:    null,
    globe:       null,
    wireframe:   null,
    atmosphere:  null,
    ring1:       null,
    ring2:       null,
    orbitDot:    null,
    clock:       null,
    canvas:      null,
    container:   null,
    raf:         null,

    mouse:       { x: 0, y: 0 },
    target:      { x: 0.08, y: 0 },
    current:     { x: 0.08, y: 0 },

    /* ----------------------------------------------------------------
       INIT
    ---------------------------------------------------------------- */
    init: function () {
      this.canvas    = document.getElementById('globeCanvas');
      this.container = document.querySelector('.globe-3d-container');
      if (!this.canvas) return;

      /* Hide CSS fallback once WebGL is confirmed */
      try {
        this.setupScene();
        this.setupLights();
        this.buildGlobe();
        this.buildAtmosphere();
        this.buildRings();
        this.buildStars();
        this.bindEvents();
        this.resize();
        this.animate();

        /* Hide pure-CSS fallback */
        var fallback = document.querySelector('.globe-3d--fallback');
        if (fallback) fallback.style.display = 'none';
        this.canvas.style.opacity = '1';

      } catch (e) {
        /* WebGL unavailable — CSS fallback stays visible */
        this.canvas.style.display = 'none';
        console.warn('Pro Hands Globe: WebGL unavailable, using CSS fallback.', e);
      }
    },

    /* ----------------------------------------------------------------
       SCENE
    ---------------------------------------------------------------- */
    setupScene: function () {
      this.scene  = new THREE.Scene();
      this.clock  = new THREE.Clock();

      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      this.camera.position.z = 2.9;

      this.renderer = new THREE.WebGLRenderer({
        canvas:           this.canvas,
        alpha:            true,
        antialias:        true,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);
    },

    /* ----------------------------------------------------------------
       LIGHTS
    ---------------------------------------------------------------- */
    setupLights: function () {
      /* Soft ambient */
      var ambient = new THREE.AmbientLight(0x3a5578, 1.0);
      this.scene.add(ambient);

      /* Main directional — sun from upper-left */
      var sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(3, 4, 4);
      this.scene.add(sun);

      /* Brand yellow accent */
      var yellow = new THREE.PointLight(0xF5C518, 0.7, 10);
      yellow.position.set(-3, 2, 2);
      this.scene.add(yellow);

      /* Teal fill */
      var teal = new THREE.PointLight(0x3DBFB8, 0.45, 8);
      teal.position.set(2, -2, 1);
      this.scene.add(teal);
    },

    /* ----------------------------------------------------------------
       GLOBE SPHERE — canvas-generated texture
    ---------------------------------------------------------------- */
    buildGlobe: function () {
      /* ---- Texture ---- */
      var tc  = document.createElement('canvas');
      tc.width  = 1024;
      tc.height = 512;
      var ctx = tc.getContext('2d');

      /* Ocean gradient */
      var oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
      oceanGrad.addColorStop(0,   '#12304e');
      oceanGrad.addColorStop(0.5, '#1a4a70');
      oceanGrad.addColorStop(1,   '#0d2035');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 1024, 512);

      /* Land masses — simplified continental shapes */
      var landColor  = '#2D7A4F';
      var lightGreen = '#3E9E67';
      var darkGreen  = '#1a5235';

      function blob(cx, cy, rx, ry, rot, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha || 1;
        ctx.translate(cx, cy);
        ctx.rotate(rot || 0);
        ctx.scale(rx / 80, ry / 80);
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.restore();
      }

      /* Helper to paint a roughly-shaped continent blob */
      function continent(x, y, w, h, color, angle) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, angle || 0, 0, Math.PI * 2);
        ctx.fill();
      }

      /* North America */
      continent(135, 100, 80, 70, landColor, -0.3);
      continent(120, 130, 55, 50, lightGreen, -0.2);
      continent(155, 85,  40, 30, darkGreen,  0.1);

      /* South America */
      continent(195, 260, 45, 80, landColor,  0.15);
      continent(185, 290, 35, 55, lightGreen, 0.1);

      /* Europe */
      continent(380, 95, 45, 40, landColor,  0.2);
      continent(400, 80, 30, 25, lightGreen, 0.1);

      /* Africa */
      continent(400, 210, 55, 90, landColor,  0.05);
      continent(390, 200, 40, 65, lightGreen, 0);
      continent(415, 260, 30, 40, darkGreen,  0.1);

      /* Asia */
      continent(560, 100, 130, 80, landColor,  0.1);
      continent(590, 90,  100, 60, lightGreen, 0.05);
      continent(620, 130, 60, 40, darkGreen,  0.2);

      /* India */
      continent(545, 195, 35, 55, landColor, 0.05);

      /* Australia */
      continent(720, 310, 55, 40, landColor, 0.15);
      continent(715, 305, 40, 30, lightGreen, 0.1);

      /* Japan / SE Asia islands */
      continent(680, 145, 20, 15, lightGreen, 0.3);
      continent(700, 160, 15, 12, landColor, 0.1);

      /* Lat/Lon grid */
      ctx.strokeStyle = 'rgba(255,255,255,0.055)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx < 1024; gx += 1024 / 12) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 512); ctx.stroke();
      }
      for (var gy = 0; gy < 512; gy += 512 / 6) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(1024, gy); ctx.stroke();
      }

      /* City dots */
      var cities = [
        [386, 135], [360, 110], [435, 95], [550, 140],
        [680, 155], [200, 120], [720, 315], [415, 225]
      ];
      ctx.fillStyle = 'rgba(245,197,24,0.7)';
      cities.forEach(function (c) {
        ctx.beginPath();
        ctx.arc(c[0], c[1], 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      var texture = new THREE.CanvasTexture(tc);

      /* ---- Mesh ---- */
      var geo = new THREE.SphereGeometry(1, 64, 64);
      var mat = new THREE.MeshPhongMaterial({
        map:               texture,
        specular:          new THREE.Color(0x3DBFB8),
        shininess:         22,
        emissive:          new THREE.Color(0x0a1a10),
        emissiveIntensity: 0.15
      });
      this.globe = new THREE.Mesh(geo, mat);
      this.scene.add(this.globe);

      /* ---- Wireframe overlay ---- */
      var wGeo = new THREE.SphereGeometry(1.005, 18, 18);
      var wMat = new THREE.MeshBasicMaterial({
        color:       0xffffff,
        wireframe:   true,
        transparent: true,
        opacity:     0.04
      });
      this.wireframe = new THREE.Mesh(wGeo, wMat);
      this.globe.add(this.wireframe);
    },

    /* ----------------------------------------------------------------
       ATMOSPHERE GLOW
    ---------------------------------------------------------------- */
    buildAtmosphere: function () {
      var geo = new THREE.SphereGeometry(1.20, 32, 32);
      var mat = new THREE.MeshBasicMaterial({
        color:       0x3DBFB8,
        transparent: true,
        opacity:     0.065,
        side:        THREE.BackSide
      });
      this.atmosphere = new THREE.Mesh(geo, mat);
      this.scene.add(this.atmosphere);

      /* Inner rim */
      var rimGeo = new THREE.SphereGeometry(1.06, 32, 32);
      var rimMat = new THREE.MeshBasicMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     0.025,
        side:        THREE.BackSide
      });
      this.scene.add(new THREE.Mesh(rimGeo, rimMat));
    },

    /* ----------------------------------------------------------------
       ORBIT RINGS
    ---------------------------------------------------------------- */
    buildRings: function () {
      /* Yellow ring */
      var r1Geo = new THREE.TorusGeometry(1.42, 0.013, 8, 160);
      var r1Mat = new THREE.MeshBasicMaterial({
        color:       0xF5C518,
        transparent: true,
        opacity:     0.50
      });
      this.ring1 = new THREE.Mesh(r1Geo, r1Mat);
      this.ring1.rotation.x = Math.PI / 2.2;
      this.ring1.rotation.z = 0.35;
      this.scene.add(this.ring1);

      /* Teal ring */
      var r2Geo = new THREE.TorusGeometry(1.58, 0.008, 8, 160);
      var r2Mat = new THREE.MeshBasicMaterial({
        color:       0x3DBFB8,
        transparent: true,
        opacity:     0.22
      });
      this.ring2 = new THREE.Mesh(r2Geo, r2Mat);
      this.ring2.rotation.x = Math.PI / 1.75;
      this.ring2.rotation.z = -0.55;
      this.scene.add(this.ring2);

      /* Orbiting dot on ring 1 */
      var dotGeo = new THREE.SphereGeometry(0.045, 10, 10);
      var dotMat = new THREE.MeshBasicMaterial({ color: 0xF5C518 });
      this.orbitDot = new THREE.Mesh(dotGeo, dotMat);
      this.scene.add(this.orbitDot);

      /* Small teal dot on ring 2 */
      var dot2Geo = new THREE.SphereGeometry(0.03, 8, 8);
      var dot2Mat = new THREE.MeshBasicMaterial({ color: 0x3DBFB8 });
      this.orbitDot2 = new THREE.Mesh(dot2Geo, dot2Mat);
      this.scene.add(this.orbitDot2);
    },

    /* ----------------------------------------------------------------
       STAR FIELD
    ---------------------------------------------------------------- */
    buildStars: function () {
      var count     = 280;
      var positions = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        var theta = Math.random() * Math.PI * 2;
        var phi   = Math.acos(2 * Math.random() - 1);
        var r     = 3.8 + Math.random() * 2;
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi);
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var mat = new THREE.PointsMaterial({
        color:       0xffffff,
        size:        0.022,
        transparent: true,
        opacity:     0.55
      });
      this.scene.add(new THREE.Points(geo, mat));
    },

    /* ----------------------------------------------------------------
       EVENTS
    ---------------------------------------------------------------- */
    bindEvents: function () {
      var self   = this;
      var heroEl = document.getElementById('hero');

      /* Mouse parallax — tilt up to 20° */
      if (heroEl) {
        heroEl.addEventListener('mousemove', function (e) {
          var rect = heroEl.getBoundingClientRect();
          var nx   = (e.clientX - rect.left) / rect.width  - 0.5;
          var ny   = (e.clientY - rect.top)  / rect.height - 0.5;
          self.target.x =  ny * 0.7;
          self.target.y =  nx * 0.7;
        });
        heroEl.addEventListener('mouseleave', function () {
          self.target.x = 0.08;
          self.target.y = 0;
        });
      }

      /* Touch */
      document.addEventListener('touchmove', function (e) {
        if (e.touches.length > 0) {
          self.target.x = (e.touches[0].clientY / window.innerHeight - 0.5) * 0.35;
          self.target.y = (e.touches[0].clientX / window.innerWidth  - 0.5) * 0.35;
        }
      }, { passive: true });

      window.addEventListener('resize', function () { self.resize(); });
    },

    /* ----------------------------------------------------------------
       RESIZE
    ---------------------------------------------------------------- */
    resize: function () {
      var wrap = this.container || (this.canvas && this.canvas.parentElement);
      if (!wrap || !this.renderer) return;
      var size = Math.min(wrap.clientWidth || 360, 440);
      this.renderer.setSize(size, size);
      this.camera.updateProjectionMatrix();
    },

    /* ----------------------------------------------------------------
       ANIMATE
    ---------------------------------------------------------------- */
    animate: function () {
      var self = this;
      this.raf = requestAnimationFrame(function () { self.animate(); });

      var t = this.clock.getElapsedTime();

      /* Lerp toward target */
      this.current.x += (this.target.x - this.current.x) * 0.035;
      this.current.y += (this.target.y - this.current.y) * 0.035;

      /* Globe: auto-rotate + mouse tilt */
      if (this.globe) {
        this.globe.rotation.y = t * 0.12 + this.current.y;
        this.globe.rotation.x = this.current.x;
      }

      /* Rings gentle wobble */
      if (this.ring1) {
        this.ring1.rotation.y = t * 0.30;
      }
      if (this.ring2) {
        this.ring2.rotation.y = -t * 0.18;
      }

      /* Orbit dots */
      if (this.orbitDot) {
        var a1 = t * 0.9;
        var r1 = 1.42;
        var tx1 = Math.PI / 2.2, tz1 = 0.35;
        this.orbitDot.position.x =  r1 * Math.cos(a1);
        this.orbitDot.position.y =  r1 * Math.sin(a1) * Math.cos(tx1) * Math.cos(tz1);
        this.orbitDot.position.z = -r1 * Math.sin(a1) * Math.sin(tx1);
      }
      if (this.orbitDot2) {
        var a2 = -t * 0.55 + 1.2;
        var r2 = 1.58;
        var tx2 = Math.PI / 1.75, tz2 = -0.55;
        this.orbitDot2.position.x =  r2 * Math.cos(a2);
        this.orbitDot2.position.y =  r2 * Math.sin(a2) * Math.cos(tx2) * Math.cos(tz2);
        this.orbitDot2.position.z = -r2 * Math.sin(a2) * Math.sin(tx2);
      }

      /* Atmosphere breathe */
      if (this.atmosphere) {
        var pulse = 1 + Math.sin(t * 0.7) * 0.007;
        this.atmosphere.scale.setScalar(pulse);
      }

      this.renderer.render(this.scene, this.camera);
    }
  };

  /* Boot */
  waitForThree(function () {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { Globe.init(); });
    } else {
      Globe.init();
    }
  });

})();
