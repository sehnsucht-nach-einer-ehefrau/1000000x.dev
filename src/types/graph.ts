export interface Node {
  id: string;
  title: string;
  content: string; // Empty string if not loaded
  depth: number;
  position: { x: number; y: number };
  hasExplored: boolean;
  parentId?: string;
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
