import {
  PerspectiveCamera,
  Scene,
  DirectionalLight,
  AmbientLight,
  sRGBEncoding,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three-orbitcontrols";
import { SimplexNoise } from "three-simplexnoise";
import Terrain from "three-terrain";

const camera = new PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-32, 50, -32);
const renderer = new WebGLRenderer({ antialias: true });
renderer.encoding = sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("renderer").appendChild(renderer.domElement);
window.addEventListener(
  "resize",
  () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  },
  false
);
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.enableDamping = true;

let colormap;
const generator = ({ maps, mesher }) => {
  const noise = new SimplexNoise();
  const scaleX = (0.5 + Math.abs(noise.noise(-1, 0)) * 0.5) * 0.002;
  const scaleY = 0.25 + Math.abs(noise.noise(-2, 0)) * 0.025;
  const scaleZ = (0.5 + Math.abs(noise.noise(-3, 0)) * 0.5) * 0.002;
  for (let i = 0, z = 0; z < mesher.depth; z++) {
    for (let x = 0; x < mesher.width; x++, i++) {
      maps.height.image.data[i] =
        Math.abs(noise.noise(x * scaleX, z * scaleZ)) * scaleY;
    }
  }

  if (!colormap) {
    colormap = new Uint8Array(maps.color.image.data);
  } else {
    maps.color.image.data.set(colormap);
  }

  const s = 164;
  for (let bz = s * 1.5; bz < mesher.depth - s * 2; bz += s) {
    for (let bx = s * 2; bx < mesher.width - s * 2; bx += s) {
      if (Math.random() > 0.7) {
        continue;
      }
      const m = Math.floor(s * (0.1 + Math.random() * 0.25) * 0.5) * 2;
      const h = 0.125 + Math.random() * 2.8;
      const r = Math.random() * 0x99;
      const g = Math.random() * 0x99;
      const b = Math.random() * 0xaa;
      const r2 = Math.random() * 0xaa;
      const g2 = Math.random() * 0xaa;
      const b2 = Math.random() * 0x99;
      const bs = s - m;
      const rm = Math.floor((bs - m) * (0.1 + Math.random() * 0.2));
      const o = s * 0.5;
      const t = Math.floor(Math.random() * 2);
      for (let z = m; z < bs; z++) {
        for (let x = m; x < bs; x++) {
          if (
            t === 1 &&
            Math.sqrt((o - x) ** 2 + (o - z) ** 2) > (bs - m + rm) * 0.5
          ) {
            continue;
          }
          const i = (bz + z) * mesher.width + (bx + x);
          const n = 0.95 + Math.random() * 0.05;
          const c = (x + z) % 3 === 1;
          const ci = i * 3;
          maps.color.image.data.set(
            [
              maps.color.image.data[ci] * 0.2 + (c ? r : r2) * n,
              maps.color.image.data[ci + 1] * 0.2 + (c ? g : g2) * n,
              maps.color.image.data[ci + 2] * 0.2 + (c ? b : b2) * n,
            ],
            ci
          );
          maps.height.image.data[i] =
            h -
            (z < m + rm || z > bs - rm || x < m + rm || x > bs - rm
              ? 0
              : (m / s) * 0.5);
        }
      }
    }
  }
};

const scene = new Scene();
var light1 = new DirectionalLight(0xffffff, 20);
light1.position.set(31, 15, 10);
scene.add(light1);
var light2 = new DirectionalLight(0xed4c5c, 10);
light2.position.set(1, 3, -3);
var light3 = new AmbientLight(0x222222, 9);
scene.add(light3);
const terrain = new Terrain({
  width: 640,
  height: 240,
  depth: 640,
  generator,
  maps: {
    colorRGB:
      "https://cdn.glitch.me/54254046-96f7-4d45-bc9c-6ff372d5e929%2Fhrt-concrete-wall-03.jpg?v=1634185787311",
  },
  onLoad() {
    document.getElementById("generate").addEventListener(
      "click",
      () => {
        generator(terrain);
        terrain.maps.color.needsUpdate = true;
        terrain.remesh();
      },
      true
    );
  },
});
scene.add(terrain);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
