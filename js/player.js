// Player class with enhanced mechanics - using original Bungvo assets
class Player {
    constructor(x, y, physics) {
        this.x = x;
        this.y = y;

        // ✅ Responsive rozmiar gracza - dostosowany do rozmiaru ekranu
        const screenHeight = window.innerHeight || 600;
        let scale;
        
        if (screenHeight < 450) {
            scale = 0.95; // Bardzo małe telefony: 85.5x142.5 (zwiększone z 0.75)
        } else if (screenHeight < 600) {
            scale = 1.05; // Średnie mobile (iPhone 14 Pro Max): 94.5x157.5 (zwiększone z 0.85)
        } else if (screenHeight < 900) {
            scale = 1.15; // Tablety: 103.5x172.5 (zwiększone z 1.0)
        } else {
            scale = 1.3; // Desktop: 117x195
        }
        
        this.width = 90 * scale;
        this.height = 150 * scale;
        this.physics = physics;

        // Load character spritesheet (8 frames walking animation)
        this.characterSheet = new Image();
        this.characterSheet.src = 'assets/charsheet.png';
        this.imageLoaded = false;
        this.characterSheet.onload = () => {
            this.imageLoaded = true;
            console.log('Character spritesheet loaded:', this.characterSheet.width, 'x', this.characterSheet.height);
            // Calculate frame dimensions (8 frames horizontal)
            this.frameWidth = this.characterSheet.width / 8;
            this.frameHeight = this.characterSheet.height;
        };

        // Load idle sprite
        this.idleSprite = new Image();
        this.idleSprite.src = 'assets/idle.png';
        this.idleLoaded = false;
        this.idleSprite.onload = () => {
            this.idleLoaded = true;
            console.log('Idle sprite loaded');
        };

        // Load jump sprite
        this.jumpSprite = new Image();
        this.jumpSprite.src = 'assets/jump.png';
        this.jumpLoaded = false;
        this.jumpSprite.onload = () => {
            this.jumpLoaded = true;
            console.log('Jump sprite loaded');
        };

        // Load frontflip animation spritesheet (8 frames)
        this.frontflipSheet = new Image();
        this.frontflipSheet.src = 'assets/frontanim.png';
        this.frontflipLoaded = false;
        this.frontflipSheet.onload = () => {
            this.frontflipLoaded = true;
            console.log('Frontflip animation loaded:', this.frontflipSheet.width, 'x', this.frontflipSheet.height);
            // Calculate frame dimensions (8 frames horizontal)
            this.frontflipFrameWidth = this.frontflipSheet.width / 8;
            this.frontflipFrameHeight = this.frontflipSheet.height;
        };

        // Load shooting animation spritesheet (8 frames) - standing
        this.shootSheet = new Image();
        this.shootSheet.src = 'assets/shootanim.png';
        this.shootLoaded = false;
        this.shootSheet.onload = () => {
            this.shootLoaded = true;
            console.log('Shooting animation loaded:', this.shootSheet.width, 'x', this.shootSheet.height);
            // Calculate frame dimensions (8 frames horizontal)
            this.shootFrameWidth = this.shootSheet.width / 8;
            this.shootFrameHeight = this.shootSheet.height;
        };

        // Load shooting while running animation spritesheet (8 frames)
        this.shootWalkSheet = new Image();
        this.shootWalkSheet.src = 'assets/shootwalkanim.png';
        this.shootWalkLoaded = false;
        this.shootWalkSheet.onload = () => {
            this.shootWalkLoaded = true;
            console.log('Shooting while running animation loaded:', this.shootWalkSheet.width, 'x', this.shootWalkSheet.height);
            // Calculate frame dimensions (8 frames horizontal)
            this.shootWalkFrameWidth = this.shootWalkSheet.width / 8;
            this.shootWalkFrameHeight = this.shootWalkSheet.height;
        };

        // Load shooting during frontflip animation spritesheet (8 frames)
        this.shootFrontSheet = new Image();
        this.shootFrontSheet.src = 'assets/shootfrontanim.png';
        this.shootFrontLoaded = false;
        this.shootFrontSheet.onload = () => {
            this.shootFrontLoaded = true;
            console.log('Shooting during frontflip animation loaded:', this.shootFrontSheet.width, 'x', this.shootFrontSheet.height);
            // Calculate frame dimensions (8 frames horizontal)
            this.shootFrontFrameWidth = this.shootFrontSheet.width / 8;
            this.shootFrontFrameHeight = this.shootFrontSheet.height;
        };

        // Physics properties - PLATFORMER with jumping
        this.velocityX = 0;
        this.velocityY = 0;
        this.baseSpeed = 250; // Base speed
        this.speed = 250; // Current speed (will be updated)
        this.jumpPower = 450;
        this.gravity = 980;

        // State flags
        this.onGround = false;
        this.touchingWall = false;
        this.wallNormal = { x: 0, y: 0 };
        this.facingDirection = 1; // 1 for right, -1 for left

        // Enhanced movement mechanics
        this.isWalking = false;
        this.walkDirection = 0; // -1 = backward, 0 = none, 1 = forward

        // Jump mechanics
        this.coyoteTime = 0.1; // Grace period after leaving platform
        this.coyoteTimer = 0;
        this.jumpBufferTime = 0.1; // Input buffering
        this.jumpBufferTimer = 0;

        // Wall jump mechanics
        this.wallJumpDuration = 0.2;
        this.wallJumpTimer = 0;

        // Dash mechanics
        this.dashSpeed = 400;
        this.dashDuration = 0.2;
        this.dashPowerMax = 100; // Max dash power per charge
        this.dashPowerCost = 100; // Cost to dash (need full bar)

        // Invincibility frames (i-frames) after taking damage
        this.isInvincible = false;
        this.invincibilityDuration = 1.0; // 1 second of invincibility
        this.invincibilityTimer = 0;
        this.dashPowerPerCoin = 33.34; // Power gained per coin (3 coins = full bar)
        this.dashCharges = 0; // Number of full dash charges stored
        this.dashMaxCharges = 99; // Maximum charges you can store
        this.isDashing = false;
        this.dashJustStarted = false; // For instant camera center
        this.dashPower = 0; // Current power in the charging bar
        this.dashTimer = 0;
        this.dashKeyWasPressed = false; // Track if dash key was already pressed
        this.jumpKeyWasPressed = false; // Track if jump key was already pressed

        // Front flip mechanics
        this.isFlipping = false;
        this.flipDuration = 0.6; // Czas trwania front flip - wolniejszy dla płynniejszej animacji
        this.flipTimer = 0;
        this.flipRotation = 0; // Aktualny kąt obrotu
        this.lastJumpTime = 0; // Czas ostatniego skoku
        this.doubleJumpWindow = 0.3; // Okno czasowe na podwójny skok (300ms)

        // Shooting mechanics
        this.isShooting = false;
        this.shootPhase = 'none'; // 'draw' (frames 0-2), 'fire' (frames 3-7), 'none'
        this.shootDrawDuration = 0.15; // 3 klatki * 0.05s = wyciągnięcie broni
        this.shootFireFrameDuration = 0.08; // Czas na jedną klatkę strzału (wolniejszy loop)
        this.shootTimer = 0;
        
        // Speed boost when running and shooting
        this.shootRunBoostActive = false;
        this.shootRunBoostTimer = 0;
        this.shootRunBoostDuration = 3.0; // 3 seconds
        this.shootRunBoostMultiplier = 1.5; // 50% speed increase

        // Animation
        this.animationState = 'idle'; // idle, running, jumping, wallSliding, dashing, shooting
        this.animationTimer = 0;
        this.animationFrame = 0; // Current frame in animation cycle

        // Spawn point
        this.spawnX = x;
        this.spawnY = y;
    }

    update(deltaTime, keys, world) {
        this.handleInput(keys, deltaTime, world);
        this.updateTimers(deltaTime);
        this.applyPhysics(deltaTime, world);
        this.updateAnimation(deltaTime);

        // Return walking state and direction for world scrolling
        const state = {
            isWalking: this.isWalking,
            walkDirection: this.walkDirection,
            isDashing: this.isDashing,
            dashJustStarted: this.dashJustStarted,
            shootRunBoostActive: this.shootRunBoostActive
        };

        // Reset dashJustStarted after returning it
        this.dashJustStarted = false;

        return state;
    }

    handleInput(keys, deltaTime, world) {
        // Horizontal movement (don't override during dash or wall jump)
        let moveDirection = 0;
        let anyMovementKey = false;
        let walkDirection = 0;

        // ✅ Add touch controls support for mobile
        const touchStates = window.touchControls ? window.touchControls.getStates() : { left: false, right: false, jump: false, dash: false };

        if (keys['KeyA'] || keys['ArrowLeft'] || touchStates.left) {
            moveDirection = -1;
            anyMovementKey = true;
            walkDirection = -1;
            if (!this.isDashing) {
                this.facingDirection = -1;
            }
        }
        if (keys['KeyD'] || keys['ArrowRight'] || touchStates.right) {
            moveDirection = 1;
            anyMovementKey = true;
            walkDirection = 1;
            if (!this.isDashing) {
                this.facingDirection = 1;
            }
        }

        // Apply horizontal movement (only when not dashing or wall jumping)
        if (this.wallJumpTimer <= 0 && !this.isDashing) {
            if (moveDirection !== 0) {
                // Check if we're at the edge and trying to move further
                const atLeftEdge = this.x <= 0 && moveDirection < 0;
                const atRightEdge = this.x + this.width >= world.width && moveDirection > 0;

                if (!atLeftEdge && !atRightEdge) {
                    // Apply speed boost if running and shooting
                    let speedMultiplier = 1.0;
                    if (this.isShooting && this.shootRunBoostActive) {
                        speedMultiplier = this.shootRunBoostMultiplier;
                    }
                    this.velocityX = moveDirection * this.speed * speedMultiplier;
                } else {
                    this.velocityX = 0;
                }
            } else {
                // Apply friction and stop if velocity is very small
                this.velocityX *= 0.8;
                if (Math.abs(this.velocityX) < 1) {
                    this.velocityX = 0;
                }
            }
        }

        this.isWalking = anyMovementKey;
        this.walkDirection = walkDirection;

        // Jump input with double jump detection (including touch)
        const jumpPressed = keys['KeyW'] || keys['ArrowUp'] || keys['Space'] || touchStates.jump;
        const jumpJustPressed = jumpPressed && !this.jumpKeyWasPressed;
        this.jumpKeyWasPressed = jumpPressed;

        if (jumpJustPressed) {
            const currentTime = Date.now() / 1000; // Czas w sekundach

            // Sprawdź czy to podwójny skok (tylko gdy jesteś w powietrzu)
            if (currentTime - this.lastJumpTime < this.doubleJumpWindow && !this.onGround && !this.isFlipping) {
                // Podwójny skok = front flip
                this.performFrontFlip();
            } else {
                // Normalny skok
                this.jumpBufferTimer = this.jumpBufferTime;
                this.lastJumpTime = currentTime;
            }
        }

        // Dash input (only trigger once per key press, including touch)
        const dashKeyPressed = keys['ShiftLeft'] || keys['ShiftRight'] || touchStates.dash;
        if (dashKeyPressed && !this.dashKeyWasPressed) {
            if (this.dashCharges > 0 && !this.isDashing) {
                this.performDash(keys);
            }
        }
        this.dashKeyWasPressed = dashKeyPressed;
    }

    performJump() {
        this.velocityY = -this.jumpPower;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.onGround = false;
    }

    performWallJump() {
        // Jump away from wall
        this.velocityX = this.wallNormal.x * this.speed * 1.2;
        this.velocityY = -this.jumpPower * 0.9;
        this.wallJumpTimer = this.wallJumpDuration;
        this.jumpBufferTimer = 0;
        this.facingDirection = this.wallNormal.x;
    }

    performDash(keys) {
        let dashDirection = { x: 0, y: 0 };

        // Determine dash direction (including touch)
        const touchStates = window.touchControls ? window.touchControls.getStates() : { left: false, right: false, jump: false, dash: false };

        if (keys['KeyA'] || keys['ArrowLeft'] || touchStates.left) {
            dashDirection.x = -1;
        } else if (keys['KeyD'] || keys['ArrowRight'] || touchStates.right) {
            dashDirection.x = 1;
        }

        if (keys['KeyW'] || keys['ArrowUp'] || touchStates.jump) {
            dashDirection.y = -1;
        } else if (keys['KeyS'] || keys['ArrowDown']) {
            dashDirection.y = 1;
        }

        // Default to facing direction if no input
        if (dashDirection.x === 0 && dashDirection.y === 0) {
            dashDirection.x = this.facingDirection;
        }

        // Normalize direction
        const magnitude = Math.sqrt(dashDirection.x * dashDirection.x + dashDirection.y * dashDirection.y);
        if (magnitude > 0) {
            dashDirection.x /= magnitude;
            dashDirection.y /= magnitude;
        }

        // Apply dash
        this.velocityX = dashDirection.x * this.dashSpeed;
        this.velocityY = dashDirection.y * this.dashSpeed;

        this.isDashing = true;
        this.dashJustStarted = true; // Signal for instant camera center
        this.dashTimer = this.dashDuration;
        this.dashCharges--; // Consume one dash charge
    }

    performFrontFlip() {
        // Rozpocznij front flip
        this.isFlipping = true;
        this.flipTimer = this.flipDuration;
        this.flipRotation = 0;

        // Dodaj trochę prędkości w górę dla efektu
        this.velocityY = -this.jumpPower * 0.7; // Mniejszy skok niż normalny

        console.log('Front flip started!');
    }

    startShooting() {
        if (!this.isShooting) {
            // Pierwsza klatka - rozpocznij fazę wyciągania broni
            this.isShooting = true;
            this.shootPhase = 'draw';
            this.shootTimer = this.shootDrawDuration;
        } else if (this.shootPhase === 'fire') {
            // Już w fazie strzelania - kontynuuj loop
            // Timer będzie się resetował automatycznie w updateTimers
        } else if (this.shootPhase === 'draw') {
            // Nadal wyciąga broń - poczekaj aż skończy
        }
    }

    stopShooting() {
        // Natychmiast zatrzymaj animację strzelania
        this.isShooting = false;
        this.shootPhase = 'none';
        this.shootTimer = 0;
    }

    updateTimers(deltaTime) {
        // Coyote time
        if (this.onGround) {
            this.coyoteTimer = this.coyoteTime;
        } else {
            this.coyoteTimer -= deltaTime;
        }

        // Jump buffer
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= deltaTime;

            // Try to jump
            if (this.onGround || this.coyoteTimer > 0) {
                // Regular jump
                this.performJump();
            }
        }
        
        // Speed boost when running and shooting
        const isMoving = Math.abs(this.velocityX) > 10;
        if (this.isShooting && isMoving && this.onGround) {
            // Activate boost
            if (!this.shootRunBoostActive) {
                this.shootRunBoostActive = true;
                this.shootRunBoostTimer = this.shootRunBoostDuration;
                console.log('🏃💨 Speed boost activated!');
            }
        }
        
        // Update boost timer
        if (this.shootRunBoostActive) {
            this.shootRunBoostTimer -= deltaTime;
            if (this.shootRunBoostTimer <= 0) {
                this.shootRunBoostActive = false;
                console.log('🏃 Speed boost ended');
            }
        }

        // Wall jump timer
        if (this.wallJumpTimer > 0) {
            this.wallJumpTimer -= deltaTime;
        }

        // Dash timer
        if (this.dashTimer > 0) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }

        // Front flip timer
        if (this.flipTimer > 0) {
            this.flipTimer -= deltaTime;
            // Oblicz rotację (pełny obrót 360 stopni = 2π radianów)
            const progress = 1 - (this.flipTimer / this.flipDuration);
            this.flipRotation = progress * Math.PI * 2; // Pełny obrót

            if (this.flipTimer <= 0) {
                this.isFlipping = false;
                this.flipRotation = 0;
            }
        }

        // Shoot timer - obsługa faz animacji
        if (this.isShooting) {
            this.shootTimer -= deltaTime;
            
            if (this.shootPhase === 'draw') {
                // Faza wyciągania broni (klatki 0-2)
                if (this.shootTimer <= 0) {
                    // Przejdź do fazy strzelania
                    this.shootPhase = 'fire';
                    this.shootTimer = this.shootFireFrameDuration * 5; // 5 klatek loop
                }
            } else if (this.shootPhase === 'fire') {
                // Faza strzelania (klatki 3-7) - loop
                if (this.shootTimer <= 0) {
                    // Reset timer dla kolejnego loopu
                    this.shootTimer = this.shootFireFrameDuration * 5;
                }
            }
        }

        // Invincibility timer
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }
    }

    applyPhysics(deltaTime, world) {
        // Apply gravity (increased during flip ending)
        if (!this.onGround && !this.isDashing) {
            let gravityMultiplier = 1.0;
            
            // Increase gravity during last 3 frames of frontflip (faster descent)
            if (this.isFlipping) {
                const progress = 1 - (this.flipTimer / this.flipDuration);
                if (progress > 0.7) {
                    // Last 30% of flip - increase gravity by 2x
                    gravityMultiplier = 2.0;
                }
            }
            
            this.velocityY += this.gravity * gravityMultiplier * deltaTime;
        }

        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Check platform collisions (like police cars)
        let onPlatform = false;
        if (world.obstacleManager) {
            const platforms = world.obstacleManager.getActiveObstacles().filter(o => o.isPlatform && !o.damagesPlayer);

            for (const platform of platforms) {
                const playerBottom = this.y + this.height;
                const playerRight = this.x + this.width;
                const playerLeft = this.x;
                const playerCenterX = this.x + this.width / 2;

                // Police car dimensions
                const platformLeft = platform.x + 20;
                const platformRight = platform.x + platform.width - 20;
                const platformWidth = platformRight - platformLeft;

                // Check if player is horizontally over the car
                if (playerRight > platformLeft && playerLeft < platformRight) {
                    // Calculate roof height based on position (sloped hood at front)
                    // Front 30% of car has sloped hood, rest is flat roof
                    const relativeX = (playerCenterX - platformLeft) / platformWidth;
                    let platformRoofY;

                    if (relativeX >= 0 && relativeX < 0.3) {
                        // Front hood area - slopes up from 55% to 42%
                        const hoodProgress = relativeX / 0.3;
                        const hoodTop = platform.y + (platform.height * 0.55);
                        const roofTop = platform.y + (platform.height * 0.42);
                        platformRoofY = hoodTop - (hoodTop - roofTop) * hoodProgress;
                    } else if (relativeX >= 0.3 && relativeX <= 1.0) {
                        // Flat roof area
                        platformRoofY = platform.y + (platform.height * 0.42);
                    } else {
                        continue; // Player not over car
                    }

                    // Check if player should be on the roof/hood
                    if (playerBottom >= platformRoofY - 5 && playerBottom <= platformRoofY + 20) {
                        // Snap player to roof height
                        this.y = platformRoofY - this.height;
                        if (this.velocityY > 0) {
                            this.velocityY = 0;
                        }
                        this.onGround = true;
                        onPlatform = true;
                        break;
                    }
                }

                // Check side collision - can't walk through car
                const platformBottom = platform.y + platform.height;
                const platformRoofFlat = platform.y + (platform.height * 0.42);
                if (playerBottom > platformRoofFlat + 20 && this.y < platformBottom - 20) {
                    // Player is at car body height, check horizontal collision
                    if (this.velocityX > 0 && playerRight > platformLeft && playerLeft < platformLeft) {
                        // Hitting from left
                        this.x = platformLeft - this.width;
                        this.velocityX = 0;
                    } else if (this.velocityX < 0 && playerLeft < platformRight && playerRight > platformRight) {
                        // Hitting from right
                        this.x = platformRight;
                        this.velocityX = 0;
                    }
                }
            }
        }

        // Simple ground collision (sidewalk level)
        const groundY = world.getGroundY();
        const tolerance = 2;

        if (!onPlatform && this.y + this.height >= groundY - tolerance) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;

            // ✅ FIX: Dodaj log tylko raz na 60 klatek (1 sekunda)
            if (!this._lastGroundLog || Date.now() - this._lastGroundLog > 1000) {
                console.log(`Player grounded: Y=${this.y.toFixed(1)}, GroundY=${groundY.toFixed(1)}, Height=${this.height}`);
                this._lastGroundLog = Date.now();
            }
        } else if (!onPlatform) {
            this.onGround = false;
        }

        // Keep player in screen bounds with margin
        const margin = 10; // Small margin to prevent edge glitches

        // Left edge - hard stop at 0 (can't go off screen left)
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
            if (this.isDashing) {
                this.isDashing = false; // Stop dash at edge
            }
        }

        // Right edge
        if (this.x + this.width > world.width - margin) {
            this.x = world.width - this.width - margin;
            this.velocityX = 0;
            if (this.isDashing) {
                this.isDashing = false; // Stop dash at edge
            }
        }

        // Prevent falling through floor
        if (this.y > world.height) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }
    }

    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;

        // Track if player is moving
        const isMoving = Math.abs(this.velocityX) > 10;
        const wasMoving = this.wasMovingLastFrame !== undefined ? this.wasMovingLastFrame : isMoving;

        // Update animation state - check for combined states first
        if (this.isShooting && this.isFlipping) {
            // Strzelanie podczas frontflipa - specjalna animacja
            this.animationState = 'shootingFlip';
            // Użyj klatek z frontflipa dla synchronizacji z przyspieszonym zakończeniem
            const progress = 1 - (this.flipTimer / this.flipDuration);
            
            // Non-linear progression: first 5 frames take 70% of time, last 3 frames take 30%
            let frameProgress;
            if (progress < 0.7) {
                // Frames 0-4 (first 5 frames) - slower
                frameProgress = (progress / 0.7) * 5; // 0 to 5
            } else {
                // Frames 5-7 (last 3 frames) - faster
                frameProgress = 5 + ((progress - 0.7) / 0.3) * 3; // 5 to 8
            }
            
            this.animationFrame = Math.min(Math.floor(frameProgress), 7); // Clamp to 0-7
        } else if (this.isShooting) {
            this.animationState = 'shooting';
            
            // Check if player just stopped moving while shooting
            if (wasMoving && !isMoving && this.shootPhase === 'fire') {
                // Przejście z biegu do stania - pozostań w fazie fire (klatki 3-7)
                // Nie rób nic - już jesteśmy w fazie fire
            } else if (this.shootPhase === 'draw') {
                // Faza wyciągania broni - klatki 0-2
                const progress = 1 - (this.shootTimer / this.shootDrawDuration);
                this.animationFrame = Math.min(Math.floor(progress * 2.99), 2); // Klatki 0, 1, 2
            } else if (this.shootPhase === 'fire') {
                // Faza strzelania - klatki 3-7 (loop)
                const loopDuration = this.shootFireFrameDuration * 5;
                const progress = 1 - (this.shootTimer / loopDuration);
                const loopFrame = Math.floor(progress * 4.99); // 5 klatek (0-4)
                this.animationFrame = 3 + loopFrame; // Offset do klatek 3-7
            }
        } else if (this.isFlipping) {
            this.animationState = 'flipping';
            // Calculate flip animation frame with accelerated ending (last 3 frames faster)
            const progress = 1 - (this.flipTimer / this.flipDuration);
            
            // Non-linear progression: first 5 frames take 70% of time, last 3 frames take 30%
            let frameProgress;
            if (progress < 0.7) {
                // Frames 0-4 (first 5 frames) - slower
                frameProgress = (progress / 0.7) * 5; // 0 to 5
            } else {
                // Frames 5-7 (last 3 frames) - faster
                frameProgress = 5 + ((progress - 0.7) / 0.3) * 3; // 5 to 8
            }
            
            this.animationFrame = Math.min(Math.floor(frameProgress), 7); // Clamp to 0-7
        } else if (this.isDashing) {
            this.animationState = 'dashing';
            this.animationFrame = 0;
        } else if (!this.onGround) {
            this.animationState = 'jumping';
            this.animationFrame = 0;
        } else if (Math.abs(this.velocityX) > 10) {
            this.animationState = 'running';
            // Walking animation cycle - 8 frames, 0.1s per frame
            this.animationFrame = Math.floor(this.animationTimer / 0.1) % 8;
        } else {
            this.animationState = 'idle';
            this.animationFrame = 0;
        }

        // Save movement state for next frame
        this.wasMovingLastFrame = isMoving;
    }

    render(ctx) {
        // Draw player without using ctx.translate to avoid affecting other elements
        ctx.save();

        // Flashing effect during invincibility
        if (this.isInvincible) {
            // Flash every 0.1 seconds
            const flashSpeed = 10; // Hz
            const visible = Math.floor(this.invincibilityTimer * flashSpeed) % 2 === 0;
            if (!visible) {
                ctx.restore();
                return; // Skip rendering this frame for flashing effect
            }
        }

        // Draw player based on animation state at direct coordinates
        this.drawPlayerAtPosition(ctx, this.x, this.y);

        ctx.restore();

        // Draw speed boost indicator
        if (this.shootRunBoostActive) {
            const boostPercent = this.shootRunBoostTimer / this.shootRunBoostDuration;
            const barWidth = 60;
            const barHeight = 6;
            const barX = this.x + (this.width - barWidth) / 2;
            const barY = this.y - 15;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Boost bar
            ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + boostPercent * 0.5})`;
            ctx.fillRect(barX, barY, barWidth * boostPercent, barHeight);
            
            // Border
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Text
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡BOOST', this.x + this.width / 2, barY - 3);
            ctx.textAlign = 'left';
        }
        
        // Draw debug info
        if (false) { // Set to true for debugging
            this.drawDebugInfo(ctx);
        }
    }

    drawPlayerAtPosition(ctx, x, y) {
        if (!this.imageLoaded || !this.frameWidth) {
            // Fallback - draw simple character silhouette
            ctx.fillStyle = '#FFD700'; // Gold color
            ctx.fillRect(x, y, this.width, this.height);
            return;
        }

        ctx.save();

        // Flip horizontally if facing left
        if (this.facingDirection < 0) {
            ctx.translate(x + this.width, y);
            ctx.scale(-1, 1);
            x = 0;
            y = 0;
        }

        // Use shooting during frontflip animation with smooth rotation
        if (this.animationState === 'shootingFlip' && this.shootFrontLoaded && this.shootFrontFrameWidth) {
            ctx.save();
            
            // Calculate smooth rotation (full 360° rotation)
            const progress = 1 - (this.flipTimer / this.flipDuration);
            const rotation = progress * Math.PI * 2; // 0 to 2π (360°)
            
            // Rotate around center of sprite
            ctx.translate(x + this.width / 2, y + this.height / 2);
            ctx.rotate(rotation);
            
            ctx.drawImage(
                this.shootFrontSheet,
                this.animationFrame * this.shootFrontFrameWidth, 0, // Source X, Y
                this.shootFrontFrameWidth, this.shootFrontFrameHeight, // Source width, height
                -this.width / 2, -this.height / 2, // Centered destination X, Y
                this.width, this.height // Destination width, height
            );
            
            ctx.restore();
        } else if (this.animationState === 'shooting') {
            // Check if player is moving to use appropriate animation
            const isMoving = Math.abs(this.velocityX) > 10;
            
            if (isMoving && this.shootWalkLoaded && this.shootWalkFrameWidth) {
                // Shooting while running
                ctx.drawImage(
                    this.shootWalkSheet,
                    this.animationFrame * this.shootWalkFrameWidth, 0, // Source X, Y
                    this.shootWalkFrameWidth, this.shootWalkFrameHeight, // Source width, height
                    x, y, // Destination X, Y
                    this.width, this.height // Destination width, height
                );
            } else if (this.shootLoaded && this.shootFrameWidth) {
                // Shooting while standing
                ctx.drawImage(
                    this.shootSheet,
                    this.animationFrame * this.shootFrameWidth, 0, // Source X, Y
                    this.shootFrameWidth, this.shootFrameHeight, // Source width, height
                    x, y, // Destination X, Y
                    this.width, this.height // Destination width, height
                );
            }
        } else if (this.animationState === 'flipping' && this.frontflipLoaded && this.frontflipFrameWidth) {
            // Use frontflip animation with smooth rotation interpolation
            ctx.save();
            
            // Calculate smooth rotation (full 360° rotation)
            const progress = 1 - (this.flipTimer / this.flipDuration);
            const rotation = progress * Math.PI * 2; // 0 to 2π (360°)
            
            // Rotate around center of sprite
            ctx.translate(x + this.width / 2, y + this.height / 2);
            ctx.rotate(rotation);
            
            ctx.drawImage(
                this.frontflipSheet,
                this.animationFrame * this.frontflipFrameWidth, 0, // Source X, Y
                this.frontflipFrameWidth, this.frontflipFrameHeight, // Source width, height
                -this.width / 2, -this.height / 2, // Centered destination X, Y
                this.width, this.height // Destination width, height
            );
            
            ctx.restore();
        } else if (this.animationState === 'jumping' && this.jumpLoaded) {
            // Use jump sprite when jumping
            ctx.drawImage(
                this.jumpSprite,
                x, y,
                this.width, this.height
            );
        } else if (this.animationState === 'idle' && this.idleLoaded) {
            // Use idle sprite when standing still
            ctx.drawImage(
                this.idleSprite,
                x, y,
                this.width, this.height
            );
        } else if (this.animationState === 'running') {
            // Cycle through frames 0-7 for walking animation
            const frame = Math.floor(this.animationTimer * 10) % 8;
            ctx.drawImage(
                this.characterSheet,
                frame * this.frameWidth, 0, // Source X, Y
                this.frameWidth, this.frameHeight, // Source width, height
                x, y, // Destination X, Y
                this.width, this.height // Destination width, height
            );
        } else {
            // Fallback - use first frame from charsheet
            ctx.drawImage(
                this.characterSheet,
                0, 0, // Source X, Y
                this.frameWidth, this.frameHeight, // Source width, height
                x, y, // Destination X, Y
                this.width, this.height // Destination width, height
            );
        }

        ctx.restore();

    }

    drawDebugInfo(ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Vel: ${this.velocityX.toFixed(1)}, ${this.velocityY.toFixed(1)}`, this.x, this.y - 40);
        ctx.fillText(`State: ${this.animationState}`, this.x, this.y - 25);
        ctx.fillText(`Ground: ${this.onGround}, Wall: ${this.touchingWall}`, this.x, this.y - 10);
    }

    getDashPowerPercent() {
        return Math.max(0, Math.min(1.0, this.dashPower / this.dashPowerMax));
    }

    getDashCharges() {
        return this.dashCharges;
    }

    takeDamage(damage = 20) {
        if (this.isInvincible) return 0; // Already invincible, no damage

        // Activate invincibility
        this.isInvincible = true;
        this.invincibilityTimer = this.invincibilityDuration;

        return damage; // Return amount of damage taken
    }

    isVulnerable() {
        return !this.isInvincible;
    }

    addDashPower(amount) {
        this.dashPower += amount;

        // Check if we completed a full charge
        while (this.dashPower >= this.dashPowerMax && this.dashCharges < this.dashMaxCharges) {
            this.dashPower -= this.dashPowerMax;
            this.dashCharges++;
        }

        // Cap at max charges
        if (this.dashCharges >= this.dashMaxCharges) {
            this.dashPower = 0;
        }
    }

    respawn(x, y) {
        this.x = x || this.spawnX;
        this.y = y || this.spawnY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.touchingWall = false;
        this.isDashing = false;
        this.dashPower = 0; // Reset dash power on respawn
        this.dashCharges = 0; // Reset dash charges on respawn
        this.dashTimer = 0;
        this.dashKeyWasPressed = false;
        this.wallJumpTimer = 0;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
    }

    // ✅ Update player speed based on world scroll speed
    updateSpeed(worldScrollSpeed) {
        // Player speed should match world scroll speed for smooth movement
        this.speed = worldScrollSpeed;

        // Also scale jump power slightly to maintain game feel
        const speedRatio = worldScrollSpeed / this.baseSpeed;
        this.jumpPower = 450 * Math.min(speedRatio * 0.5 + 0.5, 1.2); // Cap at 20% increase
    }

    // Collision detection helpers
    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}