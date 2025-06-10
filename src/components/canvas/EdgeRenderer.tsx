import React from 'react';
import { CanvasNode, Edge } from '@/types/canvas';
import { useTheme } from '@/contexts/ThemeContext';

interface EdgeRendererProps {
  edges?: Edge[];
  nodes?: CanvasNode[];
  selectedEdgeId?: string;
}

export const EdgeRenderer: React.FC<EdgeRendererProps> = ({ edges = [], nodes = [], selectedEdgeId }) => {
  const { theme } = useTheme();

  // Helper to get connection point based on side
  const getConnectionPoint = (node: CanvasNode, side: string = 'right') => {
    const { x, y } = node.position;
    const { width, height } = node;

    switch (side) {
      case 'left':
        return { x: x - width / 2, y };
      case 'right':
        return { x: x + width / 2, y };
      case 'top':
        return { x, y: y - height / 2 };
      case 'bottom':
        return { x, y: y + height / 2 };
      default:
        return { x, y };
    }
  };

  // Helper to calculate control points for Bezier curve
  const getControlPoints = (fromPoint: { x: number; y: number }, toPoint: { x: number; y: number }, fromSide?: string, toSide?: string) => {
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate the control point distance based on the distance between nodes
    const controlDistance = Math.min(distance * 0.5, 200);

    // Default control points (for right-to-left connections)
    let cp1x = fromPoint.x + controlDistance;
    let cp1y = fromPoint.y;
    let cp2x = toPoint.x - controlDistance;
    let cp2y = toPoint.y;

    // Adjust control points based on connection sides
    if (fromSide === 'right' && toSide === 'left') {
      // Default case, already set above
    } else if (fromSide === 'left' && toSide === 'right') {
      cp1x = fromPoint.x - controlDistance;
      cp2x = toPoint.x + controlDistance;
    } else if (fromSide === 'top' && toSide === 'bottom') {
      cp1x = fromPoint.x;
      cp1y = fromPoint.y - controlDistance;
      cp2x = toPoint.x;
      cp2y = toPoint.y + controlDistance;
    } else if (fromSide === 'bottom' && toSide === 'top') {
      cp1x = fromPoint.x;
      cp1y = fromPoint.y + controlDistance;
      cp2x = toPoint.x;
      cp2y = toPoint.y - controlDistance;
    } else {
      // For other combinations, create a more natural curve
      const angle = Math.atan2(dy, dx);
      const perpendicular = angle + Math.PI / 2;
      const offset = controlDistance * 0.5;

      cp1x = fromPoint.x + controlDistance * Math.cos(angle) + offset * Math.cos(perpendicular);
      cp1y = fromPoint.y + controlDistance * Math.sin(angle) + offset * Math.sin(perpendicular);
      cp2x = toPoint.x - controlDistance * Math.cos(angle) + offset * Math.cos(perpendicular);
      cp2y = toPoint.y - controlDistance * Math.sin(angle) + offset * Math.sin(perpendicular);
    }

    return { cp1x, cp1y, cp2x, cp2y };
  };

  // Helper to calculate a point along a cubic Bezier curve
  const getPointAlongCurve = (t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;
    
    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;
    
    const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
    const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;
    
    return { x, y };
  };

  // Helper to calculate the angle of the curve at a point
  const getCurveAngle = (t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;
    
    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;
    
    const dx = 3 * ax * Math.pow(t, 2) + 2 * bx * t + cx;
    const dy = 3 * ay * Math.pow(t, 2) + 2 * by * t + cy;
    
    return Math.atan2(dy, dx);
  };

  // Arrow color
  const arrowColor = theme === 'dark' ? '#FFD54F' : '#FBC02D';
  const lineColor = theme === 'dark' ? '#888' : '#333';

  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none" 
      style={{ 
        zIndex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        transform: 'translateZ(0)'
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
        </marker>
      </defs>
      {edges.map((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return null;

        const fromPoint = getConnectionPoint(fromNode, edge.fromSide);
        const toPoint = getConnectionPoint(toNode, edge.toSide);
        const isSelected = selectedEdgeId === edge.id;

        // Get control points for the Bezier curve
        const { cp1x, cp1y, cp2x, cp2y } = getControlPoints(fromPoint, toPoint, edge.fromSide, edge.toSide);

        // Create the path for the curved line
        const path = `M ${fromPoint.x} ${fromPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPoint.x} ${toPoint.y}`;

        // Calculate the angle for the arrow at the end of the curve
        const angle = Math.atan2(toPoint.y - cp2y, toPoint.x - cp2x);
        const arrowLength = 15;
        
        // Calculate arrow points
        const arrowPath = `M ${toPoint.x} ${toPoint.y} L ${toPoint.x - arrowLength * Math.cos(angle - Math.PI / 7)} ${toPoint.y - arrowLength * Math.sin(angle - Math.PI / 7)} L ${toPoint.x - arrowLength * Math.cos(angle + Math.PI / 7)} ${toPoint.y - arrowLength * Math.sin(angle + Math.PI / 7)} Z`;

        // Calculate label position along the curve
        const labelPoint = getPointAlongCurve(0.5, fromPoint, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, toPoint);
        const labelAngle = getCurveAngle(0.5, fromPoint, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, toPoint);

        // Only use explicit edge.label, do not generate a default
        const label = edge.label;
        // Only calculate labelWidth if label is set
        const labelWidth = label ? Math.max(160, label.length * 8) : 0;

        return (
          <g key={edge.id}>
            {/* Edge line */}
            <path
              d={path}
              stroke={isSelected ? arrowColor : lineColor}
              strokeWidth={isSelected ? 4 : 2}
              opacity={isSelected ? 1 : 0.7}
              fill="none"
              markerEnd="url(#arrowhead)"
              style={{
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            />
            {/* Arrow */}
            <path
              d={arrowPath}
              fill={isSelected ? arrowColor : lineColor}
              opacity={isSelected ? 1 : 0.7}
              style={{
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            />
            {/* Label group, only if label is set */}
            {label && (
              <g 
                transform={`translate(${labelPoint.x}, ${labelPoint.y}) rotate(${labelAngle * (180 / Math.PI)})`}
                style={{
                  transform: 'translateZ(0)',
                  willChange: 'transform'
                }}
              >
                {/* Label background */}
                <rect
                  x={-labelWidth / 2}
                  y="-20"
                  width={labelWidth}
                  height="40"
                  fill={theme === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)'}
                  rx="8"
                  ry="8"
                  style={{
                    filter: theme === 'dark' ? 'drop-shadow(0 0 8px rgba(0,0,0,0.7))' : 'drop-shadow(0 0 8px rgba(0,0,0,0.2))',
                    border: `2px solid ${isSelected ? arrowColor : lineColor}`,
                    transform: 'translateZ(0)',
                    willChange: 'transform'
                  }}
                />
                {/* Label text */}
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={theme === 'dark' ? '#ffffff' : '#000000'}
                  className="font-medium select-none"
                  style={{ 
                    pointerEvents: 'none',
                    fontSize: '14px',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                    paintOrder: theme === 'dark' ? 'stroke' : 'normal',
                    stroke: theme === 'dark' ? '#000000' : 'none',
                    strokeWidth: theme === 'dark' ? '3px' : '0',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    userSelect: 'none'
                  }}
                >
                  {label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};