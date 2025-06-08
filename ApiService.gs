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
function doGet(request) {
  return handleRequest(request);
}

/**
 * Handle POST requests (for data mutations)
 */
function doPost(request) {
  return handleRequest(request);
}

/**
 * Main request handler for both GET and POST requests
 * 
 * @param {Object} request - The request object from doGet or doPost
 * @return {TextOutput} JSON response
 */
function handleRequest(request) {
  try {
    // Parse the request parameters
    const action = request.parameter.action;
    const payload = request.parameter.payload ? JSON.parse(request.parameter.payload) : {};
    const authToken = request.parameter.authToken;
    
    // Validate auth token (implement your own auth logic)
    if (!validateAuthToken(authToken)) {
      return createErrorResponse('Authentication failed', 401);
    }
    
    // Route the request to the appropriate handler based on the action
    let result;
    switch (action) {
      // Member endpoints
      case 'getMembers':
        result = handleGetMembers(payload);
        break;
      case 'getMember':
        result = handleGetMember(payload);
        break;
      case 'addMember':
        result = handleAddMember(payload);
        break;
      case 'updateMember':
        result = handleUpdateMember(payload);
        break;
      case 'deleteMember':
        result = handleDeleteMember(payload);
        break;
      case 'searchMembers':
        result = handleSearchMembers(payload);
        break;
        
      // Attendance endpoints
      case 'recordAttendance':
        result = handleRecordAttendance(payload);
        break;
      case 'getAttendance':
        result = handleGetAttendance(payload);
        break;
      case 'getMemberAttendance':
        result = handleGetMemberAttendance(payload);
        break;
      case 'getAttendanceSummary':
        result = handleGetAttendanceSummary(payload);
        break;
      case 'updateAttendance':
        result = handleUpdateAttendance(payload);
        break;
      
      // Payment endpoints
      case 'recordPayment':
        result = handleRecordPayment(payload);
        break;
      case 'getPayments':
        result = handleGetPayments(payload);
        break;
      case 'getMemberPayments':
        result = handleGetMemberPayments(payload);
        break;
      case 'getPaymentSummary':
        result = handleGetPaymentSummary(payload);
        break;
      case 'getPaymentStatus':
        result = handleGetPaymentStatus(payload);
        break;
      
      // Sports endpoints
      case 'getSports':
        result = handleGetSports(payload);
        break;
      case 'addSport':
        result = handleAddSport(payload);
        break;
      case 'updateSport':
        result = handleUpdateSport(payload);
        break;
      
      // Settings endpoints
      case 'getSettings':
        result = handleGetSettings(payload);
        break;
      case 'updateSettings':
        result = handleUpdateSettings(payload);
        break;
      
      // If action is not recognized
      default:
        return createErrorResponse('Unknown action: ' + action, 400);
    }
    
    // Return successful response
    return createSuccessResponse(result);
  } catch (error) {
    // Log the error and return an error response
    console.error('API error:', error);
    return createErrorResponse(error.message, 500);
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
    status: 'success',
    data: data
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
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
    status: 'error',
    error: {
      code: code,
      message: message
    }
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
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
    return token === 'dev-token-playmate-api';
  }
  
  return token === validToken;
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
  const filters = payload.filters || {};
  return getAllMembers(filters);
}

/**
 * Handle get single member request
 * 
 * @param {Object} payload - Request payload with memberId
 * @return {Object} Member details
 */
function handleGetMember(payload) {
  if (!payload.memberId) {
    throw new Error('Member ID is required');
  }
  
  const member = getMemberById(payload.memberId);
  if (!member) {
    throw new Error('Member not found');
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
  if (!payload.firstName || !payload.lastName || !payload.email) {
    throw new Error('First name, last name, and email are required');
  }
  
  // Convert date strings to Date objects if present
  if (payload.joinDate) {
    payload.joinDate = new Date(payload.joinDate);
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
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
  if (!payload.memberId) {
    throw new Error('Member ID is required');
  }
  
  // Convert date strings to Date objects if present
  if (payload.joinDate) {
    payload.joinDate = new Date(payload.joinDate);
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
  }
  
  try {
    const success = updateMember(payload.memberId, payload);
    if (!success) {
      throw new Error('Member not found or update failed');
    }
    return { success: true };
  } finally {
    LOCK.releaseLock();
  }
}

/**
 * Handle delete member request
 * 
 * @param {Object} payload - Request with memberId
 * @return {Object} Result indicating success
 */
function handleDeleteMember(payload) {
  if (!payload.memberId) {
    throw new Error('Member ID is required');
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
  }
  
  try {
    const success = deleteMember(payload.memberId);
    if (!success) {
      throw new Error('Member not found or deletion failed');
    }
    return { success: true };
  } finally {
    LOCK.releaseLock();
  }
}

/**
 * Handle search members request
 * 
 * @param {Object} payload - Request with search term
 * @return {Object} List of matching members
 */
function handleSearchMembers(payload) {
  if (!payload.searchTerm) {
    throw new Error('Search term is required');
  }
  
  return searchMembers(payload.searchTerm);
}

// ----------------------
// Attendance API Handlers
// ----------------------

/**
 * Handle record attendance request
 * 
 * @param {Object} payload - Attendance data
 * @return {Object} Result with new attendance ID
 */
function handleRecordAttendance(payload) {
  if (!payload.memberId || !payload.sport) {
    throw new Error('Member ID and sport are required');
  }
  
  // Convert date strings to Date objects if present
  if (payload.date) {
    payload.date = new Date(payload.date);
  }
  if (payload.checkInTime) {
    payload.checkInTime = new Date(payload.checkInTime);
  }
  if (payload.checkOutTime) {
    payload.checkOutTime = new Date(payload.checkOutTime);
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
  }
  
  try {
    const attendanceId = recordAttendance(payload);
    return { attendanceId: attendanceId };
  } finally {
    LOCK.releaseLock();
  }
}

/**
 * Handle get attendance records request
 * 
 * @param {Object} payload - Request with optional filters
 * @return {Object} List of attendance records
 */
function handleGetAttendance(payload) {
  const filters = payload.filters || {};
  
  // Convert date strings to Date objects if present
  if (filters.startDate) {
    filters.startDate = new Date(filters.startDate);
  }
  if (filters.endDate) {
    filters.endDate = new Date(filters.endDate);
  }
  
  return getAttendanceRecords(filters);
}

/**
 * Handle get member attendance request
 * 
 * @param {Object} payload - Request with memberId and optional date range
 * @return {Object} Member's attendance records
 */
function handleGetMemberAttendance(payload) {
  if (!payload.memberId) {
    throw new Error('Member ID is required');
  }
  
  const options = payload.options || {};
  
  // Convert date strings to Date objects if present
  if (options.startDate) {
    options.startDate = new Date(options.startDate);
  }
  if (options.endDate) {
    options.endDate = new Date(options.endDate);
  }
  
  return getMemberAttendanceSummary(payload.memberId, options);
}

/**
 * Handle get attendance summary request
 * 
 * @param {Object} payload - Request with optional filters
 * @return {Object} Attendance summary statistics
 */
function handleGetAttendanceSummary(payload) {
  const options = payload.options || {};
  
  // Convert date strings to Date objects if present
  if (options.startDate) {
    options.startDate = new Date(options.startDate);
  }
  if (options.endDate) {
    options.endDate = new Date(options.endDate);
  }
  
  return getOverallAttendanceSummary(options);
}

/**
 * Handle update attendance request
 * 
 * @param {Object} payload - Updated attendance data with attendanceId
 * @return {Object} Result indicating success
 */
function handleUpdateAttendance(payload) {
  if (!payload.attendanceId) {
    throw new Error('Attendance ID is required');
  }
  
  // Convert date strings to Date objects if present
  if (payload.date) {
    payload.date = new Date(payload.date);
  }
  if (payload.checkInTime) {
    payload.checkInTime = new Date(payload.checkInTime);
  }
  if (payload.checkOutTime) {
    payload.checkOutTime = new Date(payload.checkOutTime);
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
  }
  
  try {
    const success = updateAttendance(payload.attendanceId, payload);
    if (!success) {
      throw new Error('Attendance record not found or update failed');
    }
    return { success: true };
  } finally {
    LOCK.releaseLock();
  }
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
  if (!payload.memberId || !payload.amount || !payload.sport) {
    throw new Error('Member ID, amount, and sport are required');
  }
  
  // Convert date strings to Date objects if present
  if (payload.date) {
    payload.date = new Date(payload.date);
  }
  if (payload.periodStart) {
    payload.periodStart = new Date(payload.periodStart);
  }
  if (payload.periodEnd) {
    payload.periodEnd = new Date(payload.periodEnd);
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
  }
  
  try {
    const paymentId = recordPayment(payload);
    return { paymentId: paymentId };
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
    throw new Error('Member ID is required');
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
    throw new Error('Sport name is required');
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
  }
  
  try {
    const success = addSport(payload);
    if (!success) {
      throw new Error('Sport already exists or addition failed');
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
    throw new Error('Sport name is required');
  }
  
  // Try to acquire lock to prevent concurrent writes
  if (!LOCK.tryLock(10000)) {
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
  }
  
  try {
    const success = updateSport(payload.sportName, payload);
    if (!success) {
      throw new Error('Sport not found or update failed');
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
  return getSettings();
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
    throw new Error('Failed to acquire lock. The system is busy. Please try again.');
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