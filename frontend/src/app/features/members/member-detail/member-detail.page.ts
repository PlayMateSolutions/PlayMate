import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { MemberService } from '../services/member.service';
import { Member } from '../../../shared/interfaces/member.interface';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent
  ]
})
export class MemberDetailPage implements OnInit {
  member: Member | null = null;

  constructor(
    private route: ActivatedRoute,
    private memberService: MemberService
  ) {}

  ngOnInit() {
    const memberId = this.route.snapshot.paramMap.get('id');
    if (memberId) {
      this.memberService.getMembers().subscribe(result => {
        this.member = result.members.find(m => String(m.id) === String(memberId)) || null;
      });
    }
  }
}
