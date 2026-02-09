/**
 * Tests for Dataverse API Service
 * CRITICAL: Tests API initialization, entity metadata retrieval, and relationship extraction
 */

import { dataverseApi } from '../dataverseApi';
import type { EntityMetadataResult } from '@/types';

describe('DataverseApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the global fetch mock
    (globalThis as any).fetch = vi.fn();
  });

  describe('Initialization', () => {
    it('should initialize with Xrm context when available', () => {
      const mockXrm = {
        Utility: {
          getGlobalContext: () => ({
            getClientUrl: () => 'https://org.crm.dynamics.com',
          }),
        },
      };

      Object.defineProperty(window, 'Xrm', {
        value: mockXrm,
        writable: true,
        configurable: true,
      });

      dataverseApi.initialize();

      // Verify base URL was set (we can test this via isInDataverseContext)
      expect(dataverseApi.isInDataverseContext()).toBe(true);

      // Cleanup
      delete (window as any).Xrm;
    });

    it('should fallback to window origin when Xrm not available', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
        configurable: true,
      });

      dataverseApi.initialize();

      // Should not throw and should use fallback
      expect(dataverseApi.isInDataverseContext()).toBe(false);
    });
  });

  describe('isInDataverseContext', () => {
    it('should return true when Xrm is available', () => {
      const mockXrm = {
        Utility: {
          getGlobalContext: () => ({
            getClientUrl: () => 'https://org.crm.dynamics.com',
          }),
        },
      };

      Object.defineProperty(window, 'Xrm', {
        value: mockXrm,
        writable: true,
        configurable: true,
      });

      expect(dataverseApi.isInDataverseContext()).toBe(true);

      // Cleanup
      delete (window as any).Xrm;
    });

    it('should return false when Xrm is not available', () => {
      delete (window as any).Xrm;
      expect(dataverseApi.isInDataverseContext()).toBe(false);
    });
  });

  describe('fetchEntityMetadata', () => {
    it('should fetch and transform entity metadata', async () => {
      // Mock the initial entity definitions response
      const mockEntityResponse = {
        value: [
          {
            MetadataId: 'meta1',
            LogicalName: 'account',
            DisplayName: { UserLocalizedLabel: { Label: 'Account' } },
            ObjectTypeCode: 1,
            IsCustomEntity: false,
            PrimaryIdAttribute: 'accountid',
            PrimaryNameAttribute: 'name',
            Keys: [],
            Attributes: [],
            OneToManyRelationships: [
              {
                SchemaName: 'account_contact',
                ReferencingEntity: 'contact',
                ReferencingAttribute: 'parentcustomerid',
                ReferencedEntity: 'account',
                ReferencedAttribute: 'accountid',
              },
            ],
            ManyToOneRelationships: [],
            ManyToManyRelationships: [],
          },
        ],
      };

      // Mock the attributes response for account entity
      const mockAttributesResponse = {
        value: [
          {
            LogicalName: 'accountid',
            AttributeType: 'Uniqueidentifier',
            DisplayName: { UserLocalizedLabel: { Label: 'Account ID' } },
            IsCustomAttribute: false,
          },
          {
            LogicalName: 'name',
            AttributeType: 'String',
            DisplayName: { UserLocalizedLabel: { Label: 'Name' } },
            IsCustomAttribute: false,
          },
        ],
      };

      // Mock solutions response
      const mockSolutionsResponse = {
        value: [],
      };

      // Mock solution components response
      const mockSolutionComponentsResponse = {
        value: [],
      };

      // Setup fetch mock to return different responses based on URL
      ((globalThis as any).fetch as any).mockImplementation((url: string) => {
        if (url.includes('EntityDefinitions?')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEntityResponse),
          });
        } else if (url.includes('Attributes?')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAttributesResponse),
          });
        } else if (url.includes('solutions?')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSolutionsResponse),
          });
        } else if (url.includes('solutioncomponents?')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSolutionComponentsResponse),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      dataverseApi.initialize();
      const result: EntityMetadataResult = await dataverseApi.fetchEntityMetadata();

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].logicalName).toBe('account');
      expect(result.entities[0].displayName).toBe('Account');
      expect(result.entities[0].attributes).toHaveLength(2);
      expect(result.entities[0].attributes[0].name).toBe('accountid');
      expect(result.entities[0].attributes[0].isPrimaryKey).toBe(true);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].schemaName).toBe('account_contact');
      expect(result.relationships[0].from).toBe('contact');
      expect(result.relationships[0].to).toBe('account');
      expect(result.relationships[0].type).toBe('N:1');
    });

    it('should handle pagination with @odata.nextLink', async () => {
      const mockPage1 = {
        value: [
          {
            MetadataId: 'meta1',
            LogicalName: 'account',
            DisplayName: { UserLocalizedLabel: { Label: 'Account' } },
            ObjectTypeCode: 1,
            IsCustomEntity: false,
            PrimaryIdAttribute: 'accountid',
            PrimaryNameAttribute: 'name',
            Keys: [],
            Attributes: [],
            OneToManyRelationships: [],
            ManyToOneRelationships: [],
            ManyToManyRelationships: [],
          },
        ],
        '@odata.nextLink': 'http://test.com/api/data/v9.2/EntityDefinitions?$skiptoken=page2',
      };

      const mockPage2 = {
        value: [
          {
            MetadataId: 'meta2',
            LogicalName: 'contact',
            DisplayName: { UserLocalizedLabel: { Label: 'Contact' } },
            ObjectTypeCode: 2,
            IsCustomEntity: false,
            PrimaryIdAttribute: 'contactid',
            PrimaryNameAttribute: 'fullname',
            Keys: [],
            Attributes: [],
            OneToManyRelationships: [],
            ManyToOneRelationships: [],
            ManyToManyRelationships: [],
          },
        ],
      };

      const mockAttributesResponse = {
        value: [
          {
            LogicalName: 'testid',
            AttributeType: 'Uniqueidentifier',
            DisplayName: { UserLocalizedLabel: { Label: 'ID' } },
          },
        ],
      };

      let callCount = 0;
      ((globalThis as any).fetch as any).mockImplementation((url: string) => {
        if (url.includes('EntityDefinitions?')) {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPage1) });
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPage2) });
        } else if (url.includes('Attributes?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAttributesResponse) });
        } else if (url.includes('solutions?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        } else if (url.includes('solutioncomponents?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      dataverseApi.initialize();
      const result = await dataverseApi.fetchEntityMetadata();

      expect(result.entities).toHaveLength(2);
      expect(result.entities[0].logicalName).toBe('account');
      expect(result.entities[1].logicalName).toBe('contact');
    });

    it('should call onProgress callback during fetch', async () => {
      const onProgress = vi.fn();

      const mockEntityResponse = {
        value: [
          {
            MetadataId: 'meta1',
            LogicalName: 'account',
            DisplayName: { UserLocalizedLabel: { Label: 'Account' } },
            ObjectTypeCode: 1,
            IsCustomEntity: false,
            PrimaryIdAttribute: 'accountid',
            PrimaryNameAttribute: 'name',
            Keys: [],
            Attributes: [],
            OneToManyRelationships: [],
            ManyToOneRelationships: [],
            ManyToManyRelationships: [],
          },
        ],
      };

      ((globalThis as any).fetch as any).mockImplementation((url: string) => {
        if (url.includes('EntityDefinitions?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEntityResponse) });
        } else if (url.includes('Attributes?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        } else if (url.includes('solutions?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        } else if (url.includes('solutioncomponents?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      dataverseApi.initialize();
      await dataverseApi.fetchEntityMetadata(onProgress);

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'fetching_entities' })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      ((globalThis as any).fetch as any).mockRejectedValue(new Error('Network error'));

      dataverseApi.initialize();

      await expect(dataverseApi.fetchEntityMetadata()).rejects.toThrow('Network error');
    });
  });

  describe('extractRelationshipsFromMetadata', () => {
    it('should extract N:1 relationships from OneToMany', () => {
      const mockMetadata = [
        {
          MetadataId: 'meta1',
          LogicalName: 'account',
          DisplayName: { UserLocalizedLabel: { Label: 'Account' } },
          ObjectTypeCode: 1,
          IsCustomEntity: false,
          PrimaryIdAttribute: 'accountid',
          PrimaryNameAttribute: 'name',
          Keys: [],
          Attributes: [],
          OneToManyRelationships: [
            {
              SchemaName: 'account_contact',
              ReferencingEntity: 'contact',
              ReferencingAttribute: 'parentcustomerid',
              ReferencedEntity: 'account',
              ReferencedAttribute: 'accountid',
            },
          ],
          ManyToOneRelationships: [],
          ManyToManyRelationships: [],
        },
      ];

      const relationships = dataverseApi.extractRelationshipsFromMetadata(mockMetadata);

      expect(relationships).toHaveLength(1);
      expect(relationships[0]).toEqual({
        schemaName: 'account_contact',
        from: 'contact',
        to: 'account',
        type: 'N:1',
        referencingAttribute: 'parentcustomerid',
        referencedAttribute: 'accountid',
        relationshipType: 'OneToManyRelationship',
      });
    });

    it('should extract N:N relationships from ManyToMany', () => {
      const mockMetadata = [
        {
          MetadataId: 'meta1',
          LogicalName: 'account',
          DisplayName: { UserLocalizedLabel: { Label: 'Account' } },
          ObjectTypeCode: 1,
          IsCustomEntity: false,
          PrimaryIdAttribute: 'accountid',
          PrimaryNameAttribute: 'name',
          Keys: [],
          Attributes: [],
          OneToManyRelationships: [],
          ManyToOneRelationships: [],
          ManyToManyRelationships: [
            {
              SchemaName: 'account_contact_nn',
              Entity1LogicalName: 'account',
              Entity2LogicalName: 'contact',
              IntersectEntityName: 'account_contact',
            },
          ],
        },
      ];

      const relationships = dataverseApi.extractRelationshipsFromMetadata(mockMetadata);

      expect(relationships).toHaveLength(1);
      expect(relationships[0]).toEqual({
        schemaName: 'account_contact_nn',
        from: 'account',
        to: 'contact',
        type: 'N:N',
        intersectEntityName: 'account_contact',
        relationshipType: 'ManyToManyRelationship',
      });
    });

    it('should deduplicate relationships', () => {
      const mockMetadata = [
        {
          MetadataId: 'meta1',
          LogicalName: 'account',
          DisplayName: { UserLocalizedLabel: { Label: 'Account' } },
          ObjectTypeCode: 1,
          IsCustomEntity: false,
          PrimaryIdAttribute: 'accountid',
          PrimaryNameAttribute: 'name',
          Keys: [],
          Attributes: [],
          OneToManyRelationships: [
            {
              SchemaName: 'account_contact',
              ReferencingEntity: 'contact',
              ReferencingAttribute: 'parentcustomerid',
              ReferencedEntity: 'account',
              ReferencedAttribute: 'accountid',
            },
          ],
          ManyToOneRelationships: [
            {
              SchemaName: 'account_contact',
              ReferencingEntity: 'contact',
              ReferencingAttribute: 'parentcustomerid',
              ReferencedEntity: 'account',
              ReferencedAttribute: 'accountid',
            },
          ],
          ManyToManyRelationships: [],
        },
      ];

      const relationships = dataverseApi.extractRelationshipsFromMetadata(mockMetadata);

      // Should only have 1 relationship (deduplicated)
      expect(relationships).toHaveLength(1);
    });
  });

  describe('fetchSolutions', () => {
    it('should fetch solutions from Dataverse', async () => {
      const mockSolutionsResponse = {
        value: [
          {
            solutionid: 'sol1',
            uniquename: 'CustomSolution',
            friendlyname: 'Custom Solution',
          },
          {
            solutionid: 'sol2',
            uniquename: 'AnotherSolution',
            friendlyname: 'Another Solution',
          },
        ],
      };

      ((globalThis as any).fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSolutionsResponse),
      });

      dataverseApi.initialize();
      const solutions = await dataverseApi.fetchSolutions();

      expect(solutions).toHaveLength(2);
      expect(solutions[0]).toEqual({
        solutionId: 'sol1',
        uniqueName: 'CustomSolution',
        friendlyName: 'Custom Solution',
      });
    });

    it('should return empty array on fetch error', async () => {
      ((globalThis as any).fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      dataverseApi.initialize();
      const solutions = await dataverseApi.fetchSolutions();

      expect(solutions).toEqual([]);
    });
  });

  describe('fetchEntitySolutionMappings', () => {
    it('should map entities to solutions', async () => {
      const mockSolutions = [
        { solutionId: 'sol1', uniqueName: 'CustomSolution', friendlyName: 'Custom Solution' },
      ];

      const mockSolutionComponentsResponse = {
        value: [
          {
            objectid: 'meta1',
            _solutionid_value: 'sol1',
          },
        ],
      };

      ((globalThis as any).fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSolutionComponentsResponse),
      });

      dataverseApi.initialize();
      const mappings = await dataverseApi.fetchEntitySolutionMappings(mockSolutions);

      expect(mappings['meta1']).toEqual(['CustomSolution']);
    });

    it('should handle multiple solutions per entity', async () => {
      const mockSolutions = [
        { solutionId: 'sol1', uniqueName: 'Solution1', friendlyName: 'Solution 1' },
        { solutionId: 'sol2', uniqueName: 'Solution2', friendlyName: 'Solution 2' },
      ];

      const mockSolutionComponentsResponse = {
        value: [
          { objectid: 'meta1', _solutionid_value: 'sol1' },
          { objectid: 'meta1', _solutionid_value: 'sol2' },
        ],
      };

      ((globalThis as any).fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSolutionComponentsResponse),
      });

      dataverseApi.initialize();
      const mappings = await dataverseApi.fetchEntitySolutionMappings(mockSolutions);

      expect(mappings['meta1']).toEqual(['Solution1', 'Solution2']);
    });

    it('should return empty map on fetch error', async () => {
      const mockSolutions = [
        { solutionId: 'sol1', uniqueName: 'CustomSolution', friendlyName: 'Custom Solution' },
      ];

      ((globalThis as any).fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      dataverseApi.initialize();
      const mappings = await dataverseApi.fetchEntitySolutionMappings(mockSolutions);

      expect(mappings).toEqual({});
    });
  });

  describe('Attribute Type Mapping', () => {
    it('should map common Dataverse types correctly', async () => {
      const mockEntityResponse = {
        value: [
          {
            MetadataId: 'meta1',
            LogicalName: 'test',
            DisplayName: { UserLocalizedLabel: { Label: 'Test' } },
            ObjectTypeCode: 10000,
            IsCustomEntity: true,
            PrimaryIdAttribute: 'testid',
            PrimaryNameAttribute: 'name',
            Keys: [],
            Attributes: [],
            OneToManyRelationships: [],
            ManyToOneRelationships: [],
            ManyToManyRelationships: [],
          },
        ],
      };

      const mockAttributesResponse = {
        value: [
          {
            LogicalName: 'testid',
            AttributeType: 'Uniqueidentifier',
            DisplayName: { UserLocalizedLabel: { Label: 'ID' } },
          },
          {
            LogicalName: 'name',
            AttributeType: 'String',
            DisplayName: { UserLocalizedLabel: { Label: 'Name' } },
          },
          {
            LogicalName: 'age',
            AttributeType: 'Integer',
            DisplayName: { UserLocalizedLabel: { Label: 'Age' } },
          },
          {
            LogicalName: 'amount',
            AttributeType: 'Money',
            DisplayName: { UserLocalizedLabel: { Label: 'Amount' } },
          },
          {
            LogicalName: 'created',
            AttributeType: 'DateTime',
            DisplayName: { UserLocalizedLabel: { Label: 'Created' } },
          },
          {
            LogicalName: 'active',
            AttributeType: 'Boolean',
            DisplayName: { UserLocalizedLabel: { Label: 'Active' } },
          },
        ],
      };

      ((globalThis as any).fetch as any).mockImplementation((url: string) => {
        if (url.includes('EntityDefinitions?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEntityResponse) });
        } else if (url.includes('Attributes?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAttributesResponse) });
        } else if (url.includes('solutions?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        } else if (url.includes('solutioncomponents?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      dataverseApi.initialize();
      const result = await dataverseApi.fetchEntityMetadata();

      const attributes = result.entities[0].attributes;
      expect(attributes.find((a) => a.name === 'testid')?.type).toBe('UniqueIdentifier');
      expect(attributes.find((a) => a.name === 'name')?.type).toBe('String');
      expect(attributes.find((a) => a.name === 'age')?.type).toBe('Integer');
      expect(attributes.find((a) => a.name === 'amount')?.type).toBe('Money');
      expect(attributes.find((a) => a.name === 'created')?.type).toBe('DateTime');
      expect(attributes.find((a) => a.name === 'active')?.type).toBe('Boolean');
    });

    it('should identify lookup attributes correctly', async () => {
      const mockEntityResponse = {
        value: [
          {
            MetadataId: 'meta1',
            LogicalName: 'contact',
            DisplayName: { UserLocalizedLabel: { Label: 'Contact' } },
            ObjectTypeCode: 2,
            IsCustomEntity: false,
            PrimaryIdAttribute: 'contactid',
            PrimaryNameAttribute: 'fullname',
            Keys: [],
            Attributes: [],
            OneToManyRelationships: [],
            ManyToOneRelationships: [],
            ManyToManyRelationships: [],
          },
        ],
      };

      const mockAttributesResponse = {
        value: [
          {
            LogicalName: 'contactid',
            AttributeType: 'Uniqueidentifier',
            DisplayName: { UserLocalizedLabel: { Label: 'Contact ID' } },
          },
          {
            '@odata.type': '#Microsoft.Dynamics.CRM.LookupAttributeMetadata',
            LogicalName: 'parentcustomerid',
            AttributeType: 'Lookup',
            DisplayName: { UserLocalizedLabel: { Label: 'Company Name' } },
            Targets: ['account'],
          },
        ],
      };

      ((globalThis as any).fetch as any).mockImplementation((url: string) => {
        if (url.includes('EntityDefinitions?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEntityResponse) });
        } else if (url.includes('Attributes?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAttributesResponse) });
        } else if (url.includes('solutions?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        } else if (url.includes('solutioncomponents?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: [] }) });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      dataverseApi.initialize();
      const result = await dataverseApi.fetchEntityMetadata();

      const lookupAttr = result.entities[0].attributes.find((a) => a.name === 'parentcustomerid');
      expect(lookupAttr?.isLookup).toBe(true);
      expect(lookupAttr?.lookupTarget).toBe('account');
    });
  });
});
