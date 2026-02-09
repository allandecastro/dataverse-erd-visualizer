/**
 * Tests for Export Utilities
 * Tests Mermaid syntax generation and core export functionality
 */

import { exportToMermaid, type ExportOptions } from '../exportUtils';
import type { Entity, EntityRelationship, EntityPosition } from '@/types';

describe('exportUtils', () => {
  const mockEntities: Entity[] = [
    {
      logicalName: 'account',
      displayName: 'Account',
      objectTypeCode: 1,
      isCustomEntity: false,
      primaryIdAttribute: 'accountid',
      primaryNameAttribute: 'name',
      attributes: [
        {
          name: 'accountid',
          displayName: 'Account ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
        { name: 'name', displayName: 'Name', type: 'String', isPrimaryKey: false },
        { name: 'revenue', displayName: 'Revenue', type: 'Money', isPrimaryKey: false },
      ],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
    {
      logicalName: 'contact',
      displayName: 'Contact',
      objectTypeCode: 2,
      isCustomEntity: false,
      primaryIdAttribute: 'contactid',
      primaryNameAttribute: 'fullname',
      attributes: [
        {
          name: 'contactid',
          displayName: 'Contact ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
        { name: 'fullname', displayName: 'Full Name', type: 'String', isPrimaryKey: false },
        { name: 'emailaddress', displayName: 'Email', type: 'String', isPrimaryKey: false },
      ],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
  ];

  const mockRelationships: EntityRelationship[] = [
    {
      from: 'contact',
      to: 'account',
      type: 'N:1',
      schemaName: 'contact_account',
      referencingAttribute: 'parentcustomerid',
      referencedAttribute: 'accountid',
      relationshipType: 'OneToManyRelationship',
    },
  ];

  const mockPositions: Record<string, EntityPosition> = {
    account: { x: 100, y: 100 },
    contact: { x: 500, y: 100 },
  };

  const mockSelectedFields: Record<string, Set<string>> = {
    account: new Set(['accountid', 'name', 'revenue']),
    contact: new Set(['contactid', 'fullname', 'emailaddress']),
  };

  const baseOptions: ExportOptions = {
    entities: mockEntities,
    relationships: mockRelationships,
    entityPositions: mockPositions,
    selectedFields: mockSelectedFields,
    collapsedEntities: new Set(),
    isDarkMode: false,
    colorSettings: {
      customTableColor: '#f0f9ff',
      standardTableColor: '#ffffff',
      lookupColor: '#fee2e2',
      edgeStyle: 'smoothstep' as const,
    },
  };

  describe('exportToMermaid', () => {
    it('should generate valid Mermaid ERD syntax', () => {
      const mermaid = exportToMermaid(baseOptions);

      expect(mermaid).toContain('erDiagram');
      expect(mermaid).toContain('account {');
      expect(mermaid).toContain('contact {');
    });

    it('should include entity attributes with correct types', () => {
      const mermaid = exportToMermaid(baseOptions);

      // Check for primary keys with PK marker
      expect(mermaid).toContain('accountid PK');
      expect(mermaid).toContain('contactid PK');

      // Check for regular fields
      expect(mermaid).toContain('name');
      expect(mermaid).toContain('fullname');
      expect(mermaid).toContain('emailaddress');
      expect(mermaid).toContain('revenue');
    });

    it('should map attribute types to Mermaid types', () => {
      const mermaid = exportToMermaid(baseOptions);

      // UniqueIdentifier -> uuid
      expect(mermaid).toMatch(/uuid\s+accountid\s+PK/);

      // String -> string
      expect(mermaid).toMatch(/string\s+name/);

      // Money -> decimal
      expect(mermaid).toMatch(/decimal\s+revenue/);
    });

    it('should include relationships with correct cardinality', () => {
      const mermaid = exportToMermaid(baseOptions);

      // N:1 relationship: contact ||--o{ account
      expect(mermaid).toContain('contact ||--o{ account');
      expect(mermaid).toContain('contact_account');
    });

    it('should handle 1:N relationships', () => {
      const oneToManyOptions: ExportOptions = {
        ...baseOptions,
        relationships: [
          {
            from: 'account',
            to: 'contact',
            type: '1:N',
            schemaName: 'account_contacts',
            referencingAttribute: 'accountid',
            referencedAttribute: 'contactid',
            relationshipType: 'OneToManyRelationship',
          },
        ],
      };

      const mermaid = exportToMermaid(oneToManyOptions);

      // 1:N relationship: account }o--|| contact
      expect(mermaid).toContain('account }o--|| contact');
      expect(mermaid).toContain('account_contacts');
    });

    it('should handle N:N relationships', () => {
      const manyToManyOptions: ExportOptions = {
        ...baseOptions,
        relationships: [
          {
            from: 'account',
            to: 'contact',
            type: 'N:N',
            schemaName: 'account_contact_nn',
            relationshipType: 'ManyToManyRelationship',
          },
        ],
      };

      const mermaid = exportToMermaid(manyToManyOptions);

      // N:N relationship: account }o--o{ contact
      expect(mermaid).toContain('account }o--o{ contact');
      expect(mermaid).toContain('account_contact_nn');
    });

    it('should handle entities with no selected fields', () => {
      const noFieldsOptions: ExportOptions = {
        ...baseOptions,
        selectedFields: {
          account: new Set(),
          contact: new Set(),
        },
      };

      const mermaid = exportToMermaid(noFieldsOptions);

      // Should still include entities (as primary keys are always shown)
      expect(mermaid).toContain('account {');
      expect(mermaid).toContain('accountid PK');
    });

    it('should handle empty entities array', () => {
      const emptyOptions: ExportOptions = {
        ...baseOptions,
        entities: [],
        relationships: [],
      };

      const mermaid = exportToMermaid(emptyOptions);

      expect(mermaid).toBe('erDiagram\n\n');
    });

    it('should handle empty relationships array', () => {
      const noRelationshipsOptions: ExportOptions = {
        ...baseOptions,
        relationships: [],
      };

      const mermaid = exportToMermaid(noRelationshipsOptions);

      expect(mermaid).toContain('erDiagram');
      expect(mermaid).toContain('account {');
      expect(mermaid).toContain('contact {');
      // Should not have any relationship syntax
      expect(mermaid).not.toContain('||--o{');
      expect(mermaid).not.toContain('}o--||');
    });

    it('should use entity logical names in Mermaid syntax', () => {
      const mermaid = exportToMermaid(baseOptions);

      // Mermaid uses logical names, not display names
      expect(mermaid).toContain('account');
      expect(mermaid).toContain('contact');
      expect(mermaid).not.toContain('Account'); // Display name should not appear in entity definition
      expect(mermaid).not.toContain('Contact'); // Display name should not appear in entity definition
    });

    it('should generate complete Mermaid diagram with multiple relationships', () => {
      const multiRelOptions: ExportOptions = {
        ...baseOptions,
        relationships: [
          {
            from: 'contact',
            to: 'account',
            type: 'N:1',
            schemaName: 'contact_account',
            referencingAttribute: 'accountid',
            referencedAttribute: 'accountid',
            relationshipType: 'OneToManyRelationship',
          },
          {
            from: 'contact',
            to: 'account',
            type: '1:N',
            schemaName: 'account_primarycontact',
            referencingAttribute: 'primarycontactid',
            referencedAttribute: 'contactid',
            relationshipType: 'OneToManyRelationship',
          },
        ],
      };

      const mermaid = exportToMermaid(multiRelOptions);

      // Should contain both relationships
      expect(mermaid).toContain('contact ||--o{ account');
      expect(mermaid).toContain('contact }o--|| account');
      expect(mermaid).toContain('contact_account');
      expect(mermaid).toContain('account_primarycontact');
    });

    it('should format Mermaid output with proper indentation', () => {
      const mermaid = exportToMermaid(baseOptions);

      // Check for proper indentation
      expect(mermaid).toMatch(/^\s{4}account \{/m); // 4 spaces before entity
      expect(mermaid).toMatch(/^\s{8}uuid accountid PK/m); // 8 spaces before attribute
      expect(mermaid).toMatch(/^\s{4}contact ||--o{ account/m); // 4 spaces before relationship
    });

    it('should handle entities with various attribute types', () => {
      const complexEntity: Entity = {
        logicalName: 'complex',
        displayName: 'Complex Entity',
        objectTypeCode: 10000,
        isCustomEntity: true,
        primaryIdAttribute: 'complexid',
        primaryNameAttribute: 'name',
        attributes: [
          { name: 'complexid', displayName: 'ID', type: 'UniqueIdentifier', isPrimaryKey: true },
          { name: 'name', displayName: 'Name', type: 'String', isPrimaryKey: false },
          { name: 'age', displayName: 'Age', type: 'Integer', isPrimaryKey: false },
          { name: 'salary', displayName: 'Salary', type: 'Money', isPrimaryKey: false },
          { name: 'created', displayName: 'Created', type: 'DateTime', isPrimaryKey: false },
          { name: 'active', displayName: 'Active', type: 'Boolean', isPrimaryKey: false },
          { name: 'notes', displayName: 'Notes', type: 'Memo', isPrimaryKey: false },
        ],
        publisher: 'Custom',
        alternateKeys: [],
      };

      const complexOptions: ExportOptions = {
        ...baseOptions,
        entities: [complexEntity],
        selectedFields: {
          complex: new Set(['complexid', 'name', 'age', 'salary', 'created', 'active', 'notes']),
        },
        relationships: [],
      };

      const mermaid = exportToMermaid(complexOptions);

      // Verify type mappings
      expect(mermaid).toContain('uuid complexid PK');
      expect(mermaid).toContain('string name');
      expect(mermaid).toContain('int age');
      expect(mermaid).toContain('decimal salary');
      expect(mermaid).toContain('datetime created');
      expect(mermaid).toContain('boolean active');
      expect(mermaid).toContain('text notes'); // Memo maps to text
    });
  });

  describe('Mermaid Edge Cases', () => {
    it('should handle entity names with underscores', () => {
      const underscoreEntity: Entity = {
        logicalName: 'custom_entity_name',
        displayName: 'Custom Entity',
        objectTypeCode: 10001,
        isCustomEntity: true,
        primaryIdAttribute: 'custom_entity_nameid',
        primaryNameAttribute: 'name',
        attributes: [
          {
            name: 'custom_entity_nameid',
            displayName: 'ID',
            type: 'UniqueIdentifier',
            isPrimaryKey: true,
          },
        ],
        publisher: 'Custom',
        alternateKeys: [],
      };

      const options: ExportOptions = {
        ...baseOptions,
        entities: [underscoreEntity],
        selectedFields: { custom_entity_name: new Set(['custom_entity_nameid']) },
        relationships: [],
      };

      const mermaid = exportToMermaid(options);

      expect(mermaid).toContain('custom_entity_name {');
      expect(mermaid).toContain('custom_entity_nameid PK');
    });

    it('should handle relationship schema names with special characters', () => {
      const specialRelOptions: ExportOptions = {
        ...baseOptions,
        relationships: [
          {
            from: 'contact',
            to: 'account',
            type: 'N:1',
            schemaName: 'new_contact_account_relationship',
            referencingAttribute: 'accountid',
            referencedAttribute: 'accountid',
            relationshipType: 'OneToManyRelationship',
          },
        ],
      };

      const mermaid = exportToMermaid(specialRelOptions);

      expect(mermaid).toContain('new_contact_account_relationship');
    });

    it('should handle single entity with no relationships', () => {
      const singleEntityOptions: ExportOptions = {
        ...baseOptions,
        entities: [mockEntities[0]],
        selectedFields: { account: new Set(['accountid', 'name']) },
        relationships: [],
      };

      const mermaid = exportToMermaid(singleEntityOptions);

      expect(mermaid).toContain('erDiagram');
      expect(mermaid).toContain('account {');
      expect(mermaid).toContain('accountid PK');
      expect(mermaid).toContain('name');
      expect(mermaid).not.toContain('contact');
    });
  });
});
