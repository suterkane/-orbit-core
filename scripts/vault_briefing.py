"""
ORBIT Vault Briefing Generator — Mark 01
Liest Obsidian-Vault, Crypto-Preise und baut einen tagesaktuellen Lagebericht.
"""
import os, re, json, datetime, urllib.request, pathlib

VAULT = pathlib.Path(r"C:\Rene Obsidan\The Brain\The Brain")
SYNC_KEY_FILE = pathlib.Path(r"C:\Users\Rene\AppData\Local\hermes\orbit_sync_key.txt")

def get_sync_key():
    if SYNC_KEY_FILE.exists():
        return SYNC_KEY_FILE.read_text().strip()
    return os.environ.get("ORBIT_SYNC_KEY", "")

def read_note(rel_path):
    p = VAULT / rel_path
    if not p.exists(): return ""
    try: return p.read_text(encoding="utf-8", errors="replace")
    except: return ""

def strip_frontmatter(text):
    if text.startswith("---"):
        end = text.find("---", 3)
        if end > 0: return text[end+3:].strip()
    return text

def get_active_projects():
    projects = []
    skip = {"INDEX","INDEX — Vault-Katalog","AGENTS","CLAUDE","README","BRAIN_GRAPH","INSTALL"}
    for p in VAULT.rglob("*.md"):
        try: content = p.read_text(encoding="utf-8", errors="replace")
        except: continue
        if "status: aktiv" in content and p.stem not in skip:
            projects.append(p.stem)
    return projects[:6]

def get_daily_note():
    today = datetime.date.today().strftime("%Y-%m-%d")
    note = read_note(f"01 Daily Notes/{today}.md")
    if not note: return None
    text = strip_frontmatter(note)
    return text[:250].strip().replace("\n", " ") if text else None

# --- Crypto-Preise ---
def get_crypto_prices():
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=eur"
        req = urllib.request.Request(url, headers={"User-Agent": "ORBIT/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        btc = data.get("bitcoin", {}).get("eur", 0)
        sol = data.get("solana", {}).get("eur", 0)
        return btc, sol
    except Exception as e:
        print(f"Crypto-Fehler: {e}")
        return None, None

def format_price(val):
    if val is None: return "nicht verfügbar"
    if val >= 1000:
        return f"{val:,.0f}".replace(",", ".") + " Euro"
    return f"{val:.2f}".replace(".", ",") + " Euro"

# --- Lagebericht ---
def build_briefing():
    now = datetime.datetime.now()
    weekday = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"][now.weekday()]
    month = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][now.month-1]
    date_str = f"{weekday}, {now.day}. {month} {now.year}"

    parts = []
    speech_parts = []  # für FRIDAY-Ansage

    # Daily Note
    daily = get_daily_note()
    if daily:
        parts.append(f"Tagesnotiz: {daily[:200]}")
        speech_parts.append(f"Tagesnotiz: {daily[:150]}")

    # Aktive Projekte
    projs = get_active_projects()
    clean_projs = [
        p.replace("Medizinische Chronik","").replace("HWS,BWS,LWS","").replace("HWS","")
         .replace("BWS","").replace("LWS","").strip(" -,")
        for p in projs[:4]
    ]
    clean_projs = [p for p in clean_projs if len(p) > 3]
    if clean_projs:
        parts.append(f"Aktive Projekte: {', '.join(clean_projs)}.")
        speech_parts.append(f"Aktive Bereiche: {', '.join(clean_projs[:3])}.")

    # Crypto
    btc, sol = get_crypto_prices()
    crypto_text = ""
    if btc or sol:
        btc_str = format_price(btc)
        sol_str = format_price(sol)
        crypto_text = f"Bitcoin steht bei {btc_str}. Solana bei {sol_str}."
        parts.append(crypto_text)
        speech_parts.append(crypto_text)

    # Gesundheit (kurz)
    health_note = read_note("10-Gesundheit/Spinalkanalstenose HWS,BWS,LWS - Medizinische Chronik.md")
    if health_note:
        m = re.search(r"##[^#]*[Aa]ktuell[^\n]*\n(.*?)(?=\n#|\Z)", health_note, re.DOTALL)
        if m:
            snippet = m.group(1).strip()[:100].replace("\n"," ")
            if len(snippet) > 20:
                parts.append(f"Gesundheit: {snippet}")

    if not parts:
        parts.append("Vault steht bereit.")
    if not speech_parts:
        speech_parts.append("Alle Systeme bereit.")

    summary = " ".join(speech_parts)[:600]

    return {
        "date": date_str,
        "generated": now.isoformat(),
        "summary": summary,
        "projects": projs,
        "hasDaily": bool(daily),
        "crypto": {
            "btc_eur": btc,
            "sol_eur": sol,
            "text": crypto_text
        }
    }

def save_locally(briefing):
    out = pathlib.Path(r"C:\Users\Rene\AppData\Local\hermes\vault_briefing.json")
    out.write_text(json.dumps(briefing, ensure_ascii=False, indent=2), encoding="utf-8")
    # Auch direkt in ORBIT-App kopieren
    app_out = pathlib.Path(r"C:\Users\Rene\-orbit-core\interface\app\vault_briefing.json")
    if app_out.parent.exists():
        app_out.write_text(json.dumps(briefing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gespeichert: {out}")

def main():
    print(f"ORBIT Vault Briefing — {datetime.datetime.now():%Y-%m-%d %H:%M}")
    briefing = build_briefing()
    print(json.dumps(briefing, ensure_ascii=False, indent=2))
    save_locally(briefing)

if __name__ == "__main__":
    main()
