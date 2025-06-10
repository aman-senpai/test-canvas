// NodeContent.tsx
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { CanvasNode } from '@/types/canvas';
import WebView, { WebViewHandle } from '../WebView';

interface NodeContentProps {
  node: CanvasNode;
  onNodeClick: (node: CanvasNode) => void;
  onReloadNode?: (nodeId: string) => void;
}

const components = {
  h1: (props: any) => <h1 className="scroll-m-20 text-3xl mb-8 mt-0 border-b border-[var(--node-border)] pb-2 font-bold tracking-tight text-[var(--foreground)]" {...props} />,
  h2: (props: any) => <h2 className="scroll-m-20 text-2xl mb-6 mt-0 border-b border-[var(--node-border)] pb-2 font-bold tracking-tight text-[var(--foreground)]" {...props} />,
  h3: (props: any) => <h3 className="scroll-m-20 text-xl mb-4 mt-0 border-b border-[var(--node-border)] pb-2 font-bold tracking-tight text-[var(--foreground)]" {...props} />,
  h4: (props: any) => <h4 className="scroll-m-20 text-lg mb-4 mt-0 font-bold tracking-tight text-[var(--foreground)]" {...props} />,
  h5: (props: any) => <h5 className="scroll-m-20 text-base mb-3 mt-0 font-bold tracking-tight text-[var(--foreground)]" {...props} />,
  h6: (props: any) => <h6 className="scroll-m-20 text-sm mb-2 mt-0 font-bold tracking-tight text-[var(--foreground)]" {...props} />,
  p: (props: any) => <p className="text-[var(--foreground)] my-4 leading-7 text-base" {...props} />,
  strong: (props: any) => <strong className="text-[var(--foreground)] font-bold" {...props} />,
  em: (props: any) => <em className="text-[var(--foreground)] italic" {...props} />,
  code: (props: any) => <code className="text-[var(--foreground)] bg-[var(--node-bg)] px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
  pre: (props: any) => <pre className="bg-[var(--node-bg)] text-[var(--foreground)] border border-[var(--node-border)] rounded p-4 overflow-x-auto my-4 text-sm font-mono" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-l-[var(--node-border)] text-[var(--foreground)] pl-4 my-4 italic bg-[var(--node-bg)] py-2 pr-4" {...props} />,
  ul: (props: any) => <ul className="text-[var(--foreground)] my-4 pl-4 list-disc space-y-2 marker:text-[var(--foreground)]" {...props} />,
  ol: (props: any) => <ol className="text-[var(--foreground)] my-4 pl-4 list-decimal space-y-2 marker:text-[var(--foreground)]" {...props} />,
  li: (props: any) => <li className="text-[var(--foreground)] my-1.5 leading-7 pl-2 marker:text-[var(--foreground)]" {...props} />,
  hr: (props: any) => <hr className="border-[var(--node-border)] my-8" {...props} />,
  img: (props: any) => <img className="rounded my-4 max-w-full border border-[var(--node-border)]" {...props} />,
  table: (props: any) => <table className="text-[var(--foreground)] border border-[var(--node-border)] my-4 w-full" {...props} />,
  th: (props: any) => <th className="border border-[var(--node-border)] bg-[var(--node-bg)] p-3 font-semibold text-left" {...props} />,
  td: (props: any) => <td className="border border-[var(--node-border)] p-3 text-left" {...props} />,
  a: (props: any) => <a className="text-blue-500 no-underline hover:underline" {...props} />,
};

const MarkdownContent = ({ content }: { content: string }) => {
  const markdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mdElement = markdownRef.current;
    if (mdElement) {
      const handleWheel = (e: WheelEvent) => {
        // Only stop propagation if the content is actually scrollable
        if (mdElement.scrollHeight > mdElement.clientHeight) {
          e.stopPropagation();
        }
        // If not scrollable, let it bubble up to the canvas for zooming
      };

      mdElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        mdElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [content]); // Re-attach if content changes

  return (
    <div 
      ref={markdownRef}
      className="prose prose-sm w-full h-full px-2 py-1 box-border overflow-y-auto" // Added overflow-y-auto here
      style={{ maxHeight: '100%' }} // Crucial to enable scrolling
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm as any, remarkBreaks as any]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const NodeContent = ({ node, onNodeClick }: NodeContentProps) => {
  const ribbonHeight = 24; // Height of the ribbon in pixels
  const webViewRef = useRef<WebViewHandle>(null);
  const [webTitle, setWebTitle] = useState('');

  switch (node.type) {
    case 'text':
      return (
        // Removed overflow-hidden from this div, it's now on MarkdownContent
        <div className="w-full h-full node-content cursor-pointer" onClick={() => onNodeClick(node)}>
          <MarkdownContent content={node.content} />
        </div>
      );
    case 'file':
      // Assuming file content is also markdown and should be scrollable
      return (
        <div className="w-full h-full node-content cursor-pointer" onClick={() => onNodeClick(node)}>
          {/* For file type, display file name as h3 and then its content as markdown */}
          <MarkdownContent content={`### ${node.content.split('/').pop() || node.content}\n\n`} />
          {/* You might want to fetch and display the actual file content here if it's markdown */}
        </div>
      );
    case 'link':
      return (
        <div className="relative w-full h-full cursor-pointer node-content" onClick={() => onNodeClick(node)}>
          <div className="absolute top-0 left-0 w-full bg-[var(--node-border)] text-white text-xs px-2 py-1 rounded-t-lg flex justify-between items-center z-10">
            <span className="truncate max-w-[80%]" title={webTitle || node.content}>{webTitle || node.content}</span>
            <button
              className="ml-2 p-0.5 rounded hover:bg-white hover:bg-opacity-20"
              onClick={e => {
                e.stopPropagation();
                if (webViewRef.current) {
                  webViewRef.current.reload();
                }
              }}
              title="Reload page"
            >
              {/* Standard reload icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0020 13a8 8 0 11-8-8" />
              </svg>
            </button>
          </div>
          <div className="flex-grow">
            <WebView
              ref={webViewRef}
              url={node.content}
              width={node.width}
              height={node.height - ribbonHeight}
              onTitleChange={setWebTitle}
            />
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="relative w-full h-full node-content cursor-pointer" onClick={() => onNodeClick(node)}>
          <img
            src={node.content}
            alt="Node Image"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    default:
      return (
        <div className="w-full h-full flex items-center justify-center node-content cursor-pointer" onClick={() => onNodeClick(node)}>
          <p className="text-[var(--foreground)] text-sm opacity-70">Unsupported Node Type</p>
        </div>
      );
  }
};