import { useEffect, useRef } from "react";
import * as THREE from "three";

interface BubbleData {
  speed: number;
  drift: number;
  phase: number;
  baseX: number;
  baseZ: number;
}

function makeBranch(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius * 0.55, radius, length, 10);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function makeBubbleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(46, 40, 8, 64, 64, 56);
  gradient.addColorStop(0, "rgba(255,255,255,0.88)");
  gradient.addColorStop(0.45, "rgba(181,232,202,0.42)");
  gradient.addColorStop(1, "rgba(0,232,135,0.06)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,232,135,0.55)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "rgba(224,240,224,0.92)";
  ctx.font = "700 25px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CO2", 64, 65);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function EcoTreeScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.45, 7.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const tree = new THREE.Group();
    scene.add(tree);

    const ambient = new THREE.AmbientLight(0xbce8c9, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x00e887, 3, 9);
    rimLight.position.set(-2.6, 1.2, 2.8);
    scene.add(rimLight);

    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a4f2b,
      roughness: 0.72,
      metalness: 0.05,
    });
    const leafMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x00e887, roughness: 0.54 }),
      new THREE.MeshStandardMaterial({ color: 0x68d391, roughness: 0.58 }),
      new THREE.MeshStandardMaterial({ color: 0x1dbf73, roughness: 0.5 }),
    ];

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.5, 18), trunkMaterial);
    trunk.position.y = -1.12;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    [
      [new THREE.Vector3(0, -0.28, 0), new THREE.Vector3(-0.82, 0.62, 0.04), 0.1],
      [new THREE.Vector3(0, -0.08, 0), new THREE.Vector3(0.82, 0.74, -0.08), 0.1],
      [new THREE.Vector3(0, 0.16, 0), new THREE.Vector3(-0.45, 1.18, -0.15), 0.08],
      [new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(0.4, 1.22, 0.14), 0.08],
    ].forEach(([start, end, radius]) => tree.add(makeBranch(start as THREE.Vector3, end as THREE.Vector3, radius as number, trunkMaterial)));

    const canopy = new THREE.Group();
    const leafPositions: Array<[number, number, number, number, number]> = [
      [-0.82, 1.05, 0.04, 0.78, 0],
      [0.78, 1.08, -0.02, 0.82, 1],
      [-0.2, 1.55, 0.04, 0.96, 2],
      [0.24, 1.72, -0.24, 0.72, 0],
      [-0.56, 1.82, -0.2, 0.66, 1],
      [0.56, 1.78, 0.18, 0.68, 2],
      [0, 2.18, 0, 0.7, 0],
    ];

    leafPositions.forEach(([x, y, z, scale, matIndex]) => {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(scale, 2), leafMaterials[matIndex]);
      leaf.position.set(x, y, z);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      canopy.add(leaf);
    });
    tree.add(canopy);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x09240f,
      roughness: 0.9,
      transparent: true,
      opacity: 0.86,
    });
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.9, 0.22, 64), groundMaterial);
    ground.position.y = -2.44;
    ground.receiveShadow = true;
    scene.add(ground);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.02, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x00e887, transparent: true, opacity: 0.45 })
    );
    ring.position.y = -2.28;
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const bubbleTexture = makeBubbleTexture();
    const bubbles: THREE.Sprite[] = [];
    if (bubbleTexture) {
      for (let i = 0; i < 15; i++) {
        const material = new THREE.SpriteMaterial({
          map: bubbleTexture,
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
        });
        const bubble = new THREE.Sprite(material);
        const angle = (Math.PI * 2 * i) / 15;
        const radius = 1.55 + Math.random() * 0.9;
        bubble.position.set(Math.cos(angle) * radius, -2.1 + Math.random() * 3.2, Math.sin(angle) * 0.45);
        bubble.scale.setScalar(0.34 + Math.random() * 0.16);
        bubble.userData = {
          speed: 0.17 + Math.random() * 0.2,
          drift: 0.06 + Math.random() * 0.07,
          phase: Math.random() * Math.PI * 2,
          baseX: bubble.position.x,
          baseZ: bubble.position.z,
        } satisfies BubbleData;
        bubbles.push(bubble);
        scene.add(bubble);
      }
    }

    const pointer = new THREE.Vector2(0, 0);
    const handlePointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    host.addEventListener("pointermove", handlePointerMove);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 720 ? 8.8 : 7.4;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const clock = new THREE.Clock();
    let animationId = 0;

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      if (!prefersReducedMotion) {
        tree.rotation.y = Math.sin(elapsed * 0.24) * 0.16 + pointer.x * 0.08;
        canopy.children.forEach((leaf, index) => {
          const mesh = leaf as THREE.Mesh;
          const pulse = 1 + Math.sin(elapsed * 1.4 + index) * 0.025;
          mesh.scale.setScalar(pulse);
          mesh.rotation.y += delta * (0.08 + index * 0.01);
        });
        ring.rotation.z += delta * 0.14;

        bubbles.forEach((bubble) => {
          const data = bubble.userData as BubbleData;
          bubble.position.y += data.speed * delta;
          bubble.position.x = data.baseX + Math.sin(elapsed + data.phase) * data.drift;
          bubble.position.z = data.baseZ + Math.cos(elapsed * 0.8 + data.phase) * data.drift;

          if (bubble.position.y > 2.72) {
            bubble.position.y = -2.15;
            data.baseX = (Math.random() - 0.5) * 3.8;
          }

          const progress = (bubble.position.y + 2.15) / 4.87;
          (bubble.material as THREE.SpriteMaterial).opacity = Math.sin(progress * Math.PI) * 0.7;
        });
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      host.removeEventListener("pointermove", handlePointerMove);
      ro.disconnect();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
        if (object instanceof THREE.Sprite) {
          object.material.dispose();
        }
      });
      bubbleTexture?.dispose();
      trunkMaterial.dispose();
      leafMaterials.forEach((material) => material.dispose());
      groundMaterial.dispose();
    };
  }, []);

  return <div ref={hostRef} className="eco-tree-scene" aria-hidden="true" />;
}
