/**
 * Relationship Explorer — pure utility functions for discovering
 * entities connected to a set of source entities via relationships.
 */

import type { Entity, EntityRelationship, RelationshipType } from '@/types';

// ---- Types ----

export type RelationshipDirection = 'outgoing' | 'incoming' | 'many-to-many';

export interface RelationshipDetail {
  schemaName: string;
  type: RelationshipType;
  fromEntity: string;
  toEntity: string;
  referencingAttribute?: string;
  referencedAttribute?: string;
  intersectEntityName?: string;
}

export interface RelatedEntityInfo {
  logicalName: string;
  displayName: string;
  isCustomEntity: boolean;
  publisher: string;
  direction: RelationshipDirection;
  relationships: RelationshipDetail[];
  isOnCanvas: boolean;
}

export interface GroupedRelatedEntities {
  outgoing: RelatedEntityInfo[]; // N:1 — source looks up to these
  incoming: RelatedEntityInfo[]; // 1:N — these look up to source
  manyToMany: RelatedEntityInfo[]; // N:N
}

// ---- Known entity sets for filtering ----

export const SYSTEM_ENTITIES = new Set([
  'systemuser',
  'team',
  'businessunit',
  'organization',
  'transactioncurrency',
  'calendar',
  'owner',
]);

export const ACTIVITY_ENTITIES = new Set([
  'activitypointer',
  'activityparty',
  'email',
  'phonecall',
  'appointment',
  'task',
  'letter',
  'fax',
  'socialactivity',
  'recurringappointmentmaster',
]);

export function isSystemEntity(logicalName: string): boolean {
  return SYSTEM_ENTITIES.has(logicalName);
}

export function isActivityEntity(logicalName: string): boolean {
  return ACTIVITY_ENTITIES.has(logicalName);
}

// ---- Core functions ----

/**
 * Find all entities related to a set of source entities via relationships.
 * Groups results by direction: outgoing (N:1), incoming (1:N), many-to-many (N:N).
 *
 * Self-references within the source set are skipped. An entity connected to
 * multiple source entities is deduplicated (relationships are aggregated).
 */
export function findRelatedEntities(
  sourceEntityNames: string[],
  allEntities: Entity[],
  allRelationships: EntityRelationship[],
  selectedEntities: Set<string>
): GroupedRelatedEntities {
  const sourceSet = new Set(sourceEntityNames);
  const entityMap = new Map(allEntities.map((e) => [e.logicalName, e]));

  // Accumulate related entities keyed by `logicalName::direction`.
  // An entity can appear in multiple direction groups (e.g. both N:1 and N:N)
  // with independent entries — each has its own checkbox in the UI.
  const relatedMap = new Map<string, RelatedEntityInfo>();

  for (const rel of allRelationships) {
    const fromIsSource = sourceSet.has(rel.from);
    const toIsSource = sourceSet.has(rel.to);

    // Only consider relationships where exactly one endpoint is a source entity
    if (!fromIsSource && !toIsSource) continue;
    if (fromIsSource && toIsSource) continue; // skip self-references within source set

    const relatedName = fromIsSource ? rel.to : rel.from;
    const entity = entityMap.get(relatedName);
    if (!entity) continue;

    let direction: RelationshipDirection;
    if (rel.type === 'N:N') {
      direction = 'many-to-many';
    } else if (rel.type === 'N:1') {
      // N:1: 'from' has a lookup pointing to 'to'
      // If source is 'from' → source looks up to related (outgoing)
      // If source is 'to' → related looks up to source (incoming)
      direction = fromIsSource ? 'outgoing' : 'incoming';
    } else {
      // 1:N: 'to' has a lookup pointing to 'from'
      // If source is 'to' → source looks up to related (outgoing)
      // If source is 'from' → related looks up to source (incoming)
      direction = toIsSource ? 'outgoing' : 'incoming';
    }

    const detail: RelationshipDetail = {
      schemaName: rel.schemaName,
      type: rel.type,
      fromEntity: rel.from,
      toEntity: rel.to,
      referencingAttribute: rel.referencingAttribute,
      referencedAttribute: rel.referencedAttribute,
      intersectEntityName: rel.intersectEntityName,
    };

    const key = `${relatedName}::${direction}`;
    const existing = relatedMap.get(key);

    if (existing) {
      existing.relationships.push(detail);
    } else {
      relatedMap.set(key, {
        logicalName: entity.logicalName,
        displayName: entity.displayName,
        isCustomEntity: entity.isCustomEntity,
        publisher: entity.publisher ?? 'Unknown',
        direction,
        relationships: [detail],
        isOnCanvas: selectedEntities.has(entity.logicalName),
      });
    }
  }

  // Group by direction
  const result: GroupedRelatedEntities = {
    outgoing: [],
    incoming: [],
    manyToMany: [],
  };

  for (const info of relatedMap.values()) {
    if (info.direction === 'outgoing') result.outgoing.push(info);
    else if (info.direction === 'incoming') result.incoming.push(info);
    else result.manyToMany.push(info);
  }

  // Sort: not-on-canvas first, then alphabetically
  const sortFn = (a: RelatedEntityInfo, b: RelatedEntityInfo) => {
    if (a.isOnCanvas !== b.isOnCanvas) return a.isOnCanvas ? 1 : -1;
    return a.displayName.localeCompare(b.displayName);
  };

  result.outgoing.sort(sortFn);
  result.incoming.sort(sortFn);
  result.manyToMany.sort(sortFn);

  return result;
}

export interface FilterOptions {
  searchQuery?: string;
  hideSystemEntities?: boolean;
  hideActivityEntities?: boolean;
  customOnly?: boolean;
  hideAlreadyOnCanvas?: boolean;
}

/**
 * Apply search and toggle filters to grouped related entities.
 */
export function filterRelatedEntities(
  grouped: GroupedRelatedEntities,
  options: FilterOptions
): GroupedRelatedEntities {
  const filterFn = (info: RelatedEntityInfo): boolean => {
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      if (
        !info.displayName.toLowerCase().includes(q) &&
        !info.logicalName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (options.hideSystemEntities && isSystemEntity(info.logicalName)) return false;
    if (options.hideActivityEntities && isActivityEntity(info.logicalName)) return false;
    if (options.customOnly && !info.isCustomEntity) return false;
    if (options.hideAlreadyOnCanvas && info.isOnCanvas) return false;
    return true;
  };

  return {
    outgoing: grouped.outgoing.filter(filterFn),
    incoming: grouped.incoming.filter(filterFn),
    manyToMany: grouped.manyToMany.filter(filterFn),
  };
}

/**
 * Count related entities across all direction groups.
 */
export function countRelatedEntities(grouped: GroupedRelatedEntities): {
  total: number;
  onCanvas: number;
  notOnCanvas: number;
} {
  const all = [...grouped.outgoing, ...grouped.incoming, ...grouped.manyToMany];
  const onCanvas = all.filter((e) => e.isOnCanvas).length;
  return {
    total: all.length,
    onCanvas,
    notOnCanvas: all.length - onCanvas,
  };
}
