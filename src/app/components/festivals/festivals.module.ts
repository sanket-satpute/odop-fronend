import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { FestivalsPageComponent } from './festivals-page/festivals-page.component';
import { FestivalDetailComponent } from './festival-detail/festival-detail.component';

const routes: Routes = [
  {
    path: '',
    component: FestivalsPageComponent,
    data: { title: 'Festival Collections - ODOP' }
  },
  {
    path: ':slug',
    component: FestivalDetailComponent,
    data: { title: 'Festival - ODOP' }
  }
];

@NgModule({
  declarations: [
    FestivalsPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    FestivalDetailComponent  // FestivalDetailComponent is standalone
  ],
  exports: [RouterModule]
})
export class FestivalsModule { }
