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

interface SolutionInfo {
  solutionId: string;
  uniqueName: string;
  friendlyName: string;
}

interface EntitySolutionMap {
  [entityMetadataId: string]: string[]; // MetadataId -> solution unique names
}

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
   * Note: Dataverse Web API returns types like "String", "Lookup", "Integer" (without "Type" suffix)
   */
  private mapAttributeType(dataverseType: string): AttributeType {
    const typeMap: Record<string, AttributeType> = {
      // Dataverse returns types without "Type" suffix
      'String': 'String',
      'Memo': 'Memo',
      'Integer': 'Integer',
      'Decimal': 'Decimal',
      'Money': 'Money',
      'DateTime': 'DateTime',
      'Boolean': 'Boolean',
      'Picklist': 'Picklist',
      'Lookup': 'Lookup',
      'Owner': 'Owner',
      'Uniqueidentifier': 'UniqueIdentifier',
      'Customer': 'Customer',
      'State': 'State',
      'Status': 'Status',
      'Double': 'Double',
      'BigInt': 'BigInt',
      // Also support legacy format with "Type" suffix (just in case)
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
   * Uses a multi-step approach to work around v8.2+ limitation:
   * 1. Fetch entity definitions with relationships (without attributes) - handles pagination
   * 2. Fetch attributes separately per entity to get polymorphic types (Targets)
   * 3. Fetch solutions and map entities to their solutions
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

      // Step 2: Fetch solutions and entity-solution mappings in parallel with attributes
      onProgress?.({ page: 0, totalEntities: allEntityMetadata.length, phase: 'fetching_solutions' });
      const solutions = await this.fetchSolutions();
      const entitySolutionMap = await this.fetchEntitySolutionMappings(solutions);

      // Step 3: Fetch attributes separately for each entity to get polymorphic types (including Targets)
      onProgress?.({ page: 0, totalEntities: allEntityMetadata.length, phase: 'fetching_attributes' });
      const entities = await this.enrichEntitiesWithAttributes(allEntityMetadata, onProgress, entitySolutionMap);

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
    onProgress?: (info: { page: number; totalEntities: number; phase: string }) => void,
    entitySolutionMap?: EntitySolutionMap
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

          // Get solution names for this entity
          const solutionNames = entitySolutionMap?.[entityMeta.MetadataId] || [];

          if (!attrResponse.ok) {
            console.warn(`Failed to fetch attributes for ${entityMeta.LogicalName}: ${attrResponse.statusText}`);
            // Return entity without attributes rather than failing
            return this.createEntityWithoutAttributes(entityMeta, solutionNames);
          }

          const attrData = await attrResponse.json();
          return this.transformEntityWithAttributes(entityMeta, attrData.value, solutionNames);
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
  private createEntityWithoutAttributes(entityMeta: DataverseEntityMetadata, solutionNames: string[] = []): Entity {
    return {
      logicalName: entityMeta.LogicalName,
      displayName: entityMeta.DisplayName?.UserLocalizedLabel?.Label || entityMeta.LogicalName,
      objectTypeCode: entityMeta.ObjectTypeCode,
      isCustomEntity: entityMeta.IsCustomEntity,
      primaryIdAttribute: entityMeta.PrimaryIdAttribute,
      primaryNameAttribute: entityMeta.PrimaryNameAttribute,
      attributes: [],
      solutions: solutionNames.length > 0 ? solutionNames : undefined,
    };
  }

  /**
   * Transform entity metadata with separately fetched attributes
   */
  private transformEntityWithAttributes(entityMeta: DataverseEntityMetadata, attributes: any[], solutionNames: string[] = []): Entity {
    // Get the primary key attribute name from entity metadata
    const primaryIdAttribute = entityMeta.PrimaryIdAttribute;

    const mappedAttributes: EntityAttribute[] = attributes.map((attr) => {
      // Check if this is a LookupAttributeMetadata (has @odata.type)
      const isLookupType = attr['@odata.type'] === '#Microsoft.Dynamics.CRM.LookupAttributeMetadata';
      const attrType = attr.AttributeType;

      // PK is identified by matching the entity's PrimaryIdAttribute, not IsPrimaryId flag
      const isPrimaryKey = attr.LogicalName === primaryIdAttribute;

      // Check for lookup types (Dataverse returns "Lookup", "Customer", "Owner" without "Type" suffix)
      const isLookup = isLookupType ||
                       attrType === 'Lookup' ||
                       attrType === 'LookupType' ||
                       attrType === 'Customer' ||
                       attrType === 'CustomerType' ||
                       attrType === 'Owner' ||
                       attrType === 'OwnerType';

      return {
        name: attr.LogicalName,
        displayName: attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName,
        type: this.mapAttributeType(attrType),
        isPrimaryKey,
        isLookup,
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
      solutions: solutionNames.length > 0 ? solutionNames : undefined,
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

  /**
   * Fetch all solutions from Dataverse
   */
  async fetchSolutions(): Promise<SolutionInfo[]> {
    try {
      const url = `${this.baseUrl}/solutions?$select=solutionid,uniquename,friendlyname&$filter=isvisible eq true&$orderby=friendlyname`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch solutions: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return data.value.map((sol: any) => ({
        solutionId: sol.solutionid,
        uniqueName: sol.uniquename,
        friendlyName: sol.friendlyname,
      }));
    } catch (error) {
      console.warn('Error fetching solutions:', error);
      return [];
    }
  }

  /**
   * Fetch entity-to-solution mappings from solutioncomponents
   * Component type 1 = Entity
   */
  async fetchEntitySolutionMappings(solutions: SolutionInfo[]): Promise<EntitySolutionMap> {
    const entitySolutionMap: EntitySolutionMap = {};

    try {
      // Fetch solution components where componenttype = 1 (Entity)
      const url = `${this.baseUrl}/solutioncomponents?$select=objectid,_solutionid_value&$filter=componenttype eq 1`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Content-Type': 'application/json',
          'Prefer': 'odata.maxpagesize=5000',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch solution components: ${response.statusText}`);
        return entitySolutionMap;
      }

      const data = await response.json();

      // Create a lookup map for solution IDs to names
      const solutionIdToName: Record<string, string> = {};
      solutions.forEach(sol => {
        solutionIdToName[sol.solutionId] = sol.uniqueName;
      });

      // Map entity metadata IDs to solution names
      data.value.forEach((component: any) => {
        const entityMetadataId = component.objectid;
        const solutionId = component._solutionid_value;
        const solutionName = solutionIdToName[solutionId];

        if (entityMetadataId && solutionName) {
          if (!entitySolutionMap[entityMetadataId]) {
            entitySolutionMap[entityMetadataId] = [];
          }
          if (!entitySolutionMap[entityMetadataId].includes(solutionName)) {
            entitySolutionMap[entityMetadataId].push(solutionName);
          }
        }
      });

      return entitySolutionMap;
    } catch (error) {
      console.warn('Error fetching solution components:', error);
      return entitySolutionMap;
    }
  }
}

export const dataverseApi = new DataverseApiService();
