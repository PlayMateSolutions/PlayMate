/**
 * Main entry point for the Sports Membership Management App
 * Created: May 25, 2025
 */

/**
 * Runs when the spreadsheet is first opened
 * Creates the menu for the app
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PlayMate')
    .addItem('Show Dashboard', 'showDashboard')
    .addSeparator()
    .addSubMenu(ui.createMenu('Members')
      .addItem('Add Member', 'showAddMemberForm')
      .addItem('View/Edit Members', 'showMembersPanel')
      .addItem('Import Members', 'showImportMembersDialog'))
    .addSubMenu(ui.createMenu('Attendance')
      .addItem('Record Attendance', 'showAttendanceForm')
      .addItem('View Attendance Reports', 'showAttendanceReports'))
    .addSubMenu(ui.createMenu('Payments')
      .addItem('Record Payment', 'showPaymentForm')
      .addItem('View Payment Reports', 'showPaymentReports'))
    .addSeparator()
    .addItem('Settings', 'showSettings')
    .addItem('API Settings', 'showApiSettings')
    .addItem('About', 'showAbout')
    .addToUi();
}

/**
 * Initializes the spreadsheet with the necessary sheets and headers
 * This should be run manually once when setting up the app
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Members sheet if it doesn't exist
  if (!ss.getSheetByName(SHEET_NAMES.MEMBERS)) {
    const membersSheet = ss.insertSheet(SHEET_NAMES.MEMBERS);
    const membersHeaders = [
      'ID', 'First Name', 'Last Name', 'Email', 'Phone', 
      'Join Date', 'Status', 'Sports', 'Notes'
    ];
    membersSheet.getRange(1, 1, 1, membersHeaders.length).setValues([membersHeaders]);
    membersSheet.setFrozenRows(1);
    membersSheet.getRange(1, 1, 1, membersHeaders.length).setBackground('#4285F4').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  
  // Create Attendance sheet if it doesn't exist
  if (!ss.getSheetByName(SHEET_NAMES.ATTENDANCE)) {
    const attendanceSheet = ss.insertSheet(SHEET_NAMES.ATTENDANCE);
    const attendanceHeaders = [
      'ID', 'Member ID', 'Date', 'Sport', 'Check-In Time', 
      'Check-Out Time', 'Duration (mins)', 'Notes'
    ];
    attendanceSheet.getRange(1, 1, 1, attendanceHeaders.length).setValues([attendanceHeaders]);
    attendanceSheet.setFrozenRows(1);
    attendanceSheet.getRange(1, 1, 1, attendanceHeaders.length).setBackground('#0F9D58').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  
  // Create Payments sheet if it doesn't exist
  if (!ss.getSheetByName(SHEET_NAMES.PAYMENTS)) {
    const paymentsSheet = ss.insertSheet(SHEET_NAMES.PAYMENTS);
    const paymentsHeaders = [
      'ID', 'Member ID', 'Date', 'Amount', 'Payment Type', 
      'Sport', 'Period Start', 'Period End', 'Status', 'Notes'
    ];
    paymentsSheet.getRange(1, 1, 1, paymentsHeaders.length).setValues([paymentsHeaders]);
    paymentsSheet.setFrozenRows(1);
    paymentsSheet.getRange(1, 1, 1, paymentsHeaders.length).setBackground('#DB4437').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  
  // Create Sports sheet if it doesn't exist
  if (!ss.getSheetByName(SHEET_NAMES.SPORTS)) {
    const sportsSheet = ss.insertSheet(SHEET_NAMES.SPORTS);
    const sportsHeaders = ['Sport Name', 'Monthly Fee', 'Description', 'Active'];
    sportsSheet.getRange(1, 1, 1, sportsHeaders.length).setValues([sportsHeaders]);
    sportsSheet.setFrozenRows(1);
    sportsSheet.getRange(1, 1, 1, sportsHeaders.length).setBackground('#F4B400').setFontColor('#FFFFFF').setFontWeight('bold');
    
    // Add default sports
    const sportsData = DEFAULT_SPORTS.map((sport, index) => {
      return [sport, 50 + (index * 10), `${sport} membership`, 'Yes'];
    });
    sportsSheet.getRange(2, 1, sportsData.length, sportsData[0].length).setValues(sportsData);
  }
  
  // Create Settings sheet if it doesn't exist
  if (!ss.getSheetByName(SHEET_NAMES.SETTINGS)) {
    const settingsSheet = ss.insertSheet(SHEET_NAMES.SETTINGS);
    const settingsData = [
      ['Setting', 'Value'],
      ['Club Name', 'PlayMate Sports Club'],
      ['Admin Email', ''],
      ['Currency', 'USD'],
      ['Late Payment Days', '5'],
      ['API Token', generateApiToken()],
      ['API URL', ''],
      ['Version', '1.0.0'],
      ['Last Updated', new Date().toISOString()]
    ];
    settingsSheet.getRange(1, 1, settingsData.length, 2).setValues(settingsData);
    settingsSheet.getRange(1, 1, 1, 2).setBackground('#4285F4').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  
  // Delete the default Sheet1 if it exists
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
  
  // Format date columns
  formatDateColumns();
  
  // Set column widths
  setColumnWidths();
  
  // Create data validations
  setupDataValidations();
  
  // Create dashboard as the first sheet
  createDashboard();
  
  SpreadsheetApp.getUi().alert('Spreadsheet initialized successfully!');
}

/**
 * Sets up data validations for various columns
 */
function setupDataValidations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Member status validation
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const statusValues = Object.values(MEMBER_STATUS);
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues)
    .build();
  membersSheet.getRange(2, MEMBERS_COLUMNS.STATUS + 1, membersSheet.getMaxRows() - 1, 1)
    .setDataValidation(statusValidation);
  
  // Payment status validation
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  const paymentStatusValues = Object.values(PAYMENT_STATUS);
  const paymentStatusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(paymentStatusValues)
    .build();
  paymentsSheet.getRange(2, PAYMENTS_COLUMNS.STATUS + 1, paymentsSheet.getMaxRows() - 1, 1)
    .setDataValidation(paymentStatusValidation);
  
  // Payment type validation
  const paymentTypeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(PAYMENT_TYPES)
    .build();
  paymentsSheet.getRange(2, PAYMENTS_COLUMNS.PAYMENT_TYPE + 1, paymentsSheet.getMaxRows() - 1, 1)
    .setDataValidation(paymentTypeValidation);
  
  // Sport validation
  const sportsSheet = ss.getSheetByName(SHEET_NAMES.SPORTS);
  const sportNames = sportsSheet.getRange(2, 1, sportsSheet.getLastRow() - 1, 1).getValues().flat();
  const sportValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(sportNames)
    .build();
  
  // Apply sport validation to payments and attendance sheets
  paymentsSheet.getRange(2, PAYMENTS_COLUMNS.SPORT + 1, paymentsSheet.getMaxRows() - 1, 1)
    .setDataValidation(sportValidation);
  
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  attendanceSheet.getRange(2, ATTENDANCE_COLUMNS.SPORT + 1, attendanceSheet.getMaxRows() - 1, 1)
    .setDataValidation(sportValidation);
}

/**
 * Formats date columns in all sheets
 */
function formatDateColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Format join date in Members sheet
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  membersSheet.getRange(2, MEMBERS_COLUMNS.JOIN_DATE + 1, membersSheet.getMaxRows() - 1, 1)
    .setNumberFormat('yyyy-mm-dd');
  
  // Format date in Attendance sheet
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  attendanceSheet.getRange(2, ATTENDANCE_COLUMNS.DATE + 1, attendanceSheet.getMaxRows() - 1, 1)
    .setNumberFormat('yyyy-mm-dd');
  
  // Format time columns in Attendance sheet
  attendanceSheet.getRange(2, ATTENDANCE_COLUMNS.CHECK_IN_TIME + 1, attendanceSheet.getMaxRows() - 1, 1)
    .setNumberFormat('hh:mm:ss am/pm');
  attendanceSheet.getRange(2, ATTENDANCE_COLUMNS.CHECK_OUT_TIME + 1, attendanceSheet.getMaxRows() - 1, 1)
    .setNumberFormat('hh:mm:ss am/pm');
  
  // Format date and period columns in Payments sheet
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  paymentsSheet.getRange(2, PAYMENTS_COLUMNS.DATE + 1, paymentsSheet.getMaxRows() - 1, 1)
    .setNumberFormat('yyyy-mm-dd');
  paymentsSheet.getRange(2, PAYMENTS_COLUMNS.PERIOD_START + 1, paymentsSheet.getMaxRows() - 1, 1)
    .setNumberFormat('yyyy-mm-dd');
  paymentsSheet.getRange(2, PAYMENTS_COLUMNS.PERIOD_END + 1, paymentsSheet.getMaxRows() - 1, 1)
    .setNumberFormat('yyyy-mm-dd');
  
  // Format amount column in Payments sheet
  paymentsSheet.getRange(2, PAYMENTS_COLUMNS.AMOUNT + 1, paymentsSheet.getMaxRows() - 1, 1)
    .setNumberFormat('$0.00');
}

/**
 * Sets appropriate column widths for all sheets
 */
function setColumnWidths() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Members sheet column widths
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  membersSheet.setColumnWidth(1, 70);  // ID
  membersSheet.setColumnWidth(2, 120); // First Name
  membersSheet.setColumnWidth(3, 120); // Last Name
  membersSheet.setColumnWidth(4, 200); // Email
  membersSheet.setColumnWidth(5, 120); // Phone
  membersSheet.setColumnWidth(6, 100); // Join Date
  membersSheet.setColumnWidth(7, 100); // Status
  membersSheet.setColumnWidth(8, 150); // Sports
  membersSheet.setColumnWidth(9, 200); // Notes
  
  // Attendance sheet column widths
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  attendanceSheet.setColumnWidth(1, 70);  // ID
  attendanceSheet.setColumnWidth(2, 100); // Member ID
  attendanceSheet.setColumnWidth(3, 100); // Date
  attendanceSheet.setColumnWidth(4, 120); // Sport
  attendanceSheet.setColumnWidth(5, 120); // Check-In Time
  attendanceSheet.setColumnWidth(6, 120); // Check-Out Time
  attendanceSheet.setColumnWidth(7, 120); // Duration
  attendanceSheet.setColumnWidth(8, 200); // Notes
  
  // Payments sheet column widths
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  paymentsSheet.setColumnWidth(1, 70);  // ID
  paymentsSheet.setColumnWidth(2, 100); // Member ID
  paymentsSheet.setColumnWidth(3, 100); // Date
  paymentsSheet.setColumnWidth(4, 100); // Amount
  paymentsSheet.setColumnWidth(5, 120); // Payment Type
  paymentsSheet.setColumnWidth(6, 120); // Sport
  paymentsSheet.setColumnWidth(7, 120); // Period Start
  paymentsSheet.setColumnWidth(8, 120); // Period End
  paymentsSheet.setColumnWidth(9, 100); // Status
  paymentsSheet.setColumnWidth(10, 200); // Notes
}

/**
 * Generate a secure API token for use with the Ionic app
 * 
 * @return {string} Generated API token
 */
function generateApiToken() {
  const randomBytes = Utilities.getUuid();
  const timestamp = new Date().getTime().toString(36);
  return `pm-${randomBytes.substring(0, 8)}-${timestamp}`;
}

/**
 * Shows the API settings dialog
 */
function showApiSettings() {
  const ui = SpreadsheetApp.getUi();
  const settings = getSettings();
  
  // Get the current web app URL if deployed
  let currentUrl = settings.apiurl || '';
  
  // Create the form HTML
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input { width: 100%; padding: 8px; box-sizing: border-box; font-family: monospace; }
      .btn { background-color: #4285F4; color: white; padding: 10px 15px; border: none; cursor: pointer; }
      .btn:hover { background-color: #3367d6; }
      .btn-secondary { background-color: #5f6368; margin-left: 10px; }
      .btn-secondary:hover { background-color: #494c50; }
      .button-group { display: flex; justify-content: flex-start; }
      .note { font-style: italic; margin-top: 5px; color: #666; }
      .code { font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 15px; }
      .warning { color: #D14836; margin-top: 10px; }
    </style>
    <h2>API Settings</h2>
    <p>Configure API access for your Ionic app.</p>
    
    <div class="form-group">
      <label for="apiToken">API Token</label>
      <input type="text" id="apiToken" name="apiToken" value="${settings.apitoken || ''}" readonly>
      <div class="note">Use this token to authenticate your Ionic app.</div>
      <button type="button" class="btn" style="margin-top: 5px;" onclick="regenerateToken()">Regenerate Token</button>
    </div>
    
    <div class="form-group">
      <label for="apiUrl">API URL</label>
      <input type="text" id="apiUrl" name="apiUrl" value="${currentUrl}" readonly>
      <div class="note">This is the URL to call from your Ionic app.</div>
      <div class="warning" id="noUrlWarning" style="${currentUrl ? 'display:none' : ''}">
        You need to deploy this script as a web app to get a URL. See instructions below.
      </div>
    </div>
    
    <h3>How to Deploy as Web App</h3>
    <ol>
      <li>Click on <strong>Extensions → Apps Script</strong> to open the script editor</li>
      <li>Click the <strong>Deploy</strong> button → <strong>New deployment</strong></li>
      <li>Select <strong>Web app</strong> as the deployment type</li>
      <li>Description: <strong>PlayMate API</strong></li>
      <li>Execute as: <strong>Me</strong></li>
      <li>Who has access: <strong>Anyone</strong> (or "Anyone within [your organization]" for enterprise use)</li>
      <li>Click <strong>Deploy</strong></li>
      <li>Copy the Web app URL and paste it back in this dialog</li>
    </ol>
    
    <div class="form-group">
      <label for="newApiUrl">Update API URL</label>
      <input type="text" id="newApiUrl" name="newApiUrl" placeholder="Paste the deployment URL here">
    </div>
    
    <h3>Sample Code for Ionic App</h3>
    <div class="code">
      // Service to connect to Google Apps Script API<br>
      import { Injectable } from '@angular/core';<br>
      import { HttpClient } from '@angular/common/http';<br>
      <br>
      @Injectable({<br>
      &nbsp;&nbsp;providedIn: 'root'<br>
      })<br>
      export class ApiService {<br>
      &nbsp;&nbsp;private apiUrl = '${currentUrl || '[YOUR_API_URL]'}';<br>
      &nbsp;&nbsp;private apiToken = '${settings.apitoken || '[YOUR_API_TOKEN]'}';<br>
      <br>
      &nbsp;&nbsp;constructor(private http: HttpClient) { }<br>
      <br>
      &nbsp;&nbsp;// Example: Get all members<br>
      &nbsp;&nbsp;getMembers() {<br>
      &nbsp;&nbsp;&nbsp;&nbsp;return this.http.get(\`\${this.apiUrl}?action=getMembers&authToken=\${this.apiToken}\`);<br>
      &nbsp;&nbsp;}<br>
      <br>
      &nbsp;&nbsp;// Example: Add a member<br>
      &nbsp;&nbsp;addMember(memberData: any) {<br>
      &nbsp;&nbsp;&nbsp;&nbsp;const payload = JSON.stringify(memberData);<br>
      &nbsp;&nbsp;&nbsp;&nbsp;return this.http.post(\`\${this.apiUrl}?action=addMember&authToken=\${this.apiToken}&payload=\${encodeURIComponent(payload)}\`, {});<br>
      &nbsp;&nbsp;}<br>
      }
    </div>
    
    <div class="button-group" style="margin-top: 20px;">
      <button type="button" class="btn" onclick="saveApiSettings()">Save Settings</button>
      <button type="button" class="btn btn-secondary" onclick="google.script.host.close()">Close</button>
    </div>
    
    <script>
      function regenerateToken() {
        if (confirm('Are you sure you want to regenerate the API token? Your Ionic app will need to be updated with the new token.')) {
          google.script.run
            .withSuccessHandler(function(newToken) {
              document.getElementById('apiToken').value = newToken;
            })
            .regenerateApiToken();
        }
      }
      
      function saveApiSettings() {
        const newUrl = document.getElementById('newApiUrl').value;
        
        google.script.run
          .withSuccessHandler(function() {
            alert('API settings saved successfully!');
            
            // Update the displayed URL if a new one was provided
            if (newUrl) {
              document.getElementById('apiUrl').value = newUrl;
              document.getElementById('noUrlWarning').style.display = 'none';
              
              // Update the sample code
              const codeBlock = document.querySelector('.code');
              const newCode = codeBlock.innerHTML.replace(/private apiUrl = '[^']*'/g, "private apiUrl = '" + newUrl + "'");
              codeBlock.innerHTML = newCode;
            }
          })
          .withFailureHandler(function(error) {
            alert('Error saving settings: ' + error);
          })
          .saveApiSettings({
            apiUrl: newUrl
          });
      }
    </script>
  `)
  .setWidth(600)
  .setHeight(700)
  .setTitle('API Settings');
  
  ui.showModalDialog(htmlOutput, 'API Settings');
}

/**
 * Regenerates the API token
 * 
 * @return {string} The new API token
 */
function regenerateApiToken() {
  const newToken = generateApiToken();
  updateSetting('API Token', newToken);
  return newToken;
}

/**
 * Saves API settings
 * 
 * @param {Object} settings - API settings to save
 * @return {boolean} True if settings were saved successfully
 */
function saveApiSettings(settings) {
  if (settings.apiUrl) {
    updateSetting('API URL', settings.apiUrl);
  }
  
  return true;
}