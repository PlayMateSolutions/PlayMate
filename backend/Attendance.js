/**
 * Functions for managing attendance in the Sports Membership Management App
 * Created: May 25, 2025
 */

/**
 * Records attendance for a member
 * 
 * @param {Object} attendanceData - Object containing attendance details
 * @return {string} ID of the newly created attendance record
 */
function recordAttendance(attendanceData) {
  const ss = memberData.context.spreadsheet;
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  
  // Generate a unique ID
  const attendanceId = generateUniqueId('ATT');
  
  // Calculate duration if check-in and check-out times are provided
  let duration = attendanceData.duration;
  if (!duration && attendanceData.checkInTime && attendanceData.checkOutTime) {
    const checkIn = new Date(attendanceData.checkInTime);
    const checkOut = new Date(attendanceData.checkOutTime);
    duration = Math.round((checkOut - checkIn) / (1000 * 60)); // Duration in minutes
  }
  
  // Prepare the data row
  const newRow = [
    attendanceId,
    attendanceData.memberId,
    attendanceData.date || new Date(),
    // attendanceData.sport,
    attendanceData.checkInTime || new Date(),
    attendanceData.checkOutTime || '',
    duration || '',
    attendanceData.notes || ''
  ];
  
  // Add the new row to the sheet
  attendanceSheet.appendRow(newRow);
  
  // Format the new row
  const lastRow = attendanceSheet.getLastRow();
  attendanceSheet.getRange(lastRow, ATTENDANCE_COLUMNS.DATE + 1).setNumberFormat('yyyy-mm-dd');
  attendanceSheet.getRange(lastRow, ATTENDANCE_COLUMNS.CHECK_IN_TIME + 1).setNumberFormat('hh:mm:ss am/pm');
  
  if (attendanceData.checkOutTime) {
    attendanceSheet.getRange(lastRow, ATTENDANCE_COLUMNS.CHECK_OUT_TIME + 1).setNumberFormat('hh:mm:ss am/pm');
  }
  
  return attendanceId;
}

/**
 * Updates an existing attendance record
 * 
 * @param {string} attendanceId - ID of the attendance record to update
 * @param {Object} updatedData - Object containing updated attendance details
 * @return {boolean} True if update was successful, false otherwise
 */
function updateAttendance(attendanceId, updatedData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  
  // Find the row with the attendance ID
  const attendanceData = attendanceSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < attendanceData.length; i++) {
    if (attendanceData[i][ATTENDANCE_COLUMNS.ID] === attendanceId) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return false; // Attendance record not found
  }
  
  // Update only the fields that are provided
  if (updatedData.memberId !== undefined) {
    attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.MEMBER_ID + 1).setValue(updatedData.memberId);
  }
  
  if (updatedData.date !== undefined) {
    attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.DATE + 1).setValue(updatedData.date);
  }
  
  if (updatedData.sport !== undefined) {
    attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.SPORT + 1).setValue(updatedData.sport);
  }
  
  if (updatedData.checkInTime !== undefined) {
    attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.CHECK_IN_TIME + 1).setValue(updatedData.checkInTime);
  }
  
  if (updatedData.checkOutTime !== undefined) {
    attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.CHECK_OUT_TIME + 1).setValue(updatedData.checkOutTime);
    
    // Recalculate duration if both check-in and check-out times are available
    const checkInTime = updatedData.checkInTime || attendanceData[rowIndex - 1][ATTENDANCE_COLUMNS.CHECK_IN_TIME];
    const checkOutTime = updatedData.checkOutTime;
    
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);
      const duration = Math.round((checkOut - checkIn) / (1000 * 60)); // Duration in minutes
      attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.DURATION + 1).setValue(duration);
    }
  }
  
  if (updatedData.duration !== undefined) {
    attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.DURATION + 1).setValue(updatedData.duration);
  }
  
  if (updatedData.notes !== undefined) {
    attendanceSheet.getRange(rowIndex, ATTENDANCE_COLUMNS.NOTES + 1).setValue(updatedData.notes);
  }
  
  return true;
}

/**
 * Gets attendance by ID
 * 
 * @param {string} attendanceId - ID of the attendance record to retrieve
 * @return {Object|null} Attendance object or null if not found
 */
function getAttendanceById(attendanceId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  
  // Find the row with the attendance ID
  const attendanceData = attendanceSheet.getDataRange().getValues();
  let attendanceRow = null;
  
  for (let i = 1; i < attendanceData.length; i++) {
    if (attendanceData[i][ATTENDANCE_COLUMNS.ID] === attendanceId) {
      attendanceRow = attendanceData[i];
      break;
    }
  }
  
  if (!attendanceRow) {
    return null; // Attendance record not found
  }
  
  // Convert row data to an attendance object
  return {
    id: attendanceRow[ATTENDANCE_COLUMNS.ID],
    memberId: attendanceRow[ATTENDANCE_COLUMNS.MEMBER_ID],
    date: attendanceRow[ATTENDANCE_COLUMNS.DATE],
    sport: attendanceRow[ATTENDANCE_COLUMNS.SPORT],
    checkInTime: attendanceRow[ATTENDANCE_COLUMNS.CHECK_IN_TIME],
    checkOutTime: attendanceRow[ATTENDANCE_COLUMNS.CHECK_OUT_TIME],
    duration: attendanceRow[ATTENDANCE_COLUMNS.DURATION],
    notes: attendanceRow[ATTENDANCE_COLUMNS.NOTES]
  };
}

/**
 * Gets all attendance records, optionally filtered by member, date range, or sport
 * 
 * @param {Object} filters - Optional filters (memberId, startDate, endDate, sport)
 * @return {Array} Array of attendance objects
 */
function getAttendanceRecords(filters = {}) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  
  // Get all data except header row
  const attendanceData = attendanceSheet.getDataRange().getValues();
  const records = [];
  
  for (let i = 1; i < attendanceData.length; i++) {
    const row = attendanceData[i];
    
    // Skip empty rows
    if (!row[ATTENDANCE_COLUMNS.ID]) {
      continue;
    }
    
    // Apply filters
    if (filters.memberId && row[ATTENDANCE_COLUMNS.MEMBER_ID] !== filters.memberId) {
      continue;
    }
    
    if (filters.sport && row[ATTENDANCE_COLUMNS.SPORT] !== filters.sport) {
      continue;
    }
    
    if (filters.startDate) {
      const recordDate = new Date(row[ATTENDANCE_COLUMNS.DATE]);
      const startDate = new Date(filters.startDate);
      if (recordDate < startDate) {
        continue;
      }
    }
    
    if (filters.endDate) {
      const recordDate = new Date(row[ATTENDANCE_COLUMNS.DATE]);
      const endDate = new Date(filters.endDate);
      if (recordDate > endDate) {
        continue;
      }
    }
    
    // Convert row data to an attendance object
    records.push({
      id: row[ATTENDANCE_COLUMNS.ID],
      memberId: row[ATTENDANCE_COLUMNS.MEMBER_ID],
      date: row[ATTENDANCE_COLUMNS.DATE],
      sport: row[ATTENDANCE_COLUMNS.SPORT],
      checkInTime: row[ATTENDANCE_COLUMNS.CHECK_IN_TIME],
      checkOutTime: row[ATTENDANCE_COLUMNS.CHECK_OUT_TIME],
      duration: row[ATTENDANCE_COLUMNS.DURATION],
      notes: row[ATTENDANCE_COLUMNS.NOTES]
    });
  }
  
  return records;
}

/**
 * Deletes an attendance record by ID
 * 
 * @param {string} attendanceId - ID of the attendance record to delete
 * @return {boolean} True if deletion was successful, false otherwise
 */
function deleteAttendance(attendanceId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const attendanceSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  
  // Find the row with the attendance ID
  const attendanceData = attendanceSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < attendanceData.length; i++) {
    if (attendanceData[i][ATTENDANCE_COLUMNS.ID] === attendanceId) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return false; // Attendance record not found
  }
  
  // Delete the row
  attendanceSheet.deleteRow(rowIndex);
  
  return true;
}

/**
 * Gets attendance summary for a member
 * 
 * @param {string} memberId - ID of the member
 * @param {Object} options - Optional filters (startDate, endDate, sport)
 * @return {Object} Summary of attendance
 */
function getMemberAttendanceSummary(memberId, options = {}) {
  const attendanceRecords = getAttendanceRecords({
    memberId: memberId,
    startDate: options.startDate,
    endDate: options.endDate,
    sport: options.sport
  });
  
  // Prepare summary
  const summary = {
    totalSessions: attendanceRecords.length,
    totalDuration: 0,
    sportBreakdown: {},
    lastAttendance: null
  };
  
  if (attendanceRecords.length === 0) {
    return summary;
  }
  
  // Calculate total duration and sport breakdown
  for (const record of attendanceRecords) {
    // Add duration if available
    if (record.duration) {
      summary.totalDuration += parseInt(record.duration);
    }
    
    // Add to sport breakdown
    if (!summary.sportBreakdown[record.sport]) {
      summary.sportBreakdown[record.sport] = {
        sessions: 0,
        duration: 0
      };
    }
    
    summary.sportBreakdown[record.sport].sessions += 1;
    
    if (record.duration) {
      summary.sportBreakdown[record.sport].duration += parseInt(record.duration);
    }
  }
  
  // Find most recent attendance
  summary.lastAttendance = attendanceRecords.reduce((latest, record) => {
    if (!latest || new Date(record.date) > new Date(latest.date)) {
      return record;
    }
    return latest;
  }, null);
  
  return summary;
}

/**
 * Gets attendance summary for all members or a specific sport
 * 
 * @param {Object} options - Optional filters (startDate, endDate, sport)
 * @return {Object} Summary of attendance across all members
 */
function getOverallAttendanceSummary(options = {}) {
  const attendanceRecords = getAttendanceRecords({
    startDate: options.startDate,
    endDate: options.endDate,
    sport: options.sport
  });
  
  // Prepare summary
  const summary = {
    totalSessions: attendanceRecords.length,
    totalDuration: 0,
    uniqueMembers: new Set(),
    sportBreakdown: {},
    dateBreakdown: {}
  };
  
  if (attendanceRecords.length === 0) {
    return summary;
  }
  
  // Calculate metrics
  for (const record of attendanceRecords) {
    // Add to unique members
    summary.uniqueMembers.add(record.memberId);
    
    // Add duration if available
    if (record.duration) {
      summary.totalDuration += parseInt(record.duration);
    }
    
    // Add to sport breakdown
    if (!summary.sportBreakdown[record.sport]) {
      summary.sportBreakdown[record.sport] = {
        sessions: 0,
        duration: 0,
        uniqueMembers: new Set()
      };
    }
    
    summary.sportBreakdown[record.sport].sessions += 1;
    summary.sportBreakdown[record.sport].uniqueMembers.add(record.memberId);
    
    if (record.duration) {
      summary.sportBreakdown[record.sport].duration += parseInt(record.duration);
    }
    
    // Add to date breakdown
    const dateStr = Utilities.formatDate(new Date(record.date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (!summary.dateBreakdown[dateStr]) {
      summary.dateBreakdown[dateStr] = {
        sessions: 0,
        uniqueMembers: new Set()
      };
    }
    
    summary.dateBreakdown[dateStr].sessions += 1;
    summary.dateBreakdown[dateStr].uniqueMembers.add(record.memberId);
  }
  
  // Convert Sets to counts for JSON compatibility
  summary.uniqueMembers = summary.uniqueMembers.size;
  
  for (const sport in summary.sportBreakdown) {
    summary.sportBreakdown[sport].uniqueMembers = summary.sportBreakdown[sport].uniqueMembers.size;
  }
  
  for (const date in summary.dateBreakdown) {
    summary.dateBreakdown[date].uniqueMembers = summary.dateBreakdown[date].uniqueMembers.size;
  }
  
  return summary;
}