// Touch controls for mobile devices
class TouchControls {
    constructor() {
        this.touchStates = {
            left: false,
            right: false,
            jump: false,
            dash: false
        };
        
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        // Only setup on mobile
        if (!this.isMobile()) return;
        
        // Get touch buttons
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnJump = document.getElementById('btnJump');
        const btnDash = document.getElementById('btnDash');
        
        if (btnLeft) this.setupButton(btnLeft, 'left');
        if (btnRight) this.setupButton(btnRight, 'right');
        if (btnJump) this.setupButton(btnJump, 'jump');
        if (btnDash) this.setupButton(btnDash, 'dash');
        
        console.log('Touch controls initialized');
    }
    
    setupButton(button, action) {
        // Prevent default touch behaviors
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.touchStates[action] = true;
            button.style.opacity = '1';
        }, { passive: false, capture: true });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.touchStates[action] = false;
            button.style.opacity = '0.6';
        }, { passive: false, capture: true });
        
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.touchStates[action] = false;
            button.style.opacity = '0.6';
        }, { passive: false, capture: true });
        
        // Prevent context menu
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    isPressed(action) {
        return this.touchStates[action] || false;
    }
    
    getStates() {
        // Only return states on mobile
        if (!this.isMobile()) {
            return { left: false, right: false, jump: false, dash: false };
        }
        return { ...this.touchStates };
    }
}

// Global touch controls instance
let touchControls = null;

// Initialize touch controls when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    touchControls = new TouchControls();
    window.touchControls = touchControls; // Expose to window
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    touchControls = new TouchControls();
    window.touchControls = touchControls;
}