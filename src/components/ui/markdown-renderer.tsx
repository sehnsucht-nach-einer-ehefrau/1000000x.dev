"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

export const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            h1: ({ ...props}) => <h1 className="text-3xl font-bold mt-2 mb-6" {...props} />,
            h2: ({ ...props}) => <h2 className="text-2xl font-semibold mt-8 mb-4 border-b border-gray-700 pb-2" {...props} />,
            h3: ({ ...props}) => <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />,
            p: ({ ...props }) => <div className="leading-relaxed mb-4" {...props} />,
            ul: ({ ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 pl-4" {...props} />,
            ol: ({ ...props}) => <ol className="list-decimal list-inside space-y-2 mb-4 pl-4" {...props} />,
            li: ({ ...props}) => <li className="pl-2" {...props} />,
            table: ({ ...props}) => <div className="overflow-x-auto my-6 border border-gray-700 rounded-lg"><table className="min-w-full" {...props} /></div>,
            thead: ({ ...props}) => <thead className="bg-gray-800/50" {...props} />,
            th: ({ ...props}) => <th className="px-6 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider" {...props} />,
            tr: ({ ...props}) => <tr className="border-b border-gray-700/50" {...props} />,
            td: ({ ...props}) => <td className="px-6 py-4 text-sm text-gray-400" {...props} />,
            code: (props: any) => {
                const { className, children, inline } = props;
                const text = String(children);

                if (inline || !text.includes('\n')) {
                  return <code className="bg-violet-900/50 text-violet-300 px-1.5 py-1 rounded-md font-mono text-sm">{children}</code>;
                }

                const match = /language-(\w+)/.exec(className || '');

                return (
                  <pre className={cn(className, "code-block-pre bg-gray-900/70 rounded-lg my-4 border border-gray-700/50 overflow-hidden")}>
                    <code className="block p-4 overflow-x-auto font-mono text-sm">{children}</code>
                  </pre>
                );
            },
            pre: ({ children }) => <>{children}</>,
        }}
    >
        {content}
    </ReactMarkdown>
);
