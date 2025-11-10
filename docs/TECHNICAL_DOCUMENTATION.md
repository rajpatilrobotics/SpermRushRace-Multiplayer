# Gene Pool Royale - Complete Technical Documentation

## Table of Contents
1. [Tech Stack Overview](#tech-stack-overview)
2. [Project Architecture](#project-architecture)
3. [Multiplayer System](#multiplayer-system)
4. [File Structure & Responsibilities](#file-structure--responsibilities)
5. [Game Mechanics](#game-mechanics)
6. [State Management](#state-management)
7. [Rendering System](#rendering-system)
8. [Development & Deployment](#development--deployment)

---

## Tech Stack Overview

### Frontend Technologies
- **React 18.3.1** - UI component library
- **TypeScript 5.6.3** - Type-safe JavaScript
- **Vite 5.4.21** - Build tool and dev server
- **Zustand 5.0.3** - Lightweight state management
- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Socket.IO Client 4.8.1** - Real-time WebSocket communication
- **Framer Motion 11.13.1** - Animation library
- **React Router DOM 6.26.0** - Client-side routing
- **Wouter 3.3.5** - Lightweight routing alternative

### Backend Technologies
- **Node.js 20** - JavaScript runtime
- **Express 4.21.2** - Web framework
- **Socket.IO 4.8.1** - Real-time bidirectional communication
- **TypeScript 5.6.3** - Type-safe server code
- **tsx 4.19.1** - TypeScript execution engine (dev)
- **ESBuild 0.25.0** - Fast bundler (production)

### Database & ORM
- **@neondatabase/serverless 0.10.4** - Serverless PostgreSQL
- **Drizzle ORM 0.39.1** - Type-safe database toolkit
- **Drizzle Zod 0.7.0** - Schema validation

### UI Component Libraries
- **shadcn/ui components** - Pre-built accessible components
- **Lucide React 0.453.0** - Icon library
- **Sonner 1.7.1** - Toast notifications
- **React Confetti 6.4.0** - Celebration animations

### Styling & Theming
- **Tailwind CSS** - Base styling
- **tailwindcss-animate 1.0.7** - Animation utilities
- **next-themes 0.4.5** - Theme management
- **class-variance-authority 0.7.0** - Component variants
- **clsx 2.1.1** & **tailwind-merge 2.5.4** - Class name utilities

### Build & Development Tools
- **Vite** - Development server with HMR
- **PostCSS 8.4.47** - CSS processing
- **Autoprefixer 10.4.20** - CSS vendor prefixes
- **@replit/vite-plugin-runtime-error-modal** - Error overlay

---

## Project Architecture

### Directory Structure

```
gene-pool-royale/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   │   ├── images/          # Game sprites (power-ups, obstacles)
│   │   └── sounds/          # Audio files (music, SFX)
│   └── src/
│       ├── components/      # React components
│       │   ├── ui/         # Reusable UI components (shadcn/ui)
│       │   ├── GameCanvas.tsx
│       │   ├── StartScreen.tsx
│       │   ├── LobbyScreen.tsx
│       │   ├── FinishScreen.tsx
│       │   ├── Leaderboard.tsx
│       │   ├── GameUI.tsx
│       │   ├── VoiceBoost.tsx
│       │   ├── RaceCommentary.tsx
│       │   └── CollisionNotifications.tsx
│       ├── lib/
│       │   ├── stores/      # Zustand state stores
│       │   │   ├── useRace.tsx
│       │   │   ├── useMultiplayer.tsx
│       │   │   ├── useGame.tsx
│       │   │   └── useAudio.tsx
│       │   ├── socket.ts    # Socket.IO client setup
│       │   ├── queryClient.ts
│       │   └── utils.ts
│       ├── hooks/           # Custom React hooks
│       ├── pages/           # Route pages
│       ├── App.tsx          # Main app component
│       ├── main.tsx         # Entry point
│       └── index.css        # Global styles
├── server/                   # Backend Express application
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # HTTP routes
│   ├── socket.ts            # Socket.IO server logic
│   ├── vite.ts              # Vite middleware setup
│   └── storage.ts           # In-memory storage
├── shared/                   # Shared types/schemas
│   └── schema.ts            # Database schema (Drizzle)
├── attached_assets/          # Generated assets
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind config
└── drizzle.config.ts        # Drizzle ORM config
```

### Architectural Patterns

#### Client-Server Architecture
- **Client (React SPA)**: Handles UI, game rendering, user input, and client-side game logic
- **Server (Express + Socket.IO)**: Manages multiplayer rooms, game state synchronization, and real-time communication
- **Shared**: Common types and schemas used by both client and server

#### State Management Pattern
- **Zustand Stores**: Multiple stores handling different concerns
  - Decoupled state management
  - No prop drilling
  - Simple API with hooks
  - TypeScript-first design

#### Real-Time Communication Pattern
- **Event-Driven Architecture**: Socket.IO events for all multiplayer interactions
- **Client-Authoritative Movement**: Each client controls their own racer's movement
- **Server-Authoritative State**: Server controls power-ups, obstacles, and final rankings

---

## Multiplayer System

### Architecture Overview

The multiplayer system uses Socket.IO for real-time, bidirectional communication between clients and the server. It follows a room-based architecture where players can create or join game rooms using 6-character codes.

### Key Components

#### 1. Server-Side (`server/socket.ts`)

**GameRoom Interface:**
```typescript
interface GameRoom {
  id: string;                    // Room code (6 characters)
  players: Map<string, Player>;  // Connected players
  powerUps: any[];               // Synchronized power-ups
  obstacles: any[];              // Synchronized obstacles
  droppedCondoms: any[];         // Player-dropped obstacles
  gameStarted: boolean;          // Game state flag
  gameFinished: boolean;         // Completion flag
  host: string;                  // Host socket ID
  createdAt: number;             // Timestamp
  emptyAt: number | null;        // When room became empty
}
```

**Player State:**
```typescript
interface Player {
  id: string;
  socketId: string;
  nickname: string;
  color: string;                 // Assigned from palette
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speedMultiplier: number;
  slowdownTimer: number;
  tailPhase: number;
  slipstreamTimer: number;
  activePowerUpType: string | null;
  powerUpTimer: number;
  finished: boolean;
  finishTime?: number;
}
```

**Room Management:**
- Rooms are stored in a `Map<string, GameRoom>`
- 6-character room codes generated from alphanumeric characters (excluding ambiguous ones)
- Automatic cleanup: Empty rooms deleted after 5 minutes
- Finished rooms deleted after 30 seconds
- Host migration when host disconnects

#### 2. Client-Side (`client/src/lib/stores/useMultiplayer.tsx`)

**Multiplayer Store State:**
```typescript
interface MultiplayerState {
  isMultiplayer: boolean;        // Mode flag
  roomCode: string | null;       // Current room
  localPlayerId: string | null;  // This player's ID
  localPlayerNickname: string;
  players: Map<string, MultiplayerPlayer>;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  gameStarted: boolean;
  rankings: MultiplayerPlayer[]; // Server-sent rankings
  listenersSetup: boolean;
}
```

**Socket Connection (`client/src/lib/socket.ts`):**
- Singleton pattern for socket instance
- Automatic reconnection (up to 5 attempts)
- Transport fallback: WebSocket → polling
- Connection lifecycle logging

### Multiplayer Flow

#### Creating a Room
1. User clicks "Create Room" in `LobbyScreen.tsx`
2. User enters nickname
3. Client emits `create-room` event with nickname
4. Server:
   - Generates unique 6-character room code
   - Creates new `GameRoom` instance
   - Assigns player as host
   - Assigns color from palette (index 0)
   - Emits `room-created` event back to client
5. Client updates state with room code and navigates to lobby view

#### Joining a Room
1. User clicks "Join Room" in `LobbyScreen.tsx`
2. User enters room code and nickname
3. Client emits `join-room` event
4. Server:
   - Validates room exists and has space (max 6 players)
   - Assigns next color from palette
   - Adds player to room
   - Emits `room-joined` to joining player
   - Broadcasts `player-joined` to existing players
5. All clients update their player lists

#### Starting the Game
1. Host clicks "Start Game" button
2. Client:
   - Calls `startRace()` to generate power-ups and obstacles
   - Emits `start-game` event with power-ups and obstacles
3. Server:
   - Marks room as `gameStarted: true`
   - Stores power-ups and obstacles
   - Broadcasts `game-started` event with synchronized game state
4. All clients:
   - Receive synchronized power-ups/obstacles
   - Transition to racing phase
   - Start rendering game

#### Real-Time Synchronization

**Position Updates:**
- Each client updates their own racer's position locally (60 FPS)
- Every frame, client emits `update-position` with:
  - Position (x, y)
  - Velocity (velocityX, velocityY)
  - Visual state (tailPhase, speedMultiplier, etc.)
  - Active power-ups and timers
- Server broadcasts updates to all other players in room
- Other clients render remote players at received positions

**Power-Up Collection:**
- Client detects collision with power-up
- Emits `collect-power-up` with power-up ID
- Server:
  - Marks power-up as collected
  - Broadcasts to all players to remove it
  - Prevents duplicate collection

**Obstacle Collision:**
- Client detects collision with obstacle
- Emits `hit-obstacle` with obstacle ID
- Server broadcasts to all players
- Similar to power-up collection

**Finishing the Race:**
- When player reaches finish line (y >= trackHeight)
- Client emits `player-finished`
- Server:
  - Records finish time
  - Updates rankings in real-time
  - Broadcasts `player-finished` and `rankings-updated` events
- All clients update leaderboard with new rankings

### Socket Events Reference

| Event | Direction | Purpose |
|-------|-----------|---------|
| `create-room` | Client → Server | Create new game room |
| `room-created` | Server → Client | Confirm room creation |
| `join-room` | Client → Server | Join existing room |
| `room-joined` | Server → Client | Confirm room join |
| `player-joined` | Server → All in room | Notify new player joined |
| `player-left` | Server → All in room | Notify player disconnected |
| `new-host` | Server → All in room | Notify host changed |
| `start-game` | Client (host) → Server | Start the race |
| `game-started` | Server → All in room | Race started with synced state |
| `update-position` | Client → Server → Others | Sync player position |
| `collect-power-up` | Client → Server → Others | Sync power-up collection |
| `hit-obstacle` | Client → Server → Others | Sync obstacle collision |
| `drop-condom` | Client → Server → Others | Sync condom drop |
| `player-finished` | Client → Server → Others | Player crossed finish |
| `rankings-updated` | Server → All in room | Updated race rankings |
| `room-error` | Server → Client | Error (room full, not found) |

### Reconnection Handling
- Client stores room code and nickname in localStorage
- On reconnect, automatically attempts to rejoin room
- 1-second delay before auto-rejoin attempt
- Server maintains player list during brief disconnections

---

## File Structure & Responsibilities

### Client Files

#### Core Application
| File | Responsibility |
|------|---------------|
| `client/src/main.tsx` | Application entry point, renders `<App />` |
| `client/src/App.tsx` | Root component, conditional rendering based on game phase |
| `client/src/index.css` | Global styles, Tailwind directives, CSS variables |

#### Game Components
| File | Responsibility |
|------|---------------|
| `GameCanvas.tsx` | Main game loop, canvas rendering, input handling, physics |
| `StartScreen.tsx` | Initial screen with mode selection (single/multiplayer) |
| `LobbyScreen.tsx` | Multiplayer lobby for creating/joining rooms |
| `FinishScreen.tsx` | End-of-race results with rankings and replay option |
| `Leaderboard.tsx` | Live race standings overlay |
| `GameUI.tsx` | In-game HUD (speed, power-up timer, effects) |
| `VoiceBoost.tsx` | Voice activation button and speech recognition |
| `RaceCommentary.tsx` | Text-to-speech announcements during race |
| `CollisionNotifications.tsx` | Top-left collision event notifications |

#### State Stores
| File | Responsibility |
|------|---------------|
| `useRace.tsx` | Single-player race state: racers, power-ups, obstacles, physics, collision detection |
| `useMultiplayer.tsx` | Multiplayer state: room management, player list, Socket.IO event handlers |
| `useGame.tsx` | Overall game phase control |
| `useAudio.tsx` | Audio playback, mute controls, sound effects |

#### Utilities
| File | Responsibility |
|------|---------------|
| `lib/socket.ts` | Socket.IO client singleton, connection setup |
| `lib/utils.ts` | Utility functions (cn for className merging) |
| `lib/queryClient.ts` | TanStack Query client configuration |

#### UI Components (`client/src/components/ui/`)
Pre-built accessible components from shadcn/ui:
- `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`
- `accordion.tsx`, `alert.tsx`, `badge.tsx`, `dropdown-menu.tsx`
- `tooltip.tsx`, `tabs.tsx`, `progress.tsx`, `slider.tsx`
- And many more Radix UI-based components

### Server Files

| File | Responsibility |
|------|---------------|
| `server/index.ts` | Express server setup, middleware, HTTP server creation |
| `server/routes.ts` | API route registration, Socket.IO initialization |
| `server/socket.ts` | Socket.IO server logic, room management, multiplayer events |
| `server/vite.ts` | Vite dev server middleware (dev mode) and static file serving (prod) |
| `server/storage.ts` | In-memory storage implementation (fallback for database) |

### Shared Files

| File | Responsibility |
|------|---------------|
| `shared/schema.ts` | Drizzle database schema (users table), Zod validation schemas |

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `tsconfig.json` | TypeScript compiler options |
| `vite.config.ts` | Vite build configuration, aliases, plugins |
| `tailwind.config.ts` | Tailwind theme, colors, extensions |
| `postcss.config.js` | PostCSS plugins (Tailwind, Autoprefixer) |
| `drizzle.config.ts` | Drizzle ORM database configuration |
| `replit.md` | Project documentation and recent changes |

---

## Game Mechanics

### Core Gameplay Loop

**Objective:** Control a sperm character swimming upward to reach the egg at the top of the track.

**Controls:**
- **WASD / Arrow Keys**: Movement (up, left, down, right)
- **Shift**: Drop condom obstacle (if available)
- **Voice Command**: Say "east or west goon hack is the best" for temporary speed boost

### Game Elements

#### Racers (Sperm Characters)
- Teardrop-shaped head with flowing tail
- Tail animates with wave motion (20 segments)
- Color-coded (player is pink, AI opponents have different colors)
- Visual effects: glow, gradient, velocity-based stretching

#### Power-Ups
| Type | Icon | Effect |
|------|------|--------|
| Lube Boost | 💧 | Increases speed multiplier by 1.5x for 3 seconds |
| Viagra | 💊 | Increases speed multiplier by 2x for 3 seconds |

#### Obstacles
| Type | Icon | Effect |
|------|------|--------|
| Condom | 🛡️ | Slows down for 2 seconds |
| Pill | 💊 | Slows down for 1.5 seconds |
| STD | 🦠 | Slows down for 2.5 seconds |
| Antibody | 🧬 | Chases player, slows on contact |

#### Mystery Eggs
- Appear at random Y positions
- Can contain power-ups or obstacles
- Opening animation when collected

#### Collision Mechanics
- **Racer-to-Racer Collisions**:
  - Physics-based bounce with 0.5 restitution
  - Faster racer can steal slower racer's active power-up
  - High-speed collisions (>5 units/s) cause 1-second dizzy effect
  - Visual: white spark ring, gold particles, dizzy stars (💫)
  - Audio: collision hit sound
  - Camera shake scaled by impact speed
  - Commentary phrases ("Direct hit!", "Ouch!")
  - 500ms cooldown between same-racer collisions

### AI Behavior (Single-Player)
- AI racers swim upward with slight variation
- Collect power-ups when nearby
- Avoid obstacles with simple avoidance behavior
- Slight horizontal wobble for natural movement

### Physics System

**Movement:**
- Velocity-based movement with acceleration
- Drag/friction applied each frame
- Speed multipliers from power-ups
- Slowdown effects from obstacles

**Camera:**
- Follows local player at 45% down screen
- Smooth interpolation prevents jarring jumps
- Allows negative Y values for initial positioning
- Mutable local variable for same-frame updates

**Collision Detection:**
- AABB (Axis-Aligned Bounding Box) for simple rectangular collisions
- Circle-based collision for more precise racer-to-racer detection
- Distance-based detection for power-ups and obstacles

---

## State Management

### Store Architecture

Gene Pool Royale uses **Zustand** for state management with four specialized stores:

#### 1. useRace Store (`client/src/lib/stores/useRace.tsx`)

**Purpose:** Manages all single-player race logic and shared game state.

**State Properties:**
- `phase`: Current game phase ('ready' | 'racing' | 'finished')
- `racers`: Array of racer objects (player + AI opponents)
- `powerUps`: Active power-ups on track
- `obstacles`: Active obstacles on track
- `mysteryEggs`: Mystery egg collectibles
- `particles`: Visual particle effects
- `hazards`: Environmental hazards
- `bossSperm`: Boss enemy (if active)
- `trackHeight`: Total race distance
- `cameraY`: Current camera Y position
- `activeEffects`: Currently active effects (HUD display)
- `collisionNotifications`: Collision messages
- `voiceBoostActive`: Voice boost state
- `droppedCondoms`: Player-dropped obstacles
- `screenShake`: Screen shake intensity
- `slowMotion`: Slow motion effect timer

**Key Actions:**
- `startRace()`: Initialize new race with racers, power-ups, obstacles
- `resetRace()`: Reset to initial state
- `finishRace()`: Transition to finish phase
- `updateRacer()`: Update individual racer properties
- `collectPowerUp()`: Handle power-up collection
- `hitObstacle()`: Handle obstacle collision
- `updateTimers()`: Decrement all timers (called each frame)
- `checkCollisions()`: Detect and resolve collisions
- `checkSlipstreams()`: Detect slipstream effect (drafting)
- `dropCondom()`: Player drops condom obstacle
- `addParticles()`: Spawn visual particles
- `triggerScreenShake()`: Camera shake effect

#### 2. useMultiplayer Store (`client/src/lib/stores/useMultiplayer.tsx`)

**Purpose:** Manages all multiplayer-specific state and Socket.IO communication.

**State Properties:**
- `isMultiplayer`: Boolean flag for mode
- `roomCode`: Current room code (6 chars)
- `localPlayerId`: This client's player ID
- `localPlayerNickname`: Player's chosen nickname
- `players`: Map of all players in room
- `isHost`: Whether this client is room host
- `isConnected`: Connection status
- `error`: Error message (room full, not found, etc.)
- `gameStarted`: Whether race has begun
- `rankings`: Server-sent race rankings

**Key Actions:**
- `setMultiplayer()`: Toggle multiplayer mode
- `createRoom()`: Create new multiplayer room
- `joinRoom()`: Join existing room by code
- `leaveRoom()`: Disconnect from room
- `startGame()`: Host starts the race
- `updatePosition()`: Send position update to server
- `collectPowerUp()`: Notify server of collection
- `hitObstacle()`: Notify server of collision
- `dropCondom()`: Sync condom drop
- `playerFinished()`: Notify finish
- `setupSocketListeners()`: Initialize Socket.IO event handlers

#### 3. useGame Store (`client/src/lib/stores/useGame.tsx`)

**Purpose:** High-level game state control.

**State Properties:**
- Game phase management
- Overall game flow

#### 4. useAudio Store (`client/src/lib/stores/useAudio.tsx`)

**Purpose:** Audio playback management.

**State Properties:**
- `backgroundMusic`: Audio instance
- `hitSound`: Collision sound effect
- `successSound`: Success sound effect
- `isMuted`: Mute toggle

**Key Actions:**
- `playBackgroundMusic()`: Start music
- `stopBackgroundMusic()`: Stop music
- `playHitSound()`: Play collision sound
- `playSuccessSound()`: Play success sound
- `toggleMute()`: Mute/unmute all audio

### Store Usage Patterns

**In Components:**
```typescript
// Access state
const { phase, racers } = useRace();

// Access actions
const { startRace, updateRacer } = useRace();

// Conditional access (multiplayer vs single-player)
if (isMultiplayer) {
  const players = useMultiplayer.getState().players;
} else {
  const racers = useRace.getState().racers;
}
```

**Direct Store Access (Game Loop):**
```typescript
// Avoid re-renders in tight loops
const state = useRace.getState();
state.updateTimers(delta);
state.checkCollisions();
```

---

## Rendering System

### Canvas-Based Rendering

Gene Pool Royale uses HTML5 Canvas 2D API for the main game rendering in `GameCanvas.tsx`.

### Rendering Pipeline

**1. Game Loop (requestAnimationFrame):**
```typescript
useEffect(() => {
  let animationId: number;
  
  const gameLoop = () => {
    const currentTime = performance.now();
    const delta = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;
    
    // Update game state
    updatePhysics(delta);
    
    // Render frame
    render();
    
    animationId = requestAnimationFrame(gameLoop);
  };
  
  animationId = requestAnimationFrame(gameLoop);
  
  return () => cancelAnimationFrame(animationId);
}, [dependencies]);
```

**2. Clear and Background:**
```typescript
ctx.fillStyle = 'linear-gradient(to bottom, #FFE6F0, #E6D4FF)';
ctx.fillRect(0, 0, canvas.width, canvas.height);
```

**3. Draw Track Elements:**
- Background gradient
- Start line (y = 0)
- Finish line (y = trackHeight)
- Grid lines every 100 units

**4. Draw Game Objects (Bottom to Top):**
1. Dropped condoms
2. Obstacles
3. Power-ups
4. Mystery eggs
5. Racers (sorted by Y position for proper z-ordering)
6. Particles (effects)

**5. Camera System:**
```typescript
// Camera follows player at 45% down screen
const targetCameraY = player.y - canvas.height * 0.45;
currentCameraY = targetCameraY; // Direct assignment for responsive feel

// Convert world space to screen space
const screenY = canvas.height - (objectY - currentCameraY);
```

### Drawing Functions

**Sperm Rendering:**
```typescript
function drawSperm(ctx, racer, x, screenY) {
  // Draw tail (20 segments with wave motion)
  for (let i = 0; i < 20; i++) {
    const segmentY = screenY + i * 2;
    const wave = Math.sin(racer.tailPhase + i * 0.5) * 5;
    const segmentX = x + wave;
    
    // Gradient and tapering
    ctx.strokeStyle = `rgba(${color}, ${1 - i / 20})`;
    ctx.lineWidth = 10 - (i / 2);
    
    // Draw segment
  }
  
  // Draw head (teardrop shape)
  ctx.beginPath();
  ctx.ellipse(x, screenY - 20, 15, 25, 0, 0, Math.PI * 2);
  ctx.fillStyle = racer.color;
  ctx.fill();
  
  // Effects (glow, speed lines)
  // Nickname label
}
```

**Power-Up/Obstacle Rendering:**
- Load images from `/images/` directory
- Draw with `ctx.drawImage()`
- Pulsing animation for power-ups
- Rotation for obstacles

### Performance Optimizations

1. **Object Pooling**: Reuse particle objects
2. **Culling**: Only render objects within camera view
3. **Reduced Draw Calls**: Batch similar objects
4. **requestAnimationFrame**: Sync with browser refresh rate
5. **Delta Time**: Frame-rate independent updates

---

## Development & Deployment

### Development Workflow

**Starting Development Server:**
```bash
npm run dev
```
- Runs `tsx server/index.ts`
- Starts Express server on port 5000
- Vite middleware provides HMR
- Socket.IO server starts automatically

**Project Scripts:**
| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx server/index.ts` | Start development server |
| `build` | `vite build && esbuild ...` | Build for production |
| `start` | `NODE_ENV=production node dist/index.js` | Run production build |
| `check` | `tsc` | Type check without emit |
| `db:push` | `drizzle-kit push` | Push database schema |

### Build Process

**Client Build (Vite):**
1. Bundles React application
2. Optimizes assets (images, sounds)
3. Code splitting and tree shaking
4. Outputs to `dist/public/`

**Server Build (ESBuild):**
1. Bundles server code
2. External packages (not bundled)
3. ESM format output
4. Outputs to `dist/index.js`

### Production Deployment

**Configuration:**
- `deployment_target: autoscale` (stateless web app)
- Build command: `npm run build`
- Run command: `npm run start`

**Port Configuration:**
- Server binds to `0.0.0.0:5000`
- Vite configured with `allowedHosts: true` for Replit iframe

**Environment:**
- Node.js 20 runtime
- Replit Nix environment (no Docker)

### Database Setup

**Current State:**
- Schema defined with Drizzle ORM
- Neon PostgreSQL configured
- Currently using in-memory storage (fallback)

**Migration to Database:**
1. Uncomment database connection in `server/storage.ts`
2. Set up environment variables (DATABASE_URL)
3. Run `npm run db:push` to apply schema
4. Replace MemStorage with actual database calls

### Environment Variables

**Required for Production:**
- `NODE_ENV=production`
- `DATABASE_URL` (if using PostgreSQL)

**Optional:**
- `PORT` (defaults to 5000)

### Debugging

**Client-Side:**
- Browser DevTools console
- React DevTools extension
- Zustand DevTools (if installed)

**Server-Side:**
- Console logs in terminal
- Socket.IO debug mode: `DEBUG=socket.io*`

**Common Issues:**
1. **Port 5000 not accessible**: Ensure `host: "0.0.0.0"` in server
2. **HMR not working**: Check Vite `allowedHosts: true`
3. **Socket disconnections**: Check reconnection settings
4. **Asset 404s**: Verify paths start with `/` (e.g., `/images/lube.png`)

### Performance Monitoring

**Metrics to Watch:**
- Client FPS (should stay 60 FPS)
- Socket latency (ping events)
- Memory usage (check for leaks in particles)
- Bundle size (Vite build output)

---

## Additional Features

### Voice Control System
- Uses Web Speech API (SpeechRecognition)
- Phrase: "east or west goon hack is the best"
- Grants temporary speed boost when recognized
- Microphone permission required

### Text-to-Speech Commentary
- Uses Web Speech API (SpeechSynthesis)
- Announces race events:
  - "Player takes the lead!"
  - "Collision detected!"
  - "Power-up collected!"
- Random funny phrases during gameplay
- Can be muted via audio controls

### Particle System
- Trail particles behind moving racers
- Explosion particles on collisions
- Splash particles on power-up collection
- Physics-based movement with gravity
- Auto-cleanup when life expires

### Combo System
- Collecting multiple power-ups triggers combos
- Combo effects: turbo, shield, mega
- Visual indicators in HUD
- Combo timer countdown

### Screen Shake
- Impact-based camera shake
- Intensity scales with collision speed
- Smooth decay over time

### Leaderboard
- Real-time race standings
- Shows all racers' positions
- Updates every frame
- Highlights local player

---

## Future Enhancements

### Potential Additions
1. **Database Integration**: Migrate from in-memory to PostgreSQL for persistent data
2. **User Accounts**: Authentication system for persistent profiles
3. **Leaderboards**: Global and room-based high scores
4. **Custom Rooms**: Room settings (power-up density, track length)
5. **More Game Modes**: Time trials, elimination races
6. **Spectator Mode**: Watch ongoing races
7. **Mobile Support**: Touch controls for mobile devices
8. **3D Graphics**: Migrate to Three.js/React Three Fiber
9. **More Power-Ups**: Shield, teleport, freeze, etc.
10. **Boss Battles**: Special boss sperm encounters

---

## Code Quality & Best Practices

### TypeScript Usage
- Strict mode enabled
- Interface definitions for all data structures
- Type inference for reduced verbosity
- Shared types in `shared/` directory

### Component Structure
- Functional components with hooks
- Custom hooks for reusable logic
- Separation of concerns (UI vs logic)
- Prop drilling avoided via Zustand

### State Management
- Zustand for global state
- localStorage for persistence (room codes, nicknames)
- No Redux or Context API needed

### Performance
- Memoization where beneficial
- Avoid unnecessary re-renders
- Efficient collision detection algorithms
- Canvas rendering optimized for 60 FPS

### Accessibility
- Radix UI components (ARIA compliant)
- Keyboard navigation support
- Screen reader friendly (where applicable)

---

## License

MIT License

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0
**Authors:** Gene Pool Royale Development Team
