#!/usr/bin/env python3
"""
WASM Patcher - Narzędzie do modyfikacji plików WebAssembly Godot
Pozwala na podmianę stringów i wartości w skompilowanym pliku .wasm
"""

import sys
import os
import struct
import re
from pathlib import Path

class WASMPatcher:
    def __init__(self, wasm_file_path):
        self.wasm_path = Path(wasm_file_path)
        self.data = None
        self.load_wasm()
    
    def load_wasm(self):
        """Wczytaj plik WASM do pamięci"""
        try:
            with open(self.wasm_path, 'rb') as f:
                self.data = bytearray(f.read())
            print(f"✅ Wczytano plik WASM: {self.wasm_path} ({len(self.data)} bajtów)")
        except Exception as e:
            print(f"❌ Błąd wczytywania pliku: {e}")
            sys.exit(1)
    
    def save_wasm(self, output_path=None):
        """Zapisz zmodyfikowany plik WASM"""
        if output_path is None:
            output_path = str(self.wasm_path).replace('.wasm', '_modified.wasm')
        
        try:
            with open(output_path, 'wb') as f:
                f.write(self.data)
            print(f"✅ Zapisano zmodyfikowany plik: {output_path}")
        except Exception as e:
            print(f"❌ Błąd zapisywania: {e}")
    
    def find_string(self, search_string):
        """Znajdź wszystkie wystąpienia stringa w WASM"""
        search_bytes = search_string.encode('utf-8')
        positions = []
        
        start = 0
        while True:
            pos = self.data.find(search_bytes, start)
            if pos == -1:
                break
            positions.append(pos)
            start = pos + 1
        
        print(f"🔍 Znaleziono '{search_string}' w {len(positions)} miejscach: {positions}")
        return positions
    
    def replace_string(self, old_string, new_string, max_replacements=None):
        """Zamień string w pliku WASM"""
        old_bytes = old_string.encode('utf-8')
        new_bytes = new_string.encode('utf-8')
        
        if len(new_bytes) > len(old_bytes):
            print(f"⚠️  Nowy string jest dłuższy ({len(new_bytes)} > {len(old_bytes)})")
            print("   To może spowodować problemy. Rozważ skrócenie.")
        
        # Dopełnij nowy string do tej samej długości
        if len(new_bytes) < len(old_bytes):
            new_bytes += b'\x00' * (len(old_bytes) - len(new_bytes))
        elif len(new_bytes) > len(old_bytes):
            new_bytes = new_bytes[:len(old_bytes)]
        
        replacements = 0
        start = 0
        
        while True:
            pos = self.data.find(old_bytes, start)
            if pos == -1:
                break
            
            self.data[pos:pos+len(old_bytes)] = new_bytes
            replacements += 1
            start = pos + len(new_bytes)
            
            if max_replacements and replacements >= max_replacements:
                break
        
        print(f"🔄 Zamieniono '{old_string}' -> '{new_string}' ({replacements} razy)")
        return replacements
    
    def patch_numeric_value(self, old_value, new_value, value_type='float'):
        """Zamień wartość numeryczną w WASM"""
        if value_type == 'float':
            old_bytes = struct.pack('<f', old_value)
            new_bytes = struct.pack('<f', new_value)
        elif value_type == 'int32':
            old_bytes = struct.pack('<i', old_value)
            new_bytes = struct.pack('<i', new_value)
        else:
            print(f"❌ Nieobsługiwany typ: {value_type}")
            return 0
        
        replacements = 0
        start = 0
        
        while True:
            pos = self.data.find(old_bytes, start)
            if pos == -1:
                break
            
            self.data[pos:pos+len(old_bytes)] = new_bytes
            replacements += 1
            start = pos + len(new_bytes)
        
        print(f"🔢 Zamieniono wartość {old_value} -> {new_value} ({replacements} razy)")
        return replacements
    
    def search_and_replace_patterns(self, patterns):
        """Wykonaj wiele zamian na podstawie wzorców"""
        total_changes = 0
        
        for pattern in patterns:
            if pattern['type'] == 'string':
                changes = self.replace_string(
                    pattern['old'], 
                    pattern['new'], 
                    pattern.get('max_replacements')
                )
            elif pattern['type'] == 'numeric':
                changes = self.patch_numeric_value(
                    pattern['old'], 
                    pattern['new'], 
                    pattern.get('value_type', 'float')
                )
            else:
                print(f"❌ Nieznany typ wzorca: {pattern['type']}")
                continue
            
            total_changes += changes
        
        return total_changes

def create_game_patches():
    """Zwróć listę poprawek dla gry Bungvo"""
    return [
        # Poprawki mechanik gracza
        {
            'type': 'numeric',
            'old': 200.0,  # Oryginalna prędkość
            'new': 250.0,  # Szybsza prędkość
            'value_type': 'float',
            'description': 'Zwiększenie prędkości gracza'
        },
        {
            'type': 'numeric',
            'old': -400.0,  # Oryginalna siła skoku
            'new': -450.0,  # Wyższy skok
            'value_type': 'float',
            'description': 'Zwiększenie siły skoku'
        },
        {
            'type': 'numeric',
            'old': 980.0,   # Oryginalna grawitacja
            'new': 900.0,   # Lżejsza grawitacja
            'value_type': 'float',
            'description': 'Zmniejszenie grawitacji'
        },
        # Poprawki UI
        {
            'type': 'string',
            'old': 'Score: ',
            'new': 'Points: ',
            'description': 'Zmiana tekstu punktów'
        },
        {
            'type': 'string',
            'old': 'Lives: ',
            'new': 'HP: ',
            'description': 'Zmiana tekstu żyć'
        },
        {
            'type': 'string',
            'old': 'GAME OVER',
            'new': 'TRY AGAIN',
            'description': 'Zmiana tekstu game over'
        }
    ]

def main():
    if len(sys.argv) < 2:
        print("Użycie: python wasm_patcher.py <plik.wasm> [opcje]")
        print("\nOpcje:")
        print("  --search <tekst>     - Wyszukaj tekst w pliku")
        print("  --replace <stary> <nowy> - Zamień tekst")
        print("  --patch-game         - Zastosuj predefiniowane poprawki gry")
        print("  --output <plik>      - Plik wyjściowy (domyślnie: *_modified.wasm)")
        return
    
    wasm_file = sys.argv[1]
    
    if not os.path.exists(wasm_file):
        print(f"❌ Plik nie istnieje: {wasm_file}")
        return
    
    patcher = WASMPatcher(wasm_file)
    
    # Parsuj argumenty
    i = 2
    output_file = None
    
    while i < len(sys.argv):
        arg = sys.argv[i]
        
        if arg == '--search' and i + 1 < len(sys.argv):
            search_text = sys.argv[i + 1]
            patcher.find_string(search_text)
            i += 2
        
        elif arg == '--replace' and i + 2 < len(sys.argv):
            old_text = sys.argv[i + 1]
            new_text = sys.argv[i + 2]
            patcher.replace_string(old_text, new_text)
            i += 3
        
        elif arg == '--patch-game':
            print("🎮 Stosowanie poprawek gry...")
            patches = create_game_patches()
            total_changes = patcher.search_and_replace_patterns(patches)
            print(f"✅ Zastosowano {total_changes} poprawek")
            i += 1
        
        elif arg == '--output' and i + 1 < len(sys.argv):
            output_file = sys.argv[i + 1]
            i += 2
        
        else:
            print(f"❌ Nieznany argument: {arg}")
            i += 1
    
    # Zapisz plik
    patcher.save_wasm(output_file)

if __name__ == "__main__":
    main()