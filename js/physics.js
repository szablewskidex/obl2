// Physics engine for collision detection and response
class Physics {
    constructor() {
        this.gravity = 980; // pixels per second squared
    }
    
    // Basic AABB collision detection
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // Platform collision with proper response
    checkPlatformCollision(player, platform) {
        const playerRect = player.getRect();
        
        // Check if player is colliding with platform
        if (!this.checkCollision(playerRect, platform)) {
            return false;
        }
        
        // Calculate overlap on each axis
        const overlapX = Math.min(
            playerRect.x + playerRect.width - platform.x,
            platform.x + platform.width - playerRect.x
        );
        const overlapY = Math.min(
            playerRect.y + playerRect.height - platform.y,
            platform.y + platform.height - playerRect.y
        );
        
        // Resolve collision based on smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (playerRect.x < platform.x) {
                // Player is to the left of platform
                player.x = platform.x - playerRect.width;
            } else {
                // Player is to the right of platform
                player.x = platform.x + platform.width;
            }
            player.velocityX = 0;
        } else {
            // Vertical collision
            if (playerRect.y < platform.y) {
                // Player is above platform (landing)
                player.y = platform.y - playerRect.height;
                if (player.velocityY > 0) {
                    player.velocityY = 0;
                    return true; // Player is on ground
                }
            } else {
                // Player is below platform (hitting head)
                player.y = platform.y + platform.height;
                if (player.velocityY < 0) {
                    player.velocityY = 0;
                }
            }
        }
        
        return false;
    }
    
    // Wall collision for wall jumping
    checkWallCollision(player, wall) {
        const playerRect = player.getRect();
        
        // Check if player is colliding with wall
        if (!this.checkCollision(playerRect, wall)) {
            return false;
        }
        
        // Calculate overlap on each axis
        const overlapX = Math.min(
            playerRect.x + playerRect.width - wall.x,
            wall.x + wall.width - playerRect.x
        );
        const overlapY = Math.min(
            playerRect.y + playerRect.height - wall.y,
            wall.y + wall.height - playerRect.y
        );
        
        // Only resolve horizontal collision for walls
        if (overlapX < overlapY) {
            if (playerRect.x < wall.x) {
                // Player is to the left of wall
                player.x = wall.x - playerRect.width;
                player.wallNormal = { x: -1, y: 0 };
            } else {
                // Player is to the right of wall
                player.x = wall.x + wall.width;
                player.wallNormal = { x: 1, y: 0 };
            }
            
            // Stop horizontal movement
            if ((player.velocityX > 0 && playerRect.x >= wall.x) ||
                (player.velocityX < 0 && playerRect.x <= wall.x)) {
                player.velocityX = 0;
            }
            
            return true;
        }
        
        return false;
    }
    
    // Point-in-rectangle collision (for coins)
    pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }
    
    // Circle-rectangle collision (alternative for coins)
    circleRectCollision(circle, rect) {
        const distX = Math.abs(circle.x - rect.x - rect.width / 2);
        const distY = Math.abs(circle.y - rect.y - rect.height / 2);
        
        if (distX > (rect.width / 2 + circle.radius)) return false;
        if (distY > (rect.height / 2 + circle.radius)) return false;
        
        if (distX <= rect.width / 2) return true;
        if (distY <= rect.height / 2) return true;
        
        const dx = distX - rect.width / 2;
        const dy = distY - rect.height / 2;
        return (dx * dx + dy * dy <= circle.radius * circle.radius);
    }
    
    // Raycast for advanced collision detection
    raycast(start, end, obstacles) {
        const hits = [];
        
        for (const obstacle of obstacles) {
            const hit = this.rayRectIntersection(start, end, obstacle);
            if (hit) {
                hits.push({
                    point: hit,
                    obstacle: obstacle,
                    distance: this.distance(start, hit)
                });
            }
        }
        
        // Sort by distance
        hits.sort((a, b) => a.distance - b.distance);
        
        return hits.length > 0 ? hits[0] : null;
    }
    
    rayRectIntersection(start, end, rect) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        
        const t1 = (rect.x - start.x) / dx;
        const t2 = (rect.x + rect.width - start.x) / dx;
        const t3 = (rect.y - start.y) / dy;
        const t4 = (rect.y + rect.height - start.y) / dy;
        
        const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
        
        if (tmax < 0 || tmin > tmax || tmin > 1) {
            return null;
        }
        
        const t = tmin >= 0 ? tmin : tmax;
        return {
            x: start.x + t * dx,
            y: start.y + t * dy
        };
    }
    
    // Utility functions
    distance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    normalize(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) return { x: 0, y: 0 };
        return {
            x: vector.x / length,
            y: vector.y / length
        };
    }
    
    dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    
    // Apply physics forces
    applyGravity(object, deltaTime) {
        if (!object.onGround) {
            object.velocityY += this.gravity * deltaTime;
        }
    }
    
    applyFriction(object, friction = 0.8) {
        object.velocityX *= friction;
        if (Math.abs(object.velocityX) < 1) {
            object.velocityX = 0;
        }
    }
    
    // Constraint functions
    constrainToRect(object, bounds) {
        if (object.x < bounds.x) {
            object.x = bounds.x;
            object.velocityX = 0;
        }
        if (object.x + object.width > bounds.x + bounds.width) {
            object.x = bounds.x + bounds.width - object.width;
            object.velocityX = 0;
        }
        if (object.y < bounds.y) {
            object.y = bounds.y;
            object.velocityY = 0;
        }
        if (object.y + object.height > bounds.y + bounds.height) {
            object.y = bounds.y + bounds.height - object.height;
            object.velocityY = 0;
        }
    }
    
    // Advanced collision response
    resolveCollision(object1, object2, restitution = 0.8) {
        const dx = object2.x - object1.x;
        const dy = object2.y - object1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        const relativeVelocityX = object2.velocityX - object1.velocityX;
        const relativeVelocityY = object2.velocityY - object1.velocityY;
        
        const velocityInNormal = relativeVelocityX * nx + relativeVelocityY * ny;
        
        if (velocityInNormal > 0) return;
        
        const impulse = -(1 + restitution) * velocityInNormal;
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;
        
        object1.velocityX -= impulseX;
        object1.velocityY -= impulseY;
        object2.velocityX += impulseX;
        object2.velocityY += impulseY;
    }
}