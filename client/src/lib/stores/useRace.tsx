import { create } from "zustand";

export type RacePhase = "ready" | "racing" | "finished";

export interface PowerUp {
  id: string;
  type: "lube" | "mutation" | "viagra";
  x: number;
  y: number;
  active: boolean;
}

export interface Obstacle {
  id: string;
  type: "condom" | "pill" | "antibody" | "std";
  x: number;
  y: number;
  active: boolean;
  isChasing?: boolean;
  velocityX?: number;
  velocityY?: number;
}

export interface MysteryEgg {
  id: string;
  x: number;
  y: number;
  active: boolean;
  contents: "powerup" | "obstacle";
  contentType: string;
  isOpening?: boolean;
  openingProgress?: number;
  openingStartTime?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Racer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speedMultiplier: number;
  slowdownTimer: number;
  tailPhase: number;
  isPlayer: boolean;
  slipstreamTimer: number;
  activePowerUpType: string | null;
  powerUpTimer: number;
}

export interface ActiveEffect {
  id: string;
  type: string;
  message: string;
  duration: number;
  timer: number;
}

interface RaceState {
  phase: RacePhase;
  racers: Racer[];
  powerUps: PowerUp[];
  obstacles: Obstacle[];
  mysteryEggs: MysteryEgg[];
  particles: Particle[];
  trackHeight: number;
  cameraY: number;
  activeEffects: ActiveEffect[];
  lastCommentaryTime: number;
  voiceBoostActive: boolean;
  voiceBoostCooldown: number;
  droppedCondoms: Obstacle[];
  screenShake: number;
  lastEventMessage: string;
  
  // Actions
  startRace: () => void;
  resetRace: () => void;
  finishRace: () => void;
  updateRacer: (id: string, updates: Partial<Racer>) => void;
  collectPowerUp: (racerId: string, powerUpId: string) => void;
  hitObstacle: (racerId: string, obstacleId: string) => void;
  collectMysteryEgg: (racerId: string, eggId: string) => void;
  updateCamera: (y: number) => void;
  addActiveEffect: (effect: Omit<ActiveEffect, 'id'>) => void;
  activateVoiceBoost: () => void;
  updateTimers: (delta: number) => void;
  checkCollisions: () => void;
  dropCondom: () => void;
  checkSlipstreams: () => void;
  addParticles: (x: number, y: number, color: string, count: number) => void;
  updateParticles: (delta: number) => void;
  updateSmartObstacles: () => void;
  setEventMessage: (message: string) => void;
}

const TRACK_HEIGHT = 40 * window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

// Generate power-ups along the track
const generatePowerUps = (): PowerUp[] => {
  const powerUps: PowerUp[] = [];
  const types: PowerUp["type"][] = ["lube", "mutation", "viagra"];
  
  for (let i = 500; i < TRACK_HEIGHT; i += 400) {
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({
      id: `powerup-${i}`,
      type,
      x: Math.random() * (CANVAS_WIDTH - 200) + 100,
      y: i,
      active: true,
    });
  }
  
  return powerUps;
};

// Generate obstacles along the track (some with chasing behavior!)
const generateObstacles = (): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const types: Obstacle["type"][] = ["condom", "pill", "antibody", "std"];
  
  for (let i = 800; i < TRACK_HEIGHT; i += 600) {
    const type = types[Math.floor(Math.random() * types.length)];
    const shouldChase = Math.random() < 0.3 && (type === "std" || type === "pill" || type === "condom");
    
    obstacles.push({
      id: `obstacle-${i}`,
      type,
      x: Math.random() * (CANVAS_WIDTH - 200) + 100,
      y: i,
      active: true,
      isChasing: shouldChase,
      velocityX: 0,
      velocityY: 0,
    });
  }
  
  return obstacles;
};

// Generate mystery eggs along the track
const generateMysteryEggs = (): MysteryEgg[] => {
  const eggs: MysteryEgg[] = [];
  const powerUpTypes = ["lube", "mutation", "viagra"];
  const obstacleTypes = ["condom", "pill", "antibody", "std"];
  
  for (let i = 1200; i < TRACK_HEIGHT; i += 800) {
    const contents = Math.random() < 0.6 ? "powerup" : "obstacle";
    const contentType = contents === "powerup" 
      ? powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
      : obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    eggs.push({
      id: `egg-${i}`,
      x: Math.random() * (CANVAS_WIDTH - 200) + 100,
      y: i,
      active: true,
      contents,
      contentType,
    });
  }
  
  return eggs;
};

export const useRace = create<RaceState>((set, get) => ({
  phase: "ready",
  racers: [
    {
      id: "player",
      name: "You",
      color: "#FF6B9D",
      x: CANVAS_WIDTH / 2,
      y: 100,
      velocityX: 0,
      velocityY: 0,
      speedMultiplier: 1,
      slowdownTimer: 0,
      tailPhase: 0,
      isPlayer: true,
      slipstreamTimer: 0,
      activePowerUpType: null,
      powerUpTimer: 0,
    },
    {
      id: "speedy",
      name: "Speedy",
      color: "#9B59B6",
      x: CANVAS_WIDTH / 2 - 100,
      y: 100,
      velocityX: 0,
      velocityY: 0,
      speedMultiplier: 1,
      slowdownTimer: 0,
      tailPhase: 0,
      isPlayer: false,
      slipstreamTimer: 0,
      activePowerUpType: null,
      powerUpTimer: 0,
    },
    {
      id: "turbo",
      name: "Turbo",
      color: "#F39C12",
      x: CANVAS_WIDTH / 2 + 100,
      y: 100,
      velocityX: 0,
      velocityY: 0,
      speedMultiplier: 1,
      slowdownTimer: 0,
      tailPhase: 0,
      isPlayer: false,
      slipstreamTimer: 0,
      activePowerUpType: null,
      powerUpTimer: 0,
    },
  ],
  powerUps: generatePowerUps(),
  obstacles: generateObstacles(),
  mysteryEggs: generateMysteryEggs(),
  particles: [],
  trackHeight: TRACK_HEIGHT,
  cameraY: 0,
  activeEffects: [],
  lastCommentaryTime: 0,
  voiceBoostActive: false,
  voiceBoostCooldown: 0,
  droppedCondoms: [],
  screenShake: 0,
  lastEventMessage: "",
  
  startRace: () => set({ phase: "racing" }),
  
  resetRace: () => {
    set({
      phase: "ready",
      racers: [
        {
          id: "player",
          name: "You",
          color: "#FF6B9D",
          x: CANVAS_WIDTH / 2,
          y: 100,
          velocityX: 0,
          velocityY: 0,
          speedMultiplier: 1,
          slowdownTimer: 0,
          tailPhase: 0,
          isPlayer: true,
          slipstreamTimer: 0,
          activePowerUpType: null,
          powerUpTimer: 0,
        },
        {
          id: "speedy",
          name: "Speedy",
          color: "#9B59B6",
          x: CANVAS_WIDTH / 2 - 100,
          y: 100,
          velocityX: 0,
          velocityY: 0,
          speedMultiplier: 1,
          slowdownTimer: 0,
          tailPhase: 0,
          isPlayer: false,
          slipstreamTimer: 0,
          activePowerUpType: null,
          powerUpTimer: 0,
        },
        {
          id: "turbo",
          name: "Turbo",
          color: "#F39C12",
          x: CANVAS_WIDTH / 2 + 100,
          y: 100,
          velocityX: 0,
          velocityY: 0,
          speedMultiplier: 1,
          slowdownTimer: 0,
          tailPhase: 0,
          isPlayer: false,
          slipstreamTimer: 0,
          activePowerUpType: null,
          powerUpTimer: 0,
        },
      ],
      powerUps: generatePowerUps(),
      obstacles: generateObstacles(),
      mysteryEggs: generateMysteryEggs(),
      particles: [],
      cameraY: 0,
      activeEffects: [],
      lastCommentaryTime: 0,
      voiceBoostActive: false,
      voiceBoostCooldown: 0,
      droppedCondoms: [],
      screenShake: 0,
      lastEventMessage: "",
    });
  },
  
  finishRace: () => set({ phase: "finished" }),
  
  updateRacer: (id, updates) => {
    set((state) => ({
      racers: state.racers.map((racer) =>
        racer.id === id ? { ...racer, ...updates } : racer
      ),
    }));
  },
  
  collectPowerUp: (racerId, powerUpId) => {
    const state = get();
    const powerUp = state.powerUps.find((p) => p.id === powerUpId);
    if (!powerUp || !powerUp.active) return;
    
    // Deactivate power-up
    set({
      powerUps: state.powerUps.map((p) =>
        p.id === powerUpId ? { ...p, active: false } : p
      ),
    });
    
    // Apply effect
    const racer = state.racers.find((r) => r.id === racerId);
    if (!racer) return;
    
    const playerName = (racer as any).nickname || racer.name;
    let message = "";
    let multiplier = 1;
    
    switch (powerUp.type) {
      case "lube":
        multiplier = 1.5;
        message = `💧 ${playerName} got Lube Boost!`;
        break;
      case "mutation":
        multiplier = 1.3;
        message = `🧬 ${playerName} got Mutation!`;
        break;
      case "viagra":
        multiplier = 1.7;
        message = `💊 ${playerName} got Viagra Power!`;
        break;
    }
    
    get().updateRacer(racerId, { 
      speedMultiplier: multiplier,
      activePowerUpType: powerUp.type,
      powerUpTimer: 3000,
    });
    get().addActiveEffect({ type: powerUp.type, message, duration: 3000, timer: 3000 });
  },
  
  hitObstacle: (racerId, obstacleId) => {
    const state = get();
    const obstacle = state.obstacles.find((o) => o.id === obstacleId);
    if (!obstacle || !obstacle.active) return;
    
    // Deactivate obstacle
    set({
      obstacles: state.obstacles.map((o) =>
        o.id === obstacleId ? { ...o, active: false } : o
      ),
    });
    
    const racer = state.racers.find((r) => r.id === racerId);
    if (!racer) return;
    
    const playerName = (racer as any).nickname || racer.name;
    let message = "";
    let slowdownDuration = 0;
    
    switch (obstacle.type) {
      case "condom":
        slowdownDuration = 2000;
        message = `🚫 ${playerName} hit Condom Barrier!`;
        break;
      case "pill":
        slowdownDuration = 1500;
        message = `💊 ${playerName} hit Birth Control!`;
        break;
      case "antibody":
        slowdownDuration = 3000;
        message = `🦠 ${playerName} hit Antibody!`;
        break;
      case "std":
        slowdownDuration = 3000;
        message = `🦠 ${playerName} hit STD!`;
        break;
    }
    
    get().updateRacer(racerId, { speedMultiplier: 0.5, slowdownTimer: slowdownDuration });
    get().addActiveEffect({ type: obstacle.type, message, duration: slowdownDuration, timer: slowdownDuration });
  },
  
  collectMysteryEgg: (racerId, eggId) => {
    const state = get();
    const egg = state.mysteryEggs.find((e) => e.id === eggId);
    if (!egg || !egg.active || egg.isOpening) return;
    
    // Capture opening time for validation
    const openingStartTime = Date.now();
    
    // Start opening animation
    set({
      mysteryEggs: state.mysteryEggs.map((e) =>
        e.id === eggId ? { ...e, isOpening: true, openingStartTime, openingProgress: 0 } : e
      ),
    });
    
    const racer = state.racers.find((r) => r.id === racerId);
    if (!racer) return;
    
    const playerName = (racer as any).nickname || racer.name;
    let message = "";
    
    // Apply contents after animation completes (800ms)
    setTimeout(() => {
      const currentState = get();
      const currentEgg = currentState.mysteryEggs.find((e) => e.id === eggId);
      
      // Guard: Only apply effects if egg is still opening and hasn't been reset
      if (!currentEgg || !currentEgg.isOpening || currentEgg.openingStartTime !== openingStartTime) {
        return;
      }
      
      // Create particle explosion with gold particles
      get().addParticles(currentEgg.x, currentEgg.y, "#FFD700", 20);
      
      // Apply contents using current egg data (not stale closure)
      if (currentEgg.contents === "powerup") {
        let multiplier = 1;
        
        switch (currentEgg.contentType) {
          case "lube":
            multiplier = 1.5;
            message = `✨ ${playerName} got Mystery Lube!`;
            break;
          case "mutation":
            multiplier = 1.3;
            message = `✨ ${playerName} got Mystery Mutation!`;
            break;
          case "viagra":
            multiplier = 1.7;
            message = `✨ ${playerName} got Mystery Viagra!`;
            break;
        }
        
        get().updateRacer(racerId, { 
          speedMultiplier: multiplier,
          activePowerUpType: currentEgg.contentType,
          powerUpTimer: 3000,
        });
        get().addActiveEffect({ type: currentEgg.contentType, message, duration: 3000, timer: 3000 });
      } else {
        // It's an obstacle
        let slowdownDuration = 0;
        
        switch (currentEgg.contentType) {
          case "condom":
            slowdownDuration = 2000;
            message = `💥 ${playerName} got Mystery Condom!`;
            break;
          case "pill":
            slowdownDuration = 1500;
            message = `💥 ${playerName} got Mystery Pill!`;
            break;
          case "antibody":
            slowdownDuration = 3000;
            message = `💥 ${playerName} got Mystery Antibody!`;
            break;
          case "std":
            slowdownDuration = 3000;
            message = `💥 ${playerName} got Mystery STD!`;
            break;
        }
        
        get().updateRacer(racerId, { speedMultiplier: 0.5, slowdownTimer: slowdownDuration });
        get().addActiveEffect({ type: currentEgg.contentType, message, duration: slowdownDuration, timer: slowdownDuration });
        
        // Set screen shake for obstacle
        set({ screenShake: 5 });
      }
      
      // Set event message for commentary
      get().setEventMessage(message);
      
      // Deactivate egg after animation and effects
      set({
        mysteryEggs: currentState.mysteryEggs.map((e) =>
          e.id === eggId ? { ...e, active: false, isOpening: false } : e
        ),
      });
    }, 800);
  },
  
  updateCamera: (y) => set({ cameraY: y }),
  
  addActiveEffect: (effect) => {
    const id = `effect-${Date.now()}-${Math.random()}`;
    set((state) => ({
      activeEffects: [...state.activeEffects, { ...effect, id }],
    }));
  },
  
  activateVoiceBoost: () => {
    const state = get();
    if (state.voiceBoostCooldown > 0) return;
    
    set({ voiceBoostActive: true, voiceBoostCooldown: 10000 });
    
    const player = state.racers.find((r) => r.isPlayer);
    if (player) {
      const playerName = (player as any).nickname || player.name;
      get().updateRacer(player.id, { speedMultiplier: 2 });
      get().addActiveEffect({
        type: "voice",
        message: `🎤 ${playerName} activated Voice Boost!`,
        duration: 3000,
        timer: 3000,
      });
      
      setTimeout(() => {
        get().updateRacer(player.id, { speedMultiplier: 1 });
        set({ voiceBoostActive: false });
      }, 3000);
    }
  },
  
  updateTimers: (delta) => {
    // Update particles
    get().updateParticles(delta);
    
    set((state) => {
      const newRacers = state.racers.map((racer) => {
        let updates: Partial<Racer> = {};
        
        // Handle slowdown timer
        if (racer.slowdownTimer > 0) {
          const newTimer = Math.max(0, racer.slowdownTimer - delta);
          updates.slowdownTimer = newTimer;
          if (newTimer === 0 && !racer.activePowerUpType) {
            updates.speedMultiplier = 1;
          }
        }
        
        // Handle power-up timer
        if (racer.powerUpTimer > 0) {
          const newPowerUpTimer = Math.max(0, racer.powerUpTimer - delta);
          updates.powerUpTimer = newPowerUpTimer;
          if (newPowerUpTimer === 0) {
            updates.speedMultiplier = 1;
            updates.activePowerUpType = null;
          }
        }
        
        // Handle slipstream timer decay
        if (racer.slipstreamTimer > 0) {
          const newSlipstreamTimer = Math.max(0, racer.slipstreamTimer - delta);
          updates.slipstreamTimer = newSlipstreamTimer;
        }
        
        return Object.keys(updates).length > 0 ? { ...racer, ...updates } : racer;
      });
      
      const newActiveEffects = state.activeEffects
        .map((effect) => ({
          ...effect,
          timer: Math.max(0, effect.timer - delta),
        }))
        .filter((effect) => effect.timer > 0);
      
      const newVoiceBoostCooldown = Math.max(0, state.voiceBoostCooldown - delta);
      
      // Decrease screen shake
      const newScreenShake = Math.max(0, state.screenShake - delta * 0.02);
      
      return {
        racers: newRacers,
        activeEffects: newActiveEffects,
        voiceBoostCooldown: newVoiceBoostCooldown,
        screenShake: newScreenShake,
      };
    });
  },
  
  checkCollisions: () => {
    const state = get();
    
    state.racers.forEach((racer) => {
      // Check power-up collisions
      state.powerUps.forEach((powerUp) => {
        if (!powerUp.active) return;
        const dx = racer.x - powerUp.x;
        const dy = racer.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 40) {
          get().collectPowerUp(racer.id, powerUp.id);
        }
      });
      
      // Check obstacle collisions
      state.obstacles.forEach((obstacle) => {
        if (!obstacle.active) return;
        const dx = racer.x - obstacle.x;
        const dy = racer.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 40) {
          get().hitObstacle(racer.id, obstacle.id);
        }
      });
      
      // Check mystery egg collisions
      state.mysteryEggs.forEach((egg) => {
        if (!egg.active) return;
        const dx = racer.x - egg.x;
        const dy = racer.y - egg.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 45) {
          get().collectMysteryEgg(racer.id, egg.id);
        }
      });
      
      // Check dropped condom collisions
      state.droppedCondoms.forEach((condom) => {
        if (!condom.active) return;
        const dx = racer.x - condom.x;
        const dy = racer.y - condom.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 40) {
          // Deactivate the dropped condom
          set((state) => ({
            droppedCondoms: state.droppedCondoms.map((c) =>
              c.id === condom.id ? { ...c, active: false } : c
            ),
          }));
          
          // Apply slowdown
          const hitRacer = state.racers.find((r) => r.id === racer.id);
          const playerName = hitRacer ? ((hitRacer as any).nickname || hitRacer.name) : "Someone";
          get().updateRacer(racer.id, { speedMultiplier: 0.5, slowdownTimer: 2000 });
          get().addActiveEffect({
            type: "condom",
            message: `🚫 ${playerName} hit Condom Barrier!`,
            duration: 2000,
            timer: 2000,
          });
        }
      });
    });
    
    // Check racer-to-racer collisions (bumping/bouncing and power-up stealing)
    for (let i = 0; i < state.racers.length; i++) {
      for (let j = i + 1; j < state.racers.length; j++) {
        const racer1 = state.racers[i];
        const racer2 = state.racers[j];
        
        const dx = racer1.x - racer2.x;
        const dy = racer1.y - racer2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
          // Bump/bounce physics
          const angle = Math.atan2(dy, dx);
          const pushStrength = 3;
          
          get().updateRacer(racer1.id, {
            x: racer1.x + Math.cos(angle) * pushStrength,
            velocityX: Math.cos(angle) * pushStrength,
          });
          
          get().updateRacer(racer2.id, {
            x: racer2.x - Math.cos(angle) * pushStrength,
            velocityX: -Math.cos(angle) * pushStrength,
          });
          
          // Power-up stealing (only steal once per collision)
          const state = get();
          const currentRacer1 = state.racers.find(r => r.id === racer1.id);
          const currentRacer2 = state.racers.find(r => r.id === racer2.id);
          
          if (currentRacer1 && currentRacer2) {
            if (currentRacer1.activePowerUpType && currentRacer1.powerUpTimer > 100 && !currentRacer2.activePowerUpType) {
              get().updateRacer(racer2.id, {
                speedMultiplier: currentRacer1.speedMultiplier,
                activePowerUpType: currentRacer1.activePowerUpType,
                powerUpTimer: currentRacer1.powerUpTimer,
              });
              get().updateRacer(racer1.id, {
                speedMultiplier: 1,
                activePowerUpType: null,
                powerUpTimer: 0,
              });
              get().addActiveEffect({
                type: "steal",
                message: `${racer2.name} stole ${racer1.name}'s power-up!`,
                duration: 2000,
                timer: 2000,
              });
            } else if (currentRacer2.activePowerUpType && currentRacer2.powerUpTimer > 100 && !currentRacer1.activePowerUpType) {
              get().updateRacer(racer1.id, {
                speedMultiplier: currentRacer2.speedMultiplier,
                activePowerUpType: currentRacer2.activePowerUpType,
                powerUpTimer: currentRacer2.powerUpTimer,
              });
              get().updateRacer(racer2.id, {
                speedMultiplier: 1,
                activePowerUpType: null,
                powerUpTimer: 0,
              });
              get().addActiveEffect({
                type: "steal",
                message: `${racer1.name} stole ${racer2.name}'s power-up!`,
                duration: 2000,
                timer: 2000,
              });
            }
          }
        }
      }
    }
  },
  
  dropCondom: () => {
    const state = get();
    const player = state.racers.find((r) => r.isPlayer);
    if (!player) return;
    
    const newCondom: Obstacle = {
      id: `dropped-condom-${Date.now()}`,
      type: "condom",
      x: player.x,
      y: player.y - 50,
      active: true,
    };
    
    set((state) => ({
      droppedCondoms: [...state.droppedCondoms, newCondom],
    }));
    
    console.log("Condom dropped at", player.x, player.y);
  },
  
  checkSlipstreams: () => {
    const state = get();
    
    state.racers.forEach((follower) => {
      let inSlipstream = false;
      
      state.racers.forEach((leader) => {
        if (follower.id === leader.id) return;
        
        // Check if follower is behind leader
        const dy = leader.y - follower.y;
        const dx = Math.abs(leader.x - follower.x);
        
        // Slipstream conditions: 80-120 units behind, within 50 units laterally
        if (dy > 80 && dy < 120 && dx < 50) {
          inSlipstream = true;
          
          // Apply slipstream bonus (only if not already in slipstream and no active power-up)
          if (follower.slipstreamTimer === 0 && !follower.activePowerUpType && follower.slowdownTimer === 0) {
            get().updateRacer(follower.id, {
              speedMultiplier: 1.2,
              slipstreamTimer: 500,
            });
            
            if (follower.isPlayer) {
              get().addActiveEffect({
                type: "slipstream",
                message: `⚡ SLIPSTREAM! Following ${leader.name}!`,
                duration: 500,
                timer: 500,
              });
            }
          }
        }
      });
      
      // Reset speed multiplier when slipstream ends
      if (!inSlipstream && follower.slipstreamTimer <= 0) {
        const currentFollower = state.racers.find(r => r.id === follower.id);
        if (currentFollower && !currentFollower.activePowerUpType && currentFollower.slowdownTimer === 0) {
          if (currentFollower.speedMultiplier !== 1) {
            get().updateRacer(follower.id, {
              speedMultiplier: 1,
            });
          }
        }
      }
    });
  },
  
  addParticles: (x, y, color, count) => {
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 1000,
        maxLife: 1000,
        color,
        size: Math.random() * 4 + 2,
      });
    }
    
    set((state) => ({
      particles: [...state.particles, ...newParticles],
    }));
  },
  
  updateParticles: (delta) => {
    set((state) => {
      const updatedParticles = state.particles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          velocityY: particle.velocityY + 0.1,
          life: particle.life - delta,
        }))
        .filter((particle) => particle.life > 0);
      
      return {
        particles: updatedParticles,
      };
    });
  },
  
  updateSmartObstacles: () => {
    const state = get();
    const player = state.racers.find((r) => r.isPlayer);
    if (!player) return;
    
    const updatedObstacles = state.obstacles.map((obstacle) => {
      if (!obstacle.isChasing || !obstacle.active) return obstacle;
      
      const dx = player.x - obstacle.x;
      const dy = player.y - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const dirX = dx / distance;
        const dirY = dy / distance;
        const speed = 2;
        
        let newX = obstacle.x + dirX * speed;
        let newY = obstacle.y + dirY * speed;
        
        newX = Math.max(50, Math.min(CANVAS_WIDTH - 50, newX));
        newY = Math.max(0, Math.min(TRACK_HEIGHT, newY));
        
        return {
          ...obstacle,
          x: newX,
          y: newY,
          velocityX: dirX * speed,
          velocityY: dirY * speed,
        };
      }
      
      return obstacle;
    });
    
    set({ obstacles: updatedObstacles });
  },
  
  setEventMessage: (message) => {
    set({ lastEventMessage: message });
  },
}));
