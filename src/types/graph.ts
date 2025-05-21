export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  title: string;
  content: string;
  depth: number;
  position: Position;
  parentId?: string;
  hasExplored: boolean;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: Node[];
  links: Connection[];
}
  