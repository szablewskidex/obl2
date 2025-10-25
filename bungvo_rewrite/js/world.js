// World class - Infinite Runner with Parallax Scrolling - using original Bungvo assets
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Infinite runner - no static platforms, everything scrolls
        this.coins = [];
        this.obstacles = [];
        
        // Parallax scrolling system
        this.scrollSpeed = 250; // Base scroll speed - matches player speed
        this.currentScrollDirection = 0; // Smooth scroll direction
        this.parallaxLayers = [];
        
        // Load original textures
        this.textures = {};
        this.loadTextures();
        
        this.setupParallaxLayers();
        this.generateScrollingContent();
    }
    
    loadTextures() {
        const textureList = [
            'nieb.png',           // Sky background
            'oblockfence.png',    // Fence/wall texture
            'oblockmid.png',      // Platform texture
            'platform.png',       // Platform texture
            'download.png',       // Background element
            'oblck.png',          // Block texture
            'id2.png'             // Coin/collectible texture
        ];
        
        this.texturesLoaded = 0;
        this.totalTextures = textureList.length;
        
        textureList.forEach(textureName => {
            const img = new Image();
            img.onload = () => {
                this.texturesLoaded++;
                console.log(`✓ Loaded texture: ${textureName} (${this.texturesLoaded}/${this.totalTextures}) - ${img.width}x${img.height}`);
            };
            img.onerror = () => {
                console.error(`✗ Failed to load texture: ${textureName}`);
            };
            img.src = `assets/${textureName}`;
            this.textures[textureName.replace('.png', '')] = img;
        });
    }
    
    setupParallaxLayers() {
        // Parallax layers WITHOUT clouds
        this.parallaxLayers = [
            {
                name: 'sky',
                texture: 'nieb',
                speed: 0.1,  // Slowest - far background
                y: 0,
                scale: 1.5,  // Smaller scale for testing
                mirroring: 1863,
                renderType: 'texture'
            },
            {
                name: 'red_buildings',
                texture: 'download',  // Red brick buildings in background - CORRECTED
                speed: 0.4,  // Background speed
                y: this.height * -0.35,  // Opuszczone o 30% (-65% + 30% = -35%)
                scale: 1.8,  // Zmniejszone o 0.2 (2.0 - 0.2 = 1.8)
                mirroring: 900,
                renderType: 'texture'  // Use texture rendering - NO CLIPPING
            },
            {
                name: 'green_trees',
                texture: 'oblockmid',  // Green trees/bushes behind fence - CORRECTED
                speed: 0.7,  // Closer to foreground
                y: this.height * -0.11,  // Opuszczone o 2% (-13% + 2% = -11%) - idealna pozycja
                scale: 1.5,  // Przywrócona rozsądna skala
                mirroring: 912,
                renderType: 'texture'  // Use texture rendering - NO HEIGHT LIMITS, NO CLIPPING
            },
            {
                name: 'fence_and_sidewalk',
                texture: 'oblockfence',  // Black fence with green bushes + gray sidewalk
                speed: 1.0,  // Full speed - foreground
                y: this.height * 0.3,  // Znacznie wyżej żeby szary chodnik był widoczny
                scale: 1.8,  // Smaller scale for testing
                mirroring: 1000,
                renderType: 'texture'
            }
        ];
        
        // Clouds are now handled in main.js - removed from world
        
        // Initialize scroll positions
        this.parallaxLayers.forEach(layer => {
            layer.scrollX = 0;
        });
    }
    
    generateScrollingContent() {
        // Generate coins that will scroll with the world
        this.coins = [];
        for (let i = 0; i < 20; i++) {
            this.coins.push({
                x: i * 200 + Math.random() * 100,
                y: this.height - 120, // On gray sidewalk
                width: 32,  // Bigger for better visibility
                height: 32,
                collected: false,
                scrolled: false
            });
        }
        
        console.log(`Infinite runner setup: ${this.parallaxLayers.length} parallax layers, ${this.coins.length} scrolling coins`);
    }
    
    addPlatform(x, y, width, height) {
        this.platforms.push({
            x: x,
            y: y,
            width: width,
            height: height,
            type: 'platform'
        });
    }
    
    addWall(x, y, width, height, normal) {
        this.walls.push({
            x: x,
            y: y,
            width: width,
            height: height,
            normal: normal || { x: 1, y: 0 },
            type: 'wall'
        });
    }
    
    addCoin(x, y) {
        this.coins.push({
            x: x,
            y: y,
            width: 16,  // Smaller like in original
            height: 16,
            rotation: 0,
            collected: false,
            type: 'coin'
        });
    }
    
    update(deltaTime, playerState, playerX) {
        // Clouds are now handled in main.js - no longer part of world
        
        // Smooth scroll direction transition
        let targetDirection = 0;
        const centerX = this.width * 0.5;
        const distanceFromCenter = playerX - centerX;
        const centerThreshold = 50; // Don't center if already close
        
        // INSTANT CENTER on dash start!
        if (playerState.isDashing && playerState.dashJustStarted) {
            // Instantly snap camera to center player
            const instantCenterDistance = distanceFromCenter;
            // This will be applied as scrollDistance and move player to center
            return instantCenterDistance; // Return immediately for instant effect
        }
        
        if (playerState.isWalking && playerState.walkDirection !== 0) {
            // Player is moving - follow their direction
            targetDirection = playerState.walkDirection;
        } else {
            // Player stopped - auto-center camera
            if (Math.abs(distanceFromCenter) > centerThreshold) {
                // Slowly scroll to center player
                targetDirection = distanceFromCenter > 0 ? 0.3 : -0.3; // Slow centering
            }
        }
        
        // Lerp current direction towards target (smooth transition)
        const lerpSpeed = 10.0; // How fast to change direction (faster = more responsive)
        this.currentScrollDirection += (targetDirection - this.currentScrollDirection) * lerpSpeed * deltaTime;
        
        // Track how much we scrolled for player adjustment
        let scrollDistance = 0;
        
        // Only scroll if direction is significant
        if (Math.abs(this.currentScrollDirection) > 0.01) {
            // Speed up scrolling during dash (2x faster)
            const speedMultiplier = playerState.isDashing ? 2.0 : 1.0;
            const actualScrollSpeed = this.scrollSpeed * speedMultiplier;
            scrollDistance = actualScrollSpeed * deltaTime * this.currentScrollDirection;
            
            // Update parallax scrolling with smooth direction (completely exclude clouds)
            this.parallaxLayers.forEach(layer => {
                if (layer.name !== 'clouds' && layer.speed > 0) {
                    layer.scrollX += actualScrollSpeed * layer.speed * deltaTime * this.currentScrollDirection;
                    
                    // NO wrapping here - let it grow infinitely
                    // Wrapping will be handled in rendering based on actual tile width
                }
            });
            
            // Update scrolling coins with smooth direction
            this.coins.forEach(coin => {
                coin.x -= actualScrollSpeed * deltaTime * this.currentScrollDirection;
                
                // Mark coins that have scrolled off screen (either direction)
                if (coin.x < -coin.width || coin.x > this.width + coin.width) {
                    coin.scrolled = true;
                }
            });
            
            // Remove scrolled coins
            this.coins = this.coins.filter(coin => !coin.scrolled && !coin.collected);
            
            // Infinite scroller - add coins when needed
            const spawnDistance = 400; // Distance from edge to spawn
            const minCoinSpacing = 200; // Minimum distance between coins
            
            if (this.currentScrollDirection > 0.05) {
                // Scrolling left - check if we need coins on the right
                const coinXs = this.coins.map(c => c.x);
                const rightmostCoin = coinXs.length > 0 ? Math.max(...coinXs) : this.width / 2;
                
                // Add coins if furthest coin is getting close to screen
                if (rightmostCoin < this.width + spawnDistance) {
                    const newX = rightmostCoin + minCoinSpacing + Math.random() * 100;
                    this.coins.push({
                        x: newX,
                        y: this.height - 120,
                        width: 32,
                        height: 32,
                        collected: false,
                        scrolled: false,
                        rotation: 0
                    });
                }
            } else if (this.currentScrollDirection < -0.05) {
                // Scrolling right - check if we need coins on the left
                const coinXs = this.coins.map(c => c.x);
                const leftmostCoin = coinXs.length > 0 ? Math.min(...coinXs) : this.width / 2;
                
                // Add coins if furthest coin is getting close to screen
                if (leftmostCoin > -spawnDistance) {
                    const newX = leftmostCoin - minCoinSpacing - Math.random() * 100;
                    this.coins.push({
                        x: newX,
                        y: this.height - 120,
                        width: 32,
                        height: 32,
                        collected: false,
                        scrolled: false,
                        rotation: 0
                    });
                }
            }
        }
        
        // Always rotate coins (even when not walking)
        this.coins.forEach(coin => {
            if (!coin.rotation) coin.rotation = 0;
            coin.rotation += 180 * deltaTime;
            if (coin.rotation >= 360) coin.rotation -= 360;
        });
        
        // Return scroll distance for player adjustment
        return scrollDistance;
    }
    
    render(ctx) {
        this.renderParallaxLayers(ctx);
        // Clouds are now rendered in main.js context, not world context
        this.renderScrollingCoins(ctx);
    }
    
    renderParallaxLayers(ctx) {
        // Render each parallax layer with proper scrolling
        this.parallaxLayers.forEach(layer => {
            if (layer.renderType === 'buildings') {
                this.renderScrollingBuildings(ctx, layer);
            } else if (layer.renderType === 'texture') {
                const texture = this.textures[layer.texture];
                if (!texture || !texture.complete) return;
                
                const layerY = layer.y;
                
                // Calculate how many tiles we need to cover the screen plus scroll offset
                const tileWidth = texture.width * layer.scale;
                // Proper modulo for smooth wrapping (handles negative values)
                const normalizedScrollX = ((layer.scrollX % tileWidth) + tileWidth) % tileWidth;
                const startX = -normalizedScrollX;
                const tilesNeeded = Math.ceil((this.width + tileWidth) / tileWidth) + 1; // +1 for safety
                
                // Draw repeating tiles for infinite scrolling
                for (let i = 0; i < tilesNeeded; i++) {
                    const x = startX + (i * tileWidth);
                    
                    // Only draw if tile is visible
                    if (x + tileWidth >= 0 && x <= this.width) {
                        ctx.save();
                        ctx.scale(layer.scale, layer.scale);
                        ctx.drawImage(
                            texture,
                            x / layer.scale,
                            layerY / layer.scale
                        );
                        ctx.restore();
                    }
                }
            }
        });
    }
    
    // renderIndependentClouds removed - now handled in main.js
    
    renderScrollingBuildings(ctx, layer) {
        // Render red brick buildings in background like in screenshot
        const texture = this.textures[layer.texture];
        if (!texture || !texture.complete) {
            // Fallback red buildings
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, layer.y, this.width, this.height * 0.8);
            return;
        }
        
        const buildingHeight = this.height * 0.8;  // Taller buildings like original
        const tileWidth = texture.width * layer.scale;
        const tileHeight = texture.height * layer.scale;
        const startX = -layer.scrollX % tileWidth;
        
        // Draw repeating building texture with scaling
        for (let x = startX; x < this.width + tileWidth; x += tileWidth) {
            // Tile vertically to fill building height
            for (let y = layer.y; y < layer.y + buildingHeight; y += tileHeight) {
                const drawHeight = Math.min(tileHeight, layer.y + buildingHeight - y);
                ctx.drawImage(
                    texture,
                    0, 0, texture.width, texture.height * (drawHeight / tileHeight),
                    x, y, tileWidth, drawHeight
                );
            }
        }
    }
    
    

    

    
    renderWalls(ctx) {
        for (const wall of this.walls) {
            // Use original fence texture for walls
            if (this.textures.oblockfence && this.textures.oblockfence.complete) {
                // Tile the wall texture
                const tileWidth = this.textures.oblockfence.width;
                const tileHeight = this.textures.oblockfence.height;
                
                for (let x = wall.x; x < wall.x + wall.width; x += tileWidth) {
                    for (let y = wall.y; y < wall.y + wall.height; y += tileHeight) {
                        const drawWidth = Math.min(tileWidth, wall.x + wall.width - x);
                        const drawHeight = Math.min(tileHeight, wall.y + wall.height - y);
                        
                        ctx.drawImage(
                            this.textures.oblockfence,
                            0, 0, drawWidth, drawHeight,
                            x, y, drawWidth, drawHeight
                        );
                    }
                }
            } else {
                // Fallback to original rendering
                ctx.fillStyle = '#696969';
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            }
        }
    }
    
    renderScrollingCoins(ctx) {
        for (const coin of this.coins) {
            if (coin.collected || coin.x < -coin.width || coin.x > this.width + coin.width) continue;
            
            ctx.save();
            
            // Move to coin center
            ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
            
            // Rotate coin for spinning effect
            ctx.rotate((coin.rotation || 0) * Math.PI / 180);
            
            // Use original coin texture if available
            if (this.textures.oblck && this.textures.oblck.complete) {
                // Draw the coin texture
                ctx.drawImage(
                    this.textures.oblck,
                    -coin.width / 2, -coin.height / 2,
                    coin.width, coin.height
                );
            } else {
                // Fallback coin rendering with better visuals
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.width / 2);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.7, '#FFA500');
                gradient.addColorStop(1, '#FF8C00');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Add border
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Add $ symbol
                ctx.fillStyle = '#B8860B';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 0);
            }
            
            ctx.restore();
        }
    }
    
    // Helper methods for collision detection
    getPlatforms() {
        return this.platforms;
    }
    
    getWalls() {
        return this.walls;
    }
    
    getCoins() {
        return this.coins.filter(coin => !coin.collected);
    }
}