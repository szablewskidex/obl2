# 🚶 Bungvo - Sidewalk Walking Game

Przepisana wersja oryginalnej gry "Bungvo" - spokojnej gry o chodzeniu po chodniku, w HTML5/JavaScript z Canvas API, używająca oryginalnych assetów z wersji Godot.

## ✨ Funkcje Enhanced Edition

### 🎯 Oryginalne assety + ulepszone mechaniki
- **Oryginalne tekstury** - wszystkie sprite'y z wersji Godot
- **Oryginalny character atlas** - animowany bohater
- **Oryginalne tła** - niebo, chmury, elementy parallax
- **Oryginalne platformy** - tekstury bloków i ogrodzeń
- **Jumping** - płynny skok z grawitacją
- **Dash** - szybki ruch w dowolnym kierunku z cooldownem (1s)
- **Coyote time** - krótki czas na skok po opuszczeniu platformy (0.1s)
- **Jump buffering** - buforowanie skoku dla lepszej responsywności (0.1s)

### 🏆 System punktów
- Zbieranie monet (używa oryginalnych sprite'ów)
- Zapisywanie najlepszego wyniku
- Bonus za ukończenie poziomu

### 🎨 Wierny oryginałowi wygląd
- Oryginalne tekstury i sprite'y
- Zachowana estetyka gry Bungvo
- Płynne animacje i efekty
- Responsywny design

### 🔧 Nowoczesna architektura
- Czysty HTML5/JavaScript
- Modularny kod
- System fizyki z kolizjami
- Zarządzanie stanów gry

## 🎮 Kontrolki

- **A/D** lub **Strzałki** - Ruch lewo/prawo
- **W/Space/↑** - Skok
- **Shift** - Dash (z cooldownem 1s)
- **ESC** - Pauza/Menu

## 🎨 Oryginalne assety

Ta wersja używa wszystkich oryginalnych tekstur wyekstraktowanych z pliku `.pck` Godot:

- **charatlas.png** - Kompletny atlas postaci z głową, torsem, nogami
- **nieb.png** - Tekstura tła nieba
- **oblockmid.png** - Tekstura platform środkowych
- **oblockfence.png** - Tekstura ścian/ogrodzeń
- **Pv8HBC.png** - Sprite'y chmur
- **download.png** - Elementy tła
- **id2.png** - Tekstura monet/przedmiotów
- **oblck.png** - Dodatkowe bloki

Wszystkie tekstury są automatycznie ładowane i używane w odpowiednich miejscach.

## 🚀 Jak uruchomić

### Opcja 1: Bezpośrednio w przeglądarce
1. Upewnij się, że folder `assets/` zawiera wszystkie tekstury
2. Otwórz plik `index.html` w przeglądarce
3. Graj!

### Opcja 2: Lokalny serwer (zalecane dla pełnej funkcjonalności)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server
```

Następnie otwórz http://localhost:8000

### Opcja 3: Kopiowanie assetów (jeśli nie masz folderu assets)
```bash
python copy_assets.py
```

## 📁 Struktura projektu

```
bungvo_rewrite/
├── index.html          # Główny plik HTML
├── assets/             # Oryginalne tekstury z Godot
│   ├── charatlas.png   # Atlas postaci
│   ├── nieb.png        # Tło nieba
│   ├── oblockmid.png   # Tekstura platform
│   ├── oblockfence.png # Tekstura ścian
│   ├── Pv8HBC.png      # Chmury
│   ├── id2.png         # Monety
│   └── ...             # Inne tekstury
├── js/
│   ├── main.js         # Główna pętla gry i inicjalizacja
│   ├── player.js       # Mechaniki gracza (z oryginalnym atlasem)
│   ├── world.js        # Świat gry (z oryginalnymi teksturami)
│   ├── physics.js      # System fizyki i kolizji
│   ├── ui.js          # Interfejs użytkownika i efekty
│   └── game.js        # Systemy gry
├── copy_assets.py      # Skrypt do kopiowania assetów
└── README.md          # Ten plik
```

## 🎯 Mechaniki gry

### Camera Follow System
1. Gracz może się poruszać swobodnie po całym ekranie
2. Dead zone 200px w centrum - kamera nie rusza się
3. Gdy gracz wyjdzie poza dead zone - kamera zaczyna go śledzić
4. Płynne śledzenie - im dalej od centrum, tym szybsze scrollowanie
5. Możesz "wyprzedzić" kamerę używając dash'a

### Dash
1. Naciśnij Shift + kierunek (WASD/strzałki)
2. Bez kierunku - dash w stronę patrzenia
3. Cooldown 1 sekunda (wskaźnik w prawym górnym rogu)
4. Odnawia się na ziemi i przy ścianie

### Coyote Time
- Możesz skoczyć przez 0.1s po opuszczeniu platformy
- Czyni grę bardziej responsywną i przyjazną

## 🏆 Osiągnięcia

- **First Steps** - Zbierz pierwszą monetę
- **Coin Collector** - Zbierz 10 monet w jednej grze
- **Wall Jumper** - Wykonaj 5 wall jumpów
- **Dash Master** - Użyj dash 20 razy
- **Speed Runner** - Ukończ poziom w mniej niż 30 sekund

## 🔧 Customizacja

### Zmiana parametrów gracza
W pliku `js/player.js`:
```javascript
this.speed = 250;        // Prędkość ruchu
this.jumpPower = 450;    // Siła skoku
this.dashSpeed = 400;    // Prędkość dash'a
this.gravity = 980;      // Grawitacja
```

### Dodanie nowych poziomów
W pliku `js/world.js` w metodzie `generateLevel()`:
```javascript
// Dodaj platformy
this.addPlatform(x, y, width, height);

// Dodaj ściany
this.addWall(x, y, width, height, {x: -1, y: 0});

// Dodaj monety
this.addCoin(x, y);
```

### Nowe osiągnięcia
W pliku `js/game.js` w klasie `AchievementSystem`:
```javascript
NEW_ACHIEVEMENT: {
    id: 'new_achievement',
    name: 'Nazwa',
    description: 'Opis',
    unlocked: false
}
```

## 🎨 Style i kolory

Gra używa nowoczesnych gradientów CSS i Canvas:
- **Tło**: Gradient niebieski → fioletowy
- **Gracz**: Teal (#4ecdc4), czerwony podczas dash'a
- **Platformy**: Brązowe gradienty
- **Monety**: Złote z animacją obrotu
- **UI**: Białe z cieniami

## 🔊 Dźwięki (do implementacji)

Struktura jest przygotowana na dodanie dźwięków:
- Skok gracza
- Dash
- Zbieranie monet
- Muzyka tła
- Efekty UI

## 📱 Kompatybilność

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (z touch controlami)

## 🐛 Znane problemy

- Brak dźwięków (do implementacji)
- Jeden poziom (łatwo dodać więcej)
- Brak animacji sprite'ów (używa prostych kształtów)

## 🚀 Dalszy rozwój

### Planowane funkcje:
1. **Więcej poziomów** - system ładowania poziomów
2. **Dźwięki** - pełna implementacja audio
3. **Animacje** - sprite'y i animacje postaci
4. **Wrogowie** - przeciwnicy i walka
5. **Power-up'y** - tymczasowe ulepszenia
6. **Multiplayer** - tryb dla wielu graczy
7. **Level editor** - tworzenie własnych poziomów

### Jak dodać nowe funkcje:
1. **Nowe mechaniki** - rozszerz klasę `Player`
2. **Nowe obiekty** - dodaj do klasy `World`
3. **Nowe efekty** - użyj klasy `UI`
4. **Nowe stany** - rozszerz `GameState`

## 📄 Licencja

Ten projekt jest open source. Możesz go swobodnie modyfikować i dystrybuować.

## 🎉 Gotowe!

Masz teraz kompletną, działającą grę platformową z zaawansowanymi mechanikami!

**Miłej zabawy!** 🚀

---

*Bungvo Enhanced - HTML5 Rewrite v1.0*