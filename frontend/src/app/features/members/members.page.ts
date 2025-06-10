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
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { Member } from '../../shared/interfaces/member.interface';
import { MemberService } from './services/member.service';
import { CommonModule } from '@angular/common';
import { 
  addOutline, 
  createOutline, 
  trashOutline, 
  peopleOutline,
  refreshOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonItemSliding,
    IonItemOption,
    IonItemOptions,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  providers: [MemberService]
})
export class MembersPage implements OnInit {
  members: Member[] = [];
  constructor(private memberService: MemberService) {
    addIcons({ 
      addOutline, 
      createOutline, 
      trashOutline, 
      peopleOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.loadMembers();
  }

  loadMembers() {
    this.memberService.getMembers().subscribe(
      members => this.members = members
    );
  }

  searchMembers(event: any) {
    const searchTerm = event.target.value;
    if (searchTerm && searchTerm.trim() !== '') {
      this.memberService.searchMembers(searchTerm).subscribe(
        members => this.members = members
      );
    } else {
      this.loadMembers();
    }
  }

  addMember() {
    // TODO: Implement add member modal
  }

  editMember(member: Member) {
    // TODO: Implement edit member modal
  }

  deleteMember(member: Member) {
    // TODO: Implement delete confirmation and API call
  }

  loadMore(event: any) {
    // TODO: Implement pagination
    event.target.complete();
  }
}
