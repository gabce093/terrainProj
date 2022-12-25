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
import { fbm, ridgedFbm } from './fbm';

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

function loadCar(onOff){ 
  if(onOff){
    new MTLLoader()
    .setPath( '' )
    .load( 'CyberpunkDeLorean.mtl', function ( materials ) {
      materials.preload();
      new OBJLoader()
        .setMaterials( materials )
        .setPath( '' )
        .load( 'CyberpunkDeLorean.obj', function ( car ) {
          car.position.set( 0.0,6.0,950 );
          var Rot = new THREE.Euler( Math.PI/2.0, Math.PI/1.0 , 0.0, 'XYZ' );
          car.rotation.copy(Rot);
          car.name = 'car';
          scene.add( car );
         
        }, onProgress );
    } );
  }
  scene.remove(scene.getObjectByName('car'));
  }

  //turn car on or off
  var controller = new function() {  
    this.onOrOff=false;
  }

//scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2500);

//const controls = new OrbitControls(camera, renderer.domElement);
//controls.update() must be called after any manual changes to the camera's transform

camera.position.set(0, 20, 1000);

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
const planeWidth = 2000*1.5;
const planeHeight = 2000*1.5;
var geometry = new THREE.PlaneGeometry(planeWidth, planeHeight,256, 256);
var material = new THREE.MeshPhongMaterial();

var plane = new THREE.Mesh(geometry, material);

//Highway
const highway_size = 25;
var highway_geometry = new THREE.PlaneGeometry(highway_size+5, planeHeight, 20, 256);

//Generate highway colortexture
const color_ctx = document.createElement('canvas').getContext('2d');
color_ctx.canvas.width = 81;
color_ctx.canvas.height = 256*2;
var texture = new CanvasTexture(color_ctx.canvas)
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.y = 1;
//texture.minFilter = THREE.NearestFilter;

function drawHighway() {
  color_ctx.fillStyle = 'black';
  color_ctx.fillRect(0, 0, color_ctx.canvas.width, color_ctx.canvas.height);
  const x = 40;
  color_ctx.fillStyle = '#fff2ca';

  for(var y = 0; y < color_ctx.canvas.height; y += 8) {
    color_ctx.fillRect(x, y, 3, 5);
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
highway.position.y = 0.17;

//Generate Terrain

//Customizable variables
var speed = {speed: 20};
var amplitudes = new function() {
  this.octav1 = 60;
  this.octav2 = 30;
  this.octav3 = 15;
  this.octav4 = 7.5;
  this.octav5 = 7.5/2;
}
var ridged = {ridged: false};
var overview = {overview: false};

function computeTerrain(octav1,octav2,octav3,octav4,octav5, offset=0) {
  var octave_value = 0.002;
  var distance_from_highway = 0;
  var elevation = 0;

  for (var i = 2; i < plane.geometry.attributes.position.array.length; i = i + 3) {

    var x = plane.geometry.attributes.position.array[i-2];
    var y = plane.geometry.attributes.position.array[i-1]+offset;

    if (x > highway_size || x < -highway_size){
      distance_from_highway = Math.abs(x) - highway_size;
    } 

    if(ridged.ridged) {
      elevation = ridgedFbm([octav1,octav2,octav3,octav4,octav5], octave_value, x, y);
      plane.geometry.attributes.position.array[i] = elevation*distance_from_highway*0.004;
    } else {
      elevation = fbm([octav1,octav2,octav3,octav4,octav5], octave_value, x, y);
      plane.geometry.attributes.position.array[i] = elevation*distance_from_highway*0.005;
    }
    
    distance_from_highway = 0;
  }

  plane.geometry.attributes.position.needsUpdate = true;
  plane.geometry.computeVertexNormals();
}

function changeCamera() {
  if (overview.overview){
    camera.position.set(0,700,1600)  
    camera.rotation.x = -Math.PI / 4;
    return;
  } 
  camera.position.set(0, 20, 1000);
  camera.rotation.x = 0;
}


//Gui
const gui = new GUI()
gui.domElement.id = 'gui_css';
const AmplitudeFolder = gui.addFolder('Amplitudes');
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

const RidgedFolder = gui.addFolder('Ridged Noise');
RidgedFolder.add(ridged, 'ridged').onChange(
  () => computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5));
RidgedFolder.open();

const SpeedFolder = gui.addFolder('Speed');
SpeedFolder.add(speed, 'speed', 1, 150);
SpeedFolder.open();

const carFolder = gui.addFolder('Car');
carFolder.add(controller, 'onOrOff').onChange(() => loadCar(controller.onOrOff));

const overviewFolder = gui.addFolder('Overview');
overviewFolder.add(overview, 'overview').onChange(() => changeCamera());

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

  //controls.update();

	renderer.render(scene, camera);
}
animate();
