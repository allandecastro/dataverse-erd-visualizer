/**
 * Tests for Edge Marker Utilities
 * CRITICAL: Tests marker ID generation, stroke patterns, and color determination
 */

import {
  getCardinalityEnd,
  getMarkerIdForNotation,
  getMarkerColorSuffix,
  getStrokeDashArray,
  getEdgeColor,
} from '../edgeMarkers';
import type { EntityRelationship } from '@/types';

describe('edgeMarkers', () => {
  describe('getCardinalityEnd', () => {
    it('should return correct cardinality for 1:N relationships (source side)', () => {
      expect(getCardinalityEnd('1:N', true, false)).toBe('one');
      expect(getCardinalityEnd('1:N', true, true)).toBe('one-optional');
    });

    it('should return correct cardinality for 1:N relationships (target side)', () => {
      expect(getCardinalityEnd('1:N', false, false)).toBe('many');
      expect(getCardinalityEnd('1:N', false, true)).toBe('many-optional');
    });

    it('should return correct cardinality for N:1 relationships (source side)', () => {
      expect(getCardinalityEnd('N:1', true, false)).toBe('many');
      expect(getCardinalityEnd('N:1', true, true)).toBe('many-optional');
    });

    it('should return correct cardinality for N:1 relationships (target side)', () => {
      expect(getCardinalityEnd('N:1', false, false)).toBe('one');
      expect(getCardinalityEnd('N:1', false, true)).toBe('one-optional');
    });

    it('should return many for N:N relationships (both sides)', () => {
      expect(getCardinalityEnd('N:N', true, false)).toBe('many');
      expect(getCardinalityEnd('N:N', false, false)).toBe('many');
      expect(getCardinalityEnd('N:N', true, true)).toBe('many-optional');
      expect(getCardinalityEnd('N:N', false, true)).toBe('many-optional');
    });
  });

  describe('getMarkerColorSuffix', () => {
    const mockRel1N: EntityRelationship = {
      schemaName: 'test_rel_1N',
      from: 'entity1',
      to: 'entity2',
      type: '1:N',
      relationshipType: 'OneToManyRelationship',
    };

    const mockRelN1: EntityRelationship = {
      schemaName: 'test_rel_N1',
      from: 'entity1',
      to: 'entity2',
      type: 'N:1',
      relationshipType: 'OneToManyRelationship',
    };

    const mockRelNN: EntityRelationship = {
      schemaName: 'test_rel_NN',
      from: 'entity1',
      to: 'entity2',
      type: 'N:N',
      relationshipType: 'ManyToManyRelationship',
    };

    it('should return "lookup" when useTypeColors is false', () => {
      expect(getMarkerColorSuffix(mockRel1N, false)).toBe('lookup');
      expect(getMarkerColorSuffix(mockRelN1, false)).toBe('lookup');
      expect(getMarkerColorSuffix(mockRelNN, false)).toBe('lookup');
    });

    it('should return "onetomany" for 1:N when useTypeColors is true', () => {
      expect(getMarkerColorSuffix(mockRel1N, true)).toBe('onetomany');
    });

    it('should return "onetomany" for N:1 when useTypeColors is true (same as 1:N)', () => {
      // 1:N and N:1 are the same relationship from different perspectives, so use same color
      expect(getMarkerColorSuffix(mockRelN1, true)).toBe('onetomany');
    });

    it('should return "manytomany" for N:N when useTypeColors is true', () => {
      expect(getMarkerColorSuffix(mockRelNN, true)).toBe('manytomany');
    });
  });

  describe('getMarkerIdForNotation', () => {
    const mockRel1N: EntityRelationship = {
      schemaName: 'test_rel_1N',
      from: 'entity1',
      to: 'entity2',
      type: '1:N',
      relationshipType: 'OneToManyRelationship',
    };

    const mockRelN1: EntityRelationship = {
      schemaName: 'test_rel_N1',
      from: 'entity1',
      to: 'entity2',
      type: 'N:1',
      relationshipType: 'OneToManyRelationship',
    };

    const mockRelNN: EntityRelationship = {
      schemaName: 'test_rel_NN',
      from: 'entity1',
      to: 'entity2',
      type: 'N:N',
      relationshipType: 'ManyToManyRelationship',
    };

    it('should return arrow-closed for simple notation', () => {
      expect(getMarkerIdForNotation('simple', mockRel1N, false)).toBe('arrow-closed');
      expect(getMarkerIdForNotation('simple', mockRelN1, false)).toBe('arrow-closed');
      expect(getMarkerIdForNotation('simple', mockRelNN, false)).toBe('arrow-closed');
    });

    it('should return crowsfoot markers with lookup suffix by default', () => {
      expect(getMarkerIdForNotation('crowsfoot', mockRel1N, true)).toBe('crowsfoot-one-lookup');
      expect(getMarkerIdForNotation('crowsfoot', mockRel1N, false)).toBe('crowsfoot-many-lookup');
    });

    it('should return crowsfoot markers with type-specific color suffix when enabled', () => {
      expect(getMarkerIdForNotation('crowsfoot', mockRel1N, true, true)).toBe(
        'crowsfoot-one-onetomany'
      );
      expect(getMarkerIdForNotation('crowsfoot', mockRel1N, false, true)).toBe(
        'crowsfoot-many-onetomany'
      );
      // N:1 also uses 'onetomany' suffix (same color as 1:N from different perspective)
      expect(getMarkerIdForNotation('crowsfoot', mockRelN1, true, true)).toBe(
        'crowsfoot-many-onetomany'
      );
      expect(getMarkerIdForNotation('crowsfoot', mockRelNN, false, true)).toBe(
        'crowsfoot-many-manytomany'
      );
    });

    it('should return UML markers with lookup suffix by default', () => {
      expect(getMarkerIdForNotation('uml', mockRelNN, false)).toBe('uml-aggregation-lookup');
      expect(getMarkerIdForNotation('uml', mockRel1N, true)).toBe('uml-association-lookup');
      expect(getMarkerIdForNotation('uml', mockRel1N, false)).toBe('uml-composition-lookup');
    });

    it('should return UML markers with type-specific color suffix when enabled', () => {
      expect(getMarkerIdForNotation('uml', mockRelNN, false, true)).toBe(
        'uml-aggregation-manytomany'
      );
      expect(getMarkerIdForNotation('uml', mockRel1N, true, true)).toBe(
        'uml-association-onetomany'
      );
      expect(getMarkerIdForNotation('uml', mockRel1N, false, true)).toBe(
        'uml-composition-onetomany'
      );
      // N:1 also uses 'onetomany' suffix (same color as 1:N from different perspective)
      expect(getMarkerIdForNotation('uml', mockRelN1, false, true)).toBe(
        'uml-composition-onetomany'
      );
    });
  });

  describe('getStrokeDashArray', () => {
    it('should return empty string for solid', () => {
      expect(getStrokeDashArray('solid')).toBe('');
    });

    it('should return dash pattern for dashed', () => {
      expect(getStrokeDashArray('dashed')).toBe('8,4');
    });

    it('should return dot pattern for dotted', () => {
      expect(getStrokeDashArray('dotted')).toBe('2,3');
    });
  });

  describe('getEdgeColor', () => {
    const mockRel1N: EntityRelationship = {
      schemaName: 'test_rel',
      from: 'entity1',
      to: 'entity2',
      type: '1:N',
      relationshipType: 'OneToManyRelationship',
    };

    const mockRelN1: EntityRelationship = {
      schemaName: 'test_rel',
      from: 'entity1',
      to: 'entity2',
      type: 'N:1',
      relationshipType: 'OneToManyRelationship',
    };

    const mockRelNN: EntityRelationship = {
      schemaName: 'test_rel',
      from: 'entity1',
      to: 'entity2',
      type: 'N:N',
      relationshipType: 'ManyToManyRelationship',
    };

    it('should return default color when useTypeColors is false', () => {
      const color = getEdgeColor(mockRel1N, false, '#f97316', {});
      expect(color).toBe('#f97316');
    });

    it('should return default color when useTypeColors is true but no type color provided', () => {
      const color = getEdgeColor(mockRel1N, true, '#f97316', {});
      expect(color).toBe('#f97316');
    });

    it('should return type-specific color for 1:N when useTypeColors is true', () => {
      const color = getEdgeColor(mockRel1N, true, '#f97316', {
        oneToMany: '#ff0000',
        manyToOne: '#00ff00',
        manyToMany: '#0000ff',
      });
      expect(color).toBe('#ff0000');
    });

    it('should return type-specific color for N:1 when useTypeColors is true', () => {
      const color = getEdgeColor(mockRelN1, true, '#f97316', {
        oneToMany: '#ff0000',
        manyToOne: '#00ff00',
        manyToMany: '#0000ff',
      });
      // N:1 and 1:N are the same relationship from different perspectives,
      // so they should use the same color (oneToMany)
      expect(color).toBe('#ff0000');
    });

    it('should return type-specific color for N:N when useTypeColors is true', () => {
      const color = getEdgeColor(mockRelNN, true, '#f97316', {
        oneToMany: '#ff0000',
        manyToOne: '#00ff00',
        manyToMany: '#0000ff',
      });
      expect(color).toBe('#0000ff');
    });

    it('should fallback to default if specific type color is undefined', () => {
      const color = getEdgeColor(mockRel1N, true, '#f97316', {
        manyToOne: '#00ff00',
      });
      expect(color).toBe('#f97316');
    });
  });
});
