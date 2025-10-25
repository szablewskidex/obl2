// Player class with enhanced mechanics - using original Bungvo assets
class Player {
    constructor(x, y, physics) {
        this.x = x;
        this.y = y;
        this.width = 40;  // Slightly bigger like in original
        this.height = 60;
        this.physics = physics;
        
        // Load character atlas
        this.characterAtlas = new Image();
        this.characterAtlas.src = 'assets/charatlas.png';
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
        
        // Animation
        this.animationState = 'idle'; // idle, running, jumping, wallSliding, dashing
        this.animationTimer = 0;
        
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
        
        // Jump input
        if (keys['KeyW'] || keys['ArrowUp'] || keys['Space']) {
            this.jumpBufferTimer = this.jumpBufferTime;
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
    }
    
    applyPhysics(deltaTime, world) {
        // Apply gravity
        if (!this.onGround && !this.isDashing) {
            this.velocityY += this.gravity * deltaTime;
        }
        
        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Simple ground collision (sidewalk level)
        const groundY = world.height - 80;
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
        if (this.isDashing) {
            this.animationState = 'dashing';
        } else if (!this.onGround) {
            this.animationState = 'jumping';
        } else if (Math.abs(this.velocityX) > 10) {
            this.animationState = 'running';
        } else {
            this.animationState = 'idle';
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
            ctx.fillRect(0, this.y, this.width, this.height);
            return;
        }
        
        // Draw full character from atlas - the character should look like a person
        // Based on original, the character has blonde hair and clothes
        
        // Draw torso (body) at direct coordinates
        ctx.drawImage(
            this.characterAtlas,
            22, 134, 120, 134,  // Torso region from atlas
            x, y + this.height * 0.3, this.width, this.height * 0.7
        );
        
        // Draw head with blonde hair
        ctx.drawImage(
            this.characterAtlas,
            23, 15, 150, 120,  // Head region from atlas
            x - this.width * 0.2, y - this.height * 0.2, 
            this.width * 1.4, this.height * 0.6
        );
        
        // Draw legs (if visible in atlas)
        // Try to find leg regions in the atlas
        ctx.drawImage(
            this.characterAtlas,
            42, 353, 58, 83,  // Left leg region
            x + this.width * 0.1, y + this.height * 0.7, 
            this.width * 0.3, this.height * 0.4
        );
        
        ctx.drawImage(
            this.characterAtlas,
            97, 356, 46, 70,  // Right leg region  
            x + this.width * 0.6, y + this.height * 0.7,
            this.width * 0.3, this.height * 0.4
        );
        
        // Draw dash trail effect
        if (this.isDashing) {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                ctx.drawImage(
                    this.characterAtlas,
                    22, 134, 120, 134,
                    x - i * 10 * this.facingDirection, y + this.height * 0.3, 
                    this.width, this.height * 0.7
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