// IRON PASS - Combat Engineer Command
// A self-contained, procedural 3D field engineering scenario. No external art assets.
const $ = (id) => document.getElementById(id);
const ui = Object.fromEntries([
  'scene','loader','minimap','objectives','missionCount','missionTip','progressFill','fleet','activeUnit',
  'speedValue','headingValue','actionButton','actionText','actionHint','startOverlay','startButton',
  'helpButton','helpOverlay','closeHelp','helpDone','weatherButton','weatherLabel','soundButton',
  'convoyLabel','cameraButton','mobileActionButton','mobileActionLabel','joystick','joystickThumb','touchControls',
  'forwardButton','reverseButton',
  'centerNotice','targetMarker','victoryOverlay','victoryTime','restartButton','toasts'
].map((name) => [name, $(name)]));

let THREE;
try {
  THREE = await import('https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js');
} catch (primaryError) {
  try { THREE = await import('https://unpkg.com/three@0.171.0/build/three.module.js'); }
  catch (fallbackError) {
    ui.loader.classList.add('hidden');
    const failure = document.createElement('div');
    failure.className = 'fatal';
    failure.textContent = '3D engine could not load. Check your internet connection and reload the simulation.';
    document.body.append(failure);
    throw fallbackError;
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8199a0);
scene.fog = new THREE.FogExp2(0x8199a0, 0.0042);
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, .1, 650);
const renderer = new THREE.WebGLRenderer({ canvas: ui.scene, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const hemi = new THREE.HemisphereLight(0xd6e6ea, 0x4c4b34, 2.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2b0, 3.2);
sun.position.set(-65, 105, -54);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 145;
sun.shadow.camera.bottom = -145;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 270;
sun.shadow.bias = -.0004;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xa1d0e6, .7);
fill.position.set(60, 33, 60);
scene.add(fill);

const MAT = {
  ground: new THREE.MeshStandardMaterial({ color: 0x78836a, roughness: 1, flatShading: true }),
  road: new THREE.MeshStandardMaterial({ color: 0x57584e, roughness: 1 }),
  shoulder: new THREE.MeshStandardMaterial({ color: 0x927c61, roughness: 1 }),
  stripe: new THREE.MeshStandardMaterial({ color: 0xdfd0a7, roughness: 1 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x9a9a8d, roughness: 1, flatShading: true }),
  rockDark: new THREE.MeshStandardMaterial({ color: 0x585d56, roughness: 1, flatShading: true }),
  olive: new THREE.MeshStandardMaterial({ color: 0x647660, roughness: .87, metalness: .12 }),
  oliveDark: new THREE.MeshStandardMaterial({ color: 0x35443d, roughness: .84, metalness: .15 }),
  oliveLight: new THREE.MeshStandardMaterial({ color: 0x819478, roughness: .88, metalness: .1 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xd9a04c, roughness: .7, metalness: .2 }),
  dozer: new THREE.MeshStandardMaterial({ color: 0xc8a95c, roughness: .73, metalness: .18 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x646d6e, roughness: .57, metalness: .65 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x2d383a, roughness: .6, metalness: .46 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x21282a, roughness: .95 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x88acb7, metalness: .34, roughness: .2, transparent: true, opacity: .8 }),
  white: new THREE.MeshStandardMaterial({ color: 0xcbd7d2, roughness: .8 }),
  green: new THREE.MeshStandardMaterial({ color: 0x80d1a1, emissive: 0x25895b, emissiveIntensity: .6 }),
  beacon: new THREE.MeshBasicMaterial({ color: 0xffbf68, transparent: true, opacity: .9 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x59493a, roughness: 1 }),
  forest: new THREE.MeshStandardMaterial({ color: 0x38564b, roughness: 1, flatShading: true }),
  forest2: new THREE.MeshStandardMaterial({ color: 0x4b6650, roughness: 1, flatShading: true }),
  water: new THREE.MeshPhysicalMaterial({ color: 0x3c8595, roughness: .22, metalness: .12, transparent: true, opacity: .79, side: THREE.DoubleSide }),
};
const V = (x,y,z) => new THREE.Vector3(x,y,z);
const PI = Math.PI;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const createGroup = (parent, x=0, y=0, z=0) => { const g = new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g; };
function mesh(parent, geometry, material, x=0, y=0, z=0, shadow=true) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x,y,z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(parent, w, h, d, material, x=0, y=0, z=0) { return mesh(parent, new THREE.BoxGeometry(w,h,d), material,x,y,z); }
function cylinder(parent, a, b, h, material, x=0, y=0, z=0, sides=10) { return mesh(parent,new THREE.CylinderGeometry(a,b,h,sides),material,x,y,z); }
function smooth(a,b,t){const v=clamp((t-a)/(b-a),0,1);return v*v*(3-2*v);}
function terrainHeight(x,z){
  const hill = (1-smooth(9,61,Math.abs(x))) * .18 + smooth(12,76,Math.abs(x)) * (6.2 + 3*Math.sin(z*.039+x*.028));
  const ripple = .42*Math.sin(x*.08+z*.033)*Math.cos(z*.041) + .18*Math.sin(z*.13+x*.17);
  const channel = 1-smooth(9,18,Math.abs(z-23));
  const roadFlat = 1-smooth(7,21,Math.abs(x));
  return (.8 + hill + ripple*(1-roadFlat*.9))*(1-channel) + (-1.05)*channel;
}
function groundY(x,z){return terrainHeight(x,z);}
function driveY(x,z){
  const bridgeBuilt=typeof objectives!=='undefined' && objectives[1]?.done;
  if (!bridgeBuilt || Math.abs(x)>7.1 || z<=11 || z>=36) return groundY(x,z);
  const blend=smooth(11,15,z)*(1-smooth(32,36,z));
  return lerp(groundY(x,z),1.34,blend);
}
const terrainGeo = new THREE.PlaneGeometry(250, 250, 75, 75);
terrainGeo.rotateX(-PI/2);
const tpos=terrainGeo.getAttribute('position');
for (let i=0;i<tpos.count;i++) tpos.setY(i,terrainHeight(tpos.getX(i),tpos.getZ(i)));
terrainGeo.computeVertexNormals();
mesh(scene,terrainGeo,MAT.ground,0,0,0,false);

// Road corridor and its embankments, split at the damaged river crossing.
for(const [za,zb] of [[-118,12.1],[34.4,118]]) {
  const roadG = new THREE.PlaneGeometry(13.6,zb-za,2,Math.max(12,Math.round((zb-za)/3)));
  roadG.rotateX(-PI/2);
  const p=roadG.getAttribute('position');
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)+(za+zb)/2;p.setY(i,groundY(x,z)+.12);}
  roadG.computeVertexNormals();
  mesh(scene,roadG,MAT.road,0,0,(za+zb)/2,false);
  for(let z=za+5;z<zb-3;z+=8){
    const lane=box(scene,.23,.06,3.5,MAT.stripe,0,groundY(0,z)+.21,z);
    lane.castShadow=false;
  }
  for(const sign of [-1,1]){
    const sideGeo=new THREE.PlaneGeometry(2.1,zb-za,1,Math.max(12,Math.round((zb-za)/3)));
    sideGeo.rotateX(-PI/2);
    const pp=sideGeo.attributes.position;
    for(let i=0;i<pp.count;i++)pp.setY(i,groundY(pp.getX(i)+sign*7.9,pp.getZ(i)+(za+zb)/2)+.06);
    sideGeo.computeVertexNormals();
    mesh(scene,sideGeo,MAT.shoulder,sign*7.9,0,(za+zb)/2,false);
  }
}
const river=mesh(scene,new THREE.PlaneGeometry(242,23.1),MAT.water,0,.22,23,false);
river.rotation.x=-PI/2;
let riverRipples=[];
for(let i=0;i<28;i++) {
  let x=(i/27)*223-112,z=14+((i*13)%17);
  const m=mesh(scene,new THREE.PlaneGeometry(3+(i%4),.07),new THREE.MeshBasicMaterial({color:0xe3f5f2,transparent:true,opacity:.13}),x,.26,z,false);
  m.rotation.x=-PI/2;riverRipples.push(m);
}
for(let j=0;j<2;j++){const z=j?34.4:11.6;for(let x=-110;x<113;x+=11){const b=box(scene,9,.3,.45,MAT.rockDark,x,groundY(x,z)+.25,z);b.rotation.y=(x%3)*.04;}}

// Distant ridge silhouette and low-poly mountain strata.
let seed=10971;
const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<52;i++){
  const x=(rand()-.5)*246,z=(rand()-.5)*246;
  if(Math.abs(x)<17 || Math.abs(z-23)<18) continue;
  const size=1.2+rand()*4.8;
  let material=rand()>.6?MAT.rock:MAT.rockDark;
  const b=mesh(scene,new THREE.DodecahedronGeometry(size,0),material,x,groundY(x,z)+size*.36,z);
  b.scale.y=.35+rand()*.9;b.rotation.set(rand(),rand()*PI,rand()*.3);
}
const treeStem=new THREE.CylinderGeometry(.23,.4,2.8,5);
const treeTop=new THREE.ConeGeometry(2.15,6.1,6);
const trees=[];
for(let i=0;i<340;i++){
  const x=(rand()-.5)*228,z=(rand()-.5)*228;
  if(Math.abs(x)<15 || Math.abs(z-23)<16 || rand()<.13) continue;
  const scale=.65+rand()*1.2;
  const g=createGroup(scene,x,groundY(x,z),z);
  mesh(g,treeStem,MAT.trunk,0,1.2*scale,0,false).scale.set(scale,scale,scale);
  mesh(g,treeTop,rand()>.5?MAT.forest:MAT.forest2,0,4*scale,0,false).scale.set(scale,scale,scale);
  trees.push(g);
}
// Concrete checkpoint structures and reusable route furniture.
function checkpoint(x,z){
  const y=groundY(x,z);
  box(scene,8,3,5,MAT.oliveDark,x,y+1.5,z);
  box(scene,8.6,.45,5.8,MAT.steelDark,x,y+3.25,z);
  box(scene,2,.8,.16,MAT.glass,x,y+2,z-2.56);
  const tower=createGroup(scene,x+5,y,z+1);
  for(let sx of [-1,1])for(let sz of [-1,1])box(tower,.23,8,.23,MAT.steel,sx*1.4,4,sz*1.4);
  box(tower,3.8,.34,3.8,MAT.steel,0,8.3,0);
  box(tower,3.1,2.1,3.1,MAT.olive,0,9.3,0);
  box(tower,2.3,.9,.08,MAT.glass,0,9.3,-1.6);
  box(tower,4,.3,4,MAT.steelDark,0,10.6,0);
}
checkpoint(-21,-88);
checkpoint(22,79);
for(const z of [-98,-61,-8,42,60,93]){
  for(const side of [-1,1]){
    const x=side*9.5,y=groundY(x,z);
    cylinder(scene,.09,.09,3,MAT.steel,x,y+1.5,z);
    box(scene,.9,.72,.1,MAT.oliveLight,x,y+2.75,z);
    box(scene,.7,.15,.12,MAT.orange,x,y+2.74,z+.07);
  }
}
// River crossing bridge, intentionally absent until deployed by bridge layer.
const bridge=createGroup(scene);
bridge.visible=false;
const bridgeSegments=[];
for(let i=0;i<8;i++){
  const z=13.6+i*2.55;
  const g=createGroup(bridge,0,0,z);
  box(g,14,.55,2.52,MAT.steel,0,1.0,0);
  box(g,13.4,.12,2.22,MAT.road,0,1.32,0);
  for(const side of [-1,1]){
    box(g,.25,1.8,2.43,MAT.olive,side*6.85,2.05,0);
    box(g,.26,.19,2.55,MAT.orange,side*6.84,3.04,0);
  }
  for(const x of [-3,3])box(g,.1,.05,2.3,MAT.stripe,x,1.42,0);
  g.visible=false;
  bridgeSegments.push(g);
}
for (const z of [12.5,34.2])box(bridge,14,.5,2.6,MAT.steel,0,1.02,z);

// Rockslide, with individual boulders removed during dozer operation.
const debris=createGroup(scene);
const stones=[];
for(let i=0;i<14;i++){
  const x=(rand()-.5)*14,z=-35+(rand()-.5)*12;
  const size=1.3+rand()*2.35;
  const stone=mesh(debris,new THREE.DodecahedronGeometry(size,0),rand()>.5?MAT.rock:MAT.rockDark,x,groundY(x,z)+size*.65,z);
  stone.rotation.set(rand()*.6,rand()*PI,rand()*.7);stone.scale.y=.7;
  stones.push(stone);
}
const blockadeX=1,blockadeZ=-35;

function wheel(parent,x,y,z,r=.93,w=.6){
  const cylinderGeo=new THREE.CylinderGeometry(r,r,w,12);
  const wmesh=mesh(parent,cylinderGeo,MAT.rubber,x,y,z);
  wmesh.rotation.z=PI/2;
  const hub=cylinder(parent,r*.47,r*.47,.03,MAT.steel,x+Math.sign(x)*w*.53,y,z,12);
  hub.rotation.z=PI/2;
  return wmesh;
}
function makeDozer(){
  const g=createGroup(scene);
  box(g,4.5,1.25,6.5,MAT.dozer,0,1.65,0);
  box(g,3.35,2.45,3,MAT.dozer,0,3.1,-1.05);
  box(g,3.05,1.14,.11,MAT.glass,0,3.58,.51);
  for(const x of [-1.38,1.38])box(g,.12,1.2,2.1,MAT.glass,x,3.64,-1.06);
  box(g,2.5,.4,2.1,MAT.steelDark,0,4.42,-1.1);
  for(const s of [-1,1]){
    box(g,1.1,1.37,6.6,MAT.rubber,s*2.45,.82,0);
    for(let z=-2.4;z<=2.45;z+=1.15)wheel(g,s*2.65,.85,z,.48,.18);
    const arm=box(g,.35,.5,3.4,MAT.steel,s*2.55,1.35,3.6);
    arm.rotation.x=-.13;
  }
  box(g,7.5,1.62,.4,MAT.steel,0,1.6,5.15);
  box(g,7.5,.36,.5,MAT.dozer,0,.8,5.18);
  for(const x of [-1.65,1.65])box(g,.6,.36,.12,MAT.white,x,2.35,3.26);
  cylinder(g,.24,.24,2,MAT.steelDark,1.65,3.55,.75);
  return g;
}
function makeBridgeLayer(){
  const g=createGroup(scene);
  box(g,4.6,1.3,8.6,MAT.olive,0,1.62,.1);
  for(const s of [-1,1]){
    box(g,.96,1.08,8.7,MAT.rubber,s*2.25,.73,.2);
    for(let z=-3.6;z<4.1;z+=.92)wheel(g,s*2.47,.68,z,.38,.16);
  }
  box(g,3.95,.7,3.3,MAT.oliveLight,0,2.35,-2.45);
  box(g,3.4,1.15,1.9,MAT.olive,0,3.14,-2.9);
  box(g,2.8,.65,.1,MAT.glass,0,3.25,-3.87);
  for(const x of [-1.7,1.7])box(g,.13,.67,1.2,MAT.glass,x,3.3,-2.7);
  box(g,4.2,.25,7.4,MAT.steel,0,2.55,1.2);
  // Stacked folding bridge panels and lattice steel sections.
  for(const y of [3.13,3.76]){
    box(g,5.6,.23,7.4,MAT.steel,0,y,1.0);
    for(const s of [-1,1])box(g,.17,.48,7.5,MAT.oliveLight,s*2.62,y+.25,1.0);
    for(let z=-2;z<4.5;z+=1.5)box(g,5.2,.18,.18,MAT.steelDark,0,y+.14,z);
  }
  for(const x of [-1.85,1.85])box(g,.68,.32,.12,MAT.white,x,2.14,-4.26);
  return g;
}
function makeRecovery(){
  const g=createGroup(scene);
  box(g,4.2,1.05,9.5,MAT.oliveDark,0,1.55,0);
  box(g,4.1,2,2.9,MAT.olive,0,3.0,2.95);
  box(g,3.65,.95,.1,MAT.glass,0,3.4,4.46);
  for(const s of [-1,1]){
    for(const z of [-3.7,-1.6,1.35,3.45])wheel(g,s*2.32,1.05,z,.92,.56);
    box(g,.55,.62,6.6,MAT.oliveLight,s*2.06,1.88,-1.2);
  }
  box(g,3.5,.25,4.3,MAT.steel,0,2.17,-2.35);
  box(g,1.8,.65,4.4,MAT.oliveLight,0,2.8,-2.2);
  const boom=createGroup(g,0,2.6,-2.25);
  boom.rotation.x=-.43;
  box(boom,1.1,1.05,7.2,MAT.olive,0,0,-2.35);
  box(boom,.8,.8,3.2,MAT.steel,0,0,-6);
  const cable=box(boom,.07,2,.07,MAT.steel,0,-1.45,-7.3);
  cable.rotation.x=.43;
  const hook=mesh(boom,new THREE.TorusGeometry(.4,.1,6,10,PI*1.7),MAT.steel,0,-2.44,-7.35);
  hook.rotation.z=PI;
  for(const x of [-1.4,1.4])box(g,.65,.33,.15,MAT.white,x,3,4.55);
  g.userData.boom=boom;
  return g;
}
function makeConvoyTruck(colorMat=MAT.olive){
  const g=createGroup(scene);
  box(g,3.5,.85,7.2,MAT.steelDark,0,1.35,0);
  box(g,3.4,2.0,2.1,colorMat,0,2.55,2.22);
  box(g,2.9,.85,.09,MAT.glass,0,2.85,3.32);
  box(g,3.25,2.2,3.7,colorMat,0,2.55,-1.38);
  box(g,3.4,.18,3.9,MAT.oliveLight,0,3.75,-1.4);
  for(const side of [-1,1])for(const z of [-2.9,-.55,2.55]) wheel(g,side*1.94,.96,z,.72,.48);
  for(const x of [-1.15,1.15])box(g,.48,.22,.13,MAT.white,x,2.15,3.37);
  return g;
}
const units=[
  {id:'dozer',name:'D7 ARMORED DOZER',short:'D7 DOZER',role:'EARTHWORKS / CLEARANCE',icon:'▰',x:-1,z:-65,heading:0,speed:0,maxSpeed:15,turn:1.22,mesh:makeDozer()},
  {id:'bridge',name:'M60 BRIDGE LAYER',short:'M60 BRIDGE',role:'MOBILE ASSAULT BRIDGE',icon:'▤',x:12,z:-72,heading:0,speed:0,maxSpeed:17,turn:1.12,mesh:makeBridgeLayer()},
  {id:'recovery',name:'HEMTT RECOVERY',short:'HEMTT RECOVERY',role:'CRANE / FIELD RECOVERY',icon:'⚒',x:-14,z:-77,heading:0,speed:0,maxSpeed:19,turn:1.13,mesh:makeRecovery()},
];
const stranded={x:-21,z:-17,mesh:makeConvoyTruck(MAT.rockDark)};
stranded.mesh.position.set(stranded.x,groundY(stranded.x,stranded.z)+.11,stranded.z);
stranded.mesh.rotation.y=-.5;
const recoveryGlow=mesh(scene,new THREE.CylinderGeometry(2.5,2.5,.04,24),new THREE.MeshBasicMaterial({color:0xffaa66,transparent:true,opacity:.42}),stranded.x,groundY(stranded.x,stranded.z)+.08,stranded.z,false);
const convoy=Array.from({length:4},(_,i)=>({mesh:makeConvoyTruck(i===0?MAT.oliveLight:MAT.olive),z:-94-i*11,x:0}));
for(const truck of convoy){truck.mesh.position.set(truck.x,groundY(truck.x,truck.z)+.11,truck.z);truck.mesh.visible=true;}
function syncUnit(u){u.mesh.position.set(u.x,driveY(u.x,u.z)+.1,u.z);u.mesh.rotation.y=u.heading;}
units.forEach(syncUnit);

const rings=[];
function makeRing(x,z,color=0xffb45f,r=7){
  const g=createGroup(scene,x,groundY(x,z)+.35,z);
  const outline=mesh(g,new THREE.TorusGeometry(r,.09,5,56),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.66}),0,0,0,false);
  outline.rotation.x=PI/2;
  const ring2=mesh(g,new THREE.TorusGeometry(r*.87,.065,4,55),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.28}),0,.03,0,false);
  ring2.rotation.x=PI/2;
  const pole=box(g,.11,5,.11,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.45}),0,2.4,0);
  const diamond=mesh(g,new THREE.OctahedronGeometry(.85),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}),0,5.1,0,false);
  rings.push({g,outline,ring2,pole,diamond,x,z});
  return g;
}
const markers={
  clear:makeRing(1,-35,0xffb45f,9),
  bridge:makeRing(1,7,0x8bd9e1,9),
  recover:makeRing(-21,-17,0xffbc82,8),
  dispatch:makeRing(0,-78,0x85d79f,8)
};
markers.dispatch.visible=false;

const objectives=[
  {id:'clear',title:'CLEAR THE LANDSLIDE',detail:'D7 DOZER / SOUTH APPROACH',unit:'dozer',x:1,z:-35,radius:14,done:false},
  {id:'bridge',title:'BRIDGE THE RIVER',detail:'M60 / SOUTH BANK',unit:'bridge',x:1,z:7,radius:16,done:false},
  {id:'recover',title:'RECOVER THE VEHICLE',detail:'HEMTT / STRANDED ASSET',unit:'recovery',x:-21,z:-17,radius:16,done:false},
  {id:'dispatch',title:'ESCORT THE CONVOY',detail:'DISPATCH / SECURE NORTH ROAD',unit:null,x:0,z:-78,radius:9999,done:false}
];
const state={started:false,won:false,selected:0,working:null,workTime:0,workDuration:2.65,bridgeBuild:-1,convoy:false,storm:false,sound:false,cameraMode:0,orbit:.55,pitch:.79,distance:46,elapsed:0,noticeUntil:0,lastWarning:0};
const input={keys:new Set(),forward:0,steer:0,pedalForward:0,pedalReverse:0};
let audioContext=null;
function beep(freq=220,duration=.12){
  if(!state.sound) return;
  try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type='triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(.05,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
    osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);
  }catch{}
}
function toast(message){
  const el=document.createElement('div');el.className='toast';el.textContent=message;
  ui.toasts.prepend(el);
  while(ui.toasts.children.length>3)ui.toasts.lastElementChild.remove();
  window.setTimeout(()=>el.remove(),3300);
  beep(370,.13);
}
function active(){return units[state.selected];}
function pending(){return objectives.find(o=>!o.done&&o.id!=='dispatch') || objectives.find(o=>!o.done);}
function near(u,obj){return Math.hypot(u.x-obj.x,u.z-obj.z)<obj.radius;}
function renderObjectives(){
  const available=objectives.slice(0,3).every(o=>o.done);
  markers.dispatch.visible=available&&!objectives[3].done;
  ui.objectives.innerHTML=objectives.map((o,i)=>{
    const locked=o.id==='dispatch'&&!available;
    const activeObjective=!o.done&&!locked&&o.unit===active().id || (o.id==='dispatch'&&available&&!o.done);
    return `<div class="objective ${o.done?'complete':''} ${activeObjective?'active':''}"><div class="objective-number">${o.done?'✓':String(i+1).padStart(2,'0')}</div><div><div class="objective-title">${o.title}</div><div class="objective-detail">${o.done?'COMPLETED':locked?'AWAITING ENGINEER TASKS':o.detail}</div></div></div>`;
  }).join('');
  let completed=objectives.filter(o=>o.done).length;
  ui.missionCount.textContent=`${completed} / 4`;
  ui.progressFill.style.width=`${completed*25}%`;
  ui.convoyLabel.textContent=state.convoy?'ON THE MOVE':available?'READY FOR DISPATCH':'HOLDING';
  ui.missionTip.textContent=state.working?'FIELD OPERATIONS IN PROGRESS':completed===4?'OPERATION COMPLETE':available?'ROUTE CLEAR — DISPATCH THE CONVOY':'ENGINEERS MAKE THE WAY';
}
function renderFleet(){
  ui.fleet.innerHTML=units.map((u,i)=>`<button class="fleet-item ${i===state.selected?'selected':''}" data-index="${i}" aria-label="Select ${u.name}"><span class="fleet-index">0${i+1}</span><span class="fleet-icon">${u.icon}</span><span class="fleet-name">${u.short}</span><span class="fleet-role">${u.role}</span></button>`).join('');
  ui.fleet.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>selectVehicle(Number(btn.dataset.index))));
  ui.activeUnit.textContent=active().name;
  renderObjectives();
}
function selectVehicle(index){
  if(!state.started||state.working||state.won)return;
  state.selected=clamp(index,0,units.length-1);
  beep(510,.08);
  renderFleet();updateAction();
}
function actionFor(){
  if(state.won)return {label:'MISSION COMPLETE',hint:'CORRIDOR SECURED',disabled:true};
  if(state.working)return {label:`WORKING ${Math.round(state.workTime/state.workDuration*100)}%`,hint:'FIELD CREW ENGAGED',disabled:true};
  if(state.convoy)return {label:'CONVOY MOVING',hint:'WAIT FOR ARRIVAL AT FORWARD BASE',disabled:true};
  const unit=active();
  const specific=objectives.slice(0,3).find(o=>o.unit===unit.id);
  if(specific&&!specific.done){
    const d=Math.hypot(unit.x-specific.x,unit.z-specific.z);
    return {label:unit.id==='dozer'?'CLEAR DEBRIS':unit.id==='bridge'?'DEPLOY BRIDGE':'RECOVER ASSET',hint:d<specific.radius?'IN RANGE — PRESS WORK':`TARGET ${Math.ceil(d)} M AWAY`,disabled:d>=specific.radius,objective:specific};
  }
  if(objectives.slice(0,3).every(o=>o.done))return {label:'DISPATCH CONVOY',hint:'ROUTE OPEN — AUTHORIZE MOVEMENT',disabled:false,objective:objectives[3]};
  return {label:'UNIT TASK COMPLETE',hint:'SELECT ANOTHER ENGINEER ASSET',disabled:true};
}
function updateAction(){
  const a=actionFor();
  ui.actionText.textContent=a.label;
  ui.actionHint.textContent=a.hint;
  ui.actionButton.disabled=a.disabled;
  ui.mobileActionButton.disabled=a.disabled;
  ui.mobileActionLabel.textContent=state.working?'BUSY':a.objective?.id==='dispatch'?'CONVOY':a.label==='DEPLOY BRIDGE'?'BRIDGE':a.label==='RECOVER ASSET'?'RECOVER':a.label==='CLEAR DEBRIS'?'CLEAR':'WORK';
  ui.mobileActionButton.setAttribute('aria-label',a.label);
}
function startAction(){
  if(!state.started||state.won)return;
  const action=actionFor();
  if(action.disabled)return;
  if(action.objective?.id==='dispatch'){
    if(state.convoy)return;
    state.convoy=true;
    toast('CONVOY DISPATCHED — MAINTAIN THE CORRIDOR');
    renderObjectives();updateAction();beep(550,.35);
    return;
  }
  state.working=action.objective;
  state.workTime=0;
  active().speed=0;
  toast(`${active().short} — ENGINEERING OPERATION INITIATED`);
  updateAction();
}
function finishAction(obj){
  obj.done=true;
  markers[obj.id].visible=false;
  if(obj.id==='clear'){
    stones.forEach((s,i)=>{s.visible=false;});
    toast('LANDSLIDE CLEARED — SOUTH ROAD OPEN');
  }
  if(obj.id==='bridge'){
    bridge.visible=true;state.bridgeBuild=0;
    toast('MODULAR BRIDGE DEPLOYING — CROSSING SECURED');
  }
  if(obj.id==='recover'){
    stranded.mesh.visible=false;recoveryGlow.visible=false;
    toast('DISABLED VEHICLE RECOVERED — ASSET SAFE');
  }
  state.working=null;
  renderObjectives();updateAction();beep(650,.35);
  if(objectives.slice(0,3).every(o=>o.done))toast('ALL FIELD OBJECTIVES COMPLETE — DISPATCH AVAILABLE');
}
// Drag to orbit the scene, or pinch two fingers to zoom (works with a thumb on the drive controls).
const orbit={pointers:new Map(),lastPinch:0};
ui.scene.addEventListener('pointerdown',e=>{
  if(!state.started)return;
  orbit.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(orbit.pointers.size===2){const [a,b]=[...orbit.pointers.values()];orbit.lastPinch=Math.hypot(a.x-b.x,a.y-b.y);}
  ui.scene.setPointerCapture(e.pointerId);
});
ui.scene.addEventListener('pointermove',e=>{
  const last=orbit.pointers.get(e.pointerId);if(!last)return;
  const dx=e.clientX-last.x,dy=e.clientY-last.y;
  orbit.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(orbit.pointers.size===1){state.orbit-=dx*.006;state.pitch=clamp(state.pitch+dy*.004,.22,1.36);}
  else if(orbit.pointers.size===2){
    const [a,b]=[...orbit.pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
    if(orbit.lastPinch>0)state.distance=clamp(state.distance-(distance-orbit.lastPinch)*.12,15,110);
    orbit.lastPinch=distance;
  }
});
const releaseOrbit=e=>{orbit.pointers.delete(e.pointerId);orbit.lastPinch=0;};
ui.scene.addEventListener('pointerup',releaseOrbit);ui.scene.addEventListener('pointercancel',releaseOrbit);
ui.scene.addEventListener('lostpointercapture',releaseOrbit);
ui.scene.addEventListener('wheel',e=>{e.preventDefault();state.distance=clamp(state.distance+e.deltaY*.035,15,110);},{passive:false});
const keyDown=e=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  input.keys.add(k);
  if(e.repeat)return;
  if(k==='1'||k==='2'||k==='3')selectVehicle(+k-1);
  if(k===' ')startAction();
  if(k==='c')cycleCamera();
  if(k==='h')toggleHelp();
};
window.addEventListener('keydown',keyDown);
window.addEventListener('keyup',e=>input.keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{input.keys.clear();resetTouchInputs();orbit.pointers.clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTouchInputs();});
ui.actionButton.addEventListener('click',startAction);
ui.mobileActionButton.addEventListener('click',startAction);
function cycleCamera(){state.cameraMode=(state.cameraMode+1)%3;state.distance=[46,25,82][state.cameraMode];state.pitch=[.79,.4,1.25][state.cameraMode];toast(['TACTICAL CHASE CAMERA','LOW-LEVEL FOLLOW CAMERA','HIGH-ALTITUDE COMMAND CAMERA'][state.cameraMode]);}
ui.cameraButton.addEventListener('click',cycleCamera);
function toggleHelp(){resetTouchInputs();ui.helpOverlay.classList.toggle('hidden');}
ui.helpButton.addEventListener('click',toggleHelp);
ui.closeHelp.addEventListener('click',toggleHelp);
ui.helpDone.addEventListener('click',toggleHelp);
ui.weatherButton.addEventListener('click',()=>{
  state.storm=!state.storm;
  scene.background.set(state.storm?0x52646a:0x8199a0);
  scene.fog.color.set(state.storm?0x52646a:0x8199a0);
  scene.fog.density=state.storm?.013:.0042;
  sun.intensity=state.storm?1.15:3.2;
  hemi.intensity=state.storm?1.5:2.4;
  ui.weatherLabel.textContent=state.storm?'RAIN / 2 KM':'CLEAR / 12 KM';
  ui.weatherButton.firstChild.textContent=state.storm?'☂ ':'☀ ';
  toast(state.storm?'WEATHER SHIFT — STORM FRONT':'WEATHER SHIFT — CLEAR SKY');
});
ui.soundButton.addEventListener('click',()=>{
  state.sound=!state.sound;
  ui.soundButton.lastElementChild.textContent=state.sound?'AUDIO ON':'AUDIO OFF';
  beep(440,.2);
});
function start(){
  if(state.started)return;
  state.started=true;
  ui.startOverlay.classList.add('hidden');
  renderFleet();
  toast('ENGINEER BATTALION DEPLOYED — OPEN THE PASS');
  ui.scene.focus?.();
}
ui.startButton.addEventListener('click',start);
ui.restartButton.addEventListener('click',()=>location.reload());

// Mobile analog pad plus independent hold-to-drive pedals. Each uses pointer capture,
// so fingers can move off buttons without leaving the vehicle accelerating forever.
let joyId=null;
function resetTouchInputs(){
  joyId=null;input.forward=0;input.steer=0;input.pedalForward=0;input.pedalReverse=0;
  ui.joystickThumb.style.transform='translate(0,0)';
  ui.forwardButton.classList.remove('pressed');ui.reverseButton.classList.remove('pressed');
}
function joystickMove(e){
  if(e.pointerId!==joyId)return;
  const bounds=ui.joystick.getBoundingClientRect();
  const cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;
  const limit=bounds.width*.32,len=Math.hypot(dx,dy);
  if(len>limit){dx*=limit/len;dy*=limit/len;}
  const deadzone=.13;
  input.steer=Math.abs(dx/limit)<deadzone?0:dx/limit;
  input.forward=Math.abs(dy/limit)<deadzone?0:-dy/limit;
  ui.joystickThumb.style.transform=`translate(${dx}px,${dy}px)`;
}
ui.joystick.addEventListener('pointerdown',e=>{
  if(!state.started||joyId!==null)return;
  e.preventDefault();joyId=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);joystickMove(e);
});
ui.joystick.addEventListener('pointermove',joystickMove);
function joystickEnd(e){
  if(e.pointerId!==joyId)return;
  joyId=null;input.steer=0;input.forward=0;ui.joystickThumb.style.transform='translate(0,0)';
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])ui.joystick.addEventListener(event,joystickEnd);
function bindPedal(el,key){
  let pointer=null;
  el.addEventListener('pointerdown',e=>{
    if(!state.started||state.won||pointer!==null)return;
    e.preventDefault();pointer=e.pointerId;el.setPointerCapture(pointer);
    input[key]=1;el.classList.add('pressed');
  });
  function release(e){
    if(e.pointerId!==pointer)return;
    pointer=null;input[key]=0;el.classList.remove('pressed');
  }
  for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);
  window.addEventListener('blur',()=>{pointer=null;input[key]=0;el.classList.remove('pressed');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer=null;input[key]=0;el.classList.remove('pressed');}});
}
bindPedal(ui.forwardButton,'pedalForward');
bindPedal(ui.reverseButton,'pedalReverse');

// Tactical minimap. The projected corridor is 120 metres wide and 240 metres long.
const map=ui.minimap.getContext('2d');
function drawMap(){
  if(!map)return;
  const w=ui.minimap.width,h=ui.minimap.height;
  map.clearRect(0,0,w,h);
  map.fillStyle='#17323b';map.fillRect(0,0,w,h);
  const mx=x=>w/2+x/126*w,mz=z=>h-(z+120)/240*h;
  map.strokeStyle='rgba(194,223,218,.08)';map.lineWidth=1;
  for(let i=0;i<8;i++){let x=i*w/7;map.beginPath();map.moveTo(x,0);map.lineTo(x,h);map.stroke();}
  for(let i=0;i<9;i++){let y=i*h/8;map.beginPath();map.moveTo(0,y);map.lineTo(w,y);map.stroke();}
  map.fillStyle='#407c82';map.fillRect(0,mz(34.5),w,mz(11.7)-mz(34.5));
  map.fillStyle='#575950';map.fillRect(mx(-7),mz(11.7),mx(7)-mx(-7),mz(-116)-mz(11.7));
  map.fillRect(mx(-7),mz(115),mx(7)-mx(-7),mz(34.5)-mz(115));
  if(objectives[1].done){map.fillStyle='#c6ae79';map.fillRect(mx(-7),mz(34.5),mx(7)-mx(-7),mz(11.7)-mz(34.5));}
  for(let i=0;i<22;i++){
    const x=((i*37)%109)-55,z=((i*43)%226)-110;
    if(Math.abs(x)<10||Math.abs(z-23)<17)continue;
    map.fillStyle='#44634f';map.beginPath();map.arc(mx(x),mz(z),2.5,0,PI*2);map.fill();
  }
  for(const o of objectives){
    if(o.done||o.id==='dispatch'&&!objectives.slice(0,3).every(v=>v.done))continue;
    const x=mx(o.x),y=mz(o.z);
    map.strokeStyle=o.unit===active().id||o.id==='dispatch'?'#ffbf73':'#b9c9c2';map.lineWidth=1.2;
    map.beginPath();map.arc(x,y,5+Math.sin(state.elapsed*2)*1.5,0,PI*2);map.stroke();
    map.beginPath();map.moveTo(x-8,y);map.lineTo(x+8,y);map.moveTo(x,y-8);map.lineTo(x,y+8);map.stroke();
  }
  for(const truck of convoy){map.fillStyle=state.convoy?'#8bdfa6':'#5e8a77';map.fillRect(mx(truck.x)-2,mz(truck.z)-3,4,6);}
  units.forEach((u,i)=>{
    const x=mx(u.x),y=mz(u.z);
    map.save();map.translate(x,y);map.rotate(u.heading);
    map.fillStyle=i===state.selected?'#ffb95e':'#b5d1c8';
    map.beginPath();map.moveTo(0,-6);map.lineTo(-4,5);map.lineTo(4,5);map.closePath();map.fill();map.restore();
  });
  map.fillStyle='rgba(218,239,237,.55)';map.font='8px monospace';map.fillText('N ↑',w-25,12);
  map.strokeStyle='#a5d1c755';map.strokeRect(.5,.5,w-1,h-1);
}
const projector=new THREE.Vector3();
function updateMarker(){
  const objective=objectives.find(o=>o.unit===active().id&&!o.done) || (objectives.slice(0,3).every(o=>o.done)&&!state.convoy?objectives[3]:null);
  if(!objective){ui.targetMarker.style.display='none';return;}
  projector.set(objective.x,groundY(objective.x,objective.z)+7,objective.z).project(camera);
  if(projector.z<-1||projector.z>1||Math.abs(projector.x)>1||Math.abs(projector.y)>1){ui.targetMarker.style.display='none';return;}
  ui.targetMarker.style.display='block';
  ui.targetMarker.style.left=`${(projector.x*.5+.5)*window.innerWidth}px`;
  ui.targetMarker.style.top=`${(-projector.y*.5+.5)*window.innerHeight}px`;
}
let last=performance.now(),hudCounter=0;
function update(dt){
  state.elapsed+=dt;
  if(!state.started||state.won)return;
  const u=active();
  const pedal=input.pedalForward-input.pedalReverse;
  const throttle=clamp((input.keys.has('w')||input.keys.has('arrowup')?1:0)-(input.keys.has('s')||input.keys.has('arrowdown')?1:0)+(pedal||input.forward),-1,1);
  const steering=clamp((input.keys.has('d')||input.keys.has('arrowright')?1:0)-(input.keys.has('a')||input.keys.has('arrowleft')?1:0)+input.steer,-1,1);
  if(!state.working){
    const desired=throttle*u.maxSpeed*(throttle<0?.52:1);
    u.speed=THREE.MathUtils.damp(u.speed,desired,throttle===0?5:2.3,dt);
    if(Math.abs(u.speed)<.03)u.speed=0;
    if(Math.abs(u.speed)>.15)u.heading+=steering*u.turn*dt*(.42+Math.min(Math.abs(u.speed)/u.maxSpeed,.75))*(u.speed<0?-1:1);
    const nx=clamp(u.x+Math.sin(u.heading)*u.speed*dt,-117,117);
    const nz=clamp(u.z+Math.cos(u.heading)*u.speed*dt,-117,117);
    const needsBridge=nz>12&&nz<35;
    if(needsBridge&&(!objectives[1].done||state.bridgeBuild>=0&&state.bridgeBuild<8*.29)&&Math.abs(nx)<125){
      // Impassable water until all bridge bays are deployed.
      u.speed=0;
      if(state.elapsed-state.lastWarning>4){toast('RIVER IMPASSABLE — BRIDGE REQUIRED');state.lastWarning=state.elapsed;}
    }else if(needsBridge&&Math.abs(nx)>6.3){
      u.speed=0;
      if(state.elapsed-state.lastWarning>4){toast('STAY ON THE BRIDGE DECK');state.lastWarning=state.elapsed;}
    }else{
      u.x=nx;u.z=nz;
    }
  }else{
    u.speed=THREE.MathUtils.damp(u.speed,0,7,dt);
    state.workTime+=dt;
    if(state.working.id==='clear'){
      const count=Math.floor(state.workTime/state.workDuration*stones.length);
      stones.forEach((s,i)=>{if(i<count)s.visible=false;});
    }
    if(state.workTime>=state.workDuration)finishAction(state.working);
  }
  syncUnit(u);
  if(state.bridgeBuild>=0){
    state.bridgeBuild+=dt;
    bridgeSegments.forEach((g,i)=>{g.visible=state.bridgeBuild>=i*.27;});
    if(state.bridgeBuild>=8*.27){state.bridgeBuild=-1;bridgeSegments.forEach(g=>g.visible=true);}
  }
  if(state.convoy){
    let allArrived=true;
    convoy.forEach((truck,i)=>{
      truck.z=Math.min(96-i*4,truck.z+7.8*dt);
      const turn=(i===0?0:Math.sin(state.elapsed*.28+i)*.05);
      truck.x=turn;
      truck.mesh.position.set(truck.x,driveY(truck.x,truck.z)+.12,truck.z);
      truck.mesh.rotation.y=0;
      if(truck.z<96-i*4)allArrived=false;
    });
    if(allArrived){objectives[3].done=true;state.won=true;state.convoy=false;renderObjectives();ui.victoryTime.textContent=`OPERATION TIME // ${Math.floor(state.elapsed/60).toString().padStart(2,'0')}:${Math.floor(state.elapsed%60).toString().padStart(2,'0')}`;window.setTimeout(()=>ui.victoryOverlay.classList.remove('hidden'),700);toast('ALL CONVOY VEHICLES ARRIVED — MISSION SUCCESS');}
  }
  rings.forEach((r,i)=>{r.diamond.rotation.y+=dt*.9;r.diamond.position.y=5.1+Math.sin(state.elapsed*2.1+i)*.3;r.outline.material.opacity=.54+.17*Math.sin(state.elapsed*1.6+i);});
  riverRipples.forEach((m,i)=>{m.position.x+=dt*(i%2?-.3:.35);if(m.position.x>112)m.position.x=-112;if(m.position.x< -112)m.position.x=112;});
  if(ui.fleet.querySelector('.selected')===null)renderFleet();
}
function drawFrame(now){
  requestAnimationFrame(drawFrame);
  let dt=Math.min(.05,(now-last)/1000);last=now;
  update(dt);
  const u=active();
  const target=V(u.x,groundY(u.x,u.z)+2.3,u.z);
  const a=state.orbit+u.heading;
  const dist=state.distance;
  const desired=target.clone().add(V(Math.sin(a)*Math.cos(state.pitch)*dist,Math.sin(state.pitch)*dist,Math.cos(a)*Math.cos(state.pitch)*dist));
  camera.position.lerp(desired,1-Math.exp(-dt*(state.started?3.6:1.6)));
  camera.lookAt(target);
  if(state.storm&&state.started){
    const tint=Math.sin(state.elapsed*.5)*.04;
    scene.fog.density=.013+tint*.002;
  }
  renderer.render(scene,camera);
  hudCounter+=dt;
  if(hudCounter>.12){
    hudCounter=0;
    ui.speedValue.textContent=Math.round(Math.abs(u.speed)*3.6).toString().padStart(2,'0');
    ui.headingValue.textContent=(`${Math.round(((u.heading*180/PI)%360+360)%360)}`.padStart(3,'0'))+'°';
    updateAction();drawMap();updateMarker();
  }
}
function resize(){
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.fov=window.innerWidth<760?62:58;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
}
window.addEventListener('resize',resize);
renderFleet();
ui.loader.classList.add('hidden');
requestAnimationFrame(drawFrame);