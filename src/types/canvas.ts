export interface Point {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  position: Point;
  content: string;
  width: number;
  height: number;
  type: 'text' | 'file' | 'url' | 'link' | 'image' | 'group';
  color?: string;
  label?: string;
  group?: string;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  fromSide?: string;
  toSide?: string;
  label?: string;
  color?: string;
}

export interface CanvasState {
  nodes: CanvasNode[];
  edges: Edge[];
  scale: number;
  offset: Point;
} 