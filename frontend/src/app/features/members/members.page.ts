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
  IonChip,
  IonSpinner,
  IonText,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
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
  personAddOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';


@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
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
    IonChip,
    IonSpinner,
    IonText
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

  constructor(
    private memberService: MemberService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {    addIcons({ 
      addOutline, 
      createOutline, 
      trashOutline, 
      peopleOutline,
      refreshOutline,
      arrowUpOutline,
      arrowDownOutline,
      personAddOutline
    });
  }

  ngOnInit() {
    this.loadMembers();
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
    const alert = await this.alertController.create({
      header: 'Add New Member',
      inputs: [
        {
          name: 'firstName',
          type: 'text',
          placeholder: 'First Name'
        },
        {
          name: 'lastName',
          type: 'text',
          placeholder: 'Last Name'
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email'
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Phone Number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: (data): boolean => {
            if (!data.firstName?.trim() || !data.lastName?.trim()) {
              this.showToast('First name and last name are required', 'danger');
              return false;
            }

            const newMember: Omit<Member, 'memberId'> = {
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              email: data.email?.trim() || '',
              phone: data.phone?.trim(),
              joinDate: new Date(),
              createdDate: new Date().toISOString(),
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              sports: [],
              status: 'active',
              membershipType: 'basic',
              lastPaymentDate: new Date()
            };

            this.loading = true;
            this.memberService.addMember(newMember).subscribe({
              next: () => {
                this.showToast('Member added successfully');
                this.loadMembers();
                return true;
              },
              error: (error) => {
                console.error('Error adding member:', error);
                this.showToast('Failed to add member', 'danger');
                this.loading = false;
                return false;
              }
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async editMember(member: Member) {
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
}
