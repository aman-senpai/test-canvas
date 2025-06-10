import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { CanvasNode as CanvasNodeType } from '@/types/canvas';
import { NodeContent } from './NodeContent';

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

interface CanvasNodeProps {
  node: CanvasNodeType;
  onNodeClick: (node: CanvasNodeType) => void;
}

export const CanvasNode = ({ node, onNodeClick }: CanvasNodeProps) => {
  const { theme } = useTheme();
  const currentEdgeColors = theme === 'dark' ? DARK_EDGE_COLORS : LIGHT_EDGE_COLORS;
  const nodeColor = node.color
    ? currentEdgeColors[node.color] || 'var(--node-border)'
    : 'var(--node-border)';

  return (
    <div
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
      <div className="w-full h-full p-2 box-border">
        <NodeContent node={node} onNodeClick={onNodeClick} />
      </div>
    </div>
  );
};