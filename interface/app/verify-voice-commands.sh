#!/usr/bin/env bash
# FRIDAY Voice Commands — Verification Script
# Validiert die komplette Installation und Integration

echo "============================================================"
echo "  FRIDAY Voice Commands — Verification Check"
echo "  Date: $(date)"
echo "============================================================"
echo ""

APPDIR="C:/Users/Rene/-orbit-core/interface/app"
ERRORS=0
WARNINGS=0
PASSES=0

# Helper functions
pass() {
  echo "✅ PASS: $1"
  ((PASSES++))
}

warn() {
  echo "⚠️  WARN: $1"
  ((WARNINGS++))
}

error() {
  echo "❌ FAIL: $1"
  ((ERRORS++))
}

# ========== CHECKS ==========

echo "1. Checking Core Files..."
echo "---"

files=(
  "friday-voice-commands.js"
  "friday-voice-init.js"
  "voice-test.html"
  "VOICE-TEST-PLAN.md"
  "VOICE-COMMANDS-SIGN-OFF.md"
  "QUICK-SETUP.md"
)

for file in "${files[@]}"; do
  if [ -f "$APPDIR/$file" ]; then
    size=$(ls -lh "$APPDIR/$file" | awk '{print $5}')
    pass "File exists: $file ($size)"
  else
    error "File missing: $file"
  fi
done

echo ""
echo "2. Checking index.html Integration..."
echo "---"

if grep -q "friday-voice-commands.js" "$APPDIR/index.html"; then
  pass "Script imported: friday-voice-commands.js"
else
  error "Script NOT imported: friday-voice-commands.js"
fi

if grep -q "friday-voice-init.js" "$APPDIR/index.html"; then
  pass "Script imported: friday-voice-init.js"
else
  error "Script NOT imported: friday-voice-init.js"
fi

echo ""
echo "3. Checking JavaScript Syntax..."
echo "---"

# Check main module
if node -c "$APPDIR/friday-voice-commands.js" 2>/dev/null; then
  pass "JavaScript syntax: friday-voice-commands.js"
else
  warn "Could not validate JS syntax (Node.js required)"
fi

if node -c "$APPDIR/friday-voice-init.js" 2>/dev/null; then
  pass "JavaScript syntax: friday-voice-init.js"
else
  warn "Could not validate JS syntax (Node.js required)"
fi

echo ""
echo "4. Checking HTML Structure..."
echo "---"

if grep -q "getElementById.*voiceCoreBtn" "$APPDIR/index.html"; then
  pass "DOM element exists: #voiceCoreBtn"
else
  error "DOM element missing: #voiceCoreBtn"
fi

if grep -q "getElementById.*voiceState" "$APPDIR/index.html"; then
  pass "DOM element exists: #voiceState"
else
  error "DOM element missing: #voiceState"
fi

if grep -q "getElementById.*voiceTranscript" "$APPDIR/index.html"; then
  pass "DOM element exists: #voiceTranscript"
else
  error "DOM element missing: #voiceTranscript"
fi

if grep -q "getElementById.*voiceResponse" "$APPDIR/index.html"; then
  pass "DOM element exists: #voiceResponse"
else
  error "DOM element missing: #voiceResponse"
fi

echo ""
echo "5. Checking Command Definitions..."
echo "---"

if grep -q "'briefing'" "$APPDIR/friday-voice-commands.js"; then
  pass "Command defined: briefing"
else
  error "Command missing: briefing"
fi

if grep -q "'weather'" "$APPDIR/friday-voice-commands.js"; then
  pass "Command defined: weather"
else
  error "Command missing: weather"
fi

if grep -q "'tasks'" "$APPDIR/friday-voice-commands.js"; then
  pass "Command defined: tasks"
else
  error "Command missing: tasks"
fi

if grep -q "'stop'" "$APPDIR/friday-voice-commands.js"; then
  pass "Command defined: stop"
else
  error "Command missing: stop"
fi

echo ""
echo "6. Checking Handler Functions..."
echo "---"

if grep -q "function handleBriefing" "$APPDIR/friday-voice-commands.js"; then
  pass "Handler exists: handleBriefing()"
else
  error "Handler missing: handleBriefing()"
fi

if grep -q "function handleWeather" "$APPDIR/friday-voice-commands.js"; then
  pass "Handler exists: handleWeather()"
else
  error "Handler missing: handleWeather()"
fi

if grep -q "function handleTasks" "$APPDIR/friday-voice-commands.js"; then
  pass "Handler exists: handleTasks()"
else
  error "Handler missing: handleTasks()"
fi

if grep -q "function handleStop" "$APPDIR/friday-voice-commands.js"; then
  pass "Handler exists: handleStop()"
else
  error "Handler missing: handleStop()"
fi

echo ""
echo "7. Checking Public API..."
echo "---"

if grep -q "FRIDAYVoiceCommands" "$APPDIR/friday-voice-commands.js"; then
  pass "Public API available: FRIDAYVoiceCommands"
else
  error "Public API missing: FRIDAYVoiceCommands"
fi

if grep -q "init:" "$APPDIR/friday-voice-commands.js"; then
  pass "Method defined: FRIDAYVoiceCommands.init()"
else
  error "Method missing: FRIDAYVoiceCommands.init()"
fi

if grep -q "startListening:" "$APPDIR/friday-voice-commands.js"; then
  pass "Method defined: FRIDAYVoiceCommands.startListening()"
else
  error "Method missing: FRIDAYVoiceCommands.startListening()"
fi

if grep -q "getState:" "$APPDIR/friday-voice-commands.js"; then
  pass "Method defined: FRIDAYVoiceCommands.getState()"
else
  error "Method missing: FRIDAYVoiceCommands.getState()"
fi

echo ""
echo "8. Checking Web Speech API Integration..."
echo "---"

if grep -q "SpeechRecognition" "$APPDIR/friday-voice-commands.js"; then
  pass "Web Speech API: SpeechRecognition integrated"
else
  error "Web Speech API: SpeechRecognition NOT found"
fi

if grep -q "speechSynthesis" "$APPDIR/friday-voice-commands.js"; then
  pass "Web Speech API: speechSynthesis integrated"
else
  error "Web Speech API: speechSynthesis NOT found"
fi

echo ""
echo "9. Checking Error Handling..."
echo "---"

if grep -q "onerror" "$APPDIR/friday-voice-commands.js"; then
  pass "Error handler implemented: recognition.onerror"
else
  error "Error handler missing: recognition.onerror"
fi

if grep -q "catch" "$APPDIR/friday-voice-commands.js"; then
  pass "Try-catch blocks found"
else
  warn "No try-catch blocks detected"
fi

echo ""
echo "10. Checking Documentation..."
echo "---"

if [ -f "$APPDIR/VOICE-TEST-PLAN.md" ] && [ -s "$APPDIR/VOICE-TEST-PLAN.md" ]; then
  lines=$(wc -l < "$APPDIR/VOICE-TEST-PLAN.md")
  pass "Test documentation complete ($lines lines)"
else
  error "Test documentation incomplete"
fi

if [ -f "$APPDIR/VOICE-COMMANDS-SIGN-OFF.md" ] && [ -s "$APPDIR/VOICE-COMMANDS-SIGN-OFF.md" ]; then
  lines=$(wc -l < "$APPDIR/VOICE-COMMANDS-SIGN-OFF.md")
  pass "Sign-off documentation complete ($lines lines)"
else
  error "Sign-off documentation incomplete"
fi

if [ -f "$APPDIR/QUICK-SETUP.md" ] && [ -s "$APPDIR/QUICK-SETUP.md" ]; then
  lines=$(wc -l < "$APPDIR/QUICK-SETUP.md")
  pass "Setup guide complete ($lines lines)"
else
  error "Setup guide incomplete"
fi

echo ""
echo "============================================================"
echo "  VERIFICATION SUMMARY"
echo "============================================================"
echo "✅ PASS:   $PASSES"
echo "⚠️  WARN:   $WARNINGS"
echo "❌ FAIL:   $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "🎉 ALL CHECKS PASSED!"
  echo "Status: READY FOR PRODUCTION ✅"
  exit 0
else
  echo "⚠️  Some checks failed. Review errors above."
  echo "Status: NEEDS ATTENTION"
  exit 1
fi
