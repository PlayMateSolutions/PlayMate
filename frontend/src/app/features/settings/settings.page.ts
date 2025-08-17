
import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubContextService } from '../../core/services/club-context.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  sportsClubId: string = '';

  constructor(
    private clubContext: ClubContextService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.sportsClubId = this.clubContext.getSportsClubId() || '';
  }

  async saveClubId() {
    if (this.sportsClubId.trim()) {
      this.clubContext.setSportsClubId(this.sportsClubId.trim());
      const toast = await this.toastCtrl.create({
        message: 'Sports Club ID saved!',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
      
      // Navigate to tabs after successful save
      setTimeout(() => {
        this.router.navigate(['/tabs']);
      }, 1500);
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Please enter a valid Sports Club ID.',
        duration: 1500,
        color: 'danger'
      });
      toast.present();
    }
  }

  logout() {
    // TODO: Implement logout
  }
}
