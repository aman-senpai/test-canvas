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
    
    // Calculate the control point distance based on the distance
    const controlPointOffset = Math.max(50, Math.min(distance / 2, 100)); // Adjust this value as needed

    let cp1 = { x: fromPoint.x, y: fromPoint.y };
    let cp2 = { x: toPoint.x, y: toPoint.y };

    // Set control points based on connection sides for smoother curves
    if (fromSide === 'right') cp1.x += controlPointOffset;
    if (fromSide === 'left') cp1.x -= controlPointOffset;
    if (fromSide === 'bottom') cp1.y += controlPointOffset;
    if (fromSide === 'top') cp1.y -= controlPointOffset;

    if (toSide === 'right') cp2.x += controlPointOffset;
    if (toSide === 'left') cp2.x -= controlPointOffset;
    if (toSide === 'bottom') cp2.y += controlPointOffset;
    if (toSide === 'top') cp2.y -= controlPointOffset;

    // Fallback for straight lines or when sides don't dictate clear direction
    if (fromSide === 'right' && toSide === 'left' && dx < 0) {
      cp1.x = fromPoint.x + distance / 2;
      cp2.x = toPoint.x - distance / 2;
    }
    if (fromSide === 'left' && toSide === 'right' && dx > 0) {
      cp1.x = fromPoint.x - distance / 2;
      cp2.x = toPoint.x + distance / 2;
    }
    if (fromSide === 'bottom' && toSide === 'top' && dy < 0) {
      cp1.y = fromPoint.y + distance / 2;
      cp2.y = toPoint.y - distance / 2;
    }
    if (fromSide === 'top' && toSide === 'bottom' && dy > 0) {
      cp1.y = fromPoint.y - distance / 2;
      cp2.y = toPoint.y + distance / 2;
    }

    return { cp1, cp2 };
  };

  return (
    <>
      {edges.map(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);

        if (!fromNode || !toNode) {
          return null;
        }

        const fromPoint = getConnectionPoint(fromNode, edge.fromSide);
        const toPoint = getConnectionPoint(toNode, edge.toSide);

        const { cp1, cp2 } = getControlPoints(fromPoint, toPoint, edge.fromSide, edge.toSide);

        const isSelected = selectedEdgeId === edge.id;

        const DARK_EDGE_COLORS: { [key: string]: string } = {
          '1': '#E57373', '2': '#81C784', '3': '#64B5F6', '4': '#FFD54F', '5': '#BA68C8', '6': '#4DD0E1',
        };
        const LIGHT_EDGE_COLORS: { [key: string]: string } = {
          '1': '#D32F2F', '2': '#388E3C', '3': '#1976D2', '4': '#FBC02D', '5': '#7B1FA2', '6': '#0097A7',
        };
        const currentEdgeColors = theme === 'dark' ? DARK_EDGE_COLORS : LIGHT_EDGE_COLORS;
        const lineColor = edge.color
          ? currentEdgeColors[edge.color] || 'var(--node-border)'
          : 'var(--node-border)';
        const arrowColor = lineColor; // Arrow color matches line color

        // Calculate path for arrow head
        const arrowSize = 10; // Size of the arrow head
        const angle = Math.atan2(toPoint.y - cp2.y, toPoint.x - cp2.x); // Angle at the end of the bezier curve

        const arrowPath = [
          `M ${toPoint.x} ${toPoint.y}`,
          `L ${toPoint.x - arrowSize * Math.cos(angle - Math.PI / 6)} ${toPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)}`,
          `L ${toPoint.x - arrowSize * Math.cos(angle + Math.PI / 6)} ${toPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)}`,
          `Z`
        ].join(' ');

        const label = edge.label;
        const labelX = (fromPoint.x + toPoint.x) / 2;
        const labelY = (fromPoint.y + toPoint.y) / 2;
        const labelBackgroundPadding = 8;
        const labelFontSize = 14;

        return (
          <g key={edge.id}>
            <path
              d={`M ${fromPoint.x} ${fromPoint.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toPoint.x} ${toPoint.y}`}
              fill="none"
              stroke={lineColor}
              strokeWidth={isSelected ? 3 : 2}
              className="transition-all duration-150 ease-in-out"
            />
            <path
              d={arrowPath}
              fill={arrowColor} // Set arrow fill to match line color
              stroke={arrowColor} // Set arrow stroke to match line color
              strokeWidth={1}
            />
            {label && (
              <g transform={`translate(${labelX}, ${labelY})`}>
                {/* Background rectangle for the label */}
                <rect
                  x={-(label.length * 7 + labelBackgroundPadding) / 2} // Center the rect
                  y={-(labelFontSize + labelBackgroundPadding) / 2}
                  width={label.length * 7 + labelBackgroundPadding}
                  height={labelFontSize + labelBackgroundPadding}
                  className="transition-all duration-150 ease-in-out"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke={isSelected ? arrowColor : lineColor}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
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
    </>
  );
};