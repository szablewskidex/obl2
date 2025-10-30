// Haptic Feedback System - supports mobile vibration and gamepad rumble
class HapticFeedback {
    constructor() {
        // Load saved setting from localStorage
        const savedEnabled = localStorage.getItem('hapticsEnabled');
        this.enabled = savedEnabled !== 'false'; // Default to true if not set
        this.mobileSupported = 'vibrate' in navigator;
        this.gamepadSupported = false;
        
        // Throttling for continuous shooting
        this.lastShootTime = 0;
        this.lastShootVibration = 0; // Track last actual vibration for performance
        this.shootCount = 0;
        this.shootThrottleInterval = 50; // Start with 50ms between vibrations
        
        // Check if running as PWA
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        
        // Check iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        console.log('Haptics initialized:');
        console.log('  - Enabled:', this.enabled);
        console.log('  - Mobile supported:', this.mobileSupported);
        console.log('  - Is PWA:', isPWA);
        console.log('  - Is iOS:', isIOS);
        
        if (isIOS && !this.mobileSupported) {
            console.log('  - iOS detected: Using checkbox fallback for haptics');
        }
    }
    
    // Check if any connected gamepad supports vibration
    checkGamepadSupport() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let gamepad of gamepads) {
            if (gamepad && (gamepad.hapticActuators?.length > 0 || gamepad.vibrationActuator)) {
                this.gamepadSupported = true;
                console.log(`🎮 Gamepad haptics supported: ${gamepad.id}`);
                if (gamepad.hapticActuators?.length > 0) {
                    console.log(`  - Haptic actuators: ${gamepad.hapticActuators.length}`);
                    gamepad.hapticActuators.forEach((actuator, i) => {
                        console.log(`    [${i}] type: ${actuator.type || 'unknown'}`);
                    });
                }
                return true;
            }
        }
        return false;
    }
    
    // Vibrate mobile device
    vibrateMobile(pattern) {
        if (!this.enabled) {
            console.log('Haptics disabled');
            return;
        }
        
        // Standard Vibration API (Android, etc.)
        if (this.mobileSupported) {
            try {
                console.log('Attempting vibration:', pattern);
                const result = navigator.vibrate(pattern);
                console.log('Vibration result:', result);
                return;
            } catch (e) {
                console.error('Mobile vibration failed:', e);
            }
        }
        
        // iOS Safari fallback - use invisible checkbox hack
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
            try {
                console.log('Using iOS haptic fallback');
                let el = document.createElement('div');
                let id = 'haptic_' + Math.random().toString(36).slice(2);
                el.innerHTML = `<input type="checkbox" id="${id}" switch /><label for="${id}"></label>`;
                el.setAttribute("style", "display:none !important;opacity:0 !important;visibility:hidden !important;");
                document.querySelector('body').appendChild(el);
                el.querySelector('label').click();
                setTimeout(() => { 
                    if (el.parentNode) el.remove(); 
                }, 100);
            } catch (e) {
                console.error('iOS haptic fallback failed:', e);
            }
        } else {
            console.log('Vibration API not supported and not iOS');
        }
    }
    
    // Rumble gamepad using modern Gamepad Haptic Actuator API
    vibrateGamepad(duration, weakMagnitude = 0.5, strongMagnitude = 0.5) {
        if (!this.enabled) return;
        
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let gamepad of gamepads) {
            if (!gamepad) continue;
            
            // Try modern hapticActuators API first (newer standard)
            if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
                try {
                    // Use first haptic actuator
                    const actuator = gamepad.hapticActuators[0];
                    
                    // Check supported effects
                    if (actuator.effects && actuator.effects.includes('dual-rumble')) {
                        actuator.playEffect('dual-rumble', {
                            duration: duration,
                            weakMagnitude: weakMagnitude,
                            strongMagnitude: strongMagnitude,
                            startDelay: 0
                        }).catch(e => console.warn('Haptic effect failed:', e));
                    } else if (actuator.pulse) {
                        // Fallback to pulse if dual-rumble not supported
                        actuator.pulse(strongMagnitude, duration)
                            .catch(e => console.warn('Haptic pulse failed:', e));
                    }
                    continue; // Success, skip old API
                } catch (e) {
                    console.warn('Modern gamepad haptics failed:', e);
                }
            }
            
            // Fallback to older vibrationActuator API
            if (gamepad.vibrationActuator) {
                try {
                    gamepad.vibrationActuator.playEffect('dual-rumble', {
                        duration: duration,
                        weakMagnitude: weakMagnitude,
                        strongMagnitude: strongMagnitude
                    }).catch(e => console.warn('Legacy vibration failed:', e));
                } catch (e) {
                    console.warn('Gamepad vibration failed:', e);
                }
            }
        }
    }
    
    // Combined vibration - both mobile and gamepad
    vibrate(pattern, gamepadDuration = 50, weak = 0.5, strong = 0.5) {
        this.vibrateMobile(pattern);
        this.vibrateGamepad(gamepadDuration, weak, strong);
    }
    
    // Preset haptic patterns
    light() {
        // Light tap - UI feedback
        this.vibrate(10, 20, 0.2, 0.1);
    }
    
    medium() {
        // Medium tap - button press, coin collect
        this.vibrate(30, 50, 0.4, 0.3);
    }
    
    heavy() {
        // Heavy impact - damage, collision
        this.vibrate(50, 100, 0.7, 0.6);
    }
    
    shoot() {
        // Vibrate on every shot starting from 3rd shot with throttling for performance
        const now = Date.now();
        const timeSinceLastShoot = now - this.lastShootTime;
        
        // Always update last shoot time
        this.lastShootTime = now;
        
        // Reset counter if there was a pause
        if (timeSinceLastShoot > 500) {
            this.shootCount = 0;
            this.lastShootVibration = 0;
        }
        
        this.shootCount++;
        
        // Don't vibrate for first 2 shots
        if (this.shootCount < 3) {
            return;
        }
        
        // Throttle vibrations to max 10 per second (100ms minimum between vibrations)
        // This prevents performance issues on mobile
        if (!this.lastShootVibration || now - this.lastShootVibration >= 100) {
            this.lastShootVibration = now;
            
            // Quick pulse - shooting (stronger as you shoot more)
            const intensity = Math.min(0.2 + ((this.shootCount - 2) * 0.05), 0.5);
            this.vibrate(12, 25, intensity, 0.15);
        }
    }
    
    dash() {
        // Strong burst - dash
        this.vibrate([0, 20, 10, 30], 80, 0.8, 0.6);
    }
    
    hit() {
        // Impact - getting hit
        this.vibrate([0, 50, 20, 50], 150, 0.9, 0.8);
    }
    
    explosion() {
        // Big explosion - enemy killed
        this.vibrate([0, 30, 20, 50, 20, 30], 200, 1.0, 0.9);
    }
    
    jump() {
        // Light bounce - jumping
        this.vibrate(20, 40, 0.3, 0.2);
    }
    
    land() {
        // Thud - landing
        this.vibrate(40, 60, 0.5, 0.4);
    }
    
    // Enable/disable haptics
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log('Haptics', enabled ? 'enabled' : 'disabled');
    }
    
    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }
}
