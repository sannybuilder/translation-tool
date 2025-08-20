import React, { useState, useEffect } from 'react';
import { ChangeTracker } from '../utils/changeTracker';
import type { TrackedChange, SubmissionOptions } from '../types/changeTracking';

interface ChangeReviewProps {
  changeTracker: ChangeTracker | null;
  selectedTranslation: string;
  onSubmit?: (changes: TrackedChange[], options: SubmissionOptions) => void;
  refreshTrigger?: number; // trigger re-compute
  isOpen: boolean;
  onClose: () => void;
  onDownloadFullFile?: () => void;
  onUndo?: (section: string, key: string, originalValue: string) => void;
  isMobile?: boolean;
}

const ChangeReview: React.FC<ChangeReviewProps> = ({
  changeTracker,
  selectedTranslation,
  onSubmit,
  refreshTrigger,
  isOpen,
  onClose,
  onDownloadFullFile,
  onUndo,
  isMobile = false,
}) => {
  const [unsubmittedChanges, setUnsubmittedChanges] = useState<TrackedChange[]>([]);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [submissionType, setSubmissionType] = useState<SubmissionOptions['type']>('download-full');
  const [groupBySection, setGroupBySection] = useState(true);
  const [stats, setStats] = useState({ total: 0, submitted: 0, pending: 0, sections: 0 });

  useEffect(() => {
    if (changeTracker) {
      const changes = changeTracker.getUnsubmittedChanges();
      setUnsubmittedChanges(changes);
      setStats(changeTracker.getStats());
    }
  }, [changeTracker, refreshTrigger]);

  useEffect(() => {
    if (isOpen && changeTracker) {
      const changes = changeTracker.getUnsubmittedChanges();
      setUnsubmittedChanges(changes);
      setStats(changeTracker.getStats());
    }
  }, [isOpen, changeTracker]);

  // When switching to a partial submission method, auto-select all if nothing is selected
  useEffect(() => {
    if (submissionType !== 'download-full' && selectedChanges.size === 0 && unsubmittedChanges.length > 0) {
      setSelectedChanges(new Set(unsubmittedChanges.map(c => c.id)));
    }
  }, [submissionType, unsubmittedChanges]);

  const handleSelectAll = () => {
    if (selectedChanges.size === unsubmittedChanges.length) {
      setSelectedChanges(new Set());
    } else {
      setSelectedChanges(new Set(unsubmittedChanges.map(c => c.id)));
    }
  };

  const handleSelectSection = (section: string) => {
    const sectionChanges = unsubmittedChanges.filter(c => c.section === section);
    const sectionIds = sectionChanges.map(c => c.id);
    const allSelected = sectionIds.every(id => selectedChanges.has(id));
    if (allSelected) {
      const newSelected = new Set(selectedChanges);
      sectionIds.forEach(id => newSelected.delete(id));
      setSelectedChanges(newSelected);
    } else {
      const newSelected = new Set(selectedChanges);
      sectionIds.forEach(id => newSelected.add(id));
      setSelectedChanges(newSelected);
    }
  };

  const handleToggleChange = (changeId: string) => {
    const newSelected = new Set(selectedChanges);
    if (newSelected.has(changeId)) newSelected.delete(changeId); else newSelected.add(changeId);
    setSelectedChanges(newSelected);
  };

  const handleUndoChange = (changeId: string, section: string, key: string) => {
    if (!changeTracker || !onUndo) return;
    const originalValue = changeTracker.undoChange(changeId);
    if (originalValue !== null) {
      onUndo(section, key, originalValue);
      setUnsubmittedChanges(changeTracker.getUnsubmittedChanges());
      setStats(changeTracker.getStats());
      const newSelected = new Set(selectedChanges);
      newSelected.delete(changeId);
      setSelectedChanges(newSelected);
    }
  };

  const handleUndoSection = (section: string) => {
    if (!changeTracker || !onUndo) return;
    const restoredValues = changeTracker.undoSection(section);
    restoredValues.forEach((originalValue, key) => onUndo(section, key, originalValue));
    if (restoredValues.size > 0) {
      setUnsubmittedChanges(changeTracker.getUnsubmittedChanges());
      setStats(changeTracker.getStats());
      const newSelected = new Set(selectedChanges);
      unsubmittedChanges.filter(c => c.section === section).forEach(c => newSelected.delete(c.id));
      setSelectedChanges(newSelected);
    }
  };

  const handleUndoAll = () => {
    if (!changeTracker || !onUndo) return;
    const changeCount = unsubmittedChanges.length;
    const message = `Are you sure you want to undo all ${changeCount} change${changeCount !== 1 ? 's' : ''}? This action cannot be reversed.`;
    if (!window.confirm(message)) return;
    const restoredValues = changeTracker.undoAll();
    restoredValues.forEach((sectionMap, section) => {
      sectionMap.forEach((originalValue, key) => onUndo(section, key, originalValue));
    });
    if (restoredValues.size > 0) {
      setUnsubmittedChanges([]);
      setStats(changeTracker.getStats());
      setSelectedChanges(new Set());
    }
  };

  const handleSubmitChanges = async () => {
    if (submissionType === 'download-full') {
      if (onDownloadFullFile) onDownloadFullFile();
      return;
    }
    if (!changeTracker || selectedChanges.size === 0) return;
    const changesToSubmit = unsubmittedChanges.filter(c => selectedChanges.has(c.id));
    const options: SubmissionOptions = { type: submissionType, format: submissionType === 'copy-clipboard' ? 'ini-snippet' : 'diff', includeContext: true };
    if (submissionType === 'copy-clipboard') {
      const patch = changeTracker.generatePatch(Array.from(selectedChanges), 'ini-snippet');
      await navigator.clipboard.writeText(patch);
      alert(`Copied ${selectedChanges.size} changes to clipboard!`);
    } else if (submissionType === 'download-patch') {
      const patch = changeTracker.generatePatch(Array.from(selectedChanges), 'diff');
      const blob = new Blob([patch], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTranslation.replace('.ini', '')}_partial_${Date.now()}.patch`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (submissionType === 'github-issue') {
      const patch = changeTracker.generatePatch(Array.from(selectedChanges), 'ini-snippet');
      const issueTitle = `Translation update for ${selectedTranslation}: ${selectedChanges.size} changes`;
      const issueBody = `## Partial Translation Update\n\n**File:** ${selectedTranslation}\n**Changes:** ${selectedChanges.size}\n**Sections affected:** ${new Set(changesToSubmit.map(c => c.section)).size}\n\n### Changes:\n\`\`\`ini\n${patch}\n\`\`\`\n\n---\n*Submitted using Translation Tool Partial Update feature*`;
      const githubUrl = `https://github.com/sannybuilder/translations/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
      window.open(githubUrl, '_blank');
    }
    changeTracker.clearAll();
    setSelectedChanges(new Set());
    setUnsubmittedChanges([]);
    setStats(changeTracker.getStats());
    if (onSubmit) onSubmit(changesToSubmit, options);
  };

  const groupedChanges = groupBySection
    ? unsubmittedChanges.reduce((acc, change) => {
        if (!acc[change.section]) acc[change.section] = [];
        acc[change.section].push(change);
        return acc;
      }, {} as Record<string, TrackedChange[]>)
    : { 'All Changes': unsubmittedChanges };

  if (!changeTracker) return null;

  return (
    <>
      {isOpen && isMobile && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 998 }}
          onClick={onClose}
        />
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: isMobile ? '100%' : '400px', backgroundColor: '#1a1a1a',
            borderLeft: !isMobile ? '1px solid #333' : 'none', zIndex: 999, display: 'flex', flexDirection: 'column',
            boxShadow: !isMobile ? '-4px 0 12px rgba(0,0,0,0.5)' : 'none', transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out'
          }}
        >
          <div style={{ padding: isMobile ? '0.75rem' : '1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>Review Changes</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: isMobile ? '0.75rem' : '1rem', backgroundColor: '#2a2a2a', borderBottom: '1px solid #333' }}>
            <div style={{ display: 'flex', gap: '1rem', fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#888' }}>
              <span>Pending: <strong style={{ color: '#4CAF50' }}>{stats.pending}</strong></span>
              <span>Sections: <strong style={{ color: '#888' }}>{stats.sections}</strong></span>
            </div>
          </div>

          <div style={{ padding: isMobile ? '0.75rem' : '1rem', borderBottom: '1px solid #333' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>Submission Method:</label>
            <select value={submissionType} onChange={(e) => setSubmissionType(e.target.value as SubmissionOptions['type'])} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '0.9rem' }}>
              <option value="download-full">Download Full File</option>
              <option value="copy-clipboard">Copy to Clipboard</option>
              <option value="download-patch">Download Patch File</option>
              <option value="github-issue">Create GitHub Issue</option>
            </select>
          </div>

          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid #333', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleSelectAll} style={{ padding: isMobile ? '0.4rem 0.6rem' : '0.25rem 0.75rem', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: isMobile ? '0.8rem' : '0.85rem', cursor: 'pointer' }}>
              {selectedChanges.size === unsubmittedChanges.length ? (isMobile ? 'Deselect' : 'Deselect All') : (isMobile ? 'Select' : 'Select All')}
            </button>
            {unsubmittedChanges.length > 0 && (
              <button onClick={handleUndoAll} style={{ padding: isMobile ? '0.4rem 0.6rem' : '0.25rem 0.75rem', backgroundColor: '#2a2a2a', color: '#bbb', border: '1px solid #555', borderRadius: '4px', fontSize: isMobile ? '0.8rem' : '0.85rem', cursor: 'pointer' }} title="Undo all changes">Undo All</button>
            )}
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: isMobile ? '0.8rem' : '0.85rem' }}>
              <input type="checkbox" checked={groupBySection} onChange={(e) => setGroupBySection(e.target.checked)} />
              {isMobile ? 'Group' : 'Group by section'}
            </label>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1rem', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            {Object.entries(groupedChanges).map(([sectionName, changes]) => (
              <div key={sectionName} style={{ marginBottom: '1.5rem' }}>
                {groupBySection && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }} onClick={() => handleSelectSection(sectionName)}>
                      <input type="checkbox" checked={changes.every(c => selectedChanges.has(c.id))} onChange={() => {}} style={{ cursor: 'pointer' }} />
                      <h4 style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>[{sectionName}] ({changes.length})</h4>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleUndoSection(sectionName); }} style={{ padding: '0.2rem 0.5rem', backgroundColor: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: '3px', fontSize: '0.75rem', cursor: 'pointer' }} title={`Undo all changes in ${sectionName}`}>Undo Section</button>
                  </div>
                )}
                {changes.map((change) => (
                  <div key={change.id} style={{ padding: isMobile ? '0.5rem' : '0.75rem', marginBottom: '0.5rem', backgroundColor: selectedChanges.has(change.id) ? '#2a3a2a' : '#242424', border: `1px solid ${selectedChanges.has(change.id) ? '#4CAF50' : '#333'}`, borderRadius: '4px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', cursor: 'pointer' }} onClick={() => handleToggleChange(change.id)}>
                      <input type="checkbox" checked={selectedChanges.has(change.id)} onChange={() => {}} style={{ marginTop: '2px', cursor: 'pointer' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '0.8rem', fontFamily: 'monospace' }}>{change.key}</div>
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          {change.originalValue && (
                            <div style={{ color: '#ff4444', fontSize: isMobile ? '0.8rem' : '0.85rem', marginBottom: '0.25rem', wordBreak: 'break-word' }}>- {change.originalValue}</div>
                          )}
                          <div style={{ color: '#4CAF50', fontSize: isMobile ? '0.8rem' : '0.85rem', wordBreak: 'break-word' }}>+ {change.newValue}</div>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleUndoChange(change.id, change.section, change.key); }} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.15rem 0.4rem', backgroundColor: 'transparent', color: '#999', border: '1px solid #555', borderRadius: '3px', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s ease' }} title={`Undo change to ${change.key}`}>Undo</button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ padding: isMobile ? '0.75rem' : '1rem', borderTop: '1px solid #333' }}>
            <button
              onClick={handleSubmitChanges}
              disabled={submissionType !== 'download-full' && selectedChanges.size === 0}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: (submissionType === 'download-full' || selectedChanges.size > 0) ? '#4CAF50' : '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: (submissionType === 'download-full' || selectedChanges.size > 0) ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease' }}
            >
              {submissionType === 'copy-clipboard' && `Copy ${selectedChanges.size} Change${selectedChanges.size !== 1 ? 's' : ''} to Clipboard`}
              {submissionType === 'download-patch' && `Download Patch (${selectedChanges.size} Change${selectedChanges.size !== 1 ? 's' : ''})`}
              {submissionType === 'download-full' && `Download ${selectedTranslation}`}
              {submissionType === 'github-issue' && `Create Issue with ${selectedChanges.size} Change${selectedChanges.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChangeReview;


