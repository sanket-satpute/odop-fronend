import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CraftCategoriesBrowserComponent } from './craft-categories-browser/craft-categories-browser.component';

const routes: Routes = [
  {
    path: '',
    component: CraftCategoriesBrowserComponent,
    title: 'Craft Categories - ODOP'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CraftCategoriesBrowserComponent
  ],
  exports: [RouterModule]
})
export class CraftCategoriesModule { }
