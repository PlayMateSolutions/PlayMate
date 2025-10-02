import { ModalController } from '@ionic/angular';
import { Component, EventEmitter, Output } from '@angular/core';
import { Member } from '../../shared/interfaces/member.interface';
import { FormsModule } from '@angular/forms';
import { IonInput, IonButton, IonLabel, IonItem, IonList, IonText, IonIcon, IonSelect, IonSelectOption, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { 
  chevronUpOutline, 
  chevronDownOutline, 
  closeOutline 
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { MemberService } from './services/member.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonInput, IonButton, IonLabel, IonItem, IonList, IonText, IonIcon, IonSelect, IonSelectOption, IonSpinner],
  providers: [ModalController, MemberService, ToastController]
})
export class AddMemberComponent {
  constructor(
    private modalCtrl: ModalController,
    private memberService: MemberService,
    private toastController: ToastController
  ) {
    addIcons({
      'chevron-up-outline': chevronUpOutline,
      'chevron-down-outline': chevronDownOutline,
      'close-outline': closeOutline
    });
  }
  @Output() memberAdded = new EventEmitter<Omit<Member, 'id'>>();
  @Output() cancelled = new EventEmitter<void>();



  // Form fields
  firstName = '';
  phone = '';
  place = '';
  lastName = '';
  email = '';
  notes = '';
  gender = '';
  dob = '';
  // Add more optional fields as needed

  showOptional = false;
  error = '';
  loading = false;

  async submit() {
    this.error = '';
    if (!this.firstName.trim() || !this.phone.trim() || !this.place.trim()) {
      this.error = 'First Name, Phone, and Place are required.';
      return;
    }
    const newMember: Omit<Member, 'id'> = {
      firstName: this.firstName.trim(),
      phone: this.phone.trim(),
      place: this.place.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      notes: this.notes.trim(),
      gender: this.gender.trim(),
      dateOfBirth: this.dob.trim(),
      joinDate: new Date(),
      createdDate: new Date().toISOString(),
      expiryDate: new Date().toISOString(),
      sports: [],
      status: 'Active',
      membershipType: 'basic',
      lastPaymentDate: new Date()
    };
    this.loading = true;
    this.memberService.addMember(newMember).subscribe({
      next: async (createdMember) => {
        this.loading = false;
        const toast = await this.toastController.create({
          message: 'Member added successfully',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        await this.modalCtrl.dismiss({ member: createdMember });
      },
      error: async (error) => {
        this.loading = false;
        this.error = error.message || 'Failed to add member';
      }
    });
  }

  async cancel() {
    await this.modalCtrl.dismiss();
  }

  toggleOptional() {
    this.showOptional = !this.showOptional;
  }
}
