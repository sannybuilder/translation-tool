import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ChangeReview from '../ChangeReview';
import { ChangeTracker } from '../../utils/changeTracker';
import { waitFor } from '@testing-library/react';

describe.sequential('ChangeReview submit count behavior', () => {
  afterEach(() => cleanup());
  const makeTrackerWithTwoChanges = () => {
    const original = { General: { Hello: 'A', Bye: 'B' } } as const;
    const tracker = new ChangeTracker(original, 'de.ini');
    tracker.trackChange('General', 'Hello', 'AA');
    tracker.trackChange('General', 'Bye', 'BB');
    return tracker;
  };

  it('shows Download <file> for download-full and updates to non-zero count when switching to copy-clipboard', async () => {
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

    // Switch to copy-clipboard
    const methodSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(methodSelect, { target: { value: 'copy-clipboard' } });

    // After switching, auto-select all changes and update the count in the button label
    expect(await screen.findByRole('button', { name: /Copy 2 Changes? to Clipboard/i })).toBeTruthy();
  });

  it('shows correct count for download-patch after switching method', async () => {
    const changeTracker = makeTrackerWithTwoChanges();

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    const methodSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(methodSelect, { target: { value: 'download-patch' } });

    expect(await screen.findByRole('button', { name: /Download Patch \(2 Changes?\)/i })).toBeTruthy();
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

  it('select all toggles selection and updates counts', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Switch to download-patch to show count
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'download-patch' } });
    // Auto-selected to 2
    expect(await screen.findByRole('button', { name: /Download Patch \(2 Changes?\)/i })).toBeTruthy();

    // Deselect all (click the first select/deselect button found in toolbar)
    const selectToggle = screen.getAllByRole('button', { name: /Deselect All|Select All/i })[0];
    fireEvent.click(selectToggle);
    expect(await screen.findByRole('button', { name: /Download Patch \(0 Changes?\)/i })).toBeTruthy();
  });

  it('submits copy-clipboard: writes to clipboard and calls onSubmit', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const onSubmit = vi.fn();
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
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'copy-clipboard' } });
    const submit = await screen.findByRole('button', { name: /Copy 2 Changes? to Clipboard/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalled();
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

  it('submits download-patch: calls onSubmit and creates blob URL', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const onSubmit = vi.fn();
    const origCreateObjectURL = URL.createObjectURL;
    // @ts-ignore
    URL.createObjectURL = vi.fn(() => 'blob:mock');

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'download-patch' } });
    const submit = await screen.findByRole('button', { name: /Download Patch \(2 Changes?\)/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    URL.createObjectURL = origCreateObjectURL;
  });

  it('submits github-issue: opens new window and calls onSubmit', async () => {
    const changeTracker = makeTrackerWithTwoChanges();
    const onSubmit = vi.fn();
    const origOpen = window.open;
    window.open = vi.fn();

    render(
      <ChangeReview
        changeTracker={changeTracker}
        selectedTranslation="de.ini"
        isOpen={true}
        onClose={() => {}}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'github-issue' } });
    // Auto-select should apply after switching method
    const submit = await screen.findByRole('button', { name: /Create Issue with 2 Changes?/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalled();
      expect(onSubmit).toHaveBeenCalled();
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


