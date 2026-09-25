import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-organisation-dir',
  standalone: true,
  imports: [],
  templateUrl: './organisation-dir.component.html',
  styleUrl: './organisation-dir.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganisationDirComponent {
  

}
