// Enemy system for the game
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.health = 1;
        this.maxHealth = 1;
        
        // Load enemy atlas
        this.enemyAtlas = new Image();
        this.enemyAtlas.src = 'assets/charatlas-mob.png';
        this.atlasLoaded = false;
        this.enemyAtlas.onload = () => {
            this.atlasLoaded = true;
            console.log('Enemy atlas loaded');
        };
        
        // Movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 50;
        this.direction = -1; // Moving left by default
        
        // AI behavior
        this.aiState = 'patrol'; // patrol, chase, attack, dead
        this.aiTimer = 0;
        this.detectionRange = 400; // ✅ Zwiększone z 200 na 400 - lepsze wykrywanie
        this.attackRange = 60; // ✅ Zwiększone z 50 na 60
        this.lastAttackTime = 0;
        this.attackCooldown = 1.5; // ✅ Zmniejszone z 2.0 na 1.5 - szybsze ataki
        this.chaseTimeout = 0; // ✅ Nowy timer dla chase
        this.maxChaseTime = 8.0; // ✅ Maksymalny czas goniąc (8 sekund)
        
        // Visual - powiększone bazowe rozmiary
        this.width = 80;  // Powiększone z 40
        this.height = 120; // Powiększone z 60
        this.color = '#ff4444';
        this.animationTimer = 0;
        this.facingDirection = -1;
        
        // Physics
        this.onGround = false;
        this.gravity = 980;
        
        // Setup enemy type
        this.setupEnemyType(type);
        
        // Death animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 1.0;
        
        // Hit flash effect
        this.hitFlash = 0;
    }
    
    setupEnemyType(type) {
        switch(type) {
            case 'basic':
                this.health = 2;     
                this.maxHealth = 2;  
                this.speed = 100;    // ✅ Zwiększone z 80 na 100 - szybsze basic
                this.color = '#ff4444';
                this.width = 65;  
                this.height = 105; 
                this.detectionRange = 350; // ✅ Indywidualne zasięgi
                break;
            case 'fast':
                this.health = 1;     // ✅ Zmniejszone z 2 na 1 - szybkie ale słabe
                this.maxHealth = 1;  
                this.speed = 180;    // ✅ Zwiększone z 140 na 180 - bardzo szybkie
                this.color = '#44ff44';
                this.width = 60;  
                this.height = 100; 
                this.detectionRange = 450; // ✅ Najlepsze wykrywanie
                this.maxChaseTime = 12.0; // ✅ Najdłużej goni
                break;
            case 'tank':
                this.health = 4;     // ✅ Zmniejszone z 5 na 4
                this.maxHealth = 4;  
                this.speed = 70;     // ✅ Zwiększone z 50 na 70 - wolniejsze ale nie za wolne
                this.color = '#4444ff';
                this.width = 80; 
                this.height = 120; 
                this.detectionRange = 300; // ✅ Najkrótszy zasięg
                this.maxChaseTime = 6.0; // ✅ Najkrócej goni
                break;
        }
    }
    
    update(deltaTime, player, world) {
        if (!this.active || this.isDying) {
            if (this.isDying) {
                this.deathTimer -= deltaTime;
                if (this.deathTimer <= 0) {
                    this.active = false;
                }
            }
            return;
        }
        
        // Update AI
        this.updateAI(deltaTime, player);
        
        // Apply physics
        this.applyPhysics(deltaTime, world);
        
        // Update animation
        this.animationTimer += deltaTime;
    }
    
    updateAI(deltaTime, player) {
        this.aiTimer += deltaTime;
        
        const distanceToPlayer = Math.abs(player.x - this.x);
        const playerDirection = player.x > this.x ? 1 : -1;
        
        switch(this.aiState) {
            case 'patrol':
                // Simple patrol movement
                this.velocityX = this.direction * this.speed;
                
                // Change direction occasionally
                if (this.aiTimer > 3.0) {
                    this.direction *= -1;
                    this.facingDirection = this.direction;
                    this.aiTimer = 0;
                }
                
                // ✅ Detect player - bardziej agresywne wykrywanie
                if (distanceToPlayer < this.detectionRange) {
                    this.aiState = 'chase';
                    this.aiTimer = 0;
                    this.chaseTimeout = 0; // Reset chase timer
                    // Enemy detected player
                }
                break;
                
            case 'chase':
                // ✅ Agresywne goniące - znacznie szybsze i wytrwalsze
                this.direction = playerDirection;
                this.facingDirection = this.direction;
                this.velocityX = this.direction * this.speed * 3.0; // ✅ Zwiększone z 2.0 na 3.0 - bardzo szybkie chase
                
                // ✅ Zwiększ chase timeout
                this.chaseTimeout += deltaTime;
                
                // Attack if close enough
                if (distanceToPlayer < this.attackRange) {
                    this.aiState = 'attack';
                    this.aiTimer = 0;
                    this.chaseTimeout = 0; // Reset chase timer
                }
                
                // ✅ Stop chasing only if VERY far or timeout
                if (distanceToPlayer > this.detectionRange * 2.5 || this.chaseTimeout > this.maxChaseTime) {
                    this.aiState = 'patrol';
                    this.aiTimer = 0;
                    this.chaseTimeout = 0;
                    // Enemy stopped chasing
                }
                break;
                
            case 'attack':
                // Stop moving and attack
                this.velocityX = 0;
                
                const currentTime = Date.now() / 1000;
                if (currentTime - this.lastAttackTime > this.attackCooldown) {
                    this.performAttack(player);
                    this.lastAttackTime = currentTime;
                }
                
                // ✅ Go back to chasing after attack - szybciej
                if (this.aiTimer > 0.3) { // ✅ Zmniejszone z 0.5 na 0.3
                    if (distanceToPlayer < this.detectionRange * 2.0) {
                        this.aiState = 'chase'; // ✅ Wróć do chase jeśli gracz dalej w zasięgu
                        this.chaseTimeout = 0;
                    } else {
                        this.aiState = 'patrol'; // ✅ Patrol tylko jeśli gracz bardzo daleko
                    }
                    this.aiTimer = 0;
                }
                break;
        }
    }
    
    performAttack(player) {
        // Simple melee attack - damage player if close enough
        const distance = Math.sqrt(
            Math.pow(player.x - this.x, 2) + 
            Math.pow(player.y - this.y, 2)
        );
        
        if (distance < this.attackRange && player.isVulnerable && player.isVulnerable()) {
            // Enemy attacked player
            // Player damage will be handled by collision system
        }
    }
    
    applyPhysics(deltaTime, world) {
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity * deltaTime;
        }
        
        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Ground collision
        const groundY = world.getGroundY();
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Keep in world bounds
        if (this.x < -this.width) {
            this.x = world.width + this.width;
        } else if (this.x > world.width + this.width) {
            this.x = -this.width;
        }
    }
    
    takeDamage(damage = 1, bulletY = null, ui = null, world = null) {
        if (this.isDying) return false;
        
        this.health -= damage;
        
        // Create simple damage text
        if (ui) {
            const textX = this.x + this.width / 2;
            const textY = this.y;
            ui.createCombatText(textX, textY, damage.toString(), 'damage', world);
        }
        
        if (this.health <= 0) {
            this.die(ui, world);
            return { killed: true, damage: damage };
        }
        
        // Flash red when hit
        this.hitFlash = 0.2;
        return { killed: false, damage: damage };
    }
    
    die(ui = null, world = null) {
        this.isDying = true;
        this.deathTimer = this.deathDuration;
        this.velocityX = 0;
        this.velocityY = -200; // Small bounce up
        
        // Add to combo
        if (ui) {
            ui.addKillToCombo();
        }
        
        // Enemy died
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Death animation
        if (this.isDying) {
            const alpha = this.deathTimer / this.deathDuration;
            ctx.globalAlpha = alpha;
            
            // Rotate while dying
            const rotation = (1 - alpha) * Math.PI;
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(rotation);
            ctx.translate(-this.width/2, -this.height/2);
        } else {
            ctx.translate(this.x, this.y);
        }
        
        // Draw enemy with detailed animation like player
        if (this.atlasLoaded && this.enemyAtlas.complete) {
            this.drawEnemyFromAtlas(ctx, 0, 0);
        } else {
            // Fallback - colored rectangles
            if (this.hitFlash > 0) {
                // Efekt negatywu - odwrócony kolor
                const originalColor = this.color;
                // Konwersja hex na RGB i odwrócenie
                const r = 255 - parseInt(originalColor.slice(1, 3), 16);
                const g = 255 - parseInt(originalColor.slice(3, 5), 16);
                const b = 255 - parseInt(originalColor.slice(5, 7), 16);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.hitFlash -= 0.016;
            } else {
                // Normalny kolor bez modyfikacji
                ctx.fillStyle = this.color;
            }
            
            ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Draw health bar if damaged
        if (this.health < this.maxHealth && !this.isDying) {
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            // Background
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, -10, barWidth, barHeight);
            
            // Health
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, -10, barWidth * healthPercent, barHeight);
        }
        
        // Draw eyes/face
        if (!this.isDying) {
            ctx.fillStyle = '#ffffff';
            const eyeSize = 4;
            const eyeY = 10;
            
            if (this.facingDirection > 0) {
                // Facing right
                ctx.fillRect(this.width - 15, eyeY, eyeSize, eyeSize);
                ctx.fillRect(this.width - 8, eyeY, eyeSize, eyeSize);
            } else {
                // Facing left
                ctx.fillRect(4, eyeY, eyeSize, eyeSize);
                ctx.fillRect(11, eyeY, eyeSize, eyeSize);
            }
        }
        
        ctx.restore();
    }
    
    drawEnemyFromAtlas(ctx, x, y) {
        // Calculate animation offsets like player
        let headOffsetX = 0, headOffsetY = 0, headRotation = 0;
        let bodyOffsetX = 0, bodyOffsetY = 0, bodyRotation = 0;
        let leftLegX = 0, rightLegX = 0, bodyBob = 0;
        
        // Leg rotation variables like player
        let leftThighBendY = 0, leftThighRotation = 0;
        let leftShinBendY = 0, leftShinBendX = 0, leftShinRotation = 0;
        let leftShoeBendY = 0, leftShoeBendX = 0, leftShoeRotation = 0;
        let rightThighBendY = 0, rightThighRotation = 0;
        let rightShinBendY = 0, rightShinBendX = 0, rightShinRotation = 0;
        let rightShoeBendY = 0, rightShoeBendX = 0, rightShoeRotation = 0;
        
        // Animation based on AI state and movement
        if (this.aiState === 'patrol') {
            // patrol basic animation with walking cycle - custom animation from mob tester
            const cycle = Math.sin(this.animationTimer * 8); // Walking cycle
            headOffsetX = 16;
            headOffsetY = -36;
            headRotation = 0;
            bodyOffsetX = 1;
            bodyOffsetY = -5;
            bodyRotation = 0;
            leftLegX = 10 + cycle * 3; // Add walking movement
            rightLegX = 3 - cycle * 3; // Opposite leg movement
            bodyBob = 2 + Math.abs(cycle) * -1; // Slight bob while walking
            // Leg positions
            leftThighBendY = 0;
            leftThighRotation = 0;
            leftShinBendY = 0;
            leftShinBendX = 0;
            leftShinRotation = 0;
            leftShoeBendY = 0;
            leftShoeBendX = 0;
            leftShoeRotation = 0;
            rightThighBendY = 0;
            rightThighRotation = 0;
            rightShinBendY = 0;
            rightShinBendX = 0;
            rightShinRotation = 0;
            rightShoeBendY = -5;
            rightShoeBendX = 2;
            rightShoeRotation = 0;
        } else if (this.aiState === 'chase') {
            // chase basic animation with faster walking cycle - custom animation from mob tester
            const cycle = Math.sin(this.animationTimer * 12); // Faster walking cycle for chase
            headOffsetX = 6;
            headOffsetY = -33;
            headRotation = -0.2;
            bodyOffsetX = 5;
            bodyOffsetY = -3;
            bodyRotation = -0.1;
            leftLegX = 10 + cycle * 4; // More pronounced leg movement
            rightLegX = 2 - cycle * 4; // Opposite leg movement
            bodyBob = -1 + Math.abs(cycle) * -1; // More bob while chasing
            // Leg positions
            leftThighBendY = 1;
            leftThighRotation = -0.3;
            leftShinBendY = 0;
            leftShinBendX = -1;
            leftShinRotation = 0;
            leftShoeBendY = 0;
            leftShoeBendX = 0;
            leftShoeRotation = 0;
            rightThighBendY = 0;
            rightThighRotation = 0;
            rightShinBendY = 0;
            rightShinBendX = 0;
            rightShinRotation = 0;
            rightShoeBendY = 0;
            rightShoeBendX = 0;
            rightShoeRotation = 0;
        } else if (this.aiState === 'attack') {
            // attack animation - custom animation from mob tester
            headOffsetX = 14;
            headOffsetY = -33;
            headRotation = -0.2;
            bodyOffsetX = 2;
            bodyOffsetY = -3;
            bodyRotation = 0.1;
            leftLegX = 6;
            rightLegX = -3;
            bodyBob = 3;
            // Leg positions
            leftThighBendY = 0;
            leftThighRotation = -0.3;
            leftShinBendY = 0;
            leftShinBendX = 0;
            leftShinRotation = -0.1;
            leftShoeBendY = 0;
            leftShoeBendX = 0;
            leftShoeRotation = 0;
            rightThighBendY = 3;
            rightThighRotation = 0;
            rightShinBendY = 1;
            rightShinBendX = 8;
            rightShinRotation = -0.2;
            rightShoeBendY = 0;
            rightShoeBendX = 8;
            rightShoeRotation = -0.6;
        } else {
            // Idle pose
            headOffsetX = -2;
            headOffsetY = -35;
            bodyOffsetX = 0;
            bodyOffsetY = -5;
            leftLegX = 3;
            rightLegX = -1;
            // Idle leg positions
            leftThighBendY = 0;
            leftThighRotation = 0;
            leftShinBendY = 0;
            leftShinBendX = 0;
            leftShinRotation = 0;
            leftShoeBendY = 0;
            leftShoeBendX = 0;
            leftShoeRotation = 0;
            rightThighBendY = 0;
            rightThighRotation = 0;
            rightShinBendY = 0;
            rightShinBendX = 0;
            rightShinRotation = 0;
            rightShoeBendY = 0;
            rightShoeBendX = 0;
            rightShoeRotation = 0;
        }
        
        // Get atlas coordinates based on enemy type - including shoes
        let headCoords, bodyCoords, legCoords;
        switch(this.type) {
            case 'basic':
                headCoords = { x: 20, y: 7, w: 154, h: 126 };
                bodyCoords = { x: 6, y: 137, w: 165, h: 124 };
                legCoords = { 
                    leftThigh: { x: 50, y: 263, w: 40, h: 92 }, 
                    leftShin: { x: 43, y: 355, w: 53, h: 70 },
                    leftShoe: { x: 31, y: 442, w: 62, h: 68 },
                    rightThigh: { x: 93, y: 261, w: 47, h: 97 },
                    rightShin: { x: 100, y: 361, w: 44, h: 64 },
                    rightShoe: { x: 97, y: 446, w: 83, h: 57 }
                };
                break;
            case 'fast':
                // Use same atlas but different tint/size
                headCoords = { x: 20, y: 7, w: 154, h: 126 };
                bodyCoords = { x: 6, y: 137, w: 165, h: 124 };
                legCoords = { 
                    leftThigh: { x: 50, y: 263, w: 40, h: 92 }, 
                    leftShin: { x: 43, y: 355, w: 53, h: 70 },
                    leftShoe: { x: 31, y: 442, w: 62, h: 68 },
                    rightThigh: { x: 93, y: 261, w: 47, h: 97 },
                    rightShin: { x: 100, y: 361, w: 44, h: 64 },
                    rightShoe: { x: 97, y: 446, w: 83, h: 57 }
                };
                break;
            case 'tank':
                // Use same atlas but bigger
                headCoords = { x: 20, y: 7, w: 154, h: 126 };
                bodyCoords = { x: 6, y: 137, w: 165, h: 124 };
                legCoords = { 
                    leftThigh: { x: 50, y: 263, w: 40, h: 92 }, 
                    leftShin: { x: 43, y: 355, w: 53, h: 70 },
                    leftShoe: { x: 31, y: 442, w: 62, h: 68 },
                    rightThigh: { x: 93, y: 261, w: 47, h: 97 },
                    rightShin: { x: 100, y: 361, w: 44, h: 64 },
                    rightShoe: { x: 97, y: 446, w: 83, h: 57 }
                };
                break;
            default:
                headCoords = { x: 20, y: 7, w: 154, h: 126 };
                bodyCoords = { x: 6, y: 137, w: 165, h: 124 };
                legCoords = { 
                    leftThigh: { x: 50, y: 263, w: 40, h: 92 }, 
                    leftShin: { x: 43, y: 355, w: 53, h: 70 },
                    leftShoe: { x: 31, y: 442, w: 62, h: 68 },
                    rightThigh: { x: 93, y: 261, w: 47, h: 97 },
                    rightShin: { x: 100, y: 361, w: 44, h: 64 },
                    rightShoe: { x: 97, y: 446, w: 83, h: 57 }
                };
        }
        
        // Apply hit flash effect and enemy type color tint
        let useAlternativeFlash = false;
        
        // Hit flash effect - negatyw tylko podczas trafienia
        if (this.hitFlash > 0) {
            // Try CSS filter first, fallback to alternative method on mobile
            if (typeof ctx.filter !== 'undefined') {
                // Efekt negatywu - odwrócone kolory
                ctx.filter = 'invert(1) brightness(1.5)';
            } else {
                useAlternativeFlash = true;
            }
            this.hitFlash -= 0.016;
        } else {
            // Normalnie bez żadnych filtrów - naturalne kolory
            if (typeof ctx.filter !== 'undefined') {
                ctx.filter = 'none';
            }
        }
        
        // Alternative flash effect for mobile - symulacja negatywu
        if (useAlternativeFlash) {
            ctx.save();
            ctx.globalCompositeOperation = 'difference';
            ctx.globalAlpha = 0.8;
        }
        
        // Flip if facing left
        if (this.facingDirection < 0) {
            ctx.save();
            ctx.scale(-1, 1);
            x = -x - this.width;
        }
        
        // Draw head - normalne proporcje
        const finalHeadOffsetY = y + headOffsetY;
        const headScale = this.type === 'tank' ? 1.2 : (this.type === 'fast' ? 0.9 : 1.0); // Normalne rozmiary
        
        if (headRotation !== 0) {
            ctx.save();
            const headX = x - this.width * 0.2 + headOffsetX;
            const headY = finalHeadOffsetY;
            const headW = this.width * 1.4 * headScale; // Przywrócone normalne
            const headH = this.height * 0.35 * headScale; // Przywrócone normalne
            ctx.translate(headX + headW/2, headY + headH/2);
            ctx.rotate(headRotation);
            ctx.drawImage(
                this.enemyAtlas,
                headCoords.x, headCoords.y, headCoords.w, headCoords.h,
                -headW/2, -headH/2, headW, headH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                headCoords.x, headCoords.y, headCoords.w, headCoords.h,
                x - this.width * 0.2 + headOffsetX, finalHeadOffsetY,
                this.width * 1.4 * headScale, this.height * 0.35 * headScale // Przywrócone normalne
            );
        }
        
        // Draw body - normalne proporcje
        const finalBodyOffsetY = y + bodyOffsetY + bodyBob;
        const bodyScale = this.type === 'tank' ? 1.3 : (this.type === 'fast' ? 0.8 : 1.0); // Normalne rozmiary
        
        if (bodyRotation !== 0) {
            ctx.save();
            const bodyX = x + this.width * 0.1 + bodyOffsetX;
            const bodyY = finalBodyOffsetY;
            const bodyW = this.width * 0.8 * bodyScale;
            const bodyH = this.height * 0.4 * bodyScale;
            ctx.translate(bodyX + bodyW/2, bodyY + bodyH/2);
            ctx.rotate(bodyRotation);
            ctx.drawImage(
                this.enemyAtlas,
                bodyCoords.x, bodyCoords.y, bodyCoords.w, bodyCoords.h,
                -bodyW/2, -bodyH/2, bodyW, bodyH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                bodyCoords.x, bodyCoords.y, bodyCoords.w, bodyCoords.h,
                x + this.width * 0.1 + bodyOffsetX, finalBodyOffsetY,
                this.width * 1.0 * bodyScale, this.height * 0.5 * bodyScale // Większy tors
            );
        }
        
        // Draw legs with full rotation support like player
        const legStartY = y + this.height * 0.25;
        const legWidth = this.width * 0.35;
        const legHeight = this.height * 0.8;
        const legScale = this.type === 'tank' ? 1.2 : (this.type === 'fast' ? 0.9 : 1.0);
        
        // LEFT THIGH with individual rotation
        if (leftThighRotation !== 0) {
            ctx.save();
            const thighX = x + this.width * 0.15 + leftLegX;
            const thighY = legStartY + leftThighBendY;
            const thighW = legWidth * legScale;
            const thighH = legHeight * 0.3 * legScale;
            ctx.translate(thighX + thighW / 2, thighY + thighH / 2);
            ctx.rotate(leftThighRotation);
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.leftThigh.x, legCoords.leftThigh.y, legCoords.leftThigh.w, legCoords.leftThigh.h,
                -thighW / 2, -thighH / 2, thighW, thighH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.leftThigh.x, legCoords.leftThigh.y, legCoords.leftThigh.w, legCoords.leftThigh.h,
                x + this.width * 0.15 + leftLegX, legStartY + leftThighBendY,
                legWidth * legScale, legHeight * 0.3 * legScale
            );
        }
        
        // LEFT SHIN with individual rotation
        if (leftShinRotation !== 0) {
            ctx.save();
            const shinX = x + this.width * 0.15 + leftLegX + leftShinBendX;
            const shinY = legStartY + legHeight * 0.3 + leftShinBendY;
            const shinW = legWidth * legScale;
            const shinH = legHeight * 0.3 * legScale;
            ctx.translate(shinX + shinW / 2, shinY + shinH / 2);
            ctx.rotate(leftShinRotation);
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.leftShin.x, legCoords.leftShin.y, legCoords.leftShin.w, legCoords.leftShin.h,
                -shinW / 2, -shinH / 2, shinW, shinH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.leftShin.x, legCoords.leftShin.y, legCoords.leftShin.w, legCoords.leftShin.h,
                x + this.width * 0.15 + leftLegX + leftShinBendX, legStartY + legHeight * 0.3 + leftShinBendY,
                legWidth * legScale, legHeight * 0.3 * legScale
            );
        }
        
        // LEFT SHOE with individual rotation
        if (leftShoeRotation !== 0) {
            ctx.save();
            const shoeX = x + this.width * 0.1 + leftLegX + leftShoeBendX;
            const shoeY = legStartY + legHeight * 0.5 + leftShoeBendY;
            ctx.translate(shoeX + legWidth * 0.6 * legScale, shoeY + legHeight * 0.1 * legScale);
            ctx.rotate(leftShoeRotation);
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.leftShoe.x, legCoords.leftShoe.y, legCoords.leftShoe.w, legCoords.leftShoe.h,
                -legWidth * 0.6 * legScale, -legHeight * 0.1 * legScale,
                legWidth * 1.2 * legScale, legHeight * 0.2 * legScale
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.leftShoe.x, legCoords.leftShoe.y, legCoords.leftShoe.w, legCoords.leftShoe.h,
                x + this.width * 0.1 + leftLegX + leftShoeBendX, legStartY + legHeight * 0.5 + leftShoeBendY,
                legWidth * 1.2 * legScale, legHeight * 0.2 * legScale
            );
        }
        
        // RIGHT THIGH with individual rotation
        if (rightThighRotation !== 0) {
            ctx.save();
            const thighX = x + this.width * 0.5 + rightLegX;
            const thighY = legStartY + rightThighBendY;
            const thighW = legWidth * legScale;
            const thighH = legHeight * 0.3 * legScale;
            ctx.translate(thighX + thighW / 2, thighY + thighH / 2);
            ctx.rotate(rightThighRotation);
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.rightThigh.x, legCoords.rightThigh.y, legCoords.rightThigh.w, legCoords.rightThigh.h,
                -thighW / 2, -thighH / 2, thighW, thighH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.rightThigh.x, legCoords.rightThigh.y, legCoords.rightThigh.w, legCoords.rightThigh.h,
                x + this.width * 0.5 + rightLegX, legStartY + rightThighBendY,
                legWidth * legScale, legHeight * 0.3 * legScale
            );
        }
        
        // RIGHT SHIN with individual rotation
        if (rightShinRotation !== 0) {
            ctx.save();
            const shinX = x + this.width * 0.5 + rightLegX + rightShinBendX;
            const shinY = legStartY + legHeight * 0.3 + rightShinBendY;
            const shinW = legWidth * legScale;
            const shinH = legHeight * 0.3 * legScale;
            ctx.translate(shinX + shinW / 2, shinY + shinH / 2);
            ctx.rotate(rightShinRotation);
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.rightShin.x, legCoords.rightShin.y, legCoords.rightShin.w, legCoords.rightShin.h,
                -shinW / 2, -shinH / 2, shinW, shinH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.rightShin.x, legCoords.rightShin.y, legCoords.rightShin.w, legCoords.rightShin.h,
                x + this.width * 0.5 + rightLegX + rightShinBendX, legStartY + legHeight * 0.3 + rightShinBendY,
                legWidth * legScale, legHeight * 0.3 * legScale
            );
        }
        
        // RIGHT SHOE with individual rotation
        if (rightShoeRotation !== 0) {
            ctx.save();
            const shoeX = x + this.width * 0.45 + rightLegX + rightShoeBendX;
            const shoeY = legStartY + legHeight * 0.5 + rightShoeBendY;
            ctx.translate(shoeX + legWidth * 0.6 * legScale, shoeY + legHeight * 0.1 * legScale);
            ctx.rotate(rightShoeRotation);
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.rightShoe.x, legCoords.rightShoe.y, legCoords.rightShoe.w, legCoords.rightShoe.h,
                -legWidth * 0.6 * legScale, -legHeight * 0.1 * legScale,
                legWidth * 1.2 * legScale, legHeight * 0.2 * legScale
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.enemyAtlas,
                legCoords.rightShoe.x, legCoords.rightShoe.y, legCoords.rightShoe.w, legCoords.rightShoe.h,
                x + this.width * 0.45 + rightLegX + rightShoeBendX, legStartY + legHeight * 0.5 + rightShoeBendY,
                legWidth * 1.2 * legScale, legHeight * 0.2 * legScale
            );
        }
        
        // Restore flip
        if (this.facingDirection < 0) {
            ctx.restore();
        }
        
        // Reset filter and alternative flash
        if (typeof ctx.filter !== 'undefined') {
            ctx.filter = 'none';
        }
        if (useAlternativeFlash) {
            ctx.restore();
        }
    }
    
    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    checkCollision(target) {
        const enemyRect = this.getRect();
        const targetRect = target.getRect();
        
        return (enemyRect.x < targetRect.x + targetRect.width &&
                enemyRect.x + enemyRect.width > targetRect.x &&
                enemyRect.y < targetRect.y + targetRect.height &&
                enemyRect.y + enemyRect.height > targetRect.y);
    }
}

// Enemy manager class
class EnemyManager {
    constructor(worldWidth, worldHeight) {
        this.enemies = [];
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        // Spawning parameters
        this.spawnDistance = 800; // Distance ahead to spawn enemies
        this.minEnemySpacing = 200;
        this.maxEnemySpacing = 400;
        this.enemySpawnChance = 0.25; // ✅ 25% chance per check (1 wróg co ~4s)
        this.spawnCooldown = 0;
        this.spawnCooldownTime = 0.8; // ✅ 0.8 second between spawn checks
        
        // Enemy types and spawn weights
        this.enemyTypes = [
            { type: 'basic', weight: 60 },
            { type: 'fast', weight: 25 },
            { type: 'tank', weight: 15 }
        ];
        
        this.lastEnemyX = 0;
    }
    
    update(deltaTime, player, world, scrollDirection, screenWidth) {
        // Update existing enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, player, world);
            // ✅ NIE przesuwaj wrogów - oni mają swoją AI
            // World scrolling jest już obsługiwany przez pozycję gracza
        });
        
        // Remove inactive enemies AND enemies that went off screen LEFT
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.active) return false;
            if (enemy.x < -enemy.width - 100) return false; // ✅ Usuń gdy 100px za lewą krawędzią
            return true;
        });
        
        // Update spawn cooldown
        if (this.spawnCooldown > 0) {
            this.spawnCooldown -= deltaTime;
        }
        
        // ✅ Spawnuj w kierunku ruchu gracza
        if (this.spawnCooldown <= 0) {
            this.checkSpawnEnemies(screenWidth, scrollDirection);
            this.spawnCooldown = this.spawnCooldownTime;
        }
    }
    
    checkSpawnEnemies(screenWidth, scrollDirection = 0) {
        const activeEnemies = this.enemies.filter(e => e.active && !e.isDying);
        
        // ✅ Limit maksymalnej liczby wrogów do 6
        if (activeEnemies.length >= 6) {
            // Max enemies reached, skipping spawn
            return;
        }
        
        const enemyXs = activeEnemies.map(e => e.x);
        
        // ✅ TYLKO spawn z prawej strony (infinite runner) - Priority 2 fix
        if (scrollDirection >= -0.1) { // Allow when moving right or standing
            const rightmostEnemy = enemyXs.length > 0 ? 
                Math.max(...enemyXs) : 
                screenWidth + 200;
            
            if (rightmostEnemy < screenWidth + this.spawnDistance) {
                this.trySpawnEnemy(rightmostEnemy, screenWidth, 'right');
            }
        }
        // NIE SPAWN z lewej - to infinite runner!
    }
    
    trySpawnEnemy(referenceX, screenWidth, side = 'right') {
        // Random chance to spawn
        if (Math.random() > this.enemySpawnChance) return;
        
        // Calculate spawn position
        const spacing = this.minEnemySpacing + Math.random() * (this.maxEnemySpacing - this.minEnemySpacing);
        
        let newX;
        if (side === 'right') {
            // ✅ Spawn za prawą krawędzią
            newX = Math.max(
                referenceX + spacing,
                screenWidth + 100 // Minimum 100px za ekranem
            );
        } else {
            // ✅ Spawn za lewą krawędzią
            newX = Math.min(
                referenceX - spacing,
                -100 // Minimum 100px za lewą krawędzią
            );
        }
        
        // Choose random enemy type
        const enemyType = this.getRandomEnemyType();
        
        // Spawn on ground
        const groundY = this.worldHeight - 20; // TODO: Użyj world.getGroundY() gdy będzie dostępne
        const enemy = new Enemy(newX, groundY - 60, enemyType); // 60 is approximate enemy height
        
        this.enemies.push(enemy);
        // Enemy spawned
    }
    
    getRandomEnemyType() {
        const totalWeight = this.enemyTypes.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const enemyType of this.enemyTypes) {
            random -= enemyType.weight;
            if (random <= 0) {
                return enemyType.type;
            }
        }
        
        return 'basic'; // Fallback
    }
    
    render(ctx) {
        this.enemies.forEach(enemy => {
            // Only render enemies that are on screen or close to it
            if (enemy.x > -enemy.width && enemy.x < ctx.canvas.width + enemy.width) {
                enemy.render(ctx);
            }
        });
    }
    
    checkCollisions(player) {
        const collisions = [];
        
        this.enemies.forEach(enemy => {
            if (enemy.active && !enemy.isDying && enemy.checkCollision(player)) {
                collisions.push(enemy);
            }
        });
        
        return collisions;
    }
    
    checkBulletCollisions(bullets, ui = null, world = null) {
        const hits = [];
        
        bullets.forEach(bullet => {
            if (!bullet.active) return;
            
            this.enemies.forEach(enemy => {
                if (enemy.active && !enemy.isDying && bullet.checkCollision(enemy)) {
                    bullet.active = false;
                    const result = enemy.takeDamage(bullet.damage, bullet.y, ui, world);
                    hits.push({ enemy, ...result });
                }
            });
        });
        
        return hits;
    }
    
    getActiveEnemies() {
        return this.enemies.filter(enemy => enemy.active);
    }
    
    // ✅ Difficulty scaling - zwiększa trudność z czasem
    updateDifficulty(difficulty, worldScrollSpeed = 250) {
        // Szybsze spawny wrogów
        this.spawnCooldownTime = Math.max(0.3, 0.8 / difficulty);
        
        // Więcej wrogów (ale nie więcej niż 50%)
        this.enemySpawnChance = Math.min(0.5, 0.25 * difficulty);
        
        // ✅ Scale enemy speeds with world scroll speed
        const speedMultiplier = worldScrollSpeed / 250; // Base world speed is 250
        
        this.enemies.forEach(enemy => {
            if (enemy.active && !enemy.isDying) {
                // Update base speed for each enemy type
                switch(enemy.type) {
                    case 'basic':
                        enemy.speed = 100 * speedMultiplier;
                        break;
                    case 'fast':
                        enemy.speed = 180 * speedMultiplier;
                        break;
                    case 'tank':
                        enemy.speed = 70 * speedMultiplier;
                        break;
                }
            }
        });
        
        // Difficulty and spawn rate updated
    }
    
    clear() {
        this.enemies = [];
        this.lastEnemyX = 0;
    }
}