import './style.css'
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set(0, 100, 100);
controls.update();

scene.add(new THREE.AmbientLight(0x000055));
var light = new THREE.PointLight(0xffcc77, 1);
scene.add(light);
light.position.z = 0;
light.position.x = -3;
light.position.y = 200;

const planeWidth = 2000;
const planeHeight = 2000;
var geometry = new THREE.PlaneGeometry(planeWidth, planeHeight,256, 256);

var material = new THREE.MeshPhongMaterial();

var plane = new THREE.Mesh(geometry, material);

scene.add(plane);
plane.rotation.x = -Math.PI / 2;


//Plane noise
const noise = createNoise2D();

var octave_value = 0.002;
var amplitude_lf = 40;
var amplitude_hf = 15;
var amplitude_hf2 = 5;


for (var i = 2; i < geometry.attributes.position.array.length; i = i + 3) {

    var x = plane.geometry.attributes.position.array[i-2];
    var y = plane.geometry.attributes.position.array[i-1];

    var elevation = (amplitude_lf*noise(x * octave_value, y * octave_value) + 
      amplitude_hf*noise(x * octave_value * 2, y * octave_value*2)+ 
      amplitude_hf2*noise(x * octave_value * 16, y * octave_value*16));

    plane.geometry.attributes.position.array[i] = elevation;
  
}


plane.geometry.attributes.position.needsUpdate = true;

camera.position.z = 1;
plane.geometry.computeVertexNormals();

function animate() {
    requestAnimationFrame(animate);

  controls.update();
	//camera.position.z -= 0.1;
	renderer.render(scene, camera);
}
animate();
