/**
 * Utility functions for the Sports Membership Management App
 * Created: May 25, 2025
 */

/**
 * Generates a unique ID with a prefix
 * 
 * @param {string} prefix - Prefix for the ID (e.g., 'MEM', 'ATT', 'PAY')
 * @return {string} Unique ID
 */
function generateUniqueId(prefix) {
  const timestamp = new Date().getTime().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Gets settings from the Settings sheet
 * 
 * @param {Spreadsheet} ss - The spreadsheet to get settings from
 * @return {Object} Settings as key-value pairs
 */
function getSettings(ss = null) {
  // If no spreadsheet provided, try to get active spreadsheet
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  
  if (!settingsSheet) {
    return {
      clubName: 'PlayMate Sports Club',
      adminEmail: '',
      currency: 'USD',
      latePaymentDays: 5,
      version: '1.0.0'
    };
  }
  
  const settingsData = settingsSheet.getDataRange().getValues();
  const settings = {};
  
  // Skip header row
  for (let i = 1; i < settingsData.length; i++) {
    const [key, value] = settingsData[i];
    settings[key.toLowerCase().replace(/\s+/g, '')] = value;
  }
  
  return settings;
}

/**
 * Updates a setting in the Settings sheet
 * 
 * @param {string} key - Setting key
 * @param {string} value - Setting value
 * @param {Spreadsheet} ss - The spreadsheet to update settings in
 * @return {boolean} True if update was successful
 */
function updateSetting(key, value, ss = null) {
  // If no spreadsheet provided, try to get active spreadsheet
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  
  if (!settingsSheet) {
    return false;
  }
  
  const settingsData = settingsSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Find the setting
  for (let i = 1; i < settingsData.length; i++) {
    if (settingsData[i][0].toLowerCase().replace(/\s+/g, '') === key.toLowerCase().replace(/\s+/g, '')) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    // Setting doesn't exist, append it
    settingsSheet.appendRow([key, value]);
    return true;
  }
  
  // Update existing setting
  settingsSheet.getRange(rowIndex, 2).setValue(value);
  return true;
}

/**
 * Gets all available sports
 * 
 * @param {Spreadsheet} ss - The spreadsheet to get sports from
 * @param {boolean} activeOnly - If true, only returns active sports
 * @return {Array} Array of sport objects
 */
function getAllSports(ss = null, activeOnly = true) {
  // If no spreadsheet provided, try to get active spreadsheet
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sportsSheet = ss.getSheetByName(SHEET_NAMES.SPORTS);
  
  if (!sportsSheet) {
    return DEFAULT_SPORTS.map(sport => {
      return {
        name: sport,
        fee: 50,
        description: `${sport} membership`,
        active: true
      };
    });
  }
  
  const sportsData = sportsSheet.getDataRange().getValues();
  const sports = [];
  
  // Skip header row
  for (let i = 1; i < sportsData.length; i++) {
    const [name, fee, description, active] = sportsData[i];
    
    // Skip inactive sports if activeOnly is true
    if (activeOnly && active.toLowerCase() !== 'yes') {
      continue;
    }
    
    sports.push({
      name: name,
      fee: parseFloat(fee),
      description: description,
      active: active.toLowerCase() === 'yes'
    });
  }
  
  return sports;
}

/**
 * Adds a new sport
 * 
 * @param {Object} sportData - Sport data (name, fee, description)
 * @return {boolean} True if sport was added successfully
 */
function addSport(sportData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sportsSheet = ss.getSheetByName(SHEET_NAMES.SPORTS);
  
  if (!sportsSheet) {
    return false;
  }
  
  // Check if sport already exists
  const existingSports = getAllSports(false);
  if (existingSports.some(sport => sport.name.toLowerCase() === sportData.name.toLowerCase())) {
    return false;
  }
  
  // Add new sport
  sportsSheet.appendRow([
    sportData.name,
    sportData.fee || 50,
    sportData.description || `${sportData.name} membership`,
    sportData.active !== false ? 'Yes' : 'No'
  ]);
  
  return true;
}

/**
 * Updates an existing sport
 * 
 * @param {string} sportName - Name of the sport to update
 * @param {Object} updatedData - Updated sport data
 * @return {boolean} True if sport was updated successfully
 */
function updateSport(sportName, updatedData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sportsSheet = ss.getSheetByName(SHEET_NAMES.SPORTS);
  
  if (!sportsSheet) {
    return false;
  }
  
  const sportsData = sportsSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Find the sport
  for (let i = 1; i < sportsData.length; i++) {
    if (sportsData[i][0].toLowerCase() === sportName.toLowerCase()) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return false; // Sport not found
  }
  
  // Update only the fields that are provided
  if (updatedData.name !== undefined) {
    sportsSheet.getRange(rowIndex, 1).setValue(updatedData.name);
  }
  
  if (updatedData.fee !== undefined) {
    sportsSheet.getRange(rowIndex, 2).setValue(updatedData.fee);
  }
  
  if (updatedData.description !== undefined) {
    sportsSheet.getRange(rowIndex, 3).setValue(updatedData.description);
  }
  
  if (updatedData.active !== undefined) {
    sportsSheet.getRange(rowIndex, 4).setValue(updatedData.active ? 'Yes' : 'No');
  }
  
  return true;
}

/**
 * Deletes a sport
 * 
 * @param {string} sportName - Name of the sport to delete
 * @return {boolean} True if sport was deleted successfully
 */
function deleteSport(sportName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sportsSheet = ss.getSheetByName(SHEET_NAMES.SPORTS);
  
  if (!sportsSheet) {
    return false;
  }
  
  const sportsData = sportsSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Find the sport
  for (let i = 1; i < sportsData.length; i++) {
    if (sportsData[i][0].toLowerCase() === sportName.toLowerCase()) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return false; // Sport not found
  }
  
  // Delete the row
  sportsSheet.deleteRow(rowIndex);
  
  return true;
}

/**
 * Creates a formatted date string
 * 
 * @param {Date} date - Date to format
 * @param {string} format - Optional format (default: 'yyyy-MM-dd')
 * @return {string} Formatted date string
 */
function formatDate(date, format = 'yyyy-MM-dd') {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), format);
}

/**
 * Sends an email notification
 * 
 * @param {Object} options - Email options (recipient, subject, body, html)
 * @return {boolean} True if email was sent successfully
 */
function sendEmailNotification(options) {
  try {
    const settings = getSettings();
    
    // Set sender name
    const senderName = settings.clubName || 'PlayMate Sports Club';
    
    // Send email
    GmailApp.sendEmail(
      options.recipient,
      options.subject,
      options.body,
      {
        name: senderName,
        htmlBody: options.html || null,
        replyTo: settings.adminEmail || null
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Creates a PDF from the current spreadsheet or a specific sheet
 * 
 * @param {string} sheetName - Optional name of sheet to export
 * @param {string} fileName - Optional name for the PDF file
 * @return {Blob} PDF blob
 */
function exportToPdf(sheetName, fileName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getActiveSheet();
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found.`);
  }
  
  // Get the spreadsheet URL
  const ssID = ss.getId();
  const sheetID = sheet.getSheetId();
  
  // Set export options
  const url = `https://docs.google.com/spreadsheets/d/${ssID}/export?` +
    `format=pdf&` +
    `size=letter&` +
    `portrait=true&` +
    `fitw=true&` +
    `gid=${sheetID}&` +
    `gridlines=false`;
  
  // Fetch the PDF
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Create a blob from the response
  const pdfBlob = response.getBlob().setName(fileName || `${sheet.getName()}.pdf`);
  
  return pdfBlob;
}

/**
 * Sends a report as PDF to an email address
 * 
 * @param {Object} options - Report options (recipient, subject, sheetName, fileName, message)
 * @return {boolean} True if report was sent successfully
 */
function sendReportByEmail(options) {
  try {
    const settings = getSettings();
    
    // Create PDF
    const pdfBlob = exportToPdf(options.sheetName, options.fileName);
    
    // Set sender name and email
    const senderName = settings.clubName || 'PlayMate Sports Club';
    
    // Prepare email message
    const emailBody = options.message || 
      `Please find attached the ${options.sheetName || 'requested'} report from ${senderName}.`;
    
    // Send email with attachment
    GmailApp.sendEmail(
      options.recipient,
      options.subject || `${senderName} - ${options.sheetName || 'Report'}`,
      emailBody,
      {
        name: senderName,
        attachments: [pdfBlob],
        replyTo: settings.adminEmail || null
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending report:', error);
    return false;
  }
}

/**
 * Creates a backup of the spreadsheet
 * 
 * @return {string} ID of the backup spreadsheet
 */
function createBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSettings();
  
  // Create a backup file name with date
  const today = formatDate(new Date(), 'yyyy-MM-dd');
  const backupName = `${settings.clubName || 'PlayMate'} Backup - ${today}`;
  
  // Create a copy
  const backup = DriveApp.getFileById(ss.getId()).makeCopy(backupName);
  
  // Return the ID of the backup
  return backup.getId();
}