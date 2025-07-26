/**
 * Functions for managing members in the Sports Membership Management App
 * Created: May 25, 2025
 */

/**
 * Adds a new member to the system
 * 
 * @param {Object} memberData - Object containing member details
 * @return {string} ID of the newly created member
 */
function addMember(memberData) {
  const ss = memberData.context.spreadsheet;
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  
  // Generate sequential ID
  let memberId;
  if (membersSheet.getLastRow() <= 1) {
    // Sheet is empty or only has headers, start with ID 1
    memberId = '1';
  } else {
    // Get all existing member IDs
    const existingIds = membersSheet.getRange(2, MEMBERS_COLUMNS.ID + 1, membersSheet.getLastRow() - 1, 1).getValues();
    let maxIdNumber = 0;
    
    // Find the maximum numeric part of existing IDs
    for (let i = 0; i < existingIds.length; i++) {
      const idStr = existingIds[i][0];
      if (idStr) {
        // Try to parse the ID as a number directly
        const idNumber = parseInt(idStr, 10);
        if (!isNaN(idNumber) && idNumber > maxIdNumber) {
          maxIdNumber = idNumber;
        }
      }
    }
    
    // Increment the highest ID
    memberId = (maxIdNumber + 1).toString();
  }
  
  // Prepare the data row
  const newRow = [
    memberId,
    memberData.firstName,
    memberData.lastName,
    memberData.email,
    memberData.phone,
    memberData.place || '',
    memberData.joinDate || new Date(),
    memberData.status || MEMBER_STATUS.ACTIVE,
    memberData.expiryDate || '',
    memberData.notes || ''
  ];
  
  // Add the new row to the sheet
  membersSheet.appendRow(newRow);
  
  // Format the new row
  const lastRow = membersSheet.getLastRow();
  membersSheet.getRange(lastRow, MEMBERS_COLUMNS.JOIN_DATE + 1).setNumberFormat('yyyy-mm-dd');
  if (memberData.expiryDate) {
    membersSheet.getRange(lastRow, MEMBERS_COLUMNS.EXPIRY_DATE + 1).setNumberFormat('yyyy-mm-dd');
  }
  
  return memberId;
}

/**
 * Updates an existing member's information
 * 
 * @param {string} memberId - ID of the member to update
 * @param {Object} updatedData - Object containing updated member details
 * @return {boolean} True if update was successful, false otherwise
 */
function updateMember(memberId, updatedData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  
  // Find the row with the member ID
  const memberData = membersSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < memberData.length; i++) {
    if (memberData[i][MEMBERS_COLUMNS.ID] === memberId) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return false; // Member not found
  }
  
  // Update only the fields that are provided
  if (updatedData.firstName !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.FIRST_NAME + 1).setValue(updatedData.firstName);
  }
  
  if (updatedData.lastName !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.LAST_NAME + 1).setValue(updatedData.lastName);
  }
  
  if (updatedData.email !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.EMAIL + 1).setValue(updatedData.email);
  }
  
  if (updatedData.phone !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.PHONE + 1).setValue(updatedData.phone);
  }

  if (updatedData.place !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.PLACE + 1).setValue(updatedData.place);
  }

  if (updatedData.joinDate !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.JOIN_DATE + 1).setValue(updatedData.joinDate);
  }

  if (updatedData.status !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.STATUS + 1).setValue(updatedData.status);
  }

  if (updatedData.expiryDate !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.EXPIRY_DATE + 1).setValue(updatedData.expiryDate);
  }

  if (updatedData.notes !== undefined) {
    membersSheet.getRange(rowIndex, MEMBERS_COLUMNS.NOTES + 1).setValue(updatedData.notes);
  }
  
  return true;
}

/**
 * Gets a member by ID
 * 
 * @param {string} memberId - ID of the member to retrieve
 * @return {Object|null} Member object or null if not found
 */
function getMemberById(memberId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  
  // Find the row with the member ID
  const memberData = membersSheet.getDataRange().getValues();
  let memberRow = null;
  
  for (let i = 1; i < memberData.length; i++) {
    if (memberData[i][MEMBERS_COLUMNS.ID] === memberId) {
      memberRow = memberData[i];
      break;
    }
  }
  
  if (!memberRow) {
    return null; // Member not found
  }
  
  // Convert row data to a member object
  return {
    id: memberRow[MEMBERS_COLUMNS.ID],
    firstName: memberRow[MEMBERS_COLUMNS.FIRST_NAME],
    lastName: memberRow[MEMBERS_COLUMNS.LAST_NAME],
    email: memberRow[MEMBERS_COLUMNS.EMAIL],
    phone: memberRow[MEMBERS_COLUMNS.PHONE],
    place: memberRow[MEMBERS_COLUMNS.PLACE],
    joinDate: memberRow[MEMBERS_COLUMNS.JOIN_DATE],
    status: memberRow[MEMBERS_COLUMNS.STATUS],
    expiryDate: memberRow[MEMBERS_COLUMNS.EXPIRY_DATE],
    notes: memberRow[MEMBERS_COLUMNS.NOTES]
  };
}

/**
 * Gets all members, optionally filtered by status or sport
 * 
 * @param {Object} filters - Optional filters (status, sport)
 * @return {Array} Array of member objects
 */
function getAllMembers(filters = {}, payload) {
  Logger.log('getting all members');
  const ss = payload.context.spreadsheet;
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  
  // Get all data except header row
  const memberData = membersSheet.getDataRange().getValues();
  const members = [];
  
  for (let i = 1; i < memberData.length; i++) {
    const row = memberData[i];
    
    // Skip empty rows
    if (!row[MEMBERS_COLUMNS.ID]) {
      continue;
    }
    
    // Apply filters
    if (filters.status && row[MEMBERS_COLUMNS.STATUS] !== filters.status) {
      continue;
    }
    
    // Convert row data to a member object
    members.push({
      id: row[MEMBERS_COLUMNS.ID],
      firstName: row[MEMBERS_COLUMNS.FIRST_NAME],
      lastName: row[MEMBERS_COLUMNS.LAST_NAME],
      email: row[MEMBERS_COLUMNS.EMAIL],
      phone: row[MEMBERS_COLUMNS.PHONE],
      place: row[MEMBERS_COLUMNS.PLACE],
      joinDate: row[MEMBERS_COLUMNS.JOIN_DATE],
      status: row[MEMBERS_COLUMNS.STATUS],
      expiryDate: row[MEMBERS_COLUMNS.EXPIRY_DATE],
      notes: row[MEMBERS_COLUMNS.NOTES]
    });
  }
  
  return members;
}

/**
 * Deletes a member by ID
 * 
 * @param {string} memberId - ID of the member to delete
 * @return {boolean} True if deletion was successful, false otherwise
 */
function deleteMember(memberId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  
  // Find the row with the member ID
  const memberData = membersSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < memberData.length; i++) {
    if (memberData[i][MEMBERS_COLUMNS.ID] === memberId) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return false; // Member not found
  }
  
  // Delete the row
  membersSheet.deleteRow(rowIndex);
  
  return true;
}

/**
 * Searches for members based on a search term
 * Searches in name, email, and phone fields
 * 
 * @param {string} searchTerm - Term to search for
 * @return {Array} Array of matching member objects
 */
function searchMembers(searchTerm) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  
  // Get all data except header row
  const memberData = membersSheet.getDataRange().getValues();
  const members = [];
  const searchTermLower = searchTerm.toLowerCase();
  
  for (let i = 1; i < memberData.length; i++) {
    const row = memberData[i];
    
    // Skip empty rows
    if (!row[MEMBERS_COLUMNS.ID]) {
      continue;
    }
    
    // Check if the search term is in any of the searchable fields
    const firstName = row[MEMBERS_COLUMNS.FIRST_NAME].toString().toLowerCase();
    const lastName = row[MEMBERS_COLUMNS.LAST_NAME].toString().toLowerCase();
    const email = row[MEMBERS_COLUMNS.EMAIL].toString().toLowerCase();
    const phone = row[MEMBERS_COLUMNS.PHONE].toString().toLowerCase();
    
    if (firstName.includes(searchTermLower) || 
        lastName.includes(searchTermLower) || 
        email.includes(searchTermLower) || 
        phone.includes(searchTermLower) ||
        (firstName + ' ' + lastName).includes(searchTermLower)) {
      
      // Convert row data to a member object
      members.push({
        id: row[MEMBERS_COLUMNS.ID],
        firstName: row[MEMBERS_COLUMNS.FIRST_NAME],
        lastName: row[MEMBERS_COLUMNS.LAST_NAME],
        email: row[MEMBERS_COLUMNS.EMAIL],
        phone: row[MEMBERS_COLUMNS.PHONE],
        place: row[MEMBERS_COLUMNS.PLACE],
        joinDate: row[MEMBERS_COLUMNS.JOIN_DATE],
        status: row[MEMBERS_COLUMNS.STATUS],
        expiryDate: row[MEMBERS_COLUMNS.EXPIRY_DATE],
        notes: row[MEMBERS_COLUMNS.NOTES]
      });
    }
  }
  
  return members;
}

/**
 * Imports members from CSV data
 * 
 * @param {string} csvData - CSV data with headers
 * @return {Object} Import results with success count and errors
 */
function importMembers(csvData) {
  const result = {
    success: 0,
    errors: []
  };
  
  // Parse CSV data
  const rows = Utilities.parseCsv(csvData);
  
  // Validate headers
  const expectedHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'Join Date', 'Status', 'Sports', 'Notes'];
  const headers = rows[0];
  
  // Check if required headers are present
  const requiredHeaders = ['First Name', 'Phone'];
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      result.errors.push(`Required header "${header}" is missing.`);
      return result;
    }
  }
  
  // Map headers to indices
  const headerIndices = {};
  for (let i = 0; i < headers.length; i++) {
    headerIndices[headers[i]] = i;
  }
  
  // Process each row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows
    if (row.length === 0 || !row[headerIndices['First Name']]) {
      continue;
    }
    
    try {
      // Prepare member data
      const memberData = {
        firstName: row[headerIndices['First Name']],
        lastName: headerIndices['Last Name'] !== undefined ? (row[headerIndices['Last Name']] || '') : '',
        email: headerIndices['Email'] !== undefined ? (row[headerIndices['Email']] || '') : '',
        phone: row[headerIndices['Phone']],
        place: headerIndices['Place'] !== undefined ? (row[headerIndices['Place']] || '') : '',
        joinDate: headerIndices['Join Date'] !== undefined ? new Date(row[headerIndices['Join Date']]) : new Date(),
        status: headerIndices['Status'] !== undefined ? row[headerIndices['Status']] : MEMBER_STATUS.ACTIVE,
        expiryDate: headerIndices['Expiry Date'] !== undefined ? new Date(row[headerIndices['Expiry Date']]) : '',
        notes: headerIndices['Notes'] !== undefined ? row[headerIndices['Notes']] : ''
      };
      
      // Add the member
      addMember(memberData);
      result.success++;
    } catch (error) {
      result.errors.push(`Error importing row ${i + 1}: ${error.message}`);
    }
  }
  
  return result;
}