import test from 'node:test';
import assert from 'node:assert/strict';
import useAppStore from '../src/stores/useAppStore.js';

test('realtime setters apply functional updates to collections instead of storing functions', () => {
  const actions = useAppStore.getState();
  for (const [field, action] of [['arsipList', 'setArsipList'], ['klasifikasiList', 'setKlasifikasiList'], ['labels', 'setLabels']]) {
    actions[action]([{ id: 'existing', name: 'Before' }]);
    actions[action](rows => [{ id: 'inserted' }, ...rows]);
    actions[action](rows => rows.map(row => row.id === 'existing' ? { ...row, name: 'After' } : row));
    actions[action](rows => rows.filter(row => row.id !== 'inserted'));
    assert.deepEqual(useAppStore.getState()[field], [{ id: 'existing', name: 'After' }]);
    actions[action]([]);
    assert.deepEqual(useAppStore.getState()[field], []);
  }
});
