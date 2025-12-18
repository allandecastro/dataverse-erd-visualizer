/**
 * Dataverse ERD Visualizer - Type Definitions
 * Author: Allan De Castro
 */

export type AttributeType =
  | 'String'
  | 'Memo'
  | 'Integer'
  | 'Decimal'
  | 'Money'
  | 'DateTime'
  | 'Boolean'
  | 'Picklist'
  | 'Lookup'
  | 'Owner'
  | 'UniqueIdentifier'
  | 'Customer'
  | 'State'
  | 'Status'
  | 'Double'
  | 'BigInt';

export type RelationshipType = 'N:1' | '1:N' | 'N:N';

export interface EntityAttribute {
  name: string;
  displayName: string;
  type: AttributeType;
  isPrimaryKey?: boolean;
  isLookup?: boolean;
  lookupTarget?: string; // Target entity logical name for lookup fields
}

export interface AlternateKey {
  logicalName: string;
  displayName: string;
  keyAttributes: string[]; // Array of attribute logical names that compose the key
}

export interface Entity {
  logicalName: string;
  displayName: string;
  objectTypeCode: number;
  isCustomEntity: boolean;
  primaryIdAttribute: string;
  primaryNameAttribute: string;
  publisher?: string;
  solutions?: string[]; // Entity can belong to multiple solutions
  attributes: EntityAttribute[];
  alternateKeys?: AlternateKey[];
}

export interface EntityRelationship {
  schemaName: string;
  from: string; // Source entity logical name
  to: string; // Target entity logical name
  type: RelationshipType;
  referencingAttribute?: string; // The lookup field name
  referencedAttribute?: string; // The primary key field name (usually)
  relationshipType: 'OneToManyRelationship' | 'ManyToManyRelationship';
}

export interface EntityPosition {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

export interface EntityMetadata {
  entity: Entity;
  position: EntityPosition;
  isCollapsed: boolean;
  selectedFields: Set<string>;
}

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ERDSettings {
  customTableColor: string;
  standardTableColor: string;
  lookupColor: string;
  layoutMode: 'force' | 'grid' | 'auto';
  isDarkMode: boolean;
  isSmartZoom: boolean;
  showMinimap: boolean;
}

// Combined result from metadata fetch
export interface EntityMetadataResult {
  entities: Entity[];
  relationships: EntityRelationship[];
}

// Dataverse Web API Response Types
export interface DataverseEntityMetadataResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string; // Pagination link for next page of results
  value: DataverseEntityMetadata[];
}

export interface DataverseEntityKeyMetadata {
  MetadataId: string;
  LogicalName: string;
  DisplayName: {
    UserLocalizedLabel: {
      Label: string;
    };
  };
  KeyAttributes: string[];
}

export interface DataverseEntityMetadata {
  MetadataId: string;
  LogicalName: string;
  DisplayName: {
    UserLocalizedLabel: {
      Label: string;
    };
  };
  ObjectTypeCode: number;
  IsCustomEntity: boolean;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string;
  Attributes: DataverseAttributeMetadata[];
  Keys?: DataverseEntityKeyMetadata[];
  OneToManyRelationships?: DataverseRelationshipMetadata[];
  ManyToOneRelationships?: DataverseRelationshipMetadata[];
  ManyToManyRelationships?: DataverseManyToManyRelationshipMetadata[];
}

export interface DataverseAttributeMetadata {
  MetadataId: string;
  LogicalName: string;
  DisplayName: {
    UserLocalizedLabel: {
      Label: string;
    };
  };
  AttributeType: string;
  IsPrimaryId?: boolean;
  Targets?: string[]; // For lookup fields
}

export interface DataverseRelationshipMetadata {
  SchemaName: string;
  ReferencingEntity: string;
  ReferencingAttribute: string;
  ReferencedEntity: string;
  ReferencedAttribute: string;
}

export interface DataverseManyToManyRelationshipMetadata {
  SchemaName: string;
  Entity1LogicalName: string;
  Entity2LogicalName: string;
  IntersectEntityName: string;
}

// Dataverse Context (for web resource)
export interface DataverseContext {
  getClientUrl(): string;
  getUserId(): string;
  getUserName(): string;
  getOrgUniqueName(): string;
}

// Xrm type definition
export interface XrmObject {
  Utility: {
    getGlobalContext(): DataverseContext;
  };
  WebApi: {
    retrieveMultipleRecords(
      entityLogicalName: string,
      options?: string,
      maxPageSize?: number
    ): Promise<{
      entities: any[];
      nextLink?: string;
    }>;
    online: {
      execute(request: any): Promise<any>;
    };
  };
}

// Global Xrm object (available in Dataverse web resources)
declare global {
  interface Window {
    Xrm?: XrmObject;
  }
  // Xrm is also available as a global variable (not just window.Xrm)
  // eslint-disable-next-line no-var
  var Xrm: XrmObject | undefined;
}

// Helper to safely get Xrm from parent window (for iframes)
export function getParentXrm(): XrmObject | undefined {
  try {
    return (window.parent as Window & { Xrm?: XrmObject })?.Xrm;
  } catch {
    return undefined;
  }
}
