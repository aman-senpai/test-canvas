'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasState, Point } from '@/types/canvas';
import { ObsidianCanvas } from '@/types/obsidian-canvas';
import { useTheme } from '@/contexts/ThemeContext';
import SideMenu from './SideMenu';
import { EdgeRenderer } from './canvas/EdgeRenderer';
import { BackgroundDots } from './canvas/BackgroundDots';
import { CanvasNode } from './canvas/CanvasNode';
import { ThemeToggle } from './canvas/ThemeToggle';
import { CanvasOverlay } from './canvas/CanvasOverlay';


const INITIAL_STATE: CanvasState = {
  nodes: [],
  edges: [],
  scale: 1,
  offset: { x: 0, y: 0 },
};

export default function Canvas() {
  const { theme, toggleTheme } = useTheme();
  const [state, setState] = useState<CanvasState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getContentBoundingBox = () => {
    if (state.nodes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const minX = Math.min(...state.nodes.map(n => n.position.x - n.width / 2));
    const maxX = Math.max(...state.nodes.map(n => n.position.x + n.width / 2));
    const minY = Math.min(...state.nodes.map(n => n.position.y - n.height / 2));
    const maxY = Math.max(...state.nodes.map(n => n.position.y + n.height / 2));
    return { minX, minY, maxX, maxY };
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    const markdownContent = (e.target as HTMLElement)?.closest('.markdown-content');
    if (markdownContent) {
      const hasScrollableContent = markdownContent.scrollHeight > markdownContent.clientHeight;
      if (hasScrollableContent) return;
    }
    e.preventDefault();
    const delta = e.deltaY;
    // Reduce zoom intensity
    const scaleStep = 0.05; // 5% per scroll
    const scaleChange = delta > 0 ? 1 - scaleStep : 1 + scaleStep;
    const newScale = Math.max(0.1, Math.min(2, state.scale * scaleChange));

    // Get mouse position relative to the canvas
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    // Calculate mouse position in the current canvas coordinate system
    const prevScale = state.scale;
    const prevOffset = state.offset;
    const worldX = (mouseX / prevScale) - prevOffset.x;
    const worldY = (mouseY / prevScale) - prevOffset.y;

    // New offset so that the world point under the cursor stays under the cursor
    const newOffsetX = (mouseX / newScale) - worldX;
    const newOffsetY = (mouseY / newScale) - worldY;

    setState(prev => ({
      ...prev,
      scale: newScale,
      offset: { x: newOffsetX, y: newOffsetY },
    }));
  }, [state.scale, state.offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if the click originated from a markdown content area
    // This is important for text selection and interaction within markdown nodes
    const isMarkdownContent = (e.target as HTMLElement)?.closest('.markdown-content');
    if (isMarkdownContent) {
      return; 
    }

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
      // The 'passive: false' is crucial here if you want to be able to call preventDefault
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleNodeClick = useCallback((node: any) => {
    // Only apply for 'file', 'text', and 'link' node types
    if (node.type !== 'file' && node.type !== 'text' && node.type !== 'link') {
      return;
    }

    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasWidth = canvasRect.width;
      const canvasHeight = canvasRect.height;

      // Desired padding around the node when zoomed (e.g., 10% of canvas dimension)
      const padding = 50; 

      // Calculate the scale needed to fit the node's content within the canvas
      // Consider both width and height to ensure the entire node is visible
      const scaleX = (canvasWidth - padding * 2) / node.width;
      const scaleY = (canvasHeight - padding * 2) / node.height;
      const newScale = Math.max(0.1, Math.min(Math.min(scaleX, scaleY), 1.1)); // Max zoom to 1.5 to prevent excessive zoom for very small nodes

      // Calculate new offset to center the node
      // The current node's center is at (node.position.x, node.position.y)
      // We want this point to align with the canvas center after scaling
      const newOffsetX = (canvasWidth / 2 / newScale) - node.position.x;
      const newOffsetY = (canvasHeight / 2 / newScale) - node.position.y;

      setState(prev => ({
        ...prev,
        scale: newScale,
        offset: { x: newOffsetX, y: newOffsetY },
      }));
    }
  }, []);

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
      <SideMenu nodes={state.nodes} onMarkdownUpload={handleMarkdownUpload} />
      <div
        ref={canvasRef}
        className={`relative w-full h-full ${isDraggingFile ? 'bg-gray-100 dark:bg-gray-800' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <BackgroundDots />
        <ThemeToggle />

        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${state.scale}) translate(${state.offset.x}px, ${state.offset.y}px)`,
            transformOrigin: '0 0',
          }}
        >
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ 
              zIndex: 0,
              overflow: 'visible',
            }}
          >
            <EdgeRenderer edges={state.edges} nodes={state.nodes} />
          </svg>
          <div className="relative" style={{ zIndex: 1 }}>
            {state.nodes.map(node => (
              <CanvasNode 
                key={node.id} 
                node={node} 
                onNodeClick={handleNodeClick}
              />
            ))}
          </div>
          <CanvasOverlay
            isLoading={isLoading}
            isDraggingFile={isDraggingFile}
            hasNodes={state.nodes.length > 0}
          />
        </div>
      </div>
    </div>
  );
}