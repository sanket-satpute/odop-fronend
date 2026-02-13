import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DistrictMapBrowserComponent } from './district-map-browser/district-map-browser.component';

const routes: Routes = [
  {
    path: '',
    component: DistrictMapBrowserComponent,
    title: 'ODOP District Map - Explore India\'s Craft Heritage'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    DistrictMapBrowserComponent
  ],
  exports: [RouterModule]
})
export class DistrictMapModule { }
