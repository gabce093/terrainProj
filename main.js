import './style.css'
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui'
import {Sky} from './node_modules/three/examples/jsm/objects/Sky.js';
import { hwFrag, hwVert } from './highwayShaders';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

//Test for skyshader
renderer.toneMappingExposure = 0.5;

document.body.appendChild(renderer.domElement);


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set(0, 30, 1000);
//controls.update();

scene.add(new THREE.AmbientLight(0x000055));
var light = new THREE.PointLight(0xffcc77, 1);
scene.add(light);
light.position.z = -2000;
light.position.x = 0;
light.position.y = 200;



//Sky-Shader
let skyShader = new Sky();
skyShader.scale.setScalar( 4500000 );
scene.add( skyShader );
sun = new THREE.Vector3(10000, 10000, 10000);

console.log(skyShader.material.uniforms)
const phi = THREE.MathUtils.degToRad( 90 - 2 );
const theta = THREE.MathUtils.degToRad( 180 );

sun.setFromSphericalCoords( 1, phi, theta );
skyShader.material.uniforms.sunPosition.value.copy(sun);
skyShader.material.uniforms.rayleigh.value = 5;
skyShader.material.uniforms.mieDirectionalG.value = 0.5;

//Sky-sphere
var skyMaterial = new THREE.MeshStandardMaterial({
  color: 0xe600e6,
});
var skyGeo = new THREE.SphereGeometry(800, 25, 25);
var sky = new THREE.Mesh(skyGeo, skyMaterial);
sky.material.side = THREE.BackSide;
//scene.add(sky);

//Sun-Sphere
var sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xe65c00,
  emissive: 0xe65c00,
  emissiveIntensity : 100.0,
});
var sunGeo = new THREE.SphereGeometry(400, 25, 25);
var sun = new THREE.Mesh(sunGeo, sunMaterial);
//scene.add(sun);
sun.translateZ(-700);
sun.translateY(150);

var light = new THREE.PointLight(0xffcc77, 1);
scene.add(light);
light.position.z = -800;
light.position.y = 150;

//Fog
const color = 0xFFFFFF;  // white
const near = 1300;
const far = 1700;
scene.fog = new THREE.Fog(color, near, far);

//Plane
const planeWidth = 2000;
const planeHeight = 2000;
var geometry = new THREE.PlaneGeometry(planeWidth, planeHeight,256, 256);
var material = new THREE.MeshPhongMaterial();
var plane = new THREE.Mesh(geometry, material);

//Highway
const highway_size = 25;
var highway_geometry = new THREE.PlaneGeometry(highway_size, planeHeight, 20, 256);
var highway_material = new THREE.ShaderMaterial({
  vertexShader: hwVert,
  fragmentShader: hwFrag,
  uniforms: {
    offset: {
      value: 0.0,
    }
  }
})

var highway = new THREE.Mesh(highway_geometry,highway_material);
console.log(highway)


//Add to scene
scene.add(highway);
highway.rotation.x = -Math.PI / 2;
scene.add(plane);
plane.rotation.x = -Math.PI / 2;
highway.position.y = 0.1;

//Plane noise
const noise = createNoise2D();

var amplitudes = new function() {
  this.octav1 = 66;
  this.octav2 = 7;
  this.octav3 = 11.2;
  this.octav4 = 3.3;
  this.octav5 = 2.3;
}

function computeTerrain(octav1,octav2,octav3,octav4,octav5, offset=0) {
  var octave_value = 0.002;
  var distance_from_highway = 0;
  for (var i = 2; i < plane.geometry.attributes.position.array.length; i = i + 3) {

    var x = plane.geometry.attributes.position.array[i-2];
    var y = plane.geometry.attributes.position.array[i-1]+offset;

    if (x > highway_size || x < -highway_size){
      distance_from_highway = Math.abs(x) - 10;
    } 
  
    var elevation = (octav1*noise(x * octave_value, y * octave_value) + 
    octav2*noise(x * octave_value* 2, y * octave_value*2)+
    octav3*noise(x * octave_value* 4, y * octave_value*4)+
    octav4*noise(x * octave_value* 8, y * octave_value*8)+
    octav5*noise(x * octave_value* 16, y * octave_value*16));
    
    plane.geometry.attributes.position.array[i] = elevation*distance_from_highway*0.005;
    distance_from_highway = 0;
  }
  plane.geometry.attributes.position.needsUpdate = true;
  plane.geometry.computeVertexNormals();
}

var speed = {speed: 1};

//Gui
const gui = new GUI()
gui.domElement.id = 'gui_css';
const AmplitudeFolder = gui.addFolder('Amplitude');
AmplitudeFolder.add(amplitudes, 'octav1', 0, 100).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav2', 0, 100).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav3', 0, 100).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav4', 0, 50).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
AmplitudeFolder.add(amplitudes, 'octav5', 0, 20).onChange(
  ()=> computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));

AmplitudeFolder.open();

const SpeedFolder = gui.addFolder('Speed');
SpeedFolder.add(speed, 'speed', 1, 100);
SpeedFolder.open();

gui.updateDisplay();

var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  //camera.position.z -= 1;

  //Tidsvariabel
  var offset = clock.getElapsedTime()*speed.speed;
  highway.material.uniforms.offset.value = offset;
  computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5, offset);
  controls.update();
	renderer.render(scene, camera);
}
animate();
