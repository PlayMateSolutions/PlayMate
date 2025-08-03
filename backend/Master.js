/**
 * Functions for managing the master sheet with club information
 * Created: May 25, 2025
 */

// Master sheet name and columns
const MASTER_SHEET = {
  NAME: 'MasterClubs',
  COLUMNS: {
    ID: 0,
    NAME: 1,
    ADDRESS: 2,
    CONTACT_NUMBER: 3,
    OWNER_NAME: 4,
    GOOGLE_SHEET_ID: 5,
    EMAIL_ID: 6,
    ACTIVE: 7
  }
};

/**
 * Initializes the master sheet for sports clubs
 * This should be run manually once when setting up the master spreadsheet
 */
function initializeMasterSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Master Clubs sheet if it doesn't exist
  if (!ss.getSheetByName(MASTER_SHEET.NAME)) {
    const masterSheet = ss.insertSheet(MASTER_SHEET.NAME);
    const headers = [
      'Sports Club ID', 'Name', 'Address', 'Contact Number', 
      'Owner Name', 'Google Sheet ID', 'Email ID', 'Active'
    ];
    masterSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    masterSheet.setFrozenRows(1);
    masterSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
  }
}

/**
 * Gets the spreadsheet for a specific sports club
 * 
 * @param {string} sportsClubId - ID of the sports club
 * @return {Spreadsheet|null} Spreadsheet object or null if not found
 */
function getSpreadsheetByClubId(sportsClubId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(MASTER_SHEET.NAME);
  
  if (!masterSheet) {
    throw new Error('Master sheet not found. Please run initializeMasterSheet() first.');
  }
  
  // Get all data except header row
  const masterData = masterSheet.getDataRange().getValues();
  
  // Find the club
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    if (row[MASTER_SHEET.COLUMNS.ID] === sportsClubId && row[MASTER_SHEET.COLUMNS.ACTIVE] === 'Yes') {
      const sheetId = row[MASTER_SHEET.COLUMNS.GOOGLE_SHEET_ID];
      try {
        return SpreadsheetApp.openById(sheetId);
      } catch (e) {
        Logger.log('Error opening spreadsheet: ' + e.toString());
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Gets sports club information by ID
 * 
 * @param {string} sportsClubId - ID of the sports club
 * @return {Object|null} Club information object or null if not found
 */
function getClubById(sportsClubId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(MASTER_SHEET.NAME);
  
  if (!masterSheet) {
    throw new Error('Master sheet not found. Please run initializeMasterSheet() first.');
  }
  
  // Get all data except header row
  const masterData = masterSheet.getDataRange().getValues();
  
  // Find the club
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    if (row[MASTER_SHEET.COLUMNS.ID] === sportsClubId && row[MASTER_SHEET.COLUMNS.ACTIVE] === 'Yes') {
      return {
        id: row[MASTER_SHEET.COLUMNS.ID],
        name: row[MASTER_SHEET.COLUMNS.NAME],
        address: row[MASTER_SHEET.COLUMNS.ADDRESS],
        contactNumber: row[MASTER_SHEET.COLUMNS.CONTACT_NUMBER],
        ownerName: row[MASTER_SHEET.COLUMNS.OWNER_NAME],
        googleSheetId: row[MASTER_SHEET.COLUMNS.GOOGLE_SHEET_ID],
        emailId: row[MASTER_SHEET.COLUMNS.EMAIL_ID],
        active: row[MASTER_SHEET.COLUMNS.ACTIVE] === 'Yes'
      };
    }
  }
  
  return null;
}

/**
 * Adds a new sports club
 * 
 * @param {Object} clubData - Club data (name, address, contactNumber, ownerName, emailId)
 * @return {string|null} ID of the newly created club, or null if failed
 */
function addSportsClub(clubData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(MASTER_SHEET.NAME);
  
  if (!masterSheet) {
    throw new Error('Master sheet not found. Please run initializeMasterSheet() first.');
  }
  
  // Generate a unique ID for the club
  const clubId = 'SC' + new Date().getTime();
  
  // Create a new spreadsheet for the club
  const newSs = SpreadsheetApp.create(`PlayMate - ${clubData.name}`);
  
  try {
    // Initialize the new spreadsheet
    const initScript = `function initializeClub() {
      initializeSpreadsheet();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const settings = ss.getSheetByName('Settings');
      if (settings) {
        settings.getRange('B2').setValue('${clubData.name}');
        settings.getRange('B3').setValue('${clubData.emailId}');
      }
    }`;
    
    // Create script file in the new spreadsheet
    const scriptFile = DriveApp.getFileById(newSs.getId())
      .getParents().next()
      .createFile('Code.gs', initScript, 'application/vnd.google-apps.script');
    
    // Add row to master sheet
    masterSheet.appendRow([
      clubId,
      clubData.name,
      clubData.address,
      clubData.contactNumber,
      clubData.ownerName,
      newSs.getId(),
      clubData.emailId,
      'Yes'
    ]);
    
    return clubId;
  } catch (e) {
    Logger.log('Error creating club: ' + e.toString());
    // Try to clean up if something went wrong
    try {
      DriveApp.getFileById(newSs.getId()).setTrashed(true);
    } catch (e2) {
      Logger.log('Error cleaning up: ' + e2.toString());
    }
    return null;
  }
}

/**
 * Updates sports club information
 * 
 * @param {string} sportsClubId - ID of the sports club to update
 * @param {Object} updatedData - Updated club data
 * @return {boolean} True if update was successful
 */
function updateSportsClub(sportsClubId, updatedData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(MASTER_SHEET.NAME);
  
  if (!masterSheet) {
    throw new Error('Master sheet not found. Please run initializeMasterSheet() first.');
  }
  
  const masterData = masterSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Find the club
  for (let i = 1; i < masterData.length; i++) {
    if (masterData[i][MASTER_SHEET.COLUMNS.ID] === sportsClubId) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return false; // Club not found
  }
  
  // Update the row
  const row = masterData[rowIndex - 1];
  masterSheet.getRange(rowIndex, MASTER_SHEET.COLUMNS.NAME + 1).setValue(updatedData.name || row[MASTER_SHEET.COLUMNS.NAME]);
  masterSheet.getRange(rowIndex, MASTER_SHEET.COLUMNS.ADDRESS + 1).setValue(updatedData.address || row[MASTER_SHEET.COLUMNS.ADDRESS]);
  masterSheet.getRange(rowIndex, MASTER_SHEET.COLUMNS.CONTACT_NUMBER + 1).setValue(updatedData.contactNumber || row[MASTER_SHEET.COLUMNS.CONTACT_NUMBER]);
  masterSheet.getRange(rowIndex, MASTER_SHEET.COLUMNS.OWNER_NAME + 1).setValue(updatedData.ownerName || row[MASTER_SHEET.COLUMNS.OWNER_NAME]);
  masterSheet.getRange(rowIndex, MASTER_SHEET.COLUMNS.EMAIL_ID + 1).setValue(updatedData.emailId || row[MASTER_SHEET.COLUMNS.EMAIL_ID]);
  masterSheet.getRange(rowIndex, MASTER_SHEET.COLUMNS.ACTIVE + 1).setValue(updatedData.active === undefined ? row[MASTER_SHEET.COLUMNS.ACTIVE] : (updatedData.active ? 'Yes' : 'No'));
  
  return true;
}

/**
 * Gets all active sports clubs
 * 
 * @return {Array} Array of club objects
 */
function getAllSportsClubs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(MASTER_SHEET.NAME);
  
  if (!masterSheet) {
    throw new Error('Master sheet not found. Please run initializeMasterSheet() first.');
  }
  
  const masterData = masterSheet.getDataRange().getValues();
  const clubs = [];
  
  // Skip header row
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    if (row[MASTER_SHEET.COLUMNS.ACTIVE] === 'Yes') {
      clubs.push({
        id: row[MASTER_SHEET.COLUMNS.ID],
        name: row[MASTER_SHEET.COLUMNS.NAME],
        address: row[MASTER_SHEET.COLUMNS.ADDRESS],
        contactNumber: row[MASTER_SHEET.COLUMNS.CONTACT_NUMBER],
        ownerName: row[MASTER_SHEET.COLUMNS.OWNER_NAME],
        googleSheetId: row[MASTER_SHEET.COLUMNS.GOOGLE_SHEET_ID],
        emailId: row[MASTER_SHEET.COLUMNS.EMAIL_ID],
        active: true
      });
    }
  }
  
  return clubs;
}

/**
 * Validates if a user has access to a sports club
 * 
 * @param {string} sportsClubId - ID of the sports club
 * @param {string} userEmail - Email of the user to validate
 * @return {boolean} True if user has access
 */
function validateClubAccess(sportsClubId, userEmail) {
  const club = getClubById(sportsClubId);
  if (!club || !club.active) {
    return false;
  }
  
  // Check if user is club admin
  if (club.emailId === userEmail) {
    return true;
  }
  
  // Check if user has access to club's spreadsheet
  try {
    const ss = SpreadsheetApp.openById(club.googleSheetId);
    const viewers = ss.getViewers().map(user => user.getEmail());
    const editors = ss.getEditors().map(user => user.getEmail());
    return viewers.includes(userEmail) || editors.includes(userEmail);
  } catch (e) {
    Logger.log('Error checking spreadsheet access: ' + e.toString());
    return false;
  }
}
