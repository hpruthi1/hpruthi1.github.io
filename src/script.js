import { GLTFLoader } from "../three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "../three/build/three.module.js";
import { ARButton } from "../src/ARButton.js";

let container;
let camera, scene, renderer;
let controller;
let selectedItemURL = "../static/Models/chair.glb";

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;
let spawwnedObjects = [];
function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
  );

  let mesh;
  function onSelect() {
    if (reticle.visible) {
      loader.load(
        selectedItemURL,
        function (LoadModel) {
          console.log(selectedItemURL + "Added");
          mesh = LoadModel.scene;
          mesh.layers.enabled = 1;
          mesh.position.setFromMatrixPosition(reticle.matrix);
          mesh.scale.y = Math.random() * 2 + 1;
          scene.add(mesh);
          spawwnedObjects.add(mesh);
        },
        undefined,
        function (OnError) {
          console.log("Error");
        }
      );
    }
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  window.addEventListener("resize", onWindowResize);
}
const loader = new GLTFLoader();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace("viewer").then(function (referenceSpace) {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then(function (source) {
            hitTestSource = source;
          });
      });

      session.addEventListener("end", function () {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {
        const hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}


let ItemInfo = {
  button1: "../static/Models/Black_chair.glb",
  button2: "../static/Models/chair.glb",
  button3: "../static/Models/Final.glb",
};

let Buttons = document.getElementsByClassName("buttons");
function BindingSelectionEvent() {
  for (let i = 0; i < Buttons.length; i++) {
    Buttons[i].addEventListener("click", () => {
      selectedItemURL = ItemInfo[Buttons[i].id];
    });
  }
}

//Object Selection
let Colors = {
  0: "0xff0000",
  1: "0x00ff00",
  2: "0x0000ff",
  3: "0xffff00"
}
let mouse = new THREE.Vector2();
let raycast = new THREE.Raycaster();
let selectedObject = null;
window.addEventListener('click', (e) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
  raycast.setFromCamera(mouse, camera);
  raycast.layers.set(1);

  let objects = raycast.intersectObjects(spawwnedObjects);
  if (objects[0] != null) {
    selectedObject = objects[0].object;
  }
  else {
    e.preventDefault();
  }
})
let matSlider = document.getElementById("MaterialSlider");
matSlider.addEventListener('change', () => {
  if (selectedObject != null) {
    selectedObject.color = Colors[matSlider.value];
  }
});

let HeightSlider = document.getElementById("HeightSlider");
HeightSlider.addEventListener('change', () => {
  if (selectedObject != null) {
    selectedObject.scale.y = [HeightSlider.value];
  }
  console.log(HeightSlider.value);
});
let widthSlider = document.getElementById("WidthSlider");
widthSlider.addEventListener('change', () => {
  if (selectedObject != null) {
    selectedObject.scale.x = [widthSlider.value];
  }
  console.log(widthSlider.value);
});
BindingSelectionEvent();
init();
animate();
