// UI management and effects
class UI {
    constructor() {
        this.notifications = [];
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.combatTexts = []; // Damage numbers and combat feedback
    }
    
    update(deltaTime) {
        this.updateNotifications(deltaTime);
        this.updateParticles(deltaTime);
        this.updateScreenShake(deltaTime);
        this.updateCombatTexts(deltaTime);
    }
    
    render(ctx) {
        this.renderNotifications(ctx);
        this.renderParticles(ctx);
        this.renderCombatTexts(ctx);
    }
    
    // Notification system
    showNotification(text, duration = 2.0, color = 'white') {
        this.notifications.push({
            text: text,
            duration: duration,
            maxDuration: duration,
            color: color,
            y: 100,
            alpha: 1.0
        });
    }
    
    updateNotifications(deltaTime) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            notification.duration -= deltaTime;
            
            // Fade out in last 0.5 seconds
            if (notification.duration < 0.5) {
                notification.alpha = notification.duration / 0.5;
            }
            
            // Move up
            notification.y -= 20 * deltaTime;
            
            // Remove expired notifications
            if (notification.duration <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }
    
    renderNotifications(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px Arial';
        
        for (const notification of this.notifications) {
            ctx.globalAlpha = notification.alpha;
            
            // Text shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(notification.text, ctx.canvas.width / 2 + 2, notification.y + 2);
            
            // Main text
            ctx.fillStyle = notification.color;
            ctx.fillText(notification.text, ctx.canvas.width / 2, notification.y);
        }
        
        ctx.restore();
    }
    
    // Particle system
    createParticles(x, y, count = 10, type = 'coin') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 50 + Math.random() * 100;
            
            let particle = {
                x: x,
                y: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed - 50,
                life: 1.0,
                maxLife: 1.0,
                size: 3 + Math.random() * 4,
                color: this.getParticleColor(type),
                gravity: 200
            };
            
            this.particles.push(particle);
        }
    }
    
    getParticleColor(type) {
        switch (type) {
            case 'coin':
                return '#FFD700';
            case 'dash':
                return '#ff6b6b';
            case 'jump':
                return '#4ecdc4';
            default:
                return '#ffffff';
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.velocityX * deltaTime;
            particle.y += particle.velocityY * deltaTime;
            
            // Apply gravity
            particle.velocityY += particle.gravity * deltaTime;
            
            // Update life
            particle.life -= deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    renderParticles(ctx) {
        ctx.save();
        
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            ctx.globalAlpha = alpha;
            
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Screen shake effect
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            
            const intensity = this.screenShake.intensity * (this.screenShake.duration / 0.5);
            this.screenShake.x = (Math.random() - 0.5) * intensity;
            this.screenShake.y = (Math.random() - 0.5) * intensity;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    }
    
    getScreenShake() {
        return this.screenShake;
    }
    
    // Progress bars
    renderProgressBar(ctx, x, y, width, height, progress, color = '#4ecdc4', backgroundColor = 'rgba(0,0,0,0.3)') {
        // Background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, y, width, height);
        
        // Progress
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width * progress, height);
        
        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    // Text effects
    renderTextWithOutline(ctx, text, x, y, fillColor = 'white', outlineColor = 'black', outlineWidth = 2) {
        ctx.lineWidth = outlineWidth;
        ctx.strokeStyle = outlineColor;
        ctx.strokeText(text, x, y);
        
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);
    }
    
    // Animated text
    renderBouncingText(ctx, text, x, y, time, amplitude = 5) {
        const bounce = Math.sin(time * 3) * amplitude;
        this.renderTextWithOutline(ctx, text, x, y + bounce);
    }
    
    // Score popup
    showScorePopup(x, y, score) {
        this.notifications.push({
            text: '+' + score,
            duration: 1.0,
            maxDuration: 1.0,
            color: '#FFD700',
            x: x,
            y: y,
            alpha: 1.0,
            isScorePopup: true
        });
    }
    
    // Combo system
    showCombo(combo) {
        const comboText = combo > 1 ? `${combo}x COMBO!` : '';
        if (comboText) {
            this.showNotification(comboText, 1.5, '#ff6b6b');
        }
    }
    
    // Achievement notifications
    showAchievement(title, description) {
        this.showNotification(`🏆 ${title}`, 3.0, '#FFD700');
        setTimeout(() => {
            this.showNotification(description, 2.0, '#ffffff');
        }, 500);
    }
    
    // Loading screen
    renderLoadingScreen(ctx, progress) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        // Loading text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', centerX, centerY - 50);
        
        // Progress bar
        this.renderProgressBar(ctx, centerX - 150, centerY, 300, 20, progress);
        
        // Percentage
        ctx.font = '18px Arial';
        ctx.fillText(Math.round(progress * 100) + '%', centerX, centerY + 50);
    }
    
    // Game over screen effects
    renderGameOverEffect(ctx, time) {
        // Fade in dark overlay
        const alpha = Math.min(time / 2.0, 0.8);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        if (time > 1.0) {
            const centerX = ctx.canvas.width / 2;
            const centerY = ctx.canvas.height / 2;
            
            // Game Over text with animation
            const scale = Math.min((time - 1.0) / 0.5, 1.0);
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            this.renderTextWithOutline(ctx, 'GAME OVER', 0, 0, '#ff6b6b', 'black', 4);
            
            ctx.restore();
        }
    }
    
    // Weapon UI
    renderWeaponUI(ctx, weaponSystem) {
        // Detect mobile and adjust sizes
        const isMobile = ctx.canvas.width < 768;
        const margin = isMobile ? 8 : 15;
        const uiWidth = isMobile ? 150 : 220;
        const uiHeight = isMobile ? 60 : 90;
        const uiX = ctx.canvas.width - uiWidth - margin;
        const uiY = margin + (isMobile ? 50 : 100);
        
        ctx.save();
        
        // Gangster ammo counter background with gradient
        const gradient = ctx.createLinearGradient(uiX, uiY, uiX, uiY + uiHeight);
        gradient.addColorStop(0, 'rgba(26, 26, 26, 0.9)');
        gradient.addColorStop(1, 'rgba(45, 45, 45, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(uiX, uiY, uiWidth, uiHeight);
        
        // Neon border with glow effect
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(uiX, uiY, 220, 90);
        ctx.shadowBlur = 0; // Reset shadow
        
        // Inner glow effect
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(uiX + 2, uiY + 2, 216, 86);
        
        // Ammo text with neon effect
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 20px Arial Black';
        ctx.textAlign = 'left';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        
        if (weaponSystem.isCurrentlyReloading()) {
            // Show reload progress with gangster style
            ctx.fillText('🔫 RELOADING...', uiX + 12, uiY + 28);
            
            // Reload progress bar with neon effect
            const reloadProgress = weaponSystem.getReloadPercent();
            this.renderGangsterProgressBar(ctx, uiX + 12, uiY + 40, 196, 18, reloadProgress, '#ff0066', '#ff6600');
            
            // Reload percentage
            ctx.font = 'bold 14px Arial Black';
            ctx.fillStyle = '#ff0066';
            ctx.shadowColor = '#ff0066';
            ctx.shadowBlur = 6;
            ctx.fillText(Math.round(reloadProgress * 100) + '%', uiX + 12, uiY + 75);
        } else {
            // Show ammo count with gangster style
            const ammoText = `${weaponSystem.getCurrentAmmo()}/${weaponSystem.getMaxAmmo()}`;
            ctx.fillText('🔫 AMMO:', uiX + 12, uiY + 28);
            
            // Large ammo numbers
            ctx.font = 'bold 24px Arial Black';
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.fillText(ammoText, uiX + 12, uiY + 55);
            
            // Ammo bar with gangster colors
            const ammoProgress = weaponSystem.getAmmoPercent();
            let ammoColor = '#00ffff'; // Cyan for full
            let glowColor = '#00ffff';
            if (ammoProgress < 0.3) {
                ammoColor = '#ff0066'; // Hot pink for low
                glowColor = '#ff0066';
            } else if (ammoProgress < 0.6) {
                ammoColor = '#ff6600'; // Orange for medium
                glowColor = '#ff6600';
            }
            
            this.renderGangsterProgressBar(ctx, uiX + 12, uiY + 65, 196, 12, ammoProgress, ammoColor, glowColor);
        }
        
        // Gangster controls hint
        ctx.font = 'bold 11px Arial Black';
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'right';
        ctx.fillText('🔫 X/Z/SPACE: SHOOT | R: RELOAD', ctx.canvas.width - margin, ctx.canvas.height - margin);
        
        ctx.restore();
    }
    
    // Gangster-style progress bar with neon effects
    renderGangsterProgressBar(ctx, x, y, width, height, progress, fillColor, glowColor) {
        ctx.save();
        
        // Background (empty bar)
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, width, height);
        
        // Border with glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Fill (progress)
        if (progress > 0) {
            const fillWidth = width * progress;
            
            // Inner glow for fill
            ctx.shadowColor = fillColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = fillColor;
            ctx.fillRect(x + 1, y + 1, fillWidth - 2, height - 2);
            
            // Bright edge effect
            const gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, fillWidth - 2, height - 2);
        }
        
        ctx.restore();
    }
    
    // Combat text system
    createCombatText(x, y, text, type = 'damage', worldToScreen = null) {
        // Convert world coordinates to screen coordinates if converter provided
        let screenX = x;
        let screenY = y;
        
        if (worldToScreen && typeof worldToScreen === 'function') {
            const screenPos = worldToScreen(x, y);
            screenX = screenPos.x;
            screenY = screenPos.y;
        }
        
        const combatText = {
            x: screenX,
            y: screenY,
            text: text,
            type: type,
            life: 3.5,  // Zwiększone z 2.0 na 3.5 sekundy
            maxLife: 3.5,
            velocityY: -80,  // Szybszy start w górę
            alpha: 1.0,
            scale: 1.0
        };
        
        // Different colors and effects for different types
        switch (type) {
            case 'damage':
                combatText.color = '#ff0066';
                combatText.glowColor = '#ff0066';
                combatText.life = 2.5;
                combatText.maxLife = 2.5;
                break;
            case 'headshot':
                combatText.color = '#ff6600';
                combatText.glowColor = '#ff6600';
                combatText.scale = 1.4; // Zmniejszone z 1.8
                combatText.text = 'HEADSHOT! ' + text;
                combatText.life = 4.0; // Dłużej widoczne
                combatText.maxLife = 4.0;
                combatText.velocityY = -100; // Szybszy ruch w górę
                break;
            case 'kill':
                combatText.color = '#00ffff';
                combatText.glowColor = '#00ffff';
                combatText.text = 'ELIMINATED! +' + text;
                combatText.life = 3.5;
                combatText.maxLife = 3.5;
                combatText.velocityY = -90;
                break;
            case 'bonus':
                combatText.color = '#FFD700';
                combatText.glowColor = '#FFD700';
                combatText.life = 3.0;
                combatText.maxLife = 3.0;
                break;
        }
        
        this.combatTexts.push(combatText);
    }
    
    updateCombatTexts(deltaTime) {
        for (let i = this.combatTexts.length - 1; i >= 0; i--) {
            const text = this.combatTexts[i];
            
            // Update position with smooth deceleration
            text.y += text.velocityY * deltaTime;
            text.velocityY += 15 * deltaTime; // Zmniejszona grawitacja dla płynniejszego ruchu
            
            // Update life
            text.life -= deltaTime;
            
            // Smooth fade out over last 1.5 seconds
            const fadeStartTime = 1.5;
            if (text.life < fadeStartTime) {
                text.alpha = text.life / fadeStartTime;
            }
            
            // Scale animation for headshots - pulsing effect
            if (text.type === 'headshot' && text.life > text.maxLife - 0.5) {
                const t = (text.maxLife - text.life) / 0.5;
                text.scale = 1.4 + Math.sin(t * Math.PI * 6) * 0.2; // Zmniejszone z 1.5 + 0.3
            }
            
            // Scale animation for kills - growing effect
            if (text.type === 'kill' && text.life > text.maxLife - 0.8) {
                const t = (text.maxLife - text.life) / 0.8;
                text.scale = 1.0 + t * 0.3; // Zmniejszone z 0.5 na 0.3
            }
            
            // Floating effect - slight horizontal drift
            const age = text.maxLife - text.life;
            text.x += Math.sin(age * 2) * 10 * deltaTime;
            
            // Remove expired texts
            if (text.life <= 0) {
                this.combatTexts.splice(i, 1);
            }
        }
    }
    
    renderCombatTexts(ctx) {
        ctx.save();
        
        for (const text of this.combatTexts) {
            ctx.globalAlpha = text.alpha;
            
            // Set up text style - rozmiar dostosowany do desktop
            const fontSize = Math.round(11 * text.scale);
            ctx.font = `bold ${fontSize}px Arial Black`;
            ctx.textAlign = 'center';
            
            // Multiple glow layers for better visibility
            ctx.shadowColor = text.glowColor;
            ctx.shadowBlur = 20;
            
            // Thick black outline for contrast
            ctx.strokeStyle = 'black';
            ctx.lineWidth = Math.max(4, fontSize * 0.2);
            ctx.strokeText(text.text, text.x, text.y);
            
            // Inner white outline for extra contrast
            ctx.strokeStyle = 'white';
            ctx.lineWidth = Math.max(2, fontSize * 0.1);
            ctx.strokeText(text.text, text.x, text.y);
            
            // Main text with enhanced glow
            ctx.fillStyle = text.color;
            ctx.shadowBlur = 25;
            ctx.fillText(text.text, text.x, text.y);
            
            // Extra glow layer for special types
            if (text.type === 'headshot' || text.type === 'kill') {
                ctx.shadowBlur = 35;
                ctx.globalAlpha = text.alpha * 0.5;
                ctx.fillText(text.text, text.x, text.y);
            }
        }
        
        ctx.restore();
    }

    // Crosshair
    renderCrosshair(ctx, player) {
        const centerX = player.x + player.width / 2 + (50 * player.facingDirection);
        const centerY = player.y + player.height / 2 - 10;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
        // Cross lines
        const size = 10;
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY);
        ctx.lineTo(centerX + size, centerY);
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX, centerY + size);
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}