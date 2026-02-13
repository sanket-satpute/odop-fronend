import { Component } from '@angular/core';
import { ProductCategory } from 'src/app/project/models/product-category';
import { CategoryServiceService } from 'src/app/project/services/category-service.service';

@Component({
  selector: 'app-admin-add-product-category',
  templateUrl: './admin-add-product-category.component.html',
  styleUrls: ['./admin-add-product-category.component.css']
})
export class AdminAddProductCategoryComponent {

  constructor(private category_service: CategoryServiceService) {}

  category: ProductCategory = new ProductCategory();

  onSubmit() {
    console.log(this.category);
    this.category_service.registerCategory(this.category).subscribe(
      (response) => {
        console.log(response)
        alert("Category Saved");
        this.category = new ProductCategory();
      },
      (error) => {
        alert("Failed to Save");
        this.category = new ProductCategory();
      }
    );
  }
}
