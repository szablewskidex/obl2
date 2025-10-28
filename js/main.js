// Main game initialization and loop
class BungvoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        
        // Game objects
        this.player = null;
        this.world = null;
        this.ui = null;
        this.physics = null;
        this.weaponSystem = null;
        this.enemyManager = null;
        
        // Game stats
        this.score = 0;
        this.playerHP = 100;
        this.maxHP = 100;
        this.coinsCollected = 0;
        this.totalCoins = 0;
        this.highScore = this.loadHighScore();
        this.levelCompleted = false; // Flag to prevent multiple level complete triggers
        
        // Input handling
        this.keys = {};
        this.gamepadManager = new GamepadManager();
        this.fullscreenManager = new FullscreenManager();
        this.setupInput();
        
        // Game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        // Initialize UI
        this.updateUI();
    }
    
    init() {
        // Initialize game objects
        this.physics = new Physics();
        this.world = new World(this.canvas.width, this.canvas.height);
        // Stwórz gracza dokładnie na poziomie ziemi - wysokość będzie responsive
        this.player = new Player(100, 0, this.physics); // Tymczasowa pozycja Y
        // Ustaw prawidłową pozycję Y po stworzeniu gracza (gdy już ma responsive height)
        this.player.y = this.world.getGroundY() - this.player.height;
        this.ui = new UI();
        this.weaponSystem = new WeaponSystem();
        this.enemyManager = new EnemyManager(this.canvas.width, this.canvas.height);
        
        // Count total coins
        this.totalCoins = this.world.coins.length;
        this.coinsCollected = 0;
        
        // Reset game state
        this.score = 0;
        this.playerHP = 100;
        this.maxHP = 100;
        this.levelCompleted = false; // Reset level completion flag
        this.updateUI();
        
        console.log('Game initialized');
    }
    
    setupInput() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle special keys
            if (e.code === 'KeyM' && this.gameState === 'paused') {
                // Go to main menu from pause
                this.showMenu();
                return;
            }
            
            if (e.code === 'Escape') {
                console.log('ESC pressed, mobile:', this.isMobile(), 'gameState:', this.gameState);
                
                // ✅ Skip Game Over video if playing
                if (this.gameState === 'gameOver') {
                    const video = document.querySelector('video');
                    if (video) {
                        console.log('Skipping Game Over video with ESC');
                        video.pause();
                        // Remove video and skip text
                        if (video.parentNode) document.body.removeChild(video);
                        const skipText = document.querySelector('div[style*="Click, tap or press ESC"]');
                        if (skipText && skipText.parentNode) document.body.removeChild(skipText);
                        this.showMenu();
                        return;
                    }
                }
                
                // Only block ESC on mobile during gameplay, allow in menu
                if (this.isMobile() && this.gameState === 'playing') {
                    console.log('Ignoring ESC on mobile during gameplay');
                    return;
                }
                this.togglePause();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse input for shooting and aiming
        this.mouseY = 0;
        this.lastMouseY = 0;
        this.mouseDeltaY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.keys['MouseLeft'] = true;
            }
            e.preventDefault();
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left mouse button
                this.keys['MouseLeft'] = false;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseY = e.clientY - rect.top;
            this.mouseDeltaY = this.mouseY - this.lastMouseY;
            this.lastMouseY = this.mouseY;
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update gamepad
        this.gamepadManager.update();
        
        // Combine keyboard, gamepad, and touch inputs
        const combinedKeys = { ...this.keys };
        const gamepadKeys = this.gamepadManager.getVirtualKeys();
        Object.assign(combinedKeys, gamepadKeys);
        
        // Add touch controls
        if (window.touchControls && typeof window.touchControls.getStates === 'function') {
            const touchStates = window.touchControls.getStates();
            if (touchStates.left) combinedKeys['KeyA'] = true;
            if (touchStates.right) combinedKeys['KeyD'] = true;
            if (touchStates.jump) combinedKeys['Space'] = true;
            if (touchStates.dash) combinedKeys['ShiftLeft'] = true;
        }
        
        // Update player and get walking state
        const playerState = this.player.update(deltaTime, combinedKeys, this.world);
        
        // Update weapon system
        if (this.weaponSystem) {
            // Pass mouse and gamepad data for aiming
            const aimInput = {
                mouseDeltaY: this.mouseDeltaY || 0,
                gamepadLeftStickY: this.gamepadManager.getAxisValue(this.gamepadManager.axes.LEFT_STICK_Y) || 0
            };
            this.weaponSystem.update(deltaTime, combinedKeys, this.player, this.canvas.width, this.canvas.height, aimInput);
        }
        
        // Update enemies
        if (this.enemyManager) {
            this.enemyManager.update(deltaTime, this.player, this.world, this.world.currentScrollDirection, this.canvas.width);
        }
        
        // Reset mouse delta
        this.mouseDeltaY = 0;
        
        // Update UI effects (combat texts, particles, etc.)
        if (this.ui) {
            this.ui.update(deltaTime);
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update world (scrolling with auto-centering)
        const scrollDistance = this.world.update(deltaTime, playerState, this.player.x, this.canvas.width);
        
        // ✅ Update player speed to match world scroll speed
        this.player.updateSpeed(this.world.scrollSpeed);
        
        // Adjust player position to compensate for world scrolling
        // This keeps player centered while world scrolls
        if (scrollDistance !== 0) {
            this.player.x -= scrollDistance;
            
            // ✅ ALSO adjust enemy positions to compensate for world scrolling
            // This prevents AI from reacting to scrolling-induced position changes
            if (this.enemyManager) {
                this.enemyManager.enemies.forEach(enemy => {
                    enemy.x -= scrollDistance;
                });
            }
        }
        
        // ✅ Update independent clouds AFTER world scrolling to compensate
        this.updateIndependentClouds(deltaTime, scrollDistance);
        
        // Update dash power bar every frame
        this.updateDashBar();
        
        // Check if player fell off the world (only if not already dead/respawning)
        if (this.player.y > this.canvas.height + 200 && this.gameState === 'playing') {
            console.log('Player fell off world:', this.player.y, 'canvas height:', this.canvas.height);
            this.playerDied();
        }
    }
    
    checkCollisions() {
        // Check item collection on sidewalk
        for (let i = this.world.coins.length - 1; i >= 0; i--) {
            const coin = this.world.coins[i];
            if (this.physics.checkCollision(this.player, coin)) {
                this.collectCoin(coin, i);
            }
        }
        
        // Check health pack collection
        for (let i = this.world.healthPacks.length - 1; i >= 0; i--) {
            const healthPack = this.world.healthPacks[i];
            if (this.physics.checkCollision(this.player, healthPack)) {
                this.collectHealthPack(healthPack, i);
            }
        }
        
        // Check obstacle collisions
        const obstacleCollisions = this.world.checkObstacleCollisions(this.player);
        if (obstacleCollisions.length > 0) {
            // Player hit an obstacle
            this.handleObstacleCollision(obstacleCollisions[0]);
        }
        
        // Check bullet collisions with obstacles
        if (this.world && this.world.obstacleManager) {
            const activeObstacles = this.world.obstacleManager.getActiveObstacles();
            const bulletHits = this.weaponSystem.checkBulletCollisions(activeObstacles);
            bulletHits.forEach(hit => {
                if (hit.destroyed) {
                    // Obstacle was destroyed
                    this.score += 25; // Bonus points for destroying obstacles
                } else {
                    // Obstacle was damaged but not destroyed
                    this.score += 5; // Small points for hitting
                }
                this.updateUI();
            });
        }
        
        // Check bullet collisions with enemies
        if (this.enemyManager && this.weaponSystem) {
            // Pass world object for combat text coordinate conversion
            const enemyHits = this.enemyManager.checkBulletCollisions(this.weaponSystem.bullets, this.ui, this.world);
            enemyHits.forEach(hit => {
                if (hit.killed) {
                    let killScore = 50;
                    if (hit.isHeadshot) {
                        killScore += 25; // Bonus for headshot kill
                    }
                    this.score += killScore;
                } else {
                    let hitScore = 10;
                    if (hit.isHeadshot) {
                        hitScore += 5; // Bonus for headshot hit
                    }
                    this.score += hitScore;
                }
                this.updateUI();
            });
        }
        
        // Check enemy collisions with player
        if (this.enemyManager) {
            const enemyCollisions = this.enemyManager.checkCollisions(this.player);
            if (enemyCollisions.length > 0) {
                this.handleEnemyCollision(enemyCollisions[0]);
            }
        }
        
        // No platform or wall collisions needed - just walking on sidewalk
    }
    
    collectCoin(coin, index) {
        this.world.coins.splice(index, 1);
        this.coinsCollected++;
        this.score += 10;
        
        // Add dash power
        this.player.addDashPower(this.player.dashPowerPerCoin);
        
        this.updateUI();
        this.updateDashBar(); // ✅ Priority 5 fix: Update dash UI when collecting coins
        
        console.log('Coin collected!');
    }
    
    collectHealthPack(healthPack, index) {
        this.world.healthPacks.splice(index, 1);
        
        // Heal player - apteczka regeneruje 30 HP
        const healAmount = 30;
        const oldHP = this.playerHP;
        this.playerHP = Math.min(this.maxHP, this.playerHP + healAmount);
        const actualHeal = this.playerHP - oldHP;
        
        this.score += 25; // Bonus punkty za apteczkę
        this.updateUI();
        
        // Show heal combat text with world coordinates
        if (this.ui && actualHeal > 0) {
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerTopY = this.player.y - 10;
            
            // Now using world coordinates directly - no conversion needed
            this.ui.createCombatText(playerCenterX, playerTopY, `+${actualHeal} HP`, 'bonus');
        }
        
        console.log(`Health pack collected! +${actualHeal} HP (${this.playerHP}/${this.maxHP})`);
    }
    
    handleEnemyCollision(enemy) {
        // Player takes damage from enemy - różne damage dla różnych typów
        let damage = 20; // Domyślne damage
        switch(enemy.type) {
            case 'basic': damage = 15; break;
            case 'fast': damage = 10; break;
            case 'tank': damage = 25; break;
        }
        
        const actualDamage = this.player.takeDamage(damage);
        if (actualDamage > 0) {
            console.log(`Player hit by ${enemy.type} enemy! -${actualDamage} HP`);
            this.playerHP -= actualDamage;
            this.updateUI();
            
            // Add screen shake effect
            if (this.ui) {
                this.ui.addScreenShake(10, 0.3);
            }
            
            // Check if player died
            if (this.playerHP <= 0) {
                this.playerHP = 0;
                this.gameOver();
            }
        }
    }
    
    handleObstacleCollision(obstacle) {
        // Check if obstacle doesn't damage player (like police car)
        if (!obstacle.damagesPlayer) {
            // Player can stand on it or pass through without damage
            console.log(`Player on ${obstacle.type} (no damage)`);
            return;
        }
        
        // Different behavior based on obstacle type and player state
        if (this.player.isDashing) {
            // Dashing through obstacles - destroy them or bounce off
            if (obstacle.type === 'block' || obstacle.type === 'fence') {
                // Destroy smaller obstacles when dashing with animation
                obstacle.destroy();
                this.score += 5; // Bonus points for destroying obstacles
                console.log(`Destroyed ${obstacle.type} while dashing!`);
                return;
            }
        }
        
        // Check if player is vulnerable (not invincible)
        if (!this.player.isVulnerable()) {
            return; // Player is invincible, ignore collision
        }
        
        // Player takes damage - destroy obstacle with animation and lose life
        console.log(`Player hit ${obstacle.type}!`);
        obstacle.destroy(); // Start destruction animation
        
        // Apply damage with invincibility frames - różne damage dla różnych przeszkód
        let damage = 30; // Domyślne damage dla przeszkód
        switch(obstacle.type) {
            case 'block': damage = 25; break;
            case 'fence': damage = 20; break;
            case 'car': damage = 40; break;
            case 'police_car': damage = 35; break;
            default: damage = 30; break;
        }
        
        const actualDamage = this.player.takeDamage(damage);
        if (actualDamage > 0) {
            console.log(`Player hit ${obstacle.type}! -${actualDamage} HP`);
            this.playerHP -= actualDamage;
            this.updateUI();
            
            // Add screen shake effect
            if (this.ui) {
                this.ui.addScreenShake(15, 0.4);
            }
            
            if (this.playerHP <= 0) {
                this.playerHP = 0;
                this.gameOver();
            }
        }
        // Don't respawn - just continue playing with fewer lives and invincibility
    }
    
    playerDied() {
        // Instant death - set HP to 0
        this.playerHP = 0;
        this.updateUI();
        this.gameOver();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // ✅ Play Game Over video
        this.playGameOverVideo();
        
        console.log('Game Over!');
    }
    
    playGameOverVideo() {
        console.log('playGameOverVideo() called');
        
        // ✅ Check if we're in PWA or mobile - use animated screen instead of video
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true ||
                     this.isMobile();
        
        if (isPWA) {
            console.log('PWA/Mobile detected - showing animated Game Over screen');
            this.showAnimatedGameOver();
            return;
        }
        
        // Desktop - try video
        const video = document.createElement('video');
        video.src = 'assets/GAME_over.mp4';
        video.autoplay = true;
        video.muted = false;
        video.controls = false;
        video.playbackRate = 1.2;
        
        console.log('Desktop video element created with src:', video.src);
        // ✅ Get canvas position and size for proper positioning
        const canvas = this.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        
        video.style.position = 'fixed';
        video.style.top = canvasRect.top + 'px';
        video.style.left = canvasRect.left + 'px';
        video.style.width = canvasRect.width + 'px';
        video.style.height = canvasRect.height + 'px';
        video.style.objectFit = 'cover';
        video.style.zIndex = '9999';
        video.style.backgroundColor = '#000';
        
        // ✅ Fade-in effect
        video.style.opacity = '0';
        video.style.transition = 'opacity 0.5s ease-in-out';
        
        // Create skip instruction overlay
        const skipText = document.createElement('div');
        const isMobile = this.isMobile();
        skipText.innerHTML = isMobile ? 
            'Tap to enable sound • Tap again to skip' : 
            'Click, tap or press ESC to skip';
        skipText.style.position = 'fixed';
        skipText.style.bottom = '20px';
        skipText.style.right = '20px';
        skipText.style.color = 'white';
        skipText.style.fontSize = '16px';
        skipText.style.fontFamily = 'Arial, sans-serif';
        skipText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        skipText.style.zIndex = '10000';
        skipText.style.pointerEvents = 'none';
        
        // ✅ Mobile sound button
        let soundButton = null;
        if (isMobile) {
            soundButton = document.createElement('button');
            soundButton.innerHTML = '🔊 Enable Sound';
            soundButton.style.position = 'fixed';
            soundButton.style.top = '20px';
            soundButton.style.left = '20px';
            soundButton.style.fontSize = '18px';
            soundButton.style.padding = '10px 20px';
            soundButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            soundButton.style.color = 'white';
            soundButton.style.border = '2px solid white';
            soundButton.style.borderRadius = '10px';
            soundButton.style.zIndex = '10000';
            soundButton.style.cursor = 'pointer';
            soundButton.style.opacity = '0';
            soundButton.style.transition = 'opacity 0.3s ease-in-out';
        }
        
        // ✅ Fade-in for skip text (delayed)
        skipText.style.opacity = '0';
        skipText.style.transition = 'opacity 0.3s ease-in-out';
        setTimeout(() => {
            skipText.style.opacity = '1';
            if (soundButton) {
                soundButton.style.opacity = '1';
            }
        }, 1000); // Show after 1 second
        
        // Add to page
        document.body.appendChild(video);
        document.body.appendChild(skipText);
        if (soundButton) {
            document.body.appendChild(soundButton);
        }
        
        console.log('Video and UI elements added to DOM');
        
        // ✅ Enhanced mobile autoplay handling
        let soundEnabled = false;
        let skipClicks = 0;
        
        // ✅ Wait for video to load before trying to play
        let videoLoaded = false;
        let playAttempted = false;
        
        const attemptPlay = () => {
            if (playAttempted) return;
            playAttempted = true;
            
            console.log('Attempting to play video...');
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video started playing successfully');
                    videoLoaded = true;
                }).catch(error => {
                    console.error('Video autoplay failed:', error);
                    if (isMobile) {
                        console.log('Mobile autoplay failed, showing fallback');
                        // Don't immediately go to menu - give user time to interact
                        video.controls = true;
                        video.style.opacity = '1';
                        
                        // Show a play button overlay
                        const playOverlay = document.createElement('div');
                        playOverlay.innerHTML = '▶ Tap to Play Video';
                        playOverlay.style.position = 'fixed';
                        playOverlay.style.top = '50%';
                        playOverlay.style.left = '50%';
                        playOverlay.style.transform = 'translate(-50%, -50%)';
                        playOverlay.style.fontSize = '24px';
                        playOverlay.style.padding = '20px 40px';
                        playOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                        playOverlay.style.color = 'white';
                        playOverlay.style.border = '2px solid white';
                        playOverlay.style.borderRadius = '10px';
                        playOverlay.style.zIndex = '10001';
                        playOverlay.style.cursor = 'pointer';
                        
                        document.body.appendChild(playOverlay);
                        
                        playOverlay.addEventListener('click', () => {
                            video.play();
                            document.body.removeChild(playOverlay);
                        });
                    }
                });
            }
        };
        
        // Wait for video metadata to load
        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            setTimeout(attemptPlay, 100);
        });
        
        // Fallback - try to play after 500ms even if metadata doesn't load
        setTimeout(() => {
            if (!playAttempted) {
                console.log('Fallback play attempt');
                attemptPlay();
            }
        }, 500);
        
        // Sound button handler for mobile
        if (soundButton) {
            soundButton.addEventListener('click', () => {
                if (!soundEnabled) {
                    video.muted = false;
                    soundEnabled = true;
                    soundButton.innerHTML = '🔇 Mute';
                    console.log('Sound enabled on mobile');
                } else {
                    video.muted = true;
                    soundEnabled = false;
                    soundButton.innerHTML = '🔊 Enable Sound';
                    console.log('Sound muted on mobile');
                }
            });
            
            soundButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        }
        
        // ✅ Start fade-in effect when video is ready
        video.addEventListener('loadeddata', () => {
            console.log('Video loadeddata event fired');
            setTimeout(() => {
                video.style.opacity = '1';
            }, 100); // Small delay for smooth effect
        });
        
        // ✅ Also fade in when video starts playing
        video.addEventListener('play', () => {
            console.log('Video play event fired');
            video.style.opacity = '1';
        });
        
        // ✅ Fallback fade-in if events don't fire
        setTimeout(() => {
            console.log('Fallback fade-in triggered');
            video.style.opacity = '1';
        }, 1000); // Longer delay for mobile
        
        // ✅ Handle window resize to keep video aligned with canvas
        const handleResize = () => {
            const newCanvasRect = canvas.getBoundingClientRect();
            video.style.top = newCanvasRect.top + 'px';
            video.style.left = newCanvasRect.left + 'px';
            video.style.width = newCanvasRect.width + 'px';
            video.style.height = newCanvasRect.height + 'px';
        };
        
        window.addEventListener('resize', handleResize);
        
        console.log('Playing Game Over video...');
        
        // Cleanup function
        const cleanup = () => {
            window.removeEventListener('resize', handleResize);
            if (video.parentNode) document.body.removeChild(video);
            if (skipText.parentNode) document.body.removeChild(skipText);
            if (soundButton && soundButton.parentNode) document.body.removeChild(soundButton);
        };
        
        // When video ends, show menu
        video.addEventListener('ended', () => {
            console.log('Game Over video finished');
            cleanup();
            this.showMenu();
        });
        
        // Fallback - if video fails to load, show menu after longer delay
        video.addEventListener('error', (e) => {
            console.error('Game Over video failed to load:', e);
            console.error('Video error details:', e.target.error);
            
            if (isMobile) {
                // On mobile, show a message instead of immediately going to menu
                const errorOverlay = document.createElement('div');
                errorOverlay.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 20px;">Video could not load</div>
                    <button onclick="this.parentNode.parentNode.removeChild(this.parentNode); window.game.showMenu();" 
                            style="font-size: 18px; padding: 10px 20px; background: #333; color: white; border: none; border-radius: 5px;">
                        Continue to Menu
                    </button>
                `;
                errorOverlay.style.position = 'fixed';
                errorOverlay.style.top = '50%';
                errorOverlay.style.left = '50%';
                errorOverlay.style.transform = 'translate(-50%, -50%)';
                errorOverlay.style.textAlign = 'center';
                errorOverlay.style.padding = '30px';
                errorOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                errorOverlay.style.color = 'white';
                errorOverlay.style.borderRadius = '10px';
                errorOverlay.style.zIndex = '10002';
                
                document.body.appendChild(errorOverlay);
            } else {
                cleanup();
                setTimeout(() => {
                    this.showMenu();
                }, 2000);
            }
        });
        
        // Add click/touch to skip video (with mobile sound handling)
        const skipVideo = () => {
            if (isMobile) {
                skipClicks++;
                if (skipClicks === 1 && !soundEnabled) {
                    // First tap - enable sound
                    video.muted = false;
                    soundEnabled = true;
                    if (soundButton) soundButton.innerHTML = '🔇 Mute';
                    console.log('First tap - sound enabled');
                    return;
                }
            }
            
            console.log('Game Over video skipped by user');
            video.pause();
            cleanup();
            this.showMenu();
        };
        
        video.addEventListener('click', skipVideo);
        video.addEventListener('touchstart', (e) => {
            // Prevent event bubbling to sound button
            if (e.target === video) {
                skipVideo();
            }
        });
    }
    
    showAnimatedGameOver() {
        console.log('Showing animated Game Over screen for PWA/Mobile');
        
        // Create full-screen overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'white';
        overlay.style.fontFamily = 'Arial, sans-serif';
        overlay.style.textAlign = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        
        // Animated GAME OVER text
        const gameOverText = document.createElement('h1');
        gameOverText.textContent = 'GAME OVER';
        gameOverText.style.fontSize = '64px';
        gameOverText.style.margin = '20px 0';
        gameOverText.style.color = '#ff0000';
        gameOverText.style.textShadow = '4px 4px 8px rgba(0,0,0,0.8)';
        gameOverText.style.transform = 'scale(0)';
        gameOverText.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Score display
        const scoreContainer = document.createElement('div');
        scoreContainer.style.margin = '30px 0';
        scoreContainer.style.opacity = '0';
        scoreContainer.style.transform = 'translateY(50px)';
        scoreContainer.style.transition = 'all 0.6s ease-out 1.2s';
        
        const scoreText = document.createElement('div');
        scoreText.innerHTML = `
            <div style="font-size: 28px; margin: 15px 0; color: #ffd700;">Final Score: ${this.score}</div>
            <div style="font-size: 24px; margin: 15px 0; color: #silver;">High Score: ${this.highScore}</div>
            <div style="font-size: 20px; margin: 15px 0; color: #bronze;">Coins Collected: ${this.coinsCollected}</div>
        `;
        scoreContainer.appendChild(scoreText);
        
        // Continue button
        const continueBtn = document.createElement('button');
        continueBtn.textContent = 'Continue';
        continueBtn.style.fontSize = '24px';
        continueBtn.style.padding = '15px 40px';
        continueBtn.style.margin = '30px 0';
        continueBtn.style.backgroundColor = '#ff0000';
        continueBtn.style.color = 'white';
        continueBtn.style.border = 'none';
        continueBtn.style.borderRadius = '10px';
        continueBtn.style.cursor = 'pointer';
        continueBtn.style.opacity = '0';
        continueBtn.style.transform = 'translateY(30px)';
        continueBtn.style.transition = 'all 0.5s ease-out 2s';
        continueBtn.style.boxShadow = '0 4px 15px rgba(255, 0, 0, 0.3)';
        
        // Skip text
        const skipText = document.createElement('div');
        skipText.textContent = 'Tap anywhere to skip';
        skipText.style.position = 'absolute';
        skipText.style.bottom = '30px';
        skipText.style.fontSize = '16px';
        skipText.style.color = '#888';
        skipText.style.opacity = '0';
        skipText.style.transition = 'opacity 0.3s ease-in-out 1s';
        
        // Add elements to overlay
        overlay.appendChild(gameOverText);
        overlay.appendChild(scoreContainer);
        overlay.appendChild(continueBtn);
        overlay.appendChild(skipText);
        
        // Add to page
        document.body.appendChild(overlay);
        
        // Animation sequence
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            gameOverText.style.transform = 'scale(1)';
        }, 300);
        
        setTimeout(() => {
            scoreContainer.style.opacity = '1';
            scoreContainer.style.transform = 'translateY(0)';
        }, 1200);
        
        setTimeout(() => {
            continueBtn.style.opacity = '1';
            continueBtn.style.transform = 'translateY(0)';
            skipText.style.opacity = '1';
        }, 2000);
        
        // Auto-continue after 5 seconds
        const autoTimeout = setTimeout(() => {
            this.cleanupGameOver(overlay);
        }, 5000);
        
        // Button handler
        const handleContinue = () => {
            clearTimeout(autoTimeout);
            this.cleanupGameOver(overlay);
        };
        
        continueBtn.addEventListener('click', handleContinue);
        continueBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleContinue();
        });
        
        // Skip on tap anywhere (after 1 second to prevent accidental skips)
        setTimeout(() => {
            overlay.addEventListener('click', handleContinue);
            overlay.addEventListener('touchstart', handleContinue);
        }, 1000);
    }
    
    cleanupGameOver(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            this.showMenu();
        }, 500);
    }
    

    
    render() {
        // Clear canvas with dark background like original
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state before any rendering
        this.ctx.save();
        
        // Render world (without clouds) - this may use transforms
        if (this.world) {
            this.world.render(this.ctx);
        }
        
        // Restore context to clean state before rendering clouds
        this.ctx.restore();
        
        // Render clouds completely independently - no transforms should affect this
        this.renderIndependentClouds();
        
        // Save context for player
        this.ctx.save();
        
        // Render player - may use transforms
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Render enemies
        if (this.enemyManager) {
            this.enemyManager.render(this.ctx);
        }
        
        // Render weapon system (bullets, shell casings, weapon)
        if (this.weaponSystem && this.player) {
            this.weaponSystem.renderBullets(this.ctx);
            this.weaponSystem.renderShellCasings(this.ctx, this.world.getGroundY());
            this.weaponSystem.renderWeapon(this.ctx, this.player);
        }
        
        // Final restore
        this.ctx.restore();
        
        // Render UI elements (no transforms needed)
        if (this.weaponSystem && this.ui && this.player) {
            this.ui.renderWeaponUI(this.ctx, this.weaponSystem);
            // Usunięto renderCrosshair - brak celownika
        }
        
        // Render UI effects (combat texts, particles, notifications)
        if (this.ui) {
            this.ui.render(this.ctx, this.world);
        }
        
        if (this.gameState === 'paused') {
            this.renderPauseScreen();
        }
        
        // DEBUG OVERLAY
        this.renderDebugInfo();
    }
    
    renderDebugInfo() {
        // ✅ Debug info disabled in production - only show in development
        const showDebug = false; // Set to true for debugging
        if (!showDebug || !this.player || !this.world) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 100, 300, 180);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        
        const centerX = this.canvas.width * 0.5;
        const distFromCenter = this.player.x - centerX;
        
        this.ctx.fillText(`Player X: ${this.player.x.toFixed(1)}`, 20, 120);
        this.ctx.fillText(`Player Y: ${this.player.y.toFixed(1)}`, 20, 140);
        this.ctx.fillText(`Velocity X: ${this.player.velocityX.toFixed(1)}`, 20, 160);
        this.ctx.fillText(`Velocity Y: ${this.player.velocityY.toFixed(1)}`, 20, 180);
        this.ctx.fillText(`Dist from center: ${distFromCenter.toFixed(1)}`, 20, 200);
        this.ctx.fillText(`Scroll dir: ${this.world.currentScrollDirection.toFixed(3)}`, 20, 220);
        this.ctx.fillText(`Coins: ${this.world.coins.length}`, 20, 240);
        this.ctx.fillText(`On ground: ${this.player.onGround}`, 20, 260);
    }
    
    renderPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2);
        
        // Mobile: show menu button
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Tap menu button (☰) to go to main menu', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else {
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press M for main menu', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    start() {
        this.init();
        this.gameState = 'playing';
        this.hideMenu();
        
        // Position player in center
        this.player.x = this.canvas.width * 0.5; // Center of screen
        this.player.y = this.world.getGroundY() - this.player.height; // Stopy dokładnie na chodnik
        
        // Initialize independent clouds system
        this.initIndependentClouds();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            // Pause game - show pause screen, not main menu
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            // Resume game
            this.gameState = 'playing';
        } else if (this.gameState === 'menu') {
            // Resume game from menu
            this.hideMenu();
            this.gameState = 'playing';
        }
    }
    
    showMenu() {
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('highScore').textContent = this.highScore;
        this.gameState = 'menu';
    }
    
    hideMenu() {
        document.getElementById('menu').classList.add('hidden');
    }
    
    isMobile() {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('isMobile check:', isMobileDevice, 'User Agent:', navigator.userAgent);
        return isMobileDevice;
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = `${this.playerHP}/${this.maxHP} HP`;
        document.getElementById('coins').textContent = this.coinsCollected;
        
        // Update HP bar
        const hpPercent = (this.playerHP / this.maxHP) * 100;
        const hpBarFill = document.getElementById('hpBarFill');
        if (hpBarFill) {
            hpBarFill.style.width = hpPercent + '%';
            
            // Change color based on HP level
            if (hpPercent > 60) {
                hpBarFill.style.background = 'linear-gradient(90deg, #00ff00, #66ff00)'; // Green
            } else if (hpPercent > 30) {
                hpBarFill.style.background = 'linear-gradient(90deg, #ffff00, #ff6600)'; // Yellow/Orange
            } else {
                hpBarFill.style.background = 'linear-gradient(90deg, #ff0066, #ff0000)'; // Red
            }
        }
    }
    
    updateDashBar() {
        if (!this.player) return;
        
        const powerPercent = this.player.getDashPowerPercent();
        document.getElementById('dashCooldownBar').style.width = (powerPercent * 100) + '%';
        
        const charges = this.player.getDashCharges();
        const chargesElement = document.getElementById('dashCharges');
        if (charges > 0) {
            chargesElement.textContent = 'x' + charges;
            chargesElement.style.display = 'block';
        } else {
            chargesElement.style.display = 'none';
        }
    }
    
    saveHighScore() {
        localStorage.setItem('bungvo_high_score', this.highScore.toString());
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('bungvo_high_score');
        return saved ? parseInt(saved) : 0;
    }
    
    initIndependentClouds() {
        // ✅ RESPONSIVE CLOUD SCALING - chmury skalują się z rozmiarem ekranu
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        
        // Responsive scaling based on screen height
        const screenHeight = this.canvas.height;
        const baseCloudScale = screenHeight < 500 ? 0.8 :  // Very small screens
                              screenHeight < 600 ? 1.0 :  // Mobile
                              screenHeight < 800 ? 1.4 :  // Tablet  
                              2.0;                         // Desktop
        
        const pwaReduction = isPWA ? 0.8 : 1.0;
        const cloudScale = baseCloudScale * pwaReduction;
        
        console.log(`Cloud responsive scaling: height=${screenHeight}, base=${baseCloudScale}, PWA=${isPWA}, final=${cloudScale.toFixed(2)}`);
        
        // Completely independent clouds system
        this.independentClouds = {
            texture: null,
            scrollX: 0,
            y: -150,
            scale: cloudScale,
            mirroring: 550,
            speed: 50 // pixels per second - constant drift to the right, independent of player
        };
        
        // Load cloud texture
        const img = new Image();
        img.onload = () => {
            this.independentClouds.texture = img;
        };
        img.src = 'assets/Pv8HBC.png';
    }
    
    updateIndependentClouds(deltaTime, worldScrollDistance = 0) {
        // ✅ Clouds always move right at constant speed (independent of player movement)
        if (this.independentClouds) {
            // Slower constant speed - reduced because compensation adds extra speed when moving right
            const constantSpeed = 15; // Reduced from 30 to 15 px/s
            
            // Move clouds always to the right
            this.independentClouds.scrollX += constantSpeed * deltaTime;
            
            // ✅ COMPENSATE for world scrolling to keep clouds truly independent
            // When world scrolls right (scrollDistance > 0), clouds get pushed left
            // We need to push them back right to maintain constant movement
            if (worldScrollDistance !== 0) {
                this.independentClouds.scrollX += worldScrollDistance;
                // Cloud compensation applied
            }
            
            // No wrapping needed - modulo in render handles it smoothly
        }
    }
    
    renderIndependentClouds() {
        // Render clouds completely independently from world
        if (!this.independentClouds || !this.independentClouds.texture) return;
        
        const texture = this.independentClouds.texture;
        if (!texture.complete) return;
        
        // Save current context and reset ALL transforms
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const tileWidth = texture.width * this.independentClouds.scale;
        const startX = -this.independentClouds.scrollX % tileWidth;
        const tilesNeeded = Math.ceil((this.canvas.width + tileWidth) / tileWidth);
        
        // Draw repeating cloud tiles
        for (let i = 0; i < tilesNeeded; i++) {
            const x = startX + (i * tileWidth);
            
            this.ctx.drawImage(
                texture,
                x,
                this.independentClouds.y,
                texture.width * this.independentClouds.scale,
                texture.height * this.independentClouds.scale
            );
        }
        
        // Debug removed to clean up display
        
        // Restore context
        this.ctx.restore();
    }
}

// Global game instance
let game;
window.game = game; // Expose to window for canvas resize

// Global functions for HTML buttons
function startGame() {
    if (!game) {
        // Ensure canvas is properly sized before creating game
        const canvas = document.getElementById('gameCanvas');
        const screenWidth = window.innerWidth || document.documentElement.clientWidth;
        const screenHeight = window.innerHeight || document.documentElement.clientHeight;
        canvas.width = screenWidth;
        canvas.height = screenHeight;
        canvas.style.width = screenWidth + 'px';
        canvas.style.height = screenHeight + 'px';
        
        game = new BungvoGame();
        window.game = game; // Expose to window
    }
    game.start();
}

function showInstructions() {
    alert(`BUNGVO - Walking Simulator

🎮 CONTROLS:
• W/Space/Up Arrow - Jump
• A/D or Left/Right - Move left/right
• Shift - Dash (with cooldown)
• ESC - Pause/Menu

🎯 PLATFORMER GAMEPLAY:
• Jump and dash through the level
• Camera follows player with smooth dead zone
• Move freely across the entire screen
• World scrolls when you leave the center area
• Multiple parallax layers create depth
• Collect coins as you explore
• Advanced mechanics: coyote time, jump buffering, wall slide

🎯 OBJECTIVE:
• Walk around and explore in both directions
• Collect items along the way
• Enjoy the peaceful stroll
• Beat your high score!

🎨 FEATURES:
• Authentic parallax scrolling like original
• Bidirectional movement and scrolling
• World responds to your movement
• Multiple background layers at different speeds

This uses the original Bungvo parallax system!`);
}

function toggleMobileMenu() {
    if (window.game) {
        if (window.game.gameState === 'paused') {
            // From pause screen, go to main menu
            window.game.showMenu();
        } else {
            // From playing, go to pause
            window.game.togglePause();
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Bungvo Enhanced loaded!');
});


// Gamepad support for menu navigation
let menuSelectedIndex = 0;
const menuButtons = [];

function setupMenuGamepad() {
    // Get menu buttons
    const startButton = document.querySelector('.menu-button:nth-child(1)');
    const instructionsButton = document.querySelector('.menu-button:nth-child(2)');
    const settingsButton = document.querySelector('.menu-button:nth-child(3)');
    
    menuButtons.length = 0; // Clear existing buttons
    if (startButton) menuButtons.push(startButton);
    if (instructionsButton) menuButtons.push(instructionsButton);
    if (settingsButton) menuButtons.push(settingsButton);
    
    if (menuButtons.length > 0) {
        updateMenuSelection();
    }
}

function updateMenuSelection() {
    menuButtons.forEach((btn, index) => {
        if (index === menuSelectedIndex) {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.8)';
        } else {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        }
    });
}

function handleMenuGamepad() {
    // Allow gamepad menu on all platforms now
    
    const menu = document.getElementById('menu');
    if (!menu || menu.classList.contains('hidden')) return;
    
    if (menuButtons.length === 0) {
        setupMenuGamepad();
    }
    
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;
    
    for (const gamepad of gamepads) {
        if (!gamepad) continue;
        
        // D-pad or left stick up/down for navigation
        const upPressed = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -0.5;
        const downPressed = gamepad.buttons[13]?.pressed || gamepad.axes[1] > 0.5;
        const aPressed = gamepad.buttons[0]?.pressed; // A button to select
        
        // Debounce navigation
        if (!gamepad.lastNavTime) gamepad.lastNavTime = 0;
        const now = Date.now();
        
        if (upPressed && now - gamepad.lastNavTime > 200) {
            menuSelectedIndex = Math.max(0, menuSelectedIndex - 1);
            updateMenuSelection();
            gamepad.lastNavTime = now;
        } else if (downPressed && now - gamepad.lastNavTime > 200) {
            menuSelectedIndex = Math.min(menuButtons.length - 1, menuSelectedIndex + 1);
            updateMenuSelection();
            gamepad.lastNavTime = now;
        }
        
        // Select button
        if (aPressed && menuButtons[menuSelectedIndex]) {
            menuButtons[menuSelectedIndex].click();
        }
    }
}

// Poll gamepad in menu - only when needed
let gamepadInterval = null;
function startGamepadPolling() {
    if (!gamepadInterval) {
        gamepadInterval = setInterval(handleMenuGamepad, 200); // Slower polling
    }
}
function stopGamepadPolling() {
    if (gamepadInterval) {
        clearInterval(gamepadInterval);
        gamepadInterval = null;
    }
}
