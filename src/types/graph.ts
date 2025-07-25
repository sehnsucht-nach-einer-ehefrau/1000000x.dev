import type { ChatTurn } from "@/lib/ai-service";

export interface Node {
  id: string;
  title: string;
  content: string;
  description?: string;
  depth: number;
  position: { x: number; y: number };
  hasExplored: boolean;
  parentId?: string;
  chatHistory: ChatTurn[];
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
