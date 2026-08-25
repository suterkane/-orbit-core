const assert = require('node:assert/strict');
const { parseVoiceIntent, runContextAction, createReplySelector } = require('../interface/app/voice-core.js');

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

const expired = runContextAction({ action: 'mark-important' }, { lastEntryId: 'entry-old', lastEntryAt: 1000 }, { markImportant: () => true }, { now: 1000 + 15 * 60 * 1000 + 1 });
assert.deepEqual(expired, { ok: false, reply: 'Der Bezug ist inzwischen abgelaufen.', replyKey: 'missingContext' });

const chooseReply = createReplySelector({ random: () => 0 });
const firstStatus = chooseReply('status-clear');
const secondStatus = chooseReply('status-clear');
assert.notEqual(firstStatus, secondStatus, 'consecutive replies must vary');
assert.match([firstStatus, secondStatus].join(' '), /Katastrophe|verdächtig|ausnahmsweise/i, 'clear status may include restrained dry wit');
assert.equal(chooseReply('captured', { serious: true }).includes('Katastrophe'), false, 'serious situations must suppress sarcasm');
for(const key of ['dashboard','inbox','captured','status-clear']){
  for(let i=0;i<6;i++)assert.ok(chooseReply(key).length<=72, `${key} replies must stay concise`);
}

console.log('20 Voice Core dialog tests passed');
