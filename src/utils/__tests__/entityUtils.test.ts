/**
 * Tests for Entity Utilities
 * Tests publisher extraction and entity utility functions
 */

import {
  getEntityPublisher,
  isCustomEntity,
  getEntityNodeColor,
  STANDARD_PUBLISHERS,
} from '../entityUtils';
import type { Entity } from '@/types';
import type { ColorSettings } from '@/types/erdTypes';

describe('entityUtils', () => {
  describe('getEntityPublisher', () => {
    it('should return publisher from entity.publisher field when present', () => {
      const entity: Entity = {
        logicalName: 'contoso_project',
        displayName: 'Project',
        objectTypeCode: 10001,
        isCustomEntity: true,
        primaryIdAttribute: 'contoso_projectid',
        primaryNameAttribute: 'contoso_name',
        attributes: [],
        publisher: 'Contoso Corporation', // Explicit publisher
        alternateKeys: [],
      };

      expect(getEntityPublisher(entity)).toBe('Contoso Corporation');
    });

    it('should return "Microsoft" for standard (non-custom) entities', () => {
      const entity: Entity = {
        logicalName: 'account',
        displayName: 'Account',
        objectTypeCode: 1,
        isCustomEntity: false,
        primaryIdAttribute: 'accountid',
        primaryNameAttribute: 'name',
        attributes: [],
        alternateKeys: [],
      };

      expect(getEntityPublisher(entity)).toBe('Microsoft');
    });

    it('should extract publisher from custom entity name prefix', () => {
      const entity: Entity = {
        logicalName: 'contoso_project',
        displayName: 'Project',
        objectTypeCode: 10001,
        isCustomEntity: true,
        primaryIdAttribute: 'contoso_projectid',
        primaryNameAttribute: 'contoso_name',
        attributes: [],
        alternateKeys: [],
      };

      expect(getEntityPublisher(entity)).toBe('contoso');
    });

    it('should handle single-character publisher prefixes', () => {
      const entity: Entity = {
        logicalName: 'c_table',
        displayName: 'Table',
        objectTypeCode: 10002,
        isCustomEntity: true,
        primaryIdAttribute: 'c_tableid',
        primaryNameAttribute: 'c_name',
        attributes: [],
        alternateKeys: [],
      };

      expect(getEntityPublisher(entity)).toBe('c');
    });

    it('should extract only the first part before underscore', () => {
      const entity: Entity = {
        logicalName: 'contoso_my_custom_entity',
        displayName: 'My Custom Entity',
        objectTypeCode: 10003,
        isCustomEntity: true,
        primaryIdAttribute: 'contoso_my_custom_entityid',
        primaryNameAttribute: 'contoso_name',
        attributes: [],
        alternateKeys: [],
      };

      // Should return 'contoso', not 'contoso_my' or 'contoso_my_custom'
      expect(getEntityPublisher(entity)).toBe('contoso');
    });

    it('should return "Unknown" when underscore is at position 0', () => {
      const entity: Entity = {
        logicalName: '_invalidtable',
        displayName: 'Invalid Table',
        objectTypeCode: 10004,
        isCustomEntity: true,
        primaryIdAttribute: '_invalidtableid',
        primaryNameAttribute: '_name',
        attributes: [],
        alternateKeys: [],
      };

      // Cannot extract publisher when underscore is at position 0
      expect(getEntityPublisher(entity)).toBe('Unknown');
    });

    it('should return "Unknown" when no underscore is found in custom entity', () => {
      const entity: Entity = {
        logicalName: 'customtable',
        displayName: 'Custom Table',
        objectTypeCode: 10005,
        isCustomEntity: true,
        primaryIdAttribute: 'customtableid',
        primaryNameAttribute: 'customname',
        attributes: [],
        alternateKeys: [],
      };

      // Cannot extract publisher without underscore separator
      expect(getEntityPublisher(entity)).toBe('Unknown');
    });

    it('should handle numeric publisher prefixes', () => {
      const entity: Entity = {
        logicalName: '123_numerictable',
        displayName: 'Numeric Table',
        objectTypeCode: 10006,
        isCustomEntity: true,
        primaryIdAttribute: '123_numerictableid',
        primaryNameAttribute: '123_name',
        attributes: [],
        alternateKeys: [],
      };

      expect(getEntityPublisher(entity)).toBe('123');
    });

    it('should handle mixed alphanumeric publisher prefixes', () => {
      const entity: Entity = {
        logicalName: 'cr123_entity',
        displayName: 'Entity',
        objectTypeCode: 10007,
        isCustomEntity: true,
        primaryIdAttribute: 'cr123_entityid',
        primaryNameAttribute: 'cr123_name',
        attributes: [],
        alternateKeys: [],
      };

      expect(getEntityPublisher(entity)).toBe('cr123');
    });

    it('should prioritize entity.publisher over derived name', () => {
      const entity: Entity = {
        logicalName: 'contoso_project',
        displayName: 'Project',
        objectTypeCode: 10008,
        isCustomEntity: true,
        primaryIdAttribute: 'contoso_projectid',
        primaryNameAttribute: 'contoso_name',
        attributes: [],
        publisher: 'Contoso Inc', // This should take precedence
        alternateKeys: [],
      };

      // Should return explicit publisher, not derived 'contoso'
      expect(getEntityPublisher(entity)).toBe('Contoso Inc');
    });

    it('should handle uppercase publisher prefixes', () => {
      const entity: Entity = {
        logicalName: 'CONTOSO_project',
        displayName: 'Project',
        objectTypeCode: 10009,
        isCustomEntity: true,
        primaryIdAttribute: 'CONTOSO_projectid',
        primaryNameAttribute: 'CONTOSO_name',
        attributes: [],
        alternateKeys: [],
      };

      expect(getEntityPublisher(entity)).toBe('CONTOSO');
    });

    it('should handle special characters in publisher prefixes', () => {
      const entity: Entity = {
        logicalName: 'contoso-corp_entity',
        displayName: 'Entity',
        objectTypeCode: 10010,
        isCustomEntity: true,
        primaryIdAttribute: 'contoso-corp_entityid',
        primaryNameAttribute: 'contoso-corp_name',
        attributes: [],
        alternateKeys: [],
      };

      // Should extract everything before first underscore
      expect(getEntityPublisher(entity)).toBe('contoso-corp');
    });
  });

  describe('STANDARD_PUBLISHERS', () => {
    it('should contain Microsoft publishers', () => {
      expect(STANDARD_PUBLISHERS.has('Microsoft')).toBe(true);
      expect(STANDARD_PUBLISHERS.has('Microsoft Dynamics 365')).toBe(true);
      expect(STANDARD_PUBLISHERS.has('Microsoft Dynamics CRM')).toBe(true);
    });

    it('should not contain custom publishers', () => {
      expect(STANDARD_PUBLISHERS.has('Contoso')).toBe(false);
      expect(STANDARD_PUBLISHERS.has('Custom')).toBe(false);
    });
  });

  describe('isCustomEntity', () => {
    const makeEntity = (publisher?: string): Entity => ({
      logicalName: 'test_entity',
      displayName: 'Test',
      objectTypeCode: 1,
      isCustomEntity: !!publisher,
      primaryIdAttribute: 'testid',
      primaryNameAttribute: 'name',
      attributes: [],
      alternateKeys: [],
      publisher,
    });

    it('should return true for custom publisher', () => {
      expect(isCustomEntity(makeEntity('Contoso'))).toBe(true);
    });

    it('should return false for Microsoft publisher', () => {
      expect(isCustomEntity(makeEntity('Microsoft'))).toBe(false);
    });

    it('should return false for Microsoft Dynamics 365', () => {
      expect(isCustomEntity(makeEntity('Microsoft Dynamics 365'))).toBe(false);
    });

    it('should return false for Microsoft Dynamics CRM', () => {
      expect(isCustomEntity(makeEntity('Microsoft Dynamics CRM'))).toBe(false);
    });

    it('should return false when publisher is undefined', () => {
      expect(isCustomEntity(makeEntity(undefined))).toBe(false);
    });
  });

  describe('getEntityNodeColor', () => {
    const colorSettings: ColorSettings = {
      customTableColor: '#ff0000',
      standardTableColor: '#0000ff',
      lookupColor: '#f97316',
      edgeStyle: 'smoothstep',
      lineNotation: 'simple',
      lineStroke: 'solid',
      lineThickness: 1.5,
      useRelationshipTypeColors: false,
    };

    const makeEntity = (logicalName: string, publisher?: string): Entity => ({
      logicalName,
      displayName: logicalName,
      objectTypeCode: 1,
      isCustomEntity: !!publisher,
      primaryIdAttribute: `${logicalName}id`,
      primaryNameAttribute: 'name',
      attributes: [],
      alternateKeys: [],
      publisher,
    });

    it('should return override color when entity has a color override', () => {
      const entity = makeEntity('account', 'Microsoft');
      const overrides = { account: '#22c55e' };
      expect(getEntityNodeColor(entity, colorSettings, overrides)).toBe('#22c55e');
    });

    it('should return custom color for custom publisher entities', () => {
      const entity = makeEntity('contoso_project', 'Contoso');
      expect(getEntityNodeColor(entity, colorSettings)).toBe('#ff0000');
    });

    it('should return standard color for Microsoft entities', () => {
      const entity = makeEntity('account', 'Microsoft');
      expect(getEntityNodeColor(entity, colorSettings)).toBe('#0000ff');
    });

    it('should return standard color when publisher is undefined', () => {
      const entity = makeEntity('account');
      expect(getEntityNodeColor(entity, colorSettings)).toBe('#0000ff');
    });

    it('should prioritize override over publisher-based color', () => {
      const entity = makeEntity('contoso_project', 'Contoso');
      const overrides = { contoso_project: '#8b5cf6' };
      expect(getEntityNodeColor(entity, colorSettings, overrides)).toBe('#8b5cf6');
    });

    it('should handle empty overrides object', () => {
      const entity = makeEntity('account', 'Microsoft');
      expect(getEntityNodeColor(entity, colorSettings, {})).toBe('#0000ff');
    });

    it('should handle undefined overrides', () => {
      const entity = makeEntity('contoso_project', 'Contoso');
      expect(getEntityNodeColor(entity, colorSettings, undefined)).toBe('#ff0000');
    });
  });
});
