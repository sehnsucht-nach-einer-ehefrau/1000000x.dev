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
  onMouseEnterContent: () => void; // New prop
  onMouseLeaveContent: () => void; // New prop
}

export default function NodeDetail({
  node,
  onClose,
  onExplore,
  onShowPrerequisites,
  onMouseEnterContent, // Destructure new props
  onMouseLeaveContent,
}: NodeDetailProps) {
  if (!node) return null;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4 node-detail-modal" // Added class for targeting
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-xl max-h-[80vh] overflow-hidden rounded-xl shadow-2xl bg-gray-900/80 backdrop-blur-lg border border-gray-700/50 flex flex-col" // Added flex flex-col
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 20, stiffness: 250 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800/50 bg-black/30 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-medium text-white">{node.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-800/70 text-gray-400 hover:text-white"
            aria-label="Close node detail"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {/* APPLIED MOUSE ENTER/LEAVE TO THIS SCROLLABLE DIV */}
        <div
          className="overflow-y-auto p-6 bg-black/20 flex-grow node-detail-content-scrollable" // Added class
          onMouseEnter={onMouseEnterContent}
          onMouseLeave={onMouseLeaveContent}
        >
          {node.content ? (
            <div className="prose prose-invert max-w-none text-gray-300">
              <ReactMarkdown>{node.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-blue-500 animate-spin mb-4"></div>
              <p>Content not available or loading...</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-800/50 bg-black/30 flex justify-between items-center shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800/70 border-gray-700"
          >
            Close
          </Button>
          <div className="flex space-x-2">
            {node.content && !node.hasExplored && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onExplore();
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <ArrowRight className="mr-2 h-4 w-4" /> Explore Prerequisites
              </Button>
            )}
            {node.content && node.hasExplored && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowPrerequisites();
                }}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
              >
                <ArrowRight className="mr-2 h-4 w-4" /> Show Prerequisites
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
