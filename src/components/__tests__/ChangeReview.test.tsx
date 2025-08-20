import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ChangeReview from '../ChangeReview';
import { ChangeTracker } from '../../utils/changeTracker';
import { waitFor } from '@testing-library/react';

describe.sequential('ChangeReview submit count behavior', () => {
  afterEach(() => cleanup());
  
  // Mock window.confirm to always return true
  beforeAll(() => {
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: vi.fn(() => true),
    });
  });

  const makeTrackerWithTwoChanges = () => {
    const original = { General: { Hello: 'A', Bye: 'B' } } as const;
    const tracker = new ChangeTracker(original, 'de.ini', undefined);
    tracker.trackChange('General', 'Hello', 'AA');
    tracker.trackChange('General', 'Bye', 'BB');
    return tracker;
  };

  it('shows Download <file> button and action buttons', async () => {
    const changeTracker = makeTrackerWithTwoChanges();

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Initially shows download-full label
    expect(screen.getAllByRole('button', { name: /Download de\.ini/i })[0]).toBeTruthy();

    // Shows action buttons
    expect(screen.getByRole('button', { name: /Copy To Clipboard/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Download Patch/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Create GitHub Issue/i })).toBeTruthy();
  });



  it('undoes a single change via Undo button and calls onUndo', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const onUndo = vi.fn();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
        onUndo={onUndo}
      />
    );

    // Click undo for Hello
    const undoHello = await screen.findByTitle('Undo change to Hello');
    fireEvent.click(undoHello);

    expect(onUndo).toHaveBeenCalledWith('General', 'Hello', 'A');
    // Wait until only one change card remains (the other key 'Bye')
    await waitFor(() => {
      expect(screen.getAllByText(/\+ BB|\+ BB/i).length).toBeGreaterThan(0);
    });
  });

  it('undoes an entire section and calls onUndo for each change', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const onUndo = vi.fn();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
        onUndo={onUndo}
      />
    );

    const undoSection = await screen.findByRole('button', { name: /Undo Section/i });
    fireEvent.click(undoSection);

    expect(onUndo).toHaveBeenCalledTimes(2);
  });

  it('accepts a single change via Accept button', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Click accept for Hello
    const acceptHello = await screen.findByTitle('Accept change to Hello');
    fireEvent.click(acceptHello);

    // The change should be marked as accepted and removed from unsubmitted changes
    await waitFor(() => {
      expect(changeTracker.getUnsubmittedChanges().length).toBe(1);
    });
  });

  it('accepts an entire section via Accept Section button', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    const acceptSection = await screen.findByRole('button', { name: /Accept Section/i });
    fireEvent.click(acceptSection);

    // All changes in the section should be marked as accepted
    await waitFor(() => {
      expect(changeTracker.getUnsubmittedChanges().length).toBe(0);
    });
  });

  it('accepts all changes via Accept All button', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    const acceptAll = await screen.findByRole('button', { name: /Accept All/i });
    fireEvent.click(acceptAll);

    // All changes should be marked as accepted
    await waitFor(() => {
      expect(changeTracker.getUnsubmittedChanges().length).toBe(0);
    });
  });

  it('undoes all changes after confirm and clears list', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const onUndo = vi.fn();
    const originalConfirm = window.confirm;
    (window as any).confirm = vi.fn(() => true);

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
        onUndo={onUndo}
      />
    );

    const undoAll = await screen.findByRole('button', { name: /Undo All/i });
    fireEvent.click(undoAll);

    expect(onUndo).toHaveBeenCalledTimes(2);

    // restore
    window.confirm = originalConfirm;
  });

  it('select all toggles selection', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Initially no changes are selected
    const selectToggle = screen.getAllByRole('button', { name: /Deselect All|Select All/i })[0];
    expect(selectToggle.textContent).toContain('Select All');

    // Click to select all
    fireEvent.click(selectToggle);
    expect(selectToggle.textContent).toContain('Deselect All');

    // Click again to deselect all
    fireEvent.click(selectToggle);
    expect(selectToggle.textContent).toContain('Select All');
  });

  it('copy-clipboard button writes to clipboard', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const writeText = vi.fn().mockResolvedValue(void 0);
    const originalClipboardDesc = Object.getOwnPropertyDescriptor(navigator as any, 'clipboard');
    Object.defineProperty(navigator as any, 'clipboard', { value: { writeText }, configurable: true });
    const originalAlert = window.alert;
    window.alert = vi.fn();

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Select all changes first
    const selectAllButton = screen.getByRole('button', { name: /Select All/i });
    fireEvent.click(selectAllButton);

    // Click the clipboard button
    const clipboardButton = screen.getByRole('button', { name: /Copy To Clipboard/i });
    fireEvent.click(clipboardButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    // restore
    if (originalClipboardDesc) {
      Object.defineProperty(navigator as any, 'clipboard', originalClipboardDesc);
    } else {
      // remove our mock if there was none
      // @ts-ignore
      delete (navigator as any).clipboard;
    }
    window.alert = originalAlert;
  });

  it('download-patch button creates blob URL', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const origCreateObjectURL = URL.createObjectURL;
    // @ts-ignore
    URL.createObjectURL = vi.fn(() => 'blob:mock');

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Select all changes first
    const selectAllButton = screen.getByRole('button', { name: /Select All/i });
    fireEvent.click(selectAllButton);

    // Click the patch button
    const patchButton = screen.getByRole('button', { name: /Download Patch/i });
    fireEvent.click(patchButton);

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    URL.createObjectURL = origCreateObjectURL;
  });

  it('github-issue button opens new window', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const origOpen = window.open;
    window.open = vi.fn();

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Select all changes first
    const selectAllButton = screen.getByRole('button', { name: /Select All/i });
    fireEvent.click(selectAllButton);

    // Click the issue button
    const issueButton = screen.getByRole('button', { name: /Create GitHub Issue/i });
    fireEvent.click(issueButton);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalled();
    });

    window.open = origOpen;
  });

  it('download-full calls onDownloadFullFile directly', () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const onDownloadFullFile = vi.fn();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
        onDownloadFullFile={onDownloadFullFile}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Download de\.ini/i })[0]);
    expect(onDownloadFullFile).toHaveBeenCalled();
  });
});


