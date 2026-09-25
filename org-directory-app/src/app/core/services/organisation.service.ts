import { Injectable, signal } from '@angular/core';

import { RAW_ORGANISATIONS } from '../data/organisation.fixture';
import { EN } from '../i18n/en';
import { CreateOrganisationInput, Organisation, OrganisationStatus, RawOrganisation } from '../models/organisation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const PAGE_SIZE = 25;
const MAX_REQUESTS_PER_MINUTE = 5;

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private readonly organisations = signal<Organisation[]>(this.normalizeFixture(RAW_ORGANISATIONS));
  private readonly requestTimes: number[] = [];

  /**
   * Represents the prebuilt read cache used by the directory screen. It permits
   * the one-page operational workflow without breaking the paged upstream API.
   */
  async getDirectorySnapshot(): Promise<Organisation[]> {
    await this.simulateNetwork();
    return this.organisations();
  }

  /** A constrained upstream-style API retained to model the source contract. */
  async getPage(page: number): Promise<{ records: Organisation[]; total: number }> {
    this.enforceRateLimit();
    await this.simulateNetwork();
    const records = this.organisations();
    const start = page * PAGE_SIZE;
    return { records: records.slice(start, start + PAGE_SIZE), total: records.length };
  }

  async create(input: CreateOrganisationInput): Promise<Organisation> {
    await this.pause(400);
    const next = this.organisations();
    const record: Organisation = {
      rowId: crypto.randomUUID(),
      sourceId: this.nextSourceId(next),
      name: input.name.trim(),
      status: input.status,
      ownerEmail: input.ownerEmail.trim(),
      memberCount: input.memberCount,
      createdAt: new Date(),
      hasDataIssue: false,
    };
    this.organisations.update((records) => [record, ...records]);
    return record;
  }

  hasName(name: string): boolean {
    const candidate = name.trim().toLocaleLowerCase();
    return candidate.length > 0 && this.organisations().some((record) => record.name.toLocaleLowerCase() === candidate);
  }

  private normalizeFixture(rawRecords: RawOrganisation[]): Organisation[] {
    const records = rawRecords.map((record, index) => this.normalizeRecord(record, index));
    const idCounts = new Map<number, number>();
    for (const record of records) {
      if (record.sourceId !== null) {
        idCounts.set(record.sourceId, (idCounts.get(record.sourceId) ?? 0) + 1);
      }
    }
    return records.map((record) => ({
      ...record,
      hasDataIssue: record.hasDataIssue || (record.sourceId !== null && (idCounts.get(record.sourceId) ?? 0) > 1),
    }));
  }

  private normalizeRecord(raw: RawOrganisation, index: number): Organisation {
    const sourceId = typeof raw.id === 'number' && Number.isFinite(raw.id) ? Math.trunc(raw.id) : null;
    const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
    const name = rawName || EN.table.unnamedOrganisation.replace('{sequence}', String(index + 1));
    const normalizedStatus = typeof raw.status === 'string' ? raw.status.toLocaleLowerCase() : '';
    const status: OrganisationStatus = ['active', 'inactive', 'suspended'].includes(normalizedStatus)
      ? normalizedStatus as OrganisationStatus
      : 'unknown';
    const numericMemberCount = typeof raw.memberCount === 'number'
      ? raw.memberCount
      : typeof raw.memberCount === 'string' ? Number(raw.memberCount) : 0;
    const memberCount = Number.isFinite(numericMemberCount) && numericMemberCount >= 0 ? Math.trunc(numericMemberCount) : 0;
    const ownerCandidate = raw.owner?.email;
    const ownerEmail = typeof ownerCandidate === 'string' && EMAIL_PATTERN.test(ownerCandidate) ? ownerCandidate : null;
    const timestamp = typeof raw.createdAt === 'number' || typeof raw.createdAt === 'string' ? new Date(raw.createdAt) : null;
    const createdAt = timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : null;

    return {
      rowId: `source-row-${index + 1}`,
      sourceId,
      name,
      status,
      memberCount,
      ownerEmail,
      createdAt,
      hasDataIssue: !rawName || status === 'unknown' || memberCount !== numericMemberCount || ownerEmail === null || createdAt === null || sourceId === null,
    };
  }

  private enforceRateLimit(): void {
    const now = Date.now();
    while (this.requestTimes.length > 0 && now - this.requestTimes[0] > 60_000) {
      this.requestTimes.shift();
    }
    if (this.requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit reached');
    }
    this.requestTimes.push(now);
  }

  private async simulateNetwork(): Promise<void> {
    await this.pause(400 + Math.floor(Math.random() * 501));
    if (Math.random() < 0.15) {
      throw new Error('Simulated list request failure');
    }
  }

  private pause(milliseconds: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  private nextSourceId(records: Organisation[]): number {
    return records.reduce((highest, record) => Math.max(highest, record.sourceId ?? 0), 0) + 1;
  }
}
