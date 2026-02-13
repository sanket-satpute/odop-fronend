import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ArtisanStoriesListComponent } from './artisan-stories-list/artisan-stories-list.component';
import { ArtisanStoryDetailComponent } from './artisan-story-detail/artisan-story-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ArtisanStoriesListComponent
  },
  {
    path: ':slug',
    component: ArtisanStoryDetailComponent
  }
];

@NgModule({
  declarations: [
    ArtisanStoriesListComponent,
    ArtisanStoryDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    ArtisanStoriesListComponent,
    ArtisanStoryDetailComponent
  ]
})
export class ArtisanStoriesModule { }
