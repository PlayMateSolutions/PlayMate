import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Member } from '../../shared/interfaces/member.interface';
import { MemberService } from './services/member.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-members',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Members</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="addMember()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          (ionInput)="searchMembers($event)"
          placeholder="Search members">
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item-sliding *ngFor="let member of members">
          <ion-item>
            <ion-label>
              <h2>{{member.firstName}} {{member.lastName}}</h2>
              <p>{{member.email}}</p>
              <p>{{member.sports.join(', ')}}</p>
            </ion-label>
          </ion-item>

          <ion-item-options>
            <ion-item-option (click)="editMember(member)">
              <ion-icon slot="icon-only" name="create"></ion-icon>
            </ion-item-option>
            <ion-item-option color="danger" (click)="deleteMember(member)">
              <ion-icon slot="icon-only" name="trash"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <ion-infinite-scroll (ionInfinite)="loadMore($event)">
        <ion-infinite-scroll-content></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `,
  styles: [`
    ion-searchbar {
      padding: 0 16px;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MembersPage implements OnInit {
  members: Member[] = [];

  constructor(private memberService: MemberService) {}

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
