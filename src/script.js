import { GLTFLoader } from "../three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "../three/build/three.module.js";
import { ARButton } from "../src/ARButton.js";

let container;
let camera, scene, renderer;
let hitTestResults;
let spawnned = false;
let controller;

let ItemInfo = {
  button1: "../static/Models/Tree.glb",
  button2: "../static/Models/Tree1.glb",
  button3: "../static/Models/Tree2.glb"
};
let selectedItemURL = ItemInfo.button1;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;
let selectedObject = null;
// let spawwnedObjects = [];
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

  //Selection Function
  let mesh;
  function onSelect() {
    if (reticle.visible && !spawnned) {
      loader.load(
        selectedItemURL,
        function (LoadModel) {
          console.log(selectedItemURL + "Added");
          mesh = LoadModel.scene;
          mesh.layers.enabled = 1;
          mesh.position.setFromMatrixPosition(reticle.matrix);
          scene.add(mesh);
          selectedObject = mesh;
          //spawwnedObjects.push(mesh);
          spawnned = true;
        },
        undefined,
        function (OnError) {
          console.log("Error " + OnError);
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
      hitTestResults = frame.getHitTestResults(hitTestSource);

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

let Buttons = document.getElementsByClassName("buttons");
function BindingSelectionEvent() {
  for (let i = 0; i < Buttons.length; i++) {
    Buttons[i].addEventListener("click", () => {
      selectedItemURL = ItemInfo[Buttons[i].id];
    });
  }
}

//Delete Function to remove selected mesh.
function Delete() {
  if (selectedObject != null) {
    scene.remove(selectedObject);
    selectedObject = null;
    spawnned = false;
  }
}
let deleteButton = document.getElementById("DeleteButton");
deleteButton.addEventListener('click', Delete);

//Object Selection
let Colors = {
  0: "0xff0000",
  1: "0x00ff00",
  2: "0x0000ff",
  3: "0xffff00",
};
// let mouse = new THREE.Vector2();
// let raycast = new THREE.Raycaster();
// window.addEventListener("click", (e) => {
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = (event.clientY / window.innerHeight) * 2 + 1;
//   raycast.setFromCamera(mouse, camera);

//   let objects = raycast.intersectObjects(spawwnedObjects);
//   console.log(selectedObject);

//   if (objects[0] != null) {
//     selectedObject = objects[0].object;
//   } else {
//     e.preventDefault();
//   }
// });

let materialColor = document.getElementsByClassName("colors");
for (let i = 0; i < materialColor.length; i++) {
  materialColor[i].addEventListener("click", () => {
    if (selectedObject != null) {
      selectedObject.material.color.setHex(Colors[i]);
      selectedObject.material.needsUpdate = true;
    }
  });
}

let HeightSlider = document.getElementById("HeightSlider");
HeightSlider.addEventListener("change", () => {
  if (selectedObject != null) {
    selectedObject.scale.y = [HeightSlider.value];
    selectedObject.matrixAutoUpdate = true;
  }
});
let widthSlider = document.getElementById("WidthSlider");
widthSlider.addEventListener("change", () => {
  if (selectedObject != null) {
    selectedObject.scale.x = [widthSlider.value];
    selectedObject.matrixAutoUpdate = true;
  }
});

BindingSelectionEvent();
init();
animate();
