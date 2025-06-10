'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasState, Point } from '@/types/canvas';
import { ObsidianCanvas } from '@/types/obsidian-canvas';
import { useTheme } from '@/contexts/ThemeContext';
import WebView from './WebView';
import SideMenu from './SideMenu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import Markdown from 'react-markdown';
import MarkdownPreview from './MarkdownPreview';
import { EdgeRenderer } from './canvas/EdgeRenderer';

const INITIAL_STATE: CanvasState = {
  nodes: [],
  edges: [],
  scale: 1,
  offset: { x: 0, y: 0 },
};

const DARK_EDGE_COLORS: { [key: string]: string } = {
  '1': '#E57373',
  '2': '#81C784',
  '3': '#64B5F6',
  '4': '#FFD54F',
  '5': '#BA68C8',
  '6': '#4DD0E1',
};

const LIGHT_EDGE_COLORS: { [key: string]: string } = {
  '1': '#D32F2F',
  '2': '#388E3C',
  '3': '#1976D2',
  '4': '#FBC02D',
  '5': '#7B1FA2',
  '6': '#0097A7',
};

const BackgroundDots = () => {
  const { theme } = useTheme();
  const dotColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(128, 128, 128, 0.3)';
  const dotSize = 2.5;
  const spacing = 20;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[var(--background)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle ${dotSize}px at ${spacing}px ${spacing}px, ${dotColor} 100%, transparent 0)`,
          backgroundSize: `${spacing * 2}px ${spacing * 2}px`,
        }}
      />
    </div>
  );
};

export default function Canvas() {
  const { theme, toggleTheme } = useTheme();
  const [state, setState] = useState<CanvasState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Check if the target is inside a node with text content
    const isMarkdownNode = (e.target as HTMLElement)?.closest('.markdown-content');
    if (isMarkdownNode) {
      return; // Don't zoom if we're hovering over markdown content
    }

    e.preventDefault();
    const delta = e.deltaY;
    const scaleChange = delta > 0 ? 0.9 : 1.1;
    
    // Get mouse position relative to the canvas
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    // Calculate mouse position in the current canvas coordinate system
    const currentMouseX = (mouseX / state.scale) - state.offset.x;
    const currentMouseY = (mouseY / state.scale) - state.offset.y;

    const newScale = Math.max(0.1, Math.min(2, state.scale * scaleChange));

    // Calculate new offset to keep the mouse point fixed
    const newOffsetX = state.offset.x + currentMouseX * (1 - newScale / state.scale);
    const newOffsetY = state.offset.y + currentMouseY * (1 - newScale / state.scale);

    setState(prev => ({
      ...prev,
      scale: newScale,
      offset: { x: newOffsetX, y: newOffsetY },
    }));
  }, [state.scale, state.offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setState(prev => ({
        ...prev,
        // Adjust offset based on current scale
        offset: {
          x: prev.offset.x + dx / prev.scale,
          y: prev.offset.y + dy / prev.scale,
        },
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    setIsLoading(true);

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.canvas')) {
      alert('Please drop a valid Obsidian canvas file (.canvas)');
      setIsLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const canvasData: ObsidianCanvas = JSON.parse(text);
      
      const nodes = canvasData.nodes.map(node => {
        let content = '';
        if (node.type === 'text') {
          content = node.text || '';
        } else if (node.type === 'file') {
          content = node.file || '';
        } else if (node.type === 'link') {
          content = node.url || '';
        } else if (node.type === 'image') {
          content = node.url || '';
        } else {
          content = node.text || node.file || node.url || '';
        }
        return {
          id: node.id,
          position: { x: node.x, y: node.y },
          content,
          width: node.width,
          height: node.height,
          type: node.type,
          color: node.color,
          label: node.label,
          group: node.group,
        };
      });

      setState(prev => ({
        ...prev,
        nodes,
        edges: canvasData.edges.map(edge => ({
          id: edge.id,
          from: edge.fromNode,
          to: edge.toNode,
          fromSide: edge.fromSide,
          toSide: edge.toSide,
          label: edge.label,
          color: edge.color || undefined,
        })),
        scale: 1, // Reset scale on new file load
        offset: { x: 0, y: 0 }, // Reset offset on new file load
      }));
    } catch (error) {
      console.error('Error loading canvas file:', error);
      alert('Error loading canvas file. Please make sure it\'s a valid Obsidian canvas file.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]); // Only depend on the memoized handleWheel function

  const renderNodeContent = (node: any) => {
    // Determine color from EDGE_COLORS, defaulting to a fallback if not found or no color specified
    const currentEdgeColors = theme === 'dark' ? DARK_EDGE_COLORS : LIGHT_EDGE_COLORS;
    const nodeColor = node.color ? currentEdgeColors[node.color] || 'var(--node-border)' : 'var(--node-border)';
    
    switch (node.type) {
      case 'text':
        return (
          <div className="prose prose-base max-w-full h-full overflow-auto bg-transparent text-[var(--foreground)] p-2">
            <MarkdownPreview content={node.content} />
          </div>
        );
      case 'file':
        return (
          <div className="prose prose-base max-w-full h-full overflow-auto bg-transparent text-[var(--foreground)] p-2">
            <MarkdownPreview content={node.content} />
          </div>
        );
      case 'link':
        // Use WebView for link nodes, no extra className prop
        return (
          <WebView url={node.content} width={node.width} height={node.height} />
        );
      case 'image':
        return (
          <div className="relative w-full h-full">
            <img
              src={node.content}
              alt="Canvas image"
              className="object-contain w-full h-full"
            />
          </div>
        );
      case 'group':
        return (
          <div className="flex items-center gap-2 text-obsidian-text font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm">{node.label || 'Group'}</span>
          </div>
        );
      default:
        return <div className="text-obsidian-text font-medium">{node.content}</div>;
    }
  };

  const getNodeById = (id: string) => {
    return state.nodes.find(node => node.id === id);
  };

  const handleMarkdownUpload = async (file: File) => {
    try {
      const text = await file.text();
      // Find nodes that reference this markdown file
      const markdownNodes = state.nodes.filter(node => 
        node.type === 'file' && node.content === file.name
      );

      if (markdownNodes.length > 0) {
        // Update the content of matching nodes
        setState(prev => ({
          ...prev,
          nodes: prev.nodes.map(node => {
            if (markdownNodes.some(mdNode => mdNode.id === node.id)) {
              // Remove .md extension and prepend as h3 heading
              const fileNameWithoutExt = file.name.replace(/\.md$/, '');
              const contentWithHeading = `### ${fileNameWithoutExt}\n\n${text}`;
              return {
                ...node,
                content: contentWithHeading,
                type: 'text', // Change type to text to render the content
                width: Math.max(node.width, 400), // Ensure minimum width for readability
                height: Math.max(node.height, 300), // Ensure minimum height for readability
              };
            }
            return node;
          })
        }));
      }
    } catch (error) {
      console.error('Error loading markdown file:', error);
      alert('Error loading markdown file. Please try again.');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <SideMenu
        nodes={state.nodes}
        onMarkdownUpload={handleMarkdownUpload}
      />
      <div
        ref={canvasRef}
        className={`relative w-full h-full ${isDraggingFile ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <BackgroundDots />
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-[var(--node-bg)] border border-[var(--node-border)] hover:bg-opacity-80 transition-all duration-200"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${state.scale}) translate(${state.offset.x}px, ${state.offset.y}px)`,
            transformOrigin: '0 0',
          }}
        >
          <style jsx global>{`
            @keyframes flow {
              from {
                stroke-dashoffset: 24;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ 
              zIndex: 0,
              overflow: 'visible',
            }}
          >
            {/* Edges are now rendered by EdgeRenderer as Bezier curves */}
            <EdgeRenderer edges={state.edges} nodes={state.nodes} />
          </svg>
          <div className="relative" style={{ zIndex: 1 }}>
            {state.nodes.map(node => {
              const currentEdgeColors = theme === 'dark' ? DARK_EDGE_COLORS : LIGHT_EDGE_COLORS;
              const nodeColor = node.color ? currentEdgeColors[node.color] || 'var(--node-border)' : 'var(--node-border)';
              return (
                <div
                  key={node.id}
                  className="absolute bg-[var(--node-bg)] border rounded-lg shadow-xl text-[var(--foreground)] p-0"
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    width: node.width,
                    height: node.height,
                    transform: 'translate(-50%, -50%)',
                    borderColor: nodeColor,
                    borderWidth: '3px',
                    boxSizing: 'border-box',
                    padding: 0,
                  }}
                >
                  {/* Only add a small padding for markdown nodes, not for all */}
                  {(node.type === 'text' || node.type === 'file') ? (
                    <div className="w-full h-full p-1 box-border group">
                      <div
                        className="w-full h-full overflow-auto focus:outline-none group-hover:shadow-lg markdown-content"
                        tabIndex={0}
                        onWheel={e => {
                          e.stopPropagation();
                        }}
                      >
                        {renderNodeContent(node)}
                      </div>
                    </div>
                  ) : (
                    renderNodeContent(node)
                  )}
                </div>
              );
            })}
          </div>
          {isDraggingFile && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--canvas-bg)] bg-opacity-50">
              <div className="text-2xl font-semibold text-[var(--foreground)]">
                Drop your Obsidian canvas file here
              </div>
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--canvas-bg)] bg-opacity-75">
              <div className="text-2xl font-semibold text-[var(--foreground)]">
                Loading canvas...
              </div>
            </div>
          )}
          {!isLoading && state.nodes.length === 0 && !isDraggingFile && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                  Obsidian Canvas Viewer
                </div>
                <div className="text-[var(--foreground)] text-opacity-70">
                  Drag and drop your .canvas file here to view it
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}