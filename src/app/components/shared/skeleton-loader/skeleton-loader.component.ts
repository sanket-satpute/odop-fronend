import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.css']
})
export class SkeletonLoaderComponent {
  @Input() type: 'product-card' | 'product-list' | 'text' | 'circle' | 'image' | 'banner' | 'table-row' = 'text';
  @Input() count: number = 1;
  @Input() width: string = '100%';
  @Input() height: string = '20px';

  get items(): number[] {
    return Array(this.count).fill(0);
  }
}
