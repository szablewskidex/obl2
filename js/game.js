// Game state management and utilities
class GameState {
    constructor() {
        this.states = {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver',
            LEVEL_COMPLETE: 'levelComplete'
        };
        
        this.currentState = this.states.MENU;
        this.previousState = null;
    }
    
    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        console.log(`State changed: ${this.previousState} -> ${this.currentState}`);
    }
    
    is(state) {
        return this.currentState === state;
    }
    
    was(state) {
        return this.previousState === state;
    }
}

// Sound manager (placeholder for future audio implementation)
class SoundManager {
    constructor() {
        this.sounds = {};
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.muted = false;
    }
    
    loadSound(name, url) {
        // Placeholder for loading audio files
        console.log(`Loading sound: ${name} from ${url}`);
    }
    
    playSound(name, volume = 1.0) {
        if (this.muted) return;
        // Placeholder for playing sounds
        console.log(`Playing sound: ${name} at volume ${volume * this.sfxVolume}`);
    }
    
    playMusic(name, loop = true) {
        if (this.muted) return;
        // Placeholder for playing music
        console.log(`Playing music: ${name}, loop: ${loop}`);
    }
    
    stopMusic() {
        console.log('Stopping music');
    }
    
    setMuted(muted) {
        this.muted = muted;
        console.log(`Audio muted: ${muted}`);
    }
}

// Performance monitor
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.fps = 60;
        this.lastFpsUpdate = 0;
        this.frameTime = 0;
        this.maxFrameTime = 0;
        this.minFrameTime = Infinity;
    }
    
    update(deltaTime) {
        this.frameCount++;
        this.frameTime = deltaTime * 1000; // Convert to milliseconds
        
        this.maxFrameTime = Math.max(this.maxFrameTime, this.frameTime);
        this.minFrameTime = Math.min(this.minFrameTime, this.frameTime);
        
        // Update FPS every second
        this.lastFpsUpdate += deltaTime;
        if (this.lastFpsUpdate >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = 0;
            this.maxFrameTime = 0;
            this.minFrameTime = Infinity;
        }
    }
    
    render(ctx) {
        if (false) { // Set to true to show performance info
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 200, 80);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            ctx.fillText(`FPS: ${this.fps}`, 15, 25);
            ctx.fillText(`Frame: ${this.frameTime.toFixed(2)}ms`, 15, 40);
            ctx.fillText(`Max: ${this.maxFrameTime.toFixed(2)}ms`, 15, 55);
            ctx.fillText(`Min: ${this.minFrameTime.toFixed(2)}ms`, 15, 70);
        }
    }
}

// Input manager for better input handling
class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseButtons = {};
        this.previousMouseButtons = {};
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            const rect = e.target.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
    }
    
    update() {
        // Store previous frame state
        this.previousKeys = { ...this.keys };
        this.previousMouseButtons = { ...this.mouseButtons };
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    isKeyJustPressed(keyCode) {
        return this.keys[keyCode] && !this.previousKeys[keyCode];
    }
    
    isKeyJustReleased(keyCode) {
        return !this.keys[keyCode] && this.previousKeys[keyCode];
    }
    
    isMouseButtonPressed(button) {
        return this.mouseButtons[button] || false;
    }
    
    isMouseButtonJustPressed(button) {
        return this.mouseButtons[button] && !this.previousMouseButtons[button];
    }
    
    getMousePosition() {
        return { ...this.mousePos };
    }
}

// Save/Load system
class SaveSystem {
    constructor() {
        this.saveKey = 'bungvo_enhanced_save';
    }
    
    save(data) {
        try {
            const saveData = {
                ...data,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    load() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (saveData) {
                const parsed = JSON.parse(saveData);
                console.log('Game loaded successfully');
                return parsed;
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        return null;
    }
    
    delete() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('Save data deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save data:', error);
            return false;
        }
    }
    
    exists() {
        return localStorage.getItem(this.saveKey) !== null;
    }
}

// Achievement system
class AchievementSystem {
    constructor() {
        this.achievements = {
            FIRST_COIN: {
                id: 'first_coin',
                name: 'First Steps',
                description: 'Collect your first coin',
                unlocked: false
            },
            COIN_COLLECTOR: {
                id: 'coin_collector',
                name: 'Coin Collector',
                description: 'Collect 10 coins in a single game',
                unlocked: false,
                progress: 0,
                target: 10
            },
            WALL_JUMPER: {
                id: 'wall_jumper',
                name: 'Wall Jumper',
                description: 'Perform 5 wall jumps',
                unlocked: false,
                progress: 0,
                target: 5
            },
            DASH_MASTER: {
                id: 'dash_master',
                name: 'Dash Master',
                description: 'Use dash 20 times',
                unlocked: false,
                progress: 0,
                target: 20
            },
            SPEED_RUNNER: {
                id: 'speed_runner',
                name: 'Speed Runner',
                description: 'Complete a level in under 30 seconds',
                unlocked: false
            }
        };
        
        this.loadAchievements();
    }
    
    checkAchievement(id, progress = 1) {
        const achievement = this.achievements[id];
        if (!achievement || achievement.unlocked) return false;
        
        if (achievement.target) {
            achievement.progress = Math.min(achievement.progress + progress, achievement.target);
            if (achievement.progress >= achievement.target) {
                this.unlockAchievement(id);
                return true;
            }
        } else {
            this.unlockAchievement(id);
            return true;
        }
        
        return false;
    }
    
    unlockAchievement(id) {
        const achievement = this.achievements[id];
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            console.log(`Achievement unlocked: ${achievement.name}`);
            this.saveAchievements();
            return achievement;
        }
        return null;
    }
    
    saveAchievements() {
        localStorage.setItem('bungvo_achievements', JSON.stringify(this.achievements));
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('bungvo_achievements');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                // Merge with default achievements to handle new achievements
                for (const id in loaded) {
                    if (this.achievements[id]) {
                        this.achievements[id] = { ...this.achievements[id], ...loaded[id] };
                    }
                }
            } catch (error) {
                console.error('Failed to load achievements:', error);
            }
        }
    }
    
    getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }
    
    getTotalCount() {
        return Object.keys(this.achievements).length;
    }
}

// Utility functions
class Utils {
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    static formatScore(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}