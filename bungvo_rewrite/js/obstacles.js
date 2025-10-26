// Obstacle system for random obstacles on the road
class Obstacle {
    constructor(x, y, type = 'block') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 40;
        this.height = 40;
        this.scrolled = false;
        this.active = true;
        
        // Different obstacle types
        this.setupObstacleType(type);
        
        // Animation
        this.animationTimer = 0;
        this.bobOffset = Math.random() * Math.PI * 2; // Random phase for bobbing
        
        // Destruction animation
        this.isDestroying = false;
        this.destructionTimer = 0;
        this.destructionDuration = 0.3; // 300ms destruction animation
        this.particles = []; // Particles for destruction effect
    }
    
    setupObstacleType(type) {
        switch(type) {
            case 'block':
                this.width = 55;  // Powiększone z 40 na 55
                this.height = 55; // Powiększone z 40 na 55
                this.texture = 'obstacle1'; // Small obstacle
                this.canJumpOver = true;
                this.damagesPlayer = true;
                break;
            case 'tall_block':
                this.width = 55;  // Powiększone z 40 na 55
                this.height = 110; // Powiększone z 80 na 110
                this.texture = 'obstacle1'; // Tall obstacle
                this.canJumpOver = false; // Too tall to jump over
                this.damagesPlayer = true;
                break;
            case 'fence':
                this.width = 60;
                this.height = 60;
                this.texture = 'oblockfence'; // Fence piece
                this.canJumpOver = true;
                this.damagesPlayer = true;
                break;
            case 'platform':
                this.width = 80;
                this.height = 20;
                this.texture = 'platform'; // Platform piece
                this.canJumpOver = true;
                this.damagesPlayer = true;
                break;
            case 'police_car':
                this.width = 300;  // Original image width
                this.height = 167; // Original image height
                this.texture = 'police_car'; // Police car
                this.canJumpOver = true;
                this.damagesPlayer = false; // Can jump on it without taking damage
                this.isPlatform = true; // Can stand on top
                this.useOriginalSize = true; // Don't scale, use original image size
                break;
            default:
                this.width = 40;
                this.height = 40;
                this.texture = 'obstacle1';
                this.canJumpOver = true;
                this.damagesPlayer = true;
        }
    }
    
    update(deltaTime, scrollSpeed, scrollDirection, screenWidth = 1200) {
        // Update animation
        this.animationTimer += deltaTime;
        
        // Update destruction animation
        if (this.isDestroying) {
            this.destructionTimer -= deltaTime;
            
            // Update particles
            this.particles.forEach(particle => {
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.vy += 500 * deltaTime; // Gravity
                particle.rotation += particle.rotationSpeed * deltaTime;
            });
            
            // Mark as inactive when animation is done
            if (this.destructionTimer <= 0) {
                this.active = false;
            }
        }
        
        // Move with world scrolling
        this.x -= scrollSpeed * deltaTime * scrollDirection;
        
        // Mark as scrolled if off screen (use actual screen width)
        if (this.x < -this.width || this.x > screenWidth + 200) {
            this.scrolled = true;
        }
    }
    
    render(ctx, textures) {
        if (this.scrolled) return;
        
        ctx.save();
        
        // Render destruction animation
        if (this.isDestroying) {
            // Draw particles
            this.particles.forEach(particle => {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                
                // Fade out
                const alpha = this.destructionTimer / this.destructionDuration;
                ctx.globalAlpha = alpha;
                
                ctx.fillStyle = this.getObstacleColor();
                ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                
                ctx.restore();
            });
            
            ctx.restore();
            return;
        }
        
        if (!this.active) {
            ctx.restore();
            return;
        }
        
        // Simple bobbing animation for some obstacle types
        let yOffset = 0;
        if (this.type === 'block' || this.type === 'fence') {
            yOffset = Math.sin(this.animationTimer * 2 + this.bobOffset) * 2;
        }
        
        // Draw obstacle
        const texture = textures[this.texture];
        if (texture && texture.complete) {
            if (this.useOriginalSize) {
                // Use original image size without scaling
                ctx.drawImage(
                    texture,
                    this.x, this.y + yOffset
                );
            } else {
                // Scale to obstacle size
                ctx.drawImage(
                    texture,
                    0, 0, texture.width, texture.height,  // Source: full image
                    this.x, this.y + yOffset, this.width, this.height  // Destination: scaled to obstacle size
                );
            }
        } else {
            // Fallback rendering
            ctx.fillStyle = this.getObstacleColor();
            ctx.fillRect(this.x, this.y + yOffset, this.width, this.height);
            
            // Add simple border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y + yOffset, this.width, this.height);
        }
        
        ctx.restore();
    }
    
    getObstacleColor() {
        switch(this.type) {
            case 'block': return '#8B4513'; // Brown
            case 'tall_block': return '#654321'; // Dark brown
            case 'fence': return '#228B22'; // Green
            case 'platform': return '#696969'; // Gray
            case 'police_car': return '#FFFFFF'; // White
            default: return '#8B4513';
        }
    }
    
    // Start destruction animation
    destroy() {
        if (this.isDestroying) return; // Already destroying
        
        this.isDestroying = true;
        this.destructionTimer = this.destructionDuration;
        
        // Create particles for destruction effect
        const numParticles = 8;
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const speed = 100 + Math.random() * 100;
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100, // Upward bias
                size: 5 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
    }
    
    // Collision detection with smaller hitbox
    getRect() {
        // Reduce hitbox by 20% on each side for more forgiving collisions
        const margin = 0.2;
        return {
            x: this.x + this.width * margin,
            y: this.y + this.height * margin,
            width: this.width * (1 - margin * 2),
            height: this.height * (1 - margin * 2)
        };
    }
    
    checkCollision(player) {
        const playerRect = player.getRect();
        const obstacleRect = this.getRect();
        
        return (playerRect.x < obstacleRect.x + obstacleRect.width &&
                playerRect.x + playerRect.width > obstacleRect.x &&
                playerRect.y < obstacleRect.y + obstacleRect.height &&
                playerRect.y + playerRect.height > obstacleRect.y);
    }
}

// Obstacle manager class
class ObstacleManager {
    constructor(worldHeight) {
        this.obstacles = [];
        this.worldHeight = worldHeight;
        this.updateGroundY(worldHeight);
    }
    
    updateGroundY(worldHeight) {
        this.worldHeight = worldHeight;
        this.groundY = worldHeight - 20; // Same as player ground level
        
        // Spawning parameters
        this.spawnDistance = 1200; // Distance from screen edge to spawn (far ahead)
        this.minObstacleSpacing = 350; // Minimum distance between obstacles
        this.maxObstacleSpacing = 700; // Maximum distance between obstacles
        this.obstacleChance = 0.12; // 12% chance to spawn obstacle when checking
        
        // Obstacle types and their spawn weights
        this.obstacleTypes = [
            { type: 'block', weight: 40 },
            { type: 'fence', weight: 25 },
            { type: 'platform', weight: 15 },
            { type: 'police_car', weight: 15 }, // Police car - can jump on it
            { type: 'tall_block', weight: 5 } // Very rare, harder to avoid
        ];
        
        this.lastObstacleX = 0; // Track last obstacle position
        this.spawnCooldown = 0; // Cooldown timer to prevent spam spawning
        this.spawnCooldownTime = 0.3; // Minimum time between spawn checks (seconds)
    }
    
    update(deltaTime, scrollSpeed, scrollDirection, screenWidth) {
        // Update existing obstacles with screen width
        this.obstacles.forEach(obstacle => {
            obstacle.update(deltaTime, scrollSpeed, scrollDirection, screenWidth);
        });
        
        // Remove scrolled obstacles
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.scrolled);
        
        // Update spawn cooldown
        if (this.spawnCooldown > 0) {
            this.spawnCooldown -= deltaTime;
        }
        
        // Spawn new obstacles based on scroll direction (with cooldown)
        if (Math.abs(scrollDirection) > 0.05 && this.spawnCooldown <= 0) {
            this.checkSpawnObstacles(scrollDirection, screenWidth);
            this.spawnCooldown = this.spawnCooldownTime; // Reset cooldown
        }
    }
    
    checkSpawnObstacles(scrollDirection, screenWidth) {
        // ONLY spawn obstacles when scrolling RIGHT (player moving right)
        // This is an infinite runner - obstacles should only appear ahead
        if (scrollDirection > 0.05) {
            // Scrolling right (player moving right) - spawn obstacles ahead on the right
            const obstacleXs = this.obstacles.filter(o => o.active && !o.isDestroying).map(o => o.x);
            const rightmostObstacle = obstacleXs.length > 0 ? Math.max(...obstacleXs) : screenWidth / 2;
            
            // Check if we should spawn a new obstacle far ahead
            if (rightmostObstacle < screenWidth + this.spawnDistance) {
                this.trySpawnObstacle(rightmostObstacle, 1);
            }
        }
        // Don't spawn obstacles when scrolling left - player shouldn't go backwards
    }
    
    trySpawnObstacle(referenceX, direction) {
        // Random chance to spawn
        if (Math.random() > this.obstacleChance) return;
        
        // Calculate spawn position
        const spacing = this.minObstacleSpacing + Math.random() * (this.maxObstacleSpacing - this.minObstacleSpacing);
        const newX = referenceX + (spacing * direction);
        
        // Choose random obstacle type based on weights
        const obstacleType = this.getRandomObstacleType();
        
        // Create obstacle - position will be adjusted below
        const obstacle = new Obstacle(newX, this.groundY, obstacleType);
        
        // Adjust Y position for different obstacle types (Y is top of obstacle)
        if (obstacleType === 'platform') {
            obstacle.y = this.groundY - obstacle.height - 40; // Platform floating above ground
        } else if (obstacleType === 'tall_block') {
            obstacle.y = this.groundY - obstacle.height; // Tall block on ground
        } else if (obstacleType === 'police_car') {
            obstacle.y = this.groundY - 167; // Police car on ground (using original height)
        } else {
            obstacle.y = this.groundY - obstacle.height; // Default: on ground
        }
        
        this.obstacles.push(obstacle);
        console.log(`Spawned ${obstacleType} obstacle at x: ${newX}`);
    }
    
    getRandomObstacleType() {
        const totalWeight = this.obstacleTypes.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const obstacleType of this.obstacleTypes) {
            random -= obstacleType.weight;
            if (random <= 0) {
                return obstacleType.type;
            }
        }
        
        return 'block'; // Fallback
    }
    
    render(ctx, textures) {
        this.obstacles.forEach(obstacle => {
            obstacle.render(ctx, textures);
        });
    }
    
    checkCollisions(player) {
        const collisions = [];
        
        this.obstacles.forEach(obstacle => {
            if (obstacle.active && obstacle.checkCollision(player)) {
                collisions.push(obstacle);
            }
        });
        
        return collisions;
    }
    
    // Get obstacles for AI or other systems
    getActiveObstacles() {
        return this.obstacles.filter(obstacle => obstacle.active && !obstacle.scrolled);
    }
    
    // Clear all obstacles (for level reset)
    clear() {
        this.obstacles = [];
        this.lastObstacleX = 0;
    }
}