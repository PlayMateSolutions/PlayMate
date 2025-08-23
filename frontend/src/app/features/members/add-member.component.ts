import { ModalController } from '@ionic/angular';
import { Component, EventEmitter, Output } from '@angular/core';
import { Member } from '../../shared/interfaces/member.interface';
import { FormsModule } from '@angular/forms';
import { IonInput, IonButton, IonLabel, IonItem, IonList, IonText } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonInput, IonButton, IonLabel, IonItem, IonList, IonText],
  providers: [ModalController]
})
export class AddMemberComponent {
  constructor(private modalCtrl: ModalController) {}
  @Output() memberAdded = new EventEmitter<Omit<Member, 'id'>>();
  @Output() cancelled = new EventEmitter<void>();



  // Form fields
  firstName = '';
  phone = '';
  place = '';
  lastName = '';
  email = '';
  notes = '';
  // Add more optional fields as needed

  showOptional = false;
  error = '';

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
      joinDate: new Date(),
      createdDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sports: [],
      status: 'active',
      membershipType: 'basic',
      lastPaymentDate: new Date()
    };
    await this.modalCtrl.dismiss({ member: newMember });
  }

  async cancel() {
    await this.modalCtrl.dismiss();
  }

  toggleOptional() {
    this.showOptional = !this.showOptional;
  }
}
