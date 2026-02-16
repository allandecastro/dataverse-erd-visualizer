/**
 * Tests for Relationship Explorer utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  findRelatedEntities,
  filterRelatedEntities,
  countRelatedEntities,
  isSystemEntity,
  isActivityEntity,
  SYSTEM_ENTITIES,
  ACTIVITY_ENTITIES,
} from '../relationshipExplorer';
import type { Entity, EntityRelationship } from '@/types';

// ---- Test fixtures ----

function makeEntity(logicalName: string, displayName: string, opts?: Partial<Entity>): Entity {
  return {
    logicalName,
    displayName,
    objectTypeCode: 1,
    isCustomEntity: false,
    primaryIdAttribute: `${logicalName}id`,
    primaryNameAttribute: 'name',
    attributes: [],
    ...opts,
  };
}

function makeN1Rel(
  from: string,
  to: string,
  schemaName: string,
  lookupAttr?: string
): EntityRelationship {
  return {
    schemaName,
    from,
    to,
    type: 'N:1',
    referencingAttribute: lookupAttr ?? `${to}id`,
    referencedAttribute: `${to}id`,
    relationshipType: 'OneToManyRelationship',
  };
}

function make1NRel(
  from: string,
  to: string,
  schemaName: string,
  lookupAttr?: string
): EntityRelationship {
  return {
    schemaName,
    from,
    to,
    type: '1:N',
    referencingAttribute: lookupAttr ?? `${from}id`,
    referencedAttribute: `${from}id`,
    relationshipType: 'OneToManyRelationship',
  };
}

function makeNNRel(
  from: string,
  to: string,
  schemaName: string,
  intersect?: string
): EntityRelationship {
  return {
    schemaName,
    from,
    to,
    type: 'N:N',
    intersectEntityName: intersect ?? `${from}${to}`,
    relationshipType: 'ManyToManyRelationship',
  };
}

const entities: Entity[] = [
  makeEntity('account', 'Account'),
  makeEntity('contact', 'Contact'),
  makeEntity('opportunity', 'Opportunity'),
  makeEntity('lead', 'Lead'),
  makeEntity('systemuser', 'User'),
  makeEntity('team', 'Team'),
  makeEntity('email', 'Email'),
  makeEntity('new_project', 'Project', { isCustomEntity: true, publisher: 'Contoso' }),
  makeEntity('new_task', 'Task', { isCustomEntity: true, publisher: 'Contoso' }),
];

const relationships: EntityRelationship[] = [
  // Contact looks up to Account (N:1)
  makeN1Rel('contact', 'account', 'contact_customer_accounts', 'parentcustomerid'),
  // Opportunity looks up to Account (N:1)
  makeN1Rel('opportunity', 'account', 'opportunity_parent_account', 'parentaccountid'),
  // Opportunity looks up to Contact (N:1)
  makeN1Rel('opportunity', 'contact', 'opportunity_primary_contact', 'primarycontactid'),
  // Account self-reference (N:1)
  makeN1Rel('account', 'account', 'account_parent_account', 'parentaccountid'),
  // Account ↔ Lead N:N
  makeNNRel('account', 'lead', 'accountleads_association', 'accountleads'),
  // Contact looks up to User (N:1)
  makeN1Rel('contact', 'systemuser', 'contact_owning_user', 'owninguser'),
  // Account 1:N to Email (activity)
  make1NRel('account', 'email', 'account_emails', 'regardingobjectid'),
  // Project looks up to Account (N:1)
  makeN1Rel('new_project', 'account', 'new_project_account', 'new_accountid'),
  // Task looks up to Project (N:1)
  makeN1Rel('new_task', 'new_project', 'new_task_project', 'new_projectid'),
  // Lead looks up to Contact (N:1)
  makeN1Rel('lead', 'contact', 'lead_parent_contact', 'parentcontactid'),
];

// ---- Tests ----

describe('isSystemEntity', () => {
  it('should identify known system entities', () => {
    expect(isSystemEntity('systemuser')).toBe(true);
    expect(isSystemEntity('team')).toBe(true);
    expect(isSystemEntity('businessunit')).toBe(true);
    expect(isSystemEntity('organization')).toBe(true);
    expect(isSystemEntity('transactioncurrency')).toBe(true);
    expect(isSystemEntity('owner')).toBe(true);
  });

  it('should not flag non-system entities', () => {
    expect(isSystemEntity('account')).toBe(false);
    expect(isSystemEntity('contact')).toBe(false);
    expect(isSystemEntity('new_project')).toBe(false);
  });
});

describe('isActivityEntity', () => {
  it('should identify known activity entities', () => {
    expect(isActivityEntity('activitypointer')).toBe(true);
    expect(isActivityEntity('email')).toBe(true);
    expect(isActivityEntity('phonecall')).toBe(true);
    expect(isActivityEntity('appointment')).toBe(true);
    expect(isActivityEntity('task')).toBe(true);
  });

  it('should not flag non-activity entities', () => {
    expect(isActivityEntity('account')).toBe(false);
    expect(isActivityEntity('new_task')).toBe(false); // custom "Task" entity, not activity
  });
});

describe('SYSTEM_ENTITIES and ACTIVITY_ENTITIES sets', () => {
  it('should not overlap', () => {
    for (const name of SYSTEM_ENTITIES) {
      expect(ACTIVITY_ENTITIES.has(name)).toBe(false);
    }
  });
});

describe('findRelatedEntities', () => {
  it('should find outgoing N:1 relationships (source looks up to target)', () => {
    const result = findRelatedEntities(['contact'], entities, relationships, new Set());
    // Contact looks up to: account (N:1), systemuser (N:1)
    expect(result.outgoing.length).toBeGreaterThanOrEqual(2);
    expect(result.outgoing.map((e) => e.logicalName)).toContain('account');
    expect(result.outgoing.map((e) => e.logicalName)).toContain('systemuser');
  });

  it('should find incoming 1:N relationships (other entities look up to source)', () => {
    const result = findRelatedEntities(['account'], entities, relationships, new Set());
    // Entities looking up to Account: contact (N:1), opportunity (N:1), new_project (N:1)
    expect(result.incoming.length).toBeGreaterThanOrEqual(3);
    const incomingNames = result.incoming.map((e) => e.logicalName);
    expect(incomingNames).toContain('contact');
    expect(incomingNames).toContain('opportunity');
    expect(incomingNames).toContain('new_project');
  });

  it('should find N:N relationships', () => {
    const result = findRelatedEntities(['account'], entities, relationships, new Set());
    expect(result.manyToMany.length).toBe(1);
    expect(result.manyToMany[0].logicalName).toBe('lead');
    expect(result.manyToMany[0].relationships[0].intersectEntityName).toBe('accountleads');
  });

  it('should skip self-references within the source set', () => {
    // Account has a self-reference (account_parent_account)
    const result = findRelatedEntities(['account'], entities, relationships, new Set());
    // 'account' should NOT appear in the results
    const allNames = [
      ...result.outgoing.map((e) => e.logicalName),
      ...result.incoming.map((e) => e.logicalName),
      ...result.manyToMany.map((e) => e.logicalName),
    ];
    expect(allNames).not.toContain('account');
  });

  it('should mark entities already on canvas', () => {
    const onCanvas = new Set(['contact', 'lead']);
    const result = findRelatedEntities(['account'], entities, relationships, onCanvas);

    const contactEntry = result.incoming.find((e) => e.logicalName === 'contact');
    expect(contactEntry?.isOnCanvas).toBe(true);

    const leadEntry = result.manyToMany.find((e) => e.logicalName === 'lead');
    expect(leadEntry?.isOnCanvas).toBe(true);

    const oppEntry = result.incoming.find((e) => e.logicalName === 'opportunity');
    expect(oppEntry?.isOnCanvas).toBe(false);
  });

  it('should sort not-on-canvas entities before on-canvas entities', () => {
    const onCanvas = new Set(['contact']);
    const result = findRelatedEntities(['account'], entities, relationships, onCanvas);

    // Contact is on canvas, so should be sorted after non-canvas entities
    const incoming = result.incoming;
    const contactIndex = incoming.findIndex((e) => e.logicalName === 'contact');
    const oppIndex = incoming.findIndex((e) => e.logicalName === 'opportunity');

    if (contactIndex !== -1 && oppIndex !== -1) {
      expect(oppIndex).toBeLessThan(contactIndex);
    }
  });

  it('should aggregate multiple relationships to the same entity', () => {
    // If account has two different N:1 lookup relationships to the same target
    const extraRels: EntityRelationship[] = [
      ...relationships,
      makeN1Rel('contact', 'account', 'contact_secondary_account', 'new_secondaryaccountid'),
    ];
    const result = findRelatedEntities(['contact'], entities, extraRels, new Set());

    const accountEntry = result.outgoing.find((e) => e.logicalName === 'account');
    expect(accountEntry).toBeDefined();
    expect(accountEntry!.relationships.length).toBe(2);
  });

  it('should handle multi-entity source (aggregated exploration)', () => {
    // Explore from both account and contact
    const result = findRelatedEntities(['account', 'contact'], entities, relationships, new Set());

    // Should NOT include account or contact in results (they are source entities)
    const allNames = [
      ...result.outgoing.map((e) => e.logicalName),
      ...result.incoming.map((e) => e.logicalName),
      ...result.manyToMany.map((e) => e.logicalName),
    ];
    expect(allNames).not.toContain('account');
    expect(allNames).not.toContain('contact');

    // Should find opportunity (looks up to both account and contact)
    expect(allNames).toContain('opportunity');

    // The cross-relationship between contact→account should be skipped (both are sources)
    // but opportunity→account and opportunity→contact should be included
  });

  it('should handle empty source array', () => {
    const result = findRelatedEntities([], entities, relationships, new Set());
    expect(result.outgoing.length).toBe(0);
    expect(result.incoming.length).toBe(0);
    expect(result.manyToMany.length).toBe(0);
  });

  it('should handle entity with no relationships', () => {
    const isolatedEntity = makeEntity('isolated', 'Isolated');
    const result = findRelatedEntities(
      ['isolated'],
      [...entities, isolatedEntity],
      relationships,
      new Set()
    );
    expect(result.outgoing.length).toBe(0);
    expect(result.incoming.length).toBe(0);
    expect(result.manyToMany.length).toBe(0);
  });

  it('should skip relationships referencing entities not in allEntities', () => {
    const phantomRel = makeN1Rel('contact', 'phantom_entity', 'contact_phantom');
    const result = findRelatedEntities(
      ['contact'],
      entities, // phantom_entity is not in entities
      [...relationships, phantomRel],
      new Set()
    );

    const allNames = [
      ...result.outgoing.map((e) => e.logicalName),
      ...result.incoming.map((e) => e.logicalName),
      ...result.manyToMany.map((e) => e.logicalName),
    ];
    expect(allNames).not.toContain('phantom_entity');
  });

  it('should include relationship details with schema name, attributes, and entity refs', () => {
    const result = findRelatedEntities(['contact'], entities, relationships, new Set());
    const accountEntry = result.outgoing.find((e) => e.logicalName === 'account');
    expect(accountEntry).toBeDefined();
    expect(accountEntry!.relationships[0].schemaName).toBe('contact_customer_accounts');
    expect(accountEntry!.relationships[0].referencingAttribute).toBe('parentcustomerid');
    expect(accountEntry!.relationships[0].fromEntity).toBe('contact');
    expect(accountEntry!.relationships[0].toEntity).toBe('account');
  });

  it('should populate entity metadata (displayName, publisher, isCustomEntity)', () => {
    const result = findRelatedEntities(['account'], entities, relationships, new Set());
    const projectEntry = result.incoming.find((e) => e.logicalName === 'new_project');
    expect(projectEntry).toBeDefined();
    expect(projectEntry!.displayName).toBe('Project');
    expect(projectEntry!.isCustomEntity).toBe(true);
    expect(projectEntry!.publisher).toBe('Contoso');
  });

  it('should handle 1:N relationships from source perspective correctly', () => {
    // account has a 1:N relationship to email (account_emails)
    const result = findRelatedEntities(['account'], entities, relationships, new Set());
    const emailEntry = result.incoming.find((e) => e.logicalName === 'email');
    expect(emailEntry).toBeDefined();
    expect(emailEntry!.direction).toBe('incoming');
  });

  it('should show entity in multiple sections when it has relationships in different directions', () => {
    // Add an N:N relationship between contact and account alongside the existing N:1
    const extraRels: EntityRelationship[] = [
      ...relationships,
      makeNNRel('contact', 'account', 'contactaccount_nn', 'contactaccounts'),
    ];
    const result = findRelatedEntities(['contact'], entities, extraRels, new Set());

    // Account should appear in BOTH outgoing (N:1) and manyToMany (N:N)
    expect(result.outgoing.map((e) => e.logicalName)).toContain('account');
    expect(result.manyToMany.map((e) => e.logicalName)).toContain('account');
    // Each entry has its own relationships
    const outgoingAccount = result.outgoing.find((e) => e.logicalName === 'account')!;
    const nnAccount = result.manyToMany.find((e) => e.logicalName === 'account')!;
    expect(outgoingAccount.relationships[0].type).toBe('N:1');
    expect(nnAccount.relationships[0].type).toBe('N:N');
  });

  it('should show entity in both incoming and N:N when it has both relationship types', () => {
    // Explore from account: lead has only N:N. Add an incoming N:1 for lead→account
    const extraRels: EntityRelationship[] = [
      ...relationships,
      makeN1Rel('lead', 'account', 'lead_parent_account', 'parentaccountid'),
    ];
    const result = findRelatedEntities(['account'], entities, extraRels, new Set());

    // Lead should appear in BOTH incoming (N:1) and manyToMany (N:N)
    expect(result.incoming.map((e) => e.logicalName)).toContain('lead');
    expect(result.manyToMany.map((e) => e.logicalName)).toContain('lead');
  });

  it('should show entity in both outgoing and incoming when it has bidirectional lookups', () => {
    // Create bidirectional N:1 relationships between contact and lead
    const bidirRels: EntityRelationship[] = [
      makeN1Rel('contact', 'lead', 'contact_lookup_lead', 'new_leadid'),
      makeN1Rel('lead', 'contact', 'lead_parent_contact', 'parentcontactid'),
    ];
    const result = findRelatedEntities(['contact'], entities, bidirRels, new Set());

    // Lead appears in BOTH outgoing and incoming
    expect(result.outgoing.map((e) => e.logicalName)).toContain('lead');
    expect(result.incoming.map((e) => e.logicalName)).toContain('lead');
  });

  it('should include fromEntity and toEntity in relationship details', () => {
    const result = findRelatedEntities(['contact'], entities, relationships, new Set());
    const accountEntry = result.outgoing.find((e) => e.logicalName === 'account');
    expect(accountEntry).toBeDefined();
    expect(accountEntry!.relationships[0].fromEntity).toBe('contact');
    expect(accountEntry!.relationships[0].toEntity).toBe('account');
  });
});

describe('filterRelatedEntities', () => {
  const grouped = findRelatedEntities(['account'], entities, relationships, new Set());

  it('should filter by search query (display name)', () => {
    const filtered = filterRelatedEntities(grouped, { searchQuery: 'Opp' });
    const allNames = [
      ...filtered.outgoing.map((e) => e.displayName),
      ...filtered.incoming.map((e) => e.displayName),
      ...filtered.manyToMany.map((e) => e.displayName),
    ];
    expect(allNames.every((name) => name.toLowerCase().includes('opp'))).toBe(true);
  });

  it('should filter by search query (logical name)', () => {
    const filtered = filterRelatedEntities(grouped, { searchQuery: 'new_' });
    const allNames = [
      ...filtered.outgoing.map((e) => e.logicalName),
      ...filtered.incoming.map((e) => e.logicalName),
      ...filtered.manyToMany.map((e) => e.logicalName),
    ];
    expect(allNames.every((name) => name.includes('new_'))).toBe(true);
  });

  it('should filter system entities when hideSystemEntities is true', () => {
    const filtered = filterRelatedEntities(grouped, { hideSystemEntities: true });
    const allNames = [
      ...filtered.outgoing.map((e) => e.logicalName),
      ...filtered.incoming.map((e) => e.logicalName),
      ...filtered.manyToMany.map((e) => e.logicalName),
    ];
    expect(allNames).not.toContain('systemuser');
    expect(allNames).not.toContain('team');
  });

  it('should filter activity entities when hideActivityEntities is true', () => {
    const filtered = filterRelatedEntities(grouped, { hideActivityEntities: true });
    const allNames = [
      ...filtered.outgoing.map((e) => e.logicalName),
      ...filtered.incoming.map((e) => e.logicalName),
      ...filtered.manyToMany.map((e) => e.logicalName),
    ];
    expect(allNames).not.toContain('email');
  });

  it('should show only custom entities when customOnly is true', () => {
    const filtered = filterRelatedEntities(grouped, { customOnly: true });
    const allEntries = [...filtered.outgoing, ...filtered.incoming, ...filtered.manyToMany];
    expect(allEntries.every((e) => e.isCustomEntity)).toBe(true);
  });

  it('should hide already-on-canvas entities when hideAlreadyOnCanvas is true', () => {
    const onCanvas = new Set(['contact', 'lead']);
    const groupedWithCanvas = findRelatedEntities(['account'], entities, relationships, onCanvas);
    const filtered = filterRelatedEntities(groupedWithCanvas, { hideAlreadyOnCanvas: true });
    const allEntries = [...filtered.outgoing, ...filtered.incoming, ...filtered.manyToMany];
    expect(allEntries.every((e) => !e.isOnCanvas)).toBe(true);
  });

  it('should combine multiple filters', () => {
    const filtered = filterRelatedEntities(grouped, {
      hideSystemEntities: true,
      hideActivityEntities: true,
      customOnly: true,
    });
    const allEntries = [...filtered.outgoing, ...filtered.incoming, ...filtered.manyToMany];
    for (const entry of allEntries) {
      expect(isSystemEntity(entry.logicalName)).toBe(false);
      expect(isActivityEntity(entry.logicalName)).toBe(false);
      expect(entry.isCustomEntity).toBe(true);
    }
  });

  it('should return all entries with no filters', () => {
    const filtered = filterRelatedEntities(grouped, {});
    const originalCount =
      grouped.outgoing.length + grouped.incoming.length + grouped.manyToMany.length;
    const filteredCount =
      filtered.outgoing.length + filtered.incoming.length + filtered.manyToMany.length;
    expect(filteredCount).toBe(originalCount);
  });

  it('should handle case-insensitive search', () => {
    const filtered = filterRelatedEntities(grouped, { searchQuery: 'PROJECT' });
    const allNames = [
      ...filtered.outgoing.map((e) => e.logicalName),
      ...filtered.incoming.map((e) => e.logicalName),
      ...filtered.manyToMany.map((e) => e.logicalName),
    ];
    expect(allNames).toContain('new_project');
  });
});

describe('countRelatedEntities', () => {
  it('should count total, on-canvas, and not-on-canvas entities', () => {
    const onCanvas = new Set(['contact', 'lead']);
    const grouped = findRelatedEntities(['account'], entities, relationships, onCanvas);
    const counts = countRelatedEntities(grouped);

    expect(counts.onCanvas).toBe(2); // contact, lead
    expect(counts.total).toBe(counts.onCanvas + counts.notOnCanvas);
    expect(counts.notOnCanvas).toBe(counts.total - 2);
  });

  it('should return zeros for empty groups', () => {
    const counts = countRelatedEntities({ outgoing: [], incoming: [], manyToMany: [] });
    expect(counts.total).toBe(0);
    expect(counts.onCanvas).toBe(0);
    expect(counts.notOnCanvas).toBe(0);
  });

  it('should count across all three direction groups', () => {
    const grouped = findRelatedEntities(['account'], entities, relationships, new Set());
    const counts = countRelatedEntities(grouped);
    const manualTotal =
      grouped.outgoing.length + grouped.incoming.length + grouped.manyToMany.length;
    expect(counts.total).toBe(manualTotal);
  });
});
