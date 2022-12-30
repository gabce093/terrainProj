import './style.css'
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui'
import {Sky} from './node_modules/three/examples/jsm/objects/Sky.js';
import { hwFrag, hwVert } from './highwayShaders';
import { CanvasTexture, Mesh } from 'three';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from './node_modules/three/examples/jsm/loaders/MTLLoader.js';
import { fbm, ridgedFbm } from './fbm';
import { RenderPass } from './node_modules/three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from './node_modules/three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from './node_modules/three/examples/jsm/postprocessing/UnrealBloomPass';
import { HalftonePass } from './node_modules/three/examples/jsm/postprocessing/HalftonePass';

import { AnimationClip, VectorKeyframeTrack , AnimationMixer} from "three";

const noise = createNoise2D();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

//Test for skyshader
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

//Red lights
const red_ctx = document.createElement('canvas').getContext('2d');
red_ctx.canvas.width = 40;
red_ctx.canvas.height = 40;
red_ctx.fillStyle = 'red';
red_ctx.fillRect(0,0,40,40);
var red_lights = new CanvasTexture(red_ctx.canvas);
 

//progress console output when loading car
const onProgress = function ( xhr ) {
  if ( xhr.lengthComputable ) {
    const percentComplete = xhr.loaded / xhr.total * 100;
    console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
  }
};

//Loads the car
var objLoader = new OBJLoader();
var mtlLoader = new MTLLoader();
function loadCar(onOff){ 
  if(onOff){
    return new Promise(resolve => {
  var container = new THREE.Object3D();
    mtlLoader
    .setPath( '' )
    .load( 'CyberpunkDeLorean.mtl', function ( materials ) {
      materials.preload();
      //console.log(materials)
      materials.materials.DeLorean_RedLight.emissiveIntensity = 1000;
      //materials.materials.DeLorean_RedLight.lightMap = red_lights;
      //materials.materials.DeLorean_RedLight.lightMapIntensity = 100;
      objLoader.setMaterials( materials )
        .setPath('')
        .load('CyberpunkDeLorean.obj', function ( car ) {
          car.position.set( 0.0,6.0,960);
          var Rot = new THREE.Euler( Math.PI/2.0, Math.PI/1.0 , 0.0, 'XYZ' );
          car.rotation.copy(Rot);
          car.name = 'car';
         
          container.add(car);

         // scene.add( container );
          resolve(container);
        }, onProgress );
       
    } );  
  });
}
  scene.remove(scene.getObjectByName('car'));
  }

//Animate the car
const times = [0, 2, 3, 4];
const values = [2, 6, 1010,   1, 5, 990,   1, 7, 975,   0, 6, 960];
const positionKF = new VectorKeyframeTrack(".position", times, values);
const tracks = [positionKF];

const length = -1;
const clip = new AnimationClip("slowmove", length, tracks);

const mixer = new AnimationMixer();
async function driveForward(onOff) {
  console.log(onOff)
   var carContainer = await loadCar(onOff);
   carContainer.name = 'carcontainer';

   var theCar = carContainer.getObjectByName('car');
   scene.add(theCar);
   var action = mixer.clipAction(clip, theCar);//
                                                 
   action.clampWhenFinished = true;
   action.setLoop(THREE.LoopOnce); 
   action.fadeOut(6);
   action.play();
}

//Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2500);

const renderScene = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);

//Post-Processing
const bloompass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.4,
  0,
  0.5,
);
//composer.addPass(bloompass);

const halftone = new HalftonePass(window.innerWidth, window.innerHeight);
//composer.addPass(halftone);

//const controls = new OrbitControls(camera, renderer.domElement);
//controls.update() must be called after any manual changes to the camera's transform

camera.position.set(0, 20, 1000);

scene.add(new THREE.AmbientLight(0x000055, 0.5));
var light = new THREE.PointLight(0xe65c00, 2);
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
//scene.add(light);
light.position.z = 960;
light.position.y = 100;

//Fog
const color = 0xFFFFFF;  // white
const near = 1680;
const far = 1700;
//scene.fog = new THREE.Fog(color, near, far);

//Terrain
const planeWidth = 2000*1.5;
const planeHeight = 2000*1.5;
var geometry = new THREE.PlaneGeometry(planeWidth, planeHeight,256, 256);

//Terrain material
const box_ctx = document.createElement('canvas').getContext('2d');
box_ctx.canvas.width = 80;
box_ctx.canvas.height = 80;
box_ctx.fillStyle = 'black';
box_ctx.fillRect(0,0,80,80);
box_ctx.fillStyle = '#BC13FE';
box_ctx.fillRect(box_ctx.canvas.width/2-0.5, 0, 1, box_ctx.canvas.height);
box_ctx.fillRect(0, box_ctx.canvas.height/2-0.5, box_ctx.canvas.width, 1);

const terrain_ctx = document.createElement('canvas').getContext('2d');
terrain_ctx.canvas.width = 256*16;
terrain_ctx.canvas.height = 256*16;
var pattern = box_ctx.createPattern(box_ctx.canvas, 'repeat');
terrain_ctx.fillStyle = pattern;
terrain_ctx.fillRect(0, 0, terrain_ctx.canvas.width, terrain_ctx.canvas.height);

var terrain_map = new CanvasTexture(terrain_ctx.canvas)
terrain_map.wrapT = THREE.RepeatWrapping;
terrain_map.repeat.y = 1;

var material = new THREE.MeshPhongMaterial({
  shininess: 40,
  lightMap: terrain_map,
  lightMapIntensity: 10,
  //emissiveMap: terrain_map, 
  //emissive: '#BC13FE',
});

var plane = new THREE.Mesh(geometry, material);
const uv1Array = plane.geometry.getAttribute("uv").array;
plane.geometry.setAttribute( 'uv2', new THREE.BufferAttribute( uv1Array, 2 ) );

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
  color_ctx.fillStyle = 'blackk';
  color_ctx.fillRect(0, 0, color_ctx.canvas.width, color_ctx.canvas.height);
  const x = 40;
  color_ctx.fillStyle = '#BC13FE';
  color_ctx.fillRect(0, 0, 3, color_ctx.canvas.height);
  color_ctx.fillRect(color_ctx.canvas.width-3, 0, 3, color_ctx.canvas.height);

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
  //map: texture, 
  bumpMap: bump_map, 
  lightMap: texture,
  lightMapIntensity: 1,
  //reflectivity: 100,
})
var highway = new THREE.Mesh(highway_geometry,highway_material);
const uv1Array2 = highway.geometry.getAttribute("uv").array;
highway.geometry.setAttribute( 'uv2', new THREE.BufferAttribute( uv1Array2, 2 ) );

//Add to scene
highway.rotation.x = -Math.PI / 2;
plane.rotation.x = -Math.PI / 2;
highway.position.y = 0.17;
scene.add(plane);
scene.add( skyShader );
scene.add(highway);

//turn car on or off
var drive = new function() {  
  this.Spawn=false;
}

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

var postP = {
  halftone: false,
  bloom: false,
}

//Generate Terrain
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
carFolder.add(drive, 'Spawn').onChange( () => driveForward(drive.Spawn));

const overviewFolder = gui.addFolder('Overview');
overviewFolder.add(overview, 'overview').onChange(() => changeCamera());

const postprocessingFolder = gui.addFolder('Post-Processing');
postprocessingFolder.add(postP, 'halftone').onChange((value) => value ? composer.addPass(halftone) : composer.removePass(halftone));
postprocessingFolder.add(postP, 'bloom').onChange((value) => value ? composer.addPass(bloompass) : composer.removePass(bloompass));

gui.updateDisplay();

var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  //Timevariabel
  var offset = clock.getElapsedTime()*speed.speed;

  //Update scene
  terrain_map.offset.y = offset*0.00035;
  terrain_map.needsUpdate = true;
  texture.offset.y = offset*0.00035;
  texture.needsUpdate = true;
  bump_map.offset.y = offset*0.00035;
  bump_map.needsUpdate = true;
  computeTerrain(amplitudes.octav1,amplitudes.octav2,amplitudes.octav3, amplitudes.octav4, amplitudes.octav5, offset);

  //controls.update();
  const delta = clock.getDelta();
  mixer.update(delta);

  composer.render();
	//renderer.render(scene, camera);
}
animate();
