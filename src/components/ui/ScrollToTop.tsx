import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';

interface ScrollToTopProps {
  showThreshold?: number;
  hideWhenPanelOpen?: boolean;
  pendingCount?: number;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  showThreshold = 200,
  hideWhenPanelOpen = false,
  pendingCount = 0,
}) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > showThreshold;
      setShowButton(scrolled && !hideWhenPanelOpen);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showThreshold, hideWhenPanelOpen]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const buttonStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: colors.primary,
    color: colors.textPrimary,
    border: 'none',
    cursor: 'pointer',
    display: showButton ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
    zIndex: 100,
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: colors.error,
    color: colors.textPrimary,
    borderRadius: '12px',
    padding: '2px 6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    minWidth: '20px',
    textAlign: 'center',
  };

  return (
    <button
      className={`scroll-to-top ${showButton ? 'visible' : ''} ${pendingCount > 0 ? 'has-pending' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      style={buttonStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 4L4 10L5.5 11.5L9 8V16H11V8L14.5 11.5L16 10L10 4Z"
          fill="currentColor"
        />
      </svg>
      {pendingCount > 0 && (
        <span style={badgeStyles} title={`${pendingCount} pending changes to review`}>
          {pendingCount}
        </span>
      )}
    </button>
  );
};

export default ScrollToTop;
