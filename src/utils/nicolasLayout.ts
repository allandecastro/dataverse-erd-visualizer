/**
 * NICOLAS Layout Algorithm
 * Nested Intelligent COmmunity Layout & Alignment System
 *
 * Multi-level community-aware layout combining:
 * - Leiden community detection
 * - Sugiyama hierarchical layout (intra-community)
 * - Meta-graph strip-packing (inter-community)
 */

import type { Entity, EntityRelationship, EntityPosition } from '@/types';
import {
  CARD_WIDTH,
  NICOLAS_COMMUNITY_PADDING,
  NICOLAS_INTER_COMMUNITY_GAP,
  NICOLAS_INTRA_SPACING_X,
  NICOLAS_INTRA_SPACING_Y,
  NICOLAS_MIN_COMMUNITY_SIZE,
  NICOLAS_LEIDEN_RESOLUTION,
  NICOLAS_LEIDEN_MAX_ITERATIONS,
  NICOLAS_SUGIYAMA_ITERATIONS,
  NICOLAS_START_X,
  NICOLAS_START_Y,
} from '@/constants';

// ============================================================================
// Internal Types
// ============================================================================

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

interface AdjacencyGraph {
  nodes: string[];
  edges: GraphEdge[];
  adjacency: Map<string, Map<string, number>>; // undirected, weighted
  directedAdj: Map<string, string[]>; // parent -> children (for Sugiyama)
}

interface CommunityRect {
  communityId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  positions: Record<string, { x: number; y: number }>;
}

// ============================================================================
// Graph Construction
// ============================================================================

export function buildGraph(
  entities: Entity[],
  relationships: EntityRelationship[],
  selectedEntities: Set<string>
): AdjacencyGraph {
  const nodes = entities
    .filter((e) => selectedEntities.has(e.logicalName))
    .map((e) => e.logicalName)
    .sort();

  const nodeSet = new Set(nodes);
  const adjacency = new Map<string, Map<string, number>>();
  const directedAdj = new Map<string, string[]>();

  for (const n of nodes) {
    adjacency.set(n, new Map());
    directedAdj.set(n, []);
  }

  const edges: GraphEdge[] = [];

  for (const rel of relationships) {
    if (!nodeSet.has(rel.from) || !nodeSet.has(rel.to)) continue;
    if (rel.from === rel.to) continue; // skip self-references

    // Undirected edge for community detection
    const w = 1;
    const adjFrom = adjacency.get(rel.from)!;
    const adjTo = adjacency.get(rel.to)!;
    adjFrom.set(rel.to, (adjFrom.get(rel.to) || 0) + w);
    adjTo.set(rel.from, (adjTo.get(rel.from) || 0) + w);

    edges.push({ from: rel.from, to: rel.to, weight: w });

    // Directed edge for Sugiyama: parent -> child
    if (rel.type === 'N:1') {
      // from depends on to => to is parent of from
      directedAdj.get(rel.to)!.push(rel.from);
    } else if (rel.type === '1:N') {
      // from is parent of to
      directedAdj.get(rel.from)!.push(rel.to);
    }
    // N:N: no directed edge (only undirected for community detection)
  }

  return { nodes, edges, adjacency, directedAdj };
}

// ============================================================================
// Leiden Community Detection (Simplified)
// ============================================================================

/**
 * Compute modularity gain of moving node i to community c.
 */
function modularityGain(
  node: string,
  targetCommunity: number,
  adjacency: Map<string, Map<string, number>>,
  community: Map<string, number>,
  communityTotDeg: Map<number, number>,
  nodeDegree: number,
  totalWeight: number
): number {
  if (totalWeight === 0) return 0;
  const m2 = 2 * totalWeight;

  // sum of edges from node to nodes in targetCommunity
  let sumIn = 0;
  const neighbors = adjacency.get(node)!;
  for (const [neighbor, w] of neighbors) {
    if (community.get(neighbor) === targetCommunity) {
      sumIn += w;
    }
  }

  const sumTot = communityTotDeg.get(targetCommunity) || 0;

  // deltaQ = sumIn/m - (sumTot * ki) / (2m^2)
  return sumIn / totalWeight - (sumTot * nodeDegree) / (m2 * totalWeight);
}

/**
 * Simplified Leiden: local moving + refinement.
 * Returns community assignment as Map<nodeId, communityId>.
 */
function leidenLevel(
  nodes: string[],
  adjacency: Map<string, Map<string, number>>,
  resolution: number,
  maxIterations: number
): Map<string, number> {
  // Initialize: each node in its own community
  const community = new Map<string, number>();
  for (let i = 0; i < nodes.length; i++) {
    community.set(nodes[i], i);
  }

  // Compute total edge weight
  let totalWeight = 0;
  for (const neighbors of adjacency.values()) {
    for (const w of neighbors.values()) totalWeight += w;
  }
  totalWeight /= 2; // each edge counted twice

  if (totalWeight === 0) return community;

  // Compute node degrees
  const nodeDegrees = new Map<string, number>();
  for (const [node, neighbors] of adjacency) {
    let deg = 0;
    for (const w of neighbors.values()) deg += w;
    nodeDegrees.set(node, deg);
  }

  // Community total degree
  const communityTotDeg = new Map<number, number>();
  for (const [node, c] of community) {
    communityTotDeg.set(c, (communityTotDeg.get(c) || 0) + nodeDegrees.get(node)!);
  }

  // Phase 1: Local moving
  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;

    for (const node of nodes) {
      const currentComm = community.get(node)!;
      const ki = nodeDegrees.get(node)!;

      // Remove node from current community
      communityTotDeg.set(currentComm, (communityTotDeg.get(currentComm) || 0) - ki);

      // Find best community among neighbors
      let bestComm = currentComm;
      let bestGain = 0;

      const neighborComms = new Set<number>();
      const neighbors = adjacency.get(node)!;
      for (const [neighbor] of neighbors) {
        neighborComms.add(community.get(neighbor)!);
      }
      neighborComms.add(currentComm); // always consider staying

      for (const targetComm of neighborComms) {
        const gain =
          modularityGain(node, targetComm, adjacency, community, communityTotDeg, ki, totalWeight) *
          resolution;

        if (gain > bestGain) {
          bestGain = gain;
          bestComm = targetComm;
        }
      }

      // Move node to best community
      community.set(node, bestComm);
      communityTotDeg.set(bestComm, (communityTotDeg.get(bestComm) || 0) + ki);

      if (bestComm !== currentComm) {
        moved = true;
      }
    }

    if (!moved) break;
  }

  // Phase 2: Leiden refinement - check if communities should be split
  // For each community with >1 node, check if any node is poorly connected
  const commNodes = new Map<number, string[]>();
  for (const [node, c] of community) {
    if (!commNodes.has(c)) commNodes.set(c, []);
    commNodes.get(c)!.push(node);
  }

  // Deterministic counter for new singleton community IDs
  let nextCommId = Math.max(...community.values()) + 1;

  for (const [, members] of commNodes) {
    if (members.length <= 2) continue;

    for (const node of members) {
      const neighbors = adjacency.get(node)!;
      let internalEdges = 0;
      let externalEdges = 0;

      for (const [neighbor, w] of neighbors) {
        if (community.get(neighbor) === community.get(node)) {
          internalEdges += w;
        } else {
          externalEdges += w;
        }
      }

      // If node has more external than internal connections, split it out
      if (externalEdges > internalEdges && internalEdges === 0) {
        // Assign to singleton community using deterministic ID
        const newComm = nextCommId++;
        const ki = nodeDegrees.get(node)!;
        const oldComm = community.get(node)!;
        communityTotDeg.set(oldComm, (communityTotDeg.get(oldComm) || 0) - ki);
        community.set(node, newComm);
        communityTotDeg.set(newComm, ki);
      }
    }
  }

  return community;
}

/**
 * Aggregate graph: contract communities into super-nodes.
 * Returns new (smaller) graph for the next level.
 */
function aggregateGraph(
  nodes: string[],
  adjacency: Map<string, Map<string, number>>,
  community: Map<string, number>
): {
  superNodes: string[];
  superAdjacency: Map<string, Map<string, number>>;
  nodeToSuper: Map<string, string>;
  superToNodes: Map<string, string[]>;
} {
  // Map community IDs to super-node names
  const commIds = [...new Set(community.values())].sort((a, b) => a - b);
  const superNodes = commIds.map((c) => `super_${c}`);
  const commToSuper = new Map<number, string>();
  commIds.forEach((c, i) => commToSuper.set(c, superNodes[i]));

  const nodeToSuper = new Map<string, string>();
  const superToNodes = new Map<string, string[]>();

  for (const node of nodes) {
    const superName = commToSuper.get(community.get(node)!)!;
    nodeToSuper.set(node, superName);
    if (!superToNodes.has(superName)) superToNodes.set(superName, []);
    superToNodes.get(superName)!.push(node);
  }

  // Build super adjacency
  const superAdjacency = new Map<string, Map<string, number>>();
  for (const sn of superNodes) {
    superAdjacency.set(sn, new Map());
  }

  for (const [node, neighbors] of adjacency) {
    const snFrom = nodeToSuper.get(node)!;
    for (const [neighbor, w] of neighbors) {
      const snTo = nodeToSuper.get(neighbor)!;
      if (snFrom === snTo) continue; // internal edge
      const adj = superAdjacency.get(snFrom)!;
      adj.set(snTo, (adj.get(snTo) || 0) + w);
    }
  }

  return { superNodes, superAdjacency, nodeToSuper, superToNodes };
}

/**
 * Full Leiden community detection with optional 2 levels.
 * Returns array of { nodeId, communityL1, communityL2 }.
 */
export function leidenCommunityDetection(
  graph: AdjacencyGraph,
  maxLevel: number
): Array<{ nodeId: string; communityL1: number; communityL2: number }> {
  const { nodes, adjacency } = graph;

  if (nodes.length === 0) return [];

  // Level 1
  const l1Community = leidenLevel(
    nodes,
    adjacency,
    NICOLAS_LEIDEN_RESOLUTION,
    NICOLAS_LEIDEN_MAX_ITERATIONS
  );

  // Normalize community IDs to sequential 0, 1, 2, ...
  const uniqueComms = [...new Set(l1Community.values())].sort((a, b) => a - b);
  const commRemap = new Map<number, number>();
  uniqueComms.forEach((c, i) => commRemap.set(c, i));

  for (const [node, c] of l1Community) {
    l1Community.set(node, commRemap.get(c)!);
  }

  // Level 2 (if applicable)
  const l2Map = new Map<number, number>(); // L1 community -> L2 community

  if (maxLevel >= 2 && uniqueComms.length > 2) {
    const { superNodes, superAdjacency } = aggregateGraph(nodes, adjacency, l1Community);

    const l2Community = leidenLevel(
      superNodes,
      superAdjacency,
      NICOLAS_LEIDEN_RESOLUTION,
      NICOLAS_LEIDEN_MAX_ITERATIONS
    );

    // Map super-node community back to L1 community ID
    const uniqueL2 = [...new Set(l2Community.values())].sort((a, b) => a - b);
    const l2Remap = new Map<number, number>();
    uniqueL2.forEach((c, i) => l2Remap.set(c, i));

    for (const sn of superNodes) {
      const l1Id = parseInt(sn.replace('super_', ''));
      const rawL2 = l2Community.get(sn)!;
      l2Map.set(l1Id, l2Remap.get(rawL2)!);
    }
  } else {
    // Single L2 community for all
    for (const c of new Set(l1Community.values())) {
      l2Map.set(c, 0);
    }
  }

  return nodes.map((nodeId) => ({
    nodeId,
    communityL1: l1Community.get(nodeId)!,
    communityL2: l2Map.get(l1Community.get(nodeId)!) ?? 0,
  }));
}

// ============================================================================
// Sugiyama Layout (Intra-Community)
// ============================================================================

/**
 * Assign layers using longest path from roots.
 * Handles cycles by tracking visited nodes.
 */
export function assignLayers(
  nodes: string[],
  directedAdj: Map<string, string[]>
): { layers: Map<string, number>; layerGroups: string[][] } {
  const nodeSet = new Set(nodes);
  const layers = new Map<string, number>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  // Build reverse adjacency (child -> parents)
  const reverseAdj = new Map<string, string[]>();
  for (const n of nodes) reverseAdj.set(n, []);
  for (const [parent, children] of directedAdj) {
    if (!nodeSet.has(parent)) continue;
    for (const child of children) {
      if (!nodeSet.has(child)) continue;
      reverseAdj.get(child)!.push(parent);
    }
  }

  function computeLayer(node: string): number {
    if (layers.has(node)) return layers.get(node)!;
    if (inStack.has(node)) {
      // Cycle detected, break it
      layers.set(node, 0);
      return 0;
    }

    visited.add(node);
    inStack.add(node);

    const parents = reverseAdj.get(node) || [];
    const validParents = parents.filter((p) => nodeSet.has(p));

    if (validParents.length === 0) {
      layers.set(node, 0);
    } else {
      const maxParentLayer = Math.max(...validParents.map((p) => computeLayer(p)));
      layers.set(node, maxParentLayer + 1);
    }

    inStack.delete(node);
    return layers.get(node)!;
  }

  for (const node of nodes) {
    if (!visited.has(node)) computeLayer(node);
  }

  // Build layer groups
  const maxLayer = Math.max(0, ...layers.values());
  const layerGroups: string[][] = [];
  for (let i = 0; i <= maxLayer; i++) layerGroups.push([]);
  for (const [node, layer] of layers) {
    layerGroups[layer].push(node);
  }
  // Sort within layers for determinism
  for (const group of layerGroups) group.sort();

  return { layers, layerGroups };
}

/**
 * Crossing minimization using barycenter heuristic.
 */
export function minimizeCrossings(
  layerGroups: string[][],
  directedAdj: Map<string, string[]>,
  nodeSet: Set<string>,
  iterations: number
): string[][] {
  if (layerGroups.length <= 1) return layerGroups;

  const result = layerGroups.map((g) => [...g]);

  // Build child-to-parent map for barycenter computation
  const reverseAdj = new Map<string, string[]>();
  for (const groups of result) {
    for (const n of groups) reverseAdj.set(n, []);
  }
  for (const [parent, children] of directedAdj) {
    if (!nodeSet.has(parent)) continue;
    for (const child of children) {
      if (!nodeSet.has(child)) continue;
      if (reverseAdj.has(child)) {
        reverseAdj.get(child)!.push(parent);
      }
    }
  }

  // Also build forward adjacency scoped to nodeSet
  const forwardAdj = new Map<string, string[]>();
  for (const groups of result) {
    for (const n of groups) forwardAdj.set(n, []);
  }
  for (const [parent, children] of directedAdj) {
    if (!nodeSet.has(parent)) continue;
    for (const child of children) {
      if (!nodeSet.has(child)) continue;
      if (forwardAdj.has(parent)) {
        forwardAdj.get(parent)!.push(child);
      }
    }
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Top-down sweep
    for (let l = 1; l < result.length; l++) {
      const prevLayer = result[l - 1];
      const prevPos = new Map<string, number>();
      prevLayer.forEach((n, i) => prevPos.set(n, i));

      const barycenters = new Map<string, number>();
      for (const node of result[l]) {
        const parents = (reverseAdj.get(node) || []).filter((p) => prevPos.has(p));
        if (parents.length > 0) {
          const sum = parents.reduce((s, p) => s + prevPos.get(p)!, 0);
          barycenters.set(node, sum / parents.length);
        } else {
          barycenters.set(node, result[l].indexOf(node));
        }
      }

      result[l].sort((a, b) => (barycenters.get(a) || 0) - (barycenters.get(b) || 0));
    }

    // Bottom-up sweep
    for (let l = result.length - 2; l >= 0; l--) {
      const nextLayer = result[l + 1];
      const nextPos = new Map<string, number>();
      nextLayer.forEach((n, i) => nextPos.set(n, i));

      const barycenters = new Map<string, number>();
      for (const node of result[l]) {
        const children = (forwardAdj.get(node) || []).filter((c) => nextPos.has(c));
        if (children.length > 0) {
          const sum = children.reduce((s, c) => s + nextPos.get(c)!, 0);
          barycenters.set(node, sum / children.length);
        } else {
          barycenters.set(node, result[l].indexOf(node));
        }
      }

      result[l].sort((a, b) => (barycenters.get(a) || 0) - (barycenters.get(b) || 0));
    }
  }

  return result;
}

/**
 * Assign coordinates: center each layer horizontally, space layers vertically.
 */
export function assignCoordinates(
  layerGroups: string[][],
  spacingX: number,
  spacingY: number
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Find max layer width for centering
  const maxWidth = Math.max(1, ...layerGroups.map((g) => g.length));

  for (let l = 0; l < layerGroups.length; l++) {
    const group = layerGroups[l];
    const layerWidth = group.length * spacingX;
    const maxLayerWidth = maxWidth * spacingX;
    const offsetX = (maxLayerWidth - layerWidth) / 2;

    for (let i = 0; i < group.length; i++) {
      positions[group[i]] = {
        x: Math.round((offsetX + i * spacingX) / (spacingX / 2)) * (spacingX / 2),
        y: Math.round((l * spacingY) / (spacingY / 2)) * (spacingY / 2),
      };
    }
  }

  return positions;
}

/**
 * Full Sugiyama layout for a community of nodes.
 */
export function sugiyamaLayout(
  nodes: string[],
  directedAdj: Map<string, string[]>,
  spacingX: number,
  spacingY: number
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) return {};
  if (nodes.length === 1) return { [nodes[0]]: { x: 0, y: 0 } };

  const nodeSet = new Set(nodes);

  // Step 1: Layer assignment
  const { layerGroups } = assignLayers(nodes, directedAdj);

  // Step 2: Crossing minimization
  const optimizedLayers = minimizeCrossings(
    layerGroups,
    directedAdj,
    nodeSet,
    NICOLAS_SUGIYAMA_ITERATIONS
  );

  // Step 3: Coordinate assignment with snap-to-grid
  return assignCoordinates(optimizedLayers, spacingX, spacingY);
}

// ============================================================================
// Community Bounding Rectangles
// ============================================================================

/**
 * Compute bounding rectangle for a community's positions.
 */
export function computeCommunityRect(
  communityId: number,
  positions: Record<string, { x: number; y: number }>,
  padding: number,
  entityHeight: number = 200 // estimated average entity card height
): CommunityRect {
  const entries = Object.entries(positions);
  if (entries.length === 0) {
    return {
      communityId,
      x: 0,
      y: 0,
      width: CARD_WIDTH + padding * 2,
      height: entityHeight + padding * 2,
      positions,
    };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [, pos] of entries) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + CARD_WIDTH);
    maxY = Math.max(maxY, pos.y + entityHeight);
  }

  return {
    communityId,
    x: 0,
    y: 0,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    positions: Object.fromEntries(
      entries.map(([node, pos]) => [node, { x: pos.x - minX + padding, y: pos.y - minY + padding }])
    ),
  };
}

// ============================================================================
// Inter-Community Meta-Graph Layout (Strip Packing)
// ============================================================================

/**
 * Layout community rectangles using strip packing.
 * Sort by height (tallest first), place in rows.
 */
export function layoutMetaGraph(rects: CommunityRect[], gap: number): CommunityRect[] {
  if (rects.length === 0) return [];
  if (rects.length === 1) {
    return [{ ...rects[0], x: 0, y: 0 }];
  }

  // Sort by height descending for better packing
  const sorted = [...rects].sort((a, b) => b.height - a.height);

  // Compute a reasonable max row width
  const totalWidth = sorted.reduce((s, r) => s + r.width, 0);
  const avgWidth = totalWidth / sorted.length;
  const maxRowWidth = Math.max(
    avgWidth * Math.ceil(Math.sqrt(sorted.length)),
    sorted[0].width + gap
  );

  const placed: CommunityRect[] = [];
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;

  for (const rect of sorted) {
    // Check if rect fits in current row
    if (currentX > 0 && currentX + rect.width > maxRowWidth) {
      // Start new row
      currentX = 0;
      currentY += rowHeight + gap;
      rowHeight = 0;
    }

    placed.push({ ...rect, x: currentX, y: currentY });
    currentX += rect.width + gap;
    rowHeight = Math.max(rowHeight, rect.height);
  }

  return placed;
}

// ============================================================================
// L2 Grouping
// ============================================================================

/**
 * Group L1 community rects by L2 assignment, layout within L2, then layout L2 groups.
 */
function applyL2Grouping(
  l1Rects: CommunityRect[],
  l2Assignments: Map<number, number>,
  gap: number
): CommunityRect[] {
  // Group L1 rects by L2 community
  const l2Groups = new Map<number, CommunityRect[]>();
  for (const rect of l1Rects) {
    const l2Id = l2Assignments.get(rect.communityId) ?? 0;
    if (!l2Groups.has(l2Id)) l2Groups.set(l2Id, []);
    l2Groups.get(l2Id)!.push(rect);
  }

  const uniqueL2 = [...l2Groups.keys()].sort((a, b) => a - b);

  if (uniqueL2.length <= 1) {
    // Only one L2 group, just layout L1 rects directly
    return layoutMetaGraph(l1Rects, gap);
  }

  // Layout L1 rects within each L2 group
  const l2SuperRects: CommunityRect[] = [];

  for (const l2Id of uniqueL2) {
    const groupRects = l2Groups.get(l2Id)!;
    const placedInGroup = layoutMetaGraph(groupRects, gap / 2);

    // Compute bounding box for this L2 group
    let maxX = 0,
      maxY = 0;
    for (const r of placedInGroup) {
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    }

    // Collect all entity positions from placed rects
    const allPositions: Record<string, { x: number; y: number }> = {};
    for (const r of placedInGroup) {
      for (const [node, pos] of Object.entries(r.positions)) {
        allPositions[node] = { x: pos.x + r.x, y: pos.y + r.y };
      }
    }

    l2SuperRects.push({
      communityId: l2Id,
      x: 0,
      y: 0,
      width: maxX + gap / 2,
      height: maxY + gap / 2,
      positions: allPositions,
    });
  }

  // Layout L2 super-rects
  return layoutMetaGraph(l2SuperRects, gap);
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Compute NICOLAS layout positions for all selected entities.
 */
export function computeNicolasLayout(
  entities: Entity[],
  relationships: EntityRelationship[],
  selectedEntities: Set<string>
): Record<string, EntityPosition> {
  const graph = buildGraph(entities, relationships, selectedEntities);
  const { nodes } = graph;

  if (nodes.length === 0) return {};
  if (nodes.length === 1) {
    return { [nodes[0]]: { x: NICOLAS_START_X, y: NICOLAS_START_Y } };
  }

  // Determine max level for Leiden
  let maxLevel: number;
  if (nodes.length < NICOLAS_MIN_COMMUNITY_SIZE) {
    maxLevel = 0; // Each entity is its own community
  } else if (nodes.length < 15) {
    maxLevel = 1;
  } else {
    maxLevel = 2;
  }

  // Community detection
  let communityAssignments: Array<{ nodeId: string; communityL1: number; communityL2: number }>;

  if (maxLevel === 0) {
    // Each entity is its own community
    communityAssignments = nodes.map((nodeId, i) => ({
      nodeId,
      communityL1: i,
      communityL2: 0,
    }));
  } else {
    communityAssignments = leidenCommunityDetection(graph, maxLevel);
  }

  // Group nodes by L1 community
  const l1Communities = new Map<number, string[]>();
  for (const { nodeId, communityL1 } of communityAssignments) {
    if (!l1Communities.has(communityL1)) l1Communities.set(communityL1, []);
    l1Communities.get(communityL1)!.push(nodeId);
  }

  // Sugiyama layout within each L1 community
  const l1Rects: CommunityRect[] = [];

  for (const [commId, commNodes] of l1Communities) {
    const positions = sugiyamaLayout(
      commNodes,
      graph.directedAdj,
      NICOLAS_INTRA_SPACING_X,
      NICOLAS_INTRA_SPACING_Y
    );

    const rect = computeCommunityRect(commId, positions, NICOLAS_COMMUNITY_PADDING);
    l1Rects.push(rect);
  }

  // Inter-community layout
  let placedRects: CommunityRect[];

  // Build L2 assignment map
  const l2Assignments = new Map<number, number>();
  for (const { communityL1, communityL2 } of communityAssignments) {
    l2Assignments.set(communityL1, communityL2);
  }

  const uniqueL2 = new Set(l2Assignments.values());

  if (maxLevel >= 2 && uniqueL2.size > 1) {
    placedRects = applyL2Grouping(l1Rects, l2Assignments, NICOLAS_INTER_COMMUNITY_GAP);
  } else {
    placedRects = layoutMetaGraph(l1Rects, NICOLAS_INTER_COMMUNITY_GAP);
  }

  // Assemble final positions
  const result: Record<string, EntityPosition> = {};

  for (const rect of placedRects) {
    for (const [node, pos] of Object.entries(rect.positions)) {
      result[node] = {
        x: pos.x + rect.x + NICOLAS_START_X,
        y: pos.y + rect.y + NICOLAS_START_Y,
      };
    }
  }

  return result;
}
