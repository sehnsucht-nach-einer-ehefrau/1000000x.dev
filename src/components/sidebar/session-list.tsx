"use client";

import { useState } from 'react';
import type { KnowledgeSession } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { History, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

interface SessionListProps {
  sessions: KnowledgeSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

const formatDate = (timestamp: number | Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SessionList({ sessions, currentSessionId, onSessionSelect, onDelete }: SessionListProps) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setConfirmingDeleteId(sessionId);
  };
  
  const confirmDeletion = () => {
    if (confirmingDeleteId) {
      onDelete(confirmingDeleteId);
      setConfirmingDeleteId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSessionSelect(sessionId);
    }
  };

  return (
    <>
      <nav className="space-y-1">
        <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium px-2 mb-2 uppercase tracking-wider">
            <History className="h-4 w-4" />
            <span>Recent</span>
        </div>
        {sessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-10 px-4">
                <p>No topics explored yet.</p>
                <p className="mt-1">Start a new topic to begin.</p>
            </div>
        ) : (
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* TAG: Each session item in the list */}
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, session.id)}
                  onClick={() => onSessionSelect(session.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                    session.id === currentSessionId
                      ? "bg-violet-500/10 ring-1 ring-inset ring-violet-500/30"
                      : "bg-transparent hover:bg-gray-800/70"
                  )}
                  data-magnetic-target
                >
                  <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-medium text-gray-200 truncate">{session.title}</p>
                          <p className="text-xs text-gray-500">{formatDate(session.updatedAt)}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* TAG: The delete button for each item */}
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                              onClick={(e) => handleDeleteClick(e, session.id)}
                              aria-label={`Delete session: ${session.title}`}
                              data-magnetic-target
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </nav>
      
      <AnimatePresence>
        {confirmingDeleteId && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setConfirmingDeleteId(null)}
            >
                {/* TAG: The entire confirmation dialog card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    role="alertdialog"
                    aria-labelledby="delete-dialog-title"
                    data-magnetic-target
                >
                    <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertTriangle className="h-6 w-6 text-red-400"/>
                        </div>
                        <div className="flex-1">
                            <h3 id="delete-dialog-title" className="text-lg font-bold text-white">Delete Session</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Are you sure you want to delete this session? This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        {/* TAG: The "Cancel" button in the dialog */}
                        <Button variant="outline" className="border-gray-600 hover:bg-gray-700" onClick={() => setConfirmingDeleteId(null)} data-magnetic-target>
                            Cancel
                        </Button>
                        {/* TAG: The "Delete" button in the dialog */}
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeletion} data-magnetic-target>
                            Delete
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
