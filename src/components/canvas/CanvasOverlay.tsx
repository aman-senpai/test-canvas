import React from 'react';

interface CanvasOverlayProps {
  isLoading: boolean;
  isDraggingFile: boolean;
  hasNodes: boolean;
}

export function CanvasOverlay({ isLoading, isDraggingFile, hasNodes }: CanvasOverlayProps) {
  if (!isLoading && !isDraggingFile && hasNodes) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)] bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--foreground)]"></div>
        </div>
      )}
      {isDraggingFile && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)] bg-opacity-50">
          <div className="text-[var(--foreground)] text-lg font-medium">
            Drop your canvas file here
          </div>
        </div>
      )}
      {!hasNodes && !isLoading && !isDraggingFile && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[var(--foreground)] text-lg font-medium text-center">
            <p>Drop your Obsidian canvas file here</p>
            <p className="text-sm opacity-70 mt-2">or use the menu on the left</p>
          </div>
        </div>
      )}
    </div>
  );
} 