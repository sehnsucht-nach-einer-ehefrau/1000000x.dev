"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import QueryInput from "@/components/query-input";
import KnowledgeMap from "@/components/knowledge-map";
import {
  generateAIResponse,
  extractPrerequisites,
  continueChatOnTopic,
  type ChatTurn,
} from "@/lib/ai-service";
import type { Node, Connection, KnowledgeMapRef } from "@/types/graph";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  MessageSquare,
  Network,
  PlusCircle,
  Send,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import {
  NODE_HEIGHT,
  CHILD_NODE_X_OFFSET,
  CHILD_NODE_Y_INCREMENT,
} from "@/config/graphConfig";

type ViewMode = "chat" | "graph";

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [centralNodeId, setCentralNodeId] = useState<string | null>(null);
  const [activeGraphParentId, setActiveGraphParentId] = useState<string | null>(
    null
  );
  const [activeChatNodeId, setActiveChatNodeId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const mapRef = useRef<KnowledgeMapRef>(null);

  const [chatInputValue, setChatInputValue] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [selectedTextForNewNode, setSelectedTextForNewNode] = useState<
    string | null
  >(null);
  const [textSelectionPopup, setTextSelectionPopup] = useState<{
    x: number;
    y: number;
    show: boolean;
  }>({ x: 0, y: 0, show: false });
  const contentAndChatDisplayRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const handleInitialQuery = async (query: string) => {
    setIsLoadingGlobal(true);
    setNodes([]);
    setConnections([]);
    setCentralNodeId(null);
    setActiveGraphParentId(null);
    setActiveChatNodeId(null);
    setViewMode("chat");

    try {
      const responseContent = await generateAIResponse(query);
      if (responseContent.startsWith("Error generating content:")) {
        alert(responseContent);
        throw new Error(responseContent);
      }
      const newId = `node-query-${Date.now()}`;
      const centralNode: Node = {
        id: newId,
        title: query,
        content: responseContent,
        depth: 0,
        position: { x: 0, y: 0 },
        hasExplored: false,
        chatHistory: [],
      };
      setNodes([centralNode]);
      setCentralNodeId(newId);
      setActiveChatNodeId(newId);
      setActiveGraphParentId(newId);
    } catch (error) {
      console.error("Error processing initial query:", error);
      if (
        !(
          error instanceof Error &&
          error.message.startsWith("Error generating content:")
        )
      ) {
        alert(
          `Failed to process query: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  const loadNodeContentIfNeeded = useCallback(
    async (nodeId: string): Promise<string | null> => {
      const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return null;

      const node = nodes[nodeIndex];
      // If content is present and not an error message, return it
      if (
        node.content &&
        !node.content.startsWith("Error generating content:") &&
        !node.content.startsWith("Error loading content:")
      ) {
        return node.content;
      }

      // If content is an error or empty, attempt to load/reload
      setLoadingNodeId(nodeId);
      try {
        const content = await generateAIResponse(node.title);
        setNodes((prevNodes) =>
          prevNodes.map((n) => (n.id === nodeId ? { ...n, content } : n))
        );
        if (
          content.startsWith("Error generating content:") ||
          content.startsWith("Error loading content:")
        ) {
          return null;
        }
        return content;
      } catch (error) {
        console.error(`Error loading content for ${nodeId}:`, error);
        const errorMessage = `Error loading content: ${
          error instanceof Error ? error.message : "Please try again."
        }`;
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === nodeId ? { ...n, content: errorMessage } : n
          )
        );
        return null;
      } finally {
        setLoadingNodeId(null);
      }
    },
    [nodes]
  );

  const handleExplorePrerequisites = useCallback(
    async (
      parentNodeId: string,
      isFromChatSelection = false,
      selectedTextAsTitle?: string
    ) => {
      const parentNode = nodes.find((n) => n.id === parentNodeId);
      if (!parentNode || isLoadingGlobal || loadingNodeId === parentNodeId)
        return;

      if (
        parentNode.hasExplored &&
        !isFromChatSelection &&
        !selectedTextAsTitle
      ) {
        setActiveGraphParentId(parentNodeId);
        if (viewMode === "graph") mapRef.current?.panToNode(parentNodeId);
        return;
      }

      setLoadingNodeId(parentNodeId);
      if (!isFromChatSelection) setIsLoadingGlobal(true);

      try {
        const parentContent = await loadNodeContentIfNeeded(parentNodeId);
        if (
          !parentContent ||
          parentContent.startsWith("Error generating content:") ||
          parentContent.startsWith("Error loading content:")
        ) {
          throw new Error(
            "Parent content not available or contains an error. Cannot extract prerequisites."
          );
        }

        const prerequisiteTitles = selectedTextAsTitle
          ? [selectedTextAsTitle]
          : await extractPrerequisites(parentContent, parentNode.title);
        if (prerequisiteTitles.length === 0 && !selectedTextAsTitle) {
          console.log(`No prerequisites found for "${parentNode.title}"`);
          setNodes((prevNodes) =>
            prevNodes.map((n) =>
              n.id === parentNodeId
                ? { ...n, hasExplored: true, content: parentContent }
                : n
            )
          );
        }

        setNodes((prevNodes) => {
          const currentParentNode = prevNodes.find(
            (n) => n.id === parentNodeId
          )!;
          const newChildNodesToAdd: Node[] = [];
          let existingChildToFocus: Node | null = null;
          const newConnectionsToAdd: Connection[] = [];

          const totalBlockHeight =
            prerequisiteTitles.length * CHILD_NODE_Y_INCREMENT -
            (CHILD_NODE_Y_INCREMENT - NODE_HEIGHT);
          const startY =
            currentParentNode.position.y +
            NODE_HEIGHT / 2 -
            totalBlockHeight / 2;

          prerequisiteTitles.forEach((prereqTitle, i) => {
            const existingChildByTitle = prevNodes.find(
              (n) =>
                n.parentId === parentNodeId &&
                n.title.toLowerCase() === prereqTitle.toLowerCase()
            );

            if (existingChildByTitle) {
              if (!isFromChatSelection) {
                const connExists = connections.some(
                  (c) =>
                    c.source === parentNodeId &&
                    c.target === existingChildByTitle.id
                );
                if (!connExists)
                  newConnectionsToAdd.push({
                    id: `conn-${parentNodeId}-${existingChildByTitle.id}`,
                    source: parentNodeId,
                    target: existingChildByTitle.id,
                  });
              } else if (
                selectedTextAsTitle &&
                existingChildByTitle.title.toLowerCase() ===
                  selectedTextAsTitle.toLowerCase()
              ) {
                existingChildToFocus = existingChildByTitle;
                return;
              }
            }

            if (
              isFromChatSelection &&
              existingChildToFocus &&
              existingChildToFocus.title.toLowerCase() ===
                prereqTitle.toLowerCase()
            ) {
              return;
            }

            const newNodeId = `node-${parentNodeId}-child-${
              selectedTextAsTitle ? "sel" : i
            }-${Date.now()}`;
            const newNodeInstance = {
              id: newNodeId,
              title: prereqTitle,
              content: "",
              depth: currentParentNode.depth + 1,
              position: {
                x: currentParentNode.position.x + CHILD_NODE_X_OFFSET,
                y: startY + i * CHILD_NODE_Y_INCREMENT,
              },
              hasExplored: false,
              parentId: parentNodeId,
              chatHistory: [],
            };
            newChildNodesToAdd.push(newNodeInstance);
            newConnectionsToAdd.push({
              id: `conn-${parentNodeId}-${newNodeId}`,
              source: parentNodeId,
              target: newNodeId,
            });
          });

          if (newConnectionsToAdd.length > 0) {
            setConnections((prevConns) => {
              const existingConnIds = new Set(prevConns.map((c) => c.id));
              return [
                ...prevConns,
                ...newConnectionsToAdd.filter(
                  (nc) => !existingConnIds.has(nc.id)
                ),
              ];
            });
          }

          const updatedParent = {
            ...currentParentNode,
            hasExplored: true,
            content: parentContent,
          };
          const otherNodes = prevNodes.filter((n) => n.id !== parentNodeId);
          const finalNodes = [
            ...otherNodes,
            updatedParent,
            ...newChildNodesToAdd,
          ];

          if (isFromChatSelection) {
            const nodeToFocus =
              existingChildToFocus ||
              (newChildNodesToAdd.length > 0 ? newChildNodesToAdd[0] : null);
            if (nodeToFocus) {
              setActiveChatNodeId(nodeToFocus.id);
              if (
                !nodeToFocus.content ||
                nodeToFocus.content.startsWith("Error")
              ) {
                loadNodeContentIfNeeded(nodeToFocus.id);
              }
            }
          } else if (!isFromChatSelection) {
            setActiveGraphParentId(parentNodeId);
            if (viewMode === "graph")
              requestAnimationFrame(() =>
                mapRef.current?.panToNode(parentNodeId)
              );
          }
          return finalNodes;
        });
      } catch (error) {
        console.error(`Error exploring for ${parentNodeId}:`, error);
        alert(
          `Failed to explore: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setNodes((prev) =>
          prev.map((n) =>
            n.id === parentNodeId ? { ...n, hasExplored: false } : n
          )
        );
      } finally {
        setLoadingNodeId(null);
        if (!isFromChatSelection) setIsLoadingGlobal(false);
      }
    },
    [
      nodes,
      connections,
      isLoadingGlobal,
      loadingNodeId,
      viewMode,
      loadNodeContentIfNeeded, // Removed activeGraphParentId as it's set within the function
    ]
  );

  const handleSetActiveChatNode = useCallback(
    (nodeId: string) => {
      setActiveChatNodeId(nodeId);
      loadNodeContentIfNeeded(nodeId);
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    },
    [loadNodeContentIfNeeded]
  );

  const handleChatSubmit = async () => {
    if (!chatInputValue.trim() || !activeChatNodeId || isChatting) return;

    const currentNode = nodes.find((n) => n.id === activeChatNodeId);
    if (!currentNode) return;

    const userTurn: ChatTurn = {
      role: "user",
      content: chatInputValue.trim(),
      timestamp: Date.now(),
    };

    const newNodesWithUserMsg = nodes.map((n) =>
      n.id === activeChatNodeId
        ? { ...n, chatHistory: [...(n.chatHistory || []), userTurn] }
        : n
    );
    setNodes(newNodesWithUserMsg);

    setChatInputValue("");
    setIsChatting(true);

    try {
      const nodeContent = await loadNodeContentIfNeeded(activeChatNodeId);
      if (
        !nodeContent ||
        nodeContent.startsWith("Error generating content:") ||
        nodeContent.startsWith("Error loading content:")
      ) {
        throw new Error(
          "Node content not available for chat or contains an error."
        );
      }

      const latestNodeForHistory = newNodesWithUserMsg.find(
        (n) => n.id === activeChatNodeId
      );
      const historyForAPI = (latestNodeForHistory?.chatHistory || [])
        .filter((turn) => turn.role === "user" || turn.role === "assistant")
        .slice(0, -1)
        .map(({ role, content }) => ({ role, content }));

      const assistantResponse = await continueChatOnTopic(
        currentNode.title,
        nodeContent,
        historyForAPI,
        userTurn.content
      );
      const assistantTurn: ChatTurn = {
        role: "assistant",
        content: assistantResponse,
        timestamp: Date.now(),
      };
      setNodes((prev) =>
        prev.map((n) =>
          n.id === activeChatNodeId
            ? { ...n, chatHistory: [...(n.chatHistory || []), assistantTurn] }
            : n
        )
      );
    } catch (error) {
      console.error("Error in chat:", error);
      const errorContent = `Sorry, an error occurred: ${
        error instanceof Error ? error.message : "Unknown issue"
      }`;
      const errorTurn: ChatTurn = {
        role: "assistant",
        content: errorContent,
        timestamp: Date.now(),
      };
      setNodes((prev) => {
        return prev.map((n) => {
          if (n.id === activeChatNodeId) {
            const finalHistory = [...(n.chatHistory || [])];
            finalHistory.push(errorTurn);
            return { ...n, chatHistory: finalHistory };
          }
          return n;
        });
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleTextSelection = () => {
    if (!contentAndChatDisplayRef.current) return;
    const selection = window.getSelection();

    if (
      selection &&
      selection.toString().trim().length > 2 &&
      contentAndChatDisplayRef.current.contains(selection.anchorNode)
    ) {
      const selectedText = selection.toString().trim();
      const targetElement = selection.anchorNode?.parentElement;

      if (
        targetElement &&
        (targetElement.closest(".chat-markdown") ||
          targetElement.closest("textarea"))
      ) {
        if (textSelectionPopup.show) {
          setSelectedTextForNewNode(null);
          setTextSelectionPopup((prev) => ({ ...prev, show: false }));
        }
        return;
      }

      setSelectedTextForNewNode(selectedText);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect =
        contentAndChatDisplayRef.current.getBoundingClientRect();

      const yPos =
        rect.top -
        containerRect.top +
        contentAndChatDisplayRef.current.scrollTop;
      const xPos = rect.left - containerRect.left + rect.width / 2;

      setTextSelectionPopup({
        x: xPos,
        y: yPos,
        show: true,
      });
    } else {
      if (textSelectionPopup.show) {
        setSelectedTextForNewNode(null);
        setTextSelectionPopup((prev) => ({ ...prev, show: false }));
      }
    }
  };

  const handleExploreSelectedText = () => {
    if (selectedTextForNewNode && activeChatNodeId) {
      handleExplorePrerequisites(
        activeChatNodeId,
        true,
        selectedTextForNewNode
      );
    }
    setSelectedTextForNewNode(null);
    setTextSelectionPopup((prev) => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (contentAndChatDisplayRef.current) {
      contentAndChatDisplayRef.current.scrollTop =
        contentAndChatDisplayRef.current.scrollHeight;
    }
  }, [nodes, activeChatNodeId, isChatting]);

  useEffect(() => {
    setSelectedTextForNewNode(null);
    setTextSelectionPopup((prev) => ({ ...prev, show: false }));
  }, [activeChatNodeId, viewMode]);

  const handleGraphNodeContentNeeded = useCallback(
    async (nodeId: string) => {
      await loadNodeContentIfNeeded(nodeId);
    },
    [loadNodeContentIfNeeded]
  );

  const handleGraphNodeSelect = useCallback((nodeId: string) => {
    setActiveGraphParentId(nodeId);
    requestAnimationFrame(() => mapRef.current?.panToNode(nodeId));
  }, []);

  const handleGraphNodeMove = useCallback(
    (nodeId: string, newPosition: { x: number; y: number }) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId ? { ...node, position: newPosition } : node
        )
      );
    },
    []
  );

  const buildTree = (parentId?: string): Node[] => {
    return nodes
      .filter((node) => node.parentId === parentId)
      .sort((a, b) => a.title.localeCompare(b.title));
  };

  const renderTreeNode = (node: Node, level = 0) => {
    const children = buildTree(node.id);
    const isLoadingContent =
      loadingNodeId === node.id &&
      (!node.content || node.content.startsWith("Error"));
    return (
      <div key={node.id} className="my-0.5 group">
        <button
          onClick={() => handleSetActiveChatNode(node.id)}
          className={`w-full text-left pr-1 py-1.5 rounded hover:bg-gray-700/70 transition-colors text-sm flex items-center
            ${
              node.id === activeChatNodeId
                ? "bg-purple-600 text-white font-semibold ring-1 ring-purple-400"
                : "text-gray-300 hover:text-purple-300"
            }
            ${isLoadingContent ? "opacity-60 animate-pulse_custom" : ""}`}
          title={node.title}
          style={{ paddingLeft: `${8 + level * 18}px` }}
        >
          {node.id === centralNodeId && (
            <Network size={14} className="inline mr-1.5 opacity-70 shrink-0" />
          )}
          {node.parentId && (
            <span className="mr-1 text-gray-500 shrink-0">
              {level > 0 ? "↳" : ""}
            </span>
          )}
          <span className="truncate flex-grow min-w-0">{node.title}</span>
          {isLoadingContent && (
            <span className="ml-auto text-xs opacity-70 shrink-0 pr-1">
              (loading)
            </span>
          )}
        </button>
        {children.length > 0 && (
          <div className="mt-0.5">
            {children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const activeChatNodeDetails = useMemo(() => {
    return nodes.find((n) => n.id === activeChatNodeId);
  }, [nodes, activeChatNodeId]);

  const breadcrumbPath = useMemo(() => {
    if (!activeGraphParentId || !centralNodeId || nodes.length === 0) return [];
    const path: Node[] = [];
    let current = nodes.find((n) => n.id === activeGraphParentId);
    while (current) {
      path.unshift(current);
      if (current.id === centralNodeId || !current.parentId) break;
      current = nodes.find((n) => n.id === current?.parentId);
      if (path.length > 10) break;
    }
    return path;
  }, [nodes, activeGraphParentId, centralNodeId]);

  const handleClearChatHistory = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, chatHistory: [] } : n))
    );
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white overflow-hidden antialiased">
      <motion.header
        className="p-3 sm:p-4 border-b border-gray-800/60 bg-gray-950/85 backdrop-blur-md shadow-lg z-20"
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 25 }}
      >
        <div className="flex items-center justify-between max-w-full mx-auto px-1 sm:px-2">
          {/* Left: Logo and Title */}
          <div className="flex items-center min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mr-2 sm:mr-3 shadow-md shrink-0">
              <span className="text-white font-bold text-base sm:text-lg">
                10x
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 truncate">
              The 10x Developer
            </h1>
          </div>

          {/* Center: Breadcrumbs (conditionally rendered in graph mode) */}
          <div className="flex-1 flex justify-center px-2 sm:px-4">
            {viewMode === "graph" &&
              nodes.length > 0 &&
              breadcrumbPath.length > 0 && (
                <nav
                  className="hidden md:flex items-center overflow-x-auto max-w-xs lg:max-w-md scrollbar-thin scrollbar-thumb-gray-700/80 scrollbar-track-transparent py-1.5 px-2 bg-gray-800/40 rounded-full shadow-inner"
                  aria-label="Graph Breadcrumb"
                >
                  {breadcrumbPath.map((node, index) => (
                    <div
                      key={node.id}
                      className="flex items-center whitespace-nowrap"
                    >
                      {index > 0 && (
                        <ChevronRight className="h-3.5 w-3.5 mx-1 text-purple-400/70 shrink-0" />
                      )}
                      <button
                        onClick={() => handleGraphNodeSelect(node.id)}
                        title={node.title}
                        className={`px-2 py-1 rounded-full transition-all duration-200 truncate max-w-[100px] lg:max-w-[120px] text-sm
            ${
              node.id === activeGraphParentId
                ? "text-white font-medium bg-purple-600/90 shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-gray-700/70"
            }`}
                      >
                        {index === 0 && (
                          <Network
                            size={12}
                            className="inline mr-1.5 opacity-80"
                          />
                        )}
                        {node.title}
                      </button>
                    </div>
                  ))}
                </nav>
              )}
          </div>

          {/* Right: View Mode Buttons (conditionally rendered) */}
          {nodes.length > 0 && (
            <div className="flex items-center space-x-1 bg-gray-800/60 p-1 rounded-lg shrink-0">
              <Button
                size="sm"
                variant={viewMode === "chat" ? "secondary" : "ghost"}
                onClick={() => setViewMode("chat")}
                className={`px-3 py-1.5 text-xs sm:text-sm ${
                  viewMode === "chat"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                <MessageSquare size={14} className="mr-1.5" /> Chat
              </Button>
              <Button
                size="sm"
                variant={viewMode === "graph" ? "secondary" : "ghost"}
                onClick={() => {
                  setViewMode("graph");
                  if (
                    activeChatNodeId &&
                    !nodes.find((n) => n.id === activeGraphParentId)
                  )
                    setActiveGraphParentId(activeChatNodeId);
                  requestAnimationFrame(() => {
                    if (activeGraphParentId)
                      mapRef.current?.panToNode(activeGraphParentId);
                    else if (centralNodeId)
                      mapRef.current?.centerView(centralNodeId);
                  });
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm ${
                  viewMode === "graph"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                <Network size={14} className="mr-1.5" /> Graph
              </Button>
            </div>
          )}
        </div>
      </motion.header>

      <div className="flex-1 relative overflow-hidden">
        {nodes.length === 0 && !isLoadingGlobal && (
          <AnimatePresence>
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
                Become a 10x developer
              </h2>
              <p className="text-gray-400 max-w-lg text-lg leading-relaxed">
                Enter a topic to begin your journey. Explore concepts in chat or
                visualize connections in the graph.
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        {isLoadingGlobal && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
            <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
          </div>
        )}

        {nodes.length > 0 && (
          <>
            <div
              className={`flex-1 h-full ${
                viewMode === "chat" ? "flex" : "hidden"
              }`}
            >
              <aside className="w-64 sm:w-72 h-full bg-gray-900/80 border-r border-gray-800/60 p-2.5 overflow-y-auto overflow-x-hidden hover:overflow-x-auto focus-within:overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700/80 scrollbar-track-gray-800/50">
                <h2 className="text-xs font-semibold text-purple-400 mb-2 px-1 uppercase tracking-wider">
                  Topics
                </h2>
                {centralNodeId && nodes.find((n) => n.id === centralNodeId) ? (
                  renderTreeNode(nodes.find((n) => n.id === centralNodeId)!)
                ) : (
                  <p className="text-xs text-gray-500 px-1">No topics yet.</p>
                )}
              </aside>

              <main
                className="flex-1 flex flex-col h-full bg-gray-950 relative"
                onMouseUp={handleTextSelection}
              >
                {activeChatNodeDetails ? (
                  <>
                    <div className="p-3 sm:p-4 border-b border-gray-800/60 flex justify-between items-center bg-gray-900/50 shrink-0">
                      <h2
                        className="text-base sm:text-lg font-semibold text-purple-300 truncate mr-2"
                        title={activeChatNodeDetails.title}
                      >
                        {activeChatNodeDetails.title}
                      </h2>
                      <div className="flex items-center space-x-2 shrink-0">
                        {!activeChatNodeDetails.hasExplored &&
                          (!selectedTextForNewNode ||
                            selectedTextForNewNode ===
                              activeChatNodeDetails.title) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-purple-500/60 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 px-2.5 py-1.5"
                              onClick={() =>
                                handleExplorePrerequisites(
                                  activeChatNodeDetails.id
                                )
                              }
                              disabled={
                                loadingNodeId === activeChatNodeDetails.id &&
                                !activeChatNodeDetails.content
                              }
                            >
                              {loadingNodeId === activeChatNodeDetails.id &&
                              !activeChatNodeDetails.content ? (
                                <div className="h-3 w-3 border-2 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                              ) : (
                                <PlusCircle size={14} className="mr-1.5" />
                              )}
                              Find Prerequisites
                            </Button>
                          )}
                        {activeChatNodeDetails.chatHistory &&
                          activeChatNodeDetails.chatHistory.length > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Clear Chat History"
                              className="text-gray-500 hover:text-red-400 h-7 w-7"
                              onClick={() =>
                                handleClearChatHistory(activeChatNodeDetails.id)
                              }
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                      </div>
                    </div>
                    <div
                      ref={contentAndChatDisplayRef}
                      className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50"
                      onClick={() => {
                        if (textSelectionPopup.show)
                          setTextSelectionPopup((prev) => ({
                            ...prev,
                            show: false,
                          }));
                      }}
                    >
                      {textSelectionPopup.show && selectedTextForNewNode && (
                        <motion.div
                          className="absolute bg-gray-800 p-1.5 rounded-md shadow-xl border border-gray-700 z-30 flex items-center"
                          style={{
                            left: textSelectionPopup.x,
                            top: textSelectionPopup.y,
                            transform: "translate(-50%, calc(-100% - 8px))",
                          }}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            onClick={handleExploreSelectedText}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 text-xs"
                          >
                            <ExternalLink size={12} className="mr-1" /> Explore:
                            "{selectedTextForNewNode.substring(0, 15)}..."
                          </Button>
                        </motion.div>
                      )}
                      <div className="p-4 sm:p-5 prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed">
                        {loadingNodeId === activeChatNodeId &&
                        (!activeChatNodeDetails.content ||
                          activeChatNodeDetails.content.startsWith("Error")) ? (
                          <div className="flex items-center justify-center h-20 text-gray-400">
                            <div className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin"></div>{" "}
                            <span className="ml-2.5">Loading content...</span>
                          </div>
                        ) : activeChatNodeDetails.content &&
                          !activeChatNodeDetails.content.startsWith("Error") ? (
                          <ReactMarkdown>
                            {activeChatNodeDetails.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="p-4 my-4 bg-gray-800/50 rounded-md text-sm text-gray-400 flex items-center">
                            <Info
                              size={16}
                              className="mr-2 text-yellow-500 shrink-0"
                            />
                            {activeChatNodeDetails.content ||
                              "No content loaded yet. Click 'Find Prerequisites' or select text to explore."}
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 space-y-3 border-t border-gray-800/30 mt-2">
                        {(activeChatNodeDetails.chatHistory || []).map(
                          (turn, index) => (
                            <div
                              key={`${turn.timestamp}-${index}-${turn.role}`}
                              className={`flex ${
                                turn.role === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[75%] p-2 sm:p-2.5 rounded-lg shadow ${
                                  turn.role === "user"
                                    ? "bg-purple-600 text-white rounded-br-none"
                                    : "bg-gray-700 text-gray-200 rounded-bl-none"
                                }`}
                              >
                                <ReactMarkdown>{turn.content}</ReactMarkdown>
                              </div>
                            </div>
                          )
                        )}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="max-w-[75%] p-2.5 rounded-lg shadow bg-gray-700">
                              <div className="flex space-x-1.5 items-center">
                                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce_custom_1"></div>
                                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce_custom_2"></div>
                                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce_custom_3"></div>
                              </div>
                            </div>
                          </div>
                        )}
                        {(!activeChatNodeDetails.chatHistory ||
                          activeChatNodeDetails.chatHistory.length === 0) &&
                          !isChatting && (
                            <p className="text-center text-xs text-gray-500 py-4">
                              Ask a question about "
                              {activeChatNodeDetails.title}" to start the
                              conversation.
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="p-3 border-t border-gray-800/60 bg-gray-900/70 shrink-0">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleChatSubmit();
                        }}
                        className="flex items-center space-x-2"
                      >
                        <Textarea
                          ref={chatInputRef}
                          value={chatInputValue}
                          onChange={(e) => setChatInputValue(e.target.value)}
                          placeholder={`Ask about "${activeChatNodeDetails.title.substring(
                            0,
                            30
                          )}"...`}
                          className="flex-grow bg-gray-800 border-gray-700/80 text-gray-200 rounded-md resize-none py-2 text-sm scrollbar-thin scrollbar-thumb-gray-600"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleChatSubmit();
                            }
                          }}
                          disabled={
                            isChatting ||
                            !activeChatNodeDetails.content ||
                            activeChatNodeDetails.content.startsWith("Error")
                          }
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="bg-purple-600 hover:bg-purple-700 rounded-md h-9 w-9 shrink-0"
                          disabled={
                            !chatInputValue.trim() ||
                            isChatting ||
                            !activeChatNodeDetails.content ||
                            activeChatNodeDetails.content.startsWith("Error")
                          }
                        >
                          {isChatting ? (
                            <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send size={16} />
                          )}
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
                    Select a topic from the sidebar to view its content and
                    start chatting.
                  </div>
                )}
              </main>
            </div>

            <div
              className={`flex-1 h-full ${
                viewMode === "graph" ? "block" : "hidden"
              }`}
            >
              <KnowledgeMap
                ref={mapRef}
                nodes={nodes}
                connections={connections}
                onNodeContentNeeded={handleGraphNodeContentNeeded}
                onExploreClick={(nodeId) =>
                  handleExplorePrerequisites(nodeId, false)
                }
                onNodeMove={handleGraphNodeMove}
                onNodeSelect={handleGraphNodeSelect}
                isLoadingGlobal={isLoadingGlobal && viewMode === "graph"}
                loadingNodeId={loadingNodeId}
                centralNodeId={centralNodeId}
                activeParentId={activeGraphParentId}
              />
            </div>
          </>
        )}
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-800/60 bg-gray-950/85 backdrop-blur-md z-20">
        <QueryInput
          onSubmit={handleInitialQuery}
          isLoading={isLoadingGlobal && nodes.length === 0}
        />
      </div>
    </main>
  );
}
