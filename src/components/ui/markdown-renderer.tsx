"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from "@/lib/utils";
import 'katex/dist/katex.min.css';

export const MarkdownRenderer = ({ content }: { content: string }) => (
	<ReactMarkdown
		remarkPlugins={[remarkGfm, remarkMath]}
		rehypePlugins={[rehypeKatex]}
		components={{
			h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-2 mb-6" {...props} />,
			h2: ({ ...props }) => <h2 className="text-2xl font-semibold mt-8 mb-4 border-b border-gray-700 pb-2" {...props} />,
			h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />,
			p: ({ ...props }) => <div className="leading-relaxed mb-4" {...props} />,
			ul: ({ ...props }) => <ul className="list-disc list-outside space-y-1 mb-4 pl-6 ml-2" {...props} />,
			ol: ({ ...props }) => <ol className="list-decimal list-outside space-y-1 mb-4 pl-6 ml-2" {...props} />,
			li: ({ ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
			table: ({ ...props }) => (
				<div className="overflow-x-auto my-6 border border-gray-700 rounded-lg bg-gray-900/30">
					<table className="min-w-full border-collapse" {...props} />
				</div>
			),
			thead: ({ ...props }) => <thead className="bg-gray-800/70" {...props} />,
			th: ({ ...props }) => (
				<th className="px-4 py-3 text-left text-sm font-semibold text-gray-200 border-b border-gray-600" {...props} />
			),
			tbody: ({ ...props }) => <tbody className="divide-y divide-gray-700/50" {...props} />,
			tr: ({ ...props }) => <tr className="hover:bg-gray-800/30 transition-colors" {...props} />,
			td: ({ ...props }) => (
				<td className="px-4 py-3 text-sm text-gray-300 border-b border-gray-700/30" {...props} />
			),
			code: ({ className, children, ...props }) => {
				const match = /language-(\w+)/.exec(className || '');
				if (match) {
					// This is a code block with language - let pre handle the wrapper
					return <code className="block p-4 overflow-x-auto font-mono text-sm text-gray-100" {...props}>{children}</code>;
				}
				// This is inline code - enhanced styling for math and regular code
				return (
					<code
						className="bg-gray-800/60 text-purple-200 px-2 py-0.5 rounded-md font-mono text-sm border border-gray-700/50"
						{...props}
					>
						{children}
					</code>
				);
			},
			pre: ({ className, children, ...props }) => {
				return (
					<pre className={cn(className, "code-block-pre bg-gray-900/70 rounded-lg my-4 border border-gray-700/50 overflow-hidden")} {...props}>
						{children}
					</pre>
				);
			},
			// Enhanced blockquote for mathematical definitions or important notes
			blockquote: ({ ...props }) => (
				<blockquote className="border-l-4 border-purple-500/50 bg-purple-900/10 pl-4 py-2 my-4 italic text-gray-300" {...props} />
			),
			// Better horizontal rule
			hr: ({ ...props }) => (
				<hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" {...props} />
			),
			// Enhanced strong/bold text
			strong: ({ ...props }) => (
				<strong className="font-semibold text-white" {...props} />
			),
			// Enhanced emphasis
			em: ({ ...props }) => (
				<em className="italic text-gray-200" {...props} />
			),
		}}
	>
		{content}
	</ReactMarkdown>
);
