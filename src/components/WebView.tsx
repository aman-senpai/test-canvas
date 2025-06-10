import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

export interface WebViewHandle {
  reload: () => void;
  getTitle: () => string;
}

interface WebViewProps {
  url: string;
  width: number;
  height: number;
  onNodeClick?: () => void;
  onTitleChange?: (title: string) => void;
}

const WebView = forwardRef<WebViewHandle, WebViewProps>(
  ({ url, width, height, onNodeClick, onTitleChange }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // Ensure URL has proper protocol
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

    useImperativeHandle(ref, () => ({
      reload: () => {
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
      },
      getTitle: () => title,
    }), [title]);

    // Try to get the title from the iframe after load (only works for same-origin)
    useEffect(() => {
      if (!iframeRef.current) return;
      const handle = () => {
        let pageTitle = '';
        try {
          pageTitle = iframeRef.current?.contentDocument?.title || '';
        } catch {
          // Cross-origin, ignore
        }
        setTitle(pageTitle);
        if (onTitleChange) onTitleChange(pageTitle);
      };
      const iframe = iframeRef.current;
      iframe.addEventListener('load', handle);
      return () => {
        iframe.removeEventListener('load', handle);
      };
    }, [formattedUrl, onTitleChange]);

    return (
      <div 
        className="relative w-full h-full rounded-lg overflow-hidden cursor-pointer" 
        onClick={onNodeClick}
        style={{ background: 'transparent' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 p-4">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={formattedUrl}
          className="w-full h-full border-0"
          style={{ width: `${width}px`, height: `${height}px`, background: 'transparent' }}
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
);

export default WebView;