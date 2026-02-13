/**
 * Tests for URL State Codec
 * CRITICAL: These tests verify URL encoding/decoding for sharing functionality
 * Security: Prevents data loss and corruption in shared URLs
 */

import {
  encodeStateToURL,
  decodeStateFromURL,
  expandCompactState,
  estimateURLSize,
  isURLSafe,
  getShareBaseUrl,
  getStateHash,
  type CompactState,
} from '../urlStateCodec';

describe('urlStateCodec', () => {
  const mockState = {
    selectedEntities: ['account', 'contact'],
    entityPositions: {
      account: { x: 100.7, y: 200.3, vx: 1.5, vy: 2.5 },
      contact: { x: 300.2, y: 400.8, vx: 0, vy: 0 },
    },
    zoom: 1.5,
    pan: { x: 50, y: 75 },
    layoutMode: 'force' as const,
    searchQuery: '',
    publisherFilter: '',
    solutionFilter: '',
    isDarkMode: false,
  };

  describe('encodeStateToURL / decodeStateFromURL', () => {
    it('should round-trip encode and decode state', () => {
      const encoded = encodeStateToURL(mockState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state).toBeDefined();
      expect(decoded.state?.e).toEqual(['account', 'contact']);
      expect(decoded.state?.z).toBe(1.5);
      expect(decoded.state?.l).toBe('force');
    });

    it('should round coordinates to integers during encoding', () => {
      const encoded = encodeStateToURL(mockState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.state?.p.account.x).toBe(101); // 100.7 rounded
      expect(decoded.state?.p.account.y).toBe(200); // 200.3 rounded
      expect(decoded.state?.p.contact.x).toBe(300); // 300.2 rounded
      expect(decoded.state?.p.contact.y).toBe(401); // 400.8 rounded
    });

    it('should strip velocity fields during encoding', () => {
      const encoded = encodeStateToURL(mockState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.state?.p.account).toEqual({ x: 101, y: 200 });
      expect(decoded.state?.p.account).not.toHaveProperty('vx');
      expect(decoded.state?.p.account).not.toHaveProperty('vy');
    });

    it('should handle empty state', () => {
      const emptyState = {
        ...mockState,
        selectedEntities: [],
        entityPositions: {},
      };

      const encoded = encodeStateToURL(emptyState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.e).toEqual([]);
      expect(decoded.state?.p).toEqual({});
    });

    it('should handle special characters in entity names', () => {
      const specialState = {
        ...mockState,
        selectedEntities: ['my_custom_entity', 'another-entity', 'entity.with.dots'],
        entityPositions: {
          my_custom_entity: { x: 0, y: 0, vx: 0, vy: 0 },
          'another-entity': { x: 100, y: 100, vx: 0, vy: 0 },
          'entity.with.dots': { x: 200, y: 200, vx: 0, vy: 0 },
        },
      };

      const encoded = encodeStateToURL(specialState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.e).toContain('my_custom_entity');
      expect(decoded.state?.e).toContain('another-entity');
      expect(decoded.state?.e).toContain('entity.with.dots');
    });

    it('should handle filters and dark mode', () => {
      const stateWithFilters = {
        ...mockState,
        searchQuery: 'account',
        publisherFilter: 'Microsoft',
        solutionFilter: 'CRM',
        isDarkMode: true,
      };

      const encoded = encodeStateToURL(stateWithFilters);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.state?.f.s).toBe('account');
      expect(decoded.state?.f.pub).toBe('Microsoft');
      expect(decoded.state?.f.sol).toBe('CRM');
      expect(decoded.state?.d).toBe(true);
    });

    it('should return error for invalid/corrupted URLs', () => {
      expect(decodeStateFromURL('invalid-base64').success).toBe(false);
      expect(decodeStateFromURL('').success).toBe(false);
      expect(decodeStateFromURL('NOT_A_VALID_LZ_STRING').success).toBe(false);
    });

    it('should return error for empty hash', () => {
      const result = decodeStateFromURL('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty hash');
    });

    it('should handle hash with # prefix', () => {
      const encoded = encodeStateToURL(mockState);
      const withPrefix = '#' + encoded;
      const decoded = decodeStateFromURL(withPrefix);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.e).toEqual(['account', 'contact']);
    });

    it('should include version in encoded state', () => {
      const encoded = encodeStateToURL(mockState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.state?.v).toBeDefined();
      expect(decoded.state?.v).toBe('1.0.0');
    });

    it('should round zoom to 2 decimal places', () => {
      const preciseState = {
        ...mockState,
        zoom: 1.23456789,
      };

      const encoded = encodeStateToURL(preciseState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.state?.z).toBe(1.23); // Rounded to 2 decimals
    });
  });

  describe('expandCompactState', () => {
    const compactState: CompactState = {
      e: ['account'],
      p: { account: { x: 100, y: 200 } },
      z: 1.5,
      pn: { x: 50, y: 75 },
      l: 'force',
      f: { s: 'test', pub: 'Microsoft', sol: 'CRM' },
      d: true,
      v: '1.0.0',
    };

    it('should restore velocity fields on expansion', () => {
      const expanded = expandCompactState(compactState);

      expect(expanded.entityPositions?.account).toEqual({ x: 100, y: 200, vx: 0, vy: 0 });
    });

    it('should expand all compact fields to serializable format', () => {
      const expanded = expandCompactState(compactState);

      expect(expanded.selectedEntities).toEqual(['account']);
      expect(expanded.zoom).toBe(1.5);
      expect(expanded.pan).toEqual({ x: 50, y: 75 });
      expect(expanded.layoutMode).toBe('force');
      expect(expanded.searchQuery).toBe('test');
      expect(expanded.publisherFilter).toBe('Microsoft');
      expect(expanded.solutionFilter).toBe('CRM');
      expect(expanded.isDarkMode).toBe(true);
    });

    it('should handle multiple entities', () => {
      const multiEntityState: CompactState = {
        e: ['account', 'contact', 'opportunity'],
        p: {
          account: { x: 100, y: 200 },
          contact: { x: 300, y: 400 },
          opportunity: { x: 500, y: 600 },
        },
        z: 1,
        pn: { x: 0, y: 0 },
        l: 'grid',
        f: { s: '', pub: '', sol: '' },
        d: false,
        v: '1.0.0',
      };

      const expanded = expandCompactState(multiEntityState);

      expect(expanded.selectedEntities).toHaveLength(3);
      expect(expanded.entityPositions).toHaveProperty('account');
      expect(expanded.entityPositions).toHaveProperty('contact');
      expect(expanded.entityPositions).toHaveProperty('opportunity');
    });
  });

  describe('Entity Color Overrides in URL', () => {
    it('should encode and decode entityColorOverrides', () => {
      const stateWithColors = {
        ...mockState,
        entityColorOverrides: { account: '#ef4444', contact: '#22c55e' },
      };

      const encoded = encodeStateToURL(stateWithColors);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.co).toEqual({ account: '#ef4444', contact: '#22c55e' });
    });

    it('should not include co field when entityColorOverrides is empty', () => {
      const stateNoColors = {
        ...mockState,
        entityColorOverrides: {},
      };

      const encoded = encodeStateToURL(stateNoColors);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.co).toBeUndefined();
    });

    it('should not include co field when entityColorOverrides is undefined', () => {
      // mockState has no entityColorOverrides
      const encoded = encodeStateToURL(mockState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.co).toBeUndefined();
    });

    it('should expand entityColorOverrides from CompactState', () => {
      const compactWithColors: CompactState = {
        e: ['account', 'contact'],
        p: { account: { x: 100, y: 200 }, contact: { x: 300, y: 400 } },
        z: 1,
        pn: { x: 0, y: 0 },
        l: 'force',
        f: { s: '', pub: '', sol: '' },
        d: true,
        v: '1.0.0',
        co: { account: '#ef4444' },
      };

      const expanded = expandCompactState(compactWithColors);
      expect(expanded.entityColorOverrides).toEqual({ account: '#ef4444' });
    });

    it('should not include entityColorOverrides when co is absent in CompactState', () => {
      const compactNoColors: CompactState = {
        e: ['account'],
        p: { account: { x: 100, y: 200 } },
        z: 1,
        pn: { x: 0, y: 0 },
        l: 'force',
        f: { s: '', pub: '', sol: '' },
        d: true,
        v: '1.0.0',
      };

      const expanded = expandCompactState(compactNoColors);
      expect(expanded.entityColorOverrides).toBeUndefined();
    });

    it('should keep URL size reasonable with color overrides', () => {
      const stateWith10Colors = {
        ...mockState,
        entityColorOverrides: {
          account: '#ef4444',
          contact: '#22c55e',
          lead: '#3b82f6',
          opportunity: '#8b5cf6',
          case: '#f97316',
          task: '#eab308',
          email: '#14b8a6',
          note: '#ec4899',
          user: '#0ea5e9',
          team: '#64748b',
        },
        selectedEntities: [
          'account',
          'contact',
          'lead',
          'opportunity',
          'case',
          'task',
          'email',
          'note',
          'user',
          'team',
        ],
        entityPositions: {
          account: { x: 0, y: 0, vx: 0, vy: 0 },
          contact: { x: 100, y: 0, vx: 0, vy: 0 },
          lead: { x: 200, y: 0, vx: 0, vy: 0 },
          opportunity: { x: 300, y: 0, vx: 0, vy: 0 },
          case: { x: 400, y: 0, vx: 0, vy: 0 },
          task: { x: 0, y: 100, vx: 0, vy: 0 },
          email: { x: 100, y: 100, vx: 0, vy: 0 },
          note: { x: 200, y: 100, vx: 0, vy: 0 },
          user: { x: 300, y: 100, vx: 0, vy: 0 },
          team: { x: 400, y: 100, vx: 0, vy: 0 },
        },
      };

      // Should encode successfully
      const encoded = encodeStateToURL(stateWith10Colors);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(Object.keys(decoded.state?.co || {})).toHaveLength(10);

      // URL with 10 entities + 10 colors should still be manageable
      expect(encoded.length).toBeLessThan(2000);
    });
  });

  describe('groupNames (gn field)', () => {
    it('should encode and decode groupNames', () => {
      const stateWithGroups = {
        ...mockState,
        entityColorOverrides: { account: '#ef4444', contact: '#3b82f6' },
        groupNames: { '#ef4444': 'Sales', '#3b82f6': 'Service' },
      };

      const encoded = encodeStateToURL(stateWithGroups);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.gn).toEqual({ '#ef4444': 'Sales', '#3b82f6': 'Service' });
    });

    it('should not include gn field when groupNames is empty', () => {
      const stateWithEmptyGroups = {
        ...mockState,
        groupNames: {},
      };

      const encoded = encodeStateToURL(stateWithEmptyGroups);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.gn).toBeUndefined();
    });

    it('should not include gn field when groupNames is undefined', () => {
      const encoded = encodeStateToURL(mockState);
      const decoded = decodeStateFromURL(encoded);

      expect(decoded.success).toBe(true);
      expect(decoded.state?.gn).toBeUndefined();
    });

    it('should expand groupNames from CompactState', () => {
      const compactWithGroups: CompactState = {
        e: ['account'],
        p: { account: { x: 100, y: 200 } },
        z: 1,
        pn: { x: 0, y: 0 },
        l: 'force',
        f: { s: '', pub: '', sol: '' },
        d: false,
        v: '1.0.0',
        co: { account: '#ef4444' },
        gn: { '#ef4444': 'CRM Group' },
      };

      const expanded = expandCompactState(compactWithGroups);
      expect(expanded.groupNames).toEqual({ '#ef4444': 'CRM Group' });
    });

    it('should not include groupNames when gn is absent in CompactState', () => {
      const compactNoGroups: CompactState = {
        e: ['account'],
        p: { account: { x: 100, y: 200 } },
        z: 1,
        pn: { x: 0, y: 0 },
        l: 'force',
        f: { s: '', pub: '', sol: '' },
        d: true,
        v: '1.0.0',
      };

      const expanded = expandCompactState(compactNoGroups);
      expect(expanded.groupNames).toBeUndefined();
    });

    it('should round-trip groupNames with color overrides', () => {
      const fullState = {
        ...mockState,
        entityColorOverrides: {
          account: '#ef4444',
          contact: '#ef4444',
        },
        groupNames: { '#ef4444': 'My Sales Team' },
      };

      const encoded = encodeStateToURL(fullState);
      const decoded = decodeStateFromURL(encoded);
      expect(decoded.success).toBe(true);

      const expanded = expandCompactState(decoded.state!);
      expect(expanded.entityColorOverrides).toEqual({ account: '#ef4444', contact: '#ef4444' });
      expect(expanded.groupNames).toEqual({ '#ef4444': 'My Sales Team' });
    });
  });

  describe('estimateURLSize', () => {
    it('should estimate URL length accurately', () => {
      const size = estimateURLSize(mockState);
      const actualEncoded = encodeStateToURL(mockState);

      // Estimate should include base URL + # + encoded string
      expect(size).toBeGreaterThan(actualEncoded.length);
      expect(size).toBeGreaterThan(0);
    });

    it('should return larger size for states with more entities', () => {
      const smallState = {
        ...mockState,
        selectedEntities: ['account'],
        entityPositions: { account: { x: 0, y: 0, vx: 0, vy: 0 } },
      };

      const largeState = {
        ...mockState,
        selectedEntities: ['account', 'contact', 'opportunity', 'lead', 'case'],
        entityPositions: {
          account: { x: 0, y: 0, vx: 0, vy: 0 },
          contact: { x: 100, y: 100, vx: 0, vy: 0 },
          opportunity: { x: 200, y: 200, vx: 0, vy: 0 },
          lead: { x: 300, y: 300, vx: 0, vy: 0 },
          case: { x: 400, y: 400, vx: 0, vy: 0 },
        },
      };

      const smallSize = estimateURLSize(smallState);
      const largeSize = estimateURLSize(largeState);

      expect(largeSize).toBeGreaterThan(smallSize);
    });
  });

  describe('isURLSafe', () => {
    it('should return true for small states', () => {
      const smallState = {
        ...mockState,
        selectedEntities: ['account'],
        entityPositions: { account: { x: 0, y: 0, vx: 0, vy: 0 } },
      };

      expect(isURLSafe(smallState)).toBe(true);
    });

    it('should return true for typical states (2-10 entities)', () => {
      // Typical use case - few entities selected
      expect(isURLSafe(mockState)).toBe(true);
    });

    it('should return false for very large states', () => {
      // Create a state with many entities (>100) to exceed 2000 char limit
      const entities: string[] = [];
      const positions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};

      for (let i = 0; i < 150; i++) {
        const entityName = `very_long_entity_name_with_prefix_${i}`;
        entities.push(entityName);
        positions[entityName] = { x: i * 100, y: i * 100, vx: 0, vy: 0 };
      }

      const largeState = {
        ...mockState,
        selectedEntities: entities,
        entityPositions: positions,
      };

      expect(isURLSafe(largeState)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for malformed state in encoding', () => {
      const malformedState = {
        ...mockState,
        entityPositions: null,
      };

      expect(() => encodeStateToURL(malformedState as any)).toThrow();
    });

    it('should return error for missing required fields in decode', () => {
      // Test with a string that will fail decompression/validation
      const result = decodeStateFromURL(
        'N4IgLgngDgpiBcIDGBXKAuKBnAzhABAMYAWAFgDYYAOcMAdnIWJgJ4C2AlgPY0BM'
      );

      // Should fail due to invalid structure
      expect(result.success).toBe(false);
    });
  });

  describe('Compression Effectiveness', () => {
    it('should compress state significantly', () => {
      const json = JSON.stringify({
        e: mockState.selectedEntities,
        p: mockState.entityPositions,
        z: mockState.zoom,
        pn: mockState.pan,
        l: mockState.layoutMode,
        f: {
          s: mockState.searchQuery,
          pub: mockState.publisherFilter,
          sol: mockState.solutionFilter,
        },
        d: mockState.isDarkMode,
        v: '1.0.0',
      });

      const encoded = encodeStateToURL(mockState);

      // Compressed string should be shorter than original JSON
      expect(encoded.length).toBeLessThan(json.length);
    });
  });

  describe('getShareBaseUrl', () => {
    afterEach(() => {
      Object.defineProperty(window, 'parent', {
        value: window,
        writable: true,
        configurable: true,
      });
    });

    it('should return current window URL when not in iframe', () => {
      Object.defineProperty(window, 'parent', {
        value: window,
        writable: true,
        configurable: true,
      });

      const result = getShareBaseUrl();
      expect(result).toContain(window.location.origin);
    });

    it('should use parent URL when in an iframe (same-origin)', () => {
      const mockParent = {
        location: {
          href: 'https://org.crm.dynamics.com/main.aspx?appid=abc123&pagetype=webresource&webresourceName=adc_erd.html',
        },
      };

      Object.defineProperty(window, 'parent', {
        value: mockParent,
        writable: true,
        configurable: true,
      });

      const result = getShareBaseUrl();
      expect(result).toBe(
        'https://org.crm.dynamics.com/main.aspx?appid=abc123&pagetype=webresource&webresourceName=adc_erd.html'
      );
    });

    it('should strip hash from parent URL', () => {
      const mockParent = {
        location: {
          href: 'https://org.crm.dynamics.com/main.aspx?appid=abc123#existingHash',
        },
      };

      Object.defineProperty(window, 'parent', {
        value: mockParent,
        writable: true,
        configurable: true,
      });

      const result = getShareBaseUrl();
      expect(result).toBe('https://org.crm.dynamics.com/main.aspx?appid=abc123');
      expect(result).not.toContain('#');
    });

    it('should fall back to current window when cross-origin parent access throws', () => {
      const throwingParent = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === 'location') throw new DOMException('Blocked by CORS');
            return undefined;
          },
        }
      );

      Object.defineProperty(window, 'parent', {
        value: throwingParent,
        writable: true,
        configurable: true,
      });

      const result = getShareBaseUrl();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('getStateHash', () => {
    afterEach(() => {
      Object.defineProperty(window, 'parent', {
        value: window,
        writable: true,
        configurable: true,
      });
    });

    it('should return empty string when no hash is present', () => {
      // jsdom default has empty hash
      Object.defineProperty(window, 'parent', {
        value: window,
        writable: true,
        configurable: true,
      });

      const result = getStateHash();
      expect(result).toBe('');
    });

    it('should check parent hash when current window has no hash (iframe scenario)', () => {
      const mockParent = {
        location: {
          hash: '#parentEncodedState',
        },
      };

      Object.defineProperty(window, 'parent', {
        value: mockParent,
        writable: true,
        configurable: true,
      });

      const result = getStateHash();
      expect(result).toBe('parentEncodedState');
    });

    it('should return empty string when cross-origin parent access throws', () => {
      const throwingParent = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === 'location') throw new DOMException('Blocked by CORS');
            return undefined;
          },
        }
      );

      Object.defineProperty(window, 'parent', {
        value: throwingParent,
        writable: true,
        configurable: true,
      });

      const result = getStateHash();
      expect(result).toBe('');
    });
  });
});
