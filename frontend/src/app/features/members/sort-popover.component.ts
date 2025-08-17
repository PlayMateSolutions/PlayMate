import { Component, Input } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons,
  IonContent, 
  IonLabel, 
  IonIcon, 
  IonButton,
  IonChip,
  PopoverController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { 
  arrowUpOutline, 
  arrowDownOutline,
  closeOutline,
  personOutline,
  calendarOutline,
  timeOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-sort-popover',
  templateUrl: './sort-popover.component.html',
  styleUrls: ['./sort-popover.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonLabel,
    IonIcon,
    IonButton,
    IonChip
  ]
})
export class SortPopoverComponent {
  @Input() currentSort: string = 'name';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';

  selectedSort: string = this.currentSort;
  selectedDirection: 'asc' | 'desc' = this.sortDirection;

  constructor(private popoverCtrl: PopoverController) {
    addIcons({ 
      arrowUpOutline, 
      arrowDownOutline,
      closeOutline,
      personOutline,
      calendarOutline,
      timeOutline
    });
  }

  selectSort(option: string) {
    if (this.selectedSort === option) {
      // Toggle direction if same option
      this.selectedDirection = this.selectedDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New option, default to ascending
      this.selectedSort = option;
      this.selectedDirection = 'asc';
    }
  }

  applySort() {
    this.popoverCtrl.dismiss({
      sortOption: this.selectedSort,
      sortDirection: this.selectedDirection
    });
  }

  dismiss() {
    this.popoverCtrl.dismiss();
  }
}
