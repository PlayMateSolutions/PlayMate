/**
 * UI functions for the Sports Membership Management App
 * Created: May 25, 2025
 */

/**
 * Shows the dashboard
 */
function showDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Create dashboard sheet if it doesn't exist
  createDashboard();
  
  // Activate the Dashboard sheet
  const dashboardSheet = ss.getSheetByName('Dashboard');
  if (dashboardSheet) {
    dashboardSheet.activate();
  } else {
    ui.alert('Error', 'Failed to create dashboard. Please try again.', ui.ButtonSet.OK);
  }
}

/**
 * Creates the dashboard sheet
 */
function createDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if Dashboard sheet already exists
  let dashboardSheet = ss.getSheetByName('Dashboard');
  
  if (!dashboardSheet) {
    // Create a new Dashboard sheet
    dashboardSheet = ss.insertSheet('Dashboard', 0);
  }
  
  // Clear existing content
  dashboardSheet.clear();
  
  // Get settings
  const settings = getSettings();
  
  // Get data for dashboard
  const activeMembers = getAllMembers({ status: MEMBER_STATUS.ACTIVE }).length;
  const totalMembers = getAllMembers().length;
  const sports = getAllSports();
  
  // Get payment summary for current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const paymentSummary = getOverallPaymentSummary({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth
  });
  
  // Get attendance summary for current month
  const attendanceSummary = getOverallAttendanceSummary({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth
  });
  
  // Get payment status summary
  const paymentStatus = getMembersWithPaymentStatus();
  const overdue = paymentStatus.filter(p => p.status === 'Overdue').length;
  const due = paymentStatus.filter(p => p.status === 'Due').length;
  
  // Set up dashboard layout
  dashboardSheet.setColumnWidth(1, 20);  // Left margin
  dashboardSheet.setColumnWidth(2, 150); // First column
  dashboardSheet.setColumnWidth(3, 200); // Second column
  dashboardSheet.setColumnWidth(4, 200); // Third column
  dashboardSheet.setColumnWidth(5, 200); // Fourth column
  dashboardSheet.setColumnWidth(6, 20);  // Right margin
  
  // Add title
  const title = settings.clubName || 'PlayMate Sports Club';
  dashboardSheet.getRange('B1:E1').merge().setValue(title).setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
  
  // Add date
  dashboardSheet.getRange('B2:E2').merge().setValue(`Dashboard - ${formatDate(today, 'MMMM dd, yyyy')}`).setFontStyle('italic').setHorizontalAlignment('center');
  
  // Section headers style
  const headerStyle = (range) => {
    range.setBackground('#4285F4').setFontColor('#FFFFFF').setFontWeight('bold');
  };
  
  // Add members summary section
  dashboardSheet.getRange('B4:C4').merge().setValue('Members Summary').setFontWeight('bold');
  headerStyle(dashboardSheet.getRange('B4:C4'));
  
  dashboardSheet.getRange('B5').setValue('Active Members:');
  dashboardSheet.getRange('C5').setValue(activeMembers);
  
  dashboardSheet.getRange('B6').setValue('Total Members:');
  dashboardSheet.getRange('C6').setValue(totalMembers);
  
  // Add sports section
  dashboardSheet.getRange('D4:E4').merge().setValue('Sports').setFontWeight('bold');
  headerStyle(dashboardSheet.getRange('D4:E4'));
  
  for (let i = 0; i < Math.min(sports.length, 5); i++) {
    dashboardSheet.getRange(`D${5 + i}`).setValue(sports[i].name + ':');
    dashboardSheet.getRange(`E${5 + i}`).setValue(sports[i].fee).setNumberFormat('$0.00');
  }
  
  // Add revenue summary
  dashboardSheet.getRange('B8:C8').merge().setValue('Revenue Summary (This Month)').setFontWeight('bold');
  headerStyle(dashboardSheet.getRange('B8:C8'));
  
  dashboardSheet.getRange('B9').setValue('Total Revenue:');
  dashboardSheet.getRange('C9').setValue(paymentSummary.totalAmount).setNumberFormat('$0.00');
  
  dashboardSheet.getRange('B10').setValue('Number of Payments:');
  dashboardSheet.getRange('C10').setValue(paymentSummary.totalPayments);
  
  dashboardSheet.getRange('B11').setValue('Unique Members:');
  dashboardSheet.getRange('C11').setValue(paymentSummary.uniqueMembers);
  
  // Add attendance summary
  dashboardSheet.getRange('D8:E8').merge().setValue('Attendance Summary (This Month)').setFontWeight('bold');
  headerStyle(dashboardSheet.getRange('D8:E8'));
  
  dashboardSheet.getRange('D9').setValue('Total Sessions:');
  dashboardSheet.getRange('E9').setValue(attendanceSummary.totalSessions);
  
  dashboardSheet.getRange('D10').setValue('Total Hours:');
  dashboardSheet.getRange('E10').setValue(attendanceSummary.totalDuration / 60).setNumberFormat('0.0');
  
  dashboardSheet.getRange('D11').setValue('Unique Members:');
  dashboardSheet.getRange('E11').setValue(attendanceSummary.uniqueMembers);
  
  // Add payment status
  dashboardSheet.getRange('B13:E13').merge().setValue('Payment Status').setFontWeight('bold');
  headerStyle(dashboardSheet.getRange('B13:E13'));
  
  dashboardSheet.getRange('B14').setValue('Overdue Payments:');
  dashboardSheet.getRange('C14').setValue(overdue);
  if (overdue > 0) dashboardSheet.getRange('C14').setBackground('#F4B400');
  
  dashboardSheet.getRange('D14').setValue('Due Payments:');
  dashboardSheet.getRange('E14').setValue(due);
  if (due > 0) dashboardSheet.getRange('E14').setBackground('#F4B400');
  
  // Add charts if there's enough data
  try {
    if (paymentSummary.totalPayments > 0) {
      addRevenueChart(dashboardSheet);
    }
    
    if (attendanceSummary.totalSessions > 0) {
      addAttendanceChart(dashboardSheet);
    }
  } catch (e) {
    console.error('Error creating charts:', e);
  }
  
  // Add quick actions
  dashboardSheet.getRange('B17:E17').merge().setValue('Quick Actions').setFontWeight('bold');
  headerStyle(dashboardSheet.getRange('B17:E17'));
  
  const actions = [
    'Click "PlayMate" menu at the top to access all features',
    'Add a new member: PlayMate > Members > Add Member',
    'Record attendance: PlayMate > Attendance > Record Attendance',
    'Record payment: PlayMate > Payments > Record Payment'
  ];
  
  for (let i = 0; i < actions.length; i++) {
    dashboardSheet.getRange(`B${18 + i}:E${18 + i}`).merge().setValue(actions[i]);
  }
  
  // Protect the dashboard from edits
  const protection = dashboardSheet.protect();
  protection.setDescription('Protected Dashboard');
  protection.setWarningOnly(true);
  
  // Return to the beginning of the sheet
  dashboardSheet.setActiveSelection('A1');
}

/**
 * Adds a revenue chart to the dashboard
 */
function addRevenueChart(sheet) {
  // Get payment data by sport
  const sports = getAllSports();
  const sportNames = sports.map(s => s.name);
  
  // Get summary for each sport
  const sportData = [];
  for (const sport of sportNames) {
    const summary = getOverallPaymentSummary({ sport: sport });
    sportData.push([sport, summary.totalAmount]);
  }
  
  // Create chart
  if (sportData.length > 0) {
    const chartDataRange = sheet.getRange(30, 2, sportData.length, 2);
    
    // Add temporary data for chart
    for (let i = 0; i < sportData.length; i++) {
      sheet.getRange(30 + i, 2).setValue(sportData[i][0]);
      sheet.getRange(30 + i, 3).setValue(sportData[i][1]);
    }
    
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(chartDataRange)
      .setPosition(22, 2, 0, 0)
      .setOption('title', 'Revenue by Sport')
      .setOption('pieSliceText', 'percentage')
      .setOption('width', 400)
      .setOption('height', 200)
      .build();
    
    sheet.insertChart(chart);
    
    // Clear temporary data
    sheet.getRange(30, 2, sportData.length, 2).clearContent();
  }
}

/**
 * Adds an attendance chart to the dashboard
 */
function addAttendanceChart(sheet) {
  // Get attendance data by sport
  const attendanceSummary = getOverallAttendanceSummary();
  const sportData = [];
  
  for (const sport in attendanceSummary.sportBreakdown) {
    sportData.push([sport, attendanceSummary.sportBreakdown[sport].sessions]);
  }
  
  // Create chart
  if (sportData.length > 0) {
    const chartDataRange = sheet.getRange(30, 4, sportData.length, 2);
    
    // Add temporary data for chart
    for (let i = 0; i < sportData.length; i++) {
      sheet.getRange(30 + i, 4).setValue(sportData[i][0]);
      sheet.getRange(30 + i, 5).setValue(sportData[i][1]);
    }
    
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(chartDataRange)
      .setPosition(22, 4, 0, 0)
      .setOption('title', 'Attendance by Sport')
      .setOption('hAxis.title', 'Sport')
      .setOption('vAxis.title', 'Sessions')
      .setOption('width', 400)
      .setOption('height', 200)
      .build();
    
    sheet.insertChart(chart);
    
    // Clear temporary data
    sheet.getRange(30, 4, sportData.length, 2).clearContent();
  }
}

/**
 * Shows the add member form
 */
function showAddMemberForm() {
  const ui = SpreadsheetApp.getUi();
  const sports = getAllSports().map(s => s.name).join(', ');
  
  // Create the form HTML
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
      .btn { background-color: #4285F4; color: white; padding: 10px 15px; border: none; cursor: pointer; }
      .btn:hover { background-color: #3367d6; }
      .sport-list { font-style: italic; margin-top: 5px; color: #666; }
      .optional { font-weight: normal; color: #666; font-style: italic; }
    </style>
    <h2>Add New Member</h2>
    <form id="memberForm" onsubmit="submitForm(); return false;">
      <div class="form-group">
        <label for="firstName">First Name *</label>
        <input type="text" id="firstName" name="firstName" required>
      </div>
      <div class="form-group">
        <label for="lastName">Last Name <span class="optional">(optional)</span></label>
        <input type="text" id="lastName" name="lastName">
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email">
      </div>
      <div class="form-group">
        <label for="phone">Phone *</label>
        <input type="text" id="phone" name="phone" required>
      </div>
      <div class="form-group">
        <label for="joinDate">Join Date</label>
        <input type="date" id="joinDate" name="joinDate" value="${formatDate(new Date())}">
      </div>
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>
     
      <div class="form-group">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes" rows="3"></textarea>
      </div>
      <button type="submit" class="btn">Add Member</button>
    </form>
    
    <script>
      function submitForm() {
        const form = document.getElementById('memberForm');
        const formData = {
          firstName: form.firstName.value,
          lastName: form.lastName.value,
          email: form.email.value,
          phone: form.phone.value,
          joinDate: form.joinDate.value,
          status: form.status.value,
          sports: form.sports.value.split(',').map(s => s.trim()).filter(s => s),
          notes: form.notes.value
        };
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onFailure)
          .addMemberFromForm(formData);
      }
      
      function onSuccess(memberId) {
        alert('Member added successfully!\\nMember ID: ' + memberId);
        google.script.host.close();
      }
      
      function onFailure(error) {
        alert('Error adding member: ' + error);
      }
    </script>
  `)
  .setWidth(400)
  .setHeight(550)
  .setTitle('Add New Member');
  
  ui.showModalDialog(htmlOutput, 'Add New Member');
}

/**
 * Adds a member from the form data
 * 
 * @param {Object} formData - Form data from the add member form
 * @return {string} ID of the newly created member
 */
function addMemberFromForm(formData) {
  // Convert date string to Date object
  if (formData.joinDate) {
    formData.joinDate = new Date(formData.joinDate);
  }
  
  // Add the member
  return addMember(formData);
}

/**
 * Shows the members panel for viewing and editing members
 */
function showMembersPanel() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Activate the Members sheet
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  if (membersSheet) {
    membersSheet.activate();
    ui.alert('Members Panel', 'The Members sheet is now active. You can view and edit members here.', ui.ButtonSet.OK);
  } else {
    ui.alert('Error', 'Members sheet not found. Please initialize the spreadsheet first.', ui.ButtonSet.OK);
  }
}

/**
 * Shows the import members dialog
 */
function showImportMembersDialog() {
  const ui = SpreadsheetApp.getUi();
  
  // Create the dialog HTML
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      textarea { width: 100%; height: 200px; padding: 8px; box-sizing: border-box; }
      .btn { background-color: #4285F4; color: white; padding: 10px 15px; border: none; cursor: pointer; }
      .btn:hover { background-color: #3367d6; }
      .note { font-style: italic; margin-top: 5px; color: #666; }
      .optional { font-weight: normal; color: #666; font-style: italic; }
    </style>
    <h2>Import Members</h2>
    <p>Paste CSV data with headers. Required columns: <strong>First Name</strong>, <strong>Phone</strong>. <span class="optional">Last Name is optional.</span></p>
    <form id="importForm" onsubmit="submitForm(); return false;">
      <div class="form-group">
        <label for="csvData">CSV Data</label>
        <textarea id="csvData" name="csvData" required></textarea>
        <div class="note">Example: First Name,Last Name (optional),Email,Phone,Join Date,Status,Sports</div>
      </div>
      <button type="submit" class="btn">Import Members</button>
    </form>
    
    <script>
      function submitForm() {
        const form = document.getElementById('importForm');
        const csvData = form.csvData.value;
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onFailure)
          .importMembersFromCsv(csvData);
      }
      
      function onSuccess(result) {
        let message = 'Import completed!\\n\\n';
        message += result.success + ' members imported successfully.';
        
        if (result.errors.length > 0) {
          message += '\\n\\nErrors (' + result.errors.length + '):';
          result.errors.forEach(function(error) {
            message += '\\n- ' + error;
          });
        }
        
        alert(message);
        google.script.host.close();
      }
      
      function onFailure(error) {
        alert('Error importing members: ' + error);
      }
    </script>
  `)
  .setWidth(500)
  .setHeight(400)
  .setTitle('Import Members');
  
  ui.showModalDialog(htmlOutput, 'Import Members');
}

/**
 * Imports members from CSV data
 * 
 * @param {string} csvData - CSV data with headers
 * @return {Object} Import results with success count and errors
 */
function importMembersFromCsv(csvData) {
  return importMembers(csvData);
}

/**
 * Shows the attendance form
 */
function showAttendanceForm() {
  const ui = SpreadsheetApp.getUi();
  const members = getAllMembers({ status: MEMBER_STATUS.ACTIVE });
  const sports = getAllSports().map(s => s.name);
  
  // Create member options HTML
  let memberOptions = '';
  for (const member of members) {
    memberOptions += `<option value="${member.id}">${member.firstName} ${member.lastName}</option>`;
  }
  
  // Create sport options HTML
  let sportOptions = '';
  for (const sport of sports) {
    sportOptions += `<option value="${sport}">${sport}</option>`;
  }
  
  // Format current date and time
  const now = new Date();
  const today = formatDate(now);
  const time = formatDate(now, 'HH:mm');
  
  // Create the form HTML
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
      .btn { background-color: #4285F4; color: white; padding: 10px 15px; border: none; cursor: pointer; }
      .btn:hover { background-color: #3367d6; }
      .btn-secondary { background-color: #5f6368; }
      .btn-secondary:hover { background-color: #494c50; }
      .button-group { display: flex; justify-content: space-between; }
    </style>
    <h2>Record Attendance</h2>
    <form id="attendanceForm" onsubmit="submitForm(); return false;">
      <div class="form-group">
        <label for="memberId">Member *</label>
        <select id="memberId" name="memberId" required>
          <option value="">-- Select Member --</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="date">Date *</label>
        <input type="date" id="date" name="date" value="${today}" required>
      </div>
    
      <div class="form-group">
        <label for="checkInTime">Check-In Time</label>
        <input type="time" id="checkInTime" name="checkInTime" value="${time}">
      </div>
      <div class="form-group">
        <label for="checkOutTime">Check-Out Time (optional)</label>
        <input type="time" id="checkOutTime" name="checkOutTime">
      </div>
      <div class="form-group">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes" rows="2"></textarea>
      </div>
      <div class="button-group">
        <button type="submit" class="btn">Record Attendance</button>
        <button type="button" class="btn btn-secondary" onclick="recordCheckOut()">Record Check-Out Only</button>
      </div>
    </form>
    
    <script>
      function submitForm() {
        const form = document.getElementById('attendanceForm');
        
        // Validate form
        if (!form.memberId.value || !form.date.value) {
          alert('Please fill in all required fields.');
          return;
        }
        
        const formData = {
          memberId: form.memberId.value,
          date: form.date.value,
          checkInTime: combineDateTime(form.date.value, form.checkInTime.value),
          notes: form.notes.value
        };
        
        if (form.checkOutTime.value) {
          formData.checkOutTime = combineDateTime(form.date.value, form.checkOutTime.value);
        }
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onFailure)
          .recordAttendanceFromForm(formData);
      }
      
      function recordCheckOut() {
        const form = document.getElementById('attendanceForm');
        const memberId = form.memberId.value;
        
        if (!memberId) {
          alert('Please select a member to record check-out.');
          return;
        }
        
        const formData = {
          memberId: memberId,
          checkOutTime: new Date().toISOString()
        };
        
        google.script.run
          .withSuccessHandler(onCheckOutSuccess)
          .withFailureHandler(onFailure)
          .recordCheckOutOnly(formData);
      }
      
      function combineDateTime(dateStr, timeStr) {
        if (!dateStr || !timeStr) return null;
        
        const [year, month, day] = dateStr.split('-');
        const [hours, minutes] = timeStr.split(':');
        
        return new Date(year, month - 1, day, hours, minutes).toISOString();
      }
      
      function onSuccess(attendanceId) {
        alert('Attendance recorded successfully!');
        google.script.host.close();
      }
      
      function onCheckOutSuccess(result) {
        if (result.success) {
          alert('Check-out recorded successfully for the most recent attendance record.');
          google.script.host.close();
        } else {
          alert(result.message || 'No active attendance record found for this member.');
        }
      }
      
      function onFailure(error) {
        alert('Error recording attendance: ' + error);
      }
    </script>
  `)
  .setWidth(400)
  .setHeight(500)
  .setTitle('Record Attendance');
  
  ui.showModalDialog(htmlOutput, 'Record Attendance');
}

/**
 * Records attendance from the form data
 * 
 * @param {Object} formData - Form data from the attendance form
 * @return {string} ID of the newly created attendance record
 */
function recordAttendanceFromForm(formData) {
  // Add the attendance record
  return recordAttendance(formData);
}

/**
 * Records check-out only for the most recent attendance record
 * 
 * @param {Object} formData - Form data with memberId and checkOutTime
 * @return {Object} Result object with success flag and message
 */
function recordCheckOutOnly(formData) {
  const attendanceRecords = getAttendanceRecords({
    memberId: formData.memberId
  });
  
  // Find the most recent attendance record without a check-out time
  const recordsWithoutCheckOut = attendanceRecords.filter(r => !r.checkOutTime);
  
  if (recordsWithoutCheckOut.length === 0) {
    return {
      success: false,
      message: 'No attendance record without check-out found for this member.'
    };
  }
  
  // Sort by check-in time (descending)
  recordsWithoutCheckOut.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
  
  // Update the most recent record
  const mostRecent = recordsWithoutCheckOut[0];
  
  updateAttendance(mostRecent.id, {
    checkOutTime: formData.checkOutTime
  });
  
  return {
    success: true
  };
}

/**
 * Shows the attendance reports panel
 */
function showAttendanceReports() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Activate the Attendance sheet
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  if (attendanceSheet) {
    attendanceSheet.activate();
    ui.alert('Attendance Reports', 'The Attendance sheet is now active. You can view all attendance records here.', ui.ButtonSet.OK);
  } else {
    ui.alert('Error', 'Attendance sheet not found. Please initialize the spreadsheet first.', ui.ButtonSet.OK);
  }
}

/**
 * Shows the payment form
 */
function showPaymentForm() {
  const ui = SpreadsheetApp.getUi();
  const members = getAllMembers({ status: MEMBER_STATUS.ACTIVE });
  const sports = getAllSports().map(s => s.name);
  
  // Create member options HTML
  let memberOptions = '';
  for (const member of members) {
    memberOptions += `<option value="${member.id}">${member.firstName} ${member.lastName}</option>`;
  }
  
  // Create sport options HTML
  let sportOptions = '';
  for (const sport of sports) {
    sportOptions += `<option value="${sport}">${sport}</option>`;
  }
  
  // Create payment type options HTML
  let paymentTypeOptions = '';
  for (const type of PAYMENT_TYPES) {
    paymentTypeOptions += `<option value="${type}">${type}</option>`;
  }
  
  // Create payment status options HTML
  let statusOptions = '';
  for (const status in PAYMENT_STATUS) {
    const value = PAYMENT_STATUS[status];
    statusOptions += `<option value="${value}">${value}</option>`;
  }
  
  // Format current date
  const today = formatDate(new Date());
  
  // Create the form HTML
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
      .btn { background-color: #4285F4; color: white; padding: 10px 15px; border: none; cursor: pointer; }
      .btn:hover { background-color: #3367d6; }
      .checkbox-container { display: flex; align-items: center; }
      .checkbox-container input { width: auto; margin-right: 8px; }
      #periodFields { display: none; }
    </style>
    <h2>Record Payment</h2>
    <form id="paymentForm" onsubmit="submitForm(); return false;">
      <div class="form-group">
        <label for="memberId">Member *</label>
        <select id="memberId" name="memberId" required>
          <option value="">-- Select Member --</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="date">Payment Date *</label>
        <input type="date" id="date" name="date" value="${today}" required>
      </div>
          
      <div class="form-group">
        <label for="amount">Amount *</label>
        <input type="number" id="amount" name="amount" step="0.01" required>
      </div>
      <div class="form-group">
        <label for="paymentType">Payment Type</label>
        <select id="paymentType" name="paymentType">
          ${paymentTypeOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status">
          ${statusOptions}
        </select>
      </div>
      <div class="form-group checkbox-container">
        <input type="checkbox" id="isSubscription" name="isSubscription" onchange="togglePeriodFields()">
        <label for="isSubscription">This is a subscription/membership payment</label>
      </div>
      <div id="periodFields">
        <div class="form-group">
          <label for="periodStart">Period Start</label>
          <input type="date" id="periodStart" name="periodStart" value="${today}">
        </div>
        <div class="form-group">
          <label for="periodEnd">Period End</label>
          <input type="date" id="periodEnd" name="periodEnd">
        </div>
      </div>
      <div class="form-group">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes" rows="2"></textarea>
      </div>
      <button type="submit" class="btn">Record Payment</button>
    </form>
    
    <script>
      // Initialize on load
      document.addEventListener('DOMContentLoaded', function() {
        const sportFees = JSON.parse('${JSON.stringify(getAllSports().reduce((obj, sport) => {
          obj[sport.name] = sport.fee;
          return obj;
        }, {}))}');
        window.sportFees = sportFees;
      });  
      
      function updateFee() {
        const form = document.getElementById('paymentForm');
       
        const fee = 500;
        if (fee) {
          form.amount.value = fee;
          
          // Set period end date (1 month from today)
          if (form.isSubscription.checked) {
            const startDate = new Date(form.periodStart.value);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);
            
            form.periodEnd.value = endDate.toISOString().split('T')[0];
          }
        }
      }
      
      function togglePeriodFields() {
        const periodFields = document.getElementById('periodFields');
        const isSubscription = document.getElementById('isSubscription').checked;
        
        periodFields.style.display = isSubscription ? 'block' : 'none';
        
        if (isSubscription) {
          updateFee(); // This will set the period end date
        }
      }
      
      function submitForm() {
        const form = document.getElementById('paymentForm');
        
        // Validate form
        if (!form.memberId.value || !form.date.value || !form.amount.value) {
          alert('Please fill in all required fields.');
          return;
        }
        
        const formData = {
          memberId: form.memberId.value,
          date: form.date.value,
          amount: parseFloat(form.amount.value),
          paymentType: form.paymentType.value,
          status: form.status.value,
          notes: form.notes.value
        };
        
        if (form.isSubscription.checked) {
          formData.periodStart = form.periodStart.value;
          formData.periodEnd = form.periodEnd.value;
        }
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onFailure)
          .recordPaymentFromForm(formData);
      }
      
      function onSuccess(paymentId) {
        alert('Payment recorded successfully!');
        google.script.host.close();
      }
      
      function onFailure(error) {
        alert('Error recording payment: ' + error);
      }
    </script>
  `)
  .setWidth(400)
  .setHeight(600)
  .setTitle('Record Payment');
  
  ui.showModalDialog(htmlOutput, 'Record Payment');
}

/**
 * Records payment from the form data
 * 
 * @param {Object} formData - Form data from the payment form
 * @return {string} ID of the newly created payment record
 */
function recordPaymentFromForm(formData) {
  // Add the payment record
  return recordPayment(formData);
}

/**
 * Shows the payment reports panel
 */
function showPaymentReports() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Activate the Payments sheet
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  if (paymentsSheet) {
    paymentsSheet.activate();
    ui.alert('Payment Reports', 'The Payments sheet is now active. You can view all payment records here.', ui.ButtonSet.OK);
  } else {
    ui.alert('Error', 'Payments sheet not found. Please initialize the spreadsheet first.', ui.ButtonSet.OK);
  }
}

/**
 * Shows the settings dialog
 */
function showSettings() {
  const ui = SpreadsheetApp.getUi();
  const settings = getSettings();
  
  // Create the form HTML
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input, select { width: 100%; padding: 8px; box-sizing: border-box; }
      .btn { background-color: #4285F4; color: white; padding: 10px 15px; border: none; cursor: pointer; }
      .btn:hover { background-color: #3367d6; }
      .btn-secondary { background-color: #5f6368; margin-left: 10px; }
      .btn-secondary:hover { background-color: #494c50; }
      .button-group { display: flex; justify-content: flex-start; }
    </style>
    <h2>Settings</h2>
    <form id="settingsForm" onsubmit="submitForm(); return false;">
      <div class="form-group">
        <label for="clubName">Club Name</label>
        <input type="text" id="clubName" name="clubName" value="${settings.clubName || ''}">
      </div>
      <div class="form-group">
        <label for="adminEmail">Admin Email</label>
        <input type="email" id="adminEmail" name="adminEmail" value="${settings.adminEmail || ''}">
      </div>
      <div class="form-group">
        <label for="currency">Currency</label>
        <input type="text" id="currency" name="currency" value="${settings.currency || 'USD'}">
      </div>
      <div class="form-group">
        <label for="latePaymentDays">Late Payment Days</label>
        <input type="number" id="latePaymentDays" name="latePaymentDays" value="${settings.latePaymentDays || 5}">
      </div>
      <div class="button-group">
        <button type="submit" class="btn">Save Settings</button>
        <button type="button" class="btn btn-secondary" onclick="createBackup()">Create Backup</button>
      </div>
    </form>
    
    <script>
      function submitForm() {
        const form = document.getElementById('settingsForm');
        const formData = {
          clubName: form.clubName.value,
          adminEmail: form.adminEmail.value,
          currency: form.currency.value,
          latePaymentDays: form.latePaymentDays.value
        };
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onFailure)
          .saveSettings(formData);
      }
      
      function createBackup() {
        google.script.run
          .withSuccessHandler(onBackupSuccess)
          .withFailureHandler(onFailure)
          .createBackupFromUI();
      }
      
      function onSuccess() {
        alert('Settings saved successfully!');
        google.script.host.close();
      }
      
      function onBackupSuccess(backupId) {
        alert('Backup created successfully!\\n\\nYou can find the backup in your Google Drive.');
      }
      
      function onFailure(error) {
        alert('Error: ' + error);
      }
    </script>
  `)
  .setWidth(400)
  .setHeight(350)
  .setTitle('Settings');
  
  ui.showModalDialog(htmlOutput, 'Settings');
}

/**
 * Saves settings from the form data
 * 
 * @param {Object} formData - Form data from the settings form
 * @return {boolean} True if settings were saved successfully
 */
function saveSettings(formData) {
  // Update settings
  updateSetting('Club Name', formData.clubName);
  updateSetting('Admin Email', formData.adminEmail);
  updateSetting('Currency', formData.currency);
  updateSetting('Late Payment Days', formData.latePaymentDays);
  
  return true;
}

/**
 * Creates a backup from the UI
 * 
 * @return {string} ID of the backup spreadsheet
 */
function createBackupFromUI() {
  return createBackup();
}

/**
 * Shows the about dialog
 */
function showAbout() {
  const ui = SpreadsheetApp.getUi();
  const settings = getSettings();
  
  // Create the about HTML
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
      h1 { color: #4285F4; }
      .version { font-size: 0.9em; color: #5f6368; margin-bottom: 20px; }
      .description { text-align: left; margin-bottom: 20px; }
      .footer { font-size: 0.8em; color: #5f6368; margin-top: 30px; }
    </style>
    <h1>${settings.clubName || 'PlayMate Sports Club'}</h1>
    <div class="version">Version ${settings.version || '1.0.0'}</div>
    <div class="description">
      <p>PlayMate is a comprehensive sports membership management application built with Google Apps Script and Google Sheets.</p>
      <p>Features:</p>
      <ul>
        <li>Member management</li>
        <li>Attendance tracking</li>
        <li>Payment processing</li>
        <li>Support for multiple sports</li>
        <li>Reports and analytics</li>
      </ul>
    </div>
    <div class="footer">
      Created: May 25, 2025<br>
      Last Updated: ${formatDate(new Date(settings.lastupdated || new Date()), 'MMMM dd, yyyy')}
    </div>
  `)
  .setWidth(400)
  .setHeight(350)
  .setTitle('About PlayMate');
  
  ui.showModalDialog(htmlOutput, 'About PlayMate');
}