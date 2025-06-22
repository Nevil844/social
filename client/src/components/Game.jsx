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
    let mapWidth = Math.floor(window.innerWidth / tileSize);
    let mapHeight = Math.floor(window.innerHeight / tileSize);

    function preload() {
      // Create colored squares for players (we'll draw them programmatically)
      this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    function create() {
      gameScene.current = this;
      
      // Create graphics object for drawing
      graphics = this.add.graphics();
      
      // Draw tile-based background based on map type
      drawBackground.call(this, room?.mapType || 'office');
      
      // Setup input - Enhanced cursor key setup
      cursors = this.input.keyboard.createCursorKeys();
      
      // Add additional WASD keys as backup
      const wasd = this.input.keyboard.addKeys('W,S,A,D');
      
      // Store both input methods
      this.cursors = cursors;
      this.wasd = wasd;
      
      // Configure physics world bounds
      this.physics.world.setBounds(0, 0, mapWidth * tileSize, mapHeight * tileSize);
      
      // Create current player
      if (currentPlayer) {
        createPlayer.call(this, currentPlayer, true);
      }
      
      // Mark scene as ready
      phaserGame.current.sceneReady = true;
    }

    function drawBackground(mapType) {
      graphics.clear();
      
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
            { x: 20, y: 25, w: 2, h: 1, color: 0xf472b6, alpha: 0.9, type: 'umbrella' },
            // Surfboards
            { x: 18, y: 14, w: 1, h: 3, color: 0x06b6d4, alpha: 1.0, type: 'surfboard' }
          ]
        },
        space: {
          baseColors: [0x1e293b, 0x334155],
          accent: 0x6366f1,
          structures: [
            // Command center
            { x: 15, y: 12, w: 12, h: 8, color: 0x374151, alpha: 0.9, type: 'command' },
            // Engine room
            { x: 30, y: 8, w: 8, h: 6, color: 0x4f46e5, alpha: 0.8, type: 'engine' },
            // Hydroponics bay
            { x: 8, y: 20, w: 10, h: 6, color: 0x059669, alpha: 0.7, type: 'hydroponics' },
            // Airlock chamber
            { x: 35, y: 20, w: 6, h: 4, color: 0xdc2626, alpha: 0.8, type: 'airlock' },
            // Observation deck
            { x: 5, y: 5, w: 8, h: 5, color: 0x0ea5e9, alpha: 0.6, type: 'observation' }
          ],
          decorations: [
            // Control panels
            { x: 12, y: 8, w: 2, h: 2, color: 0x06b6d4, alpha: 1.0, type: 'panel' },
            { x: 25, y: 15, w: 2, h: 2, color: 0x06b6d4, alpha: 1.0, type: 'panel' },
            // Communication array
            { x: 40, y: 5, w: 3, h: 4, color: 0x8b5cf6, alpha: 1.0, type: 'antenna' },
            // Solar panels
            { x: 20, y: 25, w: 4, h: 2, color: 0xfbbf24, alpha: 0.9, type: 'solar' }
          ]
        }
      };

      const config = mapConfigs[mapType] || mapConfigs.office;
      
      // Create realistic textured background
      graphics.fillGradientStyle(config.baseColors[0], config.baseColors[0], config.baseColors[1], config.baseColors[1], 1);
      graphics.fillRect(0, 0, mapWidth * tileSize, mapHeight * tileSize);
      
      // Draw subtle grid pattern
      graphics.lineStyle(1, 0x94a3b8, 0.15);
      for (let x = 0; x <= mapWidth; x++) {
        graphics.moveTo(x * tileSize, 0);
        graphics.lineTo(x * tileSize, mapHeight * tileSize);
      }
      for (let y = 0; y <= mapHeight; y++) {
        graphics.moveTo(0, y * tileSize);
        graphics.lineTo(mapWidth * tileSize, y * tileSize);
      }
      graphics.strokePath();
      
      // Draw realistic 3D-like structures with shadows and highlights
      config.structures.forEach(structure => {
        const x = structure.x * tileSize;
        const y = structure.y * tileSize;
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
        const x = decoration.x * tileSize;
        const y = decoration.y * tileSize;
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
      
      players.set(playerData.id, playerObject);
      
      if (isCurrentPlayer) {
        currentPlayerSprite = playerObject;
      }
      
      return playerObject;
    }

    function updatePlayerPosition(playerId, x, y) {
      const player = players.get(playerId);
      if (player && player.container) {
        // Smooth movement animation with easing
        gameScene.current.tweens.add({
          targets: player.container,
          x: x,
          y: y,
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
      }
      
      // Send position update if moved
      if (moved && onPlayerMove) {
        onPlayerMove(currentPlayerSprite.container.x, currentPlayerSprite.container.y);
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
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={gameRef} className="w-full h-full fixed inset-0" />;
};

export default Game; 