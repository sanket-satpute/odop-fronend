import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BulkUploadPageComponent } from './bulk-upload-page/bulk-upload-page.component';

const routes: Routes = [
  {
    path: '',
    component: BulkUploadPageComponent,
    data: {
      title: 'Bulk Upload Center',
      description: 'Import large datasets efficiently with bulk upload tools'
    }
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    BulkUploadPageComponent  // Standalone component needs to be imported
  ],
  exports: [RouterModule]
})
export class BulkUploadModule { }
