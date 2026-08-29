import React from 'react';
import { AnswerHighlight } from './AnswerHighlight';

interface Region {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnswerPageProps {
  imageUrl: string;
  canonicalWidth: number;
  canonicalHeight: number;
  regions: Region[];
}

export const AnswerPage: React.FC<AnswerPageProps> = ({
  imageUrl,
  canonicalWidth,
  canonicalHeight,
  regions,
}) => {
  return (
    <div className="relative w-full shadow-md bg-white border border-gray-200">
      {/* 
        The image dictates the rendered height/aspect ratio.
        The container is relative, so the absolute highlights will lay perfectly over it.
      */}
      <img
        src={imageUrl}
        alt="Answer Sheet Page"
        className="block w-full h-auto object-contain"
        onLoad={() => {
          // Optional: handle scrolling to first region when loaded
        }}
      />
      
      {/* Render each region as a highlight */}
      {regions.map((r, idx) => (
        <AnswerHighlight
          key={idx}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          canonicalWidth={canonicalWidth}
          canonicalHeight={canonicalHeight}
          isActive={true}
        />
      ))}
    </div>
  );
};
