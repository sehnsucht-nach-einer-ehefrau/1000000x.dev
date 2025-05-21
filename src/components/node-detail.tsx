"use client";

import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Node } from "@/types/graph";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface NodeDetailProps {
  node: Node;
  onClose: () => void;
  onExplore: () => void;
  onShowPrerequisites: () => void;
}

export default function NodeDetail({
  node,
  onClose,
  onExplore,
  onShowPrerequisites,
}: NodeDetailProps) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-xl max-h-[80vh] overflow-hidden glass-panel"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800/50 bg-black/20 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">{node.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-800/70"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-auto max-h-[60vh] p-6 bg-black/10">
          {node.content ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{node.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <div className="animate-pulse h-6 w-6 rounded-full border-2 border-gray-600 mb-4"></div>
              <p>Loading content...</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-800/50 bg-black/20 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800/70"
          >
            Close
          </Button>
          <div className="flex space-x-2">
            {node.content && node.hasExplored && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowPrerequisites();
                }}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Show Prerequisites
              </Button>
            )}
            {node.content && !node.hasExplored && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onExplore();
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Explore Prerequisites
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
