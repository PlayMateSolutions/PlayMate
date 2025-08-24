/**
 * API Service for the Sports Membership Management App
 * Created: May 25, 2025
 *
 * This file contains functions that expose the app's functionality as web APIs
 * that can be called from external applications like the Ionic client.
 */

// Global lock to prevent concurrent access issues
const LOCK = LockService.getScriptLock();

/**
 * Initialize the web app service
 */
function doGet(e) {
  console.log('received get request')
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Main request handler for both GET and POST requests
 *
 * @param {Object} e - The request object from doGet or doPost
 * @param {string} method - 'GET' or 'POST'
 * @return {TextOutput} JSON response
 */
function handleRequest(e, method) {
  try {
    let action, sportsClubId, payload;
    Logger.log(method);
    Logger.log(JSON.stringify(e));

    if (method === 'POST' && e.parameter) {
      // const request = JSON.parse(e.postData.contents);
      const request = e.parameter;
      action = request.action;
      sportsClubId = request.sportsClubId;
      payload = JSON.parse(e.postData.contents) || {};
    } else if (method === 'GET' && e.parameter) {
      const request = e.parameter;
      Logger.log('GET parameter: ' + request);
      Logger.log('GET request: ' + JSON.stringify(request));
      action = request.action;
      sportsClubId = request.sportsClubId;
      payload = request ?? {};
      Logger.log('GET request payload: ' + JSON.stringify(payload));
    } else {
      return createErrorResponse('Invalid request format', 400);
    }

    let spreadsheet = null;
    let userEmail = null;
    let authResult = { success: true };

    // List of public actions that only need basic auth token
    const publicActions = ["getMember"];
    if (!publicActions.includes(action)) {
      const token = getBearerToken(e);
      Logger.log('token ' + token)
      if (sportsClubId) {
        spreadsheet = getSpreadsheetByClubId(sportsClubId);
        if (!spreadsheet) {
          return createErrorResponse(`Sports club not found: ${sportsClubId}`, 404);
        }
      } else {
        spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      }
      authResult = authorizeUserWithSheet(token, spreadsheet, sportsClubId);
      if (!authResult.success) {
        return createErrorResponse(authResult.message, 403);
      }
      userEmail = authResult.userEmail;
    }

    // Add context to payload for handlers
    payload.context = {
      spreadsheet,
      userEmail,
      sportsClubId
    };

    // Route the request to the appropriate handler based on the action
    let result;
    switch (action) {
      // Member endpoints
      case "getMembers":
        result = handleGetMembers(payload);
        break;
      case "getMemberByPhoneNo":
        result = getMemberByPhoneNo(payload);
        break;
      case "addMember":
        result = handleAddMember(payload);
        break;
      case "updateMember":
        result = handleUpdateMember(payload);
        break;

      // Attendance endpoints
      case "recordBulkAttendance":
        result = handleRecordBulkAttendance(payload);
        break;
      case "getAttendance":
        result = handleGetAttendance(payload);
        break;

      // Payment endpoints
      case "recordPayment":
        result = handleRecordPayment(payload);
        break;
      case "getPayments":
        result = handleGetPayments(payload);
        break;
      case "getMemberPayments":
        result = handleGetMemberPayments(payload);
        break;
      case "getPaymentSummary":
        result = handleGetPaymentSummary(payload);
        break;
      case "getPaymentStatus":
        result = handleGetPaymentStatus(payload);
        break;

      // Sports endpoints
      case "getSports":
        result = handleGetSports(payload);
        break;
      case "addSport":
        result = handleAddSport(payload);
        break;
      case "updateSport":
        result = handleUpdateSport(payload);
        break;

      // Settings endpoints
      case "getSettings":
        result = handleGetSettings(payload);
        break;
      case "updateSettings":
        result = handleUpdateSettings(payload);
        break;

      // Sports Club endpoints
      case "getSportsClubs":
        result = handleGetSportsClubs(payload);
        break;
      case "getSportsClub":
        result = handleGetSportsClub(payload);
        break;
      case "addSportsClub":
        result = handleAddSportsClub(payload);
        break;
      case "updateSportsClub":
        result = handleUpdateSportsClub(payload);
        break;

      // If action is not recognized
      default:
        return createErrorResponse("Unknown action: " + action, 400);
    }

    // Return successful response
    return createSuccessResponse(result);
/**
 * Handle bulk attendance request
 * @param {Object} payload - Should contain attendanceList: Array<Object>
 * @return {Object} Summary of results
 */
function handleRecordBulkAttendance(payload) {
  if (!Array.isArray(payload.attendanceList)) {
    throw new Error("attendanceList (array) is required");
  }

  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error("Failed to acquire lock. The system is busy. Please try again.");
  }

  try {
    // Pass context to each record
    const context = payload.context;
    const results = recordBulkAttendance(payload.attendanceList, context);
    return results;
  } finally {
    LOCK.releaseLock();
  }
}
  } catch (error) {
    // Log the error and return an error response
    console.error("API error:", error);
    return createErrorResponse(error.message, 500);
  }
}


function getBearerToken(e) {
  try {
    Logger.log(e)
    var headers = e.parameter; // Google Apps Script does not provide a direct headers object
    if (!headers) {
      headers = e;
    }
    var authorization = headers["Authorization"] || headers["authorization"];

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return null;
    }

    return authorization.replace("Bearer ", "").trim(); // Extract token after "Bearer "
  } catch (error) {
    Logger.log("Error extracting token: " + error);
    return null;
  }
}

/**
 * Create a success response
 *
 * @param {Object} data - The data to include in the response
 * @return {TextOutput} JSON response
 */
function createSuccessResponse(data) {
  const response = {
    status: "success",
    data: data,
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Create an error response
 *
 * @param {string} message - The error message
 * @param {number} code - The HTTP status code
 * @return {TextOutput} JSON response
 */
function createErrorResponse(message, code) {
  const response = {
    status: "error",
    error: {
      code: code,
      message: message,
    },
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Validate auth token (implement your own logic)
 *
 * @param {string} token - The auth token to validate
 * @return {boolean} True if token is valid
 */
function validateAuthToken(token) {
  // For development, return true
  // TODO: Implement proper authentication logic
  if (!token) return false;

  const settings = getSettings();
  const validToken = settings.apitoken;

  // If no token is set in settings, use a development token
  if (!validToken) {
    return token === "dev-token-playmate-api";
  }

  return token === validToken;
}

/**
 * Authorize user for sensitive actions using OAuth and sheet access
 * @param {string} token - OAuth Bearer token
 * @param {Spreadsheet} spreadsheet - The active spreadsheet
 * @param {string} sportsClubId - Optional sports club ID
 * @return {Object} { success: boolean, userEmail?: string, message?: string }
 */
function authorizeUserWithSheet(token, spreadsheet, sportsClubId = null) {
  const tokenValidation = validateOAuthToken(token);
  if (!tokenValidation.valid) {
    return {
      success: false,
      message: "Invalid or expired OAuth token: " + tokenValidation.error,
    };
  }
  console.log(JSON.stringify(tokenValidation));
  const userEmail = tokenValidation.email;
  console.log("User email from token: " + userEmail);

  // If sportsClubId is provided, validate club access
  if (sportsClubId) {
    if (!validateClubAccess(sportsClubId, userEmail)) {
      return {
        success: false,
        message: "Unauthorized: You do not have access to this club",
      };
    }
    // Club access validated, no need to check spreadsheet access
    return { success: true, userEmail };
  }
  
  // No sportsClubId provided, fall back to spreadsheet access check
  const viewers = spreadsheet.getViewers().map((user) => user.getEmail());
  const editors = spreadsheet.getEditors().map((user) => user.getEmail());
  if (!viewers.includes(userEmail) && !editors.includes(userEmail)) {
    return {
      success: false,
      message: "Unauthorized: You do not have access to this sheet",
    };
  }
  return { success: true, userEmail };
}

function validateOAuthToken(token) {
  Logger.log("Validating OAuth token: " + token);
  var url =
    "https://www.googleapis.com/oauth2/v3/tokeninfo";

  try {
    var options = {
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(url + "?access_token=" + encodeURIComponent(token), options);
    var responseCode = response.getResponseCode();
    var json = {};
    try {
      json = JSON.parse(response.getContentText());
    } catch (parseError) {
      Logger.log("Error parsing tokeninfo response: " + parseError);
    }
    console.log(response.getContentText());
    console.log(json);

    if (responseCode !== 200) {
      Logger.log("Invalid Token: HTTP " + responseCode);
      return { valid: false, error: (json.error_description || json.error || ("HTTP " + responseCode)) };
    }

    if (json.error) {
      Logger.log("Invalid Token: " + json.error_description);
      return { valid: false, error: json.error_description };
    }

    Logger.log("Valid Token for: " + json.email);
    return {
      valid: true,
      email: json.email,
      scope: json.scope,
      expires_in: json.expires_in,
    };
  } catch (error) {
    Logger.log("Error validating token: " + error);
    return { valid: false, error: "Error occurred during validation" };
  }
}

// ----------------------
// Member API Handlers
// ----------------------

/**
 * Handle get members request
 *
 * @param {Object} payload - Request payload with optional filters
 * @return {Object} List of members
 */
function handleGetMembers(payload) {
  return getAllMembers(payload);
}

/**
 * Handle get single member request
 *
 * @param {Object} payload - Request payload with memberId
 * @return {Object} Member details
 */
function getMemberByPhoneNo(payload) {
  if (!payload.phoneNumber) {
    throw new Error("Phone number is required");
  }

  const member = getMemberByPhoneNo(payload);
  if (!member) {
    throw new Error("Member not found");
  }

  return member;
}

/**
 * Handle add member request
 *
 * @param {Object} payload - Member data
 * @return {Object} Result with new member ID
 */
function handleAddMember(payload) {
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error(
      "Failed to acquire lock. The system is busy. Please try again."
    );
  }

  try {
    const memberId = addMember(payload);
    return { memberId: memberId };
  } finally {
    LOCK.releaseLock();
  }
}

/**
 * Handle update member request
 *
 * @param {Object} payload - Updated member data with memberId
 * @return {Object} Result indicating success
 */
function handleUpdateMember(payload) {  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error(
      "Failed to acquire lock. The system is busy. Please try again."
    );
  }

  try {
    const success = updateMember(payload.ID, payload);
    if (!success) {
      throw new Error("Member not found or update failed");
    }
    return { success: true };
  } finally {
    LOCK.releaseLock();
  }
}

// ----------------------
// Attendance API Handlers
// ----------------------

/**
 * Handle get attendance records request
 *
 * @param {Object} payload - Request with optional filters
 * @return {Object} List of attendance records
 */
function handleGetAttendance(payload) {
  Logger.log("handleGetAttendance - Payload: " + JSON.stringify(payload));
  const filters = payload.filters || {};
  // Merge filters with the context to ensure spreadsheet is available
  return getAttendanceRecords({
    ...payload,
    context: payload.context
  });
}

// ----------------------
// Payment API Handlers
// ----------------------

/**
 * Handle record payment request
 *
 * @param {Object} payload - Payment data
 * @return {Object} Result with new payment ID
 */
function handleRecordPayment(payload) {
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error(
      "Failed to acquire lock. The system is busy. Please try again."
    );
  }

  try {
    const payment = recordPayment(payload);
    return payment;
  } finally {
    LOCK.releaseLock();
  }
}

/**
 * Handle get payments request
 *
 * @param {Object} payload - Request with optional filters
 * @return {Object} List of payment records
 */
function handleGetPayments(payload) {
  const filters = payload.filters || {};

  // Convert date strings to Date objects if present
  if (filters.startDate) {
    filters.startDate = new Date(filters.startDate);
  }
  if (filters.endDate) {
    filters.endDate = new Date(filters.endDate);
  }

  return getPaymentRecords(filters);
}

/**
 * Handle get member payments request
 *
 * @param {Object} payload - Request with memberId and optional filters
 * @return {Object} Member's payment summary
 */
function handleGetMemberPayments(payload) {
  if (!payload.memberId) {
    throw new Error("Member ID is required");
  }

  const options = payload.options || {};

  // Convert date strings to Date objects if present
  if (options.startDate) {
    options.startDate = new Date(options.startDate);
  }
  if (options.endDate) {
    options.endDate = new Date(options.endDate);
  }

  return getMemberPaymentSummary(payload.memberId, options);
}

/**
 * Handle get payment summary request
 *
 * @param {Object} payload - Request with optional filters
 * @return {Object} Payment summary statistics
 */
function handleGetPaymentSummary(payload) {
  const options = payload.options || {};

  // Convert date strings to Date objects if present
  if (options.startDate) {
    options.startDate = new Date(options.startDate);
  }
  if (options.endDate) {
    options.endDate = new Date(options.endDate);
  }

  return getOverallPaymentSummary(options);
}

/**
 * Handle get payment status request
 *
 * @param {Object} payload - Request with optional sport filter
 * @return {Object} List of members with payment status
 */
function handleGetPaymentStatus(payload) {
  const sport = payload.sport || null;
  return getMembersWithPaymentStatus(sport);
}

// ----------------------
// Sports API Handlers
// ----------------------

/**
 * Handle get sports request
 *
 * @param {Object} payload - Request with optional activeOnly flag
 * @return {Object} List of sports
 */
function handleGetSports(payload) {
  const activeOnly = payload.activeOnly !== false; // Default to true
  return getAllSports(activeOnly);
}

/**
 * Handle add sport request
 *
 * @param {Object} payload - Sport data
 * @return {Object} Result indicating success
 */
function handleAddSport(payload) {
  if (!payload.name) {
    throw new Error("Sport name is required");
  }

  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error(
      "Failed to acquire lock. The system is busy. Please try again."
    );
  }

  try {
    const success = addSport(payload);
    if (!success) {
      throw new Error("Sport already exists or addition failed");
    }
    return { success: true };
  } finally {
    LOCK.releaseLock();
  }
}

/**
 * Handle update sport request
 *
 * @param {Object} payload - Updated sport data with sportName
 * @return {Object} Result indicating success
 */
function handleUpdateSport(payload) {
  if (!payload.sportName) {
    throw new Error("Sport name is required");
  }

  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error(
      "Failed to acquire lock. The system is busy. Please try again."
    );
  }

  try {
    const success = updateSport(payload.sportName, payload);
    if (!success) {
      throw new Error("Sport not found or update failed");
    }
    return { success: true };
  } finally {
    LOCK.releaseLock();
  }
}

// ----------------------
// Settings API Handlers
// ----------------------

/**
 * Handle get settings request
 *
 * @param {Object} payload - Empty payload
 * @return {Object} App settings
 */
function handleGetSettings(payload) {
  return getSettings(payload);
}

/**
 * Handle update settings request
 *
 * @param {Object} payload - Updated settings
 * @return {Object} Result indicating success
 */
function handleUpdateSettings(payload) {
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error(
      "Failed to acquire lock. The system is busy. Please try again."
    );
  }

  try {
    // Update each setting
    for (const key in payload) {
      updateSetting(key, payload[key]);
    }
    return { success: true };
  } finally {
    LOCK.releaseLock();
  }
}

// ----------------------
// Sports Club API Handlers
// ----------------------

/**
 * Handle get sports clubs request
 * Returns list of all active sports clubs
 *
 * @param {Object} payload - Request payload
 * @return {Object} Response object with clubs array
 */
function handleGetSportsClubs(payload) {
  try {
    const clubs = getAllSportsClubs();
    return {
      success: true,
      clubs: clubs
    };
  } catch (e) {
    throw new Error('Failed to get sports clubs: ' + e.message);
  }
}

/**
 * Handle get sports club by ID request
 *
 * @param {Object} payload - Request payload with sportsClubId
 * @return {Object} Response object with club data
 */
function handleGetSportsClub(payload) {
  try {
    const club = getClubById(payload.sportsClubId);
    if (!club) {
      throw new Error('Sports club not found');
    }
    return {
      success: true,
      club: club
    };
  } catch (e) {
    throw new Error('Failed to get sports club: ' + e.message);
  }
}

/**
 * Handle add sports club request
 *
 * @param {Object} payload - Request payload with club data
 * @return {Object} Response object with new club ID
 */
function handleAddSportsClub(payload) {
  try {
    const clubId = addSportsClub(payload.clubData);
    if (!clubId) {
      throw new Error('Failed to create sports club');
    }
    return {
      success: true,
      clubId: clubId
    };
  } catch (e) {
    throw new Error('Failed to add sports club: ' + e.message);
  }
}

/**
 * Handle update sports club request
 *
 * @param {Object} payload - Request payload with sportsClubId and updated data
 * @return {Object} Response object indicating success
 */
function handleUpdateSportsClub(payload) {
  try {
    const success = updateSportsClub(payload.sportsClubId, payload.clubData);
    if (!success) {
      throw new Error('Sports club not found');
    }
    return {
      success: true
    };
  } catch (e) {
    throw new Error('Failed to update sports club: ' + e.message);
  }
}
