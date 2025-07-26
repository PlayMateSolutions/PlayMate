/**
 * TestApiService.gs
 * Test the addMember API workflow for PlayMate
 */

const token = 'Bearer TOKEN_HERE'; // Replace with your actual token
const SPORTS_CLUB_ID = 'Herkley';
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwkIwh2XoG6k3r2BsPTLcbZK9S6EmqdDGSs4kGAMD1xc6qQ7jJCURjwjJbB8NeuuX2j/exec';

function testAddMemberApi() {
  // Mock POST request data for addMember
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "addMember",
        authorization: token,
        sportsClubId: SPORTS_CLUB_ID,
        payload: {
          firstName: "John",
          lastName: "Doe",
          phone: "9876543213",
          email: "john@example.com",
          joinDate: "2023-06-15",
          status: "Active",
          gender: "Male",
          address: "123, Main Street, Bengaluru, Karnataka, India",
          emergencyContact: "9876543210"
        }
      })
    }
  };

  // Simulate doPost handler
  const response = doPost(mockEvent);
  Logger.log(response.getContent());
}

function testGetMembers() {
  // Mock GET event with parameters
  const mockEvent = {
    parameter: {
      action: "getMembers",
      authorization: token,
      sportsClubId: SPORTS_CLUB_ID,
      payload: "{}"
    }
  };

  // Call doGet
  const response = doGet(mockEvent);
  Logger.log(response.getContent());
}

function testGetMembersRest() {
  const params = {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      'Authorization': token
    }
  };
  // Build query string with authorization in the query itself
  const query = `?action=getMembers&sportsClubId=${encodeURIComponent(SPORTS_CLUB_ID)}&authorization=${encodeURIComponent(token)}&payload={}`;
  const response = UrlFetchApp.fetch(API_BASE_URL + query, params);
  Logger.log('REST response:');
  Logger.log(response.getContentText());
}

function testRecordAttendance() {
  // Mock event with URL parameters
  const mockEvent = {
    parameter: {
      action: "recordAttendance",
      payload: JSON.stringify({
        memberId: "1",
        date: new Date().toISOString(),
        checkInTime: new Date().toISOString()
      })
    }
  };

  // Call doGet/doPost
  const response = doPost(mockEvent);
  Logger.log("Response from recordAttendance:");
  Logger.log(response.getContent());
}