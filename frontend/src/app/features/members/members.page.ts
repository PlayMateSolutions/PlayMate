import { Component, OnInit } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonSearchbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonModal,
  AlertController,
  ToastController,
  ModalController,
  PopoverController
} from '@ionic/angular/standalone';
import { AddMemberComponent } from './add-member.component';
import { SortPopoverComponent } from './sort-popover.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Member } from '../../shared/interfaces/member.interface';
import { MemberService } from './services/member.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  addOutline, 
  createOutline, 
  trashOutline, 
  peopleOutline,
  refreshOutline,
  arrowUpOutline,
  arrowDownOutline,
  personAddOutline,
  searchOutline,
  closeOutline,
  optionsOutline,
  logoWhatsapp,
  mailOutline,
  callOutline,
  calendarOutline,
  footballOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';


@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonText,
    IonModal
  ],
  providers: [MemberService]
})
export class MembersPage implements OnInit {
  members: Member[] = [];
  filteredMembers: Member[] = [];
  searchTerm: string = '';
  sortOption: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedSegment: string = 'all';
  loading: boolean = false;
  error: string | null = null;
  isSearchVisible: boolean = false;
  constructor(
    private memberService: MemberService,
    private alertController: AlertController,
    private toastController: ToastController,
    private translateService: TranslateService,
    private modalController: ModalController,
    private popoverController: PopoverController
  ) {    
    // Initialize available languages
    this.translateService.addLangs(['en', 'ta']);
    this.translateService.setDefaultLang('en');

    // Use browser language if available, otherwise use English
    const browserLang = navigator.language;
    this.translateService.use(browserLang.match(/en|ta/) ? browserLang : 'en');

    addIcons({
      addOutline,
      refreshOutline,
      logoWhatsapp,
      createOutline,
      trashOutline,
      mailOutline,
      callOutline,
      calendarOutline,
      footballOutline,
      peopleOutline,
      personAddOutline,
      arrowUpOutline,
      arrowDownOutline,
      searchOutline,
      closeOutline,
      optionsOutline
    });
  }

  ngOnInit() {
    this.loadMembers();
  }

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
    if (!this.isSearchVisible) {
      // Clear search when hiding
      this.searchTerm = '';
      this.filterMembers();
    }
  }

  loadMembers() {
    this.loading = true;
    this.error = null;
    this.memberService.getMembers().subscribe({
      next: (members) => {
        this.members = members;
        this.filteredMembers = [...members];
        this.sortMembers();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading members';
        this.loading = false;
        console.error('Error loading members:', error);
      }
    });
  }

  searchMembers(event: any) {
    this.searchTerm = event.target.value;
    this.filterMembers();
  }

  filterMembers() {
    // First apply search filter
    let result = [...this.members];

    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (member) =>
          member.firstName.toLowerCase().includes(term) ||
          member.lastName.toLowerCase().includes(term) ||
          member.email.toLowerCase().includes(term) ||
          (member.sports && member.sports.some(sport => sport.toLowerCase().includes(term)))
      );
    }

    // Then apply segment filter
    if (this.selectedSegment !== 'all') {
      result = result.filter((member) => {
        const status = this.getMembershipStatus(member.expiryDate);
        return this.selectedSegment === status;
      });
    }

    this.filteredMembers = result;
    this.sortMembers();
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    this.filterMembers();
  }

  sortMembers() {
    this.filteredMembers.sort((a, b) => {
      let compareA, compareB;

      switch (this.sortOption) {
        case 'name':
          compareA = `${a.firstName} ${a.lastName}`.toLowerCase();
          compareB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'expiryDate':
          compareA = new Date(a.expiryDate).getTime();
          compareB = new Date(b.expiryDate).getTime();
          break;
        case 'createdDate':
          compareA = new Date(a.createdDate).getTime();
          compareB = new Date(b.createdDate).getTime();
          break;
        default:
          compareA = `${a.firstName} ${a.lastName}`.toLowerCase();
          compareB = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      return this.sortDirection === 'asc' 
        ? compareA > compareB ? 1 : -1
        : compareA < compareB ? 1 : -1;
    });
  }

  changeSortOption(option: string) {
    if (this.sortOption === option) {
      // Toggle direction if clicking the same option
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Default to ascending for new sort option
      this.sortOption = option;
      this.sortDirection = 'asc';
    }
    this.sortMembers();
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';

    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return date;
    }
  }

  getRemainingDays(expiryDate: string): number {
    if (!expiryDate) return 0;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  }

  getMembershipStatus(expiryDate: string): string {
    const remainingDays = this.getRemainingDays(expiryDate);

    if (remainingDays <= 0) {
      return 'expired';
    } else if (remainingDays <= 7) {
      return 'expiring';
    } else {
      return 'active';
    }
  }

  async deleteMember(member: Member) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${member.firstName} ${member.lastName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.loading = true;
            this.memberService.deleteMember(member.memberId).subscribe({
              next: () => {
                this.showToast(`${member.firstName} ${member.lastName} has been deleted`);
                this.loadMembers();
              },
              error: (error) => {
                this.error = 'Error deleting member';
                this.loading = false;
                console.error('Error deleting member:', error);
                this.showToast('Failed to delete member', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }
  async addMember() {
    const modal = await this.modalController.create({
      component: AddMemberComponent,
      componentProps: {},
      showBackdrop: true,
      backdropDismiss: false,
      cssClass: 'add-member-modal',
    });

    modal.onWillDismiss().then((result) => {
      const data = result.data;
      if (data && data.member) {
        this.loading = true;
        this.memberService.addMember(data.member).subscribe({
          next: () => {
            this.showToast('Member added successfully');
            this.loadMembers();
          },
          error: (error) => {
            console.error('Error adding member:', error);
            this.showToast('Failed to add member', 'danger');
            this.loading = false;
          }
        });
      }
    });

    await modal.present();
  }

  async editMember(member: Member) {
  }
  async renewMembership(member: Member) {
    // TODO: Implement membership renewal logic
  }  
    async openWhatsApp(member: Member) {
    if (!member.phone) {
      const noPhoneMessage = await this.translateService.get('whatsapp.noPhone').toPromise();
      this.showToast(noPhoneMessage, 'warning');
      return;
    }
    
    // Format the phone number (remove spaces, dashes, etc.)
    let phoneNumber = member.phone.toString().replace(/\s+/g, '').replace(/-/g, '');
    
    // If the phone number doesn't start with '+', add the country code
    // Assuming India (+91) as default country code
    if (!phoneNumber.startsWith('+')) {
      // Remove leading zeros if any
      phoneNumber = phoneNumber.replace(/^0+/, '');
      
      // If the number doesn't have country code, add it
      if (!phoneNumber.startsWith('91')) {
        phoneNumber = '91' + phoneNumber;
      }
    }
      // Create message based on membership status using translations
    const membershipStatus = this.getMembershipStatus(member.expiryDate);
    const params = {
      name: `${member.firstName} ${member.lastName}`,
      date: this.formatDate(member.expiryDate),
      days: this.getRemainingDays(member.expiryDate).toString()
    };
    
    // Get translated message based on membership status
    const message = await this.translateService
      .get(`whatsapp.${membershipStatus}`, params)
      .toPromise();
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create the WhatsApp URL with auto-filled message if applicable
    const whatsappUrl = `https://wa.me/${phoneNumber}${message ? '?text=' + encodedMessage : ''}`;
    
    // Open in browser
    window.open(whatsappUrl, '_blank');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  loadMore(event: any) {
    // Implement pagination logic here
    // For now, just complete the event
    event.target.complete();
  }

  async presentSortMenu(event?: any) {
    console.log('presentSortMenu called with event:', event);
    console.log('SortPopoverComponent:', SortPopoverComponent);
    
    try {
      const popover = await this.popoverController.create({
        component: SortPopoverComponent,
        componentProps: {
          currentSort: this.sortOption,
          sortDirection: this.sortDirection
        },
        event: event,
        translucent: true,
        cssClass: 'sort-popover'
      });

      popover.onDidDismiss().then((result) => {
        if (result.data) {
          const { sortOption, sortDirection } = result.data;
          this.sortOption = sortOption;
          this.sortDirection = sortDirection;
          this.sortMembers();
        }
      });

      await popover.present();
    } catch (error) {
      console.error('Error creating popover:', error);
      // Fallback to alert if popover fails
      const alert = await this.alertController.create({
        header: 'Sort Members',
        message: 'Choose how to sort the member list:',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Name',
            handler: () => this.changeSortOption('name')
          },
          {
            text: 'Expiry Date',
            handler: () => this.changeSortOption('expiryDate')
          },
          {
            text: 'Join Date',
            handler: () => this.changeSortOption('createdDate')
          }
        ]
      });
      await alert.present();
    }
  }
}
