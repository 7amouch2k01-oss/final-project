import React from 'react';

export const AnimatedBackgroundGrid = () => {
  return (
    <div className="animated-bg-wrapper" aria-hidden="true">
      {/* Static Base Grid */}
      <div className="bg-grid-mesh" />

      {/* Sweeping Right-to-Left Horizontal Laser Lines */}
      <div className="laser-line-h h-line-1" />
      <div className="laser-line-h h-line-2" />
      <div className="laser-line-h h-line-3" />
      <div className="laser-line-h h-line-4" />

      {/* Scan Wave Right to Left */}
      <div className="bg-scan-wave" />

      {/* Floating Intersection Nodes */}
      <div className="grid-node node-1" />
      <div className="grid-node node-2" />
      <div className="grid-node node-3" />
      <div className="grid-node node-4" />
      <div className="grid-node node-5" />
    </div>
  );
};

export default AnimatedBackgroundGrid;
