// Player class with enhanced mechanics - using original Bungvo assets
class Player {
    constructor(x, y, physics) {
        this.x = x;
        this.y = y;

        // ✅ RESPONSIVE SCALING - postać skaluje się z rozmiarem ekranu
        const screenHeight = window.innerHeight || 600;
        const baseScale = Math.max(0.8, Math.min(2.0, screenHeight / 600)); // Scale 0.8x - 2.0x

        this.width = Math.floor(60 * baseScale);   // Responsive width
        this.height = Math.floor(100 * baseScale); // Responsive height
        this.scale = baseScale; // Store for rendering
        this.physics = physics;

        // Load character atlas
        this.characterAtlas = new Image();
        this.characterAtlas.src = 'assets/charatlas.png?v=' + Date.now(); // Force reload
        this.imageLoaded = false;
        this.characterAtlas.onload = () => {
            this.imageLoaded = true;
            console.log('Character atlas loaded');
        };

        // Load frontflip sprite
        this.frontflipSprite = new Image();
        this.frontflipSprite.src = 'assets/frontflip.png';
        this.frontflipLoaded = false;
        this.frontflipSprite.onload = () => {
            this.frontflipLoaded = true;
            console.log('Frontflip sprite loaded');
        };

        // Physics properties - PLATFORMER with jumping
        this.velocityX = 0;
        this.velocityY = 0;
        this.baseSpeed = 250; // Bazowa prędkość
        this.speed = this.baseSpeed; // Aktualna prędkość
        this.maxSpeed = 600; // Maksymalna prędkość
        this.speedIncreaseRate = 20; // Ile prędkości dodaje się co sekundę chodzenia
        this.walkingTime = 0; // Czas spędzony na chodzeniu
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
        this.flipDuration = 0.4; // Czas trwania front flip - przyśpieszone z 0.8 na 0.4
        this.flipTimer = 0;
        this.flipRotation = 0; // Aktualny kąt obrotu
        this.lastJumpTime = 0; // Czas ostatniego skoku
        this.doubleJumpWindow = 0.3; // Okno czasowe na podwójny skok (300ms)

        // Animation
        this.animationState = 'idle'; // idle, running, jumping, wallSliding, dashing
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
            dashJustStarted: this.dashJustStarted
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

        if (keys['KeyA'] || keys['ArrowLeft']) {
            moveDirection = -1;
            anyMovementKey = true;
            walkDirection = -1;
            if (!this.isDashing) {
                this.facingDirection = -1;
            }
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
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
                    this.velocityX = moveDirection * this.speed;
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

        // Jump input with double jump detection
        const jumpPressed = keys['KeyW'] || keys['ArrowUp'] || keys['Space'];
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

        // Dash input (only trigger once per key press)
        const dashKeyPressed = keys['ShiftLeft'] || keys['ShiftRight'];
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

        // Determine dash direction
        if (keys['KeyA'] || keys['ArrowLeft']) {
            dashDirection.x = -1;
        } else if (keys['KeyD'] || keys['ArrowRight']) {
            dashDirection.x = 1;
        }

        if (keys['KeyW'] || keys['ArrowUp']) {
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

    updateTimers(deltaTime) {
        // Progressive speed increase - infinite runner style
        if (this.isWalking && this.onGround && !this.isDashing) {
            this.walkingTime += deltaTime;
            // Zwiększaj prędkość co sekundę chodzenia
            this.speed = Math.min(
                this.maxSpeed,
                this.baseSpeed + (this.walkingTime * this.speedIncreaseRate)
            );
        } else if (!this.isWalking) {
            // Resetuj czas chodzenia gdy gracz się zatrzyma
            this.walkingTime = Math.max(0, this.walkingTime - deltaTime * 2); // Powolny spadek
            this.speed = Math.max(
                this.baseSpeed,
                this.baseSpeed + (this.walkingTime * this.speedIncreaseRate)
            );
        }

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

        // Invincibility timer
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }
    }

    applyPhysics(deltaTime, world) {
        // Apply gravity
        if (!this.onGround && !this.isDashing) {
            this.velocityY += this.gravity * deltaTime;
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

        // Simple ground collision (sidewalk level) - stały poziom ziemi
        const groundY = world.getGroundY();
        const tolerance = 2; // Small tolerance for floating point errors

        if (!onPlatform && this.y + this.height >= groundY - tolerance) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
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

        // Update animation state
        if (this.isFlipping) {
            this.animationState = 'flipping';
            this.animationFrame = 0;
        } else if (this.isDashing) {
            this.animationState = 'dashing';
            this.animationFrame = 0;
        } else if (!this.onGround) {
            this.animationState = 'jumping';
            this.animationFrame = 0;
        } else if (Math.abs(this.velocityX) > 10) {
            this.animationState = 'running';
            // Walking animation cycle - 4 frames, 0.2s per frame (slower for better visibility)
            this.animationFrame = Math.floor(this.animationTimer / 0.2) % 4;
        } else {
            this.animationState = 'idle';
            this.animationFrame = 0;
        }
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

        // Draw debug info
        if (false) { // Set to true for debugging
            this.drawDebugInfo(ctx);
        }
    }

    drawPlayerAtPosition(ctx, x, y) {
        // ✅ RESPONSIVE SCALING - skaluj całą postać
        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Adjust coordinates for scaling
        x = x / this.scale;
        y = y / this.scale;

        // Special rendering for frontflip
        if (this.isFlipping && this.frontflipLoaded) {
            ctx.save();

            // Calculate center point for rotation
            const centerX = x + this.width / 2;
            const centerY = y + this.height / 2;

            // Move to center, rotate, then draw
            ctx.translate(centerX, centerY);
            ctx.rotate(this.flipRotation * this.facingDirection);

            // Draw frontflip sprite (fixed proportions - less stretched)
            const flipWidth = this.width * 1.3;  // Slightly bigger than normal character
            const flipHeight = this.width * 1.3; // Make height same as width for square proportions
            ctx.drawImage(
                this.frontflipSprite,
                -flipWidth / 2,
                -flipHeight / 2,
                flipWidth,
                flipHeight
            );

            ctx.restore();
            return;
        }

        if (!this.imageLoaded) {
            // Fallback - draw simple character silhouette
            ctx.fillStyle = '#d4af37'; // Gold color like in original
            ctx.fillRect(x, y, this.width, this.height);
            return;
        }

        // Apply front flip rotation
        if (this.isFlipping && this.flipRotation !== 0) {
            ctx.save();
            // Obróć wokół środka torsu (bardziej naturalnie)
            const torsoX = x + this.width * 0.5;  // Środek torsu X
            const torsoY = y + this.height * 0.3;  // Środek torsu Y (wyżej niż środek postaci)
            ctx.translate(torsoX, torsoY);
            ctx.rotate(this.flipRotation);
            ctx.translate(-torsoX, -torsoY);
        }

        // Flip horizontally if facing left
        if (this.facingDirection < 0) {
            ctx.save();
            ctx.scale(-1, 1);
            x = -x - this.width;
        }

        // Calculate simple leg offsets for walking and jumping
        let leftLegX = 0;
        let rightLegX = 0;
        let bodyBob = 0;
        let headOffsetX = 0; // Przesunięcie głowy X
        let headOffsetY = 0; // Przesunięcie głowy Y
        let headRotation = 0; // Rotacja głowy
        let bodyOffsetX = 0; // Przesunięcie torsu X
        let bodyOffsetY = 0; // Przesunięcie torsu Y
        let bodyRotation = 0; // Rotacja torsu
        // Lewa noga
        let leftThighBendY = 0;
        let leftThighRotation = 0;
        let leftShinBendY = 0;
        let leftShinBendX = 0;
        let leftShinRotation = 0;
        let leftShoeBendY = 0;
        let leftShoeBendX = 0;
        let leftShoeRotation = 0;
        // Prawa noga
        let rightThighBendY = 0;
        let rightThighRotation = 0;
        let rightShinBendY = 0;
        let rightShinBendX = 0;
        let rightShinRotation = 0;
        let rightShoeBendY = 0;
        let rightShoeBendX = 0;
        let rightShoeRotation = 0;

        if (this.animationState === 'idle') {
            // walking position fixed animation - custom animation from tester
            headOffsetX = -4;
            headOffsetY = -45;
            headRotation = 0;
            bodyOffsetX = 0;
            bodyOffsetY = -9;
            bodyRotation = 0;
            leftLegX = 6;
            rightLegX = -1;
            // Lewa noga
            leftThighBendY = 8;
            leftThighRotation = 0;
            leftShinBendY = 1;
            leftShinBendX = -1;
            leftShinRotation = 0;
            leftShoeBendY = 0;
            leftShoeBendX = -1;
            leftShoeRotation = 0;
            // Prawa noga
            rightThighBendY = 8;
            rightThighRotation = 0;
            rightShinBendY = 0;
            rightShinBendX = 0;
            rightShinRotation = 0;
            rightShoeBendY = 0;
            rightShoeBendX = 5;
            rightShoeRotation = 0;
            bodyBob = 0;
        } else if (this.animationState === 'running') {
            // walking position fixed animation with leg movement
            const cycle = Math.sin(this.animationTimer * 10);
            headOffsetX = -4;
            headOffsetY = -45;
            headRotation = 0;
            bodyOffsetX = 0;
            bodyOffsetY = -9;
            bodyRotation = 0;
            leftLegX = 6 + cycle * 4;  // Bazowa pozycja + ruch
            rightLegX = -1 - cycle * 4;  // Bazowa pozycja + ruch
            // Lewa noga
            leftThighBendY = 8;
            leftThighRotation = 0;
            leftShinBendY = 1;
            leftShinBendX = -1;
            leftShinRotation = 0;
            leftShoeBendY = 0;
            leftShoeBendX = -1;
            leftShoeRotation = 0;
            // Prawa noga
            rightThighBendY = 8;
            rightThighRotation = 0;
            rightShinBendY = 0;
            rightShinBendX = 0;
            rightShinRotation = 0;
            rightShoeBendY = 0;
            rightShoeBendX = 5;
            rightShoeRotation = 0;
            bodyBob = Math.abs(cycle) * -2;
        } else if (this.animationState === 'flipping') {
            // frontflip animation - custom animation from tester
            headOffsetX = -14;
            headOffsetY = -44;
            headRotation = -0.1;
            bodyOffsetX = -5;
            bodyOffsetY = -9;
            bodyRotation = -0.2;
            leftLegX = -14;
            rightLegX = -19;
            // Lewa noga
            leftThighBendY = -9;
            leftThighRotation = 1.5;
            leftShinBendY = -42;
            leftShinBendX = -21;
            leftShinRotation = 1.5;
            leftShoeBendY = -59;
            leftShoeBendX = -31;
            leftShoeRotation = 1.5;
            // Prawa noga
            rightThighBendY = -5;
            rightThighRotation = 1.1;
            rightShinBendY = -29;
            rightShinBendX = -20;
            rightShinRotation = 1.5;
            rightShoeBendY = -44;
            rightShoeBendX = -35;
            rightShoeRotation = 1.5;
        } else if (this.animationState === 'jumping' && !this.isFlipping) {
            // jump animation - custom animation from tester
            headOffsetX = -3;
            headOffsetY = -46;
            headRotation = -0.4;
            bodyOffsetX = 1;
            bodyOffsetY = -14;
            bodyRotation = 0;
            leftLegX = -2;
            rightLegX = 2;
            // Lewa noga
            leftThighBendY = -10;
            leftThighRotation = 0.8;
            leftShinBendY = -33;
            leftShinBendX = -15;
            leftShinRotation = 1.3;
            leftShoeBendY = -43;
            leftShoeBendX = -27;
            leftShoeRotation = 0.8;
            // Prawa noga
            rightThighBendY = -2;
            rightThighRotation = 0;
            rightShinBendY = -16;
            rightShinBendX = -9;
            rightShinRotation = 0.8;
            rightShoeBendY = -22;
            rightShoeBendX = -15;
            rightShoeRotation = 0.8;
            bodyBob = 0;
        }

        // Draw head with rotation and custom offsets - dostosowane do animation testera
        let finalHeadOffsetY = y + headOffsetY;  // Bezwzględny offset jak w animation testerze
        let headScale = 1.0;

        // Jeśli nie ma custom offsetu, użyj domyślnej pozycji
        if (headOffsetY === 0) {
            finalHeadOffsetY = y - this.height * 0.42;
        }

        // Podczas front flip głowa jest bliżej ciała (kulka)
        if (this.isFlipping) {
            headScale = 0.8; // Głowa trochę mniejsza dla efektu kulki
        }

        // Draw head with rotation
        if (headRotation !== 0) {
            ctx.save();
            const headX = x - this.width * 0.2 + headOffsetX;
            const headY = finalHeadOffsetY;
            const headW = this.width * 1.4 * headScale;
            const headH = this.height * 0.35 * headScale;
            ctx.translate(headX + headW / 2, headY + headH / 2);
            ctx.rotate(headRotation);
            ctx.drawImage(
                this.characterAtlas,
                20, 7, 154, 126,
                -headW / 2, -headH / 2, headW, headH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                20, 7, 154, 126,  // HEAD - nowe współrzędne z atlas picker
                x - this.width * 0.2 + headOffsetX, finalHeadOffsetY,
                this.width * 1.4 * headScale, this.height * 0.35 * headScale
            );
        }

        // Draw torso with rotation and custom offsets - dostosowane do animation testera
        let bodyScale = 1.0;
        let finalBodyOffsetY = y + bodyOffsetY + bodyBob;  // Bezwzględny offset jak w animation testerze

        // Jeśli nie ma custom offsetu, użyj domyślnej pozycji
        if (bodyOffsetY === 0) {
            finalBodyOffsetY = y - this.height * 0.15 + bodyBob;
        }

        // Podczas front flip tors jest mniejszy (kulka)
        if (this.isFlipping) {
            bodyScale = 0.8; // Tors trochę mniejszy dla efektu kulki
        }

        // Draw torso with rotation
        if (bodyRotation !== 0) {
            ctx.save();
            const bodyX = x + this.width * 0.1 + bodyOffsetX;
            const bodyY = finalBodyOffsetY;
            const bodyW = this.width * 0.8 * bodyScale;
            const bodyH = this.height * 0.4 * bodyScale;
            ctx.translate(bodyX + bodyW / 2, bodyY + bodyH / 2);
            ctx.rotate(bodyRotation);
            ctx.drawImage(
                this.characterAtlas,
                6, 137, 165, 124,
                -bodyW / 2, -bodyH / 2, bodyW, bodyH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                6, 137, 165, 124,  // BODY - nowe współrzędne z atlas picker
                x + this.width * 0.1 + bodyOffsetX, finalBodyOffsetY,
                this.width * 0.8 * bodyScale, this.height * 0.4 * bodyScale
            );
        }

        // Draw legs using template coordinates
        const legStartY = y + this.height * 0.25;
        const legWidth = this.width * 0.35;
        const legHeight = this.height * 0.8;

        // LEFT THIGH with individual rotation
        if (leftThighRotation !== 0) {
            ctx.save();
            const thighX = x + this.width * 0.15 + leftLegX;
            const thighY = legStartY + leftThighBendY;
            const thighW = legWidth;
            const thighH = legHeight * 0.3;
            ctx.translate(thighX + thighW / 2, thighY + thighH / 2);
            ctx.rotate(leftThighRotation);
            ctx.drawImage(
                this.characterAtlas,
                50, 263, 40, 92,
                -thighW / 2, -thighH / 2, thighW, thighH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                50, 263, 40, 92,
                x + this.width * 0.15 + leftLegX, legStartY + leftThighBendY,
                legWidth, legHeight * 0.3
            );
        }

        // LEFT SHIN with individual rotation
        if (leftShinRotation !== 0) {
            ctx.save();
            const shinX = x + this.width * 0.15 + leftLegX + leftShinBendX;
            const shinY = legStartY + legHeight * 0.3 + leftShinBendY;
            const shinW = legWidth;
            const shinH = legHeight * 0.3;
            ctx.translate(shinX + shinW / 2, shinY + shinH / 2);
            ctx.rotate(leftShinRotation);
            ctx.drawImage(
                this.characterAtlas,
                43, 355, 53, 70,
                -shinW / 2, -shinH / 2, shinW, shinH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                43, 355, 53, 70,
                x + this.width * 0.15 + leftLegX + leftShinBendX, legStartY + legHeight * 0.3 + leftShinBendY,
                legWidth, legHeight * 0.3
            );
        }

        // LEFT SHOE with individual rotation
        if (leftShoeRotation !== 0) {
            ctx.save();
            const shoeX = x + this.width * 0.1 + leftLegX + leftShoeBendX;
            const shoeY = legStartY + legHeight * 0.5 + leftShoeBendY;
            ctx.translate(shoeX + legWidth * 0.6, shoeY + legHeight * 0.1);
            ctx.rotate(leftShoeRotation);
            ctx.drawImage(
                this.characterAtlas,
                31, 442, 62, 68,
                -legWidth * 0.6, -legHeight * 0.1,
                legWidth * 1.2, legHeight * 0.2
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                31, 442, 62, 68,
                x + this.width * 0.1 + leftLegX + leftShoeBendX, legStartY + legHeight * 0.5 + leftShoeBendY,
                legWidth * 1.2, legHeight * 0.2
            );
        }

        // RIGHT THIGH with individual rotation
        if (rightThighRotation !== 0) {
            ctx.save();
            const thighX = x + this.width * 0.5 + rightLegX;
            const thighY = legStartY + rightThighBendY;
            const thighW = legWidth;
            const thighH = legHeight * 0.3;
            ctx.translate(thighX + thighW / 2, thighY + thighH / 2);
            ctx.rotate(rightThighRotation);
            ctx.drawImage(
                this.characterAtlas,
                93, 261, 47, 97,
                -thighW / 2, -thighH / 2, thighW, thighH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                93, 261, 47, 97,
                x + this.width * 0.5 + rightLegX, legStartY + rightThighBendY,
                legWidth, legHeight * 0.3
            );
        }

        // RIGHT SHIN with individual rotation
        if (rightShinRotation !== 0) {
            ctx.save();
            const shinX = x + this.width * 0.5 + rightLegX + rightShinBendX;
            const shinY = legStartY + legHeight * 0.3 + rightShinBendY;
            const shinW = legWidth;
            const shinH = legHeight * 0.3;
            ctx.translate(shinX + shinW / 2, shinY + shinH / 2);
            ctx.rotate(rightShinRotation);
            ctx.drawImage(
                this.characterAtlas,
                100, 361, 44, 64,
                -shinW / 2, -shinH / 2, shinW, shinH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                100, 361, 44, 64,
                x + this.width * 0.5 + rightLegX + rightShinBendX, legStartY + legHeight * 0.3 + rightShinBendY,
                legWidth, legHeight * 0.3
            );
        }

        // RIGHT SHOE with individual rotation
        if (rightShoeRotation !== 0) {
            ctx.save();
            const shoeX = x + this.width * 0.45 + rightLegX + rightShoeBendX;
            const shoeY = legStartY + legHeight * 0.5 + rightShoeBendY;
            ctx.translate(shoeX + legWidth * 0.6, shoeY + legHeight * 0.1);
            ctx.rotate(rightShoeRotation);
            ctx.drawImage(
                this.characterAtlas,
                97, 446, 83, 57,
                -legWidth * 0.6, -legHeight * 0.1,
                legWidth * 1.2, legHeight * 0.2
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                97, 446, 83, 57,
                x + this.width * 0.45 + rightLegX + rightShoeBendX, legStartY + legHeight * 0.5 + rightShoeBendY,
                legWidth * 1.2, legHeight * 0.2
            );
        }

        // Restore flip
        if (this.facingDirection < 0) {
            ctx.restore();
        }

        // Restore front flip rotation
        if (this.isFlipping && this.flipRotation !== 0) {
            ctx.restore();
        }

        // Draw dash trail effect
        if (this.isDashing) {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                const trailX = this.x - i * 10 * this.facingDirection;
                ctx.drawImage(
                    this.characterAtlas,
                    20, 150, 120, 134,  // BODY from template
                    trailX + this.width * 0.1, this.y - this.height * 0.1,
                    this.width * 0.8, this.height * 0.4
                );
            }
            ctx.globalAlpha = 1.0;
        }

        // ✅ Restore scaling
        ctx.restore();
    }

    drawDebugInfo(ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Vel: ${this.velocityX.toFixed(1)}, ${this.velocityY.toFixed(1)}`, this.x, this.y - 55);
        ctx.fillText(`Speed: ${this.speed.toFixed(0)} (${this.walkingTime.toFixed(1)}s)`, this.x, this.y - 40);
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
        // Reset speed progression
        this.walkingTime = 0;
        this.speed = this.baseSpeed;
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