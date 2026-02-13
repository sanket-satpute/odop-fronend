import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendor-discovery-card',
  templateUrl: './vendor-discovery-card.component.html',
  styleUrls: ['./vendor-discovery-card.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class VendorDiscoveryCardComponent {
  @Input() vendor: any;
}
