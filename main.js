import './style.css'
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui'

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set(0, 100, 100);
//controls.update();

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

var amplitudes = new function() {
  this.octav1 = 66;
  this.octav2 = 7;
  this.octav3 = 11.2;
  this.octav4 = 3.3;
  this.octav5 = 2.3;
}

function computeTerrain(octav1, octav2,octav3,octav4,octav5) {
  var octave_value = 0.002;
  for (var i = 2; i < geometry.attributes.position.array.length; i = i + 3) {

    var x = plane.geometry.attributes.position.array[i-2];
    var y = plane.geometry.attributes.position.array[i-1];
  
    var elevation = (octav1*noise(x * octave_value, y * octave_value) + 
    octav2*noise(x * octave_value * 2, y * octave_value*2)+
    octav3*noise(x * octave_value* 4, y * octave_value * 4)+
    octav4*noise(x * octave_value * 8, y * octave_value*16)+
    octav5*noise(x * octave_value * 16, y * octave_value*32));
    
  
    plane.geometry.attributes.position.array[i] = elevation;
  }
  plane.geometry.attributes.position.needsUpdate = true;
  plane.geometry.computeVertexNormals();
}

computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5)

camera.position.z = 1;

const gui = new GUI()
gui.domElement.id = 'gui_css';
const AmplitudeFolder = gui.addFolder('Amplitude');
AmplitudeFolder.add(amplitudes, 'octav1', 0, 100).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav2', 0, 100).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav3', 0, 100).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav4', 0, 10).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav5', 0, 10).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));

AmplitudeFolder.open();
gui.updateDisplay();

function animate() {
  requestAnimationFrame(animate);
  camera.position.z -= 1;
  //controls.update();
	renderer.render(scene, camera);
}
animate();
