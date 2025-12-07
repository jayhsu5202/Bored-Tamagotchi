import * as THREE from 'three';
import { GameStats, Species } from '../types';
import { COLORS, STAT_DECAY_RATE, EVOLUTION_THRESHOLD_TIME, CHICKEN_PALETTES, PIG_PALETTES } from '../constants';

// Pseudo-Random Number Generator for deterministic traits
class PRNG {
    private seed: number;
    constructor(seedStr: string) {
        this.seed = seedStr.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    range(min: number, max: number) {
        return min + this.next() * (max - min);
    }
    bool() {
        return this.next() > 0.5;
    }
    pick<T>(arr: T[]): T {
        return arr[Math.floor(this.next() * arr.length)];
    }
}

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  // Interaction
  private isDragging: boolean = false;
  private dragPlane: THREE.Plane;
  private dragOffset: THREE.Vector3;
  
  // Game Objects
  private petRoot: THREE.Group; 
  private petModel: THREE.Group; 
  private shadowMesh: THREE.Mesh;
  private poops: THREE.Group;
  private foodItem: THREE.Group | null = null;
  private clouds: THREE.Group;
  
  // Pet Parts (for animation)
  private parts: {
      head: THREE.Object3D;
      wings?: THREE.Object3D[]; // Only for Chicken
      ears?: THREE.Object3D[];  // Only for Pig
      legs: THREE.Object3D[];
      tail: THREE.Object3D;
      body: THREE.Object3D;
  } | null = null;

  // State
  private stats: GameStats;
  private animationId: number = 0;
  private onStatsUpdate: (stats: GameStats) => void;
  private lastTime: number = 0;
  private highStatsDuration: number = 0;
  private lastStatsEmit: number = 0;
  
  // Action State
  private currentState: 'IDLE' | 'WALK' | 'EAT' | 'SLEEP' | 'PLAY' | 'EXERCISE' | 'DRAGGED' = 'IDLE';
  private targetPosition: THREE.Vector3 | null = null;
  private actionTimer: number = 0;
  private previousState: any = 'IDLE';
  private isPhotoMode: boolean = false;
  
  // Interaction Targets
  private cursorWorldPos: THREE.Vector3 = new THREE.Vector3();

  constructor(container: HTMLElement, onStatsUpdate: (stats: GameStats) => void) {
    this.container = container;
    this.onStatsUpdate = onStatsUpdate;
    
    // Default stats if none provided via load
    this.stats = {
      hunger: 80,
      hygiene: 100,
      happiness: 80,
      energy: 100,
      weight: 50, // Default normal weight
      isSleeping: false,
      isAlive: true,
      evolutionStage: 0,
      seed: Math.random().toString(36).substring(7),
      name: 'Loading...',
      species: Math.random() > 0.5 ? 'pig' : 'chicken',
    };

    // Three.js Init
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    
    // Less dense fog to see clearly
    this.scene.fog = new THREE.Fog(COLORS.background, 30, 90);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 150);
    // Adjusted camera to be higher and look down more to avoid obstruction
    this.camera.position.set(0, 24, 24); 
    this.camera.lookAt(0, 0, 0);

    // preserveDrawingBuffer is needed for screenshots
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Perf cap
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragOffset = new THREE.Vector3();

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffee, 0.7);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    // Optimize shadow cam
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    this.scene.add(dirLight);

    // Environment
    this.createEnvironment();

    // Groups
    this.petRoot = new THREE.Group();
    this.petModel = new THREE.Group();
    this.petRoot.add(this.petModel);
    this.scene.add(this.petRoot);
    
    // Blob shadow for pet
    const shadowGeo = new THREE.CircleGeometry(0.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.05;
    this.petRoot.add(this.shadowMesh);
    
    this.poops = new THREE.Group();
    this.scene.add(this.poops);

    this.clouds = new THREE.Group();
    this.scene.add(this.clouds);
    this.generateClouds();

    // Initial Gen
    this.generatePet(this.stats.seed);

    // Events
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchend', this.onMouseUp);

    // Loop
    this.lastTime = performance.now();
    this.animate();
  }

  // --- Helpers ---
  private emitStats() {
      // Pass a shallow copy to ensure React detects the change
      this.onStatsUpdate({ ...this.stats });
  }

  private createBox(w: number, h: number, d: number, color: number, x=0, y=0, z=0) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, flatShading: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(x, y, z);
      return mesh;
  }

  public loadState(newStats: GameStats) {
      // Force a full reset of state
      this.isDragging = false;
      this.targetPosition = null;
      this.currentState = 'IDLE';
      this.petRoot.position.set(0, 0, 0);
      this.petRoot.rotation.set(0, 0, 0);
      
      // Clean up existing scene items
      if (this.foodItem) {
          this.scene.remove(this.foodItem);
          this.foodItem.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                  child.geometry.dispose();
                  if (Array.isArray(child.material)) {
                      child.material.forEach((m: THREE.Material) => m.dispose());
                  } else {
                      child.material.dispose();
                  }
              }
          });
          this.foodItem = null;
      }
      while(this.poops.children.length > 0) {
          const p = this.poops.children[0];
          this.poops.remove(p);
          // Recursively dispose geometry
          p.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                  child.geometry.dispose();
                  if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                  else child.material.dispose();
              }
          });
      }

      this.stats = { ...newStats };
      // Fallback for older saves
      if (!this.stats.species) this.stats.species = 'chicken';
      if (typeof this.stats.weight === 'undefined') this.stats.weight = 50;
      
      this.generatePet(this.stats.seed);
      if (this.stats.isSleeping) {
          this.currentState = 'SLEEP';
          this.petModel.rotation.z = Math.PI / 2;
          this.petModel.position.y = 0.5;
          this.shadowMesh.visible = false;
      }
      this.emitStats();
  }

  public getStats() { return this.stats; }

  // --- Photo Mode ---
  public setPhotoMode(enabled: boolean) {
      this.isPhotoMode = enabled;
      if (enabled) {
          this.previousState = this.currentState;
          this.currentState = 'IDLE';
          this.targetPosition = null;
          this.petRoot.position.set(0, 0, 0);
          this.petRoot.rotation.set(0, 0, 0);
          this.petModel.rotation.set(0, 0, 0);
          
          // Zoom in CLOSE for portrait mode
          const startPos = this.camera.position.clone();
          const endPos = new THREE.Vector3(0, 5, 7); 
          
          // Look slightly up at the pet body instead of the floor
          const startLook = new THREE.Vector3(0, 0, 0);
          const endLook = new THREE.Vector3(0, 1.2, 0);

          let alpha = 0;
          const anim = () => {
              alpha += 0.04;
              if(alpha > 1) alpha = 1;
              const t = 1 - Math.pow(1 - alpha, 3); // Cubic ease out
              
              this.camera.position.lerpVectors(startPos, endPos, t);
              
              const currentLook = new THREE.Vector3().lerpVectors(startLook, endLook, t);
              this.camera.lookAt(currentLook);
              
              if(alpha < 1) requestAnimationFrame(anim);
          };
          anim();
      } else {
          // Reset to standard game view
          const startPos = this.camera.position.clone();
          const endPos = new THREE.Vector3(0, 24, 24);

          // Return lookAt to origin
          const startLook = new THREE.Vector3(0, 1.2, 0);
          const endLook = new THREE.Vector3(0, 0, 0);

          let alpha = 0;
          const anim = () => {
              alpha += 0.04;
              if(alpha > 1) alpha = 1;
              const t = 1 - Math.pow(1 - alpha, 3);
              
              this.camera.position.lerpVectors(startPos, endPos, t);
              
              const currentLook = new THREE.Vector3().lerpVectors(startLook, endLook, t);
              this.camera.lookAt(currentLook);
              
              if(alpha < 1) requestAnimationFrame(anim);
          };
          anim();
      }
  }

  public setPetRotation(angleRad: number) {
      if (this.isPhotoMode) {
          this.petRoot.rotation.y = angleRad;
      }
  }

  public takeScreenshot(): string {
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
  }

  // --- Procedural Generation Router ---
  public generatePet(seed: string) {
      this.stats.seed = seed;
      
      // 1. Cleanup existing model safely
      if (this.petModel) {
        // Bug Fix: Deep cleanup
        this.petRoot.remove(this.petModel);
        this.petModel.traverse((child) => {
             if (child instanceof THREE.Mesh) {
                 child.geometry.dispose();
                 if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                 else child.material.dispose();
             }
        });
        // Clear children array
        while(this.petModel.children.length > 0) this.petModel.remove(this.petModel.children[0]);
        this.petRoot.add(this.petModel);
      }

      const rng = new PRNG(seed);
      
      try {
        // Select species generation based on stats
        if (this.stats.species === 'pig') {
            this.generatePig(rng);
        } else {
            this.generateChicken(rng);
        }
      } catch (e) {
          console.error("Generation failed, falling back to chicken", e);
          this.stats.species = 'chicken';
          this.generateChicken(rng);
      }
      
      // Spawn Effect
      this.spawnParticle(new THREE.Vector3(0, 1, 0), 0xFFFFFF, 20);
  }

  // --- CHICKEN GEN ---
  private generateChicken(rng: PRNG) {
    const palette = rng.pick(CHICKEN_PALETTES) || CHICKEN_PALETTES[0];
    const combType = Math.floor(rng.range(0, 4));
    
    // Scale
    const scale = this.stats.evolutionStage > 0 ? 1.5 : 1.0;
    
    // Body
    const bodyW = 1.2 * scale;
    const bodyH = 1.1 * scale;
    const bodyD = 1.3 * scale;
    const legH = 0.5 * scale;

    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = legH + (bodyH / 2);

    bodyGroup.add(this.createBox(bodyW, bodyH, bodyD, palette.body, 0, 0, 0));
    if (rng.bool()) {
        bodyGroup.add(this.createBox(bodyW * 0.7, bodyH * 0.5, 0.1, 0xFFFFFF, 0, -bodyH*0.1, bodyD/2 + 0.05));
    }
    this.petModel.add(bodyGroup);

    // Head
    const headGroup = new THREE.Group();
    const headSize = 0.8 * scale;
    headGroup.position.set(0, bodyH/2, bodyD/3);
    headGroup.add(this.createBox(headSize, headSize, headSize, palette.body, 0, headSize/2, 0));
    
    // Eyes
    const eyeSize = 0.12 * scale;
    const eyeSpread = headSize * 0.3;
    const eyeH = headSize * 0.6;
    const eyeD = headSize/2 + 0.05;
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, 0.05), eyeMat);
    leftEye.position.set(-eyeSpread, eyeH, eyeD);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, 0.05), eyeMat);
    rightEye.position.set(eyeSpread, eyeH, eyeD);
    headGroup.add(leftEye, rightEye);

    // Beak
    const beakSize = 0.2 * scale;
    headGroup.add(this.createBox(beakSize, beakSize, beakSize*1.5, 0xFF9800, 0, eyeH - 0.2*scale, eyeD + 0.1));

    // Comb
    const combGroup = new THREE.Group();
    combGroup.position.y = headSize;
    if (combType === 0) { // Mohawk
        for(let i=0; i<3; i++) {
            combGroup.add(this.createBox(0.15*scale, 0.25*scale - (i*0.05), 0.2*scale, palette.comb, 0, 0.1*scale, (i-1)*0.2*scale));
        }
    } else { // Flat/Simple
        combGroup.add(this.createBox(0.2*scale, 0.1*scale, 0.4*scale, palette.comb, 0, 0.05*scale, -0.1*scale));
    }
    headGroup.add(combGroup);
    bodyGroup.add(headGroup);

    // Wings
    const wings: THREE.Object3D[] = [];
    const wingW = 0.2 * scale;
    const wingH = 0.6 * scale;
    const wingD = 0.8 * scale;
    
    const leftWing = new THREE.Group();
    leftWing.add(this.createBox(wingW, wingH, wingD, palette.sec, -wingW/2, -wingH/3, 0));
    leftWing.position.set(-bodyW/2, 0.2*scale, 0); 
    bodyGroup.add(leftWing);
    wings.push(leftWing);

    const rightWing = new THREE.Group();
    rightWing.add(this.createBox(wingW, wingH, wingD, palette.sec, wingW/2, -wingH/3, 0));
    rightWing.position.set(bodyW/2, 0.2*scale, 0);
    bodyGroup.add(rightWing);
    wings.push(rightWing);

    // Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -bodyD/2);
    const tailGeo = this.createBox(0.8*scale, 0.6*scale, 0.1*scale, palette.sec, 0, 0.3*scale, 0);
    tailGroup.add(tailGeo);
    tailGroup.rotation.x = -Math.PI / 6;
    bodyGroup.add(tailGroup);

    // Legs
    const legs: THREE.Object3D[] = [];
    const legThick = 0.12 * scale;
    const leftLeg = new THREE.Group();
    leftLeg.add(this.createBox(legThick, legH, legThick, 0xFF9800, 0, -legH/2, 0));
    leftLeg.add(this.createBox(0.4*scale, 0.1*scale, 0.5*scale, 0xFF9800, 0, -legH, 0.15*scale));
    leftLeg.position.set(-bodyW * 0.25, legH, 0); 
    this.petModel.add(leftLeg);
    legs.push(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.add(this.createBox(legThick, legH, legThick, 0xFF9800, 0, -legH/2, 0));
    rightLeg.add(this.createBox(0.4*scale, 0.1*scale, 0.5*scale, 0xFF9800, 0, -legH, 0.15*scale));
    rightLeg.position.set(bodyW * 0.25, legH, 0);
    this.petModel.add(rightLeg);
    legs.push(rightLeg);

    this.parts = { head: headGroup, wings, legs, tail: tailGroup, body: bodyGroup };
    this.setDefaultName(rng, palette.name, ['Clucker', 'Pecker', 'Wing', 'Beak']);
  }

  // --- PIG GEN ---
  private generatePig(rng: PRNG) {
      const palette = rng.pick(PIG_PALETTES) || PIG_PALETTES[0];
      const scale = this.stats.evolutionStage > 0 ? 1.5 : 1.0;
      
      const bodyW = 1.3 * scale;
      const bodyH = 1.1 * scale;
      const bodyD = 1.6 * scale;
      const legH = 0.4 * scale;

      const bodyGroup = new THREE.Group();
      bodyGroup.position.y = legH + (bodyH / 2);

      // Main Body
      bodyGroup.add(this.createBox(bodyW, bodyH, bodyD, palette.body, 0, 0, 0));
      // Spots?
      if (rng.bool() && palette.name === 'Spotted') {
           bodyGroup.add(this.createBox(bodyW*0.2, bodyH*0.2, 0.1, 0x333333, bodyW/2, 0, 0));
           bodyGroup.add(this.createBox(bodyW*0.2, bodyH*0.2, 0.1, 0x333333, -bodyW/2, 0.2, 0.4));
      }

      this.petModel.add(bodyGroup);

      // Head
      const headGroup = new THREE.Group();
      const headSize = 0.9 * scale;
      headGroup.position.set(0, bodyH*0.2, bodyD/2); // Front of body, slightly up
      
      // Head shape
      headGroup.add(this.createBox(headSize, headSize*0.9, headSize*0.8, palette.body, 0, 0, 0));
      
      // Snout
      const snoutW = headSize * 0.5;
      const snoutH = headSize * 0.4;
      headGroup.add(this.createBox(snoutW, snoutH, 0.2*scale, palette.nose, 0, -0.1*scale, headSize/2));

      // Nostrils
      const nostrilSz = 0.05 * scale;
      const nColor = 0x3E2723;
      headGroup.add(this.createBox(nostrilSz, nostrilSz, 0.05, nColor, -snoutW*0.2, -0.1*scale, headSize/2 + 0.1*scale));
      headGroup.add(this.createBox(nostrilSz, nostrilSz, 0.05, nColor, snoutW*0.2, -0.1*scale, headSize/2 + 0.1*scale));

      // Eyes
      const eyeSize = 0.12 * scale;
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, 0.05), eyeMat);
      leftEye.position.set(-headSize*0.3, 0.15*scale, headSize/2 - 0.1);
      const rightEye = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, 0.05), eyeMat);
      rightEye.position.set(headSize*0.3, 0.15*scale, headSize/2 - 0.1);
      headGroup.add(leftEye, rightEye);

      // Ears
      const ears: THREE.Object3D[] = [];
      const earW = 0.15 * scale;
      const earH = 0.3 * scale;
      
      const leftEar = new THREE.Group();
      leftEar.add(this.createBox(earW, earH, 0.1*scale, palette.body, 0, earH/2, 0));
      leftEar.position.set(-headSize*0.35, headSize*0.4, -headSize*0.1);
      leftEar.rotation.z = Math.PI / 6;
      headGroup.add(leftEar);
      ears.push(leftEar);

      const rightEar = new THREE.Group();
      rightEar.add(this.createBox(earW, earH, 0.1*scale, palette.body, 0, earH/2, 0));
      rightEar.position.set(headSize*0.35, headSize*0.4, -headSize*0.1);
      rightEar.rotation.z = -Math.PI / 6;
      headGroup.add(rightEar);
      ears.push(rightEar);

      bodyGroup.add(headGroup);

      // Tail (Curly)
      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, bodyH*0.1, -bodyD/2);
      
      const tailSeg1 = this.createBox(0.1*scale, 0.1*scale, 0.3*scale, palette.nose, 0, 0, -0.15*scale);
      tailGroup.add(tailSeg1);
      const tailSeg2 = this.createBox(0.1*scale, 0.3*scale, 0.1*scale, palette.nose, 0, 0.15*scale, -0.3*scale);
      tailGroup.add(tailSeg2);

      bodyGroup.add(tailGroup);

      // Legs (4 legs)
      const legs: THREE.Object3D[] = [];
      const legThick = 0.25 * scale;
      const legPositions = [
          {x: -bodyW*0.3, z: bodyD*0.3}, // Front Left
          {x: bodyW*0.3, z: bodyD*0.3},  // Front Right
          {x: -bodyW*0.3, z: -bodyD*0.3}, // Back Left
          {x: bodyW*0.3, z: -bodyD*0.3}, // Back Right
      ];

      legPositions.forEach(pos => {
          const leg = new THREE.Group();
          leg.add(this.createBox(legThick, legH, legThick, palette.sec, 0, -legH/2, 0));
          // Hoof
          leg.add(this.createBox(legThick*1.1, 0.1*scale, legThick*1.1, 0x3E2723, 0, -legH, 0));
          leg.position.set(pos.x, legH, pos.z);
          this.petModel.add(leg);
          legs.push(leg);
      });

      this.parts = { head: headGroup, ears, legs, tail: tailGroup, body: bodyGroup };
      this.setDefaultName(rng, palette.name, ['Oink', 'Snort', 'Truffle', 'Porky', 'Bacon']);
  }

  private setDefaultName(rng: PRNG, paletteName: string, suffixes: string[]) {
    // Only set name if it's default
    if(this.stats.name === 'Loading...' || this.stats.name === '...' || !this.stats.name || this.stats.name === 'Voxel') {
        const namePrefix = paletteName.split(' ')[0];
        const nameSuffix = suffixes[Math.floor(rng.next() * suffixes.length)];
        this.stats.name = `${namePrefix} ${nameSuffix}`;
    }
  }

  private createEnvironment() {
    // 1. Rounded Platform
    const geometry = new THREE.CylinderGeometry(15, 15, 4, 64);
    const material = new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 1 });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.y = -2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Darker soil bottom
    const soilGeo = new THREE.CylinderGeometry(14.8, 12, 3, 64);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = -5;
    this.scene.add(soil);

    // 2. Procedural Grass
    const bladeGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);
    bladeGeo.translate(0, 0.2, 0);
    const bladeMat = new THREE.MeshLambertMaterial({ color: COLORS.groundDark });
    const bladeCount = 1000;
    const mesh = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeCount);
    
    const dummy = new THREE.Object3D();
    const rng = new PRNG("env");
    
    for (let i = 0; i < bladeCount; i++) {
        const r = rng.range(0, 14);
        const theta = rng.range(0, Math.PI * 2);
        dummy.position.set(r * Math.cos(theta), 0, r * Math.sin(theta));
        dummy.rotation.y = rng.range(0, Math.PI);
        dummy.scale.set(1, rng.range(0.8, 1.5), 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // 3. Decor
    for(let i=0; i<8; i++) {
        const rock = this.createBox(
            rng.range(0.4, 1.0), rng.range(0.2, 0.6), rng.range(0.4, 1.0), 
            COLORS.stone, 
            rng.range(-12, 12), 0.1, rng.range(-12, 12)
        );
        rock.rotation.y = rng.range(0, Math.PI);
        this.scene.add(rock);
    }
  }

  private generateClouds() {
      while(this.clouds.children.length > 0) this.clouds.remove(this.clouds.children[0]);

      // Move clouds MUCH higher (Y > 50) so they don't block the camera view or interact with the pet
      for(let i=0; i<6; i++) {
          const cloud = new THREE.Group();
          const y = 50 + Math.random() * 20; 
          const z = (Math.random() - 0.5) * 60; 
          const x = (Math.random() - 0.5) * 60;
          cloud.position.set(x, y, z);
          
          const blocks = 3 + Math.floor(Math.random()*4);
          for(let j=0; j<blocks; j++) {
             const s = 4.0 + Math.random() * 3.0; // Larger clouds
             const mat = new THREE.MeshStandardMaterial({ 
                 color: 0xFFFFFF, 
                 transparent: true, 
                 opacity: 0.5,
                 flatShading: true,
                 depthWrite: false
             });
             const geo = new THREE.BoxGeometry(s, s*0.6, s);
             const mesh = new THREE.Mesh(geo, mat);
             mesh.position.set((Math.random()-0.5)*8, 0, (Math.random()-0.5)*8);
             cloud.add(mesh);
          }
          this.clouds.add(cloud);
      }
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  // --- Interaction (Dragging & Exercise) ---
  
  private onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY
      });
      this.onMouseDown(mouseEvent);
  }

  private onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY
      });
      this.onMouseMove(mouseEvent);
  }

  private onMouseDown = (event: MouseEvent) => {
      // Disable interaction in photo mode
      if (this.isPhotoMode) return;
      if(!this.stats.isAlive) return;
      
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // If Exercise Mode is active, we don't pick up the pet, we set targets
      if (this.currentState === 'EXERCISE') {
          return; // Mouse move handles target
      }

      const intersects = this.raycaster.intersectObjects(this.petModel.children, true);
      
      if(intersects.length > 0) {
          this.isDragging = true;
          this.previousState = this.currentState;
          this.currentState = 'DRAGGED';
          
          if(this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset)) {
              this.dragOffset.sub(this.petRoot.position);
          }
          this.play();
      }
  };

  private onMouseMove = (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersectPoint = new THREE.Vector3();

      if (this.currentState === 'EXERCISE') {
          // In exercise mode, track mouse intersection with ground plane
           if(this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
               this.cursorWorldPos.copy(intersectPoint);
               // Clamp to platform radius
               const maxRadius = 13;
               if (intersectPoint.length() > maxRadius) {
                   intersectPoint.normalize().multiplyScalar(maxRadius);
                   this.cursorWorldPos.copy(intersectPoint);
               }
           }
      }

      if(this.isDragging) {
          if(this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
              const newPos = intersectPoint.sub(this.dragOffset);
              // Safety check for NaN
              if (isNaN(newPos.x) || isNaN(newPos.z)) return;

              const maxRadius = 13;
              const dist = Math.sqrt(newPos.x*newPos.x + newPos.z*newPos.z);
              
              if(dist > maxRadius) {
                  const angle = Math.atan2(newPos.z, newPos.x);
                  newPos.x = Math.cos(angle) * maxRadius;
                  newPos.z = Math.sin(angle) * maxRadius;
              }

              this.petRoot.position.x = newPos.x;
              this.petRoot.position.z = newPos.z;
              this.petRoot.position.y = 2.5; 
          }
      }
  };

  private onMouseUp = () => {
      if(this.isDragging) {
          this.isDragging = false;

          // Restore correct state
          if (this.stats.isSleeping) {
            this.currentState = 'SLEEP';
            this.petModel.rotation.z = Math.PI / 2;
            this.petModel.position.y = 0.5;
            this.shadowMesh.visible = false;
          } else {
            this.currentState = 'IDLE';
            this.petRoot.position.y = 0; 
            this.petModel.rotation.z = 0;
            this.petModel.position.y = 0;
            this.shadowMesh.visible = true;
          }
          this.targetPosition = null;
      }
  };

  private spawnParticle(pos: THREE.Vector3, color: number, count = 5, isSweat = false) {
      for(let i=0; i<count; i++) {
        const size = isSweat ? 0.08 : 0.15;
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Offset
        mesh.position.copy(pos).add(new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)));
        this.scene.add(mesh);
        
        const vel = new THREE.Vector3((Math.random()-0.5)*0.2, Math.random()*0.3 + 0.1, (Math.random()-0.5)*0.2);
        
        const startTime = Date.now();
        const duration = isSweat ? 500 : 800;
        
        const animateParticle = () => {
          const now = Date.now();
          const progress = (now - startTime) / duration;
          if (progress >= 1) {
              this.scene.remove(mesh);
              mesh.geometry.dispose();
              (mesh.material as THREE.Material).dispose();
              return;
          }
          mesh.position.add(vel);
          vel.y -= 0.015; 
          if (!isSweat) mesh.rotation.x += 0.2;
          mesh.scale.setScalar(1 - progress);
          requestAnimationFrame(animateParticle);
        };
        animateParticle();
      }
  }

  // --- Actions ---

  public feed() {
    // Prevent feeding if already full, or allow if user wants to make pet fat
    // Changed logic: Can feed if not sleeping/dragged. If hunger > 90, increases weight.
    if (!this.stats.isAlive || this.foodItem || this.stats.isSleeping || this.isDragging) return;
    
    // Check if totally stuffed
    if (this.stats.hunger >= 100) {
        // If hunger is full, we can still feed to increase weight immediately?
        // Let's spawn food anyway, eating logic handles the weight gain
    }
    
    const group = new THREE.Group();
    // Kernel
    group.add(this.createBox(0.4, 0.6, 0.4, COLORS.food, 0, 0.3, 0));
    // Leaves
    group.add(this.createBox(0.5, 0.4, 0.1, 0x4CAF50, 0, 0.2, 0.2));
    
    // Spawn at valid random location
    const r = 3 + Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    // Ensure Y is high enough so it drops, but final resting position is 0
    group.position.set(r * Math.cos(theta), 6, r * Math.sin(theta));
    this.foodItem = group;
    this.scene.add(this.foodItem);
    
    this.targetPosition = new THREE.Vector3(group.position.x, 0, group.position.z);
    this.currentState = 'WALK';
  }

  public clean() {
    if (!this.stats.isAlive) return;
    let cleaned = false;
    while(this.poops.children.length > 0){ 
        this.spawnParticle(this.poops.children[0].position, 0x795548, 4); // Poop particles
        this.spawnParticle(this.poops.children[0].position, 0x4FC3F7, 6); // Water/Sparkle particles
        this.poops.remove(this.poops.children[0]); 
        cleaned = true;
    }
    if (cleaned) {
        this.stats.hygiene = 100;
        this.emitStats();
    }
  }

  public play() {
    if (!this.stats.isAlive || this.stats.isSleeping) return;
    
    this.stats.happiness = Math.min(100, this.stats.happiness + 15);
    this.stats.energy = Math.max(0, this.stats.energy - 5);
    
    this.spawnParticle(this.petRoot.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xFF4081, 8);
    
    // Only set animation state if not dragging, so we don't override drag pose
    if (!this.isDragging && this.currentState !== 'PLAY') {
        this.currentState = 'PLAY';
        this.actionTimer = 0;
    }
    
    this.emitStats();
  }

  public startExercise() {
      if (!this.stats.isAlive || this.stats.isSleeping || this.isDragging || this.stats.energy < 10) return;
      this.currentState = 'EXERCISE';
      this.actionTimer = 0;
      // Initialize cursor target near pet
      this.cursorWorldPos.copy(this.petRoot.position).add(new THREE.Vector3(1, 0, 1));
  }

  public sleep() {
    if (!this.stats.isAlive) return;
    this.stats.isSleeping = !this.stats.isSleeping;
    if (this.stats.isSleeping) {
        this.currentState = 'SLEEP';
        this.petModel.rotation.z = Math.PI / 2;
        this.petModel.position.y = 0.5;
        this.shadowMesh.visible = false;
    } else {
        this.currentState = 'IDLE';
        this.petModel.rotation.z = 0;
        this.petModel.position.y = 0;
        this.shadowMesh.visible = true;
    }
    this.emitStats();
  }

  private spawnPoop() {
    const poop = new THREE.Group();
    poop.add(this.createBox(0.3, 0.2, 0.3, COLORS.poop, 0, 0.1, 0));
    poop.add(this.createBox(0.15, 0.15, 0.15, COLORS.poop, 0, 0.25, 0));
    
    // Spawn behind pet
    const offset = new THREE.Vector3(0, 0, -1).applyEuler(this.petRoot.rotation);
    poop.position.copy(this.petRoot.position).add(offset);
    poop.position.y = 0; // On floor
    this.poops.add(poop);
  }

  // --- Main Loop ---

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    // Cloud Animation
    this.clouds.children.forEach(c => {
        c.position.x += 0.002 * dt;
        if (c.position.x > 80) c.position.x = -80;
    });

    if (!this.stats.isAlive) {
      if(this.petRoot) {
          this.petRoot.rotation.z = Math.PI / 2;
          this.petRoot.position.y = 0.2; // Lie on ground
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const t = now * 0.001;

    // 1. Stat Logic
    if (!this.isDragging && !this.isPhotoMode) {
        if (this.stats.isSleeping) {
            this.stats.energy = Math.min(100, this.stats.energy + (STAT_DECAY_RATE * 0.2 * dt));
            this.stats.hunger = Math.max(0, this.stats.hunger - (STAT_DECAY_RATE * 0.005 * dt)); 
        } else {
            this.stats.hunger = Math.max(0, this.stats.hunger - (STAT_DECAY_RATE * 0.015 * dt));
            this.stats.hygiene = Math.max(0, this.stats.hygiene - (STAT_DECAY_RATE * 0.01 * dt));
            this.stats.happiness = Math.max(0, this.stats.happiness - (STAT_DECAY_RATE * 0.02 * dt));
            this.stats.energy = Math.max(0, this.stats.energy - (STAT_DECAY_RATE * 0.01 * dt));

            if (this.stats.hunger <= 0 && Math.random() < 0.001) {
                // Chance to die if starving
                this.stats.isAlive = false;
            }

            // Poop logic: increased chance slightly to verify logic works
            if (this.stats.hygiene < 60 && Math.random() < 0.001) this.spawnPoop();
            if (this.poops.children.length > 0) this.stats.hygiene = Math.max(0, this.stats.hygiene - 0.05);
        }
    }

    // 2. Evolution
    if (this.stats.evolutionStage === 0 && this.stats.happiness > 90 && this.stats.hunger > 90) {
        this.highStatsDuration += dt;
        if (this.highStatsDuration > EVOLUTION_THRESHOLD_TIME) {
            this.stats.evolutionStage = 1;
            this.generatePet(this.stats.seed);
            this.spawnParticle(this.petRoot.position, 0xFFD54F, 30);
        }
    } else {
        this.highStatsDuration = 0;
    }
    
    // Throttle UI Updates
    if (now - this.lastStatsEmit > 100) {
        this.emitStats();
        this.lastStatsEmit = now;
    }

    // 3. Animation & Behavior Logic
    this.updateAnimation(dt, t);

    this.renderer.render(this.scene, this.camera);
  };

  private updateAnimation(dt: number, time: number) {
      if(!this.parts) return;
      
      const isChicken = this.stats.species === 'chicken';

      // --- FAT MECHANIC VISUALS ---
      // Scale body width based on weight (50 is normal, >50 gets wider)
      const weightFactor = Math.max(0, this.stats.weight - 50) / 100;
      const fatScale = 1 + weightFactor * 1.5; // Up to 2.5x width
      // Interpolate scale for smoothness
      this.parts.body.scale.x = THREE.MathUtils.lerp(this.parts.body.scale.x, fatScale, 0.1);
      this.parts.body.scale.z = THREE.MathUtils.lerp(this.parts.body.scale.z, fatScale, 0.1);
      // Slight vertical squash if very fat
      this.parts.body.scale.y = THREE.MathUtils.lerp(this.parts.body.scale.y, 1 - weightFactor * 0.2, 0.1);

      // --- BREATHING ---
      if (this.currentState !== 'SLEEP' && this.currentState !== 'DRAGGED') {
          this.parts.body.position.y = (this.parts.body.position.y * 0.9) + ((Math.sin(time * 3) * 0.05 + 0.6) * 0.1); 
          if(this.parts.wings) this.parts.wings.forEach(w => w.rotation.z = Math.sin(time * 5) * 0.1);
          if(this.parts.ears) this.parts.ears.forEach((e, i) => e.rotation.z = (i === 0 ? 1 : -1) * (Math.PI/6 + Math.sin(time * 2)*0.05));
      }

      if (this.isPhotoMode) return;

      // Heavy pet moves slower
      const speedModifier = Math.max(0.3, 1.0 - weightFactor);

      switch (this.currentState) {
          case 'IDLE':
              if (Math.random() < 0.01) this.petRoot.rotation.y += (Math.random()-0.5);
              if (Math.random() < 0.005 && !this.stats.isSleeping) {
                  const r = Math.random() * 8;
                  const theta = Math.random() * Math.PI * 2;
                  this.targetPosition = new THREE.Vector3(r*Math.cos(theta), 0, r*Math.sin(theta));
                  this.currentState = 'WALK';
              }
              this.parts.legs.forEach(l => l.rotation.x = 0);
              break;

          case 'WALK':
              if (this.targetPosition) {
                  const dir = new THREE.Vector3().subVectors(this.targetPosition, this.petRoot.position);
                  const dist = dir.length();
                  
                  const targetRot = Math.atan2(dir.x, dir.z);
                  let rotDiff = targetRot - this.petRoot.rotation.y;
                  while(rotDiff > Math.PI) rotDiff -= Math.PI*2;
                  while(rotDiff < -Math.PI) rotDiff += Math.PI*2;
                  this.petRoot.rotation.y += rotDiff * 0.1;

                  if (dist > 0.8) {
                      dir.normalize();
                      this.petRoot.position.add(dir.multiplyScalar(0.004 * dt * speedModifier));
                      this.animateWalk(time, isChicken, 1);
                  } else {
                      this.parts.body.position.y = 0.6;
                      if (this.foodItem) {
                          this.currentState = 'EAT';
                          this.actionTimer = 0;
                      } else {
                          this.currentState = 'IDLE';
                          this.targetPosition = null;
                      }
                  }
              }
              break;

          case 'EXERCISE':
              // Interactive Mode: Chase the cursor
              const chaseDir = new THREE.Vector3().subVectors(this.cursorWorldPos, this.petRoot.position);
              const chaseDist = chaseDir.length();
              
              const chaseRot = Math.atan2(chaseDir.x, chaseDir.z);
              let cRotDiff = chaseRot - this.petRoot.rotation.y;
              while(cRotDiff > Math.PI) cRotDiff -= Math.PI*2;
              while(cRotDiff < -Math.PI) cRotDiff += Math.PI*2;
              this.petRoot.rotation.y += cRotDiff * 0.2; // Turn faster

              if (chaseDist > 0.5) {
                  chaseDir.normalize();
                  // Run speed
                  const speed = 0.01 * dt * speedModifier; 
                  this.petRoot.position.add(chaseDir.multiplyScalar(speed));
                  
                  // Frantic animation
                  this.animateWalk(time, isChicken, 2.0); // 2x speed animation
                  
                  // Burn calories
                  this.stats.weight = Math.max(10, this.stats.weight - (0.01 * dt));
                  this.stats.energy = Math.max(0, this.stats.energy - (0.02 * dt));
                  this.stats.hygiene = Math.max(0, this.stats.hygiene - (0.005 * dt)); // Get sweaty
                  
                  // Sweat particles
                  if (Math.random() < 0.1) {
                      this.spawnParticle(this.petRoot.position.clone().add(new THREE.Vector3(0,1,0)), 0x4FC3F7, 1, true);
                  }
              } else {
                  // Reached cursor, idle but still panting
                  this.parts.body.position.y = 0.6 + Math.sin(time * 20) * 0.05;
              }

              // End exercise if tired or user stops input (handled by UI toggling state usually, or auto-stop)
              if (this.stats.energy < 5) {
                  this.currentState = 'IDLE';
              }
              break;

          case 'EAT':
              this.actionTimer += dt;
              this.parts.body.rotation.x = Math.abs(Math.sin(time * 20)) * 0.5;
              if (this.actionTimer > 2000) {
                  if (this.foodItem) {
                      this.scene.remove(this.foodItem);
                      this.foodItem = null;
                      // Logic: If already full, GET FAT
                      if (this.stats.hunger > 90) {
                          this.stats.weight = Math.min(100, this.stats.weight + 10);
                          this.stats.happiness = Math.max(0, this.stats.happiness - 5); // Overeating makes them sluggish/unhappy?
                      } else {
                          this.stats.hunger = Math.min(100, this.stats.hunger + 30);
                          // Eating restores a little bit of weight if underweight
                          if (this.stats.weight < 50) this.stats.weight += 2;
                      }
                      
                      this.spawnParticle(this.petRoot.position, 0xFFD54F, 10);
                  }
                  this.currentState = 'IDLE';
                  this.parts.body.rotation.x = 0;
                  this.emitStats();
              }
              break;
              
          case 'PLAY':
              this.actionTimer += dt;
              this.petRoot.rotation.y += 0.2;
              this.parts.body.position.y = 0.6 + Math.abs(Math.sin(time * 15));
              if(this.parts.wings) this.parts.wings.forEach(w => w.rotation.z = Math.sin(time * 30));
              
              if (this.actionTimer > 1500) {
                  this.currentState = 'IDLE';
                  this.parts.body.position.y = 0.6;
                  if(this.parts.wings) this.parts.wings.forEach(w => w.rotation.z = 0);
              }
              break;

          case 'DRAGGED':
              this.parts.legs.forEach((l, i) => l.rotation.x = Math.sin(time * 20 + i) * 0.5 + 0.5);
              if(this.parts.wings) this.parts.wings.forEach(w => w.rotation.z = Math.PI / 4 + Math.sin(time * 40) * 0.5);
              if(this.parts.ears) this.parts.ears.forEach(e => e.rotation.z += Math.sin(time * 40)*0.2);
              this.parts.body.rotation.x = 0.2;
              break;
      }
      
      // Falling food
      if (this.foodItem && this.foodItem.position.y > 0.1) {
          this.foodItem.position.y -= 0.01 * dt;
          if(this.foodItem.position.y < 0.1) this.foodItem.position.y = 0.1;
      }
  }

  private animateWalk(time: number, isChicken: boolean, speedMult: number) {
      if (!this.parts) return;
      const hopOffset = Math.abs(Math.sin(time * 12 * speedMult)) * 0.4;
      this.parts.body.position.y = 0.6 + hopOffset;
      
      const freq = 15 * speedMult;
      if (isChicken) {
          if (this.parts.legs[0]) this.parts.legs[0].rotation.x = Math.sin(time * freq) * 0.8;
          if (this.parts.legs[1]) this.parts.legs[1].rotation.x = -Math.sin(time * freq) * 0.8;
      } else {
          if (this.parts.legs.length >= 4) {
              this.parts.legs[0].rotation.x = Math.sin(time * freq) * 0.6;
              this.parts.legs[3].rotation.x = Math.sin(time * freq) * 0.6;
              this.parts.legs[1].rotation.x = -Math.sin(time * freq) * 0.6;
              this.parts.legs[2].rotation.x = -Math.sin(time * freq) * 0.6;
          }
      }
  }

  public dispose() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchend', this.onMouseUp);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}