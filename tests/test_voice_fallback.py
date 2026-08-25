from pathlib import Path

ROOT = Path(__file__).parents[1]
APP = ROOT / "interface" / "app"


def test_local_neural_voice_precedes_metallic_browser_fallback():
    source = (APP / "start-v2.js").read_text(encoding="utf-8")
    assert "LOCAL_NEURAL_VOICE_URL" in source
    assert "speakLocalNeural" in source
    local_call = "const localPlayed=await speakLocalNeural"
    browser_call = "return speakBrowser(text,{onend})"
    assert local_call in source
    assert browser_call in source
    assert source.index(local_call) < source.index(browser_call)


def test_local_neural_voice_asset_is_bundled():
    asset = APP / "assets" / "friday-neural-de.ogg"
    assert asset.exists()
    assert asset.stat().st_size > 10_000
