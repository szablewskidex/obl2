// Weapon and shooting system
class Bullet {
    constructor(x, y, directionX, speed = 800, directionY = 0) {
        this.x = x;
        this.y = y;
        this.directionX = directionX; // X direction
        this.directionY = directionY; // Y direction
        this.speed = speed;
        this.width = 8;
        this.height = 3;
        this.active = true;
        this.damage = 1;
        
        // Visual properties
        this.color = '#FFD700'; // Gold color
        this.trailLength = 15;
        this.trail = []; // Trail positions for visual effect
    }
    
    update(deltaTime, screenWidth, screenHeight) {
        if (!this.active) return;
        
        // Store trail position
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        // Move bullet
        this.x += this.directionX * this.speed * deltaTime;
        this.y += this.directionY * this.speed * deltaTime;
        
        // Deactivate if off screen
        if (this.x < -50 || this.x > screenWidth + 50) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Draw trail
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i / this.trail.length) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            const pos = this.trail[i];
            ctx.fillRect(pos.x - 2, pos.y - 1, 4, 2);
        }
        
        // Draw bullet
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        ctx.restore();
    }
    
    getRect() {
        return {
            x: this.x - this.width/2,
            y: this.y - this.height/2,
            width: this.width,
            height: this.height
        };
    }
    
    checkCollision(target) {
        const bulletRect = this.getRect();
        const targetRect = target.getRect();
        
        return (bulletRect.x < targetRect.x + targetRect.width &&
                bulletRect.x + bulletRect.width > targetRect.x &&
                bulletRect.y < targetRect.y + targetRect.height &&
                bulletRect.y + bulletRect.height > targetRect.y);
    }
}

class WeaponSystem {
    constructor() {
        this.bullets = [];
        this.maxAmmo = 30;
        this.currentAmmo = 30;
        this.reloadTime = 2.0; // 2 seconds to reload
        this.isReloading = false;
        this.reloadTimer = 0;
        
        // Shooting mechanics
        this.fireRate = 0.15; // Time between shots (seconds)
        this.fireTimer = 0;
        this.canShoot = true;
        
        // Weapon visual properties
        this.weaponOffset = { x: 35, y: -55 }; // Offset from player center - w prawo i wyżej
        this.weaponRotation = 0;
        this.recoilAmount = 0;
        this.recoilDecay = 8; // How fast recoil decays
        
        // Aiming system
        this.aimAngle = 0; // Current aim angle in radians
        this.maxAimAngle = Math.PI / 3; // Max 60 degrees up/down
        this.aimSensitivity = 0.002; // Mouse sensitivity
        this.gamepadAimSensitivity = 2.0; // Gamepad sensitivity
        
        // Load weapon hand sprite
        this.weaponHandSprite = new Image();
        this.weaponHandSprite.src = 'assets/weapon-hand.png'; // Your new sprite
        this.weaponHandLoaded = false;
        this.weaponHandSprite.onload = () => {
            this.weaponHandLoaded = true;
            console.log('Weapon hand sprite loaded');
        };
        
        // Muzzle flash
        this.muzzleFlash = {
            active: false,
            timer: 0,
            duration: 0.05 // 50ms flash
        };
        
        // Shooting state
        this.isShooting = false;
        this.shootingTimer = 0;
        this.shootingDuration = 0.5; // Show weapon for 500ms after shooting
        
        // Shell casings
        this.shellCasings = [];
        this.maxShellCasings = 10;
    }
    
    update(deltaTime, keys, player, screenWidth, screenHeight, aimInput = {}) {
        // Store player flip state for weapon rotation
        this.playerIsFlipping = player.isFlipping;
        this.playerFlipRotation = player.flipRotation;
        
        // Update aiming when weapon is visible
        if (this.isShooting) {
            // Mouse aiming (vertical movement)
            if (aimInput.mouseDeltaY) {
                this.aimAngle += aimInput.mouseDeltaY * this.aimSensitivity;
            }
            
            // Gamepad aiming (left stick Y)
            if (Math.abs(aimInput.gamepadLeftStickY) > 0.1) {
                this.aimAngle += aimInput.gamepadLeftStickY * this.gamepadAimSensitivity * deltaTime;
            }
            
            // Clamp aim angle
            this.aimAngle = Math.max(-this.maxAimAngle, Math.min(this.maxAimAngle, this.aimAngle));
        }
        // Update timers
        this.fireTimer -= deltaTime;
        if (this.fireTimer < 0) this.fireTimer = 0;
        
        // Update reload
        if (this.isReloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.currentAmmo = this.maxAmmo;
                this.isReloading = false;
                console.log('Reload complete!');
            }
        }
        
        // Update recoil
        if (this.recoilAmount > 0) {
            this.recoilAmount -= this.recoilDecay * deltaTime;
            if (this.recoilAmount < 0) this.recoilAmount = 0;
        }
        
        // Update muzzle flash
        if (this.muzzleFlash.active) {
            this.muzzleFlash.timer -= deltaTime;
            if (this.muzzleFlash.timer <= 0) {
                this.muzzleFlash.active = false;
            }
        }
        
        // Update shooting state
        if (this.shootingTimer > 0) {
            this.shootingTimer -= deltaTime;
            this.isShooting = true;
        } else {
            this.isShooting = false;
        }
        
        // Handle shooting input - X/Z dla klawiatury, LPM dla myszy
        const shootKey = keys['KeyX'] || keys['KeyZ'] || keys['MouseLeft'];
        if (shootKey && this.canShoot && !this.isReloading && this.currentAmmo > 0 && this.fireTimer <= 0) {
            this.shoot(player);
        }
        
        // Handle reload input
        const reloadKey = keys['KeyR'];
        if (reloadKey && !this.isReloading && this.currentAmmo < this.maxAmmo) {
            this.startReload();
        }
        
        // Auto-reload when empty
        if (this.currentAmmo <= 0 && !this.isReloading) {
            this.startReload();
        }
        
        // Update bullets
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime, screenWidth, screenHeight);
        });
        
        // Remove inactive bullets
        this.bullets = this.bullets.filter(bullet => bullet.active);
        
        // Update shell casings
        this.shellCasings.forEach(casing => {
            if (!casing.active) return;
            
            casing.age += deltaTime;
            casing.vy += casing.gravity * deltaTime;
            casing.x += casing.vx * deltaTime;
            casing.y += casing.vy * deltaTime;
            casing.rotation += casing.rotationSpeed * deltaTime;
            
            // Ground collision
            const groundY = 600; // Approximate ground level
            if (casing.y >= groundY - 5 && !casing.onGround) {
                casing.y = groundY - 5;
                casing.vy *= -casing.bounce;
                casing.vx *= 0.8; // Friction
                casing.rotationSpeed *= 0.7;
                
                if (Math.abs(casing.vy) < 20) {
                    casing.onGround = true;
                    casing.vy = 0;
                }
            }
            
            // Remove old casings
            if (casing.age >= casing.lifetime) {
                casing.active = false;
            }
        });
        
        // Remove old shell casings
        this.shellCasings = this.shellCasings.filter(casing => casing.active);
    }
    
    shoot(player) {
        // Create bullet from gun barrel position with aim angle
        const baseX = player.x + player.width/2 + (45 * player.facingDirection);
        const baseY = player.y + player.height/2 + this.weaponOffset.y;
        
        // Apply aim angle to bullet direction
        const aimDirection = {
            x: player.facingDirection,
            y: Math.sin(this.aimAngle * player.facingDirection)
        };
        
        // Normalize direction
        const magnitude = Math.sqrt(aimDirection.x * aimDirection.x + aimDirection.y * aimDirection.y);
        aimDirection.x /= magnitude;
        aimDirection.y /= magnitude;
        
        const bullet = new Bullet(baseX, baseY, aimDirection.x, 800, aimDirection.y);
        this.bullets.push(bullet);
        
        // Consume ammo
        this.currentAmmo--;
        
        // Set fire timer
        this.fireTimer = this.fireRate;
        
        // Add recoil
        this.recoilAmount = 0.3; // Radians
        
        // Activate muzzle flash
        this.muzzleFlash.active = true;
        this.muzzleFlash.timer = this.muzzleFlash.duration;
        
        // Set shooting state
        this.shootingTimer = this.shootingDuration;
        
        // Create shell casing
        this.createShellCasing(baseX - (10 * player.facingDirection), baseY - 5, player.facingDirection);
        
        console.log(`Shot fired! Ammo: ${this.currentAmmo}/${this.maxAmmo}`);
    }
    
    startReload() {
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        console.log('Reloading...');
    }
    
    createShellCasing(x, y, playerDirection) {
        // Remove oldest casing if at max
        if (this.shellCasings.length >= this.maxShellCasings) {
            this.shellCasings.shift();
        }
        
        const casing = {
            x: x,
            y: y,
            vx: -playerDirection * (50 + Math.random() * 30), // Eject opposite to shooting direction
            vy: -80 - Math.random() * 40, // Upward velocity
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 10,
            gravity: 400,
            bounce: 0.3,
            active: true,
            lifetime: 3.0, // 3 seconds before disappearing
            age: 0,
            onGround: false
        };
        
        this.shellCasings.push(casing);
    }
    
    renderWeapon(ctx, player) {
        // Only show weapon when shooting
        if (!this.isShooting) return;
        
        ctx.save();
        
        // Calculate weapon position
        const weaponX = player.x + player.width/2 + (this.weaponOffset.x * player.facingDirection);
        const weaponY = player.y + player.height/2 + this.weaponOffset.y;
        
        // Apply recoil
        const recoilOffset = this.recoilAmount * -5 * player.facingDirection;
        
        // Apply frontflip rotation if player is flipping
        if (this.playerIsFlipping && this.playerFlipRotation !== 0) {
            ctx.save();
            // Rotate around player center like the player does
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height * 0.3; // Same as player torso center
            ctx.translate(playerCenterX, playerCenterY);
            ctx.rotate(this.playerFlipRotation * player.facingDirection);
            ctx.translate(-playerCenterX, -playerCenterY);
        }
        
        // Apply aiming rotation (only when not flipping)
        if (!this.playerIsFlipping && this.aimAngle !== 0) {
            ctx.save();
            // Rotate around shoulder/arm base - adjust for facing direction
            let pivotX, pivotY;
            
            if (player.facingDirection > 0) {
                // Facing right - pivot on left side (shoulder)
                pivotX = weaponX + recoilOffset - 30;
                pivotY = weaponY;
            } else {
                // Facing left - pivot on right side (shoulder when flipped)
                pivotX = weaponX + recoilOffset + 30;
                pivotY = weaponY;
            }
            
            ctx.translate(pivotX, pivotY);
            ctx.rotate(this.aimAngle * player.facingDirection);
            ctx.translate(-pivotX, -pivotY);
        }
        
        // Flip weapon if facing left
        if (player.facingDirection < 0) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-weaponX * 2, 0);
        }
        
        // Draw weapon hand sprite
        if (this.weaponHandLoaded && this.weaponHandSprite.complete) {
            // Use your custom weapon hand sprite
            const spriteWidth = this.weaponHandSprite.naturalWidth;
            const spriteHeight = this.weaponHandSprite.naturalHeight;
            
            // Scale to appropriate size
            const renderWidth = 60;
            const renderHeight = (spriteHeight / spriteWidth) * renderWidth;
            
            ctx.drawImage(
                this.weaponHandSprite,
                0, 0, spriteWidth, spriteHeight, // Full sprite
                weaponX + recoilOffset - 25, weaponY - renderHeight/2,
                renderWidth, renderHeight
            );
        } else {
            // Fallback - simple hand with weapon
            const armX = weaponX + recoilOffset - 30;
            const armY = weaponY - 10; // Już uwzględnione w weaponY przez weaponOffset
            
            // Draw arm (yellow sleeve like in the character)
            ctx.fillStyle = '#FFD700'; // Yellow like jacket
            ctx.fillRect(armX, armY, 40, 12);
            
            // Draw hand (skin color)
            ctx.fillStyle = '#FDBCB4';
            ctx.fillRect(armX + 35, armY + 2, 15, 8);
            
            // Draw weapon (detailed gun)
            ctx.fillStyle = '#2F4F4F'; // Dark gray
            ctx.fillRect(armX + 45, armY + 3, 25, 6);
            
            // Gun barrel
            ctx.fillStyle = '#000000';
            ctx.fillRect(armX + 65, armY + 4, 15, 4);
            
            // Gun grip
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(armX + 40, armY + 6, 8, 10);
        }
        
        // Draw muzzle flash at gun barrel
        if (this.muzzleFlash.active) {
            ctx.fillStyle = '#FFFF00';
            ctx.globalAlpha = 0.8;
            const flashX = weaponX + (45 * player.facingDirection) + recoilOffset; // Dalej - przy lufie
            const flashY = weaponY;
            ctx.fillRect(flashX - 5, flashY - 3, 10, 6);
            ctx.globalAlpha = 1.0;
        }
        
        if (player.facingDirection < 0) {
            ctx.restore();
        }
        
        // Restore aiming rotation
        if (!this.playerIsFlipping && this.aimAngle !== 0) {
            ctx.restore();
        }
        
        // Restore frontflip rotation
        if (this.playerIsFlipping && this.playerFlipRotation !== 0) {
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    renderBullets(ctx) {
        this.bullets.forEach(bullet => {
            bullet.render(ctx);
        });
    }
    
    renderShellCasings(ctx, groundY) {
        ctx.save();
        
        this.shellCasings.forEach(casing => {
            if (!casing.active) return;
            
            // Fade out over time
            const alpha = Math.max(0, 1 - (casing.age / casing.lifetime));
            if (alpha <= 0) {
                casing.active = false;
                return;
            }
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#DAA520'; // Golden color for brass casing
            
            ctx.save();
            ctx.translate(casing.x, casing.y);
            ctx.rotate(casing.rotation);
            ctx.fillRect(-2, -1, 4, 2);
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    checkBulletCollisions(obstacles) {
        const hits = [];
        
        this.bullets.forEach(bullet => {
            if (!bullet.active) return;
            
            obstacles.forEach(obstacle => {
                if (obstacle.active && !obstacle.isDestroying && bullet.checkCollision(obstacle)) {
                    bullet.active = false;
                    hits.push(obstacle);
                }
            });
        });
        
        return hits;
    }
    
    // UI helper methods
    getAmmoPercent() {
        return this.currentAmmo / this.maxAmmo;
    }
    
    getReloadPercent() {
        if (!this.isReloading) return 1.0;
        return 1.0 - (this.reloadTimer / this.reloadTime);
    }
    
    getCurrentAmmo() {
        return this.currentAmmo;
    }
    
    getMaxAmmo() {
        return this.maxAmmo;
    }
    
    isCurrentlyReloading() {
        return this.isReloading;
    }
}