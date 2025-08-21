import React, { useState, useEffect } from 'react';
import { ChangeTracker } from '../utils/changeTracker';
import type { TrackedChange } from '../types/changeTracking';

interface ChangeReviewProps {
  changeTracker: ChangeTracker | null;
  selectedTranslation: string;
  sourceMode: 'github' | 'local';
  localFileName?: string;
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
  sourceMode,
  localFileName,
  refreshTrigger,
  isOpen,
  onClose,
  onDownloadFullFile,
  onUndo,
  isMobile = false,
}) => {
  const [unsubmittedChanges, setUnsubmittedChanges] = useState<TrackedChange[]>([]);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [isExplanationDismissed, setIsExplanationDismissed] = useState(false);
  const [showExplanationPopup, setShowExplanationPopup] = useState(false);

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

  const handleAcceptChange = (changeId: string) => {
    if (!changeTracker) return;
    changeTracker.acceptChange(changeId);
    setUnsubmittedChanges(changeTracker.getUnsubmittedChanges());
    setStats(changeTracker.getStats());
    const newSelected = new Set(selectedChanges);
    newSelected.delete(changeId);
    setSelectedChanges(newSelected);
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

  const handleAcceptSection = (section: string) => {
    if (!changeTracker) return;
    changeTracker.acceptSection(section);
    setUnsubmittedChanges(changeTracker.getUnsubmittedChanges());
    setStats(changeTracker.getStats());
    const newSelected = new Set(selectedChanges);
    unsubmittedChanges.filter(c => c.section === section).forEach(c => newSelected.delete(c.id));
    setSelectedChanges(newSelected);
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

  const handleAcceptAll = () => {
    if (!changeTracker) return;
    const changeCount = unsubmittedChanges.length;
    const message = `Are you sure you want to accept all ${changeCount} change${changeCount !== 1 ? 's' : ''}?`;
    if (!window.confirm(message)) return;
    changeTracker.acceptAll();
    setUnsubmittedChanges(changeTracker.getUnsubmittedChanges());
    setStats(changeTracker.getStats());
    setSelectedChanges(new Set());
  };

  const handleSubmitChanges = () => {
    if (onDownloadFullFile) onDownloadFullFile();
  };

  const groupedChanges = unsubmittedChanges.reduce((acc, change) => {
    if (!acc[change.section]) acc[change.section] = [];
    acc[change.section].push(change);
    return acc;
  }, {} as Record<string, TrackedChange[]>);

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
             <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
               Review Changes {stats.pending > 0 && <span style={{ color: '#4CAF50', fontSize: '0.9em' }}>({stats.pending})</span>}
             </h3>
             <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                      </div>

                                           {/* Instructions - only show when there are active changes and not dismissed */}
            {stats.pending > 0 && !isExplanationDismissed && (
              <div style={{ padding: isMobile ? '0.75rem' : '1rem', backgroundColor: '#1f1f1f', borderBottom: '1px solid #333', position: 'relative' }}>
                <button
                  onClick={() => setIsExplanationDismissed(true)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: '0',
                    lineHeight: '1',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Dismiss explanation"
                >
                  ×
                </button>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: '#aaa', lineHeight: '1.4', paddingRight: '2rem' }}>
                  <strong>What does Accept do?</strong><br/>
                  When you <strong>Accept</strong> a change, it keeps the new value in your file but removes it from this review panel. You can always download the translation file with all accepted changes.
                </div>
              </div>
            )}

            {/* Popup explanation when clicking the help button */}
            {showExplanationPopup && (
              <div
                style={{
                  position: 'absolute',
                  top: '120px',
                  right: isMobile ? '10px' : '20px',
                  width: '250px',
                  padding: '0.75rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: '#aaa',
                  lineHeight: '1.4'
                }}
              >
                <button
                  onClick={() => setShowExplanationPopup(false)}
                  style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    padding: '0',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
                <strong>What does Accept do?</strong><br/>
                When you <strong>Accept</strong> a change, it keeps the new value in your file but removes it from this review panel. You can always download the translation file with all accepted changes.
              </div>
            )}

          {unsubmittedChanges.length > 0 && (
            <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid #333', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleSelectAll} style={{ padding: isMobile ? '0.4rem 0.6rem' : '0.25rem 0.75rem', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: isMobile ? '0.8rem' : '0.85rem', cursor: 'pointer' }}>
                {selectedChanges.size === unsubmittedChanges.length ? (isMobile ? 'Deselect' : 'Deselect All') : (isMobile ? 'Select' : 'Select All')}
              </button>
              <button onClick={handleUndoAll} style={{ padding: isMobile ? '0.4rem 0.6rem' : '0.25rem 0.75rem', backgroundColor: '#2a2a2a', color: '#bbb', border: '1px solid #555', borderRadius: '4px', fontSize: isMobile ? '0.8rem' : '0.85rem', cursor: 'pointer' }} title="Undo all changes">Undo All</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={handleAcceptAll} style={{ padding: isMobile ? '0.4rem 0.6rem' : '0.25rem 0.75rem', backgroundColor: '#4CAF50', color: '#fff', border: '1px solid #4CAF50', borderRadius: '4px', fontSize: isMobile ? '0.8rem' : '0.85rem', cursor: 'pointer' }} title="Accept all changes">Accept All</button>
                {isExplanationDismissed && (
                  <button
                    onClick={() => setShowExplanationPopup(!showExplanationPopup)}
                    style={{
                      padding: '0',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#2a2a2a',
                      color: '#888',
                      border: '1px solid #555',
                      borderRadius: '50%',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                    title="What does Accept do?"
                  >
                    ?
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1rem', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            {unsubmittedChanges.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                textAlign: 'center',
                padding: '2rem 1rem',
                color: '#888'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '1.1rem' : '1.25rem', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem',
                  color: '#4CAF50'
                }}>
                  You're caught up!
                </div>
                <div style={{ 
                  fontSize: isMobile ? '0.85rem' : '0.9rem', 
                  lineHeight: '1.4',
                  maxWidth: '280px'
                }}>
                  You can download the translation file with the changes applied or continue editing.
                </div>
              </div>
            ) : (
              Object.entries(groupedChanges).map(([sectionName, changes]) => (
              <div key={sectionName} style={{ marginBottom: '1.5rem' }}>
                {/* Section action buttons row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button onClick={(e) => { e.stopPropagation(); handleUndoSection(sectionName); }} style={{ padding: '0.2rem 0.5rem', backgroundColor: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: '3px', fontSize: '0.75rem', cursor: 'pointer' }} title={`Undo all changes in ${sectionName}`}>Undo Section</button>
                  <button onClick={(e) => { e.stopPropagation(); handleAcceptSection(sectionName); }} style={{ padding: '0.2rem 0.5rem', backgroundColor: '#4CAF50', color: '#fff', border: '1px solid #4CAF50', borderRadius: '3px', fontSize: '0.75rem', cursor: 'pointer' }} title={`Accept all changes in ${sectionName}`}>Accept Section</button>
                </div>
                {/* Section title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }} onClick={() => handleSelectSection(sectionName)}>
                    <input type="checkbox" checked={changes.every(c => selectedChanges.has(c.id))} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    <h4 style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>[{sectionName}] ({changes.length})</h4>
                  </div>
                </div>
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
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleAcceptChange(change.id); }} style={{ padding: '0.15rem 0.4rem', backgroundColor: '#4CAF50', color: '#fff', border: '1px solid #4CAF50', borderRadius: '3px', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s ease' }} title={`Accept change to ${change.key}`}>Accept</button>
                      <button onClick={(e) => { e.stopPropagation(); handleUndoChange(change.id, change.section, change.key); }} style={{ padding: '0.15rem 0.4rem', backgroundColor: 'transparent', color: '#999', border: '1px solid #555', borderRadius: '3px', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s ease' }} title={`Undo change to ${change.key}`}>Undo</button>
                    </div>
                  </div>
                ))}
              </div>
            ))
            )}
          </div>

          <div style={{ padding: isMobile ? '0.75rem' : '1rem', borderTop: '1px solid #333' }}>
            {/* Instructions for submission - only show when there are changes */}
            {unsubmittedChanges.length > 0 && (
              <>
                <div style={{ 
                  padding: '0.5rem 0.75rem', 
                  marginBottom: '0.75rem', 
                  backgroundColor: selectedChanges.size > 0 ? '#1f3a1f' : '#2a2a2a', 
                  border: `1px solid ${selectedChanges.size > 0 ? '#4CAF50' : '#444'}`, 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.85rem', 
                    color: selectedChanges.size > 0 ? '#4CAF50' : '#888',
                    fontWeight: selectedChanges.size > 0 ? 'bold' : 'normal'
                  }}>
                    {selectedChanges.size === 0 
                      ? 'Select changes above and then:' 
                      : `${selectedChanges.size} change${selectedChanges.size !== 1 ? 's' : ''} selected`
                    }
                  </div>
                </div>

                {/* Action buttons row */}
                <div style={{ 
                  display: 'flex', 
                  gap: isMobile ? '0.5rem' : '0.75rem', 
                  marginBottom: '0.75rem',
                  justifyContent: 'space-between'
                }}>
                  {/* Copy to Clipboard Button */}
                  <button
                    onClick={async () => {
                      if (!changeTracker || selectedChanges.size === 0) return;
                      const patch = changeTracker.generatePatch(Array.from(selectedChanges), 'ini-snippet');
                      await navigator.clipboard.writeText(patch);
                      alert(`Copied ${selectedChanges.size} changes to clipboard!`);
                    }}
                    disabled={selectedChanges.size === 0}
                    style={{ 
                      flex: 1,
                      aspectRatio: isMobile ? 'auto' : '1',
                      height: isMobile ? '60px' : 'auto',
                      padding: isMobile ? '0.5rem' : '0.75rem',
                      backgroundColor: selectedChanges.size > 0 ? '#1565C0' : '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      cursor: selectedChanges.size > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      flexDirection: isMobile ? 'row' : 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isMobile ? '0.25rem' : '0.25rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedChanges.size > 0) {
                        e.currentTarget.style.backgroundColor = '#0D47A1';
                        // e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChanges.size > 0) {
                        e.currentTarget.style.backgroundColor = '#1565C0';
                        // e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    title={`Copy ${selectedChanges.size} change${selectedChanges.size !== 1 ? 's' : ''} to clipboard`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                       Copy To Clipboard
                    </span>
                  </button>

                  {/* Download Patch Button */}
                  <button
                    onClick={() => {
                      if (!changeTracker || selectedChanges.size === 0) return;
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
                    }}
                    disabled={selectedChanges.size === 0}
                    style={{ 
                      flex: 1,
                      aspectRatio: isMobile ? 'auto' : '1',
                      height: isMobile ? '60px' : 'auto',
                      padding: isMobile ? '0.5rem' : '0.75rem',
                      backgroundColor: selectedChanges.size > 0 ? '#E65100' : '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      cursor: selectedChanges.size > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      flexDirection: isMobile ? 'row' : 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isMobile ? '0.25rem' : '0.25rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedChanges.size > 0) {
                        e.currentTarget.style.backgroundColor = '#BF360C';
                        // e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChanges.size > 0) {
                        e.currentTarget.style.backgroundColor = '#E65100';
                        // e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    title={`Download patch for ${selectedChanges.size} change${selectedChanges.size !== 1 ? 's' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                      Download Patch
                    </span>
                  </button>

                  {/* GitHub Issue Button */}
                  <button
                    onClick={() => {
                      if (!changeTracker || selectedChanges.size === 0) return;
                      const patch = changeTracker.generatePatch(Array.from(selectedChanges), 'ini-snippet');
                      const issueTitle = `Translation update for ${selectedTranslation}: ${selectedChanges.size} changes`;
                      const issueBody = `## Partial Translation Update\n\n**File:** ${selectedTranslation}\n**Changes:** ${selectedChanges.size}\n**Sections affected:** ${new Set(unsubmittedChanges.filter(c => selectedChanges.has(c.id)).map(c => c.section)).size}\n\n### Changes:\n\`\`\`ini\n${patch}\n\`\`\`\n\n---\n*Submitted using Translation Tool Partial Update feature*`;
                      const githubUrl = `https://github.com/sannybuilder/translations/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
                      window.open(githubUrl, '_blank');
                    }}
                    disabled={selectedChanges.size === 0}
                    style={{ 
                      flex: 1,
                      aspectRatio: isMobile ? 'auto' : '1',
                      height: isMobile ? '60px' : 'auto',
                      padding: isMobile ? '0.5rem' : '0.75rem',
                      backgroundColor: selectedChanges.size > 0 ? '#9C27B0' : '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      cursor: selectedChanges.size > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      flexDirection: isMobile ? 'row' : 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isMobile ? '0.25rem' : '0.25rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedChanges.size > 0) {
                        e.currentTarget.style.backgroundColor = '#7B1FA2';
                        // e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChanges.size > 0) {
                        e.currentTarget.style.backgroundColor = '#9C27B0';
                        // e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    title={`Create GitHub issue for ${selectedChanges.size} change${selectedChanges.size !== 1 ? 's' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                      Create GitHub Issue
                    </span>
                  </button>
                </div>

                {/* Separator */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '0.75rem',
                  color: '#666',
                  fontSize: isMobile ? '0.75rem' : '0.8rem'
                }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#444' }}></div>
                  <span style={{ margin: '0 0.75rem' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#444' }}></div>
                </div>
              </>
            )}

             {/* Download Full File Button */}
             <button
              onClick={handleSubmitChanges}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontSize: '1rem', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease' 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#45a049';
                // e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4CAF50';
                // e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Download {sourceMode === 'github' ? selectedTranslation : localFileName || 'translation.ini'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChangeReview;


