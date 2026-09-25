import { RawOrganisation } from '../models/organisation';

const rawSeed: RawOrganisation[] = [
  { id: 1, name: 'Northwind Traders', status: 'active', memberCount: 42, owner: { email: 'ops@northwind.example' }, createdAt: '2024-03-11T09:12:00Z' },
  { id: 2, name: '', status: 'ACTIVE', memberCount: '12', owner: { email: 'a@b.example' }, createdAt: 1710150720000 },
  { id: 3, name: null, status: 'Active', memberCount: -1, createdAt: '2024-01-02T00:00:00Z' },
  { id: 42, name: 'Globex Corporation', status: 'suspended', memberCount: 7, owner: { email: 'hq@globex.example' }, createdAt: '2023-11-30T14:45:10Z' },
  { id: 42, name: 'Globex Corporation Ltd', status: 'actve', memberCount: 7, owner: { email: 'hq@globex.example' }, createdAt: '2023-11-30T14:45:10Z' },
  { id: 6, name: 'شركة الأمل 🏢', status: 'active', memberCount: 3, owner: { email: 'info@amal.example' }, createdAt: '2025-06-01T08:00:00Z' },
  { id: 7, name: 'The Very Long Organisation Name That Somebody Actually Typed Into The Field Because Nobody Validated It And It Keeps Going Well Past Any Reasonable Column Width And Still Has Not Stopped', status: 'inactive', memberCount: 0, owner: { email: 'long@example.com' }, createdAt: '2024-07-19T16:20:00Z' },
  { id: 8, name: 'Initech', status: null, memberCount: null, owner: { email: 'not-an-email' }, createdAt: 'not a date' },
];

/**
 * Deliberately retains and repeats production-style malformed values. The UI is
 * expected to normalize at its boundary rather than rely on a clean fixture.
 */
export const RAW_ORGANISATIONS: RawOrganisation[] = [
  ...rawSeed,
  ...Array.from({ length: 132 }, (_, index): RawOrganisation => {
    const seed = rawSeed[index % rawSeed.length];
    const sequence = Math.floor(index / rawSeed.length) + 1;
    const baseName = typeof seed.name === 'string' && seed.name.length > 0 ? seed.name : 'Unnamed source organisation';

    return {
      id: index % 29 === 0 ? 42 : 100 + index,
      name: index % 17 === 0 ? '' : `${baseName} ${sequence}`,
      status: index % 23 === 0 ? 'actve' : seed.status,
      memberCount: index % 19 === 0 ? -1 : index % 11 === 0 ? String(index + 2) : seed.memberCount,
      owner: index % 31 === 0 ? undefined : seed.owner,
      createdAt: index % 27 === 0 ? 'not a date' : seed.createdAt,
    };
  }),
];
