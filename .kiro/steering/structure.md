# Project Structure

## Root Directory Layout

```
/
├── index.html              # Main HTML entry point
├── index.js                # Godot engine JavaScript runtime (797 lines)
├── index.wasm              # WebAssembly binary (17.8MB)
├── index.pck               # Godot packed game data (2.2MB)
├── index.audio.worklet.js  # WebAudio worklet processor
├── index.png               # Game icon/favicon
├── index.icon.png          # Browser icon
├── index.apple-touch-icon.png # iOS home screen icon
├── .git/                   # Git version control
└── .kiro/                  # Kiro IDE configuration
    └── steering/           # AI assistant guidance files
```

## File Organization Principles

### Core Game Files
- All game files use `index.*` naming convention
- Main entry point is `index.html`
- Binary assets (WASM, PCK) contain the actual game logic and data

### Asset Files
- Icons follow platform-specific naming conventions
- Audio worklet is separate for modular audio processing
- All assets are optimized for web delivery

### Configuration
- `.kiro/` contains IDE-specific configuration
- `.git/` manages version control
- No traditional build configuration files (handled by Godot export)

## File Naming Conventions

- **Main files**: `index.*` prefix for all core game files
- **Icons**: Descriptive suffixes (`.icon.png`, `.apple-touch-icon.png`)
- **Modules**: Descriptive names (`.audio.worklet.js`)

## Deployment Structure

The entire root directory should be deployed as-is to maintain proper file relationships and CORS compliance. All files are required for proper game execution in web browsers.