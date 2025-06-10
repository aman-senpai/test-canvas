import { useState } from 'react';

interface WebViewProps {
  url: string;
  width: number;
  height: number;
  onNodeClick?: () => void;
}

export default function WebView({ url, width, height, onNodeClick }: WebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure URL has proper protocol
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

  return (
    <div 
      className="relative w-full h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer" 
      onClick={onNodeClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      )}
      <iframe
        src={formattedUrl}
        className="w-full h-full border-0"
        style={{ width: `${width}px`, height: `${height}px` }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError('Failed to load webpage');
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        referrerPolicy="no-referrer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
} 