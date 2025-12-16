/**
 * Dataverse API Service
 * Handles all communication with Dataverse Web API
 */

import type {
  Entity,
  EntityAttribute,
  EntityRelationship,
  EntityMetadataResult,
  DataverseEntityMetadataResponse,
  DataverseEntityMetadata,
  AttributeType,
  RelationshipType,
} from '@/types';
import { getParentXrm } from '@/types';

class DataverseApiService {
  private baseUrl: string = '';
  private apiVersion: string = '9.2';

  /**
   * Initialize the service with Dataverse context
   */
  initialize(): void {
    const clientUrl = this.getClientUrl();
    this.baseUrl = `${clientUrl}/api/data/v${this.apiVersion}`;
  }

  /**
   * Get the Dataverse client URL
   */
  private getClientUrl(): string {
    // Try to get from Xrm context (web resource)
    if (typeof window !== 'undefined' && window.Xrm) {
      return window.Xrm.Utility.getGlobalContext().getClientUrl();
    }

    // Try parent window (if in iframe)
    const parentXrm = getParentXrm();
    if (parentXrm) {
      return parentXrm.Utility.getGlobalContext().getClientUrl();
    }

    // Fallback for development
    // Check if VITE_DATAVERSE_URL is defined in .env file
    const envUrl = import.meta.env.VITE_DATAVERSE_URL;
    if (envUrl && envUrl.trim() !== '') {
      return envUrl;
    }

    // Final fallback to current origin
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  /**
   * Map Dataverse attribute type to our simplified type system
   */
  private mapAttributeType(dataverseType: string): AttributeType {
    const typeMap: Record<string, AttributeType> = {
      'StringType': 'String',
      'MemoType': 'Memo',
      'IntegerType': 'Integer',
      'DecimalType': 'Decimal',
      'MoneyType': 'Money',
      'DateTimeType': 'DateTime',
      'BooleanType': 'Boolean',
      'PicklistType': 'Picklist',
      'LookupType': 'Lookup',
      'OwnerType': 'Owner',
      'UniqueidentifierType': 'UniqueIdentifier',
      'CustomerType': 'Customer',
      'StateType': 'State',
      'StatusType': 'Status',
      'DoubleType': 'Double',
      'BigIntType': 'BigInt',
    };

    return typeMap[dataverseType] || 'String';
  }

  /**
   * Fetch all entity metadata from Dataverse with pagination support
   * Uses a two-step approach to work around v8.2+ limitation:
   * 1. Fetch entity definitions with relationships (without attributes) - handles pagination
   * 2. Fetch attributes separately per entity to get polymorphic types (Targets)
   *
   * Returns both entities and relationships extracted from the metadata
   * @param onProgress - Optional callback to report progress (pages fetched, total entities so far)
   */
  async fetchEntityMetadata(
    onProgress?: (info: { page: number; totalEntities: number; phase: string }) => void
  ): Promise<EntityMetadataResult> {
    try {
      this.initialize();

      // Step 1: Fetch all entity definitions with relationships (handles pagination)
      const allEntityMetadata = await this.fetchAllEntityDefinitions(onProgress);

      onProgress?.({ page: 0, totalEntities: allEntityMetadata.length, phase: 'extracting_relationships' });

      // Extract relationships from raw metadata BEFORE transformation (they would be lost otherwise)
      const relationships = this.extractRelationshipsFromMetadata(allEntityMetadata);

      // Step 2: Fetch attributes separately for each entity to get polymorphic types (including Targets)
      onProgress?.({ page: 0, totalEntities: allEntityMetadata.length, phase: 'fetching_attributes' });
      const entities = await this.enrichEntitiesWithAttributes(allEntityMetadata, onProgress);

      return { entities, relationships };
    } catch (error) {
      console.error('Error fetching entity metadata:', error);
      throw error;
    }
  }

  /**
   * Fetch all entity definitions with pagination support
   * Follows @odata.nextLink to retrieve all pages
   */
  private async fetchAllEntityDefinitions(
    onProgress?: (info: { page: number; totalEntities: number; phase: string }) => void
  ): Promise<DataverseEntityMetadata[]> {
    const allEntities: DataverseEntityMetadata[] = [];
    let pageNumber = 1;

    // Initial query
    // Note: Attributes are excluded because Dataverse Web API v8.2+ doesn't support
    // polymorphic casting in complex-type collections ($expand with derived types)
    let url = `${this.baseUrl}/EntityDefinitions?$select=MetadataId,LogicalName,DisplayName,ObjectTypeCode,IsCustomEntity,PrimaryIdAttribute,PrimaryNameAttribute` +
      `&$expand=` +
      `OneToManyRelationships($select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity,ReferencedAttribute),` +
      `ManyToOneRelationships($select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity,ReferencedAttribute),` +
      `ManyToManyRelationships($select=SchemaName,Entity1LogicalName,Entity2LogicalName,IntersectEntityName)` +
      `&$filter=IsValidForAdvancedFind eq true and IsCustomizable/Value eq true`;

    while (url) {
      onProgress?.({ page: pageNumber, totalEntities: allEntities.length, phase: 'fetching_entities' });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Content-Type': 'application/json',
          'Prefer': 'odata.maxpagesize=100', // Request 100 entities per page
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch entity metadata: ${response.statusText}`);
      }

      const data: DataverseEntityMetadataResponse = await response.json();

      // Add entities from this page
      allEntities.push(...data.value);

      // Check for next page
      url = data['@odata.nextLink'] || '';
      pageNumber++;
    }

    console.log(`Fetched ${allEntities.length} entities across ${pageNumber - 1} page(s)`);
    return allEntities;
  }

  /**
   * Fetch attributes separately for each entity to support polymorphic types
   * This is required because Dataverse Web API v8.2+ doesn't support casting
   * derived types (like LookupAttributeMetadata) inside complex-type collections
   */
  private async enrichEntitiesWithAttributes(
    entities: DataverseEntityMetadata[],
    onProgress?: (info: { page: number; totalEntities: number; phase: string }) => void
  ): Promise<Entity[]> {
    const enrichedEntities: Entity[] = [];

    // Process entities in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);

      // Report progress (entities processed so far)
      onProgress?.({
        page: Math.floor(i / batchSize) + 1,
        totalEntities: enrichedEntities.length,
        phase: `fetching_attributes:${i}/${entities.length}`
      });

      const batchPromises = batch.map(async (entityMeta) => {
        try {
          // Fetch attributes separately to get full polymorphic metadata
          const attributesQuery = `EntityDefinitions(LogicalName='${entityMeta.LogicalName}')/Attributes`;
          const attrResponse = await fetch(`${this.baseUrl}/${attributesQuery}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'OData-MaxVersion': '4.0',
              'OData-Version': '4.0',
              'Content-Type': 'application/json',
            },
          });

          if (!attrResponse.ok) {
            console.warn(`Failed to fetch attributes for ${entityMeta.LogicalName}: ${attrResponse.statusText}`);
            // Return entity without attributes rather than failing
            return this.createEntityWithoutAttributes(entityMeta);
          }

          const attrData = await attrResponse.json();
          return this.transformEntityWithAttributes(entityMeta, attrData.value);
        } catch (error) {
          console.warn(`Error fetching attributes for ${entityMeta.LogicalName}:`, error);
          return this.createEntityWithoutAttributes(entityMeta);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      enrichedEntities.push(...batchResults);
    }

    return enrichedEntities;
  }

  /**
   * Create entity object without attributes (fallback)
   */
  private createEntityWithoutAttributes(entityMeta: DataverseEntityMetadata): Entity {
    return {
      logicalName: entityMeta.LogicalName,
      displayName: entityMeta.DisplayName?.UserLocalizedLabel?.Label || entityMeta.LogicalName,
      objectTypeCode: entityMeta.ObjectTypeCode,
      isCustomEntity: entityMeta.IsCustomEntity,
      primaryIdAttribute: entityMeta.PrimaryIdAttribute,
      primaryNameAttribute: entityMeta.PrimaryNameAttribute,
      attributes: [],
    };
  }

  /**
   * Transform entity metadata with separately fetched attributes
   */
  private transformEntityWithAttributes(entityMeta: DataverseEntityMetadata, attributes: any[]): Entity {
    const mappedAttributes: EntityAttribute[] = attributes.map((attr) => {
      // Check if this is a LookupAttributeMetadata (has @odata.type)
      const isLookupType = attr['@odata.type'] === '#Microsoft.Dynamics.CRM.LookupAttributeMetadata';

      return {
        name: attr.LogicalName,
        displayName: attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName,
        type: this.mapAttributeType(attr.AttributeType),
        isPrimaryKey: attr.IsPrimaryId || false,
        isLookup: isLookupType ||
                  attr.AttributeType === 'LookupType' ||
                  attr.AttributeType === 'CustomerType' ||
                  attr.AttributeType === 'OwnerType',
        lookupTarget: isLookupType && attr.Targets?.length > 0 ? attr.Targets[0] : undefined,
      };
    });

    return {
      logicalName: entityMeta.LogicalName,
      displayName: entityMeta.DisplayName?.UserLocalizedLabel?.Label || entityMeta.LogicalName,
      objectTypeCode: entityMeta.ObjectTypeCode,
      isCustomEntity: entityMeta.IsCustomEntity,
      primaryIdAttribute: entityMeta.PrimaryIdAttribute,
      primaryNameAttribute: entityMeta.PrimaryNameAttribute,
      attributes: mappedAttributes,
    };
  }

  /**
   * Fetch relationships for entities
   * @deprecated Use fetchEntityMetadata() instead, which returns relationships along with entities
   */
  async fetchRelationships(_entities: Entity[]): Promise<EntityRelationship[]> {
    // This method is deprecated - relationships are now extracted from entity metadata
    // in fetchEntityMetadata() to avoid an extra API call
    console.warn('fetchRelationships is deprecated. Use fetchEntityMetadata() which returns both entities and relationships.');
    return [];
  }

  /**
   * Extract relationships from entity metadata
   */
  extractRelationshipsFromMetadata(metadata: DataverseEntityMetadata[]): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];
    const processedRelationships = new Set<string>();

    metadata.forEach((entityMeta) => {
      // Process One-to-Many relationships
      entityMeta.OneToManyRelationships?.forEach((rel) => {
        const relKey = `${rel.SchemaName}-${rel.ReferencingEntity}-${rel.ReferencedEntity}`;
        if (!processedRelationships.has(relKey)) {
          relationships.push({
            schemaName: rel.SchemaName,
            from: rel.ReferencingEntity,
            to: rel.ReferencedEntity,
            type: 'N:1' as RelationshipType,
            referencingAttribute: rel.ReferencingAttribute,
            referencedAttribute: rel.ReferencedAttribute,
            relationshipType: 'OneToManyRelationship',
          });
          processedRelationships.add(relKey);
        }
      });

      // Process Many-to-One relationships (reverse of One-to-Many)
      entityMeta.ManyToOneRelationships?.forEach((rel) => {
        const relKey = `${rel.SchemaName}-${rel.ReferencingEntity}-${rel.ReferencedEntity}`;
        if (!processedRelationships.has(relKey)) {
          relationships.push({
            schemaName: rel.SchemaName,
            from: rel.ReferencingEntity,
            to: rel.ReferencedEntity,
            type: 'N:1' as RelationshipType,
            referencingAttribute: rel.ReferencingAttribute,
            referencedAttribute: rel.ReferencedAttribute,
            relationshipType: 'OneToManyRelationship',
          });
          processedRelationships.add(relKey);
        }
      });

      // Process Many-to-Many relationships
      entityMeta.ManyToManyRelationships?.forEach((rel) => {
        const relKey = `${rel.SchemaName}-${rel.Entity1LogicalName}-${rel.Entity2LogicalName}`;
        if (!processedRelationships.has(relKey)) {
          relationships.push({
            schemaName: rel.SchemaName,
            from: rel.Entity1LogicalName,
            to: rel.Entity2LogicalName,
            type: 'N:N' as RelationshipType,
            relationshipType: 'ManyToManyRelationship',
          });
          processedRelationships.add(relKey);
        }
      });
    });

    return relationships;
  }

  /**
   * Check if running in Dataverse context
   */
  isInDataverseContext(): boolean {
    return !!(window.Xrm || getParentXrm());
  }
}

export const dataverseApi = new DataverseApiService();
