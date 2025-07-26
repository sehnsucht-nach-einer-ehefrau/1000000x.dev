"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BookOpen, Brain, Layers, Sparkles, PanelRightClose, PanelRightOpen, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { continueChatOnTopic } from "@/lib/ai-service";
import type { ChatTurn } from "@/lib/ai-service";
import type { Node as NodeType } from '@/types/graph';
import ChatMessage from "./chat-message";
import ReactMarkdown from "react-markdown";

import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";


interface ChatPanelProps {
  node: NodeType;
  onChatUpdate: (nodeId: string, chatHistory: ChatTurn[]) => void;
  onClearChat: (nodeId: string) => void;
  onViewChange: () => void;
  onExpandNode: () => void;
  isTopicTreeVisible: boolean;
  onToggleTopicTree: () => void;
  isExpanding: boolean;
}

const MarkdownRenderer = ({ content }: { content: string }) => (
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
            code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                if (!match) {
                  return <code className="bg-violet-900/50 text-violet-300 px-1.5 py-1 rounded-md font-mono text-sm" {...props}>{children}</code>;
                }
                
                return (
                  <pre className={cn(className, "code-block-pre bg-gray-900/70 rounded-lg my-4 border border-gray-700/50 overflow-hidden")}>
                    <code className="block p-4 overflow-x-auto font-mono text-sm" {...props}>{children}</code>
                  </pre>
                );
            },
            pre: ({ children }) => <>{children}</>,
        }}
    >
        {content}
    </ReactMarkdown>
);

export default function ChatPanel({
  node,
  onChatUpdate,
  onClearChat,
  onViewChange,
  onExpandNode,
  isTopicTreeVisible,
  onToggleTopicTree,
  isExpanding
}: ChatPanelProps) {
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>(node.chatHistory || []);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClearConfirmOpen, setClearConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);
  useEffect(() => { setChatHistory(node.chatHistory || []) }, [node.id, node.chatHistory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    const newUserTurn: ChatTurn = { role: "user", content: userMessage, timestamp: Date.now() };
    const updatedHistory = [...chatHistory, newUserTurn];
    setChatHistory(updatedHistory);

    try {
      const response = await continueChatOnTopic(node.title, node.content, updatedHistory, userMessage);
      const assistantTurn: ChatTurn = { role: "assistant", content: response, timestamp: Date.now() };
      onChatUpdate(node.id, [...updatedHistory, assistantTurn]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to get response: ${errorMessage}`);
      // Revert the optimistic UI update
      setChatHistory(chatHistory);
      // Restore user's input
      setInputMessage(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmClear = () => {
    onClearChat(node.id);
    setClearConfirmOpen(false);
  }

  return (
    <>
      <div className="flex flex-col h-full bg-black text-white">
        <header className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Brain className="h-6 w-6 text-violet-400 shrink-0" />
            <h2 className="text-xl font-bold truncate pr-4">{node.title}</h2>
          </div>
          <div className="flex items-center gap-2">
              {!node.hasExplored && (
                   <Button onClick={onExpandNode} variant="outline" className="border-violet-500 text-violet-400 hover:bg-violet-500/10" disabled={isExpanding}>
                      {isExpanding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isExpanding ? "Generating..." : "Generate Rabbit Holes"}
                  </Button>
              )}
              {node.chatHistory && node.chatHistory.length > 0 && (
                  <Button onClick={() => setClearConfirmOpen(true)} variant="outline" className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-red-400 hover:border-red-500/50">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Chat
                  </Button>
              )}
              <Button onClick={onViewChange} variant="outline" className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white">
                  <Layers className="mr-2 h-4 w-4" />
                  Graph View
              </Button>
               <Button onClick={onToggleTopicTree} variant="outline" className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white">
                  {isTopicTreeVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="p-6 border-b border-gray-800 bg-gray-950/50">
              <div className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={node.content} />
              </div>
          </div>

          <div className="flex-1 p-4 space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <BookOpen className="h-4 w-4" />
              <span>Ask questions about this topic</span>
            </div>
            {chatHistory.map((turn, index) => (
              <ChatMessage key={`${node.id}-chat-${index}`} role={turn.role} content={turn.content} />
            ))}
            {isSending && <div className="flex justify-start"><div className="bg-gray-900 rounded-lg p-4 flex items-center space-x-2"><Loader2 className="h-4 w-4 animate-spin text-purple-400" /><span className="text-gray-400">Thinking...</span></div></div>}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-black shrink-0">
          <div className="flex space-x-3">
            <input type="text" value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {if (e.key === 'Enter') handleSendMessage()}}
              placeholder={`Ask a follow-up question...`}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isSending}
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isSending}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 text-white px-6 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isClearConfirmOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setClearConfirmOpen(false)}>
                <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><AlertTriangle className="h-6 w-6 text-red-400"/></div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Clear Chat History</h3>
                            <p className="text-sm text-gray-400 mt-1">Are you sure? This will permanently delete the conversation for this topic.</p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="outline" className="border-gray-600 hover:bg-gray-700" onClick={() => setClearConfirmOpen(false)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmClear}>Clear</Button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
