import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EN } from '../core/i18n/en';
import { CreateOrganisationInput, Organisation, OrganisationStatus } from '../core/models/organisation';
import { OrganisationService } from '../core/services/organisation.service';

const CREATE_STATUSES = ['active', 'inactive', 'suspended'] as const;
type CreateStatus = (typeof CREATE_STATUSES)[number];
type SortField = 'name' | 'createdAt';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-organisation-dir',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './organisation-dir.component.html',
  styleUrl: './organisation-dir.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganisationDirComponent {
  
   readonly t = EN;
  readonly statuses = CREATE_STATUSES;
  readonly allStatuses: readonly OrganisationStatus[] = ['active', 'inactive', 'suspended', 'unknown'];
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly createOpen = signal(false);
  readonly submitting = signal(false);
  readonly organisations = signal<Organisation[]>([]);
  readonly searchInput = signal('');
  readonly searchQuery = signal('');
  readonly statusFilter = signal<OrganisationStatus | 'all'>('all');
  readonly sortField = signal<SortField>('name');
  readonly sortDirection = signal<SortDirection>('asc');
  readonly filteredOrganisations = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const status = this.statusFilter();
    const field = this.sortField();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    const filtered = this.organisations()
      .filter((organisation) => (status === 'all' || organisation.status === status) && organisation.name.toLocaleLowerCase().includes(query));
    return filtered.sort((left, right) => this.compareRecords(left, right, field) * direction);
  });


  private readonly service = inject(OrganisationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80), this.uniqueNameValidator()]],
    status: ['active' as CreateStatus, [Validators.required]],
    ownerEmail: ['', [Validators.required, Validators.email]],
    memberCount: [0, [Validators.min(0)]],
  });

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const search = params.get('search') ?? '';
      const rawStatus = params.get('status');
      const status = this.allStatuses.includes(rawStatus as OrganisationStatus) ? rawStatus as OrganisationStatus : 'all';
      this.searchInput.set(search);
      this.searchQuery.set(search);
      this.statusFilter.set(status);
    });
    void this.loadDirectory();
  }

  async loadDirectory(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.organisations.set(await this.service.getDirectorySnapshot());
      this.form.controls.name.updateValueAndValidity({ emitEvent: false });
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.setQueryParams({ search: value || null }), 300);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.setQueryParams({ status: value === 'all' ? null : value });
  }

  clearFilters(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.setQueryParams({ search: null, status: null });
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
      return;
    }
    this.sortField.set(field);
    this.sortDirection.set('asc');
  }

  openCreate(): void {
    this.createOpen.set(true);
  }

  closeCreate(): void {
    this.createOpen.set(false);
    this.form.reset({ name: '', status: 'active', ownerEmail: '', memberCount: 0 });
  }

  markTouched(controlName: keyof typeof this.form.controls): void {
    this.form.controls[controlName].markAsTouched();
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.invalid;
  }

  errorMessage(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors;
    if (!errors) {
      return null;
    }
    if (errors['required']) return this.t.validation[`${controlName === 'ownerEmail' ? 'ownerRequired' : `${controlName}Required`}` as keyof typeof this.t.validation];
    if (errors['minlength']) return this.t.validation.nameMinLength;
    if (errors['maxlength']) return this.t.validation.nameMaxLength;
    if (errors['uniqueName']) return this.t.validation.nameDuplicate;
    if (errors['email']) return this.t.validation.ownerEmail;
    if (errors['min']) return this.t.validation.memberMin;
    return null;
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    const value = this.form.getRawValue();
    const input: CreateOrganisationInput = {
      name: value.name,
      status: value.status,
      ownerEmail: value.ownerEmail,
      memberCount: value.memberCount,
    };
    try {
      const created = await this.service.create(input);
      this.organisations.update((records) => [created, ...records]);
      this.form.controls.name.updateValueAndValidity({ emitEvent: false });
      this.closeCreate();
    } finally {
      this.submitting.set(false);
    }
  }

  statusLabel(status: OrganisationStatus): string {
    return this.t.status[status];
  }

  resultSummary(): string {
    return this.t.filters.results
      .replace('{count}', this.filteredOrganisations().length.toString())
      .replace('{total}', this.organisations().length.toString());
  }

  formatDate(date: Date | null): string {
    return date ? new Intl.DateTimeFormat(this.t.date.locale, { dateStyle: 'medium' }).format(date) : this.t.table.unknownDate;
  }

  private setQueryParams(queryParams: { search?: string | null; status?: string | null }): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private uniqueNameValidator(): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => this.service.hasName(control.value) ? { uniqueName: true } : null;
  }

  private compareRecords(left: Organisation, right: Organisation, field: SortField): number {
    if (field === 'name') {
      return left.name.localeCompare(right.name, this.t.date.locale, { sensitivity: 'base' });
    }
    return (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0);
  }

}
