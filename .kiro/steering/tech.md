# Technology Stack

## Core Technologies

- **Game Engine**: Godot Engine (web export)
- **Runtime**: WebAssembly (WASM) + JavaScript
- **Audio**: WebAudio API with AudioWorklet support
- **Graphics**: WebGL/Canvas API
- **Platform**: HTML5 web browsers

## Build System

This project uses Godot's built-in export system for web deployment. The build artifacts include:

- `index.html` - Main HTML entry point
- `index.js` - Godot engine JavaScript runtime
- `index.wasm` - WebAssembly binary (17.8MB)
- `index.pck` - Godot packed game data (2.2MB)
- `index.audio.worklet.js` - Audio processing worklet

## File Structure

- **HTML**: Standard HTML5 with canvas element for game rendering
- **JavaScript**: Emscripten-generated code with Godot engine wrapper
- **Assets**: Icons and audio worklet for enhanced functionality
- **Binary**: WASM module contains the compiled game logic

## Common Commands

Since this is an exported web build, there are no build commands. The project is ready for deployment:

- **Local Testing**: Serve files via HTTP server (required for WASM/CORS)
- **Deployment**: Upload all files to web server maintaining file structure
- **Development**: Modifications require re-export from Godot editor

## Browser Requirements

- WebGL support
- WebAssembly support
- Modern JavaScript (ES6+)
- WebAudio API support