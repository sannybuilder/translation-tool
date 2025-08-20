import { describe, it, expect } from 'vitest';
import { ChangeTracker } from '../changeTracker';
import type { TrackedChange } from '../../types/changeTracking';

describe('ChangeTracker (in-memory)', () => {
  const original = { Section: { Key: 'A' } } as const;

  it('tracks changes and clears when value reverts to original', () => {
    const tracker = new ChangeTracker(original, 'file.ini', undefined);
    expect(tracker.getUnsubmittedChanges().length).toBe(0);

    tracker.trackChange('Section', 'Key', 'B');
    expect(tracker.getUnsubmittedChanges().length).toBe(1);

    // revert
    tracker.trackChange('Section', 'Key', 'A');
    expect(tracker.getUnsubmittedChanges().length).toBe(0);
  });

  it('undoChange returns original value and removes the change', () => {
    const tracker = new ChangeTracker(original, 'file.ini', undefined);
    tracker.trackChange('Section', 'Key', 'B');
    const id = 'Section-Key';
    expect(tracker.getUnsubmittedChanges().length).toBe(1);
    const reverted = tracker.undoChange(id);
    expect(reverted).toBe('A');
    expect(tracker.getUnsubmittedChanges().length).toBe(0);
  });

  it('clearAll removes all tracked changes', () => {
    const tracker = new ChangeTracker(original, 'file.ini', undefined);
    tracker.trackChange('Section', 'Key', 'B');
    tracker.trackChange('Section', 'Other', 'X');
    expect(tracker.getUnsubmittedChanges().length).toBe(2);
    tracker.clearAll();
    expect(tracker.getUnsubmittedChanges().length).toBe(0);
  });

  it('setChangesFromArray hydrates from persisted list', () => {
    const tracker = new ChangeTracker(original, 'file.ini', undefined);
    tracker.setChangesFromArray([
      {
        id: 'Section-Key',
        section: 'Section',
        key: 'Key',
        originalValue: 'A',
        newValue: 'B',
        timestamp: Date.now(),
        submitted: false,
      },
    ]);
    const changes = tracker.getUnsubmittedChanges();
    expect(changes.length).toBe(1);
    expect(changes[0].newValue).toBe('B');
  });

  it('calls callback when changes are accepted', () => {
    let acceptedChanges: TrackedChange[] = [];
    const tracker = new ChangeTracker(original, 'file.ini', (changes) => {
      acceptedChanges = changes;
    });
    
    tracker.trackChange('Section', 'Key', 'B');
    tracker.acceptChange('Section-Key');
    
    expect(acceptedChanges.length).toBe(1);
    expect(acceptedChanges[0].id).toBe('Section-Key');
    expect(acceptedChanges[0].submitted).toBe(true);
  });
});


