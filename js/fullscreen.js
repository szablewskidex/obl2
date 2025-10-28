// Simple fullscreen support
class FullscreenManager {
    constructor() {
        this.isFullscreen = false;
        this.setupFullscreenButton();
        this.setupFullscreenListeners();
    }
    
    setupFullscreenButton() {
        // Create fullscreen button only for mobile
        if (this.isMobile()) {
            const fullscreenBtn = document.createElement('button');
            fullscreenBtn.id = 'fullscreenBtn';
            fullscreenBtn.innerHTML = '⛶';
            fullscreenBtn.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 1000;
                background: rgba(0,0,0,0.7);
                color: white;
                border: none;
                padding: 10px;
                border-radius: 5px;
                font-size: 20px;
                cursor: pointer;
            `;
            
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
            
            document.body.appendChild(fullscreenBtn);
        }
    }
    
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
        
        this.isFullscreen = true;
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        this.isFullscreen = false;
    }
    
    setupFullscreenListeners() {
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            this.isFullscreen = !!document.webkitFullscreenElement;
        });
        
        document.addEventListener('mozfullscreenchange', () => {
            this.isFullscreen = !!document.mozFullScreenElement;
        });
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}