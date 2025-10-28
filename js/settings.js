// Settings system for sensitivity and other game options
class Settings {
    constructor() {
        this.settings = {
            mouseSensitivity: 1.0,
            gamepadSensitivity: 1.0,
            browserZoom: 1.0
        };
        
        this.loadSettings();
        this.setupEventListeners();
        // Apply saved browser zoom
        this.applyBrowserZoom(this.settings.browserZoom);
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('bungvo_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        
        this.updateUI();
    }
    
    saveSettings() {
        try {
            localStorage.setItem('bungvo_settings', JSON.stringify(this.settings));
            console.log('Settings saved:', this.settings);
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }
    
    updateUI() {
        // Update sliders
        const mouseSlider = document.getElementById('mouseSensitivity');
        const gamepadSlider = document.getElementById('gamepadSensitivity');
        const zoomSlider = document.getElementById('cameraZoom');
        const mouseValue = document.getElementById('mouseSensitivityValue');
        const gamepadValue = document.getElementById('gamepadSensitivityValue');
        const zoomValue = document.getElementById('cameraZoomValue');
        
        if (mouseSlider) {
            mouseSlider.value = this.settings.mouseSensitivity;
            mouseValue.textContent = this.settings.mouseSensitivity.toFixed(1);
        }
        
        if (gamepadSlider) {
            gamepadSlider.value = this.settings.gamepadSensitivity;
            gamepadValue.textContent = this.settings.gamepadSensitivity.toFixed(1);
        }
        
        if (zoomSlider) {
            zoomSlider.value = this.settings.browserZoom;
            zoomValue.textContent = this.settings.browserZoom.toFixed(1);
        }
    }
    
    setupEventListeners() {
        // Mouse sensitivity slider
        const mouseSlider = document.getElementById('mouseSensitivity');
        const mouseValue = document.getElementById('mouseSensitivityValue');
        
        if (mouseSlider) {
            mouseSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.settings.mouseSensitivity = value;
                mouseValue.textContent = value.toFixed(1);
            });
        }
        
        // Gamepad sensitivity slider
        const gamepadSlider = document.getElementById('gamepadSensitivity');
        const gamepadValue = document.getElementById('gamepadSensitivityValue');
        
        if (gamepadSlider) {
            gamepadSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.settings.gamepadSensitivity = value;
                gamepadValue.textContent = value.toFixed(1);
            });
        }
        
        // Browser zoom slider
        const zoomSlider = document.getElementById('browserZoom');
        const zoomValue = document.getElementById('browserZoomValue');
        
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.settings.browserZoom = value;
                zoomValue.textContent = value.toFixed(1);
                // Apply zoom immediately
                this.applyBrowserZoom(value);
            });
        }
    }
    
    getMouseSensitivity() {
        return this.settings.mouseSensitivity;
    }
    
    getGamepadSensitivity() {
        return this.settings.gamepadSensitivity;
    }
    
    getBrowserZoom() {
        return this.settings.browserZoom;
    }
    
    applyBrowserZoom(zoom) {
        // Apply zoom to entire page/body
        document.body.style.zoom = zoom;
        // Alternative for browsers that don't support zoom
        if (!document.body.style.zoom) {
            document.body.style.transform = `scale(${zoom})`;
            document.body.style.transformOrigin = 'top left';
        }
    }
    
    reset() {
        this.settings = {
            mouseSensitivity: 1.0,
            gamepadSensitivity: 1.0,
            browserZoom: 1.0
        };
        this.updateUI();
        this.applyBrowserZoom(1.0);
    }
}

// Global settings instance
let gameSettings = null;

// Settings menu functions
function showSettings() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('settingsMenu').classList.remove('hidden');
    
    // Initialize settings if not already done
    if (!gameSettings) {
        gameSettings = new Settings();
    }
}

function closeSettings() {
    document.getElementById('settingsMenu').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
}

function saveSettings() {
    if (gameSettings) {
        gameSettings.saveSettings();
        // Show notification
        if (window.game && window.game.ui) {
            window.game.ui.showNotification('Settings saved!', 2.0, '#4ecdc4');
        }
    }
    closeSettings();
}

function resetSettings() {
    if (gameSettings) {
        gameSettings.reset();
        // Show notification
        if (window.game && window.game.ui) {
            window.game.ui.showNotification('Settings reset to default!', 2.0, '#ff6b6b');
        }
    }
}

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', () => {
    gameSettings = new Settings();
    window.gameSettings = gameSettings; // Export to window
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    gameSettings = new Settings();
    window.gameSettings = gameSettings;
}