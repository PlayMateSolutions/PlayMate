// Helper to get Tamotsu Attendance table
function getAttendanceTable(context) {
  Tamotsu.initialize(context.spreadsheet);
  return Tamotsu.Table.define(
    {
      sheetName: SHEET_NAMES.ATTENDANCE,
      idColumn: "id",
    },
    {
      validate: function (on) {
        this.errors = {};
        if (!this["memberId"]) this.errors["memberId"] = "can't be blank";
        if (!this["date"]) this.errors["date"] = "can't be blank";

        return Object.keys(this.errors).length === 0;
      },
    }
  );
}

/**
 * Records bulk attendance for multiple members
 * @param {Array<Object>} attendanceList - Array of attendance data objects
 * @param {Object} context - Context object (spreadsheet, userEmail, sportsClubId)
 * @return {Object} Summary: { successCount, failureCount, results: Array<{success, error?, index, attendanceId?}> }
 */
function recordBulkAttendance(attendanceList, context) {
  let successCount = 0;
  let failureCount = 0;
  const results = [];
  for (let i = 0; i < attendanceList.length; i++) {
    const data = attendanceList[i];
    try {
      data.context = context;
      const attendanceId = recordAttendance(data);
      results.push({ success: true, index: i, attendanceId });
      successCount++;
    } catch (err) {
      results.push({
        success: false,
        index: i,
        error: err && err.message ? err.message : String(err),
      });
      failureCount++;
    }
  }
  return { successCount, failureCount, results };
}
/**
 * Functions for managing attendance in the Sports Membership Management App
 * Created: May 25, 2025
 */

/**
 * Records attendance for a member using Tamotsu
 * @param {Object} attendanceData - Object containing attendance details
 * @return {string} ID of the newly created attendance record
 */
function recordAttendance(attendanceData) {
  var Attendance = getAttendanceTable(attendanceData.context);
  // Calculate duration if check-in and check-out times are provided
  var attrs = Object.assign({}, attendanceData);
  if (!attrs["duration"] && attrs["checkInTime"] && attrs["checkOutTime"]) {
    var checkIn = new Date(attrs["checkInTime"]);
    var checkOut = new Date(attrs["checkOutTime"]);
    attrs["duration"] = Math.round((checkOut - checkIn) / (1000 * 60));
  }
  
  // Check membership status at the time of attendance
  var Members = getMemberTable(attendanceData.context);
  var member = Members.find(attrs["memberId"]);
  if (member) {
    var attendanceDate = new Date(attrs["date"]);
    var expiryDate = member["expiryDate"] ? new Date(member["expiryDate"]) : null;
    
    // Check if expiry date is valid
    if (expiryDate && !isNaN(expiryDate.getTime())) {
      attrs["daysToExpiry"] = Math.ceil((expiryDate - attendanceDate) / (1000 * 60 * 60 * 24));
    } else {
      attrs["daysToExpiry"] = -1;  // Invalid or empty expiry date
    }
    attrs["membershipStatus"] = attrs["daysToExpiry"] > 0 ? "active" : "expired";
  } else {
    attrs["membershipStatus"] = "unknown";
  }
  
  delete attrs.context;
  var newAttendance = Attendance.create(attrs);
  if (newAttendance === false) {
    throw new Error("Validation failed: Invalid attendance data.");
  }
  // Update last updated timestamp for attendance
  if (attendanceData.context && attendanceData.context.spreadsheet) {
    updateSetting(
      "Attendance Last Updated",
      new Date().toISOString(),
      attendanceData.context.spreadsheet
    );
  }
  return newAttendance["id"] ? String(newAttendance["id"]) : null;
}

/**
 * Gets all attendance records, optionally filtered by member or ID range using Tamotsu
 * @param {Object} payload - { context, memberId, id }
 * @return {Array} Array of attendance objects
 */
function getAttendanceRecords(payload = {}) {
  try {
    var Attendance = getAttendanceTable(payload.context);
    var records = Attendance.all();
    
    // Apply filters
    if (payload.memberId) {
      var filterMemberId = parseInt(payload.memberId);
      records = records.filter(function (r) {
        return r["memberId"] === filterMemberId;
      });
    }

    if (payload.lastAttendanceId) {
      var filterId = parseInt(payload.lastAttendanceId);
      records = records.filter(function (r) {
        return r["id"] > filterId;
      });
    }
    
    return records;
  } catch (error) {
    Logger.log("Error in getAttendanceRecords: " + error.message);
    throw error;
  }
}
