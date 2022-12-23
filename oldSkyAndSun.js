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