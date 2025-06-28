import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const Game = ({ currentPlayer, allPlayers, onPlayerMove, room }) => {
  const gameRef = useRef();
  const phaserGame = useRef();
  const gameScene = useRef();

  useEffect(() => {
    // Game configuration - Full screen responsive
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: '#0f0a1a', // Dark purple background
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    // Game variables
    let cursors;
    let players = new Map();
    let currentPlayerSprite;
    let graphics;
    let tileSize = 40; // Increased for better visibility
    
    // Fixed map dimensions (in tiles)
    const mapDimensions = {
      office: { width: 60, height: 40 },
      park: { width: 70, height: 50 },
      cafe: { width: 55, height: 35 },
      campus: { width: 65, height: 45 },
      beach: { width: 75, height: 55 },
      space: { width: 80, height: 60 }
    };
    
    // Get map dimensions for current room
    const mapType = room?.mapType || 'office';
    const mapConfig = mapDimensions[mapType];
    const mapWidth = mapConfig.width * tileSize;
    const mapHeight = mapConfig.height * tileSize;
    
    // Boundary margin (visible area inside the map)
    const boundaryMargin = 100; // 100px margin from edges
    const characterSize = 40; // Approximate character size
    const characterOffset = characterSize / 2; // Half character size for positioning
    const playableWidth = mapWidth - (boundaryMargin * 2);
    const playableHeight = mapHeight - (boundaryMargin * 2);
    
    // Camera bounds - allow character edges to reach boundaries, not center
    const cameraBoundsX = boundaryMargin + characterOffset;
    const cameraBoundsY = boundaryMargin + characterOffset;
    const cameraBoundsWidth = playableWidth - characterSize;
    const cameraBoundsHeight = playableHeight - characterSize;
    
    // Camera variables
    let camera;
    let worldContainer;
    let boundaryWalls;

    function preload() {
      // Create colored squares for players (we'll draw them programmatically)
      this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    function create() {
      gameScene.current = this;
      
      // Create world container for the map
      worldContainer = this.add.container(0, 0);
      
      // Create graphics object for drawing
      graphics = this.add.graphics();
      worldContainer.add(graphics);
      
      // Draw the complete world (map + dead-end areas)
      drawWorld.call(this, mapType, mapWidth, mapHeight);
      
      // Create boundary walls
      createBoundaryWalls.call(this, mapWidth, mapHeight);
      
      // Setup camera
      setupCamera.call(this, mapWidth, mapHeight);
      
      // Setup input - Enhanced cursor key setup
      cursors = this.input.keyboard.createCursorKeys();
      
      // Add additional WASD keys as backup
      const wasd = this.input.keyboard.addKeys('W,S,A,D');
      
      // Store both input methods
      this.cursors = cursors;
      this.wasd = wasd;
      
      // Configure physics world bounds to match playable area boundaries
      this.physics.world.setBounds(boundaryMargin, boundaryMargin, playableWidth, playableHeight);
      
      // Create current player
      if (currentPlayer) {
        createPlayer.call(this, currentPlayer, true);
      }
      
      // Mark scene as ready
      phaserGame.current.sceneReady = true;
    }

    function drawWorld(mapType, mapWidth, mapHeight) {
      graphics.clear();
      
      // Draw dead-end background first (covers entire world)
      drawDeadEndBackground.call(this, mapWidth, mapHeight);
      
      // Draw the actual map area
      drawBackground.call(this, mapType, mapWidth, mapHeight);
    }

    function drawDeadEndBackground(mapWidth, mapHeight) {
      // Create a dark, dead-end looking background outside the map
      const worldWidth = Math.max(window.innerWidth * 2, mapWidth * 1.5);
      const worldHeight = Math.max(window.innerHeight * 2, mapHeight * 1.5);
      
      // Dark gradient background
      graphics.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a1a, 0x1a1a1a, 1);
      graphics.fillRect(0, 0, worldWidth, worldHeight);
      
      // Add some subtle grid lines to make it look like a dead end
      graphics.lineStyle(1, 0x333333, 0.3);
      for (let x = 0; x < worldWidth; x += 100) {
        graphics.moveTo(x, 0);
        graphics.lineTo(x, worldHeight);
      }
      for (let y = 0; y < worldHeight; y += 100) {
        graphics.moveTo(0, y);
        graphics.lineTo(worldWidth, y);
      }
      graphics.strokePath();
      
      // Add some "dead end" visual elements
      graphics.fillStyle(0x444444, 0.2);
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * worldWidth;
        const y = Math.random() * worldHeight;
        const size = Math.random() * 50 + 20;
        graphics.fillCircle(x, y, size);
      }
    }

    function drawBackground(mapType, mapWidth, mapHeight) {
      const mapConfigs = {
        office: {
          baseColors: [0x1a1625, 0x2d1b69], // Dark purple theme
          accent: 0x7c3aed,
          structures: [
            // Conference Room with glass effect
            { x: 5, y: 5, w: 8, h: 6, color: 0x5b21b6, alpha: 0.9, type: 'conference' },
            // Executive Office
            { x: 20, y: 3, w: 10, h: 8, color: 0x8b5cf6, alpha: 0.8, type: 'office' },
            // Open workspace
            { x: 3, y: 15, w: 12, h: 8, color: 0x059669, alpha: 0.7, type: 'workspace' },
            // Break room with kitchen
            { x: 25, y: 15, w: 8, h: 6, color: 0xf59e0b, alpha: 0.8, type: 'kitchen' },
            // Reception area
            { x: 40, y: 8, w: 6, h: 4, color: 0xef4444, alpha: 0.7, type: 'reception' }
          ],
          decorations: [
            // Plants
            { x: 12, y: 12, w: 2, h: 2, color: 0x22c55e, alpha: 1.0, type: 'plant' },
            { x: 35, y: 5, w: 2, h: 2, color: 0x22c55e, alpha: 1.0, type: 'plant' },
            // Water cooler
            { x: 18, y: 20, w: 1, h: 2, color: 0x0ea5e9, alpha: 1.0, type: 'cooler' },
            // Photocopier
            { x: 8, y: 25, w: 2, h: 1, color: 0x6b7280, alpha: 1.0, type: 'copier' }
          ]
        },
        park: {
          baseColors: [0x1a1625, 0x2d1b69], // Dark purple theme
          accent: 0x22c55e,
          structures: [
            // Large pond with ripple effects
            { x: 15, y: 12, w: 12, h: 8, color: 0x0ea5e9, alpha: 0.8, type: 'pond' },
            // Playground area
            { x: 5, y: 20, w: 8, h: 6, color: 0xf59e0b, alpha: 0.7, type: 'playground' },
            // Picnic pavilion
            { x: 35, y: 8, w: 6, h: 4, color: 0x92400e, alpha: 0.8, type: 'pavilion' },
            // Basketball court
            { x: 25, y: 22, w: 8, h: 6, color: 0x64748b, alpha: 0.9, type: 'court' }
          ],
          decorations: [
            // Large trees
            { x: 8, y: 8, w: 3, h: 4, color: 0x365314, alpha: 1.0, type: 'tree' },
            { x: 30, y: 15, w: 3, h: 4, color: 0x365314, alpha: 1.0, type: 'tree' },
            { x: 45, y: 20, w: 3, h: 4, color: 0x365314, alpha: 1.0, type: 'tree' },
            // Flower beds
            { x: 12, y: 28, w: 4, h: 2, color: 0xf472b6, alpha: 0.8, type: 'flowers' },
            // Benches
            { x: 20, y: 18, w: 2, h: 1, color: 0x92400e, alpha: 1.0, type: 'bench' }
          ]
        },
        cafe: {
          baseColors: [0x1a1625, 0x2d1b69], // Dark purple theme
          accent: 0xd97706,
          structures: [
            // Main dining area
            { x: 8, y: 8, w: 15, h: 10, color: 0x92400e, alpha: 0.8, type: 'dining' },
            // Coffee bar counter
            { x: 25, y: 6, w: 8, h: 3, color: 0x7c2d12, alpha: 0.9, type: 'counter' },
            // Outdoor terrace
            { x: 35, y: 12, w: 10, h: 8, color: 0x059669, alpha: 0.6, type: 'terrace' },
            // Kitchen area
            { x: 5, y: 20, w: 6, h: 4, color: 0xdc2626, alpha: 0.8, type: 'kitchen' },
            // Cozy reading nook
            { x: 15, y: 22, w: 8, h: 4, color: 0x7c3aed, alpha: 0.7, type: 'lounge' }
          ],
          decorations: [
            // Coffee machines
            { x: 28, y: 8, w: 1, h: 1, color: 0x374151, alpha: 1.0, type: 'machine' },
            // Menu boards
            { x: 35, y: 5, w: 3, h: 1, color: 0x1f2937, alpha: 1.0, type: 'menu' },
            // Indoor plants
            { x: 12, y: 25, w: 1, h: 2, color: 0x22c55e, alpha: 1.0, type: 'plant' }
          ]
        },
        campus: {
          baseColors: [0x1a1625, 0x2d1b69], // Dark purple theme
          accent: 0x7c3aed,
          structures: [
            // Main library building
            { x: 5, y: 5, w: 15, h: 10, color: 0x7c3aed, alpha: 0.8, type: 'library' },
            // Lecture hall complex
            { x: 25, y: 3, w: 12, h: 8, color: 0x2563eb, alpha: 0.7, type: 'lecture' },
            // Science laboratory
            { x: 40, y: 12, w: 8, h: 6, color: 0x059669, alpha: 0.6, type: 'lab' },
            // Student center
            { x: 8, y: 20, w: 12, h: 8, color: 0xdc2626, alpha: 0.7, type: 'student_center' },
            // Cafeteria
            { x: 25, y: 22, w: 10, h: 6, color: 0xf59e0b, alpha: 0.6, type: 'cafeteria' }
          ],
          decorations: [
            // Campus quad
            { x: 22, y: 12, w: 6, h: 4, color: 0x22c55e, alpha: 0.8, type: 'quad' },
            // Statue/monument
            { x: 38, y: 20, w: 2, h: 3, color: 0x8b5cf6, alpha: 1.0, type: 'statue' },
            // Parking areas
            { x: 45, y: 25, w: 8, h: 4, color: 0x6b7280, alpha: 0.6, type: 'parking' }
          ]
        },
        beach: {
          baseColors: [0x1a1625, 0x2d1b69], // Dark purple theme
          accent: 0x06b6d4,
          structures: [
            // Ocean with waves
            { x: 5, y: 15, w: 40, h: 15, color: 0x0ea5e9, alpha: 0.8, type: 'ocean' },
            // Beach resort building
            { x: 25, y: 5, w: 10, h: 6, color: 0x92400e, alpha: 0.9, type: 'resort' },
            // Lifeguard station
            { x: 15, y: 12, w: 3, h: 3, color: 0xdc2626, alpha: 0.8, type: 'lifeguard' },
            // Beach bar
            { x: 35, y: 8, w: 6, h: 3, color: 0x7c3aed, alpha: 0.7, type: 'bar' },
            // Volleyball court
            { x: 8, y: 8, w: 8, h: 4, color: 0xfbbf24, alpha: 0.6, type: 'volleyball' }
          ],
          decorations: [
            // Palm trees
            { x: 12, y: 10, w: 2, h: 4, color: 0x365314, alpha: 1.0, type: 'palm' },
            { x: 30, y: 12, w: 2, h: 4, color: 0x365314, alpha: 1.0, type: 'palm' },
            { x: 45, y: 8, w: 2, h: 4, color: 0x365314, alpha: 1.0, type: 'palm' },
            // Beach umbrellas
            { x: 18, y: 18, w: 1, h: 2, color: 0xf472b6, alpha: 1.0, type: 'umbrella' },
            { x: 32, y: 18, w: 1, h: 2, color: 0xf472b6, alpha: 1.0, type: 'umbrella' }
          ]
        },
        space: {
          baseColors: [0x1a1625, 0x2d1b69], // Dark purple theme
          accent: 0x8b5cf6,
          structures: [
            // Command center
            { x: 10, y: 8, w: 12, h: 8, color: 0x8b5cf6, alpha: 0.8, type: 'command' },
            // Laboratory modules
            { x: 25, y: 5, w: 10, h: 6, color: 0x059669, alpha: 0.7, type: 'lab' },
            // Living quarters
            { x: 40, y: 10, w: 8, h: 6, color: 0x7c3aed, alpha: 0.6, type: 'quarters' },
            // Engineering bay
            { x: 5, y: 20, w: 15, h: 8, color: 0xf59e0b, alpha: 0.7, type: 'engineering' },
            // Observation deck
            { x: 30, y: 20, w: 12, h: 6, color: 0x0ea5e9, alpha: 0.6, type: 'observation' }
          ],
          decorations: [
            // Space equipment
            { x: 20, y: 15, w: 3, h: 2, color: 0x6b7280, alpha: 1.0, type: 'equipment' },
            { x: 50, y: 12, w: 2, h: 3, color: 0x6b7280, alpha: 1.0, type: 'equipment' },
            // Control panels
            { x: 15, y: 25, w: 4, h: 1, color: 0x374151, alpha: 1.0, type: 'panel' }
          ]
        }
      };

      const config = mapConfigs[mapType] || mapConfigs.office;
      
      // Create realistic textured background
      graphics.fillGradientStyle(config.baseColors[0], config.baseColors[0], config.baseColors[1], config.baseColors[1], 1);
      graphics.fillRect(0, 0, mapWidth, mapHeight);
      
      // Draw boundary area (darker area outside playable space)
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRect(0, 0, mapWidth, mapHeight);
      
      // Draw playable area (normal background)
      graphics.fillGradientStyle(config.baseColors[0], config.baseColors[0], config.baseColors[1], config.baseColors[1], 1);
      graphics.fillRect(boundaryMargin, boundaryMargin, playableWidth, playableHeight);
      
      // Draw subtle grid pattern only in playable area
      graphics.lineStyle(1, 0x94a3b8, 0.15);
      for (let x = boundaryMargin; x <= boundaryMargin + playableWidth; x += tileSize) {
        graphics.moveTo(x, boundaryMargin);
        graphics.lineTo(x, boundaryMargin + playableHeight);
      }
      for (let y = boundaryMargin; y <= boundaryMargin + playableHeight; y += tileSize) {
        graphics.moveTo(boundaryMargin, y);
        graphics.lineTo(boundaryMargin + playableWidth, y);
      }
      graphics.strokePath();
      
      // Draw realistic 3D-like structures with shadows and highlights
      config.structures.forEach(structure => {
        const x = (structure.x * tileSize) + boundaryMargin;
        const y = (structure.y * tileSize) + boundaryMargin;
        const w = structure.w * tileSize;
        const h = structure.h * tileSize;
        
        // Draw shadow (offset bottom-right)
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillRoundedRect(x + 4, y + 4, w, h, 12);
        
        // Draw main structure
        graphics.fillStyle(structure.color, structure.alpha);
        graphics.fillRoundedRect(x, y, w, h, 12);
        
        // Draw highlight (top-left)
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRoundedRect(x, y, w, 8, 12);
        graphics.fillRoundedRect(x, y, 8, h, 12);
        
        // Draw border
        graphics.lineStyle(3, structure.color, structure.alpha + 0.3);
        graphics.strokeRoundedRect(x, y, w, h, 12);
        
        // Add type-specific details
        addStructureDetails(graphics, structure, x, y, w, h);
      });
      
      // Draw realistic decorations
      config.decorations.forEach(decoration => {
        const x = (decoration.x * tileSize) + boundaryMargin;
        const y = (decoration.y * tileSize) + boundaryMargin;
        const w = decoration.w * tileSize;
        const h = decoration.h * tileSize;
        
        // Shadow
        graphics.fillStyle(0x000000, 0.15);
        graphics.fillRoundedRect(x + 2, y + 2, w, h, 8);
        
        // Main decoration
        graphics.fillStyle(decoration.color, decoration.alpha);
        graphics.fillRoundedRect(x, y, w, h, 8);
        
        // Highlight
        graphics.fillStyle(0xffffff, 0.4);
        graphics.fillRoundedRect(x, y, w, 4, 8);
        
        // Add decoration-specific details
        addDecorationDetails(graphics, decoration, x, y, w, h);
      });
    }

    function createBoundaryWalls(mapWidth, mapHeight) {
      boundaryWalls = this.physics.add.staticGroup();
      
      // Create visible boundary walls with margins
      const wallThickness = 20;
      const wallColor = 0x7c3aed; // Purple color for boundaries
      const wallAlpha = 0.8;
      
      // Top boundary wall (visible)
      const topWall = this.add.rectangle(boundaryMargin, boundaryMargin - wallThickness/2, playableWidth, wallThickness, wallColor, wallAlpha);
      this.physics.add.existing(topWall, true);
      boundaryWalls.add(topWall);
      
      // Bottom boundary wall (visible)
      const bottomWall = this.add.rectangle(boundaryMargin, boundaryMargin + playableHeight + wallThickness/2, playableWidth, wallThickness, wallColor, wallAlpha);
      this.physics.add.existing(bottomWall, true);
      boundaryWalls.add(bottomWall);
      
      // Left boundary wall (visible)
      const leftWall = this.add.rectangle(boundaryMargin - wallThickness/2, boundaryMargin, wallThickness, playableHeight, wallColor, wallAlpha);
      this.physics.add.existing(leftWall, true);
      boundaryWalls.add(leftWall);
      
      // Right boundary wall (visible)
      const rightWall = this.add.rectangle(boundaryMargin + playableWidth + wallThickness/2, boundaryMargin, wallThickness, playableHeight, wallColor, wallAlpha);
      this.physics.add.existing(rightWall, true);
      boundaryWalls.add(rightWall);
      
      // Add corner decorations to make boundaries more visible
      const cornerSize = 30;
      const cornerColor = 0x8b5cf6;
      
      // Top-left corner
      const topLeftCorner = this.add.rectangle(boundaryMargin - cornerSize/2, boundaryMargin - cornerSize/2, cornerSize, cornerSize, cornerColor, 0.9);
      this.physics.add.existing(topLeftCorner, true);
      boundaryWalls.add(topLeftCorner);
      
      // Top-right corner
      const topRightCorner = this.add.rectangle(boundaryMargin + playableWidth + cornerSize/2, boundaryMargin - cornerSize/2, cornerSize, cornerSize, cornerColor, 0.9);
      this.physics.add.existing(topRightCorner, true);
      boundaryWalls.add(topRightCorner);
      
      // Bottom-left corner
      const bottomLeftCorner = this.add.rectangle(boundaryMargin - cornerSize/2, boundaryMargin + playableHeight + cornerSize/2, cornerSize, cornerSize, cornerColor, 0.9);
      this.physics.add.existing(bottomLeftCorner, true);
      boundaryWalls.add(bottomLeftCorner);
      
      // Bottom-right corner
      const bottomRightCorner = this.add.rectangle(boundaryMargin + playableWidth + cornerSize/2, boundaryMargin + playableHeight + cornerSize/2, cornerSize, cornerSize, cornerColor, 0.9);
      this.physics.add.existing(bottomRightCorner, true);
      boundaryWalls.add(bottomRightCorner);
    }

    function setupCamera(mapWidth, mapHeight) {
      camera = this.cameras.main;
      
      // Set world bounds for camera - character edges can reach boundaries
      camera.setBounds(boundaryMargin, boundaryMargin, playableWidth, playableHeight);
      
      // Set camera zoom based on screen size
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate appropriate zoom level
      const mapAspectRatio = mapWidth / mapHeight;
      const screenAspectRatio = screenWidth / screenHeight;
      
      let zoom = 1;
      if (screenWidth < 768) {
        // Mobile devices - zoom out more
        zoom = 0.8;
      } else if (screenWidth < 1024) {
        // Tablets - moderate zoom
        zoom = 0.9;
      } else {
        // Desktop - full zoom
        zoom = 1.0;
      }
      
      camera.setZoom(zoom);
      
      // Enable camera following for current player if it exists
      if (currentPlayerSprite && currentPlayerSprite.container) {
        camera.startFollow(currentPlayerSprite.container, true, 0.1, 0.1);
      }
    }

    function updateCameraFollow() {
      if (camera && currentPlayerSprite && currentPlayerSprite.container) {
        camera.startFollow(currentPlayerSprite.container, true, 0.1, 0.1);
      }
    }

    function addStructureDetails(graphics, structure, x, y, w, h) {
      switch (structure.type) {
        case 'conference':
          // Glass reflection effect
          graphics.fillStyle(0xffffff, 0.6);
          graphics.fillRoundedRect(x + 10, y + 10, w - 20, h - 20, 6);
          graphics.fillStyle(0x0ea5e9, 0.3);
          graphics.fillRoundedRect(x + 15, y + 15, w - 30, h - 30, 4);
          break;
        
        case 'kitchen':
          // Counter tops
          graphics.fillStyle(0x9ca3af, 0.8);
          graphics.fillRect(x + 10, y + h - 15, w - 20, 10);
          // Appliances
          graphics.fillStyle(0x374151, 1.0);
          graphics.fillRect(x + 20, y + 15, 15, 15);
          break;
        
        case 'pond':
          // Water ripples
          for (let i = 0; i < 3; i++) {
            graphics.lineStyle(2, 0xffffff, 0.4 - i * 0.1);
            graphics.strokeCircle(x + w/2, y + h/2, 20 + i * 15);
          }
          break;
        
        case 'tree':
          // Tree trunk and leaves
          graphics.fillStyle(0x92400e, 1.0);
          graphics.fillRect(x + w/2 - 3, y + h - 10, 6, 10);
          graphics.fillStyle(0x22c55e, 0.9);
          graphics.fillCircle(x + w/2, y + 10, 20);
          break;
      }
    }

    function addDecorationDetails(graphics, decoration, x, y, w, h) {
      switch (decoration.type) {
        case 'plant':
          // Pot
          graphics.fillStyle(0x92400e, 1.0);
          graphics.fillRect(x, y + h - 8, w, 8);
          // Leaves
          graphics.fillStyle(0x22c55e, 1.0);
          graphics.fillCircle(x + w/2, y + 5, 8);
          break;
        
        case 'machine':
          // LED indicators
          graphics.fillStyle(0x22c55e, 1.0);
          graphics.fillCircle(x + 5, y + 5, 2);
          graphics.fillStyle(0xef4444, 1.0);
          graphics.fillCircle(x + 10, y + 5, 2);
          break;
        
        case 'bench':
          // Bench slats
          graphics.fillStyle(0x92400e, 1.0);
          for (let i = 0; i < 3; i++) {
            graphics.fillRect(x, y + i * 6, w, 4);
          }
          break;
      }
    }

    function createHumanAvatar(playerData, isCurrentPlayer = false) {
      // Safety check: ensure scene is available
      if (!gameScene.current || !gameScene.current.add) {
        console.warn('Scene not ready, cannot create player');
        return null;
      }
      
      const { avatar } = playerData;
      const container = gameScene.current.add.container(playerData.x, playerData.y);
      
      // Create realistic shadow
      const shadow = gameScene.current.add.graphics();
      shadow.fillStyle(0x000000, 0.3);
      shadow.fillEllipse(0, 30, 30, 12);
      
      // Create detailed human avatar
      const avatarGraphics = gameScene.current.add.graphics();
      
      // Body/shirt with texture
      avatarGraphics.fillStyle(parseInt(avatar.shirtColor.replace('#', '0x')));
      avatarGraphics.fillEllipse(0, 18, 28, 20);
      avatarGraphics.lineStyle(2, 0x000000, 0.2);
      avatarGraphics.strokeEllipse(0, 18, 28, 20);
      
      // Shirt details
      avatarGraphics.fillStyle(0xffffff, 0.3);
      avatarGraphics.fillEllipse(-8, 12, 6, 8);
      
      // Head/face with realistic shading
      avatarGraphics.fillStyle(parseInt(avatar.skinTone.replace('#', '0x')));
      avatarGraphics.fillCircle(0, 0, 16);
      avatarGraphics.lineStyle(1, 0x000000, 0.15);
      avatarGraphics.strokeCircle(0, 0, 16);
      
      // Face highlights and shadows
      avatarGraphics.fillStyle(0xffffff, 0.4);
      avatarGraphics.fillEllipse(-6, -6, 10, 14);
      avatarGraphics.fillStyle(0x000000, 0.1);
      avatarGraphics.fillEllipse(4, 2, 8, 10);
      
      // Detailed hair
      drawHair(avatarGraphics, avatar.hairColor, avatar.hairStyle);
      
      // Realistic eyes with reflections
      avatarGraphics.fillStyle(0xffffff);
      avatarGraphics.fillCircle(-5, -2, 3);
      avatarGraphics.fillCircle(5, -2, 3);
      avatarGraphics.fillStyle(0x2d3748);
      avatarGraphics.fillCircle(-5, -2, 2);
      avatarGraphics.fillCircle(5, -2, 2);
      avatarGraphics.fillStyle(0xffffff);
      avatarGraphics.fillCircle(-4, -3, 1);
      avatarGraphics.fillCircle(6, -3, 1);
      
      // Detailed eyebrows
      avatarGraphics.fillStyle(parseInt(avatar.hairColor.replace('#', '0x')));
      avatarGraphics.fillEllipse(-5, -7, 4, 2);
      avatarGraphics.fillEllipse(5, -7, 4, 2);
      
      // Nose with shading
      avatarGraphics.fillStyle(0x000000, 0.15);
      avatarGraphics.fillEllipse(0, 1, 2, 3);
      
      // Realistic mouth
      avatarGraphics.fillStyle(0xd53f8c);
      avatarGraphics.fillEllipse(0, 5, 6, 2);
      avatarGraphics.fillStyle(0xffffff, 0.4);
      avatarGraphics.fillEllipse(0, 4, 4, 1);

      // Enhanced player name
      const nameText = gameScene.current.add.text(0, -40, playerData.name, {
        fontSize: '14px',
        fill: '#1f2937',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#ffffff',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#00000040',
          blur: 2,
          fill: true
        }
      });
      nameText.setOrigin(0.5);
      
      // Animated status indicator
      const statusIndicator = gameScene.current.add.graphics();
      statusIndicator.fillStyle(0x10b981);
      statusIndicator.fillCircle(14, -14, 4);
      statusIndicator.lineStyle(3, 0xffffff);
      statusIndicator.strokeCircle(14, -14, 4);
      
      // Add all elements to container
      container.add([shadow, avatarGraphics, nameText, statusIndicator]);
      
      // FIXED: Add physics to the container with proper setup
      gameScene.current.physics.add.existing(container);
      
      // Ensure the physics body is properly configured
      if (container.body) {
        container.body.setSize(35, 35);
        container.body.setCollideWorldBounds(true);
        container.body.setDrag(300); // Add drag for better control
        container.body.setMaxVelocity(250, 250); // Set max velocity for both X and Y
        container.body.enable = true; // Explicitly enable the body
      }
      
      // Store player data
      container.playerData = playerData;
      
      // Enhanced animations for current player
      if (isCurrentPlayer) {
        // Pulsing status indicator
        gameScene.current.tweens.add({
          targets: statusIndicator,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      return {
        container,
        graphics: avatarGraphics,
        nameText,
        statusIndicator,
        data: playerData
      };
    }

    function drawHair(graphics, hairColor, hairStyle) {
      const color = parseInt(hairColor.replace('#', '0x'));
      graphics.fillStyle(color);
      
      switch (hairStyle) {
        case 'short':
          graphics.fillPath([
            -12, -6,
            -14, -14,
            14, -14,
            12, -6,
            10, -10,
            -10, -10,
            -12, -6
          ]);
          // Hair texture
          graphics.fillStyle(color, 0.7);
          for (let i = 0; i < 5; i++) {
            graphics.fillRect(-10 + i * 4, -12, 2, 8);
          }
          break;
          
        case 'long':
          graphics.fillPath([
            -14, -4,
            -16, -14,
            16, -14,
            14, -4,
            15, 12,
            -15, 12,
            -14, -4
          ]);
          // Hair flow lines
          graphics.lineStyle(1, color, 0.8);
          for (let i = 0; i < 6; i++) {
            graphics.moveTo(-12 + i * 4, -10);
            graphics.lineTo(-10 + i * 4, 8);
          }
          graphics.strokePath();
          break;
          
        case 'curly':
          // Base hair
          graphics.fillCircle(0, -4, 14);
          // Curly texture
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle - Math.PI / 2) * 13;
            const y = Math.sin(angle - Math.PI / 2) * 13;
            graphics.fillCircle(x, y, 4);
          }
          break;
          
        case 'braids':
          // Base hair
          graphics.fillPath([-12, -6, -14, -14, 14, -14, 12, -6]);
          // Detailed braids
          graphics.fillRect(-16, -2, 4, 18);
          graphics.fillRect(12, -2, 4, 18);
          // Braid texture
          graphics.lineStyle(1, 0x000000, 0.3);
          for (let i = 0; i < 8; i++) {
            graphics.moveTo(-14, -2 + i * 2);
            graphics.lineTo(-14, i * 2);
          }
          graphics.strokePath();
          break;
          
        case 'fade':
          graphics.fillPath([
            -10, -4,
            -12, -12,
            12, -12,
            10, -4,
            8, -8,
            -8, -8,
            -10, -4
          ]);
          // Fade gradient effect
          graphics.fillStyle(color, 0.5);
          graphics.fillPath([
            -8, -2,
            -10, -8,
            10, -8,
            8, -2
          ]);
          break;
          
        case 'bob':
          graphics.fillPath([
            -14, -2,
            -15, -14,
            15, -14,
            14, -2,
            13, 2,
            -13, 2,
            -14, -2
          ]);
          // Bob texture lines
          graphics.lineStyle(1, color, 0.6);
          for (let i = 0; i < 8; i++) {
            graphics.moveTo(-12 + i * 3, -12);
            graphics.lineTo(-10 + i * 3, 0);
          }
          graphics.strokePath();
          break;
          
        default:
          graphics.fillCircle(0, -4, 13);
          // Default hair texture
          graphics.fillStyle(color, 0.8);
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI;
            const x = Math.cos(angle - Math.PI / 2) * 10;
            const y = Math.sin(angle - Math.PI / 2) * 10;
            graphics.fillCircle(x, y - 4, 3);
          }
      }
      
      // Hair shine effect
      graphics.fillStyle(0xffffff, 0.3);
      graphics.fillEllipse(-4, -10, 6, 3);
      
      graphics.lineStyle(1, 0x000000, 0.2);
      graphics.strokePath();
    }

    function createPlayer(playerData, isCurrentPlayer = false) {
      const playerObject = createHumanAvatar(playerData, isCurrentPlayer);
      if (!playerObject) return null;
      
      // Add physics body to the player container
      if (playerObject.container) {
        gameScene.current.physics.add.existing(playerObject.container);
        playerObject.container.body.setCollideWorldBounds(true);
        
        // Add collision with boundary walls
        if (boundaryWalls) {
          gameScene.current.physics.add.collider(playerObject.container, boundaryWalls);
        }
      }
      
      players.set(playerData.id, playerObject);
      
      if (isCurrentPlayer) {
        currentPlayerSprite = playerObject;
        // Setup camera to follow current player
        if (camera && playerObject.container) {
          camera.startFollow(playerObject.container, true, 0.1, 0.1);
        }
        // Update camera follow after a short delay to ensure everything is set up
        setTimeout(() => {
          updateCameraFollow();
        }, 100);
      }
      
      return playerObject;
    }

    function updatePlayerPosition(playerId, x, y) {
      const player = players.get(playerId);
      if (player && player.container) {
        // Clamp position to allow character edges to reach boundaries
        const clampedX = Math.max(boundaryMargin + characterOffset, Math.min(x, boundaryMargin + playableWidth - characterOffset));
        const clampedY = Math.max(boundaryMargin + characterOffset, Math.min(y, boundaryMargin + playableHeight - characterOffset));
        
        // Smooth movement animation with easing
        gameScene.current.tweens.add({
          targets: player.container,
          x: clampedX,
          y: clampedY,
          duration: 150,
          ease: 'Power2'
        });
      }
    }

    function removePlayer(playerId) {
      const player = players.get(playerId);
      if (player) {
        if (player.container) {
          player.container.destroy();
        }
        players.delete(playerId);
      }
    }

    function update() {
      if (!currentPlayerSprite || !cursors) return;
      
      const speed = 250;
      let moved = false;
      let velocityX = 0;
      let velocityY = 0;
      
      // Get WASD keys from scene
      const wasd = gameScene.current?.wasd;
      
      // Handle horizontal movement (Arrow keys or A/D)
      if (cursors.left.isDown || (wasd && wasd.A.isDown)) {
        velocityX = -speed;
        moved = true;
      } else if (cursors.right.isDown || (wasd && wasd.D.isDown)) {
        velocityX = speed;
        moved = true;
      }
      
      // Handle vertical movement (Arrow keys or W/S)
      if (cursors.up.isDown || (wasd && wasd.W.isDown)) {
        velocityY = -speed;
        moved = true;
      } else if (cursors.down.isDown || (wasd && wasd.S.isDown)) {
        velocityY = speed;
        moved = true;
      }
      
      // Apply velocities to the physics body
      if (currentPlayerSprite.container && currentPlayerSprite.container.body) {
        currentPlayerSprite.container.body.setVelocity(velocityX, velocityY);
        
        // Ensure player stays within playable bounds - character edges can reach boundaries
        const x = currentPlayerSprite.container.body.x;
        const y = currentPlayerSprite.container.body.y;
        
        if (x < boundaryMargin + characterOffset) currentPlayerSprite.container.body.x = boundaryMargin + characterOffset;
        if (x > boundaryMargin + playableWidth - characterOffset) currentPlayerSprite.container.body.x = boundaryMargin + playableWidth - characterOffset;
        if (y < boundaryMargin + characterOffset) currentPlayerSprite.container.body.y = boundaryMargin + characterOffset;
        if (y > boundaryMargin + playableHeight - characterOffset) currentPlayerSprite.container.body.y = boundaryMargin + playableHeight - characterOffset;
      }
      
      // Send position update if moved
      if (moved && onPlayerMove) {
        const x = currentPlayerSprite.container.x;
        const y = currentPlayerSprite.container.y;
        onPlayerMove(x, y);
      }
    }

    // Create the game
    phaserGame.current = new Phaser.Game(config);

    // Store references for external access
    phaserGame.current.updatePlayerPosition = updatePlayerPosition;
    phaserGame.current.removePlayer = removePlayer;
    phaserGame.current.createPlayer = createPlayer;
    phaserGame.current.players = players;

    // Cleanup function
    return () => {
      if (phaserGame.current) {
        phaserGame.current.destroy(true);
        phaserGame.current = null;
      }
    };
  }, [room?.mapType]);

  // Update players when allPlayers changes
  useEffect(() => {
    if (!phaserGame.current || !allPlayers || !phaserGame.current.players) return;
    
    // Wait for scene to be ready before creating players
    if (!phaserGame.current.sceneReady) {
      const checkSceneReady = () => {
        if (phaserGame.current && phaserGame.current.sceneReady) {
          updatePlayers();
        } else {
          setTimeout(checkSceneReady, 100);
        }
      };
      checkSceneReady();
      return;
    }
    
    updatePlayers();
    
    function updatePlayers() {
      allPlayers.forEach(player => {
        if (player.id !== currentPlayer?.id) {
          // Check if player already exists by looking through the players Map
          const existingPlayer = phaserGame.current.players.get(player.id);
          
          if (!existingPlayer) {
            // Only create new player if scene is ready
            if (gameScene.current && gameScene.current.add) {
              phaserGame.current.createPlayer(player, false);
            }
          } else {
            // Update existing player position
            phaserGame.current.updatePlayerPosition(player.id, player.x, player.y);
          }
        }
      });
    }
  }, [allPlayers, currentPlayer]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (phaserGame.current) {
        phaserGame.current.scale.resize(window.innerWidth, window.innerHeight);
        
        // Update camera zoom and bounds based on new screen size
        if (camera) {
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          
          let zoom = 1;
          if (screenWidth < 768) {
            // Mobile devices - zoom out more
            zoom = 0.8;
          } else if (screenWidth < 1024) {
            // Tablets - moderate zoom
            zoom = 0.9;
          } else {
            // Desktop - full zoom
            zoom = 1.0;
          }
          
          camera.setZoom(zoom);
          
          // Update camera bounds to allow character edges to reach boundaries
          camera.setBounds(boundaryMargin, boundaryMargin, playableWidth, playableHeight);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={gameRef} className="w-full h-full fixed inset-0" />;
};

export default Game; 