// UI management and effects
class UI {
    constructor() {
        this.notifications = [];
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.combatTexts = []; // Damage numbers and combat feedback
        this.combo = 0; // Kill combo counter
        this.comboTimer = 0; // Time since last kill
        this.comboResetTime = 2.0; // Reset combo after 2 seconds
    }
    
    update(deltaTime) {
        this.updateNotifications(deltaTime);
        this.updateParticles(deltaTime);
        this.updateScreenShake(deltaTime);
        this.updateCombatTexts(deltaTime);
        this.updateCombo(deltaTime);
    }
    
    updateCombo(deltaTime) {
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0; // Reset combo
            }
        }
    }
    
    addKillToCombo() {
        this.combo++;
        this.comboTimer = this.comboResetTime; // Reset timer
    }
    
    render(ctx, world = null) {
        this.renderNotifications(ctx);
        this.renderParticles(ctx);
        this.renderCombatTexts(ctx, world);
        this.renderCombo(ctx);
    }
    
    renderCombo(ctx) {
        if (this.combo <= 0) return;
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '24px Arial';
        
        // Simple white combo text at top center
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`COMBO: ${this.combo}x`, ctx.canvas.width / 2, 50);
        
        ctx.restore();
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
        // Detect mobile - prawdziwa detekcja mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         window.matchMedia('(max-width: 1024px)').matches;
        
        // ✅ Prosta ikonka ammo dla wszystkich urządzeń
        const ammoText = `${weaponSystem.getCurrentAmmo()}`;
        const fontSize = isMobile ? 12 : 16;
        const positionY = isMobile ? ctx.canvas.height - 25 : ctx.canvas.height - 30;
        
        ctx.save();
        ctx.fillStyle = '#00ffff';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'right';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = isMobile ? 3 : 5;
        
        // Pokazuj reload status lub ammo
        if (weaponSystem.isCurrentlyReloading()) {
            const reloadPercent = Math.round(weaponSystem.getReloadPercent() * 100);
            ctx.fillStyle = '#ff6600';
            ctx.shadowColor = '#ff6600';
            ctx.fillText(`🔫 RELOAD ${reloadPercent}%`, ctx.canvas.width - 5, positionY);
        } else {
            ctx.fillText(`🔫${ammoText}`, ctx.canvas.width - 5, positionY);
        }
        
        ctx.restore();
        return;
        
        ctx.save();
        
        // Gangster ammo counter background with gradient
        const gradient = ctx.createLinearGradient(uiX, uiY, uiX, uiY + uiHeight);
        gradient.addColorStop(0, 'rgba(26, 26, 26, 0.9)');
        gradient.addColorStop(1, 'rgba(45, 45, 45, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(uiX, uiY, uiWidth, uiHeight);
        
        // Neon border with glow effect
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = isMobile ? 8 : 15;
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = isMobile ? 1 : 2;
        ctx.strokeRect(uiX, uiY, uiWidth, uiHeight);
        ctx.shadowBlur = 0; // Reset shadow
        
        // Inner glow effect
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(uiX + 1, uiY + 1, uiWidth - 2, uiHeight - 2);
        
        // Ammo text with neon effect
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 20px Arial Black';
        ctx.textAlign = 'left';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        
        if (weaponSystem.isCurrentlyReloading()) {
            // Show reload progress with gangster style
            if (isMobile) {
                ctx.fillText('🔫', uiX + 1, uiY + 5);
                ctx.fillText('RLD', uiX + 1, uiY + 10);
            } else {
                ctx.fillText('🔫 RELOADING...', uiX + 12, uiY + 28);
            }
            
            // Reload progress bar with neon effect
            const reloadProgress = weaponSystem.getReloadPercent();
            const barWidth = isMobile ? uiWidth - 2 : 196;
            const barHeight = isMobile ? 1 : 18;
            const barY = isMobile ? uiY + 13 : uiY + 40;
            this.renderGangsterProgressBar(ctx, uiX + (isMobile ? 4 : 12), barY, barWidth, barHeight, reloadProgress, '#ff0066', '#ff6600');
            
            // Reload percentage (skip on very small mobile)
            if (!isMobile) {
                ctx.font = 'bold 14px Arial Black';
                ctx.fillStyle = '#ff0066';
                ctx.shadowColor = '#ff0066';
                ctx.shadowBlur = 6;
                ctx.fillText(Math.round(reloadProgress * 100) + '%', uiX + 12, uiY + 75);
            }
        } else {
            // Show ammo count with gangster style
            const ammoText = `${weaponSystem.getCurrentAmmo()}/${weaponSystem.getMaxAmmo()}`;
            
            if (isMobile) {
                // Compact mobile layout
                ctx.fillText('🔫', uiX + 1, uiY + 5);
                ctx.font = 'bold 4px Arial Black';
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 1;
                ctx.fillText(ammoText, uiX + 1, uiY + 10);
            } else {
                // Desktop layout
                ctx.fillText('🔫 AMMO:', uiX + 12, uiY + 28);
                
                // Large ammo numbers
                ctx.font = 'bold 24px Arial Black';
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.fillText(ammoText, uiX + 12, uiY + 55);
            }
            
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
            
            const barWidth = isMobile ? uiWidth - 2 : 196;
            const barHeight = isMobile ? 1 : 12;
            const barY = isMobile ? uiY + 13 : uiY + 65;
            this.renderGangsterProgressBar(ctx, uiX + (isMobile ? 4 : 12), barY, barWidth, barHeight, ammoProgress, ammoColor, glowColor);
        }
        
        // Gangster controls hint (hide on mobile to save space)
        if (!isMobile) {
            ctx.font = 'bold 11px Arial Black';
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'right';
            ctx.fillText('🔫 X/Z/SPACE: SHOOT | R: RELOAD', ctx.canvas.width - margin, ctx.canvas.height - margin);
        }
        
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
    createCombatText(worldX, worldY, text, type = 'damage', world = null) {
        // Get canvas dimensions for responsive positioning
        const canvas = document.getElementById('gameCanvas');
        const canvasWidth = canvas ? canvas.width : 1100;
        const canvasHeight = canvas ? canvas.height : 600;
        
        // Create combat text in center area of screen (responsive)
        let screenX = canvasWidth * 0.5; // Center horizontally
        let screenY = canvasHeight * 0.4; // Upper-middle area (40% from top)
        
        // Add some randomness so texts don't overlap
        screenX += (Math.random() - 0.5) * (canvasWidth * 0.3); // ±15% horizontal spread
        screenY += (Math.random() - 0.5) * (canvasHeight * 0.2); // ±10% vertical spread
        
        // Keep within screen bounds with margins
        const margin = 50;
        screenX = Math.max(margin, Math.min(screenX, canvasWidth - margin));
        screenY = Math.max(margin, Math.min(screenY, canvasHeight * 0.6)); // Don't go below 60% height
        
        const combatText = {
            x: screenX,
            y: screenY,
            text: text,
            type: type,
            life: 1.5,
            maxLife: 1.5,
            velocityY: -50,
            alpha: 1.0,
            scale: 1.0
        };
        
        this.combatTexts.push(combatText);
    }
    
    updateCombatTexts(deltaTime) {
        for (let i = this.combatTexts.length - 1; i >= 0; i--) {
            const text = this.combatTexts[i];
            
            text.life -= deltaTime;
            text.y += text.velocityY * deltaTime;
            
            // Fade out in last 0.5 seconds
            if (text.life < 0.5) {
                text.alpha = text.life / 0.5;
            }
            
            // Remove expired texts
            if (text.life <= 0) {
                this.combatTexts.splice(i, 1);
            }
        }
    }
    
    renderCombatTexts(ctx, world = null) {
        // ✅ FIX: Zredukowana liczba shadow blur dla lepszej wydajności
        ctx.save();
        
        // ✅ FIX: Batch rendering - grupuj teksty po typie
        const textsByType = {
            'damage': [],
            'headshot': [],
            'kill': [],
            'bonus': []
        };
        
        for (const text of this.combatTexts) {
            const screenX = text.x;
            const screenY = text.y;
            
            // Skip off-screen
            if (screenX < -200 || screenX > ctx.canvas.width + 200 || 
                screenY < -100 || screenY > ctx.canvas.height + 100) {
                continue;
            }
            
            if (!textsByType[text.type]) {
                textsByType[text.type] = [];
            }
            textsByType[text.type].push({ text, screenX, screenY });
        }
        
        // Simple white text rendering
        const isMobile = ctx.canvas.width < 768;
        const baseFontSize = isMobile ? 18 : 16;
        
        for (const type in textsByType) {
            const texts = textsByType[type];
            if (texts.length === 0) continue;
            
            for (const { text, screenX, screenY } of texts) {
                ctx.globalAlpha = text.alpha;
                
                const fontSize = Math.round(baseFontSize * text.scale);
                ctx.font = `${fontSize}px Arial`;
                ctx.textAlign = 'center';
                
                // Simple white text
                ctx.fillStyle = '#ffffff';
                ctx.fillText(text.text, screenX, screenY);
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