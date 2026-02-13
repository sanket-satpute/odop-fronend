import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GovernmentSchemesListComponent } from './government-schemes-list/government-schemes-list.component';
import { GovernmentSchemeDetailComponent } from './government-scheme-detail/government-scheme-detail.component';
import { EligibilityCheckerComponent } from './eligibility-checker/eligibility-checker.component';

const routes: Routes = [
  {
    path: '',
    component: GovernmentSchemesListComponent,
    title: 'Government Schemes for Artisans - ODOP'
  },
  {
    path: 'eligibility-checker',
    component: EligibilityCheckerComponent,
    title: 'Check Your Eligibility - ODOP Government Schemes'
  },
  {
    path: ':id',
    component: GovernmentSchemeDetailComponent,
    title: 'Scheme Details - ODOP'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    GovernmentSchemesListComponent,
    GovernmentSchemeDetailComponent,
    EligibilityCheckerComponent
  ],
  exports: [RouterModule]
})
export class GovernmentSchemesModule { }
