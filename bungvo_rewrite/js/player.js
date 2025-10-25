// Player class with enhanced mechanics - using original Bungvo assets
class Player {
    constructor(x, y, physics) {
        this.x = x;
        this.y = y;
        this.width = 60;   // Keep width
        this.height = 140; // Much taller to ensure legs are not cut off
        this.physics = physics;

        // Load character atlas
        this.characterAtlas = new Image();
        this.characterAtlas.src = 'assets/charatlas.png?v=' + Date.now(); // Force reload
        this.imageLoaded = false;
        this.characterAtlas.onload = () => {
            this.imageLoaded = true;
            console.log('Character atlas loaded');
        };

        // Physics properties - PLATFORMER with jumping
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 250;
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
        this.flipDuration = 0.8; // Czas trwania front flip
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
    }

    applyPhysics(deltaTime, world) {
        // Apply gravity
        if (!this.onGround && !this.isDashing) {
            this.velocityY += this.gravity * deltaTime;
        }

        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Simple ground collision (sidewalk level) - dostosowane do wysokości postaci
        const groundY = world.height - 20;  // Zmienione z -40 na -20 żeby stopy były dokładnie na chodnik
        const tolerance = 2; // Small tolerance for floating point errors

        if (this.y + this.height >= groundY - tolerance) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Keep player in screen bounds with margin
        const margin = 10; // Small margin to prevent edge glitches

        // Left edge
        if (this.x < margin) {
            this.x = margin;
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

        // Draw player based on animation state at direct coordinates
        this.drawPlayerAtPosition(ctx, this.x, this.y);

        ctx.restore();

        // Draw debug info
        if (false) { // Set to true for debugging
            this.drawDebugInfo(ctx);
        }
    }

    drawPlayerAtPosition(ctx, x, y) {
        if (!this.imageLoaded) {
            // Fallback - draw simple character silhouette
            ctx.fillStyle = '#d4af37'; // Gold color like in original
            ctx.fillRect(x, y, this.width, this.height);
            return;
        }

        // Apply front flip rotation
        if (this.isFlipping && this.flipRotation !== 0) {
            ctx.save();
            // Obróć wokół środka postaci
            ctx.translate(x + this.width / 2, y + this.height / 2);
            ctx.rotate(this.flipRotation);
            ctx.translate(-this.width / 2, -this.height / 2);
            x = 0;
            y = 0;
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
        let thighBendY = 0;  // Zginanie ud
        let shinBendY = 0;   // Zginanie łydek (więcej do tyłu)
        let shinBendX = 0;   // Przesunięcie łydek do tyłu
        let shoeBendY = 0;   // Zginanie butów
        let shoeBendX = 0;   // Przesunięcie butów do tyłu
        let shoeRotation = 0; // Rotacja butów (w radianach)

        if (this.animationState === 'idle') {
            // Simple idle animation - wszystko w normalnych pozycjach
            headOffsetX = 0;
            headOffsetY = 0;
            headRotation = 0;
            bodyOffsetX = 0;
            bodyOffsetY = 0;
            bodyRotation = 0;
            leftLegX = 0;
            rightLegX = 0;
            thighBendY = 0;
            shinBendY = 0;
            shinBendX = 0;
            shoeBendY = 0;
            shoeBendX = 0;
            shoeRotation = 0;
            bodyBob = 0; // Brak dodatkowego ruchu
        } else if (this.animationState === 'running') {
            // Simple walking animation - legs move side to side (zmniejszony ruch)
            const cycle = Math.sin(this.animationTimer * 10);
            leftLegX = cycle * 4;  // Zmniejszone z 8 na 4
            rightLegX = -cycle * 4;  // Zmniejszone z 8 na 4
            bodyBob = Math.abs(cycle) * -2;
        } else if (this.animationState === 'flipping') {
            // Front flip animation - curl into ball like Sonic
            // Wszystkie części ciała zginają się do środka w kulkę
            thighBendY = -35;    // Uda mocno do góry
            shinBendY = -45;     // Łydki jeszcze wyżej
            shinBendX = -15;     // Łydki do środka
            shoeBendY = -50;     // Buty najwyżej
            shoeBendX = -25;     // Buty mocno do środka
            shoeRotation = 1.2;  // Mocna rotacja butów
            leftLegX = 8;        // Nogi do środka (odwrotnie niż zwykle)
            rightLegX = -8;      // Nogi do środka
            bodyBob = -15;       // Ciało mocno do góry, bliżej głowy
        } else if (this.animationState === 'jumping' && !this.isFlipping) {
            // Jump animation - bend legs like sitting on knees (tylko gdy nie ma front flip)
            if (this.velocityY < 0) {
                // Going up - bend legs more (jak siadanie na kolanach)
                thighBendY = -10;   // Uda lekko do góry
                shinBendY = -25;    // Łydki mocno do góry
                shinBendX = -8;     // Łydki do tyłu
                shoeBendY = -30;    // Buty jeszcze wyżej
                shoeBendX = -20;    // Buty jeszcze bardziej do tyłu (zwiększone z -12 na -20)
                shoeRotation = 0.8; // Rotacja butów do tyłu (około +45 stopni) - zwiększone z 0.5
                leftLegX = -2;      // Lekko do środka
                rightLegX = 2;      // Lekko do środka
                bodyBob = -5;       // Ciało lekko do góry podczas skoku
            } else {
                // Falling down - legs slightly bent
                thighBendY = -5;
                shinBendY = -15;
                shinBendX = -5;
                shoeBendY = -18;
                shoeBendX = -15;    // Zwiększone z -8 na -15
                shoeRotation = 0.5; // Mniejsza rotacja podczas spadania - zwiększone z 0.3
                leftLegX = -1;
                rightLegX = 1;
                bodyBob = -2;       // Ciało lekko do góry podczas spadania
            }
        }

        // Draw head with rotation and custom offsets
        let finalHeadOffsetY = y - this.height * 0.42 + headOffsetY;
        let headScale = 1.0;
        
        // Podczas front flip głowa jest bliżej ciała (kulka)
        if (this.isFlipping) {
            finalHeadOffsetY = y - this.height * 0.25 + headOffsetY; // Głowa bliżej ciała
            headScale = 0.8; // Głowa trochę mniejsza dla efektu kulki
        }
        
        // Draw head with rotation
        if (headRotation !== 0) {
            ctx.save();
            const headX = x - this.width * 0.2 + headOffsetX;
            const headY = finalHeadOffsetY;
            const headW = this.width * 1.4 * headScale;
            const headH = this.height * 0.35 * headScale;
            ctx.translate(headX + headW/2, headY + headH/2);
            ctx.rotate(headRotation);
            ctx.drawImage(
                this.characterAtlas,
                20, 7, 154, 126,
                -headW/2, -headH/2, headW, headH
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

        // Draw torso with rotation and custom offsets
        let bodyScale = 1.0;
        let finalBodyOffsetY = y - this.height * 0.15 + bodyBob + bodyOffsetY;
        
        // Podczas front flip tors jest mniejszy (kulka)
        if (this.isFlipping) {
            bodyScale = 0.7; // Tors mniejszy
            finalBodyOffsetY = y - this.height * 0.05 + bodyBob + bodyOffsetY; // Tors bliżej nóg
        }
        
        // Draw torso with rotation
        if (bodyRotation !== 0) {
            ctx.save();
            const bodyX = x + this.width * 0.1 + bodyOffsetX;
            const bodyY = finalBodyOffsetY;
            const bodyW = this.width * 0.8 * bodyScale;
            const bodyH = this.height * 0.4 * bodyScale;
            ctx.translate(bodyX + bodyW/2, bodyY + bodyH/2);
            ctx.rotate(bodyRotation);
            ctx.drawImage(
                this.characterAtlas,
                6, 137, 165, 124,
                -bodyW/2, -bodyH/2, bodyW, bodyH
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

        // LEFT THIGH - using coordinates from atlas picker
        ctx.drawImage(
            this.characterAtlas,
            50, 263, 40, 92,  // L_THIGH - nowe współrzędne z atlas picker
            x + this.width * 0.15 + leftLegX, legStartY + thighBendY,  // Uda z własnym offsetem
            legWidth, legHeight * 0.3
        );

        // LEFT SHIN - using coordinates from atlas picker (zginane do tyłu)
        ctx.drawImage(
            this.characterAtlas,
            43, 355, 53, 70,  // L_SHIN - nowe współrzędne z atlas picker
            x + this.width * 0.15 + leftLegX + shinBendX, legStartY + legHeight * 0.3 + shinBendY,  // Łydka do tyłu i do góry
            legWidth, legHeight * 0.3
        );

        // LEFT SHOE - using coordinates from atlas picker (z rotacją)
        if (shoeRotation !== 0) {
            ctx.save();
            const shoeX = x + this.width * 0.1 + leftLegX + shoeBendX;
            const shoeY = legStartY + legHeight * 0.5 + shoeBendY;
            ctx.translate(shoeX + legWidth * 0.6, shoeY + legHeight * 0.1); // Środek buta
            ctx.rotate(shoeRotation);
            ctx.drawImage(
                this.characterAtlas,
                31, 442, 62, 68,  // L_SHOE - nowe współrzędne z atlas picker
                -legWidth * 0.6, -legHeight * 0.1,  // Offset od środka
                legWidth * 1.2, legHeight * 0.2
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                31, 442, 62, 68,  // L_SHOE - nowe współrzędne z atlas picker
                x + this.width * 0.1 + leftLegX + shoeBendX, legStartY + legHeight * 0.5 + shoeBendY,
                legWidth * 1.2, legHeight * 0.2
            );
        }

        // RIGHT THIGH - using coordinates from atlas picker
        ctx.drawImage(
            this.characterAtlas,
            93, 261, 47, 97,  // R_THIGH - nowe współrzędne z atlas picker
            x + this.width * 0.5 + rightLegX, legStartY + thighBendY,  // Uda z własnym offsetem
            legWidth, legHeight * 0.3
        );

        // RIGHT SHIN - using coordinates from atlas picker (zginane do tyłu)
        ctx.drawImage(
            this.characterAtlas,
            100, 361, 44, 64,  // R_SHIN - nowe współrzędne z atlas picker
            x + this.width * 0.5 + rightLegX + shinBendX, legStartY + legHeight * 0.3 + shinBendY,  // Łydka do tyłu i do góry
            legWidth, legHeight * 0.3
        );

        // RIGHT SHOE - using coordinates from atlas picker (z rotacją)
        if (shoeRotation !== 0) {
            ctx.save();
            const shoeX = x + this.width * 0.45 + rightLegX + shoeBendX;
            const shoeY = legStartY + legHeight * 0.5 + shoeBendY;
            ctx.translate(shoeX + legWidth * 0.6, shoeY + legHeight * 0.1); // Środek buta
            ctx.rotate(shoeRotation);
            ctx.drawImage(
                this.characterAtlas,
                97, 446, 83, 57,  // R_SHOE - nowe współrzędne z atlas picker
                -legWidth * 0.6, -legHeight * 0.1,  // Offset od środka
                legWidth * 1.2, legHeight * 0.2
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.characterAtlas,
                97, 446, 83, 57,  // R_SHOE - nowe współrzędne z atlas picker
                x + this.width * 0.45 + rightLegX + shoeBendX, legStartY + legHeight * 0.5 + shoeBendY,
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