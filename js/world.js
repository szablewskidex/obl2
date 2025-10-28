// World class - Infinite Runner with Parallax Scrolling - using original Bungvo assets
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // ✅ Usuń stałą GROUND_LEVEL - używaj tylko getGroundY()
        
        // Infinite runner - no static platforms, everything scrolls
        this.coins = [];
        this.healthPacks = []; // Apteczki do regeneracji HP
        this.obstacles = []; // Legacy - now using ObstacleManager
        
        // Initialize obstacle manager
        this.obstacleManager = null; // Will be initialized after loading obstacles.js
        
        // Parallax scrolling system
        this.scrollSpeed = 250; // Base scroll speed - matches player speed
        this.currentScrollDirection = 0; // Smooth scroll direction
        this.totalScrollDistance = 0; // Track total scroll distance from start
        
        // ✅ DODAJ: Track camera position (not total scroll)
        this.cameraX = 0; // Current camera X position in world
        this.minCameraX = 0; // Leftmost position camera can be (updated as player moves right)
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
            'moneta.png',         // Coin texture (renamed from oblck.png)
            'obstacle1.png',      // Tall block texture for obstacles (renamed from oblckclck.png)
            'police_car.png'      // Police car obstacle (can jump on)
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
        // ✅ Detect PWA for smaller parallax assets
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        const pwaScaleReduction = isPWA ? 0.8 : 1.0; // 20% smaller on PWA
        
        console.log('PWA detected:', isPWA, 'Scale reduction:', pwaScaleReduction);
        
        // ✅ Lepsze skalowanie dla mobile - wszystkie assety mniejsze na telefonie
        const mobileScale = this.height < 600 ? 0.6 : 1.0; // 40% mniejsze na mobile
        
        // Parallax layers WITHOUT clouds
        this.parallaxLayers = [
            {
                name: 'sky',
                texture: 'nieb',
                speed: 0.1,  // Slowest - far background
                y: 0,
                scale: 1.5 * pwaScaleReduction * mobileScale,  // Dodatkowe zmniejszenie na mobile
                mirroring: 1863,
                renderType: 'texture'
            },
            {
                name: 'red_buildings',
                texture: 'download',  // Red brick buildings in background - CORRECTED
                speed: 0.4,  // Background speed
                y: this.height < 500 ? this.height * 0.15 :  // Bardzo małe ekrany
                   this.height < 600 ? this.height * 0.10 :  // Mobile
                   this.height < 800 ? this.height * 0.05 :  // Tablet
                   this.height * 0.05,                       // Desktop
                scale: (this.height < 500 ? 0.6 :            // Bardzo małe ekrany
                        this.height < 600 ? 0.8 :            // Mobile
                        this.height < 800 ? 1.2 :            // Tablet (twój przypadek)
                        1.8) * pwaScaleReduction,             // Desktop
                mirroring: 900,
                renderType: 'texture'  // Use texture rendering - NO CLIPPING
            },
            {
                name: 'green_trees',
                texture: 'oblockmid',  // Green trees/bushes behind fence - CORRECTED
                speed: 0.7,  // Closer to foreground
                y: this.height < 500 ? this.height * 0.35 :  // Bardzo małe ekrany
                   this.height < 600 ? this.height * 0.30 :  // Mobile
                   this.height < 800 ? this.height * 0.25 :  // Tablet
                   this.height * 0.25,                       // Desktop
                scale: (this.height < 500 ? 0.4 :            // Bardzo małe ekrany
                        this.height < 600 ? 0.6 :            // Mobile
                        this.height < 800 ? 1.0 :            // Tablet (twój przypadek)
                        1.5) * pwaScaleReduction,             // Desktop
                mirroring: 912,
                renderType: 'texture'  // Use texture rendering - NO HEIGHT LIMITS, NO CLIPPING
            },
            {
                name: 'fence_and_sidewalk',
                texture: 'oblockfence',  // Black fence with green bushes + gray sidewalk
                speed: 1.0,  // Full speed - foreground
                y: this.height < 500 ? this.height - 80 :    // Bardzo małe ekrany - wyżej żeby chodnik był widoczny
                   this.height < 600 ? this.height - 100 :   // Mobile - wyżej żeby chodnik był widoczny
                   this.height < 800 ? this.height - 120 :   // Tablet - wyżej żeby chodnik był widoczny
                   this.height * 0.60,                       // Desktop
                scale: this.height < 500 ? 0.8 :             // Bardzo małe ekrany
                       this.height < 600 ? 1.0 :             // Mobile  
                       this.height < 800 ? 1.4 :             // Tablet (twój przypadek)
                       1.8,                                   // Desktop
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
                y: this.getGroundY() - 100, // On gray sidewalk
                width: 32,  // Bigger for better visibility
                height: 32,
                collected: false,
                scrolled: false
            });
        }
        
        // Generate health packs with 5% chance - bardzo rzadkie
        this.healthPacks = [];
        for (let i = 0; i < 20; i++) {
            if (Math.random() < 0.05) { // 5% szansy na spawn (zmniejszone z 20%)
                this.healthPacks.push({
                    x: i * 500 + Math.random() * 200, // Znacznie bardziej rozrzucone
                    y: this.getGroundY() - 110, // Trochę wyżej niż monety
                    width: 40,  // Trochę większe niż monety
                    height: 40,
                    collected: false,
                    scrolled: false
                });
            }
        }
        
        console.log(`Infinite runner setup: ${this.parallaxLayers.length} parallax layers, ${this.coins.length} scrolling coins`);
        
        // Initialize obstacle manager after a short delay to ensure ObstacleManager is loaded
        setTimeout(() => {
            if (typeof ObstacleManager !== 'undefined') {
                this.obstacleManager = new ObstacleManager(this.height);
                console.log('Obstacle manager initialized');
                
                // Generate some initial obstacles for testing
                this.generateInitialObstacles();
            }
        }, 100);
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
    
    update(deltaTime, playerState, playerX, screenWidth) {
        // Update obstacle manager ground level if height changed
        if (this.obstacleManager && this.obstacleManager.worldHeight !== this.height) {
            this.obstacleManager.updateGroundY(this.height);
        }
        
        // ✅ Progressive speed scaling - infinite runner gets faster over time
        const baseScrollSpeed = 250; // Starting speed
        const speedIncrease = Math.floor(this.totalScrollDistance / 5000) * 25; // +25 speed every 5000 units
        const maxSpeedIncrease = 200; // Cap at +200 speed (450 total)
        
        this.scrollSpeed = baseScrollSpeed + Math.min(speedIncrease, maxSpeedIncrease);
        
        // ✅ Difficulty scaling - gra staje się trudniejsza z czasem
        const difficulty = 1 + Math.floor(this.totalScrollDistance / 10000) * 0.2;
        
        // Przekaż difficulty i scroll speed do enemy managera
        if (window.game && window.game.enemyManager) {
            window.game.enemyManager.updateDifficulty(difficulty, this.scrollSpeed);
        }
        
        // Debug info removed to prevent spam
        
        // Clouds are now handled in main.js - no longer part of world
        
        // ✅ DEAD ZONE CAMERA SYSTEM - mniejsza martwa strefa
        let targetDirection = 0;
        const centerX = this.width * 0.5;
        const distanceFromCenter = playerX - centerX;
        const deadZoneWidth = this.width * 0.15; // 15% szerokości ekranu (zmniejszone z 30%)
        const deadZoneLeft = centerX - deadZoneWidth / 2;
        const deadZoneRight = centerX + deadZoneWidth / 2;
        
        // ✅ WYŁĄCZONE: Instant center on dash - nie teleportuj kamery podczas dash
        // Dash nie powinien wpływać na pozycję kamery, tylko na prędkość scrollowania
        if (playerState.isDashing && playerState.dashJustStarted) {
            // Nie rób nic - pozwól normalnej logice dead zone obsłużyć dash
        }
        
        // ✅ DEAD ZONE LOGIC - mniejsza martwa strefa, lepsze działanie
        if (playerState.isWalking && playerState.walkDirection !== 0) {
            // Sprawdź czy gracz jest w martwej strefie
            if (playerX >= deadZoneLeft && playerX <= deadZoneRight) {
                // Gracz w martwej strefie - kamera się nie rusza
                targetDirection = 0;
            } else {
                // Gracz poza martwą strefą - kamera podąża
                if (playerX < deadZoneLeft && playerState.walkDirection < 0) {
                    // Gracz po lewej i idzie w lewo
                    targetDirection = playerState.walkDirection;
                } else if (playerX > deadZoneRight && playerState.walkDirection > 0) {
                    // Gracz po prawej i idzie w prawo
                    targetDirection = playerState.walkDirection;
                } else {
                    // Gracz wraca do martwej strefy - centruj
                    targetDirection = playerX < deadZoneLeft ? 0.5 : -0.5;
                }
            }
        } else {
            // Gracz się zatrzymał - centruj jeśli jest poza martwą strefą
            if (Math.abs(distanceFromCenter) > deadZoneWidth / 2 + 20) {
                targetDirection = distanceFromCenter > 0 ? 0.3 : -0.3;
            } else {
                targetDirection = 0;
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
            
            // Usunięto spam logów
            
            // ✅ POPRAWIONA LOGIKA GRANIC - pozwól na centrowanie gracza
            if (this.currentScrollDirection < 0) {
                // Scrolling left (moving camera right, going backwards)
                const newCameraX = this.cameraX + scrollDistance;
                
                // ✅ Pozwól na centrowanie gracza nawet przy granicy
                const isPlayerFarRight = playerX > this.width * 0.7; // Gracz po prawej stronie
                const isCentering = Math.abs(targetDirection) < 0.5; // To jest centrowanie, nie pełny ruch
                
                if (newCameraX < this.minCameraX && !isPlayerFarRight) {
                    // Blokuj tylko jeśli gracz nie jest daleko po prawej
                    scrollDistance = this.minCameraX - this.cameraX; // Move exactly to boundary
                    this.currentScrollDirection = 0; // Stop scrolling
                    // Blocked backward movement
                } else if (newCameraX < this.minCameraX && isPlayerFarRight && isCentering) {
                    // Pozwól na ograniczone centrowanie gdy gracz jest daleko po prawej
                    const maxCenteringDistance = Math.min(Math.abs(scrollDistance), 50); // Maksymalnie 50px centrowania
                    scrollDistance = -maxCenteringDistance;
                    // Limited centering applied
                }
            } else if (this.currentScrollDirection > 0) {
                // Scrolling right (moving camera left, going forward)
                const newCameraX = this.cameraX + scrollDistance;
                
                // ✅ Update minCameraX - track furthest right position (highest cameraX value)
                if (newCameraX > this.minCameraX) {
                    this.minCameraX = newCameraX;
                    // Updated furthest right position
                }
            }
            
            // Update camera position
            this.cameraX += scrollDistance;
            
            // Camera position updated silently
            
            // Update total scroll distance (for other systems)
            this.totalScrollDistance += Math.abs(scrollDistance);
            
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
            
            // Update scrolling health packs with smooth direction
            this.healthPacks.forEach(healthPack => {
                healthPack.x -= actualScrollSpeed * deltaTime * this.currentScrollDirection;
                
                // Mark health packs that have scrolled off screen
                if (healthPack.x < -healthPack.width || healthPack.x > this.width + healthPack.width) {
                    healthPack.scrolled = true;
                }
            });
            
            // Remove scrolled coins and health packs
            this.coins = this.coins.filter(coin => !coin.scrolled && !coin.collected);
            this.healthPacks = this.healthPacks.filter(hp => !hp.scrolled && !hp.collected);
            
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
                        y: this.getGroundY() - 100,
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
                        y: this.getGroundY() - 100,
                        width: 32,
                        height: 32,
                        collected: false,
                        scrolled: false,
                        rotation: 0
                    });
                }
            }
            
            // Spawn health packs with 20% chance - podobnie jak monety ale rzadziej
            if (this.currentScrollDirection > 0.05) {
                // Scrolling left - check if we need health packs on the right
                const healthPackXs = this.healthPacks.map(hp => hp.x);
                const rightmostHealthPack = healthPackXs.length > 0 ? Math.max(...healthPackXs) : this.width / 2;
                
                // Add health pack with 3% chance if needed (bardzo rzadko)
                if (rightmostHealthPack < this.width + spawnDistance && Math.random() < 0.03) {
                    const newX = rightmostHealthPack + 600 + Math.random() * 400; // Znacznie większy spacing
                    this.healthPacks.push({
                        x: newX,
                        y: this.getGroundY() - 110,
                        width: 40,
                        height: 40,
                        collected: false,
                        scrolled: false
                    });
                }
            } else if (this.currentScrollDirection < -0.05) {
                // Scrolling right - check if we need health packs on the left
                const healthPackXs = this.healthPacks.map(hp => hp.x);
                const leftmostHealthPack = healthPackXs.length > 0 ? Math.min(...healthPackXs) : this.width / 2;
                
                // Add health pack with 3% chance if needed (bardzo rzadko)
                if (leftmostHealthPack > -spawnDistance && Math.random() < 0.03) {
                    const newX = leftmostHealthPack - 600 - Math.random() * 400; // Znacznie większy spacing
                    this.healthPacks.push({
                        x: newX,
                        y: this.getGroundY() - 110,
                        width: 40,
                        height: 40,
                        collected: false,
                        scrolled: false
                    });
                }
            }
            
        }
        
        // Update obstacles (always, with current scroll speed)
        if (this.obstacleManager) {
            const speedMultiplier = playerState.isDashing ? 2.0 : 1.0;
            const currentScrollSpeed = this.scrollSpeed * speedMultiplier;
            this.obstacleManager.update(deltaTime, currentScrollSpeed, this.currentScrollDirection, this.width);
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
        this.renderHealthPacks(ctx);
        
        // Render obstacles
        if (this.obstacleManager) {
            this.obstacleManager.render(ctx, this.textures);
        }
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
                // ✅ Prostsze rozwiązanie parallax wrapping
                if (Math.abs(layer.scrollX) > tileWidth) {
                    layer.scrollX = layer.scrollX % tileWidth;
                }
                const normalizedScrollX = layer.scrollX;
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
            
            // Use moneta texture for coins
            if (this.textures.moneta && this.textures.moneta.complete) {
                // Draw the coin texture from moneta.png
                ctx.drawImage(
                    this.textures.moneta,
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
    
    renderHealthPacks(ctx) {
        for (const healthPack of this.healthPacks) {
            if (healthPack.collected || healthPack.x < -healthPack.width || healthPack.x > this.width + healthPack.width) continue;
            
            ctx.save();
            
            // Move to health pack center
            ctx.translate(healthPack.x + healthPack.width / 2, healthPack.y + healthPack.height / 2);
            
            // Pulsing effect
            const time = Date.now() / 1000;
            const pulse = 1 + Math.sin(time * 4) * 0.1;
            ctx.scale(pulse, pulse);
            
            // Draw health pack - czerwony krzyż na białym tle
            // Białe tło
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-healthPack.width / 2, -healthPack.height / 2, healthPack.width, healthPack.height);
            
            // Czerwona ramka
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(-healthPack.width / 2, -healthPack.height / 2, healthPack.width, healthPack.height);
            
            // Czerwony krzyż
            ctx.fillStyle = '#ff0000';
            // Pozioma belka krzyża
            ctx.fillRect(-healthPack.width * 0.3, -healthPack.height * 0.1, healthPack.width * 0.6, healthPack.height * 0.2);
            // Pionowa belka krzyża
            ctx.fillRect(-healthPack.width * 0.1, -healthPack.height * 0.3, healthPack.width * 0.2, healthPack.height * 0.6);
            
            // Glow effect
            ctx.shadowColor = '#ff0066';
            ctx.shadowBlur = 10;
            ctx.strokeRect(-healthPack.width / 2, -healthPack.height / 2, healthPack.width, healthPack.height);
            
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
    
    generateInitialObstacles() {
        if (!this.obstacleManager) return;
        
        // Generate fewer obstacles, further away from player
        const obstacleTypes = ['block', 'fence', 'platform']; // Remove tall_block from initial spawn
        const groundY = this.getGroundY();
        
        // Only spawn 3 obstacles initially, far ahead
        const numObstacles = 3;
        for (let i = 0; i < numObstacles; i++) {
            const x = 800 + i * 500; // Start 800px ahead, space 500px apart
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            // Create obstacle
            const obstacle = new Obstacle(x, groundY - 40, type);
            
            // Adjust Y position for different obstacle types
            if (type === 'platform') {
                obstacle.y = groundY - 60;
            } else if (type === 'tall_block') {
                obstacle.y = groundY - 80;
            }
            
            this.obstacleManager.obstacles.push(obstacle);
        }
        
        console.log(`Generated ${this.obstacleManager.obstacles.length} initial obstacles`);
    }
    
    // Check collisions with obstacles
    checkObstacleCollisions(player) {
        if (this.obstacleManager) {
            return this.obstacleManager.checkCollisions(player);
        }
        return [];
    }
    
    // Get active obstacles for other systems
    getActiveObstacles() {
        if (this.obstacleManager) {
            return this.obstacleManager.getActiveObstacles();
        }
        return [];
    }
    
    // Get ground level - dopasowany do rzeczywistej pozycji chodnika
    getGroundY() {
        // ✅ Poprawione pozycjonowanie - gracz ma stać NA chodnik
        if (this.height < 500) {
            return this.height - 40; // Bardzo małe ekrany
        } else if (this.height < 600) {
            return this.height - 50; // Mobile
        } else if (this.height < 800) {
            return this.height - 60; // Tablet
        }
        return this.height - 80; // Desktop
    }
}