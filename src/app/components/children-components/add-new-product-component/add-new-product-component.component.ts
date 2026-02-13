import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { Product, CraftType } from 'src/app/project/models/product';
import { ProductCategory } from 'src/app/project/models/product-category';
import { CategoryServiceService } from 'src/app/project/services/category-service.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';
import { UserStateService } from 'src/app/project/services/user-state.service';

@Component({
  selector: 'app-add-new-product-component',
  templateUrl: './add-new-product-component.component.html',
  styleUrls: ['./add-new-product-component.component.css']
})
export class AddNewProductComponentComponent implements OnInit {
  productForm: FormGroup;
  categories: ProductCategory[] = [];
  selectedFile: File | null = null;
  selectedFileName = '';
  isSubmitting = false;
  isLoadingCategories = false;

  craftTypes: { label: string; value: CraftType }[] = [
    { label: 'Handloom', value: 'handloom' },
    { label: 'Handicraft', value: 'handicraft' },
    { label: 'Food', value: 'food' },
    { label: 'Spice', value: 'spice' },
    { label: 'Agriculture', value: 'agriculture' },
    { label: 'Art', value: 'art' },
    { label: 'Jewelry', value: 'jewelry' },
    { label: 'Pottery', value: 'pottery' },
    { label: 'Leather', value: 'leather' },
    { label: 'Metal', value: 'metal' },
    { label: 'Wood', value: 'wood' },
    { label: 'Bamboo', value: 'bamboo' },
    { label: 'Other', value: 'other' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductServiceService,
    private readonly categoryService: CategoryServiceService,
    private readonly userStateService: UserStateService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      productDescription: ['', [Validators.required, Validators.minLength(30), Validators.maxLength(2000)]],
      categoryId: ['', Validators.required],
      subCategoryId: [''],
      price: [null, [Validators.required, Validators.min(1), Validators.max(10000000)]],
      productQuantity: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      discount: [0, [Validators.min(0), Validators.max(90)]],
      promotionEnabled: [false],
      specification: ['', [Validators.maxLength(2500)]],
      warranty: ['', [Validators.maxLength(200)]],
      originDistrict: ['', [Validators.required, Validators.maxLength(80)]],
      originState: ['', [Validators.required, Validators.maxLength(80)]],
      originPinCode: ['', [Validators.pattern(/^[0-9]{6}$/)]],
      localName: ['', [Validators.maxLength(120)]],
      craftType: ['', Validators.required],
      originStory: ['', [Validators.maxLength(2500)]],
      madeBy: ['', [Validators.maxLength(120)]],
      materialsUsed: ['', [Validators.maxLength(500)]],
      tagsInput: ['', [Validators.maxLength(300)]],
      giTagCertified: [false],
      giTagNumber: ['', [Validators.maxLength(120)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.registerGiTagToggleBehavior();
  }

  get vendorId(): string | null {
    return this.userStateService.vendor?.vendorId || null;
  }

  get requiredCompletionCount(): number {
    const requiredKeys = [
      'productName',
      'productDescription',
      'categoryId',
      'price',
      'productQuantity',
      'originDistrict',
      'originState',
      'craftType'
    ];
    let completed = 0;
    requiredKeys.forEach(key => {
      const control = this.productForm.get(key);
      if (control && control.valid && control.value !== null && control.value !== '') {
        completed += 1;
      }
    });
    if (this.selectedFile) {
      completed += 1;
    }
    return completed;
  }

  get requiredTotalCount(): number {
    return 9;
  }

  get completionPercentage(): number {
    return Math.round((this.requiredCompletionCount / this.requiredTotalCount) * 100);
  }

  get isReadyToPublish(): boolean {
    return this.productForm.valid && !!this.selectedFile && !!this.vendorId;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.showMessage('Please upload JPG, PNG, or WEBP image only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Image size must be less than 5MB.');
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  saveProduct(): void {
    if (!this.vendorId) {
      this.showMessage('Vendor session missing. Please login again.');
      return;
    }

    if (!this.selectedFile) {
      this.showMessage('Product image is required.');
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.showMessage('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.productForm.value;
    const payload: Product = {
      productName: formValue.productName?.trim(),
      productDescription: formValue.productDescription?.trim(),
      categoryId: formValue.categoryId,
      subCategoryId: formValue.subCategoryId || undefined,
      price: Number(formValue.price),
      productQuantity: Number(formValue.productQuantity),
      discount: Number(formValue.discount || 0),
      promotionEnabled: !!formValue.promotionEnabled,
      specification: formValue.specification?.trim() || undefined,
      warranty: formValue.warranty?.trim() || undefined,
      vendorId: this.vendorId,
      originDistrict: formValue.originDistrict?.trim(),
      originState: formValue.originState?.trim(),
      originPinCode: formValue.originPinCode?.trim() || undefined,
      localName: formValue.localName?.trim() || undefined,
      craftType: formValue.craftType,
      originStory: formValue.originStory?.trim() || undefined,
      madeBy: formValue.madeBy?.trim() || undefined,
      materialsUsed: formValue.materialsUsed?.trim() || undefined,
      giTagCertified: !!formValue.giTagCertified,
      giTagNumber: formValue.giTagCertified ? (formValue.giTagNumber?.trim() || undefined) : undefined,
      tags: this.parseTags(formValue.tagsInput),
      stockStatus: Number(formValue.productQuantity) > 0 ? 'In Stock' : 'Out of Stock',
      approvalStatus: 'PENDING',
      isActive: false
    };

    this.isSubmitting = true;
    this.productService.registerProduct(payload, this.selectedFile)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.showMessage('Product submitted successfully. It is now pending admin approval.');
          this.resetForm();
          this.router.navigate(['/vendor-dashboard/vendor-products']);
        },
        error: (error) => {
          const message = error?.error?.message || error?.error?.error || 'Failed to submit product.';
          this.showMessage(message);
        }
      });
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryService.getAllCategory()
      .pipe(finalize(() => this.isLoadingCategories = false))
      .subscribe({
        next: (response) => {
          this.categories = response || [];
        },
        error: () => {
          this.showMessage('Failed to load categories.');
        }
      });
  }

  private registerGiTagToggleBehavior(): void {
    this.productForm.get('giTagCertified')?.valueChanges.subscribe((enabled: boolean) => {
      const giTagNumberControl = this.productForm.get('giTagNumber');
      if (!giTagNumberControl) {
        return;
      }
      if (enabled) {
        giTagNumberControl.addValidators([Validators.required]);
      } else {
        giTagNumberControl.clearValidators();
        giTagNumberControl.setValue('');
      }
      giTagNumberControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private parseTags(tagsInput: string): string[] {
    if (!tagsInput) {
      return [];
    }
    return tagsInput
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => !!tag)
      .slice(0, 15);
  }

  private resetForm(): void {
    this.productForm.reset({
      discount: 0,
      promotionEnabled: false,
      giTagCertified: false
    });
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
