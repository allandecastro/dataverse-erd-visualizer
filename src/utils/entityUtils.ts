/**
 * Entity utility functions
 */

import type { Entity } from '@/types';

/**
 * Get publisher name from entity
 * Derives publisher from entity metadata or entity name
 */
export function getEntityPublisher(entity: Entity): string {
  if (entity.publisher) return entity.publisher;
  if (!entity.isCustomEntity) return 'Microsoft';
  const underscoreIndex = entity.logicalName.indexOf('_');
  if (underscoreIndex > 0) {
    return entity.logicalName.substring(0, underscoreIndex);
  }
  return 'Unknown';
}
