"""
ORBIT Vault Server — lokaler HTTP-Server mit Vault-Briefing-Endpunkt
Statt http.server: dieser Server kopiert vault_briefing.json live in interface/app/
sodass ORBIT es direkt abrufen kann.
"""
import shutil, time, pathlib, subprocess, sys, os

BRIEFING_SRC = pathlib.Path(r"C:\Users\Rene\AppData\Local\hermes\vault_briefing.json")
BRIEFING_DST = pathlib.Path(r"C:\Users\Rene\-orbit-core\interface\app\vault_briefing.json")
APP_DIR = pathlib.Path(r"C:\Users\Rene\-orbit-core\interface\app")

def sync_briefing():
    if BRIEFING_SRC.exists():
        shutil.copy2(BRIEFING_SRC, BRIEFING_DST)
        print(f"Briefing synchronisiert: {BRIEFING_DST}")
    else:
        print("Noch kein Briefing vorhanden — generiere jetzt...")
        subprocess.run([sys.executable, r"C:\Users\Rene\-orbit-core\scripts\vault_briefing.py"], check=False)
        if BRIEFING_SRC.exists():
            shutil.copy2(BRIEFING_SRC, BRIEFING_DST)

# Briefing beim Start einmal synchronisieren
sync_briefing()

# Dann den normalen http.server starten
os.chdir(APP_DIR)
subprocess.run([sys.executable, "-m", "http.server", "8000"])
