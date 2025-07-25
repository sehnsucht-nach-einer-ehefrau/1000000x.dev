"use client";

import React, { useEffect, useState, useMemo, useRef, memo, Fragment, forwardRef } from 'react';
import Graph from 'react-vis-network-graph';
import type { Network, Options, Node as VisNode, Edge } from 'vis-network';
import { MessageSquare, FileText, X, ListTree, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Node as CustomNode, Connection } from '@/types/graph';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

import '@/styles/graph-vis.css';
import '@/styles/markdown-styles.css';

// --- STUNNING MODAL COMPONENT ---
const ContentModal = memo(({ node, isOpen, onClose }: { node: CustomNode | null; isOpen: boolean; onClose: () => void }) => {
    if (!node) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-4xl transform rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950/80 backdrop-blur-sm border border-gray-700 p-10 text-left align-middle shadow-2xl shadow-violet-900/20 transition-all">
                            <Dialog.Title as="h3" className="text-4xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-6 pr-16 letter-spacing-tight">
                                {node.title}
                            </Dialog.Title>
                            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 rounded-full p-2 hover:bg-gray-800 hover:text-white transition-all">
                                <X size={24} />
                            </button>
                            <div className="mt-4 max-h-[65vh] overflow-y-auto pr-5 text-gray-300 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                <div className="markdown-content"><ReactMarkdown>{node.content}</ReactMarkdown></div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div></div>
            </Dialog>
        </Transition>
    );
});
ContentModal.displayName = 'ContentModal';

// --- SLEEK HTML NODE COMPONENT ---
const CustomHTMLNode = memo(forwardRef<HTMLDivElement, { node: CustomNode; isActive: boolean; onClick: () => void }>(({ node, isActive, onClick }, ref) => {
    return (
        <div ref={ref} className="absolute opacity-0 pointer-events-auto transition-opacity duration-300" style={{ transform: 'translate(-50%, -50%)' }}>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} onClick={onClick}>
                <div className={cn(
                    "w-64 h-24 p-4 rounded-xl border flex items-center space-x-4 cursor-pointer transition-all duration-300 group shadow-lg",
                    "bg-gray-900/50 backdrop-blur-md",
                    isActive ? "border-violet-500 shadow-violet-500/20" : "border-gray-700/50 hover:border-violet-600/80 hover:bg-gray-900/80"
                )}>
                    {isActive && <div className="absolute -inset-1 rounded-xl bg-violet-500/20 blur-lg -z-10" />}
                    <div className={cn("flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300", isActive ? "bg-violet-600 text-white" : "bg-gray-800/80 text-gray-400 group-hover:bg-violet-600 group-hover:text-white")}><FileText size={24} /></div>
                    <div className="flex-1 overflow-hidden"><h3 className="font-semibold text-white truncate">{node.title}</h3><p className="text-sm text-gray-400 truncate">{node.description || "View content..."}</p></div>
                </div>
            </motion.div>
        </div>
    );
}));
CustomHTMLNode.displayName = 'CustomHTMLNode';

// --- SYNCHRONIZED HTML OVERLAY COMPONENT ---
const HTMLOverlay = ({ network, nodes, activeNodeId, onNodeClick }: { network: Network | null; nodes: CustomNode[]; activeNodeId: string | null; onNodeClick: (node: CustomNode) => void; }) => {
    const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        if (!network) return;
        const handleSyncPositions = () => {
            const nodePositionsOnCanvas = network.getPositions();
            for (const node of nodes) {
                const nodeEl = nodeRefs.current.get(node.id);
                const posOnCanvas = nodePositionsOnCanvas[node.id];
                if (nodeEl && posOnCanvas) {
                    const posOnScreen = network.canvasToDOM(posOnCanvas);
                    nodeEl.style.transform = `translate(${posOnScreen.x}px, ${posOnScreen.y}px) translate(-50%, -50%)`;
                    nodeEl.style.opacity = '1';
                } else if (nodeEl) {
                    nodeEl.style.opacity = '0';
                }
            }
        };
        network.on('afterDrawing', handleSyncPositions);
        handleSyncPositions();
        return () => { network.off('afterDrawing', handleSyncPositions); };
    }, [network, nodes]);

    return (
        <div className="absolute inset-0 z-10 pointer-events-none">
            <AnimatePresence>
                {nodes.map(node => (
                    <CustomHTMLNode
                        key={node.id}
                        ref={(el) => { if (el) nodeRefs.current.set(node.id, el); else nodeRefs.current.delete(node.id); }}
                        node={node}
                        isActive={activeNodeId === node.id}
                        onClick={() => onNodeClick(node)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

// --- MAIN COMPONENT ---
const KnowledgeGraph = ({ nodes: initialNodes, connections, activeNodeId, onNodeSelect, onViewChange }: {
    nodes: CustomNode[];
    connections: Connection[];
    activeNodeId: string | null;
    onNodeSelect: (nodeId: string | null) => void;
    onViewChange: () => void;
}) => {
    const [network, setNetwork] = useState<Network | null>(null);
    const [modalNode, setModalNode] = useState<CustomNode | null>(null);
    const [showAllNodes, setShowAllNodes] = useState(false);
    // --- THE KEY PROP FIX: State to force component remounting ---
    const [graphKey, setGraphKey] = useState(0);
    // Add loading state to prevent rapid re-renders
    const [isTransitioning, setIsTransitioning] = useState(false);

    const { filteredNodes } = useMemo(() => {
        const threshold = showAllNodes ? 0 : 20;
        // FIXED: Ensure nodes are deduplicated by ID and properly filtered
        const uniqueNodes = initialNodes.reduce((acc, node) => {
            if (!acc.has(node.id)) {
                const wordCount = node.content?.trim().split(/\s+/).length || 0;
                if (wordCount > threshold) {
                    acc.set(node.id, node);
                }
            }
            return acc;
        }, new Map<string, CustomNode>());
        
        return { filteredNodes: Array.from(uniqueNodes.values()) };
    }, [initialNodes, showAllNodes]);

    const graphData = useMemo(() => {
        
        // Step 1: Create a clean set of visible node IDs
        const nodeIdSet = new Set<string>();
        const cleanNodes: VisNode[] = [];
        
        filteredNodes.forEach((node) => {
            if (!node.id) {
                return;
            }
            
            if (nodeIdSet.has(node.id)) {
                return;
            }
            
            nodeIdSet.add(node.id);
            cleanNodes.push({
                id: String(node.id), // Ensure ID is string
                shape: 'dot' as const,
                size: 1
            });
        });
        
        
        // Step 2: Create clean edges with validation
        const edgeIdSet = new Set<string>();
        const cleanEdges: Edge[] = [];
        
        connections.forEach((conn, index) => {
            if (!conn.source || !conn.target) {
                return;
            }
            
            // Only include connections where both nodes exist
            if (!nodeIdSet.has(conn.source) || !nodeIdSet.has(conn.target)) {
                return;
            }
            
            // Create unique edge ID
            const edgeId = `edge_${conn.source}_to_${conn.target}_${index}`;
            
            if (edgeIdSet.has(edgeId)) {
                return;
            }
            
            edgeIdSet.add(edgeId);
            cleanEdges.push({
                id: edgeId,
                from: String(conn.source),
                to: String(conn.target)
            });
        });
        
        
        const result = { nodes: cleanNodes, edges: cleanEdges };
        
        return result;
    }, [filteredNodes, connections]);
    
    // This effect increments the key whenever the filter changes, forcing a remount of the Graph
    useEffect(() => {
        if (isTransitioning) return; // Prevent rapid changes
        
        setIsTransitioning(true);
        setGraphKey(prevKey => prevKey + 1);
        setNetwork(null);
        onNodeSelect(null);
        
        // Reset transition state after a delay
        const timer = setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [showAllNodes, isTransitioning, onNodeSelect]);

    const options: Options = useMemo(() => ({
        nodes: { color: 'transparent' },
        edges: {
            color: { color: '#4b5563', highlight: '#6d28d9' },
            width: 2,
            smooth: { 
                enabled: true,
                type: 'cubicBezier',
                roundness: 0.7
            },
        },
        physics: { enabled: true, barnesHut: { gravitationalConstant: -40000, centralGravity: 0.15, springLength: 300, springConstant: 0.05, damping: 0.3 }, solver: 'barnesHut' },
        interaction: { dragNodes: true, dragView: true, zoomView: true, navigationButtons: false, tooltipDelay: 0 },
    }), []);
    


    const handleNodeClick = (node: CustomNode) => {
        if (node.id === activeNodeId) {
            setModalNode(node);
        } else {
            onNodeSelect(node.id);
            if(network) {
                network.focus(node.id, { scale: 1.0, animation: { duration: 600, easingFunction: 'easeInOutQuad' }});
            }
        }
    };

    useEffect(() => {
        if (network) {
                        const handleCanvasClick = (params: { nodes: string[] }) => { if (params.nodes.length === 0) { onNodeSelect(null); }};
            network.on('click', handleCanvasClick);
            return () => { network.off('click', handleCanvasClick); };
        }
    }, [network, onNodeSelect]);



    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <header className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <h2 className="text-xl font-bold text-white pointer-events-auto">Knowledge Graph</h2>
                <div className="flex items-center space-x-2 pointer-events-auto">
                    <Button 
                        onClick={() => !isTransitioning && setShowAllNodes(prev => !prev)} 
                        variant="outline" 
                        className="border-gray-700/50 text-gray-300 hover:bg-gray-900 hover:text-white disabled:opacity-50" 
                        title={showAllNodes ? "Show only generated content" : "Show all topics"}
                        disabled={isTransitioning}
                    >
                        {showAllNodes ? <ListTree className="mr-2 h-4 w-4" /> : <ListFilter className="mr-2 h-4 w-4" />}
                        {isTransitioning ? "Loading..." : showAllNodes ? "View Generated Topics" : "View All Topics"}
                    </Button>
                    <Button onClick={() => {
                        // If no node is selected, select the main topic (depth 0) before switching views
                        if (!activeNodeId && filteredNodes.length > 0) {
                            const mainTopic = filteredNodes.find(node => node.depth === 0) || filteredNodes[0];
                            onNodeSelect(mainTopic.id);
                        }
                        onViewChange();
                    }} variant="outline" className="border-gray-700/50 text-gray-300 hover:bg-gray-900 hover:text-white"><MessageSquare className="mr-2 h-4 w-4" /> Chat View</Button>
                </div>
            </header>

            <HTMLOverlay network={network} nodes={filteredNodes} activeNodeId={activeNodeId} onNodeClick={handleNodeClick} />
            
            <div className="w-full h-full bg-gradient-to-br from-gray-950 via-black to-gray-900">
                {graphData.nodes.length > 0 ? (
                    <Graph
                        // --- ENHANCED KEY WITH DEBOUNCING ---
                        key={`graph-${graphKey}-${showAllNodes ? 'all' : 'filtered'}`}
                        graph={graphData}
                        options={options}
                                                getNetwork={(network: Network) => {
                            // Add small delay to prevent rapid state updates
                            setTimeout(() => setNetwork(network), 100);
                        }}
                        style={{ height: '100%', width: '100%' }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>No nodes to display with current filter</p>
                    </div>
                )}
            </div>

            <ContentModal node={modalNode} isOpen={!!modalNode} onClose={() => setModalNode(null)} />
        </div>
    );
};

export default KnowledgeGraph;
