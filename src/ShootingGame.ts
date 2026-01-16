import * as THREE from 'three';
import * as xb from 'xrblocks';
import { Text } from 'troika-three-text';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ShootingGame extends xb.Script {
  private targets: THREE.Mesh[] = [];
  private particles: Particle[] = [];
  private score: number = 0;
  private scoreText: any;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 1000; // Spawn every 1 second
  private gameAreaWidth: number = 4;
  private gameAreaHeight: number = 2;
  private gameDepth: number = -3;

  init() {
    // Lights
    this.add(new THREE.HemisphereLight(0xffffff, 0x444444, 3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 5, 5);
    this.add(dirLight);

    // Score Display
    this.scoreText = new Text();
    this.scoreText.text = 'Score: 0';
    this.scoreText.fontSize = 0.2;
    this.scoreText.color = 0xffffff;
    this.scoreText.position.set(0, 2, -2);
    this.scoreText.anchorX = 'center';
    this.scoreText.sync();
    this.add(this.scoreText);

    // Initial targets
    this.spawnTarget();
  }

  spawnTarget() {
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
    const target = new THREE.Mesh(geometry, material);

    // Random position
    const x = (Math.random() - 0.5) * this.gameAreaWidth;
    const y = 1 + (Math.random() - 0.5) * this.gameAreaHeight;
    const z = this.gameDepth + (Math.random() - 0.5); // Slight depth variation

    target.position.set(x, y, z);

    // Random velocity
    target.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 1.0, // X speed
      (Math.random() - 0.5) * 0.5, // Y speed
      0
    );

    this.add(target);
    this.targets.push(target);
  }

  update() {
    const now = Date.now();
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawnTarget();
      this.lastSpawnTime = now;
    }

    const dt = xb.getDeltaTime();

    // Move targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      const velocity = target.userData.velocity as THREE.Vector3;
      
      target.position.addScaledVector(velocity, dt);

      // Bounce off walls (simplified) or remove if too far
      if (Math.abs(target.position.x) > 3 || target.position.y < 0 || target.position.y > 4) {
        this.removeTarget(i);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.remove(p.mesh);
        (p.mesh.geometry as THREE.BufferGeometry).dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.scale.multiplyScalar(0.95);
    }
  }

  removeTarget(index: number) {
    const target = this.targets[index];
    this.remove(target);
    this.targets.splice(index, 1);
    (target.geometry as THREE.BufferGeometry).dispose();
    (target.material as THREE.Material).dispose();
  }

  onSelectStart(event: xb.SelectEvent) {
    const controller = event.target;
    
    // Raycast against all targets
    // We need to iterate backwards because we might remove items
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      // Use xb.user instead of xb.core.user for cleaner access
      const intersection = xb.user.select(target, controller);
      
      if (intersection) {
        // Hit!
        // Visual feedback
        this.createExplosion(intersection.point, (target.material as THREE.MeshPhongMaterial).color);

        this.removeTarget(i);
        
        this.score += 10;
        this.updateScore();
        
        break; 
      }
    }
  }

  createExplosion(position: THREE.Vector3, color: THREE.Color) {
    const particleCount = 10;
    const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const material = new THREE.MeshBasicMaterial({ color: color });
    
    for (let i = 0; i < particleCount; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );

        this.add(mesh);
        this.particles.push({
          mesh,
          velocity,
          life: 0.5, // 0.5 seconds
          maxLife: 0.5
        });
    }
  }

  updateScore() {
    this.scoreText.text = `Score: ${this.score}`;
    this.scoreText.sync();
  }
}
