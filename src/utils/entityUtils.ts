/**
 * Entity utility functions
 */

import type { Entity } from '@/types';

/**
 * Get publisher name from entity
 * Derives publisher from entity metadata or entity name.
 *
 * Custom entities in Dataverse follow the naming pattern 'publisher_entityname'
 * where the publisher prefix comes before the first underscore (e.g., 'contoso_project').
 * Standard Microsoft entities don't have this prefix pattern.
 *
 * @param entity - The entity to get the publisher from
 * @returns Publisher name (from metadata, derived from name, 'Microsoft' for standard entities, or 'Unknown')
 */
export function getEntityPublisher(entity: Entity): string {
  if (entity.publisher) return entity.publisher;
  if (!entity.isCustomEntity) return 'Microsoft';
  const underscoreIndex = entity.logicalName.indexOf('_');
  // Custom entities should have at least one character before the underscore (e.g., 'c_table')
  // If underscore is at position 0 or not found, the publisher cannot be determined
  if (underscoreIndex > 0) {
    return entity.logicalName.substring(0, underscoreIndex);
  }
  return 'Unknown';
}
