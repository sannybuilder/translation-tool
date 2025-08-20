import { useState, useEffect } from 'react';
import { getScreenSize } from '../styles/styles';

export type ScreenSize = 'mobile' | 'medium' | 'desktop';

export const useScreenSize = (): {
  screenSize: ScreenSize;
  isMobile: boolean;
  isMedium: boolean;
  isDesktop: boolean;
} => {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window !== 'undefined') {
      return getScreenSize(window.innerWidth);
    }
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isMedium: screenSize === 'medium',
    isDesktop: screenSize === 'desktop',
  };
};
