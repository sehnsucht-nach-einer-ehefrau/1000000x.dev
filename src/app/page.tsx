"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import QueryInput from "@/components/query-input";
import KnowledgeMap from "@/components/knowledge-map";
import { generateAIResponse, extractPrerequisites } from "@/lib/ai-service";
import type { Node, Connection, KnowledgeMapRef } from "@/types/graph";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  CHILD_NODE_X_OFFSET,
  CHILD_NODE_Y_INCREMENT,
} from "@/config/graphConfig";

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [centralNodeId, setCentralNodeId] = useState<string | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const mapRef = useRef<KnowledgeMapRef>(null);

  const handleQuery = async (query: string) => {
    setIsLoadingGlobal(true);
    setNodes([]);
    setConnections([]);
    setCentralNodeId(null);
    setActiveParentId(null);

    try {
      const response = await generateAIResponse(query);
      const newCentralNodeId = `node-query-${Date.now()}`;
      const centralNode: Node = {
        id: newCentralNodeId,
        title: query,
        content: response,
        depth: 0,
        position: { x: 0, y: 0 },
        hasExplored: false,
      };

      setNodes([centralNode]);
      setCentralNodeId(newCentralNodeId);
      setActiveParentId(newCentralNodeId);
    } catch (error) {
      console.error("Error processing query:", error);
      alert(
        `Failed to process query: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  const handleExplorePrerequisites = useCallback(
    async (nodeId: string) => {
      const parentNode = nodes.find((n) => n.id === nodeId);
      if (!parentNode || isLoadingGlobal || loadingNodeId === nodeId) return;

      if (parentNode.hasExplored && parentNode.id === activeParentId) {
        mapRef.current?.panToNode(nodeId);
        return;
      }

      setIsLoadingGlobal(true);
      setLoadingNodeId(nodeId);
      setActiveParentId(nodeId);

      try {
        let nodeContent = parentNode.content;
        if (!nodeContent) {
          nodeContent = await generateAIResponse(parentNode.title);
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId
                ? { ...n, content: nodeContent!, hasExplored: false }
                : n
            )
          );
        }

        const prerequisites = await extractPrerequisites(
          nodeContent!,
          parentNode.title
        );

        // Use a function form of setNodes to get the latest nodes state for positioning
        setNodes((prevNodes) => {
          const currentParentNodeFromState = prevNodes.find(
            (n) => n.id === nodeId
          )!; // Parent must exist
          const newChildNodes: Node[] = [];
          const newConnectionsToAdd: Connection[] = [];

          const totalBlockHeight =
            prerequisites.length * CHILD_NODE_Y_INCREMENT -
            (CHILD_NODE_Y_INCREMENT - NODE_HEIGHT);
          const startY =
            currentParentNodeFromState.position.y +
            NODE_HEIGHT / 2 -
            totalBlockHeight / 2;

          prerequisites.forEach((prerequisiteTitle, i) => {
            const existingChildByTitleForThisParent = prevNodes.find(
              (n) => n.parentId === nodeId && n.title === prerequisiteTitle
            );

            if (existingChildByTitleForThisParent) {
              const connectionExists = connections.some(
                (c) =>
                  c.source === nodeId &&
                  c.target === existingChildByTitleForThisParent.id
              );
              if (!connectionExists) {
                newConnectionsToAdd.push({
                  id: `conn-${nodeId}-${existingChildByTitleForThisParent.id}`,
                  source: nodeId,
                  target: existingChildByTitleForThisParent.id,
                });
              }
              return;
            }

            const newNodeId = `node-${nodeId}-child-${i}-${Date.now()}`;

            newChildNodes.push({
              id: newNodeId,
              title: prerequisiteTitle,
              content: "",
              depth: currentParentNodeFromState.depth + 1,
              position: {
                x: currentParentNodeFromState.position.x + CHILD_NODE_X_OFFSET,
                y: startY + i * CHILD_NODE_Y_INCREMENT,
              },
              hasExplored: false,
              parentId: nodeId,
            });
            newConnectionsToAdd.push({
              id: `conn-${nodeId}-${newNodeId}`,
              source: nodeId,
              target: newNodeId,
            });
          });

          // Update connections based on the new connections to add
          if (newConnectionsToAdd.length > 0) {
            setConnections((prevConns) => {
              const currentConnectionIds = new Set(prevConns.map((c) => c.id));
              const trulyNewConnections = newConnectionsToAdd.filter(
                (nc) => !currentConnectionIds.has(nc.id)
              );
              return [...prevConns, ...trulyNewConnections];
            });
          }

          const updatedParentInArray = {
            ...currentParentNodeFromState,
            hasExplored: true,
            content: nodeContent!,
          };
          const otherNodesInArray = prevNodes.filter((n) => n.id !== nodeId);
          return [...otherNodesInArray, updatedParentInArray, ...newChildNodes];
        });

        requestAnimationFrame(() => mapRef.current?.panToNode(nodeId));
      } catch (error) {
        console.error(`Error exploring prerequisites for ${nodeId}:`, error);
        alert(
          `Failed to explore prerequisites: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setNodes((prev) =>
          prev.map((n) => (n.id === nodeId ? { ...n, hasExplored: false } : n))
        );
      } finally {
        setIsLoadingGlobal(false);
        setLoadingNodeId(null);
      }
    },
    [nodes, connections, isLoadingGlobal, loadingNodeId, activeParentId]
  ); // Added connections dependency

  const handleNodeContentNeeded = useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.content || loadingNodeId === nodeId || isLoadingGlobal)
        return;

      setLoadingNodeId(nodeId);
      try {
        const response = await generateAIResponse(node.title);
        setNodes((prev) =>
          prev.map((n) => (n.id === nodeId ? { ...n, content: response } : n))
        );
      } catch (error) {
        console.error(`Error loading content for ${nodeId}:`, error);
        alert(
          `Failed to load content: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoadingNodeId(null);
      }
    },
    [nodes, loadingNodeId, isLoadingGlobal]
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setActiveParentId(nodeId);
    requestAnimationFrame(() => mapRef.current?.panToNode(nodeId));
  }, []);

  const handleNodeMove = useCallback(
    (nodeId: string, newPosition: { x: number; y: number }) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId ? { ...node, position: newPosition } : node
        )
      );
    },
    []
  );

  const breadcrumbPath = useMemo(() => {
    if (!activeParentId || !centralNodeId || nodes.length === 0) return [];
    const path: Node[] = [];
    let currentNode = nodes.find((n) => n.id === activeParentId);
    while (currentNode) {
      path.unshift(currentNode);
      if (currentNode.id === centralNodeId) break;
      if (!currentNode.parentId) break;
      currentNode = nodes.find((n) => n.id === currentNode!.parentId);
      if (path.length > 15) break;
    }
    return path;
  }, [nodes, activeParentId, centralNodeId]);

  return (
    <main className="flex flex-col h-screen bg-black text-white overflow-hidden antialiased pt-4">
      <motion.header /* ... same ... */>
        <div className="flex items-center justify-between max-w-full mx-auto px-2 sm:px-4">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mr-3 shadow-md">
              <span className="text-white font-bold text-lg">10x</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              The 10x Developer
            </h1>
          </div>

          {nodes.length > 0 && breadcrumbPath.length > 0 && (
            <nav
              className="flex items-center text-sm text-gray-400 overflow-x-auto max-w-sm md:max-w-md lg:max-w-xl scrollbar-thin scrollbar-thumb-gray-700/80 scrollbar-track-transparent py-1"
              aria-label="Breadcrumb"
            >
              {breadcrumbPath.map((node, index) => (
                <div
                  key={node.id}
                  className="flex items-center whitespace-nowrap"
                >
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 mx-1 text-gray-600 shrink-0" />
                  )}
                  <button
                    onClick={() => handleNodeSelect(node.id)}
                    title={node.title}
                    className={`px-2 py-1 rounded-md hover:text-white hover:bg-gray-700/60 transition-colors truncate max-w-[150px] sm:max-w-[200px]
                      ${
                        node.id === activeParentId
                          ? "text-white font-semibold bg-gray-700/70 ring-1 ring-purple-500/50"
                          : ""
                      }`}
                  >
                    {node.title}
                  </button>
                </div>
              ))}
            </nav>
          )}
        </div>
      </motion.header>

      <div className="flex-1 relative overflow-hidden">
        {nodes.length > 0 ? (
          <KnowledgeMap
            ref={mapRef}
            nodes={nodes}
            connections={connections}
            onNodeContentNeeded={handleNodeContentNeeded}
            onExploreClick={handleExplorePrerequisites}
            onNodeMove={handleNodeMove}
            onNodeSelect={handleNodeSelect}
            isLoadingGlobal={isLoadingGlobal}
            loadingNodeId={loadingNodeId}
            centralNodeId={centralNodeId}
            activeParentId={activeParentId}
          />
        ) : (
          <AnimatePresence>
            {!isLoadingGlobal && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: "circOut" }}
              >
                <div className="h-20 w-20 mb-8 rounded-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl ring-4 ring-purple-500/30">
                  <span className="text-white font-bold text-4xl">10x</span>
                </div>
                <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  Welcome to the 10x Developer
                </h2>
                <p className="text-gray-400 max-w-lg text-lg leading-relaxed">
                  What do you want to know more about?
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 sm:p-6 border-t border-gray-800/60 bg-gray-950/85 backdrop-blur-md z-10">
        <QueryInput
          onSubmit={handleQuery}
          isLoading={isLoadingGlobal && nodes.length === 0}
        />
      </div>
    </main>
  );
}
