# 🎮 Instrukcja uruchomienia ulepszonej gry "Bungvo"

## 📋 Wymagania
- Godot Engine 3.5+ (pobierz z https://godotengine.org/)
- System Windows/Linux/Mac

## 🚀 Kroki uruchomienia

### 1. Pobierz Godot Engine
1. Idź na https://godotengine.org/download
2. Pobierz **Godot 3.5** (lub nowszą wersję 3.x)
3. Rozpakuj i uruchom `Godot.exe`

### 2. Otwórz projekt
1. W Godot kliknij **"Import"**
2. Wybierz folder `godot_project`
3. Wybierz plik `project.godot`
4. Kliknij **"Import & Edit"**

### 3. Dodaj ikonę (opcjonalne)
1. Skopiuj dowolny plik PNG 64x64 jako `icon.png`
2. Lub użyj domyślnej ikony Godot

### 4. Uruchom grę
1. Naciśnij **F5** lub kliknij przycisk **Play**
2. Wybierz `MainMenu.tscn` jako główną scenę
3. Gra się uruchomi!

## 🎯 Kontrolki

- **A/D** lub **Strzałki** - Ruch lewo/prawo
- **Space** lub **W** - Skok
- **Shift** lub **X** - Dash (z cooldownem)
- **ESC** - Pauza/Menu

## 🎮 Nowe mechaniki

### Wall Jump
- Dotknij ściany podczas spadania
- Naciśnij skok - odbijasz się automatycznie w przeciwną stronę

### Dash
- Naciśnij Shift + kierunek
- Cooldown 1 sekunda
- Odnawia się na ziemi i przy ścianie

### Coyote Time
- Możesz skoczyć przez 0.1s po opuszczeniu platformy

### System punktów
- **Monety**: 10 punktów każda
- **Ukończenie poziomu**: bonus x100
- **Najlepszy wynik**: automatycznie zapisywany

## 🔧 Jeśli coś nie działa

### Problem: Brak ikony
- Skopiuj dowolny plik PNG jako `icon.png`
- Lub usuń referencje do ikony z plików .tscn

### Problem: Błędy skryptów
- Sprawdź czy wszystkie pliki .gd są w folderze
- Upewnij się, że używasz Godot 3.x (nie 4.x)

### Problem: Brak animacji
- Gra działa bez animacji
- Można dodać własne animacje w AnimationPlayer

### Problem: GameManager nie działa
- Sprawdź AutoLoad w Project Settings
- GameManager powinien być dodany automatycznie

## 🎨 Customizacja

### Zmiana parametrów gracza
Edytuj `Player.gd`:
```gdscript
const SPEED = 200.0           # Prędkość ruchu
const JUMP_VELOCITY = -400.0  # Siła skoku
const DASH_SPEED = 300.0      # Prędkość dash'a
```

### Dodanie nowych poziomów
1. Skopiuj `World.tscn`
2. Zmień układ platform i monet
3. Zapisz jako nowy plik

### Dodanie tekstur
1. Skopiuj pliki PNG do projektu
2. Zastąp `icon.png` w scenach
3. Dodaj własne sprite'y

## 🎉 Gotowe!

Teraz masz działającą, ulepszoną wersję gry "Bungvo" z:
- ✅ Wall jumping
- ✅ Dash mechaniką  
- ✅ Systemem punktów
- ✅ Zapisywaniem wyniku
- ✅ Płynnymi mechanikami

**Miłej zabawy!** 🚀

---

## 📞 Pomoc
Jeśli masz problemy:
1. Sprawdź czy używasz Godot 3.x
2. Upewnij się, że wszystkie pliki są w folderze
3. Sprawdź Output/Debugger w Godot dla błędów