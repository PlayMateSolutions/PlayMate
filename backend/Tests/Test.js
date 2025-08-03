/**
 * TestApiService.gs
 * Test the addMember API workflow for PlayMate
 */

const tokenMethod = 'Bearer ya29.a0AS3H6Nw1P-mV2MjjKR5EvRe5eekzeOh0S5IAEmS6gzHCnLf9J2lWTcG1lYlZNm0_Uf1ngnMz_0QsQWiCsMcfUAPt5_Pw9v7q25t-xaLDqqdsxKRvV9vLaCZh53cWBEPecp6ZZK2vjeeSJBHX_Zm1b_u8QJNYz2eMkw_baTAZaCgYKAS4SARUSFQHGX2MifxS-oa5wfLw93yN7t1iQbA0175';
const SPORTS_CLUB_ID_METHOD = 'herkley';


function testAddMemberApi() {
  // Mock POST request data for addMember
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "addMember",
        sportsClubId: "herkley",
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
  const request = { parameter: JSON.parse(mockEvent.postData.contents) };
  const response = doPost(request);
  Logger.log(response.getContent());
}

function testGetMembers() {
  // Mock event with URL parameters
  const mockEvent = {
    parameter: {
      sportsClubId: SPORTS_CLUB_ID,
      action: "getMembers",
      authorization: token,
    }
  };

  // Call doGet
  const response = doGet(mockEvent);
  Logger.log(response.getContent());
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