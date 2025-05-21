"use client";

import type React from "react";
import {
  useRef,
  useEffect,
  forwardRef,
  useState,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import {
  X,
  Move,
  ZoomIn,
  ZoomOut,
  Home,
  ArrowRight,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Node, Connection, KnowledgeMapRef } from "@/types/graph";
import NodeDetail from "./node-detail";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_SENSITIVITY,
  CLICK_THRESHOLD_MS,
  CLICK_THRESHOLD_PX,
  CONNECTION_GRADIENT_ID,
  ARROWHEAD_ID,
} from "@/config/graphConfig";

interface KnowledgeMapProps {
  nodes: Node[];
  connections: Connection[];
  onNodeContentNeeded: (nodeId: string) => void;
  onExploreClick: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string) => void;
  isLoadingGlobal: boolean;
  loadingNodeId: string | null;
  centralNodeId: string | null;
  activeParentId: string | null;
}

const KnowledgeMap = forwardRef<KnowledgeMapRef, KnowledgeMapProps>(
  (
    {
      nodes,
      connections,
      onNodeContentNeeded,
      onExploreClick,
      onNodeMove,
      onNodeSelect,
      isLoadingGlobal,
      loadingNodeId,
      centralNodeId,
      activeParentId,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [selectedNodeForDetail, setSelectedNodeForDetail] = useState<
      string | null
    >(null);
    const [showControls, setShowControls] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const [localNodePositions, setLocalNodePositions] = useState<
      Record<string, { x: number; y: number }>
    >({});
    const [nodeBeingDragged, setNodeBeingDragged] = useState<string | null>(
      null
    );
    const nodeDragStartScreen = useRef({ x: 0, y: 0 });
    const nodeDragStartOriginalPosition = useRef({ x: 0, y: 0 });

    const [dragDistance, setDragDistance] = useState(0);
    const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);
    const [mouseDownPos, setMouseDownPos] = useState<{
      x: number;
      y: number;
    } | null>(null);

    // Ref to track if mouse is over a scrollable area (node content or detail modal)
    const isMouseOverScrollable = useRef(false);

    const zoomAtPoint = useCallback(
      (factor: number, pointX: number, pointY: number) => {
        if (!containerRef.current) return;
        const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale * factor));
        if (newScale === scale) return;

        const worldXBeforeZoom = (pointX - offset.x) / scale;
        const worldYBeforeZoom = (pointY - offset.y) / scale;
        const newOffsetX = pointX - worldXBeforeZoom * newScale;
        const newOffsetY = pointY - worldYBeforeZoom * newScale;

        setOffset({ x: newOffsetX, y: newOffsetY });
        setScale(newScale);
      },
      [scale, offset.x, offset.y]
    );

    const centerAndZoomOnNode = useCallback(
      (nodeIdToCenter?: string, targetScale: number = 1) => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;

          let nodeToFocusOn = nodeIdToCenter
            ? nodes.find((n) => n.id === nodeIdToCenter)
            : undefined;
          if (!nodeToFocusOn && centralNodeId) {
            nodeToFocusOn = nodes.find((n) => n.id === centralNodeId);
          }

          if (nodeToFocusOn) {
            const newOffsetX =
              containerWidth / 2 -
              (nodeToFocusOn.position.x * targetScale +
                (NODE_WIDTH / 2) * targetScale);
            const newOffsetY =
              containerHeight / 2 -
              (nodeToFocusOn.position.y * targetScale +
                (NODE_HEIGHT / 2) * targetScale);
            setOffset({ x: newOffsetX, y: newOffsetY });
          } else {
            setOffset({
              x: containerWidth / 2 - (NODE_WIDTH / 2) * targetScale,
              y: containerHeight / 2 - (NODE_HEIGHT / 2) * targetScale,
            });
          }
          setScale(targetScale);
        }
      },
      [nodes, centralNodeId]
    );

    useImperativeHandle(ref, () => ({
      centerView: (nodeId?: string) => centerAndZoomOnNode(nodeId, 1),
      panToNode: (nodeId: string) => {
        if (containerRef.current) {
          const node = nodes.find((n) => n.id === nodeId);
          if (node) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            const newOffsetX =
              containerWidth / 2 -
              (node.position.x * scale + (NODE_WIDTH / 2) * scale);
            const newOffsetY =
              containerHeight / 2 -
              (node.position.y * scale + (NODE_HEIGHT / 2) * scale);
            setOffset({ x: newOffsetX, y: newOffsetY });
          }
        }
      },
    }));

    useEffect(() => {
      if (
        centralNodeId &&
        nodes.some((n) => n.id === centralNodeId) &&
        containerRef.current
      ) {
        if (nodes.length === 1 && nodes[0].id === centralNodeId) {
          centerAndZoomOnNode(centralNodeId, 1);
        }
      }
    }, [centralNodeId, nodes, centerAndZoomOnNode]);

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setNodeBeingDragged(nodeId);
      nodeDragStartScreen.current = { x: e.clientX, y: e.clientY };
      nodeDragStartOriginalPosition.current =
        localNodePositions[nodeId] || node.position;

      setMouseDownTime(Date.now());
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      setDragDistance(0);
    };

    useEffect(() => {
      const newLocalPositions: Record<string, { x: number; y: number }> = {};
      nodes.forEach((node) => {
        if (node.id !== nodeBeingDragged) {
          newLocalPositions[node.id] = node.position;
        }
      });
      // Only update if there are actual changes to avoid unnecessary re-renders
      if (Object.keys(newLocalPositions).length > 0) {
        setLocalNodePositions((prev) => ({ ...prev, ...newLocalPositions }));
      }
    }, [nodes, nodeBeingDragged]);

    const handleGlobalMouseMove = (e: React.MouseEvent) => {
      if (nodeBeingDragged) {
        const dxScreen = e.clientX - nodeDragStartScreen.current.x;
        const dyScreen = e.clientY - nodeDragStartScreen.current.y;

        const newX = nodeDragStartOriginalPosition.current.x + dxScreen / scale;
        const newY = nodeDragStartOriginalPosition.current.y + dyScreen / scale;
        setLocalNodePositions((prev) => ({
          ...prev,
          [nodeBeingDragged]: { x: newX, y: newY },
        }));

        if (mouseDownPos) {
          const newDist = Math.sqrt(
            Math.pow(e.clientX - mouseDownPos.x, 2) +
              Math.pow(e.clientY - mouseDownPos.y, 2)
          );
          setDragDistance(newDist);
        }
        return;
      }

      if (isPanning && e.buttons === 1) {
        setOffset({
          x: offset.x + (e.clientX - panStart.x),
          y: offset.y + (e.clientY - panStart.y),
        });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        if (nodeBeingDragged === nodeId) setNodeBeingDragged(null);
        return;
      }

      const isClick =
        mouseDownTime &&
        Date.now() - mouseDownTime < CLICK_THRESHOLD_MS &&
        dragDistance < CLICK_THRESHOLD_PX;

      if (nodeBeingDragged === nodeId) {
        const finalPos = localNodePositions[nodeId] || node.position;
        onNodeMove(nodeId, finalPos);
        setLocalNodePositions((prev) => ({ ...prev, [nodeId]: finalPos }));
      }

      if (isClick) {
        if (nodeId === activeParentId) {
          if (node.content) {
            setSelectedNodeForDetail(nodeId);
          } else {
            onNodeContentNeeded(nodeId);
          }
        } else {
          onNodeSelect(nodeId);
          // if (!node.content) { onNodeContentNeeded(nodeId); } // Optional: load content on select
        }
      }

      setNodeBeingDragged(null);
      setMouseDownTime(null);
      setMouseDownPos(null);
    };

    const handleCanvasMouseDown = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      // More specific type for e
      const eventTargetElement = e.target as HTMLElement;

      // Check if the click originated within a known scrollable area
      const scrollableNodeContent = eventTargetElement.closest(
        ".node-card-content-scrollable"
      );
      const scrollableDetailContent = eventTargetElement.closest(
        ".node-detail-content-scrollable"
      );

      let targetForScrollbarCheck: HTMLElement | null = null;

      if (scrollableNodeContent) {
        targetForScrollbarCheck = scrollableNodeContent as HTMLElement;
      } else if (scrollableDetailContent) {
        targetForScrollbarCheck = scrollableDetailContent as HTMLElement;
      }

      if (targetForScrollbarCheck) {
        const rect = targetForScrollbarCheck.getBoundingClientRect();
        const scrollbarWidth = 17; // Approximate scrollbar width

        // Check if the element actually has a vertical scrollbar
        const hasVerticalScrollbar =
          targetForScrollbarCheck.scrollHeight >
          targetForScrollbarCheck.clientHeight;
        // Check if the element actually has a horizontal scrollbar
        const hasHorizontalScrollbar =
          targetForScrollbarCheck.scrollWidth >
          targetForScrollbarCheck.clientWidth;

        // Calculate click position relative to the target element's top-left corner
        const xRelativeToElement = e.clientX - rect.left;
        const yRelativeToElement = e.clientY - rect.top;

        // Check if click is on the vertical scrollbar area
        if (
          hasVerticalScrollbar &&
          xRelativeToElement >=
            targetForScrollbarCheck.clientWidth - scrollbarWidth
        ) {
          return; // Click is likely on the vertical scrollbar
        }
        // Check if click is on the horizontal scrollbar area
        if (
          hasHorizontalScrollbar &&
          yRelativeToElement >=
            targetForScrollbarCheck.clientHeight - scrollbarWidth
        ) {
          return; // Click is likely on the horizontal scrollbar
        }
      }

      // Proceed with panning if not on a scrollbar of a scrollable area, not dragging a node, etc.
      if (
        e.button === 0 &&
        !nodeBeingDragged &&
        containerRef.current &&
        !eventTargetElement.closest(".node-card") &&
        !eventTargetElement.closest("button[data-control-button]")
      ) {
        setPanStart({ x: e.clientX, y: e.clientY });
        setIsPanning(true);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (nodeBeingDragged) {
        const finalPos =
          localNodePositions[nodeBeingDragged] ||
          nodes.find((n) => n.id === nodeBeingDragged)?.position;
        if (finalPos && nodeBeingDragged) {
          onNodeMove(nodeBeingDragged, finalPos);
        }
        setNodeBeingDragged(null);
        setMouseDownTime(null);
        setMouseDownPos(null);
      }
    };

    const handleWheel = (e: React.WheelEvent) => {
      // If mouse is over a known scrollable area, or if the target of the wheel event is scrollable, let the browser handle it.
      if (isMouseOverScrollable.current) {
        // Check if the scrollable element can actually scroll in the wheel direction
        const target = e.target as HTMLElement;
        const scrollableAncestor = target.closest(
          ".node-card-content-scrollable, .node-detail-content-scrollable"
        );

        if (scrollableAncestor) {
          const canScrollUp = e.deltaY < 0 && scrollableAncestor.scrollTop > 0;
          const canScrollDown =
            e.deltaY > 0 &&
            scrollableAncestor.scrollTop <
              scrollableAncestor.scrollHeight - scrollableAncestor.clientHeight;
          if (canScrollUp || canScrollDown) {
            return; // Don't preventDefault, let the element scroll
          }
        }
      }

      e.preventDefault(); // Prevent page scroll, then handle map zoom
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const deltaFactor =
        e.deltaY > 0 ? 1 / ZOOM_SENSITIVITY : ZOOM_SENSITIVITY;
      zoomAtPoint(deltaFactor, mouseX, mouseY);
    };

    const visibleNodes = useMemo(() => {
      if (!centralNodeId) return [];
      const central = nodes.find((n) => n.id === centralNodeId);
      if (!central) return [];

      const uniqueNodes = new Map<string, Node>();
      uniqueNodes.set(central.id, central);

      if (activeParentId) {
        const activeParentNode = nodes.find((n) => n.id === activeParentId);
        if (activeParentNode) {
          uniqueNodes.set(activeParentNode.id, activeParentNode);
          nodes.forEach((node) => {
            if (node.parentId === activeParentId)
              uniqueNodes.set(node.id, node);
          });

          if (activeParentNode.parentId) {
            const grandparent = nodes.find(
              (n) => n.id === activeParentNode.parentId
            );
            if (grandparent) {
              uniqueNodes.set(grandparent.id, grandparent); // Show grandparent
              nodes.forEach((node) => {
                // Show siblings of active parent
                if (
                  node.parentId === activeParentNode.parentId &&
                  node.id !== activeParentId
                ) {
                  uniqueNodes.set(node.id, node);
                }
              });
              // Show siblings of grandparent (if grandparent itself has a parent)
              if (grandparent.parentId) {
                nodes.forEach((node) => {
                  if (
                    node.parentId === grandparent.parentId &&
                    node.id !== grandparent.id
                  ) {
                    uniqueNodes.set(node.id, node);
                  }
                });
              }
            }
          }
        }
      }
      return Array.from(uniqueNodes.values());
    }, [nodes, centralNodeId, activeParentId]);

    const visibleConnections = useMemo(() => {
      const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
      return connections.filter(
        (conn) =>
          visibleNodeIds.has(conn.source) && visibleNodeIds.has(conn.target)
      );
    }, [connections, visibleNodes]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden cursor-grab bg-gradient-to-br from-gray-950 to-black select-none"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleGlobalMouseMove}
        onMouseUp={handleGlobalMouseUp}
        onMouseLeave={handleGlobalMouseUp}
        onWheel={handleWheel} // This onWheel now has the conditional logic
        style={{
          cursor: isPanning ? "grabbing" : nodeBeingDragged ? "move" : "grab",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: `${30 * scale}px ${30 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
            willChange: "background-position",
          }}
        />

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <linearGradient
              id={CONNECTION_GRADIENT_ID}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.7)" />
              <stop offset="100%" stopColor="rgba(147, 51, 234, 0.7)" />
            </linearGradient>
            <marker
              id={ARROWHEAD_ID}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="rgba(147, 51, 234, 0.7)"
              />
            </marker>
          </defs>
          <g
            transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}
            style={{ willChange: "transform" }}
          >
            {visibleConnections.map((connection) => {
              const sourceNodeFromProps = nodes.find(
                (n) => n.id === connection.source
              );
              const targetNodeFromProps = nodes.find(
                (n) => n.id === connection.target
              );
              if (!sourceNodeFromProps || !targetNodeFromProps) return null;

              const sourcePos =
                localNodePositions[connection.source] ||
                sourceNodeFromProps.position;
              const targetPos =
                localNodePositions[connection.target] ||
                targetNodeFromProps.position;

              const sourceX = sourcePos.x + NODE_WIDTH;
              const sourceY = sourcePos.y + NODE_HEIGHT / 2;
              const targetX = targetPos.x;
              const targetY = targetPos.y + NODE_HEIGHT / 2;

              return (
                <path
                  key={connection.id}
                  d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
                  fill="none"
                  stroke={`url(#${CONNECTION_GRADIENT_ID})`}
                  strokeWidth={2 / scale}
                  strokeOpacity="0.6"
                  markerEnd={`url(#${ARROWHEAD_ID})`}
                />
              );
            })}
          </g>
        </svg>

        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "top left",
            willChange: "transform",
          }}
        >
          <AnimatePresence>
            {visibleNodes.map((nodeFromProps) => {
              const currentPosition =
                localNodePositions[nodeFromProps.id] || nodeFromProps.position;

              const isNodeCentral = nodeFromProps.id === centralNodeId;
              const isNodeActiveParent = nodeFromProps.id === activeParentId;
              const isNodeActiveChild =
                nodeFromProps.parentId === activeParentId &&
                nodeFromProps.id !== activeParentId;
              const isNodeLoadingSpecific =
                loadingNodeId === nodeFromProps.id && !isLoadingGlobal;
              const isNodeHovered = hoveredNode === nodeFromProps.id;
              const isNodeBeingDragged = nodeBeingDragged === nodeFromProps.id;

              const isHighlighted =
                isNodeCentral || isNodeActiveParent || isNodeActiveChild;
              const nodeOpacity = isNodeBeingDragged
                ? 1
                : isHighlighted
                ? 1
                : 0.65;

              return (
                <motion.div
                  key={nodeFromProps.id}
                  className="absolute cursor-move pointer-events-auto"
                  style={{
                    left: `${currentPosition.x}px`,
                    top: `${currentPosition.y}px`,
                    width: `${NODE_WIDTH}px`,
                    height: `${NODE_HEIGHT}px`,
                    zIndex: isNodeBeingDragged
                      ? 20
                      : isNodeHovered
                      ? 15
                      : isNodeCentral
                      ? 10
                      : isNodeActiveParent
                      ? 5
                      : 1,
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: nodeOpacity,
                    scale: 1,
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: { duration: 0.2, ease: "easeIn" },
                  }}
                  onMouseEnter={() => setHoveredNode(nodeFromProps.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleNodeMouseDown(e, nodeFromProps.id)}
                  onMouseUp={(e) => handleNodeMouseUp(e, nodeFromProps.id)}
                >
                  <div
                    className={`node-card w-full h-full flex flex-col overflow-hidden transition-all duration-200 border-2 rounded-xl shadow-xl bg-gray-900/80 backdrop-blur-md
                      ${
                        isNodeCentral
                          ? "border-blue-500/80 shadow-blue-500/40"
                          : isNodeActiveParent
                          ? "border-purple-500/80 shadow-purple-500/40"
                          : isNodeActiveChild
                          ? "border-teal-500/70 shadow-teal-500/30"
                          : "border-gray-700/60"
                      }`}
                    style={{
                      boxShadow:
                        isNodeHovered || isNodeBeingDragged
                          ? `0 0 0 2.5px rgba(96, 165, 250, 0.8), 0 0 30px 6px rgba(96, 165, 250, 0.5)`
                          : isNodeCentral
                          ? `0 0 20px 3px rgba(59, 130, 246, 0.35)`
                          : isNodeActiveParent
                          ? `0 0 20px 3px rgba(147, 51, 234, 0.35)`
                          : isNodeActiveChild
                          ? `0 0 15px 2px rgba(20, 184, 166, 0.3)`
                          : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div className="p-3 border-b border-gray-800/50 bg-black/40 flex justify-between items-center shrink-0">
                      <h3 className="text-sm font-medium truncate text-white flex-grow pr-2">
                        {nodeFromProps.title}
                      </h3>
                      {isNodeLoadingSpecific && (
                        <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-400 animate-spin ml-auto"></div>
                      )}
                    </div>
                    {/* ADDED MOUSE ENTER/LEAVE HANDLERS AND A CLASS FOR SCROLL DETECTION */}
                    <div
                      className="p-4 overflow-y-auto text-sm text-gray-300 flex-grow scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50 node-card-content-scrollable"
                      onMouseEnter={() => {
                        isMouseOverScrollable.current = true;
                      }}
                      onMouseLeave={() => {
                        isMouseOverScrollable.current = false;
                      }}
                    >
                      {nodeFromProps.content ? (
                        <div className="node-card-content prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{nodeFromProps.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 italic">
                          {isNodeLoadingSpecific ? (
                            <>
                              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-400 animate-spin mb-2"></div>
                              Loading content...
                            </>
                          ) : (
                            "Click to load content"
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-800/50 bg-black/40 flex justify-end space-x-2 shrink-0">
                      {nodeFromProps.content && !nodeFromProps.hasExplored && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExploreClick(nodeFromProps.id);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-2.5 py-1.5"
                          disabled={isNodeLoadingSpecific || isLoadingGlobal}
                          size="sm"
                        >
                          {" "}
                          <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Explore{" "}
                        </Button>
                      )}
                      {nodeFromProps.content &&
                        nodeFromProps.hasExplored &&
                        nodeFromProps.id !== activeParentId && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNodeSelect(nodeFromProps.id);
                            }}
                            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white text-xs px-2.5 py-1.5"
                            disabled={isLoadingGlobal}
                            size="sm"
                          >
                            {" "}
                            <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Focus{" "}
                          </Button>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {isLoadingGlobal && !loadingNodeId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center p-6 bg-gray-800/70 rounded-lg shadow-xl">
              <div className="relative mb-4">
                <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-r-4 border-l-4 border-purple-500 animate-ping opacity-40"></div>
              </div>
              <p className="text-lg text-blue-300 font-semibold">
                Exploring new depths...
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute bottom-6 right-6 p-2 z-20 bg-gray-900/60 backdrop-blur-md rounded-lg shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex flex-col gap-2">
                <Button
                  data-control-button
                  size="icon"
                  variant="ghost"
                  title="Zoom In"
                  className="h-9 w-9 rounded-md bg-gray-800/80 hover:bg-gray-700 text-blue-300 hover:text-blue-200"
                  onClick={() =>
                    containerRef.current &&
                    zoomAtPoint(
                      ZOOM_SENSITIVITY,
                      containerRef.current.clientWidth / 2,
                      containerRef.current.clientHeight / 2
                    )
                  }
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                  data-control-button
                  size="icon"
                  variant="ghost"
                  title="Zoom Out"
                  className="h-9 w-9 rounded-md bg-gray-800/80 hover:bg-gray-700 text-blue-300 hover:text-blue-200"
                  onClick={() =>
                    containerRef.current &&
                    zoomAtPoint(
                      1 / ZOOM_SENSITIVITY,
                      containerRef.current.clientWidth / 2,
                      containerRef.current.clientHeight / 2
                    )
                  }
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  data-control-button
                  size="icon"
                  variant="ghost"
                  title="Reset Zoom (1x)"
                  className="h-9 w-9 rounded-md bg-gray-800/80 hover:bg-gray-700 text-blue-300 hover:text-blue-200"
                  onClick={() =>
                    containerRef.current &&
                    zoomAtPoint(
                      1 / scale,
                      containerRef.current.clientWidth / 2,
                      containerRef.current.clientHeight / 2
                    )
                  }
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button
                  data-control-button
                  size="icon"
                  variant="ghost"
                  title="Center on Main Topic"
                  className="h-9 w-9 rounded-md bg-gray-800/80 hover:bg-gray-700 text-blue-300 hover:text-blue-200"
                  onClick={() =>
                    centerAndZoomOnNode(centralNodeId ?? undefined, 1)
                  }
                >
                  <Home className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          data-control-button
          size="icon"
          variant="ghost"
          className="absolute bottom-6 right-20 h-9 w-9 rounded-lg bg-gray-800/60 hover:bg-gray-700/80 text-gray-400 hover:text-gray-200 backdrop-blur-md shadow-xl"
          onClick={() => setShowControls(!showControls)}
          title={showControls ? "Hide Controls" : "Show Controls"}
        >
          {" "}
          {showControls ? (
            <X className="h-5 w-5" />
          ) : (
            <Move className="h-5 w-5" />
          )}{" "}
        </Button>

        {/* MODIFIED NodeDetail TO USE isMouseOverScrollable.current */}
        <AnimatePresence>
          {selectedNodeForDetail &&
            nodes.find((n) => n.id === selectedNodeForDetail) && (
              <NodeDetail
                node={nodes.find((n) => n.id === selectedNodeForDetail)!}
                onClose={() => {
                  setSelectedNodeForDetail(null);
                  isMouseOverScrollable.current = false;
                }} // Reset on close
                onExplore={() => {
                  if (selectedNodeForDetail) {
                    onExploreClick(selectedNodeForDetail);
                    setSelectedNodeForDetail(null);
                    isMouseOverScrollable.current = false;
                  }
                }}
                onShowPrerequisites={() => {
                  if (selectedNodeForDetail) {
                    onNodeSelect(selectedNodeForDetail);
                    setSelectedNodeForDetail(null);
                    isMouseOverScrollable.current = false;
                  }
                }}
                // Pass down functions to set the ref from inside NodeDetail
                onMouseEnterContent={() =>
                  (isMouseOverScrollable.current = true)
                }
                onMouseLeaveContent={() =>
                  (isMouseOverScrollable.current = false)
                }
              />
            )}
        </AnimatePresence>
      </div>
    );
  }
);

KnowledgeMap.displayName = "KnowledgeMap";
export default KnowledgeMap;
