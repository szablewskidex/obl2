// Main game initialization and loop
class BungvoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        
        // Game objects
        this.player = null;
        this.world = null;
        this.ui = null;
        this.physics = null;
        
        // Game stats
        this.score = 0;
        this.lives = 3;
        this.coinsCollected = 0;
        this.totalCoins = 0;
        this.highScore = this.loadHighScore();
        this.levelCompleted = false; // Flag to prevent multiple level complete triggers
        
        // Input handling
        this.keys = {};
        this.gamepadManager = new GamepadManager();
        this.fullscreenManager = new FullscreenManager();
        this.setupInput();
        
        // Game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        // Initialize UI
        this.updateUI();
    }
    
    init() {
        // Initialize game objects
        this.physics = new Physics();
        this.world = new World(this.canvas.width, this.canvas.height);
        this.player = new Player(100, 400, this.physics);
        this.ui = new UI();
        
        // Count total coins
        this.totalCoins = this.world.coins.length;
        this.coinsCollected = 0;
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.levelCompleted = false; // Reset level completion flag
        this.updateUI();
        
        console.log('Game initialized');
    }
    
    setupInput() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle special keys
            if (e.code === 'Escape') {
                this.togglePause();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update gamepad
        this.gamepadManager.update();
        
        // Combine keyboard and gamepad inputs
        const combinedKeys = { ...this.keys };
        const gamepadKeys = this.gamepadManager.getVirtualKeys();
        Object.assign(combinedKeys, gamepadKeys);
        
        // Update player and get walking state
        const playerState = this.player.update(deltaTime, combinedKeys, this.world);
        
        // Update independent clouds
        this.updateIndependentClouds(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update world (scrolling with auto-centering)
        const scrollDistance = this.world.update(deltaTime, playerState, this.player.x);
        
        // Adjust player position to compensate for world scrolling
        // This keeps player centered while world scrolls
        if (scrollDistance !== 0) {
            this.player.x -= scrollDistance;
        }
        
        // Update dash power bar every frame
        this.updateDashBar();
        
        // Check if player fell off the world
        if (this.player.y > this.canvas.height + 100) {
            this.playerDied();
        }
    }
    
    checkCollisions() {
        // Check item collection on sidewalk
        for (let i = this.world.coins.length - 1; i >= 0; i--) {
            const coin = this.world.coins[i];
            if (this.physics.checkCollision(this.player, coin)) {
                this.collectCoin(coin, i);
            }
        }
        
        // No platform or wall collisions needed - just walking on sidewalk
    }
    
    collectCoin(coin, index) {
        this.world.coins.splice(index, 1);
        this.coinsCollected++;
        this.score += 10;
        
        // Add dash power
        this.player.addDashPower(this.player.dashPowerPerCoin);
        
        this.updateUI();
        
        // Play sound effect (if implemented)
        console.log('Coin collected!');
    }
    
    playerDied() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn player
            this.player.respawn(100, 400);
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // Show game over menu
        setTimeout(() => {
            this.showMenu();
        }, 1000);
        
        console.log('Game Over!');
    }
    
    render() {
        // Clear canvas with dark background like original
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state before any rendering
        this.ctx.save();
        
        // Render world (without clouds) - this may use transforms
        if (this.world) {
            this.world.render(this.ctx);
        }
        
        // Restore context to clean state before rendering clouds
        this.ctx.restore();
        
        // Render clouds completely independently - no transforms should affect this
        this.renderIndependentClouds();
        
        // Save context for player
        this.ctx.save();
        
        // Render player - may use transforms
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Final restore
        this.ctx.restore();
        
        // Render UI elements (no transforms needed)
        if (this.gameState === 'paused') {
            this.renderPauseScreen();
        }
        
        // DEBUG OVERLAY
        this.renderDebugInfo();
    }
    
    renderDebugInfo() {
        if (!this.player || !this.world) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 100, 300, 180);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        
        const centerX = this.canvas.width * 0.5;
        const distFromCenter = this.player.x - centerX;
        
        this.ctx.fillText(`Player X: ${this.player.x.toFixed(1)}`, 20, 120);
        this.ctx.fillText(`Player Y: ${this.player.y.toFixed(1)}`, 20, 140);
        this.ctx.fillText(`Velocity X: ${this.player.velocityX.toFixed(1)}`, 20, 160);
        this.ctx.fillText(`Velocity Y: ${this.player.velocityY.toFixed(1)}`, 20, 180);
        this.ctx.fillText(`Dist from center: ${distFromCenter.toFixed(1)}`, 20, 200);
        this.ctx.fillText(`Scroll dir: ${this.world.currentScrollDirection.toFixed(3)}`, 20, 220);
        this.ctx.fillText(`Coins: ${this.world.coins.length}`, 20, 240);
        this.ctx.fillText(`On ground: ${this.player.onGround}`, 20, 260);
    }
    
    renderPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    start() {
        this.init();
        this.gameState = 'playing';
        this.hideMenu();
        
        // Position player in center
        this.player.x = this.canvas.width * 0.5; // Center of screen
        this.player.y = this.canvas.height - 20 - this.player.height; // Stopy dokładnie na chodnik
        
        // Initialize independent clouds system
        this.initIndependentClouds();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    showMenu() {
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('highScore').textContent = this.highScore;
        this.gameState = 'menu';
    }
    
    hideMenu() {
        document.getElementById('menu').classList.add('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('coins').textContent = this.coinsCollected;
    }
    
    updateDashBar() {
        if (!this.player) return;
        
        const powerPercent = this.player.getDashPowerPercent();
        document.getElementById('dashCooldownBar').style.width = (powerPercent * 100) + '%';
        
        const charges = this.player.getDashCharges();
        const chargesElement = document.getElementById('dashCharges');
        if (charges > 0) {
            chargesElement.textContent = 'x' + charges;
            chargesElement.style.display = 'block';
        } else {
            chargesElement.style.display = 'none';
        }
    }
    
    saveHighScore() {
        localStorage.setItem('bungvo_high_score', this.highScore.toString());
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('bungvo_high_score');
        return saved ? parseInt(saved) : 0;
    }
    
    initIndependentClouds() {
        // Completely independent clouds system
        this.independentClouds = {
            texture: null,
            scrollX: 0,
            y: -150,
            scale: 2.0,
            mirroring: 550,
            speed: 50 // pixels per second - constant drift to the right, independent of player
        };
        
        // Load cloud texture
        const img = new Image();
        img.onload = () => {
            this.independentClouds.texture = img;
        };
        img.src = 'assets/Pv8HBC.png';
    }
    
    updateIndependentClouds(deltaTime) {
        // Clouds move based on player direction (wind effect)
        if (this.independentClouds && this.player) {
            // Base speed when standing still
            const baseSpeed = 20;
            
            let totalSpeed = baseSpeed;
            
            if (this.player.velocityX > 10) {
                // Moving right - add wind, move right faster
                const windSpeed = this.player.velocityX * 0.6;
                totalSpeed = baseSpeed + windSpeed;
            } else if (this.player.velocityX < -10) {
                // Moving left - reverse direction, move left
                const windSpeed = Math.abs(this.player.velocityX) * 0.6;
                totalSpeed = -(baseSpeed + windSpeed); // Negative = move left
            }
            // Standing still - just base speed to the right
            
            // Move clouds
            this.independentClouds.scrollX += totalSpeed * deltaTime;
            
            // No wrapping needed - modulo in render handles it smoothly
        }
    }
    
    renderIndependentClouds() {
        // Render clouds completely independently from world
        if (!this.independentClouds || !this.independentClouds.texture) return;
        
        const texture = this.independentClouds.texture;
        if (!texture.complete) return;
        
        // Save current context and reset ALL transforms
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const tileWidth = texture.width * this.independentClouds.scale;
        const startX = -this.independentClouds.scrollX % tileWidth;
        const tilesNeeded = Math.ceil((this.canvas.width + tileWidth) / tileWidth);
        
        // Draw repeating cloud tiles
        for (let i = 0; i < tilesNeeded; i++) {
            const x = startX + (i * tileWidth);
            
            this.ctx.drawImage(
                texture,
                x,
                this.independentClouds.y,
                texture.width * this.independentClouds.scale,
                texture.height * this.independentClouds.scale
            );
        }
        
        // Debug: show cloud position
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Clouds X: ${this.independentClouds.scrollX.toFixed(1)}`, 10, 30);
        
        // Restore context
        this.ctx.restore();
    }
}

// Global game instance
let game;

// Global functions for HTML buttons
function startGame() {
    if (!game) {
        game = new BungvoGame();
    }
    game.start();
}

function showInstructions() {
    alert(`BUNGVO - Walking Simulator

🎮 CONTROLS:
• W/Space/Up Arrow - Jump
• A/D or Left/Right - Move left/right
• Shift - Dash (with cooldown)
• ESC - Pause/Menu

🎯 PLATFORMER GAMEPLAY:
• Jump and dash through the level
• Camera follows player with smooth dead zone
• Move freely across the entire screen
• World scrolls when you leave the center area
• Multiple parallax layers create depth
• Collect coins as you explore
• Advanced mechanics: coyote time, jump buffering, wall slide

🎯 OBJECTIVE:
• Walk around and explore in both directions
• Collect items along the way
• Enjoy the peaceful stroll
• Beat your high score!

🎨 FEATURES:
• Authentic parallax scrolling like original
• Bidirectional movement and scrolling
• World responds to your movement
• Multiple background layers at different speeds

This uses the original Bungvo parallax system!`);
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Bungvo Enhanced loaded!');
});