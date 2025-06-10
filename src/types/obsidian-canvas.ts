export interface ObsidianCanvas {
  nodes: ObsidianNode[];
  edges: ObsidianEdge[];
}

export interface ObsidianNode {
  id: string;
  type: 'file' | 'link' | 'text' | 'url' | 'image' | 'group';
  text?: string;
  file?: string;
  url?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  label?: string;
  group?: string;
}

export interface ObsidianEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide: 'top' | 'right' | 'bottom' | 'left';
  toSide: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  color?: string;
} 