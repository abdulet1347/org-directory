import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganisationDirComponent } from './organisation-dir.component';

describe('OrganisationDirComponent', () => {
  let component: OrganisationDirComponent;
  let fixture: ComponentFixture<OrganisationDirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationDirComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganisationDirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
