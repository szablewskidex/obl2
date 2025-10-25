# 🎮 Bungvo - Walking Simulator Game

Spokojny symulator chodzenia po chodniku z systemem parallax scrolling. Projekt dostępny w dwóch wersjach: oryginalnej (Godot Engine) i przepisanej (HTML5/JavaScript).

## 📦 Wersje Projektu

### 🎯 Wersja Godot (Główna - Web Export)
**Lokalizacja:** Root directory (`index.html`, `index.wasm`, `index.pck`)

Wyeksportowana wersja gry z Godot Engine 4.5.1 gotowa do uruchomienia w przeglądarce.

**Uruchomienie:**
```bash
# Wymaga lokalnego serwera HTTP
python -m http.server 8000
# Otwórz: http://localhost:8000
```

**Funkcje:**
- ✅ Pełna gra w WebAssembly
- ✅ Wszystkie oryginalne assety
- ✅ Optymalizowana wydajność
- ✅ Walidacja zasobów przed ładowaniem
- ✅ Responsywny design

**Pliki:**
- `index.html` - Główny plik HTML z ulepszoną obsługą błędów
- `index.wasm` - Skompilowana gra (17.8MB)
- `index.pck` - Spakowane dane gry (2.2MB)
- `index.js` - Runtime Godot
- `styles.css` - Zewnętrzny CSS z custom properties
- `index.audio.worklet.js` - Procesor audio

### 🔄 Wersja JavaScript (Rewrite)
**Lokalizacja:** `bungvo_rewrite/`

Kompletnie przepisana wersja w czystym HTML5/JavaScript używająca oryginalnych assetów.

**Uruchomienie:**
```bash
cd bungvo_rewrite
python -m http.server 8000
# Otwórz: http://localhost:8000
```

**Funkcje:**
- ✅ Platformer mechanics (skok, dash)
- ✅ Enhanced movement (coyote time, jump buffering)
- ✅ Camera follow system z dead zone (200px)
- ✅ Swobodny ruch po całym ekranie
- ✅ Multi-layer parallax (niebo, budynki, drzewa, ogrodzenie)
- ✅ Niezależny system chmur
- ✅ Zbieranie monet (oblck.png)
- ✅ System zapisywania high score
- ✅ Dash z cooldownem i wizualnym wskaźnikiem

**Struktura:**
```
bungvo_rewrite/
├── index.html              # Główna gra
├── js/
│   ├── main.js            # Główna pętla gry
│   ├── player.js          # Mechaniki gracza
│   ├── world.js           # System świata i parallax
│   ├── physics.js         # Fizyka i kolizje
│   ├── ui.js              # Interfejs użytkownika
│   └── game.js            # Systemy gry
├── assets/                # Oryginalne tekstury z Godot
└── README.md              # Szczegółowa dokumentacja
```

**Pliki testowe:**
- `test_assets.html` - Test ładowania assetów
- `bidirectional_test.html` - Test kierunków ruchu
- `controlled_scroll_test.html` - Test scrollowania
- `infinite_runner_test.html` - Test mechaniki
- `bigger_scale_test.html` - Test skali
- `position_test.html` - Test pozycjonowania
- `original_layout_test.html` - Test layoutu

## 🛠️ Projekt Źródłowy Godot
**Lokalizacja:** `godot_project/`

Źródłowe pliki projektu Godot do edycji i eksportu.

**Wymagania:**
- Godot Engine 4.5.1 lub nowszy

**Instrukcje:**
Zobacz `godot_project/INSTRUKCJA_URUCHOMIENIA.md`

## 🧪 Testowanie

### Test Suite (Root)
Kompleksowy zestaw testów dla wersji Godot:
- `test-suite.html` - Pełny zestaw testów
- `cross-browser-test.html` - Testy kompatybilności
- `responsive-design-test.html` - Testy responsywności
- `visual-regression-test.html` - Testy wizualne

**Uruchomienie:**
```bash
python -m http.server 8000
# Otwórz: http://localhost:8000/test-suite.html
```

## 📋 Narzędzia

### Export Scripts
**Lokalizacja:** `export_scripts/`
- `export_to_web.py` - Automatyczny eksport do web

### WASM Tools
**Lokalizacja:** `wasm_tools/`
- `wasm_patcher.py` - Narzędzia do modyfikacji WASM

## 🎮 Kontrolki

### Wersja Godot
- **Strzałki/WASD** - Ruch
- **Spacja** - Akcja
- **ESC** - Menu/Pauza

### Wersja JavaScript
- **W/Space/↑** - Skok
- **A/←** - Ruch w lewo
- **D/→** - Ruch w prawo
- **Shift** - Dash (z cooldownem)
- **ESC** - Menu/Pauza

## 🌐 Kompatybilność Przeglądarek

Obie wersje wymagają:
- ✅ WebGL support
- ✅ WebAssembly support (wersja Godot)
- ✅ Modern JavaScript (ES6+)
- ✅ WebAudio API support

Testowane na:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📊 Struktura Projektu

```
/
├── index.html                  # Główna gra Godot (web export)
├── index.wasm                  # WebAssembly binary (17.8MB)
├── index.pck                   # Godot packed data (2.2MB)
├── index.js                    # Godot runtime
├── styles.css                  # Zewnętrzny CSS
├── test-suite.html             # Kompleksowe testy
├── README.md                   # Ten plik
│
├── bungvo_rewrite/             # Przepisana wersja JavaScript
│   ├── index.html
│   ├── js/                     # Modularny kod
│   ├── assets/                 # Oryginalne tekstury
│   └── README.md               # Dokumentacja JS version
│
├── godot_project/              # Źródła Godot
│   ├── project.godot
│   ├── *.gd                    # Skrypty GDScript
│   └── INSTRUKCJA_URUCHOMIENIA.md
│
├── export_scripts/             # Skrypty eksportu
├── wasm_tools/                 # Narzędzia WASM
└── .kiro/                      # Konfiguracja IDE
    └── specs/                  # Specyfikacje ulepszeń
```

## 🚀 Quick Start

### Uruchom wersję Godot (zalecane):
```bash
python -m http.server 8000
# Otwórz: http://localhost:8000
```

### Uruchom wersję JavaScript:
```bash
cd bungvo_rewrite
python -m http.server 8000
# Otwórz: http://localhost:8000
```

### Edytuj w Godot:
```bash
# Otwórz Godot Engine 4.5.1
# File -> Open Project -> godot_project/project.godot
```

## 📝 Changelog

### Wersja Godot (Aktualna)
- ✅ Modernizacja HTML5 (usunięcie CDATA)
- ✅ Zewnętrzny CSS z custom properties
- ✅ Strict equality operators
- ✅ Walidacja zasobów przed ładowaniem
- ✅ Ulepszona obsługa błędów
- ✅ Kompleksowy test suite

### Wersja JavaScript (Rewrite)
- ✅ Kompletna implementacja w JS
- ✅ Platformer mechanics (skok, dash)
- ✅ Enhanced movement (coyote time, jump buffering)
- ✅ Camera follow system z dead zone
- ✅ Multi-layer parallax scrolling
- ✅ Niezależny system chmur
- ✅ System zbierania monet (oblck.png)
- ✅ Dash z cooldownem

## 🤝 Rozwój

Projekt używa:
- **Godot Engine 4.5.1** - główny silnik gry
- **HTML5/Canvas API** - wersja JavaScript
- **WebAssembly** - kompilacja Godot
- **Python** - skrypty narzędziowe

## 📄 Licencja

Open source - możesz swobodnie modyfikować i dystrybuować.

---

**Bungvo** - Spokojny spacer po chodniku 🚶‍♂️
