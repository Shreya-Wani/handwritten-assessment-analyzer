import React from 'react';

interface AnswerHighlightProps {
  x: number;
  y: number;
  width: number;
  height: number;
  canonicalWidth: number;
  canonicalHeight: number;
  isActive?: boolean;
}

export const AnswerHighlight: React.FC<AnswerHighlightProps> = ({
  x,
  y,
  width,
  height,
  canonicalWidth,
  canonicalHeight,
  isActive = true,
}) => {
  // Convert canonical coordinates to percentages and clamp securely (0% - 100%)
  const rawLeft = (x / canonicalWidth) * 100;
  const rawTop = (y / canonicalHeight) * 100;
  const rawWidth = (width / canonicalWidth) * 100;
  const rawHeight = (height / canonicalHeight) * 100;

  const leftPct = Math.max(0, Math.min(100, rawLeft));
  const topPct = Math.max(0, Math.min(100, rawTop));
  const widthPct = Math.max(0, Math.min(100 - leftPct, rawWidth));
  const heightPct = Math.max(0, Math.min(100 - topPct, rawHeight));

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        backgroundColor: 'rgba(255, 165, 0, 0.25)', // Subtle orange/yellow highlight
        border: '2px solid rgba(255, 140, 0, 0.8)',
        borderRadius: '4px',
        pointerEvents: 'none', // Don't block clicks on the image
        boxShadow: '0 0 10px rgba(255, 165, 0, 0.2)',
        zIndex: 10,
      }}
    />
  );
};
