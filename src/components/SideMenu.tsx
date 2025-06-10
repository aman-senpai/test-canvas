import React, { useRef, useState } from 'react';
import { CanvasNode } from '@/types/canvas';

interface SideMenuProps {
  onMarkdownUpload: (file: File) => void;
  nodes: CanvasNode[];
}

export default function SideMenu({ onMarkdownUpload, nodes }: SideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get unique markdown files referenced in nodes
  const markdownFiles = Array.from(
    new Set(
      nodes
        .filter(node => node.type === 'file')
        .map(node => node.content)
    )
  );

  // Track uploaded files
  const [uploadedFiles] = useState(new Set<string>());

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && menuRef.current) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === menuRef.current) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleDrop = async (e: React.DragEvent, fileName: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name === fileName) {
      await onMarkdownUpload(file);
      uploadedFiles.add(fileName);
    }
  };

  return (
    <div 
      ref={menuRef}
      className="fixed top-4 left-4 z-50 bg-[var(--node-bg)] border border-[var(--node-border)] rounded-lg shadow-lg"
      style={{ 
        width: isExpanded ? '320px' : '40px',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: `translateX(${isExpanded ? '0' : '-8px'})`,
        opacity: isExpanded ? 1 : 0.9
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      {/* Header with collapse/expand button */}
      <div className="flex items-center justify-between p-2 border-b border-[var(--node-border)]">
        {isExpanded && (
          <h2 className="text-sm font-semibold text-[var(--foreground)] transition-opacity duration-300 flex items-center gap-2"
              style={{ opacity: isExpanded ? 1 : 0 }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            Markdown Files
          </h2>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 hover:bg-[var(--node-bg-hover)] rounded transition-colors"
          aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
        >
          <svg
            className={`w-4 h-4 text-[var(--foreground)] transform transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
          transform: `translateY(${isExpanded ? '0' : '-8px'})`,
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div ref={contentRef} className="p-2">
          {markdownFiles.length === 0 ? (
            <div className="text-sm text-[var(--foreground)] text-opacity-70 p-4 text-center transition-opacity duration-300 flex flex-col items-center gap-2"
                 style={{ opacity: isExpanded ? 1 : 0 }}>
              <svg className="w-8 h-8 text-[var(--foreground)] text-opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No markdown files required for this canvas</span>
            </div>
          ) : (
            <div className="space-y-1 max-h-[calc(100vh-160px)] overflow-y-auto transition-opacity duration-300 custom-scrollbar"
                 style={{ 
                   opacity: isExpanded ? 1 : 0,
                   scrollbarWidth: 'thin',
                   scrollbarColor: 'var(--node-border) transparent'
                 }}>
              {markdownFiles.map(file => {
                const isUploaded = uploadedFiles.has(file);
                return (
                  <div
                    key={file}
                    className={`group p-2 rounded transition-colors ${
                      isUploaded
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-[var(--node-bg)] hover:bg-[var(--node-bg-hover)]'
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, file)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {isUploaded ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-[var(--foreground)] text-opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                        )}
                        <span className="text-sm text-[var(--foreground)] break-all">{file}</span>
                      </div>
                      {!isUploaded && (
                        <svg className="w-4 h-4 text-[var(--foreground)] text-opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--node-border);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
} 