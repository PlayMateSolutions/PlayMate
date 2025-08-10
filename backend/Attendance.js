// Helper to get Tamotsu Attendance table
function getAttendanceTable(context) {
  Tamotsu.initialize(context.spreadsheet);
  return Tamotsu.Table.define(
    {
      sheetName: SHEET_NAMES.ATTENDANCE,
      idColumn: "ID",
    },
    {
      validate: function (on) {
        this.errors = {};
        if (!this["Member ID"]) this.errors["Member ID"] = "can't be blank";
        if (!this["Date"]) this.errors["Date"] = "can't be blank";

        if (Object.keys(this.errors).length > 0) {
          Logger.log("Validation errors: " + JSON.stringify(this.errors));
        }

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
  if (!attrs["Duration"] && attrs["Check In Time"] && attrs["Check Out Time"]) {
    var checkIn = new Date(attrs["Check In Time"]);
    var checkOut = new Date(attrs["Check Out Time"]);
    attrs["Duration"] = Math.round((checkOut - checkIn) / (1000 * 60));
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
  return newAttendance["ID"] ? String(newAttendance["ID"]) : null;
}

/**
 * Updates an existing attendance record using Tamotsu
 * @param {string} attendanceId - ID of the attendance record to update
 * @param {Object} updatedData - Object containing updated attendance details
 * @return {boolean} True if update was successful, false otherwise
 */
function updateAttendance(attendanceId, updatedData) {
  var Attendance = getAttendanceTable(updatedData.context);
  var attendance = Attendance.find(attendanceId);
  if (!attendance) {
    return false;
  }
  Object.keys(updatedData).forEach(function (key) {
    if (key !== "context" && key !== "ID") {
      attendance[key] = updatedData[key];
    }
  });
  attendance.save();
  return true;
}

/**
 * Gets attendance by ID using Tamotsu
 * @param {string} attendanceId - ID of the attendance record to retrieve
 * @return {Object|null} Attendance object or null if not found
 */
function getAttendanceById(payload) {
  var Attendance = getAttendanceTable(payload.context);
  var attendance = Attendance.find(payload.attendanceId);
  return attendance || null;
}

/**
 * Gets all attendance records, optionally filtered by member, date range, or sport using Tamotsu
 * @param {Object} payload - { context, memberId, startDate, endDate, sport }
 * @return {Array} Array of attendance objects
 */
function getAttendanceRecords(payload = {}) {
  var Attendance = getAttendanceTable(payload.context);
  var records = Attendance.all();
  // Apply filters
  if (payload.memberId) {
    records = records.filter(function (r) {
      return r["Member ID"] === payload.memberId;
    });
  }
  if (payload.sport) {
    records = records.filter(function (r) {
      return r["Sport"] === payload.sport;
    });
  }
  if (payload.startDate) {
    var startDate = new Date(payload.startDate);
    records = records.filter(function (r) {
      return new Date(r["Date"]) >= startDate;
    });
  }
  if (payload.endDate) {
    var endDate = new Date(payload.endDate);
    records = records.filter(function (r) {
      return new Date(r["Date"]) <= endDate;
    });
  }
  return records;
}

/**
 * Deletes an attendance record by ID using Tamotsu
 * @param {Object} payload - { context, attendanceId }
 * @return {boolean} True if deletion was successful, false otherwise
 */
function deleteAttendance(payload) {
  var Attendance = getAttendanceTable(payload.context);
  var attendance = Attendance.find(payload.attendanceId);
  if (!attendance) {
    return false;
  }
  attendance.destroy();
  return true;
}

/**
 * Gets attendance summary for a member using Tamotsu
 * @param {Object} payload - { context, memberId, startDate, endDate, sport }
 * @return {Object} Summary of attendance
 */
function getMemberAttendanceSummary(payload) {
  var attendanceRecords = getAttendanceRecords(payload);
  var summary = {
    totalSessions: attendanceRecords.length,
    totalDuration: 0,
    sportBreakdown: {},
    lastAttendance: null,
  };
  if (attendanceRecords.length === 0) {
    return summary;
  }
  for (var i = 0; i < attendanceRecords.length; i++) {
    var record = attendanceRecords[i];
    if (record["Duration"]) {
      summary.totalDuration += parseInt(record["Duration"]);
    }
    var sport = record["Sport"];
    if (!summary.sportBreakdown[sport]) {
      summary.sportBreakdown[sport] = { sessions: 0, duration: 0 };
    }
    summary.sportBreakdown[sport].sessions += 1;
    if (record["Duration"]) {
      summary.sportBreakdown[sport].duration += parseInt(record["Duration"]);
    }
  }
  summary.lastAttendance = attendanceRecords.reduce(function (latest, record) {
    if (!latest || new Date(record["Date"]) > new Date(latest["Date"])) {
      return record;
    }
    return latest;
  }, null);
  return summary;
}

/**
 * Gets attendance summary for all members or a specific sport using Tamotsu
 * @param {Object} payload - { context, startDate, endDate, sport }
 * @return {Object} Summary of attendance across all members
 */
function getOverallAttendanceSummary(payload = {}) {
  var attendanceRecords = getAttendanceRecords(payload);
  var summary = {
    totalSessions: attendanceRecords.length,
    totalDuration: 0,
    uniqueMembers: new Set(),
    sportBreakdown: {},
    dateBreakdown: {},
  };
  if (attendanceRecords.length === 0) {
    summary.uniqueMembers = 0;
    return summary;
  }
  for (var i = 0; i < attendanceRecords.length; i++) {
    var record = attendanceRecords[i];
    summary.uniqueMembers.add(record["Member ID"]);
    if (record["Duration"]) {
      summary.totalDuration += parseInt(record["Duration"]);
    }
    var sport = record["Sport"];
    if (!summary.sportBreakdown[sport]) {
      summary.sportBreakdown[sport] = {
        sessions: 0,
        duration: 0,
        uniqueMembers: new Set(),
      };
    }
    summary.sportBreakdown[sport].sessions += 1;
    summary.sportBreakdown[sport].uniqueMembers.add(record["Member ID"]);
    if (record["Duration"]) {
      summary.sportBreakdown[sport].duration += parseInt(record["Duration"]);
    }
    var dateStr = Utilities.formatDate(
      new Date(record["Date"]),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
    if (!summary.dateBreakdown[dateStr]) {
      summary.dateBreakdown[dateStr] = {
        sessions: 0,
        uniqueMembers: new Set(),
      };
    }
    summary.dateBreakdown[dateStr].sessions += 1;
    summary.dateBreakdown[dateStr].uniqueMembers.add(record["Member ID"]);
  }
  summary.uniqueMembers = summary.uniqueMembers.size;
  for (var sport in summary.sportBreakdown) {
    summary.sportBreakdown[sport].uniqueMembers =
      summary.sportBreakdown[sport].uniqueMembers.size;
  }
  for (var date in summary.dateBreakdown) {
    summary.dateBreakdown[date].uniqueMembers =
      summary.dateBreakdown[date].uniqueMembers.size;
  }
  return summary;
}
