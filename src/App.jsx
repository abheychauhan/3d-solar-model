import { useEffect, useState } from "react";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap'

function App() {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loaded, setLoaded] = useState(false);

  useEffect(() => {

    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      setLoadingProgress(Math.round((itemsLoaded / itemsTotal) * 100));
    };
    manager.onLoad = () => {
      setLoaded(true);
      console.log('All textures loaded!');
    };

    // Scene Setup 
    const scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader()
      .setPath('Standard-Cube-Map/')
      .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
    const initialCameraPos = new THREE.Vector3(0, 2, 15);
    camera.position.copy(initialCameraPos);

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('.canvas'),
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = .5;
    controls.maxDistance = 20;

    // Lights
    scene.add(new THREE.PointLight(0xffffff, 100));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.1);
    dirLight.position.set(0, 0, 1);
    scene.add(dirLight);

    // Textures
   const texLoader = new THREE.TextureLoader(manager);
    const textures = {
      sun: texLoader.load('/8k_sun.jpg'),
      moon: texLoader.load('/8k_moon.jpg'),
      mercury: texLoader.load('/8k_mercury.jpg'),
      venus: texLoader.load('/8k_venus_surface.jpg'),
      earthDay: texLoader.load('/8k_earth_daymap.jpg'),
      earthNight: texLoader.load('/8k_earth_nightmap.jpg'),
      earthSpecular: texLoader.load('/8k_earth_specular_map.tif'),
      mars: texLoader.load('/8k_mars.jpg'),
      jupiter: texLoader.load('/8k_jupiter.jpg'),
      saturn: texLoader.load('/8k_saturn.jpg'),
      saturnRing: texLoader.load('/8k_saturn_ring_alpha.png'),
      uranus: texLoader.load('/2k_uranus.jpg'),
      neptune: texLoader.load('/2k_neptune.jpg'),
    };

    manager.onLoad = () => {
      setLoaded(true);

      
    // Geometries & Materials
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

    const sun = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ map: textures.sun }));
    sun.scale.setScalar(2);
    scene.add(sun);

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: textures.earthDay,
      specularMap: textures.earthSpecular,
      specular: new THREE.Color('grey'),
      shininess: 55,
      emissiveMap: textures.earthNight,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.1
    });

    const mercuryMaterial = new THREE.MeshStandardMaterial({ map: textures.mercury });
    const venusMaterial = new THREE.MeshStandardMaterial({ map: textures.venus });
    const marsMaterial = new THREE.MeshStandardMaterial({ map: textures.mars });
    const jupiterMaterial = new THREE.MeshStandardMaterial({ map: textures.jupiter });
    const moonMaterial = new THREE.MeshStandardMaterial({ map: textures.moon });
    const saturnMaterial = new THREE.MeshStandardMaterial({ map: textures.saturn });
    const uranusMaterial = new THREE.MeshStandardMaterial({ map: textures.uranus });
    const neptuneMaterial = new THREE.MeshStandardMaterial({ map: textures.neptune });


    // Saturn ring
    const saturnRingGeometry = new THREE.RingGeometry(1.2, 2, 64); // innerRadius, outerRadius, segments
    const saturnRingMaterial = new THREE.MeshBasicMaterial({
      map: textures.saturnRing,
      shadowSide: THREE.DoubleSide,
      color: 0xffddaa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);

    saturnRing.rotation.x = Math.PI / 2.5; // tilt the ring


    //Planets
    const planets = [
      { name: 'mercury', radius: 0.2, distance: 3, speed: 0.003, material: mercuryMaterial, moons: [] },
      { name: 'venus', radius: 0.3, distance: 4, speed: 0.005, material: venusMaterial, moons: [] },
      {
        name: 'earth',
        radius: 0.4,
        distance: 6,
        speed: 0.007,
        material: earthMaterial,
        moons: [{ name: 'moon', radius: 0.2, distance: 2, speed: 0.02, material: moonMaterial }]
      },
      { name: 'mars', radius: 0.4, distance: 8, speed: 0.009, material: marsMaterial, moons: [] },
      { name: 'jupiter', radius: 0.7, distance: 10, speed: 0.01, material: jupiterMaterial, moons: [] },
      { name: 'saturn', radius: 0.5, distance: 12, speed: 0.008, material: saturnMaterial, moons: [] },
      { name: 'uranus', radius: 0.3, distance: 14, speed: 0.006, material: uranusMaterial, moons: [] },
      { name: 'neptune', radius: 0.3, distance: 16, speed: 0.005, material: neptuneMaterial, moons: [] }
    ];

    // --- Create Planets & Moons ---
    const objects = [];
    const createPlanet = (planet) => {
      console.log('Creating planet:', planet.name);
      const mesh = new THREE.Mesh(sphereGeometry, planet.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.scale.setScalar(planet.radius);
      mesh.position.x = planet.distance;
      if (planet.name === 'saturn') {
        mesh.add(saturnRing);
      }
      mesh.userData = { type: 'planet', name: planet.name, planet, baseScale: planet.radius };
      objects.push(mesh);
      return mesh;
    };
    const createMoon = (moon) => {
      const mesh = new THREE.Mesh(sphereGeometry, moon.material);
      mesh.scale.setScalar(moon.radius);
      mesh.position.x = moon.distance;
      mesh.userData = { type: 'moon', name: moon.name, moon, baseScale: moon.radius };
      objects.push(mesh);
      return mesh;
    };

    const planetMeshes = planets.map((planet) => {
      const planetMesh = createPlanet(planet);
      scene.add(planetMesh);
      planet.moons.forEach((moon) => {
        const moonMesh = createMoon(moon);
        planetMesh.add(moonMesh);
      });
      return planetMesh;
    });

    // --- Raycaster for click-to-focus ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let followTarget = null;
    let rotate = true;
    window.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(objects);

      if (intersects.length > 0) {
        followTarget = intersects[0].object;
        rotate = false;
        // ✅ Just move camera closer instead of scaling the object
        const targetPos = followTarget.getWorldPosition(new THREE.Vector3());
        const radius = followTarget.userData.baseScale;
        const camOffset = new THREE.Vector3(0, radius * 1.5, radius * 5); // closer when radius is small

        const camPos = targetPos.clone().add(camOffset);
        gsap.to(camera.position, {
          duration: 2,
          x: camPos.x,
          y: camPos.y,
          z: camPos.z,
          onUpdate: () => controls.target.copy(targetPos)
        });
      } else {
        rotate = true;
        // --- Reset view ---
        followTarget = null;
        gsap.to(camera.position, {
          duration: 2,
          x: initialCameraPos.x,
          y: initialCameraPos.y,
          z: initialCameraPos.z,
          onUpdate: () => controls.target.set(0, 0, 0)
        });
      }
    });

    // Function to create orbit lines
    function createOrbit(radius) {
      const curve = new THREE.EllipseCurve(
        0, 0,            // ax, aY
        radius, radius,  // xRadius, yRadius
        0, 2 * Math.PI,  // startAngle, endAngle
        false,           // clockwise
        0                // rotation
      );

      const points = curve.getPoints(100); // Smooth circle
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineBasicMaterial({ color: 0xaaaaaa });

      const ellipse = new THREE.LineLoop(geometry, material);
      ellipse.rotation.x = Math.PI / 2; // Rotate flat on XZ plane
      return ellipse;
    }

    // Example: adding orbit paths for planets
    const mercuryOrbit = createOrbit(3);
    scene.add(mercuryOrbit);

    const venusOrbit = createOrbit(4);
    scene.add(venusOrbit);

    const earthOrbit = createOrbit(6);
    scene.add(earthOrbit);

    const marsOrbit = createOrbit(8);
    scene.add(marsOrbit);

    const jupiterOrbit = createOrbit(10);
    scene.add(jupiterOrbit);

    const saturnOrbit = createOrbit(12);
    scene.add(saturnOrbit);

    const uranusOrbit = createOrbit(14);
    scene.add(uranusOrbit);

    const neptuneOrbit = createOrbit(16);
    scene.add(neptuneOrbit);

    // --- Animate ---
    function renderLoop() {
      planetMeshes.forEach((mesh, index) => {
        mesh.rotation.y += planets[index].speed;
        // moons orbit
        mesh.children.forEach((child, moonIndex) => {
          // Only update if it's a moon
          if (planets[index].moons[moonIndex]) {
            const moonData = planets[index].moons[moonIndex];
            child.rotation.y += moonData.speed;
            child.position.x = Math.sin(child.rotation.y) * moonData.distance;
            child.position.z = Math.cos(child.rotation.y) * moonData.distance;
          }
        });


        // planet orbit
        if (rotate) {
          mesh.position.x = Math.sin(mesh.rotation.y) * planets[index].distance;
          mesh.position.z = Math.cos(mesh.rotation.y) * planets[index].distance;
        }
      });

      if (followTarget) {
        const targetPos = followTarget.getWorldPosition(new THREE.Vector3());
        controls.target.lerp(targetPos, 0.2);
      }

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(renderLoop);
    }
    renderLoop();

    // --- Resize ---
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    }
  }, [])

  return <>
    {!loaded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#000',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 10
        }}>
          Loading... {loadingProgress}%
        </div>
      )}
    <canvas className="canvas"></canvas>
  </>;
}

export default App;
