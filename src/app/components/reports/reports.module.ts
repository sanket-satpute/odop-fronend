import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsDashboardComponent } from './reports-dashboard/reports-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsDashboardComponent,
    title: 'Reports Dashboard - ODOP Admin'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    ReportsDashboardComponent
  ],
  exports: [RouterModule]
})
export class ReportsModule { }
