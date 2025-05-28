import type { ChatTurn } from "@/lib/ai-service"; // Assuming ChatTurn is exported from ai-service

export interface Node {
  id: string;
  title: string;
  content: string;
  depth: number;
  position: { x: number; y: number }; // For graph view
  hasExplored: boolean;
  parentId?: string;
  chatHistory?: ChatTurn[]; // New: For chat view
  // For graph view styling
  isCentral?: boolean;
  isActiveParent?: boolean;
  isActiveChild?: boolean;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
}

export interface KnowledgeMapRef {
  centerView: (nodeId?: string) => void;
  panToNode: (nodeId: string) => void;
}
