// UI management and effects
class UI {
    constructor() {
        this.notifications = [];
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    }
    
    update(deltaTime) {
        this.updateNotifications(deltaTime);
        this.updateParticles(deltaTime);
        this.updateScreenShake(deltaTime);
    }
    
    render(ctx) {
        this.renderNotifications(ctx);
        this.renderParticles(ctx);
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
        const margin = 20;
        const uiX = ctx.canvas.width - 200 - margin;
        const uiY = margin;
        
        ctx.save();
        
        // Ammo counter background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(uiX, uiY, 200, 80);
        
        // Border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(uiX, uiY, 200, 80);
        
        // Ammo text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        
        if (weaponSystem.isCurrentlyReloading()) {
            // Show reload progress
            ctx.fillText('RELOADING...', uiX + 10, uiY + 30);
            
            // Reload progress bar
            const reloadProgress = weaponSystem.getReloadPercent();
            this.renderProgressBar(ctx, uiX + 10, uiY + 40, 180, 15, reloadProgress, '#ff6b6b');
            
            // Reload percentage
            ctx.font = '14px Arial';
            ctx.fillText(Math.round(reloadProgress * 100) + '%', uiX + 10, uiY + 70);
        } else {
            // Show ammo count
            const ammoText = `${weaponSystem.getCurrentAmmo()}/${weaponSystem.getMaxAmmo()}`;
            ctx.fillText('AMMO:', uiX + 10, uiY + 25);
            ctx.fillText(ammoText, uiX + 10, uiY + 50);
            
            // Ammo bar
            const ammoProgress = weaponSystem.getAmmoPercent();
            let ammoColor = '#4ecdc4';
            if (ammoProgress < 0.3) ammoColor = '#ff6b6b';
            else if (ammoProgress < 0.6) ammoColor = '#ffeb3b';
            
            this.renderProgressBar(ctx, uiX + 10, uiY + 55, 180, 10, ammoProgress, ammoColor);
        }
        
        // Controls hint
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.fillText('X/Z/SPACE: Shoot | R: Reload', ctx.canvas.width - margin, ctx.canvas.height - margin);
        
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