import './style.css'
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui'
import {Sky} from './node_modules/three/examples/jsm/objects/Sky.js';
import { hwFrag, hwVert } from './highwayShaders';
import { CanvasTexture } from 'three';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from './node_modules/three/examples/jsm/loaders/MTLLoader.js';

const noise = createNoise2D();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

//Test for skyshader
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

//progress console output when loading car
const onProgress = function ( xhr ) {
  if ( xhr.lengthComputable ) {
    const percentComplete = xhr.loaded / xhr.total * 100;
    console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
  }
};
//Loads the car
function loadCar (){ 
  new MTLLoader()
  .setPath( '' )
  .load( 'CyberpunkDeLorean.mtl', function ( materials ) {
    materials.preload();
    new OBJLoader()
      .setMaterials( materials )
      .setPath( '' )
      .load( 'CyberpunkDeLorean.obj', function ( object ) {
        object.position.set( 0.0,6.0,950 );
        var xRot = new THREE.Euler( Math.PI/2.0, Math.PI/1.0 , 0.0, 'XYZ' );
        object.rotation.copy(xRot);
        scene.add( object );
      }, onProgress );
  } );
  }
  //turn car on or off
  var controller = new function() {  
    this.onOrOff=false;
  }

//scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 30, 1000);

scene.add(new THREE.AmbientLight(0x000055, 0.5));
var light = new THREE.PointLight(0xe65c00, 1);
scene.add(light);
light.position.z = -2000;
light.position.x = 0;
light.position.y = 200;

//Sky-Shader
let skyShader = new Sky();
skyShader.scale.setScalar( 4500000 );
var sun = new THREE.Vector3(10000, 10000, 10000);
const phi = THREE.MathUtils.degToRad( 90 - 2 );
const theta = THREE.MathUtils.degToRad( 180 );

sun.setFromSphericalCoords( 1, phi, theta );
skyShader.material.uniforms.sunPosition.value.copy(sun);
skyShader.material.uniforms.rayleigh.value = 5;
skyShader.material.uniforms.mieDirectionalG.value = 0.5;

var light = new THREE.PointLight(0xffcc77, 1);
scene.add(light);
light.position.z = -1000;
light.position.y = 150;

//Fog
const color = 0xFFFFFF;  // white
const near = 1680;
const far = 1700;
//scene.fog = new THREE.Fog(color, near, far);

//Plane
const planeWidth = 2000;
const planeHeight = 2000;
var geometry = new THREE.PlaneGeometry(planeWidth*1.5, planeHeight*1.5,256, 256);
var material = new THREE.MeshPhongMaterial();

var plane = new THREE.Mesh(geometry, material);

//Highway
const highway_size = 25;
var highway_geometry = new THREE.PlaneGeometry(highway_size, planeHeight, 20, 256);

//Generate highway colortexture
const color_ctx = document.createElement('canvas').getContext('2d');
color_ctx.canvas.width = 20;
color_ctx.canvas.height = 256;
var texture = new CanvasTexture(color_ctx.canvas)
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.y = 1;
texture.minFilter = THREE.NearestFilter;

function drawHighway() {
  color_ctx.fillStyle = 'black';
  color_ctx.fillRect(0, 0, color_ctx.canvas.width, color_ctx.canvas.height);
  const x = 9.5;
  color_ctx.fillStyle = '#fff2ca';

  for(var y = 0; y < color_ctx.canvas.height; y += 8) {
    color_ctx.fillRect(x, y, 1, 5);
  }
  texture.needsUpdate = true;
}
drawHighway();

//Generate bump map
const bump_ctx = document.createElement('canvas').getContext('2d');

bump_ctx.canvas.width = 100;
bump_ctx.canvas.height = 256;
var bump_map = new CanvasTexture(bump_ctx.canvas)
bump_map.wrapT = THREE.RepeatWrapping;
bump_map.repeat.y = 1;

function drawBumpMap() {
  for(var y = 0; y < bump_ctx.canvas.height; y++) {
    for(var x = 0; x < bump_ctx.canvas.width; x++) {
      var value = Math.abs(noise(x,y));
      value = value*25;
      bump_ctx.fillStyle = "rgba(" + value + "," + value + "," + value + ",1)";
      bump_ctx.fillRect(x, y, 1, 1);
    }
  }
  bump_map.needsUpdate = true;
}
drawBumpMap();

var highway_material = new THREE.MeshPhongMaterial({
  map: texture, 
  bumpMap: bump_map, 
  emissiveMap: texture, 
  emissive: 'white',
})
var highway = new THREE.Mesh(highway_geometry,highway_material);

//Add to scene
scene.add( skyShader );
scene.add(highway);
highway.rotation.x = -Math.PI / 2;
scene.add(plane);
plane.rotation.x = -Math.PI / 2;
highway.position.y = 0.1;

//Plane noise
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

var speed = {speed: 20};

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
SpeedFolder.add(speed, 'speed', 1, 150);
SpeedFolder.open();

const carFolder = gui.addFolder('Car');
carFolder.add(controller, 'onOrOff').listen().onChange(loadCar);

gui.updateDisplay();

var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  //Timevariabel
  var offset = clock.getElapsedTime()*speed.speed;

  //Update scene
  texture.offset.y = offset*0.0004;
  texture.needsUpdate = true;
  computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5, offset);

  controls.update();

	renderer.render(scene, camera);
}
animate();
