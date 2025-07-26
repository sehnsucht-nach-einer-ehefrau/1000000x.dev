"use client";

import { useState } from 'react';
import { Plus, Brain, ChevronsLeft, ChevronsRight, MessageSquare, Github, Coffee, MessageCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionList from "./session-list";
import type { KnowledgeSession } from "@/lib/db/schema";
import { motion } from "framer-motion";
import Link from 'next/link';
import FeedbackModal from '../feedback-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  sessions: KnowledgeSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onToggle: () => void;
  isCollapsed: boolean;
  onOpenApiKeyDialog: () => void;
}

// NOTE: We wrap this component's usage in a div with the data-attribute
// instead of modifying the component itself, to keep changes localized.
const SidebarIcon = ({ icon: Icon, text, onClick, href }: { icon: React.ElementType, text: string, onClick?: () => void, href?: string }) => {
    const content = (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
              <Button size="icon" variant={"ghost"} className="h-8 w-8 shrink-0 rounded-2xl hover:bg-gray-900 rounded-lg" onClick={onClick}>
                  <Icon className="h-4 w-4" />
              </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-gray-700 bg-gray-900 text-white"><p>{text}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    // If it's a link, wrap it in a Link component
    if (href) {
        return <Link href={href} target="_blank" rel="noopener noreferrer">{content}</Link>
    }
    return content;
};

// Same as above, we wrap its usage.
const CollapsedSidebarIcon = ({ icon: Icon, onClick, href }: { icon: React.ElementType, onClick?: () => void, href?: string }) => {
    const content = (
      <Button size="icon" variant={"ghost"} className="h-12 w-full shrink-0 rounded-2xl hover:bg-gray-900 rounded-lg" onClick={onClick}>
        <Icon className="h-4 w-4" />
      </Button>
    );
     if (href) {
        return <Link href={href} target="_blank" rel="noopener noreferrer">{content}</Link>
    }
    return content;
};


export default function Sidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onDeleteSession,
  onNewSession,
  onToggle,
  isCollapsed,
  onOpenApiKeyDialog
}: SidebarProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  if (isCollapsed) {
    return (
      <>
        <motion.div 
            initial={false}
            animate={{ width: 50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="flex h-full flex-col items-center justify-between border-r border-gray-700/50 bg-black p-1 pt-2"
        >
            <div className="flex flex-col items-center space-y-4">
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                          {/* TAG: Collapsed New Topic Button */}
                          <button onClick={onNewSession} data-magnetic-target className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg transition-transform group-hover:scale-105">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                                  <Brain className="h-4 w-4 text-white" />
                              </motion.div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="border-gray-700 bg-gray-900 text-white"><p>New Topic</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="my-1 w-full border-t border-gray-700/50" />
                <div className="flex flex-1 flex-col items-center space-y-2 overflow-y-auto mt-5">
                    {sessions.map(session => (
                        <TooltipProvider key={session.id} delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                                {/* TAG: Individual Collapsed Session Icon */}
                                <Button size="icon" variant={currentSessionId === session.id ? "secondary" : "ghost"} className="h-8 w-8 shrink-0 rounded-2xl hover:bg-gray-900 rounded-lg" onClick={() => onSessionSelect(session.id)} data-magnetic-target>
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="border-gray-700 bg-gray-900 text-white"><p>{session.title}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              {/* TAG: Bottom Icons (wrapped) */}
              <div data-magnetic-target><SidebarIcon icon={Key} text="API Key" onClick={onOpenApiKeyDialog} /></div>
              <div data-magnetic-target><SidebarIcon icon={Coffee} text="Buy me a coffee" href="https://www.buymeacoffee.com/sehnsuchtnacheinerehefrau" /></div>
              <div data-magnetic-target><SidebarIcon icon={Github} text="GitHub" href="https://github.com/sehnsucht-nach-einer-ehefrau/1000000x.dev" /></div>
              <div data-magnetic-target><SidebarIcon icon={MessageCircle} text="Feedback" onClick={() => setIsFeedbackOpen(true)} /></div>
              <div className="my-2 w-full border-t border-gray-700/50"></div>
              {/* TAG: Expand Button */}
              <motion.button onClick={onToggle} data-magnetic-target className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-900 mb-2">
                 <motion.div whileHover={{ x: 2 }}><ChevronsRight className="h-5 w-5" /></motion.div>
              </motion.button>
            </div>
        </motion.div>
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      </>
    );
  }

  return (
    <>
      <motion.div 
        initial={false}
        animate={{ width: 288 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="flex h-full w-72 flex-col border-r border-gray-800/50 bg-black p-4"
      >
        <div className="flex items-center justify-between border-b border-gray-800/50 pb-4">
            {/* TAG: Expanded Header */}
            <button onClick={onNewSession} data-magnetic-target className="group flex items-center space-x-3 p-1 -m-1 rounded-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg transition-transform group-hover:scale-105">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                        <Brain className="h-5 w-5 text-white" />
                    </motion.div>
                </div>
                <h1 className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
                  1,000,000x.dev
                </h1>
            </button>
            {/* TAG: Collapse Button */}
            <motion.button onClick={onToggle} data-magnetic-target className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-900">
                <motion.div whileHover={{ x: -2 }}><ChevronsLeft className="h-5 w-5" /></motion.div>
            </motion.button>
        </div>

        <div className="py-4">
            {/* TAG: Expanded New Topic Button */}
            <Button
              onClick={onNewSession}
              data-magnetic-target
              className="w-full relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-purple-700 font-semibold"
            >
              <span className="relative z-10 flex items-center"><Plus className="mr-2 h-4 w-4" /> New Topic</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full animate-[shimmer_2s_infinite]"></div>
            </Button>
        </div>

        {/* TAG: The scrollable session list area */}
        <div className="flex-1 overflow-y-auto -mr-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" data-magnetic-target>
          <SessionList
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionSelect={onSessionSelect}
            onDelete={onDeleteSession}
          />
        </div>

        <div className="my-4 w-full border-t border-gray-700/50"></div>

        <div className="flex items-center justify-around">
          {/* TAG: Bottom Icons (wrapped) */}
          <div data-magnetic-target className="flex-1"><CollapsedSidebarIcon icon={Key} onClick={onOpenApiKeyDialog} /></div>
          <div data-magnetic-target className="flex-1"><CollapsedSidebarIcon icon={Coffee} href="https://www.buymeacoffee.com/example" /></div>
          <div data-magnetic-target className="flex-1"><CollapsedSidebarIcon icon={Github} href="https://github.com/example/repo" /></div>
          <div data-magnetic-target className="flex-1"><CollapsedSidebarIcon icon={MessageCircle} onClick={() => setIsFeedbackOpen(true)} /></div>
        </div>
      </motion.div>
      {/* Note: The modal itself is not tagged, as it's an overlay. You could tag its internal buttons if desired. */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}
