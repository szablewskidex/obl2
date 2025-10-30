// Gamepad support for Xbox controllers
class GamepadManager {
    constructor() {
        this.gamepads = {};
        this.deadzone = 0.2; // Dead zone for analog sticks
        this.buttonPressed = {}; // Track button press states
        
        // ✅ Check if gamepad is enabled from settings
        this.enabled = localStorage.getItem('gamepadEnabled') !== 'false';
        
        // Xbox controller button mapping
        this.buttons = {
            A: 0,        // Jump
            B: 1,        // Dash
            X: 2,        // Not used
            Y: 3,        // Not used
            LB: 4,       // Not used
            RB: 5,       // Not used
            LT: 6,       // Not used
            RT: 7,       // Not used
            SELECT: 8,   // Menu/Pause
            START: 9,    // Menu/Pause
            LS: 10,      // Left stick click
            RS: 11,      // Right stick click
            DPAD_UP: 12,    // Jump
            DPAD_DOWN: 13,  // Not used
            DPAD_LEFT: 14,  // Move left
            DPAD_RIGHT: 15  // Move right
        };
        
        // Axes mapping
        this.axes = {
            LEFT_STICK_X: 0,  // Left/right movement
            LEFT_STICK_Y: 1,  // Up/down (for jump/crouch)
            RIGHT_STICK_X: 2, // Not used
            RIGHT_STICK_Y: 3  // Not used
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id);
            this.gamepads[e.gamepad.index] = e.gamepad;
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('🎮 Gamepad disconnected:', e.gamepad.id);
            delete this.gamepads[e.gamepad.index];
        });
        
        // ✅ Debug: Check for existing gamepads on startup (only if enabled)
        setTimeout(() => {
            if (!this.enabled) {
                console.log('🎮 Gamepad support disabled in settings');
                return;
            }
            
            const gamepads = navigator.getGamepads();
            let foundGamepads = 0;
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    foundGamepads++;
                    console.log(`🎮 Found existing gamepad ${i}:`, gamepads[i].id);
                }
            }
            if (foundGamepads === 0) {
                console.log('🎮 No gamepads detected. Connect a controller and press any button.');
            }
        }, 1000);
    }
    
    update() {
        // ✅ Skip if gamepad is disabled
        if (!this.enabled) {
            return;
        }
        
        // Update gamepad states
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.gamepads[i] = gamepads[i];
            }
        }
    }
    
    isButtonPressed(buttonIndex) {
        for (let index in this.gamepads) {
            const gamepad = this.gamepads[index];
            if (gamepad && gamepad.buttons[buttonIndex]) {
                return gamepad.buttons[buttonIndex].pressed;
            }
        }
        return false;
    }
    
    isButtonJustPressed(buttonIndex) {
        const currentlyPressed = this.isButtonPressed(buttonIndex);
        const wasPressed = this.buttonPressed[buttonIndex] || false;
        
        this.buttonPressed[buttonIndex] = currentlyPressed;
        
        return currentlyPressed && !wasPressed;
    }
    
    getAxisValue(axisIndex) {
        for (let index in this.gamepads) {
            const gamepad = this.gamepads[index];
            if (gamepad && gamepad.axes[axisIndex] !== undefined) {
                const value = gamepad.axes[axisIndex];
                // Apply deadzone
                return Math.abs(value) > this.deadzone ? value : 0;
            }
        }
        return 0;
    }
    
    // Convert gamepad input to keyboard-like keys object
    getVirtualKeys() {
        const keys = {};
        
        // ✅ Debug: Check if any gamepad is connected
        if (Object.keys(this.gamepads).length === 0) {
            return keys; // No gamepads connected
        }
        
        // Movement from left stick or D-pad
        const leftStickX = this.getAxisValue(this.axes.LEFT_STICK_X);
        const leftStickY = this.getAxisValue(this.axes.LEFT_STICK_Y);
        
        // ✅ Debug: Log gamepad input when detected
        if (Math.abs(leftStickX) > 0.1 || Math.abs(leftStickY) > 0.1) {
            console.log(`🎮 Gamepad input: X=${leftStickX.toFixed(2)}, Y=${leftStickY.toFixed(2)}`);
        }
        
        // Left/Right movement
        if (leftStickX < -this.deadzone || this.isButtonPressed(this.buttons.DPAD_LEFT)) {
            keys['KeyA'] = true;
            keys['ArrowLeft'] = true;
        }
        if (leftStickX > this.deadzone || this.isButtonPressed(this.buttons.DPAD_RIGHT)) {
            keys['KeyD'] = true;
            keys['ArrowRight'] = true;
        }
        
        // Jump - only A button and D-pad up (removed left stick up)
        if (this.isButtonPressed(this.buttons.A) || this.isButtonPressed(this.buttons.DPAD_UP)) {
            keys['KeyW'] = true;
            keys['ArrowUp'] = true;
            keys['Space'] = true;
            console.log('🎮 Gamepad: Jump pressed');
        }
        
        // Shoot
        if (this.isButtonPressed(this.buttons.B)) {
            keys['KeyX'] = true; // B button shoots
            console.log('🎮 Gamepad: Shoot pressed');
        }
        
        // Dash - moved to X button
        if (this.isButtonPressed(this.buttons.X)) {
            keys['ShiftLeft'] = true;
            keys['ShiftRight'] = true;
            console.log('🎮 Gamepad: Dash pressed');
        }
        
        // Pause/Menu - only START/SELECT buttons, not A button
        if (this.isButtonJustPressed(this.buttons.START) || this.isButtonJustPressed(this.buttons.SELECT)) {
            console.log('Gamepad generating ESC, mobile:', this.isMobile());
            keys['Escape'] = true;
        }
        
        return keys;
    }
    
    isConnected() {
        return Object.keys(this.gamepads).length > 0;
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}