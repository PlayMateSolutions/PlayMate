/**
 * TestApiService.gs
 * Test the addMember API workflow for PlayMate
 */

// const token = 'Bearer ya29.A0AS3H6NxrTUxeBgl1U-zoAj0Jmc8Y5QvfvSCkqXOjzoSUgllJ1V7R_wWo57UTxv7OIMAYH3d-ZC0iO3H2YD9u3z6GBPEokkdJV4M540sBmCjBxlYKi7Rnytjiw0nGP_gHqEismSdjQXJ73q2dKmuwMZey-1YJ3n0ie83Hd9MDjBOO-DXMhkHgzxg1drmipxbZCwwRxQwy2Y2NSXvJyTGjcgaCgYKAR0SARcSFQHGX2Mi7KDECUAAZyyjbnTyO4D_jw0221';
const token = ScriptApp.getOAuthToken();
const SPORTS_CLUB_ID = 'herkley';
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxoFh3qEGQmThae2LXVu28mv1we4crmdLCpYrEyead5z6aTPrN9tfKlrjJsiBSyFSkW/exec';


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


function testGetMembersApi() {
  const options = {
    method: 'get',
    headers: {
      'Authorization': token
    },
    muteHttpExceptions: true
  };
  // Build query string with authorization in the query itself
  const query = `?action=getMembers&sportsClubId=${encodeURIComponent(SPORTS_CLUB_ID)}&authorization=${encodeURIComponent(token)}`;
  const response = UrlFetchApp.fetch(API_BASE_URL + query, options);
  Logger.log('REST response:');
  Logger.log(response.getContentText());
}

function getMembers() {
  // Extract the actual token string from the 'Bearer' prefix
  const accessToken = token.split(' ')[1]; // Splits "Bearer XXXXX" into ["Bearer", "XXXXX"] and takes the second part

  // Construct the URL with parameters
  // Note: We are using the predefined API_BASE_URL and SPORTS_CLUB_ID
  const url = `${API_BASE_URL}?sportsClubId=${SPORTS_CLUB_ID}&action=getMembers&authorization=${token}`;

  // Set up the options for the HTTP request, including the Authorization header
  const options = {
    'method': 'get', // Use 'get' for GET requests
    'headers': {
      'Authorization': `Bearer ${accessToken}` // Use the extracted accessToken
    },
    'muteHttpExceptions': true // Important to catch errors and inspect response
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    console.log(responseBody);

    if (responseCode === 200) {
      // Assuming the response is JSON, parse it
      return JSON.parse(responseBody);
    } else {
      console.error(`Error fetching member data: HTTP ${responseCode} - ${responseBody}`);
      return null;
    }
  } catch (e) {
    console.error(`An error occurred: ${e.toString()}`);
    return null;
  }
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

function printToken() {
  Logger.log(ScriptApp.getOAuthToken());
}