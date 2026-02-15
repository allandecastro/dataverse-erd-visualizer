/**
 * Tests for color settings validation utilities
 * Tests parseColorSettingValue, isValidHexColor, and LINE_THICKNESS constants
 */

import {
  parseColorSettingValue,
  isValidHexColor,
  LINE_THICKNESS_MIN,
  LINE_THICKNESS_MAX,
  LINE_THICKNESS_DEFAULT,
} from '@/types/erdTypes';

describe('parseColorSettingValue', () => {
  describe('lineThickness', () => {
    it('should parse valid numeric strings', () => {
      expect(parseColorSettingValue('lineThickness', '2')).toBe(2);
      expect(parseColorSettingValue('lineThickness', '1.5')).toBe(1.5);
      expect(parseColorSettingValue('lineThickness', '3.75')).toBe(3.75);
    });

    it('should clamp values below minimum', () => {
      expect(parseColorSettingValue('lineThickness', '0')).toBe(LINE_THICKNESS_MIN);
      expect(parseColorSettingValue('lineThickness', '-1')).toBe(LINE_THICKNESS_MIN);
      expect(parseColorSettingValue('lineThickness', '0.1')).toBe(LINE_THICKNESS_MIN);
    });

    it('should clamp values above maximum', () => {
      expect(parseColorSettingValue('lineThickness', '10')).toBe(LINE_THICKNESS_MAX);
      expect(parseColorSettingValue('lineThickness', '100')).toBe(LINE_THICKNESS_MAX);
      expect(parseColorSettingValue('lineThickness', '5.1')).toBe(LINE_THICKNESS_MAX);
    });

    it('should return default for NaN input', () => {
      expect(parseColorSettingValue('lineThickness', 'abc')).toBe(LINE_THICKNESS_DEFAULT);
      expect(parseColorSettingValue('lineThickness', '')).toBe(LINE_THICKNESS_DEFAULT);
      expect(parseColorSettingValue('lineThickness', 'NaN')).toBe(LINE_THICKNESS_DEFAULT);
    });

    it('should accept boundary values', () => {
      expect(parseColorSettingValue('lineThickness', String(LINE_THICKNESS_MIN))).toBe(
        LINE_THICKNESS_MIN
      );
      expect(parseColorSettingValue('lineThickness', String(LINE_THICKNESS_MAX))).toBe(
        LINE_THICKNESS_MAX
      );
    });
  });

  describe('useRelationshipTypeColors', () => {
    it('should return true for "true" string', () => {
      expect(parseColorSettingValue('useRelationshipTypeColors', 'true')).toBe(true);
    });

    it('should return false for any other string', () => {
      expect(parseColorSettingValue('useRelationshipTypeColors', 'false')).toBe(false);
      expect(parseColorSettingValue('useRelationshipTypeColors', '')).toBe(false);
      expect(parseColorSettingValue('useRelationshipTypeColors', 'yes')).toBe(false);
      expect(parseColorSettingValue('useRelationshipTypeColors', '1')).toBe(false);
    });
  });

  describe('string fields', () => {
    it('should pass through color values unchanged', () => {
      expect(parseColorSettingValue('customTableColor', '#ff0000')).toBe('#ff0000');
      expect(parseColorSettingValue('standardTableColor', '#64748b')).toBe('#64748b');
      expect(parseColorSettingValue('lookupColor', '#f97316')).toBe('#f97316');
    });

    it('should pass through enum values unchanged', () => {
      expect(parseColorSettingValue('edgeStyle', 'smoothstep')).toBe('smoothstep');
      expect(parseColorSettingValue('lineNotation', 'crowsfoot')).toBe('crowsfoot');
      expect(parseColorSettingValue('lineStroke', 'dashed')).toBe('dashed');
    });

    it('should pass through optional color values', () => {
      expect(parseColorSettingValue('oneToManyColor', '#f97316')).toBe('#f97316');
      expect(parseColorSettingValue('manyToOneColor', '#06b6d4')).toBe('#06b6d4');
      expect(parseColorSettingValue('manyToManyColor', '#8b5cf6')).toBe('#8b5cf6');
    });
  });
});

describe('isValidHexColor', () => {
  it('should accept 6-digit hex colors', () => {
    expect(isValidHexColor('#ff0000')).toBe(true);
    expect(isValidHexColor('#00FF00')).toBe(true);
    expect(isValidHexColor('#0ea5e9')).toBe(true);
    expect(isValidHexColor('#64748b')).toBe(true);
  });

  it('should accept 3-digit hex colors', () => {
    expect(isValidHexColor('#f00')).toBe(true);
    expect(isValidHexColor('#0F0')).toBe(true);
    expect(isValidHexColor('#abc')).toBe(true);
  });

  it('should accept 8-digit hex colors (with alpha)', () => {
    expect(isValidHexColor('#ff000080')).toBe(true);
    expect(isValidHexColor('#00FF00FF')).toBe(true);
  });

  it('should accept 4-digit hex colors (with alpha)', () => {
    expect(isValidHexColor('#f008')).toBe(true);
    expect(isValidHexColor('#0F0F')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidHexColor('')).toBe(false);
    expect(isValidHexColor('red')).toBe(false);
    expect(isValidHexColor('ff0000')).toBe(false); // missing #
    expect(isValidHexColor('#gg0000')).toBe(false); // invalid chars
    expect(isValidHexColor('#ff00000')).toBe(false); // wrong length (7 hex digits)
    expect(isValidHexColor('#ff0000000')).toBe(false); // too long
    expect(isValidHexColor('rgb(255,0,0)')).toBe(false);
  });
});

describe('LINE_THICKNESS constants', () => {
  it('should have valid min/max range', () => {
    expect(LINE_THICKNESS_MIN).toBeLessThan(LINE_THICKNESS_MAX);
    expect(LINE_THICKNESS_MIN).toBeGreaterThan(0);
  });

  it('should have default within range', () => {
    expect(LINE_THICKNESS_DEFAULT).toBeGreaterThanOrEqual(LINE_THICKNESS_MIN);
    expect(LINE_THICKNESS_DEFAULT).toBeLessThanOrEqual(LINE_THICKNESS_MAX);
  });
});
