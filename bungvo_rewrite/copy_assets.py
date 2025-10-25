#!/usr/bin/env python3
"""
Skrypt do kopiowania assetów z wyekstraktowanego .pck do folderu gry
"""

import os
import shutil
from pathlib import Path

# Ścieżki
source_dir = Path("../unpacked/index.pck/res_/.import")
dest_dir = Path("assets")

# Utwórz folder assets jeśli nie istnieje
dest_dir.mkdir(exist_ok=True)

# Mapowanie nazw plików (oryginalna nazwa -> nowa nazwa)
asset_mapping = {
    "charatlas.png-802b93b9c97b74ceb2e0e19411ae90d3.png": "charatlas.png",
    "nieb.png-0bd447bd0ed07393940a607597542cd9.png": "nieb.png",
    "oblck.png-4997bf48ae2d322530d8cf464535d5af.png": "oblck.png",
    "oblckclck.png-b3d3694c58ef31721eb8f4e5346a6d34.png": "oblckclck.png",
    "oblockfence.png-18354e4cfa0801b4fc226a197adbfabd.png": "oblockfence.png",
    "oblockmid.png-65a245e76b7d71546ae32cf3f4652ffe.png": "oblockmid.png",
    "platform.png-984404150e7e767b8067601eb44eb6b5.png": "platform.png",
    "Pv8HBC.png-88a3eb810f6b2f86e8ea80c0c7052ea5.png": "Pv8HBC.png",
    "download.png-0fe1829d5b45fcf42c18266423ed01d8.png": "download.png",
    "5213358-middle.png-c61b3e2dc1bf3b9ef6cbc9cfac2fbafb.png": "5213358-middle.png",
    "5213358-middle2.png-106b9626e5d6dc255c029c45bd6f6c17.png": "5213358-middle2.png",
    "id2.png-f36e4d2d9a44145107adb3aed1d74751.png": "id2.png"
}

print("Kopiowanie assetów...")

for source_name, dest_name in asset_mapping.items():
    source_path = source_dir / source_name
    dest_path = dest_dir / dest_name
    
    if source_path.exists():
        shutil.copy2(source_path, dest_path)
        print(f"✅ Skopiowano: {dest_name}")
    else:
        print(f"❌ Nie znaleziono: {source_name}")

print(f"\n🎉 Skopiowano {len(asset_mapping)} assetów do folderu assets/")