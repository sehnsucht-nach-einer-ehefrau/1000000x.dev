"use client";

import { useState, useEffect, memo } from 'react';
import type { Node } from '@/types/graph';
import { ChevronRight, PlusSquare, Loader2, GitBranch, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Types & Constants ---

interface TopicTreeSidebarProps {
    nodes: Node[];
    activeNodeId: string | null;
    onNodeSelect: (nodeId: string) => void;
    onExpandNode: (nodeId: string) => void;
    loadingNodeId: string | null;
}

const listVariants = {
    enter: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? 20 : -20,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        opacity: 0,
        x: direction < 0 ? 20 : -20,
    }),
};


// --- Main Component ---

export default function TopicTreeSidebar({
    nodes,
    activeNodeId,
    onNodeSelect,
    onExpandNode,
    loadingNodeId,
}: TopicTreeSidebarProps) {
    const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const rootNode = nodes.find(n => n.depth === 0);
        if (rootNode) {
            setFocusNodeId(rootNode.id);
        } else {
            setFocusNodeId(null);
        }
    }, [nodes]);

    const handleNodeClick = (nodeId: string) => {
        onNodeSelect(nodeId);
        setDirection(1);
        setFocusNodeId(nodeId);
    };

    const handleBackClick = (parentId: string) => {
        onNodeSelect(parentId);
        setDirection(-1);
        setFocusNodeId(parentId);
    };

    const focusNode = nodes.find(n => n.id === focusNodeId);
    const parentNode = focusNode ? nodes.find(n => n.id === focusNode.parentId) : null;
    const children = focusNodeId ? nodes.filter(n => n.parentId === focusNodeId) : [];

    return (
        <motion.div
            initial={{ width: 0, opacity: 0, x: 50 }}
            animate={{ width: 320, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 50, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full bg-gray-950 text-white border-l border-gray-800 flex flex-col p-4 shrink-0 overflow-hidden"
        >
            <h2 className="text-lg font-bold text-gray-200 mb-4 px-2 flex items-center space-x-2 shrink-0">
                <GitBranch className="h-5 w-5 text-violet-400" />
                <span>Topic Outline</span>
            </h2>

            <div className="flex-1 relative">
                <AnimatePresence initial={false} custom={direction}>
                    {focusNode ? (
                        <motion.div
                            key={focusNodeId}
                            custom={direction}
                            variants={listVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 }}}
                            className="absolute inset-0 flex flex-col"
                        >
                            <div className="flex items-center space-x-2 p-2 border-b border-gray-800 mb-2 shrink-0">
                                {parentNode && (
                                    // TAG: The "Back" button
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-gray-400 hover:text-violet-300"
                                        onClick={() => handleBackClick(parentNode.id)}
                                        aria-label={`Go back to ${parentNode.title}`}
                                        data-magnetic-target
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                )}
                                {/* TAG: The main focus node title */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onNodeSelect(focusNode.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') onNodeSelect(focusNode.id) }}
                                    className={cn(
                                        "text-base font-semibold truncate cursor-pointer p-1 -m-1 rounded",
                                        activeNodeId === focusNode.id ? 'text-violet-300' : 'text-gray-300 hover:text-white'
                                    )}
                                    data-magnetic-target
                                >
                                    {focusNode.title}
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 -mr-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                {children.length > 0 ? (
                                    children.map(child => (
                                        <ChildNodeItem
                                            key={child.id}
                                            node={child}
                                            isActive={activeNodeId === child.id}
                                            isLoading={loadingNodeId === child.id}
                                            onNodeClick={handleNodeClick}
                                            onExpandNode={onExpandNode}
                                        />
                                    ))
                                ) : (
                                    <div className="text-gray-500 text-sm text-center p-4">No sub-topics.</div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-gray-500 text-center p-4">No topic loaded.</div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}


// --- Memoized Child Item Component ---

const ChildNodeItem = memo(({ node, isActive, isLoading, onNodeClick, onExpandNode }: {
    node: Node;
    isActive: boolean;
    isLoading: boolean;
    onNodeClick: (nodeId: string) => void;
    onExpandNode: (nodeId: string) => void;
}) => {
    return (
        // TAG: Each individual child item in the list
        <div
            role="button"
            tabIndex={0}
            onClick={() => onNodeClick(node.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onNodeClick(node.id) }}
            className={cn(
                "flex items-center justify-between group rounded-md cursor-pointer transition-colors duration-150 my-1",
                isActive ? 'bg-violet-500/10' : 'hover:bg-gray-800/50'
            )}
            data-magnetic-target
        >
            <div className="flex-grow flex items-center p-2 space-x-2">
                <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className={cn("text-sm", isActive ? 'text-violet-300 font-semibold' : 'text-gray-300')}>
                    {node.title}
                </span>
            </div>

            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-400 mr-2 flex-shrink-0" />
            ) : !node.hasExplored && (
                // TAG: The "Expand" button for each item
                <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 mr-1 text-gray-500 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onExpandNode(node.id); }}
                    aria-label={`Expand topic: ${node.title}`}
                    data-magnetic-target
                >
                    <PlusSquare className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
});

ChildNodeItem.displayName = 'ChildNodeItem';
