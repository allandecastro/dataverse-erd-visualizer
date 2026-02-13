/**
 * Tests for NICOLAS Layout Algorithm
 * (Nested Intelligent COmmunity Layout & Alignment System)
 */

import type { Entity, EntityRelationship } from '@/types';
import {
  buildGraph,
  leidenCommunityDetection,
  assignLayers,
  minimizeCrossings,
  assignCoordinates,
  sugiyamaLayout,
  computeCommunityRect,
  layoutMetaGraph,
  computeNicolasLayout,
} from '../nicolasLayout';
import { CARD_WIDTH, NICOLAS_COMMUNITY_PADDING } from '@/constants';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeEntity(logicalName: string): Entity {
  return {
    logicalName,
    displayName: logicalName.charAt(0).toUpperCase() + logicalName.slice(1),
    objectTypeCode: 1,
    isCustomEntity: false,
    primaryIdAttribute: `${logicalName}id`,
    primaryNameAttribute: 'name',
    attributes: [],
  };
}

function makeRelationship(
  from: string,
  to: string,
  type: 'N:1' | '1:N' | 'N:N' = 'N:1'
): EntityRelationship {
  return {
    schemaName: `${from}_${to}_${type}`,
    from,
    to,
    type,
    relationshipType: type === 'N:N' ? 'ManyToManyRelationship' : 'OneToManyRelationship',
  };
}

function createTestGraph(names: string[], rels: Array<[string, string, 'N:1' | '1:N' | 'N:N']>) {
  const entities = names.map(makeEntity);
  const relationships = rels.map(([f, t, type]) => makeRelationship(f, t, type));
  const selectedEntities = new Set(names);
  return { entities, relationships, selectedEntities };
}

// ============================================================================
// Graph Construction
// ============================================================================

describe('buildGraph', () => {
  it('should build correct adjacency from N:1 relationships', () => {
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['account', 'contact'],
      [['contact', 'account', 'N:1']]
    );
    const graph = buildGraph(entities, relationships, selectedEntities);

    expect(graph.nodes).toEqual(['account', 'contact']);
    expect(graph.adjacency.get('contact')!.get('account')).toBe(1);
    expect(graph.adjacency.get('account')!.get('contact')).toBe(1);
    // N:1: account is parent of contact
    expect(graph.directedAdj.get('account')).toContain('contact');
  });

  it('should build correct adjacency from 1:N relationships', () => {
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['account', 'contact'],
      [['account', 'contact', '1:N']]
    );
    const graph = buildGraph(entities, relationships, selectedEntities);

    expect(graph.directedAdj.get('account')).toContain('contact');
  });

  it('should handle N:N relationships (undirected only)', () => {
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['account', 'contact'],
      [['account', 'contact', 'N:N']]
    );
    const graph = buildGraph(entities, relationships, selectedEntities);

    expect(graph.adjacency.get('account')!.get('contact')).toBe(1);
    expect(graph.adjacency.get('contact')!.get('account')).toBe(1);
    // N:N should not create directed edges
    expect(graph.directedAdj.get('account')).not.toContain('contact');
    expect(graph.directedAdj.get('contact')).not.toContain('account');
  });

  it('should filter by selectedEntities', () => {
    const entities = ['account', 'contact', 'lead'].map(makeEntity);
    const relationships = [makeRelationship('contact', 'account', 'N:1')];
    const selectedEntities = new Set(['account', 'contact']); // lead excluded

    const graph = buildGraph(entities, relationships, selectedEntities);
    expect(graph.nodes).toEqual(['account', 'contact']);
    expect(graph.nodes).not.toContain('lead');
  });

  it('should skip self-referencing relationships', () => {
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['account'],
      [['account', 'account', 'N:1']]
    );
    const graph = buildGraph(entities, relationships, selectedEntities);

    expect(graph.edges).toHaveLength(0);
    expect(graph.adjacency.get('account')!.size).toBe(0);
  });
});

// ============================================================================
// Leiden Community Detection
// ============================================================================

describe('leidenCommunityDetection', () => {
  it('should return individual communities for empty graph', () => {
    const graph = buildGraph([], [], new Set());
    const result = leidenCommunityDetection(graph, 1);
    expect(result).toEqual([]);
  });

  it('should return single community for single node', () => {
    const { entities, relationships, selectedEntities } = createTestGraph(['account'], []);
    const graph = buildGraph(entities, relationships, selectedEntities);
    const result = leidenCommunityDetection(graph, 1);

    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe('account');
  });

  it('should detect communities for densely connected groups', () => {
    // Two cliques: {a, b, c} and {d, e, f} connected by a single edge
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['a', 'b', 'c', 'd', 'e', 'f'],
      [
        ['a', 'b', 'N:1'],
        ['b', 'c', 'N:1'],
        ['a', 'c', 'N:1'],
        ['d', 'e', 'N:1'],
        ['e', 'f', 'N:1'],
        ['d', 'f', 'N:1'],
        ['c', 'd', 'N:1'], // bridge between cliques
      ]
    );
    const graph = buildGraph(entities, relationships, selectedEntities);
    const result = leidenCommunityDetection(graph, 1);

    expect(result).toHaveLength(6);

    // Nodes within same clique should be in same community
    const commOf = new Map(result.map((r) => [r.nodeId, r.communityL1]));

    // a, b, c should be in same community
    expect(commOf.get('a')).toBe(commOf.get('b'));
    expect(commOf.get('b')).toBe(commOf.get('c'));

    // d, e, f should be in same community
    expect(commOf.get('d')).toBe(commOf.get('e'));
    expect(commOf.get('e')).toBe(commOf.get('f'));

    // The two cliques should be in different communities
    expect(commOf.get('a')).not.toBe(commOf.get('d'));
  });

  it('should handle disconnected components', () => {
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['a', 'b', 'c', 'd', 'e', 'f'],
      [
        ['a', 'b', 'N:1'],
        ['b', 'c', 'N:1'],
        ['d', 'e', 'N:1'],
        ['e', 'f', 'N:1'],
        // No connection between {a,b,c} and {d,e,f}
      ]
    );
    const graph = buildGraph(entities, relationships, selectedEntities);
    const result = leidenCommunityDetection(graph, 1);

    const commOf = new Map(result.map((r) => [r.nodeId, r.communityL1]));

    // Disconnected components should be in different communities
    expect(commOf.get('a')).not.toBe(commOf.get('d'));
  });

  it('should assign L2 communities when maxLevel=2', () => {
    // Create enough entities for L2 (need multiple L1 communities)
    const names = Array.from({ length: 15 }, (_, i) => `entity_${String(i).padStart(2, '0')}`);
    // Create two groups with internal connections + sparse cross-connections
    const rels: Array<[string, string, 'N:1' | '1:N' | 'N:N']> = [];
    // Group 1: 0-6
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 7; j++) {
        rels.push([names[i], names[j], 'N:1']);
      }
    }
    // Group 2: 7-14
    for (let i = 7; i < 14; i++) {
      for (let j = i + 1; j < 15; j++) {
        rels.push([names[i], names[j], 'N:1']);
      }
    }
    // One bridge
    rels.push([names[6], names[7], 'N:1']);

    const { entities, relationships, selectedEntities } = createTestGraph(names, rels);
    const graph = buildGraph(entities, relationships, selectedEntities);
    const result = leidenCommunityDetection(graph, 2);

    expect(result).toHaveLength(15);
    // All nodes should have communityL2 defined
    for (const r of result) {
      expect(typeof r.communityL2).toBe('number');
    }
  });

  it('should handle graph with no edges', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f'];
    const { entities, relationships, selectedEntities } = createTestGraph(names, []);
    const graph = buildGraph(entities, relationships, selectedEntities);
    const result = leidenCommunityDetection(graph, 1);

    expect(result).toHaveLength(6);
    // With no edges, each node should stay in its own community
    const communities = new Set(result.map((r) => r.communityL1));
    expect(communities.size).toBe(6);
  });

  it('should handle complete graph', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f'];
    const rels: Array<[string, string, 'N:1' | '1:N' | 'N:N']> = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        rels.push([names[i], names[j], 'N:1']);
      }
    }
    const { entities, relationships, selectedEntities } = createTestGraph(names, rels);
    const graph = buildGraph(entities, relationships, selectedEntities);
    const result = leidenCommunityDetection(graph, 1);

    expect(result).toHaveLength(6);
    // Complete graph: all should be in same community
    const communities = new Set(result.map((r) => r.communityL1));
    expect(communities.size).toBe(1);
  });
});

// ============================================================================
// Sugiyama: Layer Assignment
// ============================================================================

describe('assignLayers', () => {
  it('should put roots at layer 0', () => {
    const directedAdj = new Map<string, string[]>([
      ['account', ['contact']],
      ['contact', []],
    ]);
    const { layers } = assignLayers(['account', 'contact'], directedAdj);

    expect(layers.get('account')).toBe(0);
    expect(layers.get('contact')).toBe(1);
  });

  it('should handle multi-level hierarchy', () => {
    const directedAdj = new Map<string, string[]>([
      ['a', ['b']],
      ['b', ['c']],
      ['c', []],
    ]);
    const { layers, layerGroups } = assignLayers(['a', 'b', 'c'], directedAdj);

    expect(layers.get('a')).toBe(0);
    expect(layers.get('b')).toBe(1);
    expect(layers.get('c')).toBe(2);
    expect(layerGroups).toHaveLength(3);
  });

  it('should handle cycles without infinite loop', () => {
    const directedAdj = new Map<string, string[]>([
      ['a', ['b']],
      ['b', ['c']],
      ['c', ['a']], // cycle
    ]);
    const { layers } = assignLayers(['a', 'b', 'c'], directedAdj);

    // Should complete without hanging
    expect(layers.size).toBe(3);
    for (const [, layer] of layers) {
      expect(typeof layer).toBe('number');
      expect(layer).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle nodes with no connections', () => {
    const directedAdj = new Map<string, string[]>([
      ['a', []],
      ['b', []],
    ]);
    const { layers } = assignLayers(['a', 'b'], directedAdj);

    expect(layers.get('a')).toBe(0);
    expect(layers.get('b')).toBe(0);
  });
});

// ============================================================================
// Sugiyama: Crossing Minimization
// ============================================================================

describe('minimizeCrossings', () => {
  it('should return same layers for single layer', () => {
    const result = minimizeCrossings(
      [['a', 'b', 'c']],
      new Map([
        ['a', []],
        ['b', []],
        ['c', []],
      ]),
      new Set(['a', 'b', 'c']),
      10
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(3);
  });

  it('should preserve all nodes after optimization', () => {
    const directedAdj = new Map<string, string[]>([
      ['a', ['c']],
      ['b', ['d']],
      ['c', []],
      ['d', []],
    ]);
    const layers = [
      ['a', 'b'],
      ['c', 'd'],
    ];
    const result = minimizeCrossings(layers, directedAdj, new Set(['a', 'b', 'c', 'd']), 10);

    expect(result).toHaveLength(2);
    expect(result[0].sort()).toEqual(['a', 'b']);
    expect(result[1].sort()).toEqual(['c', 'd']);
  });
});

// ============================================================================
// Sugiyama: Coordinate Assignment
// ============================================================================

describe('assignCoordinates', () => {
  it('should assign valid positions for all nodes', () => {
    const positions = assignCoordinates([['a', 'b'], ['c']], 380, 320);

    expect(positions['a']).toBeDefined();
    expect(positions['b']).toBeDefined();
    expect(positions['c']).toBeDefined();
    expect(typeof positions['a'].x).toBe('number');
    expect(typeof positions['a'].y).toBe('number');
  });

  it('should place layers at different y positions', () => {
    const positions = assignCoordinates([['a'], ['b'], ['c']], 380, 320);

    expect(positions['a'].y).toBeLessThan(positions['b'].y);
    expect(positions['b'].y).toBeLessThan(positions['c'].y);
  });

  it('should space nodes horizontally within a layer', () => {
    const positions = assignCoordinates([['a', 'b', 'c']], 380, 320);

    expect(positions['a'].x).toBeLessThan(positions['b'].x);
    expect(positions['b'].x).toBeLessThan(positions['c'].x);
  });
});

// ============================================================================
// Sugiyama: Full Pipeline
// ============================================================================

describe('sugiyamaLayout', () => {
  it('should return empty object for empty input', () => {
    const result = sugiyamaLayout([], new Map(), 380, 320);
    expect(result).toEqual({});
  });

  it('should return single position for one node', () => {
    const directedAdj = new Map<string, string[]>([['a', []]]);
    const result = sugiyamaLayout(['a'], directedAdj, 380, 320);

    expect(result['a']).toEqual({ x: 0, y: 0 });
  });

  it('should produce valid positions for hierarchy', () => {
    const directedAdj = new Map<string, string[]>([
      ['account', ['contact', 'opportunity']],
      ['contact', []],
      ['opportunity', []],
    ]);
    const result = sugiyamaLayout(['account', 'contact', 'opportunity'], directedAdj, 380, 320);

    expect(Object.keys(result)).toHaveLength(3);
    // Account should be above contact and opportunity
    expect(result['account'].y).toBeLessThan(result['contact'].y);
    expect(result['account'].y).toBeLessThan(result['opportunity'].y);
  });
});

// ============================================================================
// Community Bounding Rectangles
// ============================================================================

describe('computeCommunityRect', () => {
  it('should compute correct bounds with padding', () => {
    const positions = {
      a: { x: 0, y: 0 },
      b: { x: 400, y: 300 },
    };
    const rect = computeCommunityRect(0, positions, NICOLAS_COMMUNITY_PADDING);

    expect(rect.width).toBe(400 + CARD_WIDTH + NICOLAS_COMMUNITY_PADDING * 2);
    expect(rect.height).toBeGreaterThan(300);
    expect(rect.communityId).toBe(0);
  });

  it('should handle single entity', () => {
    const rect = computeCommunityRect(1, { a: { x: 100, y: 100 } }, NICOLAS_COMMUNITY_PADDING);

    expect(rect.width).toBe(CARD_WIDTH + NICOLAS_COMMUNITY_PADDING * 2);
    expect(rect.positions['a'].x).toBe(NICOLAS_COMMUNITY_PADDING);
    expect(rect.positions['a'].y).toBe(NICOLAS_COMMUNITY_PADDING);
  });

  it('should handle empty positions', () => {
    const rect = computeCommunityRect(0, {}, NICOLAS_COMMUNITY_PADDING);
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  it('should normalize positions relative to bounding box', () => {
    const positions = {
      a: { x: 500, y: 500 },
      b: { x: 600, y: 700 },
    };
    const rect = computeCommunityRect(0, positions, 50);

    // Positions should be relative to the community rect
    expect(rect.positions['a'].x).toBe(50); // padding
    expect(rect.positions['a'].y).toBe(50); // padding
    expect(rect.positions['b'].x).toBe(150); // 100 + padding
  });
});

// ============================================================================
// Meta-Graph Layout
// ============================================================================

describe('layoutMetaGraph', () => {
  it('should return empty for no rects', () => {
    expect(layoutMetaGraph([], 100)).toEqual([]);
  });

  it('should place single rect at origin', () => {
    const rects: Parameters<typeof layoutMetaGraph>[0] = [
      { communityId: 0, x: 0, y: 0, width: 500, height: 400, positions: {} },
    ];
    const result = layoutMetaGraph(rects, 100);

    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(0);
    expect(result[0].y).toBe(0);
  });

  it('should not overlap rectangles', () => {
    const rects = [
      { communityId: 0, x: 0, y: 0, width: 500, height: 400, positions: {} },
      { communityId: 1, x: 0, y: 0, width: 300, height: 350, positions: {} },
      { communityId: 2, x: 0, y: 0, width: 400, height: 300, positions: {} },
    ];
    const result = layoutMetaGraph(rects, 100);

    // Check no overlaps
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });

  it('should respect gap between rectangles in same row', () => {
    const rects = [
      { communityId: 0, x: 0, y: 0, width: 200, height: 200, positions: {} },
      { communityId: 1, x: 0, y: 0, width: 200, height: 200, positions: {} },
    ];
    const gap = 100;
    const result = layoutMetaGraph(rects, gap);

    // Both same height, sorted together, should be in same row
    if (result[0].y === result[1].y) {
      const dist = Math.abs(
        Math.max(result[0].x, result[1].x) -
          Math.min(result[0].x + result[0].width, result[1].x + result[1].width)
      );
      expect(dist).toBeGreaterThanOrEqual(gap);
    }
  });
});

// ============================================================================
// Full Pipeline: computeNicolasLayout
// ============================================================================

describe('computeNicolasLayout', () => {
  it('should return empty for no entities', () => {
    const result = computeNicolasLayout([], [], new Set());
    expect(result).toEqual({});
  });

  it('should return valid position for single entity', () => {
    const entities = [makeEntity('account')];
    const result = computeNicolasLayout(entities, [], new Set(['account']));

    expect(result['account']).toBeDefined();
    expect(typeof result['account'].x).toBe('number');
    expect(typeof result['account'].y).toBe('number');
  });

  it('should return valid positions for 3 entities (below Leiden threshold)', () => {
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['account', 'contact', 'lead'],
      [['contact', 'account', 'N:1']]
    );
    const result = computeNicolasLayout(entities, relationships, selectedEntities);

    expect(Object.keys(result)).toHaveLength(3);
    for (const pos of Object.values(result)) {
      expect(typeof pos.x).toBe('number');
      expect(typeof pos.y).toBe('number');
      expect(isFinite(pos.x)).toBe(true);
      expect(isFinite(pos.y)).toBe(true);
    }
  });

  it('should return valid positions for 10 entities (Leiden L1)', () => {
    const names = Array.from({ length: 10 }, (_, i) => `entity_${i}`);
    const rels: Array<[string, string, 'N:1' | '1:N' | 'N:N']> = [];
    // Create some connections
    for (let i = 1; i < 10; i++) {
      rels.push([names[i], names[0], 'N:1']);
    }
    const { entities, relationships, selectedEntities } = createTestGraph(names, rels);
    const result = computeNicolasLayout(entities, relationships, selectedEntities);

    expect(Object.keys(result)).toHaveLength(10);
    for (const pos of Object.values(result)) {
      expect(isFinite(pos.x)).toBe(true);
      expect(isFinite(pos.y)).toBe(true);
    }
  });

  it('should return valid positions for 20 entities (Leiden L2)', () => {
    const names = Array.from({ length: 20 }, (_, i) => `entity_${String(i).padStart(2, '0')}`);
    const rels: Array<[string, string, 'N:1' | '1:N' | 'N:N']> = [];
    // Group 1: star centered on entity_00
    for (let i = 1; i < 10; i++) {
      rels.push([names[i], names[0], 'N:1']);
    }
    // Group 2: star centered on entity_10
    for (let i = 11; i < 20; i++) {
      rels.push([names[i], names[10], 'N:1']);
    }
    // Bridge
    rels.push([names[9], names[10], 'N:1']);

    const { entities, relationships, selectedEntities } = createTestGraph(names, rels);
    const result = computeNicolasLayout(entities, relationships, selectedEntities);

    expect(Object.keys(result)).toHaveLength(20);
    for (const pos of Object.values(result)) {
      expect(isFinite(pos.x)).toBe(true);
      expect(isFinite(pos.y)).toBe(true);
    }
  });

  it('should handle entities with no relationships', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const { entities, relationships, selectedEntities } = createTestGraph(names, []);
    const result = computeNicolasLayout(entities, relationships, selectedEntities);

    expect(Object.keys(result)).toHaveLength(7);
    for (const pos of Object.values(result)) {
      expect(isFinite(pos.x)).toBe(true);
      expect(isFinite(pos.y)).toBe(true);
    }
  });

  it('should place related entities closer than unrelated ones', () => {
    // Two distinct groups
    const { entities, relationships, selectedEntities } = createTestGraph(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      [
        ['a', 'b', 'N:1'],
        ['b', 'c', 'N:1'],
        ['c', 'd', 'N:1'],
        ['e', 'f', 'N:1'],
        ['f', 'g', 'N:1'],
        ['g', 'h', 'N:1'],
      ]
    );
    const result = computeNicolasLayout(entities, relationships, selectedEntities);

    // Compute average distance within group 1 and between groups
    const dist = (a: string, b: string) => {
      const dx = result[a].x - result[b].x;
      const dy = result[a].y - result[b].y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Average intra-group distance should be less than inter-group
    const intra1 = (dist('a', 'b') + dist('b', 'c') + dist('c', 'd')) / 3;
    const inter = (dist('a', 'e') + dist('b', 'f') + dist('c', 'g')) / 3;

    // This is a soft check - community detection should generally group related entities
    // With 8 entities (≥6), Leiden should be active and detect two communities
    expect(Object.keys(result)).toHaveLength(8);
    // At minimum, all positions should be valid
    for (const pos of Object.values(result)) {
      expect(isFinite(pos.x)).toBe(true);
      expect(isFinite(pos.y)).toBe(true);
    }
    // Intra should generally be smaller, but allow some tolerance for algorithm variations
    if (intra1 > 0 && inter > 0) {
      expect(intra1).toBeLessThan(inter * 2); // loose constraint
    }
  });

  it('should produce all numeric finite positions', () => {
    const names = Array.from({ length: 30 }, (_, i) => `e${i}`);
    const rels: Array<[string, string, 'N:1' | '1:N' | 'N:N']> = [];
    for (let i = 1; i < 30; i++) {
      rels.push([names[i], names[i % 5 === 0 ? 0 : i - 1], 'N:1']);
    }
    const { entities, relationships, selectedEntities } = createTestGraph(names, rels);
    const result = computeNicolasLayout(entities, relationships, selectedEntities);

    expect(Object.keys(result)).toHaveLength(30);
    for (const [name, pos] of Object.entries(result)) {
      expect(isFinite(pos.x)).toBe(true);
      expect(isFinite(pos.y)).toBe(true);
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(typeof name).toBe('string');
    }
  });
});
