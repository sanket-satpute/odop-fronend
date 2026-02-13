import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnsPageComponent } from './returns-page/returns-page.component';

const routes: Routes = [
  {
    path: '',
    component: ReturnsPageComponent,
    data: { title: 'Returns & Refunds' }
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    ReturnsPageComponent
  ]
})
export class ReturnsModule { }
