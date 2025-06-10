import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface MarkdownPreviewProps {
  content: string;
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
  ul: (props: any) => <ul className="text-[var(--foreground)] my-4 pl-3 list-disc space-y-2 marker:text-[var(--foreground)]" {...props} />,
  ol: (props: any) => <ol className="text-[var(--foreground)] my-4 pl-3 list-decimal space-y-2 marker:text-[var(--foreground)]" {...props} />,
  li: (props: any) => <li className="text-[var(--foreground)] my-1.2 leading-7 pl-3 marker:text-[var(--foreground)]" {...props} />,
  hr: (props: any) => <hr className="border-[var(--node-border)] my-8" {...props} />,
  img: (props: any) => <img className="rounded my-4 max-w-full border border-[var(--node-border)]" {...props} />,
  table: (props: any) => <table className="text-[var(--foreground)] border border-[var(--node-border)] my-4 w-full" {...props} />,
  th: (props: any) => <th className="border border-[var(--node-border)] bg-[var(--node-bg)] p-3 font-semibold text-left" {...props} />,
  td: (props: any) => <td className="border border-[var(--node-border)] p-3 text-left" {...props} />,
  a: (props: any) => <a className="text-blue-500 no-underline hover:underline" {...props} />,
};

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => (
  <div className="prose prose-sm max-w-none h-full w-full">
    <ReactMarkdown
      remarkPlugins={[remarkGfm as any, remarkBreaks as any]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default MarkdownPreview;
