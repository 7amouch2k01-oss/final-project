import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AnimatedBackgroundGrid from '../common/AnimatedBackgroundGrid';

export const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Animated Background Laser / Grid Lines moving Right to Left */}
      <AnimatedBackgroundGrid />

      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
export default Layout;

