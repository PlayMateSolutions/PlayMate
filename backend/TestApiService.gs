/**
 * TestApiService.gs
 * Test the addMember API workflow for PlayMate
 */

const token = 'Bearer TOKEN_HERE'; // Replace with your actual token

function testAddMemberApi() {
  // Mock POST request data for addMember
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "addMember",
        authorization : token,
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
  // Mock event with URL parameters
  const mockEvent = {
    parameter: {
      action: "getMembers",
      authorization: token
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