import { Injectable } from '@angular/core';
import { GlobalVariable } from '../global/global';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductCategory } from '../models/product-category';

@Injectable({
  providedIn: 'root'
})
export class CategoryServiceService {

  mainUrl = GlobalVariable.BASE_API_URL + "category";


  constructor(private http: HttpClient) { }

  registerCategory(categoryData?: ProductCategory): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(`${this.mainUrl}/save_category`, categoryData);
  }  

  getAllCategory(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(`${this.mainUrl}/get_all_categories`);
  }

  getCategoryById(id: string): Observable<ProductCategory> {
    return this.http.get<ProductCategory>(`${this.mainUrl}/get_category_id/${id}`)
  }

  getCategoryByName(name: string): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(`${this.mainUrl}/get_category_name/${name}`)
  }

  deleteCategoryById(id: string) {
    return this.http.delete<boolean>(`${this.mainUrl}/delete_by_id/${id}`);
  }
}
