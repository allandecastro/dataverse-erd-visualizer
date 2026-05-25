import { describe, it, expect } from 'vitest';
import { getRelationshipEdgeLabel } from '../ReactFlowERD';

describe('getRelationshipEdgeLabel', () => {
  it('returns referencingAttribute for 1:N relationship when lookup IDs are enabled', () => {
    const relationship = {
      type: 'N:1',
      schemaName: 'new_account_contact',
      referencingAttribute: 'accountid',
    } as any;

    expect(getRelationshipEdgeLabel(relationship, true)).toBe('accountid');
  });

  it('returns an empty string for 1:N relationship when lookup IDs are disabled', () => {
    const relationship = {
      type: 'N:1',
      schemaName: 'new_account_contact',
      referencingAttribute: 'accountid',
    } as any;

    expect(getRelationshipEdgeLabel(relationship, false)).toBe('');
  });

  it('always returns N:N intersection label regardless of lookup ID setting', () => {
    const relationship = {
      type: 'N:N',
      schemaName: 'new_account_contact',
      intersectEntityName: 'new_account_contact_join',
      referencingAttribute: 'accountid',
    } as any;

    expect(getRelationshipEdgeLabel(relationship, false)).toBe('[N:N] new_account_contact_join');
    expect(getRelationshipEdgeLabel(relationship, true)).toBe('[N:N] new_account_contact_join');
  });
});
