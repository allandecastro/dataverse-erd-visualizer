/**
 * Tests for EdgeMarkerDefinitions Component
 * CRITICAL: Tests SVG marker rendering for crow's foot and UML notations
 */

import { render } from '@testing-library/react';
import { EdgeMarkerDefinitions } from '../EdgeMarkerDefinitions';

describe('EdgeMarkerDefinitions', () => {
  const defaultColors = {
    lookup: '#f97316',
    oneToMany: '#ff0000',
    manyToOne: '#00ff00',
    manyToMany: '#0000ff',
  };

  it('should render nothing for simple notation', () => {
    const { container } = render(
      <EdgeMarkerDefinitions notation="simple" colors={defaultColors} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render SVG element for crowsfoot notation', () => {
    const { container } = render(
      <EdgeMarkerDefinitions notation="crowsfoot" colors={defaultColors} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.style.position).toBe('absolute');
    expect(svg?.style.width).toBe('0px');
    expect(svg?.style.height).toBe('0px');
  });

  it('should render defs element for crowsfoot notation', () => {
    const { container } = render(
      <EdgeMarkerDefinitions notation="crowsfoot" colors={defaultColors} />
    );
    const defs = container.querySelector('svg defs');
    expect(defs).toBeTruthy();
  });

  it('should render crowsfoot markers with color suffixes', () => {
    const { container } = render(
      <EdgeMarkerDefinitions notation="crowsfoot" colors={defaultColors} />
    );

    // Should render markers for all color suffixes (lookup, onetomany, manytomany)
    const markerOneLookup = container.querySelector('marker#crowsfoot-one-lookup');
    const markerManyLookup = container.querySelector('marker#crowsfoot-many-lookup');
    const markerOneOptionalLookup = container.querySelector('marker#crowsfoot-one-optional-lookup');
    const markerManyOptionalLookup = container.querySelector(
      'marker#crowsfoot-many-optional-lookup'
    );

    expect(markerOneLookup).toBeTruthy();
    expect(markerManyLookup).toBeTruthy();
    expect(markerOneOptionalLookup).toBeTruthy();
    expect(markerManyOptionalLookup).toBeTruthy();

    // Should also have onetomany suffix markers
    const markerOneToMany = container.querySelector('marker#crowsfoot-many-onetomany');
    expect(markerOneToMany).toBeTruthy();
  });

  it('should render SVG element for UML notation', () => {
    const { container } = render(<EdgeMarkerDefinitions notation="uml" colors={defaultColors} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should render UML markers with color suffixes', () => {
    const { container } = render(<EdgeMarkerDefinitions notation="uml" colors={defaultColors} />);

    // Should render markers for all color suffixes (lookup, onetomany, manytomany)
    const markerCompositionLookup = container.querySelector('marker#uml-composition-lookup');
    const markerAggregationLookup = container.querySelector('marker#uml-aggregation-lookup');
    const markerAssociationLookup = container.querySelector('marker#uml-association-lookup');

    expect(markerCompositionLookup).toBeTruthy();
    expect(markerAggregationLookup).toBeTruthy();
    expect(markerAssociationLookup).toBeTruthy();

    // Should also have manytomany suffix markers
    const markerManyToMany = container.querySelector('marker#uml-aggregation-manytomany');
    expect(markerManyToMany).toBeTruthy();
  });

  it('should apply marker color to crowsfoot markers', () => {
    const testColor = '#123456';
    const { container } = render(
      <EdgeMarkerDefinitions
        notation="crowsfoot"
        colors={{ ...defaultColors, lookup: testColor }}
      />
    );

    const marker = container.querySelector('marker#crowsfoot-many-lookup path');
    expect(marker?.getAttribute('stroke')).toBe(testColor);
  });

  it('should apply marker color to UML markers', () => {
    const testColor = '#abcdef';
    const { container } = render(
      <EdgeMarkerDefinitions notation="uml" colors={{ ...defaultColors, lookup: testColor }} />
    );

    const marker = container.querySelector('marker#uml-composition-lookup path');
    expect(marker?.getAttribute('fill')).toBe(testColor);
  });

  it('should not render crowsfoot markers for UML notation', () => {
    const { container } = render(<EdgeMarkerDefinitions notation="uml" colors={defaultColors} />);

    const crowsfootMarker = container.querySelector('marker[id^="crowsfoot-"]');
    expect(crowsfootMarker).toBeNull();
  });

  it('should not render UML markers for crowsfoot notation', () => {
    const { container } = render(
      <EdgeMarkerDefinitions notation="crowsfoot" colors={defaultColors} />
    );

    const umlMarker = container.querySelector('marker[id^="uml-"]');
    expect(umlMarker).toBeNull();
  });
});
