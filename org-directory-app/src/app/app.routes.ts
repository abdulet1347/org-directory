import { Routes } from '@angular/router';

import { OrganisationDirComponent } from './organisation-dir/organisation-dir.component';

export const routes: Routes = [
    {path:'',component: OrganisationDirComponent},
    {path:'**',redirectTo:''}
];
