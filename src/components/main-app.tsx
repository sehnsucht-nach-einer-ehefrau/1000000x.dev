"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "./sidebar/sidebar";
import ChatPanel from "./chat/chat-panel";
import KnowledgeGraph from "./graph/knowledge-graph";
import TopicTreeSidebar from "./chat/topic-tree-sidebar";
import QueryInput from "./query-input";
import { toast } from "sonner";
import { generateMainTopic, generateTopicGraph, type ChatTurn } from "@/lib/ai-service";
import type { Node, Connection } from "@/types/graph";
import type { KnowledgeSession } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { AnimatePresence, motion } from "framer-motion";
import { Brain } from "lucide-react";
import ApiKeyDialog from './api-key-dialog';

export default function MainApp() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("query");

	const [sessions, setSessions] = useState<KnowledgeSession[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

	const [nodes, setNodes] = useState<Node[]>([]);
	const [connections, setConnections] = useState<Connection[]>([]);

	const [isLoading, setIsLoading] = useState(false);
	const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
	const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
	const [isTopicTreeVisible, setIsTopicTreeVisible] = useState(true);
	const [viewMode, setViewMode] = useState<'chat' | 'graph'>('chat');

	const initialQueryHandled = useRef(false);
	const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);


	// --- API Key Gate Logic ---
	const checkUserStatus = useCallback(async () => {
		try {
			const response = await fetch('/api/user/status');
			if (response.ok) {
				const { hasApiKey } = await response.json();
				if (!hasApiKey) {
					setIsApiKeyDialogOpen(true);
				}
			} else {
				setIsApiKeyDialogOpen(true); // Show dialog if status check fails
			}
		} catch (error) {
			console.error('Error checking user status:', error);
			setIsApiKeyDialogOpen(true);
		}
	}, []);

	const handleApiKeySubmit = async (apiKey: string) => {
		try {
			const response = await fetch('/api/user/api-key', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiKey }),
			});

			if (response.ok) {
				setIsApiKeyDialogOpen(false);
			} else {
				const errorData = await response.json();
				console.error('Failed to save API key:', errorData.error);
				throw new Error(errorData.error || 'Failed to save API key');
			}
		} catch (error) {
			console.error('API Key submission failed', error);
			throw error;
		}
	};

	// --- Session Management ---
	const fetchSessions = useCallback(async () => {
		try {
			const response = await fetch("/api/knowledge-sessions");
			if (response.ok) setSessions((await response.json()).sessions || []);
		} catch (error) { console.error("Error fetching sessions:", error); }
	}, []);

	useEffect(() => {
		checkUserStatus();
		fetchSessions();
	}, [checkUserStatus, fetchSessions]);

	const handleNewSession = useCallback(() => {
		setCurrentSessionId(null);
		setNodes([]);
		setConnections([]);
		setActiveNodeId(null);
		initialQueryHandled.current = false;
		setViewMode('chat');
		router.push("/dashboard");
	}, [router]);

	const handleSessionSelect = useCallback(async (sessionId: string) => {
		if (isLoading) return;
		setIsLoading(true);
		try {
			const response = await fetch(`/api/knowledge-sessions/${sessionId}`);
			if (response.ok) {
				const sessionData = await response.json();
				const parsedNodes = JSON.parse(sessionData.nodesData);
				setNodes(parsedNodes);
				setConnections(JSON.parse(sessionData.connectionsData));
				setActiveNodeId(parsedNodes.find((n: Node) => n.depth === 0)?.id || null);
				setCurrentSessionId(sessionId);
				setViewMode('chat');
				router.push("/dashboard", { scroll: false });
			}
		} catch (error) { console.error("Error loading session:", error); }
		finally { setIsLoading(false); }
	}, [router, isLoading]);

	const handleDeleteSession = useCallback(async (sessionId: string) => {
		try {
			await fetch(`/api/knowledge-sessions/${sessionId}`, { method: 'DELETE' });
			setSessions(prev => prev.filter(s => s.id !== sessionId));
			if (currentSessionId === sessionId) handleNewSession();
		} catch (error) { console.error("Error deleting session:", error); }
	}, [currentSessionId, handleNewSession]);

	const updateSessionInDb = useCallback(async (sessionId: string, updatedNodes: Node[], updatedConnections: Connection[]) => {
		if (!sessionId) return;
		try {
			await fetch(`/api/knowledge-sessions/${sessionId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nodes: updatedNodes, connections: updatedConnections }),
			});
		} catch (error) { console.error("Error saving session state:", error); }
	}, []);

	// --- Topic & Graph Generation ---
	const handleQuerySubmit = useCallback(async (query: string) => {
		const statusResponse = await fetch('/api/user/status');
		if (!statusResponse.ok) {
			setIsApiKeyDialogOpen(true);
			return;
		}
		const { hasApiKey } = await statusResponse.json();

		if (!hasApiKey) {
			setIsApiKeyDialogOpen(true);
			return;
		}

		if (isLoading) return;
		setIsLoading(true);
		try {
			await fetch("/api/search-history", {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }),
			});

			let result;
			try {
				result = await generateMainTopic(query);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
				toast.error(`Failed to generate topic: ${errorMessage}`);
				setIsLoading(false);
				return;
			}

			const centralNode: Node = {
				id: nanoid(), title: result.topicTitle, content: result.mainExplanation,
				depth: 0, position: { x: 0, y: 0 }, hasExplored: false, parentId: undefined, chatHistory: [],
			};

			const sessionResponse = await fetch("/api/knowledge-sessions", {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: result.topicTitle, initialQuery: query, nodes: [centralNode], connections: [] }),
			});

			if (sessionResponse.ok) {
				const { sessionId } = await sessionResponse.json();
				await fetchSessions();
				handleSessionSelect(sessionId);
			}
		} catch (error) { console.error("Error generating topic:", error); }
		finally { setIsLoading(false); initialQueryHandled.current = true; }
	}, [fetchSessions, handleSessionSelect, isLoading]);

	useEffect(() => {
		if (initialQuery && !currentSessionId && !isLoading && !initialQueryHandled.current) {
			handleQuerySubmit(initialQuery);
		}
	}, [initialQuery, currentSessionId, isLoading, handleQuerySubmit]);

	const getPathForNode = useCallback((nodeId: string): string[] => {
		const path: string[] = [];
		const nodesById = new Map(nodes.map(n => [n.id, n]));
		let currentNode = nodesById.get(nodeId);

		while (currentNode) {
			path.unshift(currentNode.title);
			currentNode = currentNode.parentId ? nodesById.get(currentNode.parentId) : undefined;
		}
		return path;
	}, [nodes]);

	const handleNodeSelectAndFetchContent = useCallback(async (nodeId: string) => {
		const statusResponse = await fetch('/api/user/status');
		if (!statusResponse.ok) {
			setIsApiKeyDialogOpen(true);
			return;
		}
		const { hasApiKey } = await statusResponse.json();
		if (!hasApiKey) {
			setIsApiKeyDialogOpen(true);
			return;
		}

		setActiveNodeId(nodeId);
		const selectedNode = nodes.find(n => n.id === nodeId);
		if (selectedNode && selectedNode.description && !selectedNode.content.startsWith("### Generation Failed")) {
			setLoadingNodeId(nodeId);
			try {
				const path = getPathForNode(nodeId);
				const result = await generateMainTopic(selectedNode.title, path);
				const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, content: result.mainExplanation, description: undefined } : n);
				setNodes(updatedNodes);
				if (currentSessionId) {
					updateSessionInDb(currentSessionId, updatedNodes, connections);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
				toast.error(`Failed to fetch content: ${errorMessage}`);
			} finally {
				setLoadingNodeId(null);
			}
		}
	}, [nodes, currentSessionId, connections, updateSessionInDb]);

	const handleExpandNode = useCallback(async (nodeId: string, generationType: 'rabbitHole' | 'subjectMastery' = 'rabbitHole') => {
		const statusResponse = await fetch('/api/user/status');
		if (!statusResponse.ok) {
			setIsApiKeyDialogOpen(true);
			return;
		}
		const { hasApiKey } = await statusResponse.json();
		if (!hasApiKey) {
			setIsApiKeyDialogOpen(true);
			return;
		}

		if (loadingNodeId || !currentSessionId) return;
		setLoadingNodeId(nodeId);
		try {
			const parentNode = nodes.find((n) => n.id === nodeId);
			if (!parentNode || parentNode.hasExplored) return;

			const path = getPathForNode(nodeId);

			const result = await generateTopicGraph(parentNode.title, generationType, path);
			const childNodes: Node[] = result.nextTopics.map((topic) => ({
				id: nanoid(), title: topic.title, content: topic.description, description: topic.description, depth: (parentNode.depth || 0) + 1,
				position: { x: 0, y: 0 },
				hasExplored: false, parentId: nodeId, chatHistory: [],
			}));

			const newConnections: Connection[] = childNodes.map((child) => ({ id: nanoid(), source: nodeId, target: child.id }));
			const updatedNodes = [...nodes.map((n) => n.id === nodeId ? { ...n, hasExplored: true } : n), ...childNodes];
			const updatedConnections = [...connections, ...newConnections];

			setNodes(updatedNodes);
			setConnections(updatedConnections);
			await updateSessionInDb(currentSessionId, updatedNodes, updatedConnections);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
			toast.error(`Failed to expand topic: ${errorMessage}`);
		}
		finally { setLoadingNodeId(null); }
	}, [nodes, connections, currentSessionId, loadingNodeId, updateSessionInDb]);

	// --- Chat Management ---
	const handleChatUpdate = (nodeId: string, chatHistory: ChatTurn[]) => {
		const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, chatHistory } : n);
		setNodes(updatedNodes);
		if (currentSessionId) {
			updateSessionInDb(currentSessionId, updatedNodes, connections);
		}
	};

	const handleClearChat = (nodeId: string) => {
		const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, chatHistory: [] } : n);
		setNodes(updatedNodes);
		if (currentSessionId) {
			updateSessionInDb(currentSessionId, updatedNodes, connections);
		}
	}


	const activeNode = nodes.find((n) => n.id === activeNodeId);

	// --- Animation Variants for Welcome Screen ---
	const welcomeContainerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				delayChildren: 0.2,
				staggerChildren: 0.3,
			},
		},
	};

	const welcomeItemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: {
				type: "spring",
				stiffness: 100,
				damping: 15,
			},
		},
	};



	return (
		<>
			<ApiKeyDialog
				isOpen={isApiKeyDialogOpen}
				onClose={() => setIsApiKeyDialogOpen(false)}
				onApiKeySubmit={handleApiKeySubmit}
			/>
			<div className="flex h-screen bg-black text-white overflow-hidden">
				<Sidebar
					sessions={sessions}
					currentSessionId={currentSessionId}
					onSessionSelect={handleSessionSelect}
					onNewSession={handleNewSession}
					onDeleteSession={handleDeleteSession}
					onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					isCollapsed={isSidebarCollapsed}
					onOpenApiKeyDialog={() => setIsApiKeyDialogOpen(true)}
				/>

				<main className="flex-1 flex flex-col relative min-w-0">
					{!currentSessionId ? (
						<div className="flex-1 flex items-center justify-center p-4">
							<motion.div
								className="text-center w-full"
								variants={welcomeContainerVariants}
								initial="hidden"
								animate="visible"
							>
								<motion.div
									className="h-fit w-full flex justify-center mb-16"
									variants={welcomeItemVariants}
								>
									<motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
										<Brain className="text-white scale-[4] sm:scale-[5] hover:scale-[4.5] sm:hover:scale-[5.5] transition-transform duration-300" />
									</motion.div>
								</motion.div>

								<motion.h1
									className="text-4xl sm:text-5xl font-bold mb-4"
									variants={welcomeItemVariants}
								>
									Know Everything.
								</motion.h1>

								<motion.p
									className="text-lg sm:text-xl text-gray-400 mb-8"
									variants={welcomeItemVariants}
								>
									1,000,000x.dev
								</motion.p>

								<motion.div variants={welcomeItemVariants}>
									<QueryInput onSubmit={handleQuerySubmit} isLoading={isLoading} />
								</motion.div>
							</motion.div>
						</div>
					) : viewMode === 'chat' && activeNode ? (
						<div className="flex flex-1 h-full overflow-hidden">
							<div className="flex-1 h-full min-w-0">
								<ChatPanel
									key={activeNode.id}
									node={activeNode}
									path={getPathForNode(activeNode.id)}
									onChatUpdate={handleChatUpdate}
									onClearChat={handleClearChat}
									onViewChange={() => setViewMode('graph')}
									onExpandNode={(generationType) => handleExpandNode(activeNode.id, generationType)}
									isTopicTreeVisible={isTopicTreeVisible}
									onToggleTopicTree={() => setIsTopicTreeVisible(!isTopicTreeVisible)}
									isExpanding={loadingNodeId === activeNode.id}
								/>
							</div>
							<AnimatePresence>
								{isTopicTreeVisible && (
									<TopicTreeSidebar
										nodes={nodes}
										activeNodeId={activeNodeId}
										onNodeSelect={handleNodeSelectAndFetchContent}
										onExpandNode={handleExpandNode}
										loadingNodeId={loadingNodeId}
									/>
								)}
							</AnimatePresence>
						</div>
					) : viewMode === 'graph' ? (
						<KnowledgeGraph
							nodes={nodes}
							connections={connections}
							activeNodeId={activeNodeId}
							onNodeSelect={setActiveNodeId}
							onViewChange={() => setViewMode('chat')}
						/>
					) : (
						<div className="flex-1 flex items-center justify-center">
							{isLoading ? <p>Loading session...</p> : <p>Select a session or start a new one.</p>}
						</div>
					)}
				</main>
			</div>
		</>
	);
}
