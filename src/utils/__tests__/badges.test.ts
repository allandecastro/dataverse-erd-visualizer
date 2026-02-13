/**
 * Tests for Badge Classification
 * Validates attribute type badge generation and classification
 */

import {
  getAttributeBadge,
  isLookupType,
  isCustomAttribute,
  getAvailableBadges,
  filterByBadge,
} from '../badges';
import type { EntityAttribute } from '@/types';

describe('badges', () => {
  describe('getAttributeBadge', () => {
    it('should return PK badge for primary key', () => {
      const attr: EntityAttribute = {
        name: 'accountid',
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
        name: 'parentaccountid',
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
        name: 'ownerid',
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
        name: 'customerid',
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
        name: 'name',
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
        name: 'description',
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
        name: 'numberofemployees',
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
        name: 'versionnumber',
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
        name: 'exchangerate',
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
        name: 'percentage',
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
        name: 'revenue',
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
        name: 'createdon',
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
        name: 'donotemail',
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
        name: 'industrycode',
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
        name: 'statecode',
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
        name: 'statuscode',
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
        name: 'transactioncurrencyid',
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
        name: 'customfield',
        displayName: 'Custom Field',
        type: 'UnknownType' as any,
        isPrimaryKey: false,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('EXT');
      expect(badge.color).toBe('#6b7280');
    });

    it('should return PN badge for primary name attribute', () => {
      const attr: EntityAttribute = {
        name: 'name',
        displayName: 'Account Name',
        type: 'String',
        isPrimaryName: true,
      };

      const badge = getAttributeBadge(attr);

      expect(badge.label).toBe('PN');
      expect(badge.color).toBe('#06b6d4');
    });

    it('should prioritize PK badge over PN badge', () => {
      const attr: EntityAttribute = {
        name: 'accountid',
        displayName: 'Account ID',
        type: 'UniqueIdentifier',
        isPrimaryKey: true,
        isPrimaryName: true,
      };

      const badge = getAttributeBadge(attr);

      // PK should take priority over PN
      expect(badge.label).toBe('PK');
    });

    it('should prioritize PN badge over type-specific badge', () => {
      const attr: EntityAttribute = {
        name: 'fullname',
        displayName: 'Full Name',
        type: 'String',
        isPrimaryName: true,
      };

      const badge = getAttributeBadge(attr);

      // Should be PN, not TXT
      expect(badge.label).toBe('PN');
    });

    it('should prioritize PK badge over type-specific badge', () => {
      const attr: EntityAttribute = {
        name: 'accountid',
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
        name: 'parentaccountid',
        displayName: 'Parent Account',
        type: 'Lookup',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(true);
    });

    it('should identify Owner type as lookup', () => {
      const attr: EntityAttribute = {
        name: 'ownerid',
        displayName: 'Owner',
        type: 'Owner',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(true);
    });

    it('should identify Customer type as lookup', () => {
      const attr: EntityAttribute = {
        name: 'customerid',
        displayName: 'Customer',
        type: 'Customer',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(true);
    });

    it('should reject String type as not lookup', () => {
      const attr: EntityAttribute = {
        name: 'name',
        displayName: 'Name',
        type: 'String',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(false);
    });

    it('should reject Integer type as not lookup', () => {
      const attr: EntityAttribute = {
        name: 'age',
        displayName: 'Age',
        type: 'Integer',
        isPrimaryKey: false,
      };

      expect(isLookupType(attr)).toBe(false);
    });

    it('should reject UniqueIdentifier type as not lookup', () => {
      const attr: EntityAttribute = {
        name: 'accountid',
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
        name: 'new_customfield',
        displayName: 'Custom Field',
        type: 'String',
        isPrimaryKey: false,
        isCustomAttribute: true,
      };

      expect(isCustomAttribute(attr)).toBe(true);
    });

    it('should reject standard attribute when isCustomAttribute is false', () => {
      const attr: EntityAttribute = {
        name: 'name',
        displayName: 'Name',
        type: 'String',
        isPrimaryKey: false,
        isCustomAttribute: false,
      };

      expect(isCustomAttribute(attr)).toBe(false);
    });

    it('should reject attribute when isCustomAttribute is undefined', () => {
      const attr: EntityAttribute = {
        name: 'name',
        displayName: 'Name',
        type: 'String',
        isPrimaryKey: false,
      };

      expect(isCustomAttribute(attr)).toBe(false);
    });

    it('should handle publisher-prefixed custom attributes', () => {
      const attr: EntityAttribute = {
        name: 'cr123_customfield',
        displayName: 'Publisher Custom Field',
        type: 'String',
        isPrimaryKey: false,
        isCustomAttribute: true,
      };

      expect(isCustomAttribute(attr)).toBe(true);
    });
  });

  describe('getAvailableBadges', () => {
    const sampleAttributes: EntityAttribute[] = [
      {
        name: 'accountid',
        displayName: 'Account ID',
        type: 'UniqueIdentifier',
        isPrimaryKey: true,
      },
      { name: 'name', displayName: 'Account Name', type: 'String', isPrimaryName: true },
      { name: 'description', displayName: 'Description', type: 'String' },
      { name: 'parentaccountid', displayName: 'Parent Account', type: 'Lookup' },
      { name: 'ownerid', displayName: 'Owner', type: 'Owner' },
      { name: 'revenue', displayName: 'Revenue', type: 'Money' },
      { name: 'createdon', displayName: 'Created On', type: 'DateTime' },
      { name: 'statecode', displayName: 'Status', type: 'State' },
    ];

    it('should return unique badge types with counts', () => {
      const badges = getAvailableBadges(sampleAttributes);

      expect(badges.find((b) => b.label === 'PK')).toEqual({
        label: 'PK',
        color: '#f59e0b',
        count: 1,
      });
      expect(badges.find((b) => b.label === 'PN')).toEqual({
        label: 'PN',
        color: '#06b6d4',
        count: 1,
      });
      expect(badges.find((b) => b.label === 'LKP')).toEqual({
        label: 'LKP',
        color: '#ef4444',
        count: 2,
      });
      expect(badges.find((b) => b.label === 'TXT')).toEqual({
        label: 'TXT',
        color: '#8b5cf6',
        count: 1,
      });
    });

    it('should include all badge types present in attributes', () => {
      const badges = getAvailableBadges(sampleAttributes);
      const labels = badges.map((b) => b.label);

      expect(labels).toContain('PK');
      expect(labels).toContain('PN');
      expect(labels).toContain('LKP');
      expect(labels).toContain('TXT');
      expect(labels).toContain('CUR');
      expect(labels).toContain('DT');
      expect(labels).toContain('STS');
    });

    it('should not include badge types not in attributes', () => {
      const badges = getAvailableBadges(sampleAttributes);
      const labels = badges.map((b) => b.label);

      expect(labels).not.toContain('INT');
      expect(labels).not.toContain('Y/N');
      expect(labels).not.toContain('CHC');
      expect(labels).not.toContain('MLT');
    });

    it('should return empty array for empty attributes', () => {
      expect(getAvailableBadges([])).toEqual([]);
    });

    it('should correctly count Lookup, Owner, and Customer as LKP', () => {
      const attrs: EntityAttribute[] = [
        { name: 'parentid', displayName: 'Parent', type: 'Lookup' },
        { name: 'ownerid', displayName: 'Owner', type: 'Owner' },
        { name: 'customerid', displayName: 'Customer', type: 'Customer' },
      ];

      const badges = getAvailableBadges(attrs);
      const lkp = badges.find((b) => b.label === 'LKP');

      expect(lkp).toBeDefined();
      expect(lkp!.count).toBe(3);
      expect(badges).toHaveLength(1);
    });

    it('should correctly count Integer and BigInt as INT', () => {
      const attrs: EntityAttribute[] = [
        { name: 'count', displayName: 'Count', type: 'Integer' },
        { name: 'version', displayName: 'Version', type: 'BigInt' },
      ];

      const badges = getAvailableBadges(attrs);
      const int = badges.find((b) => b.label === 'INT');

      expect(int).toBeDefined();
      expect(int!.count).toBe(2);
    });
  });

  describe('filterByBadge', () => {
    const mixedAttributes: EntityAttribute[] = [
      {
        name: 'accountid',
        displayName: 'Account ID',
        type: 'UniqueIdentifier',
        isPrimaryKey: true,
      },
      { name: 'name', displayName: 'Account Name', type: 'String', isPrimaryName: true },
      { name: 'description', displayName: 'Description', type: 'String' },
      { name: 'parentaccountid', displayName: 'Parent Account', type: 'Lookup' },
      { name: 'ownerid', displayName: 'Owner', type: 'Owner' },
      { name: 'revenue', displayName: 'Revenue', type: 'Money' },
      { name: 'numberofemployees', displayName: 'Employees', type: 'Integer' },
      { name: 'createdon', displayName: 'Created On', type: 'DateTime' },
    ];

    it('should filter to only PK fields', () => {
      const result = filterByBadge(mixedAttributes, 'PK');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('accountid');
    });

    it('should filter to only PN fields', () => {
      const result = filterByBadge(mixedAttributes, 'PN');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('name');
    });

    it('should filter to all LKP fields (Lookup + Owner)', () => {
      const result = filterByBadge(mixedAttributes, 'LKP');

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.name)).toEqual(['parentaccountid', 'ownerid']);
    });

    it('should filter to TXT fields (excludes PN even though type is String)', () => {
      const result = filterByBadge(mixedAttributes, 'TXT');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('description');
    });

    it('should return empty array when no fields match badge', () => {
      const result = filterByBadge(mixedAttributes, 'CHC');

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty attributes', () => {
      expect(filterByBadge([], 'TXT')).toEqual([]);
    });
  });
});
