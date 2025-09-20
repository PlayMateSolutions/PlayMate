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
  AlertController,
  ToastController,
  ModalController,
  IonChip,
  IonMenuButton
} from '@ionic/angular/standalone';
import { AddMemberComponent } from './add-member.component';
import { RecordPaymentComponent } from './record-payment.component';
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
  footballOutline, personOutline, timeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ClubContextService } from '../../core/services/club-context.service';
import { RelativeTimePipe } from './relative-time.pipe';
import { Router } from '@angular/router';


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
    IonChip,
    IonMenuButton,
    RelativeTimePipe
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
  loading: boolean = false; // Indicates API call loading state
  error: string | null = null;
  isSearchVisible: boolean = false;
  lastMemberSync: Date | null = null;
  constructor(
    private memberService: MemberService,
    private alertController: AlertController,
    private toastController: ToastController,
    private translateService: TranslateService,
    private modalController: ModalController,
    private clubContext: ClubContextService,
    private router: Router
  ) {    
    // Initialize available languages
    this.translateService.addLangs(['en', 'ta']);
    this.translateService.setDefaultLang('en');

    // Use browser language if available, otherwise use English
    const browserLang = navigator.language;
    this.translateService.use(browserLang.match(/en|ta/) ? browserLang : 'en');

    addIcons({addOutline,personOutline,calendarOutline,timeOutline,refreshOutline,logoWhatsapp,peopleOutline,personAddOutline,createOutline,trashOutline,mailOutline,callOutline,footballOutline,arrowUpOutline,arrowDownOutline,searchOutline,closeOutline});
    this.lastMemberSync = this.clubContext.getLastMemberRefresh();
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
      next: (result) => {
        this.members = result.members;
        this.filteredMembers = [...result.members];
        this.sortMembers();
        this.loading = false;
        this.lastMemberSync = this.clubContext.getLastMemberRefresh();
      },
      error: (error) => {
        this.error = 'Error loading members';
        this.loading = false;
        console.error('Error loading members:', error);
      }
    });
  }

  refreshMembers() {
    this.loading = true;
    this.error = null;
    this.memberService.refreshMembers().subscribe({
      next: (result) => {
        this.members = result.members;
        this.filteredMembers = [...result.members];
        this.sortMembers();
        this.loading = false;
        this.lastMemberSync = this.clubContext.getLastMemberRefresh();
        
        // Show success toast
        this.showToast('Members refreshed successfully', 'success');
      },
      error: (error) => {
        this.error = 'Error refreshing members';
        this.loading = false;
        console.error('Error refreshing members:', error);
        this.showToast('Failed to refresh members', 'danger');
      }
    });
  }

  searchMembers(event: any) {
    this.searchTerm = event.target.value || '';
    this.filterMembers();
  }

  filterMembers() {
    // First apply search filter
    let result = [...this.members];

    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (member) =>
          (member.firstName && member.firstName.toLowerCase().includes(term)) ||
          (member.lastName && member.lastName.toLowerCase().includes(term)) ||
          (member.phone && String(member.phone).toLowerCase().includes(term))
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
          compareA = new Date(a.id).getTime();
          compareB = new Date(b.id).getTime();
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

  async sendPaymentReminder(member: Member) {
    // Get language from club context, fallback to 'en'
    const lang = this.clubContext.getLanguage ? this.clubContext.getLanguage() : 'en';
    await this.translateService.use(lang);

    const status = this.getMembershipStatus(member.expiryDate);
    const params = {
      name: member.firstName,
      date: this.formatDate(member.expiryDate),
      days: this.getRemainingDays(member.expiryDate).toString()
    };
    // Read the message template from translation files (en.json/ta.json)
    const message = await this.translateService.get(`membership.${status}`, params).toPromise();
    const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_system');
  }

  async renewMembership(member: Member) {
    const modal = await this.modalController.create({
      component: RecordPaymentComponent,
      componentProps: {
        member: member
      },
      showBackdrop: true,
      backdropDismiss: false,
      cssClass: 'payment-modal',
      presentingElement: document.body.querySelector('ion-app') || undefined
    });

    modal.onWillDismiss().then((result) => {
      console.log('Payment modal result:', result.data);
      if (result.data?.success) {
        // Update member in the local array
        const index = this.members.findIndex(m => m.id === member.id);
        if (index !== -1) {
          this.members[index] = {
            ...member,
            expiryDate: result.data.expiryDate,
            status: 'Active'
          };
          // Re-apply current filters and sorting
          this.filterMembers();
          this.showToast(`Payment recorded successfully for ${member.firstName} ${member.lastName}`);
        }
      }
    });

    await modal.present();
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
            this.memberService.deleteMember(member.id).subscribe({
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
        this.loadMembers();
      }
    });

    await modal.present();
  }

  async editMember(member: Member) {
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

  openMemberDetail(member: Member) {
    this.router.navigate(['/tabs/members', member.id]);
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

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortMembers();
  }
}
