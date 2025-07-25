export const NODE_WIDTH = 300;
export const NODE_HEIGHT = 280;

export const HORIZONTAL_SPACING_PARENT_CHILD = 100; // Gap between parent's right edge and child's left edge
export const VERTICAL_SPACING_SIBLINGS = 40; // Gap between sibling nodes

export const ZOOM_MIN = 0.7;
export const ZOOM_MAX = 1;
export const ZOOM_SENSITIVITY = 1.1; // For wheel zoom, higher is more sensitive (larger step)

export const CLICK_THRESHOLD_MS = 200;
export const CLICK_THRESHOLD_PX = 10;

export const CONNECTION_GRADIENT_ID = "connectionGradient";
export const ARROWHEAD_ID = "arrowhead";

// For page.tsx layout calculations
export const CHILD_NODE_X_OFFSET = NODE_WIDTH + HORIZONTAL_SPACING_PARENT_CHILD;
export const CHILD_NODE_Y_INCREMENT = NODE_HEIGHT + VERTICAL_SPACING_SIBLINGS;
