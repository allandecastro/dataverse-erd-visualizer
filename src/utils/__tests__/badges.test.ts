/**
 * Tests for Badge Classification
 * Validates attribute type badge generation and classification
 */

import { getAttributeBadge, isLookupType, isCustomAttribute } from '../badges';
import type { EntityAttribute } from '@/types';

describe('badges', () => {
  describe('getAttributeBadge', () => {
    it('should return PK badge for primary key', () => {
      const attr: EntityAttribute = {
        logicalName: 'accountid',
        displayName: 'Account ID',
        type: 'UniqueIdentifier',
        isPrimaryKey: true,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('PK');
      expect(badge.color).toBe('#f59e0b');
    });

    it('should return LKP badge for Lookup type', () => {
      const attr: EntityAttribute = {
        logicalName: 'parentaccountid',
        displayName: 'Parent Account',
        type: 'Lookup',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('LKP');
      expect(badge.color).toBe('#ef4444');
    });

    it('should return LKP badge for Owner type', () => {
      const attr: EntityAttribute = {
        logicalName: 'ownerid',
        displayName: 'Owner',
        type: 'Owner',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('LKP');
      expect(badge.color).toBe('#ef4444');
    });

    it('should return LKP badge for Customer type', () => {
      const attr: EntityAttribute = {
        logicalName: 'customerid',
        displayName: 'Customer',
        type: 'Customer',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('LKP');
      expect(badge.color).toBe('#ef4444');
    });

    it('should return TXT badge for String type', () => {
      const attr: EntityAttribute = {
        logicalName: 'name',
        displayName: 'Name',
        type: 'String',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('TXT');
      expect(badge.color).toBe('#8b5cf6');
    });

    it('should return MLT badge for Memo type', () => {
      const attr: EntityAttribute = {
        logicalName: 'description',
        displayName: 'Description',
        type: 'Memo',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('MLT');
      expect(badge.color).toBe('#8b5cf6');
    });

    it('should return INT badge for Integer type', () => {
      const attr: EntityAttribute = {
        logicalName: 'numberofemployees',
        displayName: 'Number of Employees',
        type: 'Integer',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('INT');
      expect(badge.color).toBe('#3b82f6');
    });

    it('should return INT badge for BigInt type', () => {
      const attr: EntityAttribute = {
        logicalName: 'versionnumber',
        displayName: 'Version Number',
        type: 'BigInt',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('INT');
      expect(badge.color).toBe('#3b82f6');
    });

    it('should return DEC badge for Decimal type', () => {
      const attr: EntityAttribute = {
        logicalName: 'exchangerate',
        displayName: 'Exchange Rate',
        type: 'Decimal',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('DEC');
      expect(badge.color).toBe('#3b82f6');
    });

    it('should return FLT badge for Double type', () => {
      const attr: EntityAttribute = {
        logicalName: 'percentage',
        displayName: 'Percentage',
        type: 'Double',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('FLT');
      expect(badge.color).toBe('#3b82f6');
    });

    it('should return CUR badge for Money type', () => {
      const attr: EntityAttribute = {
        logicalName: 'revenue',
        displayName: 'Revenue',
        type: 'Money',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('CUR');
      expect(badge.color).toBe('#22c55e');
    });

    it('should return DT badge for DateTime type', () => {
      const attr: EntityAttribute = {
        logicalName: 'createdon',
        displayName: 'Created On',
        type: 'DateTime',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('DT');
      expect(badge.color).toBe('#10b981');
    });

    it('should return Y/N badge for Boolean type', () => {
      const attr: EntityAttribute = {
        logicalName: 'donotemail',
        displayName: 'Do Not Email',
        type: 'Boolean',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('Y/N');
      expect(badge.color).toBe('#6366f1');
    });

    it('should return CHC badge for Picklist type', () => {
      const attr: EntityAttribute = {
        logicalName: 'industrycode',
        displayName: 'Industry',
        type: 'Picklist',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('CHC');
      expect(badge.color).toBe('#ec4899');
    });

    it('should return STS badge for State type', () => {
      const attr: EntityAttribute = {
        logicalName: 'statecode',
        displayName: 'Status',
        type: 'State',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('STS');
      expect(badge.color).toBe('#f97316');
    });

    it('should return RSN badge for Status type', () => {
      const attr: EntityAttribute = {
        logicalName: 'statuscode',
        displayName: 'Status Reason',
        type: 'Status',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('RSN');
      expect(badge.color).toBe('#f97316');
    });

    it('should return UID badge for UniqueIdentifier type (non-PK)', () => {
      const attr: EntityAttribute = {
        logicalName: 'transactioncurrencyid',
        displayName: 'Currency',
        type: 'UniqueIdentifier',
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('UID');
      expect(badge.color).toBe('#f59e0b');
    });

    it('should return EXT badge for unknown types', () => {
      const attr: EntityAttribute = {
        logicalName: 'customfield',
        displayName: 'Custom Field',
        type: 'UnknownType' as any,
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('EXT');
      expect(badge.color).toBe('#6b7280');
    });

    it('should prioritize PK badge over type-specific badge', () => {
      const attr: EntityAttribute = {
        logicalName: 'accountid',
        displayName: 'Account ID',
        type: 'UniqueIdentifier',
        isPrimaryKey: true,
      };

      const badge = getAttributeBadge(attr);

      // Should be PK, not UID
      expect(badge.label).toBe('PK');
    });
  });

  describe('isLookupType', () => {
    it('should identify Lookup type as lookup', () => {
      const attr: EntityAttribute = {
        logicalName: 'parentaccountid',
        displayName: 'Parent Account',
        type: 'Lookup',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(true);
    });

    it('should identify Owner type as lookup', () => {
      const attr: EntityAttribute = {
        logicalName: 'ownerid',
        displayName: 'Owner',
        type: 'Owner',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(true);
    });

    it('should identify Customer type as lookup', () => {
      const attr: EntityAttribute = {
        logicalName: 'customerid',
        displayName: 'Customer',
        type: 'Customer',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(true);
    });

    it('should reject String type as not lookup', () => {
      const attr: EntityAttribute = {
        logicalName: 'name',
        displayName: 'Name',
        type: 'String',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(false);
    });

    it('should reject Integer type as not lookup', () => {
      const attr: EntityAttribute = {
        logicalName: 'age',
        displayName: 'Age',
        type: 'Integer',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(false);
    });

    it('should reject UniqueIdentifier type as not lookup', () => {
      const attr: EntityAttribute = {
        logicalName: 'accountid',
        displayName: 'Account ID',
        type: 'UniqueIdentifier',
        isPrimaryKey: true,
      };

      expect(isLookupType(attr)).toBe(false);
    });
  });

  describe('isCustomAttribute', () => {
    it('should identify custom attribute when isCustomAttribute is true', () => {
      const attr: EntityAttribute = {
        logicalName: 'new_customfield',
        displayName: 'Custom Field',
        type: 'String',
        isPrimaryKey: false,
        isCustomAttribute: true,
      };

      expect(isCustomAttribute(attr)).toBe(true);
    });

    it('should reject standard attribute when isCustomAttribute is false', () => {
      const attr: EntityAttribute = {
        logicalName: 'name',
        displayName: 'Name',
        type: 'String',
        isPrimaryKey: false,
        isCustomAttribute: false,
      };

      expect(isCustomAttribute(attr)).toBe(false);
    });

    it('should reject attribute when isCustomAttribute is undefined', () => {
      const attr: EntityAttribute = {
        logicalName: 'name',
        displayName: 'Name',
        type: 'String',
        isPrimaryKey: false,
      };

      expect(isCustomAttribute(attr)).toBe(false);
    });

    it('should handle publisher-prefixed custom attributes', () => {
      const attr: EntityAttribute = {
        logicalName: 'cr123_customfield',
        displayName: 'Publisher Custom Field',
        type: 'String',
        isPrimaryKey: false,
        isCustomAttribute: true,
      };

      expect(isCustomAttribute(attr)).toBe(true);
    });
  });
});
