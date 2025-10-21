import { Injectable } from "@angular/core";
import { ClubContextService } from "src/app/core/services/club-context.service";
import { AuthService } from "src/app/core/services/auth.service";
import { GoogleSheetsDbService } from "./google-sheets-db.service";
import { Member } from "src/app/shared/interfaces/member.interface";

@Injectable({
  providedIn: 'root'
})

export class GymMateGoogleSheetService {
    private readonly memberAttributesMapping = {
      id: "id",
      firstName: "firstName",
      lastName: "lastName",
      email: "email",
      phone: "phone",
      place: "place",
      joinDate: "joinDate",
      status: "status",
      expiryDate: "expiryDate",
      notes: "notes",
      dateOfBirth: "dateOfBirth",
      gender: "gender"
    };


    constructor(private clubContextService: ClubContextService, private authService: AuthService, private googleSheetsDbService: GoogleSheetsDbService
    ) {
        // Initialization moved to async method
        this.initializeSpreadsheet();
    }

    async initializeSpreadsheet() {
        const token = await this.authService.getSession().then(session => session?.accessToken);
        if (token) {
            this.googleSheetsDbService.oauthToken = token;
        } else {
            console.error('Failed to obtain OAuth token for Google Sheets API.');
        }
        const spreadsheetId = this.clubContextService.getSpreadSheet()?.id;
        if (spreadsheetId) {
            this.googleSheetsDbService.spreadsheetId = spreadsheetId;
        } else {
            console.error('No spreadsheet ID found in club context.');
        }
    }

    public async RefreshMembersData(): Promise<Member[]> {
        return new Promise((resolve, reject) => {
            this.googleSheetsDbService
              .get('Members', this.memberAttributesMapping)
              .subscribe({
                next: (data) => {
                  resolve(data as Member[]);
                },
                error: (error) => {
                  reject(error);
                },
              });
        });
    }

    async RefreshAllData(): Promise<void> {
        await this.RefreshMembersData();
    }
}