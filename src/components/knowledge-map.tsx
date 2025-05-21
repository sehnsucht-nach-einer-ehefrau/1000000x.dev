"use client";

import type React from "react";
import {
  useRef,
  useEffect,
  forwardRef,
  useState,
  useImperativeHandle,
} from "react";
import { X, Move, ZoomIn, ZoomOut, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Node, Connection } from "@/types/graph";
import NodeDetail from "./node-detail";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface KnowledgeMapProps {
  nodes: Node[];
  connections: Connection[];
  onNodeClick: (nodeId: string) => void;
  onExploreClick: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string) => void;
  isLoading: boolean;
  loadingNodeId: string | null;
  centralNodeId: string | null;
  activeParentId: string | null;
}

const KnowledgeMap = forwardRef<any, KnowledgeMapProps>(
  (
    {
      nodes,
      connections,
      onNodeClick,
      onExploreClick,
      onNodeMove,
      onNodeSelect,
      isLoading,
      loadingNodeId,
      centralNodeId,
      activeParentId,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [nodeBeingDragged, setNodeBeingDragged] = useState<string | null>(
      null
    );
    const [dragDistance, setDragDistance] = useState(0);
    const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);
    const [mouseDownPos, setMouseDownPos] = useState<{
      x: number;
      y: number;
    } | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      centerView: () => {
        if (containerRef.current) {
          setOffset({
            x: containerRef.current.clientWidth / 2 - 150, // Half of central node width
            y: containerRef.current.clientHeight / 2 - 150, // Half of central node height
          });
          setScale(1);
        }
      },
    }));

    // Center the view when nodes change
    useEffect(() => {
      if (nodes.length > 0 && centralNodeId && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        setOffset({
          x: containerWidth / 2 - 150, // Half of central node width
          y: containerHeight / 2 - 150, // Half of central node height
        });
      }
    }, [centralNodeId, nodes]);

    // Handle mouse down on a node
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setNodeBeingDragged(nodeId);
      setDragStart({ x: e.clientX, y: e.clientY });
      setMouseDownTime(Date.now());
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      setDragDistance(0);
    };

    // Handle mouse move for node dragging
    const handleNodeMouseMove = (e: React.MouseEvent) => {
      if (nodeBeingDragged && mouseDownPos) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        // Calculate total drag distance
        const newDragDistance = Math.sqrt(
          Math.pow(e.clientX - mouseDownPos.x, 2) +
            Math.pow(e.clientY - mouseDownPos.y, 2)
        );
        setDragDistance(newDragDistance);

        // Move the node
        const node = nodes.find((n) => n.id === nodeBeingDragged);
        if (node) {
          onNodeMove(nodeBeingDragged, {
            x: node.position.x + dx / scale,
            y: node.position.y + dy / scale,
          });
          setDragStart({ x: e.clientX, y: e.clientY });
        }
      }
    };

    // Handle mouse up for node dragging or clicking
    const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();

      // Check if this was a click (short duration and minimal movement)
      const isClick =
        mouseDownTime && Date.now() - mouseDownTime < 200 && dragDistance < 5;

      if (isClick) {
        // If the node has content, open the detail view
        const node = nodes.find((n) => n.id === nodeId);
        if (node && node.content) {
          setSelectedNode(nodeId);
        } else {
          // If the node doesn't have content, load it
          onNodeClick(nodeId);
        }

        // If this is a different node than the active parent, select it
        if (nodeId !== activeParentId) {
          onNodeSelect(nodeId);
        }
      }

      setNodeBeingDragged(null);
      setMouseDownTime(null);
      setMouseDownPos(null);
    };

    // Handle mouse events for dragging the canvas
    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 0 && !nodeBeingDragged) {
        // Left mouse button and not dragging a node
        setDragStart({ x: e.clientX, y: e.clientY });
        setIsDragging(false);
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      // If we're dragging a node, handle in the node's event handlers
      if (nodeBeingDragged) {
        handleNodeMouseMove(e);
        return;
      }

      // If we're dragging the canvas
      if (e.buttons === 1) {
        // Left mouse button is pressed
        setIsDragging(true);
        setOffset({
          x: offset.x + (e.clientX - dragStart.x),
          y: offset.y + (e.clientY - dragStart.y),
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Handle wheel events for zooming
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(2, scale * delta));

      // Adjust offset to zoom toward cursor position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const mouseXBeforeZoom = (x - offset.x) / scale;
        const mouseYBeforeZoom = (y - offset.y) / scale;
        const mouseXAfterZoom = (x - offset.x) / newScale;
        const mouseYAfterZoom = (y - offset.y) / newScale;

        setOffset({
          x: offset.x + (mouseXAfterZoom - mouseXBeforeZoom) * newScale,
          y: offset.y + (mouseYAfterZoom - mouseYBeforeZoom) * newScale,
        });
      }

      setScale(newScale);
    };

    const sameLayerNodes = nodes.filter((node) => {
      if (node.id === centralNodeId) return true;
      if (activeParentId === centralNodeId)
        return node.parentId === centralNodeId;

      const activeParentNode = nodes.find((n) => n.id === activeParentId);
      if (!activeParentNode) return false;

      return (
        node.parentId === activeParentNode.parentId ||
        node.id === activeParentId
      );
    });

    // Get nodes that are direct children of the active parent
    const activeChildNodes = nodes.filter(
      (node) => node.parentId === activeParentId
    );

    // Determine which nodes should be visible
    // Combine sameLayerNodes and activeChildNodes, then filter for unique nodes by ID
    const allPotentiallyVisibleNodes = [...sameLayerNodes, ...activeChildNodes];
    const visibleNodes = allPotentiallyVisibleNodes.filter(
      (node, index, self) => index === self.findIndex((n) => n.id === node.id)
    );
    // Now, visibleNodes contains each node at most once.

    // Get connections for visible nodes
    const visibleConnections = connections.filter(
      (conn) =>
        // Show connections from central node to its children
        (conn.source === centralNodeId &&
          sameLayerNodes.some((n) => n.id === conn.target)) ||
        // Show connections from active parent to its children
        (conn.source === activeParentId &&
          activeChildNodes.some((n) => n.id === conn.target))
    );

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden cursor-grab bg-gradient-to-br from-gray-950 to-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isDragging ? "grabbing" : nodeBeingDragged ? "move" : "grab",
        }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: `${30 * scale}px ${30 * scale}px`,
            backgroundPosition: `${offset.x % (30 * scale)}px ${
              offset.y % (30 * scale)
            }px`,
          }}
        />

        {/* Connections */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient
              id="connectionGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.7)" />
              <stop offset="100%" stopColor="rgba(147, 51, 234, 0.7)" />
            </linearGradient>
          </defs>
          {visibleConnections.map((connection) => {
            const sourceNode = nodes.find((n) => n.id === connection.source);
            const targetNode = nodes.find((n) => n.id === connection.target);

            if (!sourceNode || !targetNode) return null;

            const sourceX = sourceNode.position.x * scale + offset.x + 300; // Right side of source node
            const sourceY = sourceNode.position.y * scale + offset.y + 125; // Middle of source node
            const targetX = targetNode.position.x * scale + offset.x; // Left side of target node
            const targetY = targetNode.position.y * scale + offset.y + 125; // Middle of target node

            return (
              <path
                key={connection.id}
                d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
                fill="none"
                stroke="url(#connectionGradient)"
                strokeWidth="2"
                strokeOpacity="0.6"
                className="connection-line"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="rgba(147, 51, 234, 0.7)"
              />
            </marker>
          </defs>
        </svg>

        {/* Nodes */}
        <AnimatePresence>
          {visibleNodes.map((node) => {
            const isCentralNode = node.id === centralNodeId;
            const isActiveParent = node.id === activeParentId;
            const isActiveChild = node.parentId === activeParentId;
            const isLoading = loadingNodeId === node.id;
            const isHovered = hoveredNode === node.id;
            const isDraggingThis = nodeBeingDragged === node.id;

            // Determine if this node should be highlighted (central, active parent, or active child)
            const isHighlighted =
              isCentralNode || isActiveParent || isActiveChild;

            // Determine opacity based on whether the node is highlighted
            const opacity = isHighlighted ? 1 : 0.4;

            return (
              <motion.div
                key={node.id}
                className="absolute"
                style={{
                  left: node.position.x * scale + offset.x + "px",
                  top: node.position.y * scale + offset.y + "px",
                  width: "300px",
                  transformOrigin: "top left",
                  zIndex: isCentralNode
                    ? 10
                    : isHovered || isDraggingThis
                    ? 5
                    : 1,
                  opacity: opacity,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: opacity,
                  scale: scale,
                  transition: { duration: 0.3 },
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
              >
                <div
                  className={`node-card ${
                    isCentralNode
                      ? "border-blue-600/30"
                      : isActiveParent
                      ? "border-purple-600/30"
                      : "border-gray-700"
                  } h-[280px] overflow-hidden transition-all duration-200 cursor-move`}
                  style={{
                    boxShadow: isHovered
                      ? "0 0 0 1px rgba(59, 130, 246, 0.5), 0 0 15px 2px rgba(59, 130, 246, 0.3)"
                      : isDraggingThis
                      ? "0 0 0 2px rgba(59, 130, 246, 0.7), 0 0 20px 4px rgba(59, 130, 246, 0.5)"
                      : "none",
                  }}
                >
                  <div className="p-3 border-b border-gray-800/50 bg-black/20 flex justify-between items-center">
                    <h3 className="text-sm font-medium truncate text-white">
                      {node.title}
                    </h3>
                  </div>
                  <div className="p-4 overflow-auto text-sm h-[200px] text-gray-300">
                    {node.content ? (
                      <div className="node-card-content h-full overflow-auto prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{node.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 italic">
                        {isLoading ? (
                          <div className="flex flex-col items-center">
                            <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-blue-500 animate-spin mb-2"></div>
                            <p>Loading content...</p>
                          </div>
                        ) : (
                          "Click to load content"
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-800/50 bg-black/20 flex justify-end">
                    {node.content && !node.hasExplored && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExploreClick(node.id);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs"
                        disabled={isLoading}
                        size="sm"
                      >
                        <ArrowRight className="mr-1 h-3 w-3" />
                        Explore Prerequisites
                      </Button>
                    )}
                    {node.content &&
                      node.hasExplored &&
                      node.id !== activeParentId && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeSelect(node.id);
                          }}
                          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-xs"
                          disabled={isLoading}
                          size="sm"
                        >
                          <ArrowRight className="mr-1 h-3 w-3" />
                          Show Prerequisites
                        </Button>
                      )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading overlay */}
        {isLoading && !loadingNodeId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-r-2 border-l-2 border-purple-500 animate-ping opacity-30"></div>
              </div>
              <p className="mt-4 text-blue-400 font-medium">
                Exploring knowledge...
              </p>
            </div>
          </div>
        )}

        {/* Navigation controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute bottom-6 right-6 glass-panel p-2 z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 text-blue-400"
                  onClick={() => {
                    setScale((prev) => Math.min(prev * 1.2, 2));
                  }}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 text-blue-400"
                  onClick={() => {
                    setScale((prev) => Math.max(prev * 0.8, 0.5));
                  }}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 text-blue-400"
                  onClick={() => {
                    if (containerRef.current) {
                      setOffset({
                        x: containerRef.current.clientWidth / 2 - 150,
                        y: containerRef.current.clientHeight / 2 - 150,
                      });
                      setScale(1);
                    }
                  }}
                  title="Center View"
                >
                  <Home className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle controls button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute bottom-6 right-20 h-8 w-8 rounded-full bg-gray-800/50 hover:bg-gray-700/70 text-gray-400"
          onClick={() => setShowControls(!showControls)}
        >
          {showControls ? (
            <X className="h-4 w-4" />
          ) : (
            <Move className="h-4 w-4" />
          )}
        </Button>

        {/* Node detail modal */}
        <AnimatePresence>
          {selectedNode && (
            <NodeDetail
              node={nodes.find((n) => n.id === selectedNode)!}
              onClose={() => setSelectedNode(null)}
              onExplore={() => {
                if (selectedNode) {
                  onExploreClick(selectedNode);
                  setSelectedNode(null);
                }
              }}
              onShowPrerequisites={() => {
                if (selectedNode) {
                  onNodeSelect(selectedNode);
                  setSelectedNode(null);
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
);

KnowledgeMap.displayName = "KnowledgeMap";

export default KnowledgeMap;
