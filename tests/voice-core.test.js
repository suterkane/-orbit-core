const assert = require('node:assert/strict');
const { parseVoiceIntent, runContextAction } = require('../interface/app/voice-core.js');

assert.deepEqual(parseVoiceIntent('Zeig mir meine Aufgaben'), { type: 'view', target: 'inbox' });
assert.deepEqual(parseVoiceIntent('Öffne die Zentrale'), { type: 'view', target: 'dashboard' });
assert.deepEqual(parseVoiceIntent('Neue Aufgabe Zahnarzt anrufen'), { type: 'capture', category: 'task', text: 'Zahnarzt anrufen' });
assert.deepEqual(parseVoiceIntent('Merke dir Idee für das neue Interface'), { type: 'capture', category: 'idea', text: 'für das neue Interface' });
assert.deepEqual(parseVoiceIntent('Wie ist der Systemstatus'), { type: 'status' });
assert.deepEqual(parseVoiceIntent('Stopp Friday'), { type: 'stop' });
assert.deepEqual(parseVoiceIntent('Mach sie wichtig'), { type: 'context', action: 'mark-important' });
assert.deepEqual(parseVoiceIntent('Setze die Priorität'), { type: 'context', action: 'mark-important' });
assert.deepEqual(parseVoiceIntent('Erzähl mir etwas über Quantencomputer'), { type: 'unknown', text: 'Erzähl mir etwas über Quantencomputer' });

const missing = runContextAction({ action: 'mark-important' }, { lastEntryId: '' }, { markImportant: () => true });
assert.deepEqual(missing, { ok: false, reply: 'Mir fehlt der vorherige Bezug.', replyKey: 'missingContext' });
let markedId = '';
const marked = runContextAction({ action: 'mark-important' }, { lastEntryId: 'entry-42' }, { markImportant: id => { markedId = id; return true; } });
assert.equal(markedId, 'entry-42');
assert.deepEqual(marked, { ok: true, reply: 'Priorität gesetzt.', replyKey: 'important' });

console.log('11 Voice Core dialog tests passed');
