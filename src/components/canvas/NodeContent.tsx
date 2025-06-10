import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { CanvasNode } from '@/types/canvas';
import WebView from '../WebView';

interface NodeContentProps {
  node: CanvasNode;
  onNodeClick: (node: CanvasNode) => void;
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
  return (
    <div className="prose prose-sm w-full h-full px-2 py-1 box-border">
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
  switch (node.type) {
    case 'text':
      return (
        <div 
          className="w-full h-full overflow-hidden node-content cursor-pointer" 
          onClick={() => onNodeClick(node)}
        >
          <div className="w-full h-full overflow-auto">
            <MarkdownContent content={node.content} />
          </div>
        </div>
      );
    case 'file':
      return (
        <div className="w-full h-full overflow-auto">
          <MarkdownContent content={`# ${node.label || node.content}`} />
        </div>
      );
    case 'url':
      return (
        <div className="flex items-center gap-2 text-[var(--foreground)] font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {node.content}
        </div>
      );
    case 'link':
      return (
        <div className="w-full h-full">
          <WebView url={node.content} width={node.width} height={node.height} onNodeClick={() => onNodeClick(node)} />
        </div>
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
      return null;
  }
};