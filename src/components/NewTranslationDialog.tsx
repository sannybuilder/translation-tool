import React, { useState, useEffect } from 'react';

interface LcidEntry {
  lcid: number;
  language: string;
}

interface NewTranslationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (langId: number, fileName: string, content: string) => void;
}

const NewTranslationDialog: React.FC<NewTranslationDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [selectedLangId, setSelectedLangId] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lcidData, setLcidData] = useState<LcidEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch lcid.json when dialog opens
  useEffect(() => {
    if (isOpen && lcidData.length === 0) {
      fetchLcidData();
    }
  }, [isOpen]);

  // Fetch lcid.json from public folder
  const fetchLcidData = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/lcid.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch lcid.json: ${response.status}`);
      }
      
      const data = await response.json();
      setLcidData(data);
    } catch (err) {
      console.error('Error fetching lcid.json:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter languages based on search term - automatically detect search type
  const filteredLanguages = lcidData.filter((lang: LcidEntry) => {
    if (!searchTerm.trim()) return true;
    
    // Check if search term is numeric (LCID search)
    const isNumericSearch = /^\d+$/.test(searchTerm.trim());
    
    if (isNumericSearch) {
      // Search by LCID code
      return lang.lcid.toString().includes(searchTerm);
    } else {
      // Search by language name
      return lang.language.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  // Auto-generate filename when language is selected from list
  useEffect(() => {
    if (selectedLangId > 0 && lcidData.length > 0) {
      const selectedLang = lcidData.find((lang: LcidEntry) => lang.lcid === selectedLangId);
      if (selectedLang) {
        // Create a filename based on the language name
        const langName = selectedLang.language.toLowerCase();
        const cleanName = langName.replace(/[^a-z]/g, '');
        setFileName(`${cleanName}.ini`);
      }
    }
  }, [selectedLangId, lcidData]);



  const handleCreate = () => {
    if (selectedLangId > 0 && fileName.trim()) {
      const content = `LANGID=${selectedLangId}`;
      onCreate(selectedLangId, fileName.trim(), content);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedLangId(0);
    setFileName('');
    setSearchTerm('');
    setLcidData([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ color: '#fff', marginBottom: '1.5rem', textAlign: 'center' }}>
          Create New Translation
        </h2>

                 {/* Language Selection */}
         <div style={{ marginBottom: '1.5rem' }}>
           <label style={{ color: '#ccc', display: 'block', marginBottom: '0.5rem' }}>
             Language:
           </label>
           
           {/* Loading State */}
           {isLoading && (
             <div style={{ 
               textAlign: 'center', 
               padding: '2rem', 
               color: '#4CAF50',
               backgroundColor: '#2a2a2a',
               borderRadius: '4px',
               marginBottom: '1rem'
             }}>
               <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
               <p>Loading language data...</p>
             </div>
           )}

                       {/* Language List - Only show if data loaded successfully */}
            {!isLoading && lcidData.length > 0 && (
              <>
                <input
                  type="text"
                  placeholder="Search by language name or LCID (e.g., 'german' or '1031')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    marginBottom: '1rem',
                  }}
                />
               <div
                 style={{
                   maxHeight: '200px',
                   overflowY: 'auto',
                   border: '1px solid #444',
                   borderRadius: '4px',
                   backgroundColor: '#2a2a2a',
                 }}
               >
                 {filteredLanguages.length === 0 ? (
                   <div style={{ 
                     padding: '1rem', 
                     textAlign: 'center', 
                     color: '#888',
                     fontStyle: 'italic'
                   }}>
                     {searchTerm ? 
                       `No languages found matching "${searchTerm}"` : 
                       'No languages available.'
                     }
                   </div>
                 ) : (
                   filteredLanguages.map((lang: LcidEntry) => (
                     <div
                       key={lang.lcid}
                       onClick={() => setSelectedLangId(lang.lcid)}
                       style={{
                         padding: '0.75rem',
                         cursor: 'pointer',
                         backgroundColor: selectedLangId === lang.lcid ? '#4CAF50' : 'transparent',
                         color: selectedLangId === lang.lcid ? '#000' : '#fff',
                         borderBottom: '1px solid #444',
                         transition: 'background-color 0.2s',
                       }}
                       onMouseEnter={(e) => {
                         if (selectedLangId !== lang.lcid) {
                           e.currentTarget.style.backgroundColor = '#3a3a3a';
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (selectedLangId !== lang.lcid) {
                           e.currentTarget.style.backgroundColor = 'transparent';
                         }
                       }}
                     >
                       <strong>{lang.language}</strong> (LCID: {lang.lcid})
                     </div>
                   ))
                 )}
               </div>
             </>
           )}

           {/* Manual Input - Show if no data loaded */}
           {!isLoading && lcidData.length === 0 && (
             <input
               type="number"
               value={selectedLangId || ''}
               onChange={(e) => {
                 const value = e.target.value;
                 if (value && !isNaN(Number(value))) {
                   setSelectedLangId(Number(value));
                 } else {
                   setSelectedLangId(0);
                 }
               }}
               placeholder="Enter Language ID (LCID) - e.g., 1033 for English (US)"
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 backgroundColor: '#2a2a2a',
                 border: '1px solid #444',
                 borderRadius: '4px',
                 color: '#fff',
                 fontSize: '1rem',
               }}
             />
           )}
         </div>

         {/* Filename Input */}
         <div style={{ marginBottom: '1.5rem' }}>
           <label style={{ color: '#ccc', display: 'block', marginBottom: '0.5rem' }}>
             Filename:
           </label>
           <input
             type="text"
             value={fileName}
             onChange={(e) => setFileName(e.target.value)}
             placeholder="Enter filename"
             style={{
               width: '100%',
               padding: '0.75rem',
               backgroundColor: '#2a2a2a',
               border: '1px solid #444',
               borderRadius: '4px',
               color: '#fff',
             }}
           />
           <small style={{ color: '#888', fontSize: '0.8rem' }}>
             The .ini extension will be added automatically if not present
           </small>
         </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: 'auto',
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Cancel
          </button>
                     <button
             onClick={handleCreate}
             disabled={selectedLangId === 0 || !fileName.trim()}
             style={{
               padding: '0.75rem 1.5rem',
               backgroundColor: (selectedLangId > 0 && fileName.trim()) ? '#4CAF50' : '#666',
               color: '#fff',
               border: 'none',
               borderRadius: '4px',
               cursor: (selectedLangId > 0 && fileName.trim()) ? 'pointer' : 'not-allowed',
               fontSize: '0.9rem',
             }}
           >
             Create Translation
           </button>
        </div>
      </div>
    </div>
  );
};

export default NewTranslationDialog;
