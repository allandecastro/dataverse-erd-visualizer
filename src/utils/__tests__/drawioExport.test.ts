/**
 * Tests for Draw.io Export
 * CRITICAL: Security tests for XML injection prevention
 * Validates XML generation and entity export functionality
 */

import { exportToDrawio, downloadDrawio, type DrawioExportOptions } from '../drawioExport';

// Helper to read blob content in test environment
async function blobToText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') {
    return blobToText(blob);
  }
  // Fallback for environments where Blob.text() is not available
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('drawioExport', () => {
  const mockEntities = [
    {
      logicalName: 'account',
      displayName: 'Account',
      attributes: [
        {
          name: 'accountid',
          displayName: 'Account ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
        { name: 'name', displayName: 'Account Name', type: 'String', isPrimaryKey: false },
      ],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
    {
      logicalName: 'contact',
      displayName: 'Contact',
      attributes: [
        {
          name: 'contactid',
          displayName: 'Contact ID',
          type: 'UniqueIdentifier',
          isPrimaryKey: true,
        },
        { name: 'fullname', displayName: 'Full Name', type: 'String', isPrimaryKey: false },
      ],
      publisher: 'Microsoft',
      alternateKeys: [],
    },
  ];

  const mockRelationships = [
    {
      from: 'contact',
      to: 'account',
      type: 'N:1' as const,
      schemaName: 'contact_account',
      referencingAttribute: 'parentcustomerid',
      referencedAttribute: 'accountid',
    },
  ];

  const mockPositions = {
    account: { x: 100, y: 100 },
    contact: { x: 300, y: 100 },
  };

  const mockSelectedFields = {
    account: new Set(['accountid', 'name']),
    contact: new Set(['contactid', 'fullname']),
  };

  const mockColorSettings = {
    customTableColor: '#f0f9ff',
    standardTableColor: '#ffffff',
    lookupColor: '#fee2e2',
    edgeStyle: 'smoothstep' as const,
  };

  const baseOptions: DrawioExportOptions = {
    entities: mockEntities,
    relationships: mockRelationships,
    entityPositions: mockPositions,
    selectedFields: mockSelectedFields,
    collapsedEntities: new Set(),
    colorSettings: mockColorSettings,
  };

  describe('exportToDrawio', () => {
    it('should generate valid Draw.io XML blob', async () => {
      const blob = await exportToDrawio(baseOptions);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/xml');

      const text = await blobToText(blob);
      expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(text).toContain('<mxGraphModel');
      expect(text).toContain('</mxGraphModel>');
    });

    it('should include all selected entities', async () => {
      const blob = await exportToDrawio(baseOptions);
      const text = await blobToText(blob);

      expect(text).toContain('account');
      expect(text).toContain('contact');
      expect(text).toContain('Account'); // Display name
      expect(text).toContain('Contact'); // Display name
    });

    it('should include relationships between entities', async () => {
      const blob = await exportToDrawio(baseOptions);
      const text = await blobToText(blob);

      expect(text).toContain('contact_account'); // Relationship schema name
      expect(text).toContain('N:1'); // Cardinality
    });

    it('should call progress callback during export', async () => {
      const progressCalls: Array<{ progress: number; message: string }> = [];

      await exportToDrawio({
        ...baseOptions,
        onProgress: (progress, message) => {
          progressCalls.push({ progress, message });
        },
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1].progress).toBe(100);
    });

    it('should handle collapsed entities', async () => {
      const optionsWithCollapsed: DrawioExportOptions = {
        ...baseOptions,
        collapsedEntities: new Set(['account']),
      };

      const blob = await exportToDrawio(optionsWithCollapsed);
      const text = await blobToText(blob);

      // Should still include the entity
      expect(text).toContain('account');
    });

    it('should handle entities with alternate keys', async () => {
      const entitiesWithAK = [
        {
          ...mockEntities[0],
          alternateKeys: [
            {
              logicalName: 'ak_accountnumber',
              displayName: 'Account Number',
              keyAttributes: ['accountnumber'],
            },
          ],
        },
        mockEntities[1],
      ];

      const blob = await exportToDrawio({
        ...baseOptions,
        entities: entitiesWithAK,
      });

      const text = await blobToText(blob);
      expect(text).toContain('Account Number');
      expect(text).toContain('ALTERNATE KEYS');
    });

    it('should escape XML special characters in entity names', async () => {
      const entitiesWithSpecialChars = [
        {
          logicalName: 'test_entity',
          displayName: 'Test & <Entity>',
          attributes: [],
          publisher: 'Test',
          alternateKeys: [],
        },
      ];

      const blob = await exportToDrawio({
        ...baseOptions,
        entities: entitiesWithSpecialChars,
        entityPositions: { test_entity: { x: 0, y: 0 } },
        selectedFields: { test_entity: new Set() },
      });

      const text = await blobToText(blob);

      // Should NOT contain unescaped special characters
      expect(text).not.toMatch(/<Entity>/);
      expect(text).not.toMatch(/Test & /);

      // Should contain escaped versions
      expect(text).toContain('&amp;');
      expect(text).toContain('&lt;');
      expect(text).toContain('&gt;');
    });

    it('should handle quotes in entity names', async () => {
      const entitiesWithQuotes = [
        {
          logicalName: 'test',
          displayName: 'Test "Entity" Name',
          attributes: [],
          publisher: 'Test',
          alternateKeys: [],
        },
      ];

      const blob = await exportToDrawio({
        ...baseOptions,
        entities: entitiesWithQuotes,
        entityPositions: { test: { x: 0, y: 0 } },
        selectedFields: { test: new Set() },
      });

      const text = await blobToText(blob);

      // Should contain escaped quotes
      expect(text).toContain('&quot;');
    });

    it('should prevent XML injection attacks', async () => {
      const maliciousEntity = [
        {
          logicalName: 'malicious',
          displayName: '</mxCell><mxCell id="evil" value="INJECTED"/>',
          attributes: [],
          publisher: 'Test',
          alternateKeys: [],
        },
      ];

      const blob = await exportToDrawio({
        ...baseOptions,
        entities: maliciousEntity,
        entityPositions: { malicious: { x: 0, y: 0 } },
        selectedFields: { malicious: new Set() },
      });

      const text = await blobToText(blob);

      // Should NOT contain unescaped closing tags
      expect(text).not.toContain('</mxCell><mxCell id="evil"');

      // Should be escaped
      expect(text).toContain('&lt;/mxCell&gt;');
    });

    it('should handle empty entities list', async () => {
      const blob = await exportToDrawio({
        ...baseOptions,
        entities: [],
      });

      const text = await blobToText(blob);
      expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(text).toContain('<mxGraphModel');
    });

    it('should handle single entity', async () => {
      const blob = await exportToDrawio({
        ...baseOptions,
        entities: [mockEntities[0]],
        entityPositions: { account: { x: 100, y: 100 } },
        selectedFields: { account: new Set(['accountid']) },
      });

      const text = await blobToText(blob);
      expect(text).toContain('account');
      expect(text).toContain('Account');
    });

    it('should position entities at correct coordinates', async () => {
      const specificPositions = {
        account: { x: 200, y: 300 },
        contact: { x: 500, y: 600 },
      };

      const blob = await exportToDrawio({
        ...baseOptions,
        entityPositions: specificPositions,
      });

      const text = await blobToText(blob);

      // Coordinates should be present in geometry tags
      expect(text).toContain('x="200"');
      expect(text).toContain('y="300"');
      expect(text).toContain('x="500"');
      expect(text).toContain('y="600"');
    });
  });

  describe('downloadDrawio', () => {
    it('should create download link and trigger download', () => {
      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const mockBlob = new Blob(['test'], { type: 'application/xml' });

      downloadDrawio(mockBlob, 'test.drawio');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.download).toBe('test.drawio');
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      // Cleanup
      createElementSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should use default filename if not provided', () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const mockBlob = new Blob(['test'], { type: 'application/xml' });

      downloadDrawio(mockBlob);

      expect(mockLink.download).toBe('dataverse-erd.drawio');

      // Cleanup
      createElementSpy.mockRestore();
    });
  });

  describe('XML Structure Validation', () => {
    it('should generate well-formed XML', async () => {
      const blob = await exportToDrawio(baseOptions);
      const text = await blobToText(blob);

      // Check for required XML structure
      expect(text).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(text).toContain('<mxfile');
      expect(text).toContain('</mxfile>');
      expect(text).toContain('<diagram');
      expect(text).toContain('</diagram>');
      expect(text).toContain('<mxGraphModel');
      expect(text).toContain('</mxGraphModel>');
      expect(text).toContain('<root>');
      expect(text).toContain('</root>');
    });

    it('should include required base cells (id 0 and 1)', async () => {
      const blob = await exportToDrawio(baseOptions);
      const text = await blobToText(blob);

      // Draw.io requires cells with id="0" and id="1"
      expect(text).toContain('id="0"');
      expect(text).toContain('id="1"');
    });
  });

  describe('Field Display', () => {
    it('should include selected fields in entity', async () => {
      const blob = await exportToDrawio(baseOptions);
      const text = await blobToText(blob);

      expect(text).toContain('Account ID');
      expect(text).toContain('Account Name');
      expect(text).toContain('Contact ID');
      expect(text).toContain('Full Name');
    });

    it('should handle entities with no selected fields', async () => {
      const blob = await exportToDrawio({
        ...baseOptions,
        selectedFields: {
          account: new Set(),
          contact: new Set(),
        },
      });

      const text = await blobToText(blob);

      // Should still include primary keys (display names)
      expect(text).toContain('Account ID');
      expect(text).toContain('Contact ID');
    });
  });

  describe('Performance', () => {
    it('should handle large diagrams (50+ entities)', async () => {
      const largeEntities = Array.from({ length: 50 }, (_, i) => ({
        logicalName: `entity_${i}`,
        displayName: `Entity ${i}`,
        attributes: [
          {
            name: `entity_${i}id`,
            displayName: `Entity ${i} ID`,
            type: 'UniqueIdentifier',
            isPrimaryKey: true,
          },
        ],
        publisher: 'Test',
        alternateKeys: [],
      }));

      const largePositions: Record<string, { x: number; y: number }> = {};
      const largeFields: Record<string, Set<string>> = {};

      largeEntities.forEach((e, i) => {
        largePositions[e.logicalName] = { x: i * 400, y: 100 };
        largeFields[e.logicalName] = new Set([`entity_${i}id`]);
      });

      const startTime = Date.now();

      const blob = await exportToDrawio({
        ...baseOptions,
        entities: largeEntities,
        entityPositions: largePositions,
        selectedFields: largeFields,
        relationships: [],
      });

      const endTime = Date.now();

      expect(blob).toBeInstanceOf(Blob);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });
});
