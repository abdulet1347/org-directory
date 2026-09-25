export const ORGANISATION_STATUSES = ['active', 'inactive', 'suspended', 'unknown'] as const;
export type OrganisationStatus = (typeof ORGANISATION_STATUSES)[number];

export interface Organisation {
  /** A client-safe row identifier; source IDs are intentionally not reliable. */
  rowId: string;
  sourceId: number | null;
  name: string;
  status: OrganisationStatus;
  memberCount: number;
  ownerEmail: string | null;
  createdAt: Date | null;
  hasDataIssue: boolean;
}

export interface CreateOrganisationInput {
  name: string;
  status: Exclude<OrganisationStatus, 'unknown'>;
  ownerEmail: string;
  memberCount: number;
}

export interface RawOrganisation {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  memberCount?: unknown;
  owner?: { email?: unknown } | null;
  createdAt?: unknown;
}
