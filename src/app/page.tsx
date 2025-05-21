"use client";

import { useState, useRef, useEffect } from "react";
import QueryInput from "@/components/query-input";
import KnowledgeMap from "@/components/knowledge-map";
import { generateAIResponse, extractPrerequisites } from "@/lib/ai-service";
import type { Node, Connection } from "@/types/graph";
import { motion } from "framer-motion";

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [centralNodeId, setCentralNodeId] = useState<string | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Set first load to false after a delay
    const timer = setTimeout(() => {
      setIsFirstLoad(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleQuery = async (query: string) => {
    setIsLoading(true);

    try {
      // Reset the graph
      setNodes([]);
      setConnections([]);

      // Generate initial response
      const response = await generateAIResponse(query);

      // Create the central node
      const centralNode: Node = {
        id: `node-${Date.now()}`,
        title: query,
        content: response,
        depth: 0,
        position: { x: 100, y: 100 }, // Position for central node
        hasExplored: false,
      };

      setNodes([centralNode]);
      setCentralNodeId(centralNode.id);
      setActiveParentId(centralNode.id);
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplore = async (nodeId: string) => {
    if (isLoading) return;

    const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
    if (
      nodeIndex === -1 ||
      !nodes[nodeIndex].content ||
      nodes[nodeIndex].hasExplored
    )
      return;

    setLoadingNodeId(nodeId);
    setActiveParentId(nodeId);

    try {
      const node = nodes[nodeIndex];

      // Extract prerequisites
      const prerequisites = await extractPrerequisites(
        node.content,
        node.title
      );

      // Create new nodes and connections
      const newNodes = [...nodes];
      const newConnections = [...connections];

      // Mark the node as explored
      newNodes[nodeIndex] = {
        ...newNodes[nodeIndex],
        hasExplored: true,
      };

      // Position prerequisites in a vertical column to the right
      const startY = Math.max(
        50,
        node.position.y - (prerequisites.length * 300) / 2
      );
      const spacing = 300; // Vertical spacing between nodes

      for (let i = 0; i < prerequisites.length; i++) {
        const prerequisite = prerequisites[i];
        const newNodeId = `node-${Date.now()}-${i}`;

        // Position to the right of the parent node in a vertical column
        const x = node.position.x + 400; // Fixed X position to the right
        const y = startY + i * spacing; // Stacked vertically

        const newNode: Node = {
          id: newNodeId,
          title: prerequisite,
          content: "",
          depth: node.depth + 1,
          position: { x, y },
          hasExplored: false,
          parentId: node.id,
        };

        newNodes.push(newNode);
        newConnections.push({
          id: `conn-${Date.now()}-${i}`,
          source: node.id,
          target: newNodeId,
        });
      }

      setNodes(newNodes);
      setConnections(newConnections);
    } catch (error) {
      console.error("Error exploring prerequisites:", error);
    } finally {
      setLoadingNodeId(null);
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    // Set the selected node as the active parent
    setActiveParentId(nodeId);
  };

  const handleNodeMove = (
    nodeId: string,
    newPosition: { x: number; y: number }
  ) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, position: newPosition } : node
      )
    );
  };

  const loadNodeContent = async (nodeId: string) => {
    if (isLoading || loadingNodeId) return;

    const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1 || nodes[nodeIndex].content) return;

    setLoadingNodeId(nodeId);

    try {
      // Generate content for this prerequisite
      const response = await generateAIResponse(nodes[nodeIndex].title);

      // Update the node with content
      const updatedNodes = [...nodes];
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        content: response,
      };

      setNodes(updatedNodes);
    } catch (error) {
      console.error("Error loading node content:", error);
    } finally {
      setLoadingNodeId(null);
    }
  };

  // Get all parent nodes for the breadcrumb navigation
  const getParentNodes = () => {
    if (!activeParentId || !centralNodeId) return [];

    const result = [];
    let currentId = activeParentId;

    // Start with the active parent
    const activeNode = nodes.find((n) => n.id === currentId);
    if (activeNode) result.unshift(activeNode);

    // Traverse up the parent chain until we reach the central node
    while (currentId && currentId !== centralNodeId) {
      const node = nodes.find((n) => n.id === currentId);
      if (!node || !node.parentId) break;

      currentId = node.parentId;
      const parentNode = nodes.find((n) => n.id === currentId);
      if (parentNode) result.unshift(parentNode);
    }

    // Add the central node at the beginning if it's not already there
    if (result.length === 0 || result[0].id !== centralNodeId) {
      const centralNode = nodes.find((n) => n.id === centralNodeId);
      if (centralNode) result.unshift(centralNode);
    }

    return result;
  };

  const parentNodes = getParentNodes();

  return (
    <main className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <motion.div
        className="p-4 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-3">
              <span className="text-white font-bold">R</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Rabbit Hole Explorer
            </h1>
          </div>

          {/* Breadcrumb navigation */}
          {nodes.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-400 overflow-x-auto max-w-md">
              {parentNodes.map((node, index) => (
                <div key={node.id} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-gray-600">/</span>}
                  <button
                    onClick={() => setActiveParentId(node.id)}
                    className={`hover:text-white transition-colors whitespace-nowrap ${
                      node.id === activeParentId ? "text-white font-medium" : ""
                    }`}
                  >
                    {node.title}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex-1 relative overflow-hidden">
        {nodes.length > 0 ? (
          <KnowledgeMap
            ref={mapRef}
            nodes={nodes}
            connections={connections}
            onNodeClick={loadNodeContent}
            onExploreClick={handleExplore}
            onNodeMove={handleNodeMove}
            onNodeSelect={handleNodeSelect}
            isLoading={isLoading}
            loadingNodeId={loadingNodeId}
            centralNodeId={centralNodeId}
            activeParentId={activeParentId}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isFirstLoad ? (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">R</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  Rabbit Hole Explorer
                </h2>
                <p className="text-gray-400 max-w-md">
                  Enter a topic below to start exploring its prerequisites and
                  dive down the rabbit hole of knowledge.
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-gray-500">
                  Enter a topic to begin your exploration
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-800/50 bg-gray-950/80 backdrop-blur-sm">
        <QueryInput onSubmit={handleQuery} isLoading={isLoading} />
      </div>
    </main>
  );
}
