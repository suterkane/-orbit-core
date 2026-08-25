const assert = require('node:assert/strict');
const { parseVoiceIntent } = require('../interface/app/voice-core.js');

assert.deepEqual(parseVoiceIntent('Zeig mir meine Aufgaben'), { type: 'view', target: 'inbox' });
assert.deepEqual(parseVoiceIntent('Öffne die Zentrale'), { type: 'view', target: 'dashboard' });
assert.deepEqual(parseVoiceIntent('Neue Aufgabe Zahnarzt anrufen'), { type: 'capture', category: 'task', text: 'Zahnarzt anrufen' });
assert.deepEqual(parseVoiceIntent('Merke dir Idee für das neue Interface'), { type: 'capture', category: 'idea', text: 'für das neue Interface' });
assert.deepEqual(parseVoiceIntent('Wie ist der Systemstatus'), { type: 'status' });
assert.deepEqual(parseVoiceIntent('Stopp Friday'), { type: 'stop' });
assert.deepEqual(parseVoiceIntent('Erzähl mir etwas über Quantencomputer'), { type: 'unknown', text: 'Erzähl mir etwas über Quantencomputer' });

console.log('7 Voice Core intent tests passed');
