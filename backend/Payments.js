/**
 * Functions for managing payments in the Sports Membership Management App
 * Created: May 25, 2025
 */

// Helper to get Tamotsu Payments table
function getPaymentsTable(context) {
  Logger.log("Initializing Payments table with context: " + JSON.stringify(context));
  Tamotsu.initialize(context.spreadsheet);
  return Tamotsu.Table.define(
    {
      sheetName: SHEET_NAMES.PAYMENTS,
      idColumn: "id",
    },
    {
      validate: function (on) {
        this.errors = {};
        if (!this["memberId"]) this.errors["memberId"] = "can't be blank";
        if (!this["amount"]) this.errors["amount"] = "can't be blank";
        if (Object.keys(this.errors).length > 0) {
          Logger.log("Validation errors: " + JSON.stringify(this.errors));
        }
        return Object.keys(this.errors).length === 0;
      },
    }
  );
}

/**
 * Records a payment for a member using Tamotsu
 * @param {Object} paymentData - Object containing payment details
 * @return {string} ID of the newly created payment record
 */
function recordPayment(paymentData) {
  var Payments = getPaymentsTable(paymentData.context);
  // Set defaults if not present
  if (!paymentData["paymentType"]) paymentData["paymentType"] = "Cash";
  if (!paymentData["date"]) paymentData["date"] = new Date();
  // Make a shallow copy and remove context for Tamotsu
  var paymentRow = Object.assign({}, paymentData);
  delete paymentRow.context;
  var newPayment = Payments.create(paymentRow);
  if (newPayment === false) {
    throw new Error("Validation failed: Invalid payment data.");
  }

  // print the context
  Logger.log("Payment context: " + JSON.stringify(paymentData.context));

  // Update last updated timestamp for payments
  if (paymentData.context && paymentData.context.spreadsheet) {
    updateSetting(
      "Payments Last Updated",
      new Date().toISOString(),
      paymentData.context.spreadsheet
    );
    Logger.log("Payment recorded: " + JSON.stringify(newPayment));
  }

  // Extend member's expiry date if payment is successful and has an end period
  let expiryDate = null;
  if (
    paymentData["status"] ===
    (typeof PAYMENT_STATUS !== "undefined" ? PAYMENT_STATUS.PAID : "Paid")
  ) {
    Logger.log(
      "Extending member expiry date for payment to " + paymentData["periodEnd"]
    );
    // print the context
    Logger.log("Payment context: " + JSON.stringify(paymentData.context));

    expiryDate = extendMemberExpiryDate({
      id: paymentData["memberId"],
      periodStart: paymentData["periodStart"],
      periodEnd: paymentData["periodEnd"],
      context: paymentData.context,
    });
  }
  
  return {
    paymentId: newPayment["id"] ? String(newPayment["id"]) : null,
    expiryDate: expiryDate
  };
}

/**
 * Updates a member's expiry date
 *
 * @param {string} memberId - ID of the member to update
 * @param {Date} newExpiryDate - New expiry date
 * @return {boolean} True if update was successful, false otherwise
 */

/**
 * Updates an existing payment record
 *
 * @param {string} paymentId - ID of the payment record to update
 * @param {Object} updatedData - Object containing updated payment details
 * @return {boolean} True if update was successful, false otherwise
 */
function updatePayment(paymentId, updatedData) {
  const ss =
    updatedData.context && updatedData.context.spreadsheet
      ? updatedData.context.spreadsheet
      : SpreadsheetApp.getActiveSpreadsheet();
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);

  // Find the row with the payment ID
  const paymentsData = paymentsSheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < paymentsData.length; i++) {
    if (paymentsData[i][PAYMENTS_COLUMNS.ID] === paymentId) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    return false; // Payment record not found
  }

  // Update only the fields that are provided
  if (updatedData.memberId !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.MEMBER_ID + 1)
      .setValue(updatedData.memberId);
  }

  if (updatedData.date !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.DATE + 1)
      .setValue(updatedData.date);
  }

  if (updatedData.amount !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.AMOUNT + 1)
      .setValue(updatedData.amount);
  }

  if (updatedData.paymentType !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.PAYMENT_TYPE + 1)
      .setValue(updatedData.paymentType);
  }

  if (updatedData.periodStart !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.PERIOD_START + 1)
      .setValue(updatedData.periodStart);
  }

  if (updatedData.periodEnd !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.PERIOD_END + 1)
      .setValue(updatedData.periodEnd);
  }

  if (updatedData.status !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.STATUS + 1)
      .setValue(updatedData.status);
  }

  if (updatedData.notes !== undefined) {
    paymentsSheet
      .getRange(rowIndex, PAYMENTS_COLUMNS.NOTES + 1)
      .setValue(updatedData.notes);
  }

  return true;
}

/**
 * Gets a payment by ID
 *
 * @param {string} paymentId - ID of the payment record to retrieve
 * @return {Object|null} Payment object or null if not found
 */
function getPaymentById(paymentId) {
  const ss =
    arguments[1] && arguments[1].context && arguments[1].context.spreadsheet
      ? arguments[1].context.spreadsheet
      : SpreadsheetApp.getActiveSpreadsheet();
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);

  // Find the row with the payment ID
  const paymentsData = paymentsSheet.getDataRange().getValues();
  let paymentRow = null;

  for (let i = 1; i < paymentsData.length; i++) {
    if (paymentsData[i][PAYMENTS_COLUMNS.ID] === paymentId) {
      paymentRow = paymentsData[i];
      break;
    }
  }

  if (!paymentRow) {
    return null; // Payment record not found
  }

  // Convert row data to a payment object
  return {
    id: paymentRow[PAYMENTS_COLUMNS.ID],
    memberId: paymentRow[PAYMENTS_COLUMNS.MEMBER_ID],
    date: paymentRow[PAYMENTS_COLUMNS.DATE],
    amount: paymentRow[PAYMENTS_COLUMNS.AMOUNT],
    paymentType: paymentRow[PAYMENTS_COLUMNS.PAYMENT_TYPE],
    periodStart: paymentRow[PAYMENTS_COLUMNS.PERIOD_START],
    periodEnd: paymentRow[PAYMENTS_COLUMNS.PERIOD_END],
    status: paymentRow[PAYMENTS_COLUMNS.STATUS],
    notes: paymentRow[PAYMENTS_COLUMNS.NOTES],
  };
}

/**
 * Gets all payment records, optionally filtered by member, date range, or sport
 *
 * @param {Object} filters - Optional filters (memberId, startDate, endDate, sport, status)
 * @return {Array} Array of payment objects
 */
function getPaymentRecords(filters = {}) {
  const ss =
    filters.context && filters.context.spreadsheet
      ? filters.context.spreadsheet
      : SpreadsheetApp.getActiveSpreadsheet();
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);

  // Get all data except header row
  const paymentsData = paymentsSheet.getDataRange().getValues();
  const records = [];

  for (let i = 1; i < paymentsData.length; i++) {
    const row = paymentsData[i];

    // Skip empty rows
    if (!row[PAYMENTS_COLUMNS.ID]) {
      continue;
    }

    // Apply filters
    if (
      filters.memberId &&
      row[PAYMENTS_COLUMNS.MEMBER_ID] !== filters.memberId
    ) {
      continue;
    }

    if (filters.sport && row[PAYMENTS_COLUMNS.SPORT] !== filters.sport) {
      continue;
    }

    if (filters.status && row[PAYMENTS_COLUMNS.STATUS] !== filters.status) {
      continue;
    }

    if (filters.startDate) {
      const recordDate = new Date(row[PAYMENTS_COLUMNS.DATE]);
      const startDate = new Date(filters.startDate);
      if (recordDate < startDate) {
        continue;
      }
    }

    if (filters.endDate) {
      const recordDate = new Date(row[PAYMENTS_COLUMNS.DATE]);
      const endDate = new Date(filters.endDate);
      if (recordDate > endDate) {
        continue;
      }
    }

    // Convert row data to a payment object
    records.push({
      id: row[PAYMENTS_COLUMNS.ID],
      memberId: row[PAYMENTS_COLUMNS.MEMBER_ID],
      date: row[PAYMENTS_COLUMNS.DATE],
      amount: row[PAYMENTS_COLUMNS.AMOUNT],
      paymentType: row[PAYMENTS_COLUMNS.PAYMENT_TYPE],
      periodStart: row[PAYMENTS_COLUMNS.PERIOD_START],
      periodEnd: row[PAYMENTS_COLUMNS.PERIOD_END],
      status: row[PAYMENTS_COLUMNS.STATUS],
      notes: row[PAYMENTS_COLUMNS.NOTES],
    });
  }

  return records;
}

/**
 * Deletes a payment record by ID
 *
 * @param {string} paymentId - ID of the payment record to delete
 * @return {boolean} True if deletion was successful, false otherwise
 */
function deletePayment(paymentId) {
  const ss =
    arguments[1] && arguments[1].context && arguments[1].context.spreadsheet
      ? arguments[1].context.spreadsheet
      : SpreadsheetApp.getActiveSpreadsheet();
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);

  // Find the row with the payment ID
  const paymentsData = paymentsSheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < paymentsData.length; i++) {
    if (paymentsData[i][PAYMENTS_COLUMNS.ID] === paymentId) {
      rowIndex = i + 1; // +1 because arrays are 0-indexed but sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    return false; // Payment record not found
  }

  // Delete the row
  paymentsSheet.deleteRow(rowIndex);

  return true;
}

/**
 * Gets payment summary for a member
 *
 * @param {string} memberId - ID of the member
 * @param {Object} options - Optional filters (startDate, endDate, sport)
 * @return {Object} Summary of payments
 */
function getMemberPaymentSummary(memberId, options = {}) {
  const paymentRecords = getPaymentRecords({
    memberId: memberId,
    startDate: options.startDate,
    endDate: options.endDate,
    sport: options.sport,
    status: PAYMENT_STATUS.PAID, // Only include paid payments
  });

  // Prepare summary
  const summary = {
    totalPayments: paymentRecords.length,
    totalAmount: 0,
    sportBreakdown: {},
    lastPayment: null,
    upcomingRenewal: null,
  };

  if (paymentRecords.length === 0) {
    return summary;
  }

  // Calculate total amount and sport breakdown
  for (const record of paymentRecords) {
    // Add amount
    summary.totalAmount += parseFloat(record.amount);

    // Add to sport breakdown
    if (!summary.sportBreakdown[record.sport]) {
      summary.sportBreakdown[record.sport] = {
        count: 0,
        amount: 0,
      };
    }

    summary.sportBreakdown[record.sport].count += 1;
    summary.sportBreakdown[record.sport].amount += parseFloat(record.amount);
  }

  // Find most recent payment
  summary.lastPayment = paymentRecords.reduce((latest, record) => {
    if (!latest || new Date(record.date) > new Date(latest.date)) {
      return record;
    }
    return latest;
  }, null);

  // Find upcoming renewal (based on the most recent payment with an end period)
  const paymentsWithEndDate = paymentRecords.filter((p) => p.periodEnd);
  if (paymentsWithEndDate.length > 0) {
    summary.upcomingRenewal = paymentsWithEndDate.reduce((latest, record) => {
      if (!latest || new Date(record.periodEnd) > new Date(latest.periodEnd)) {
        return record;
      }
      return latest;
    }, null);
  }

  return summary;
}

/**
 * Gets payment summary for all members or a specific sport
 *
 * @param {Object} options - Optional filters (startDate, endDate, sport)
 * @return {Object} Summary of payments across all members
 */
function getOverallPaymentSummary(options = {}) {
  const paymentRecords = getPaymentRecords({
    startDate: options.startDate,
    endDate: options.endDate,
    sport: options.sport,
    status: PAYMENT_STATUS.PAID, // Only include paid payments
  });

  // Prepare summary
  const summary = {
    totalPayments: paymentRecords.length,
    totalAmount: 0,
    uniqueMembers: new Set(),
    sportBreakdown: {},
    monthBreakdown: {},
  };

  if (paymentRecords.length === 0) {
    return summary;
  }

  // Calculate metrics
  for (const record of paymentRecords) {
    // Add to unique members
    summary.uniqueMembers.add(record.memberId);

    // Add amount
    summary.totalAmount += parseFloat(record.amount);

    // Add to sport breakdown
    if (!summary.sportBreakdown[record.sport]) {
      summary.sportBreakdown[record.sport] = {
        count: 0,
        amount: 0,
        uniqueMembers: new Set(),
      };
    }

    summary.sportBreakdown[record.sport].count += 1;
    summary.sportBreakdown[record.sport].amount += parseFloat(record.amount);
    summary.sportBreakdown[record.sport].uniqueMembers.add(record.memberId);

    // Add to month breakdown
    const monthStr = Utilities.formatDate(
      new Date(record.date),
      Session.getScriptTimeZone(),
      "yyyy-MM"
    );
    if (!summary.monthBreakdown[monthStr]) {
      summary.monthBreakdown[monthStr] = {
        count: 0,
        amount: 0,
      };
    }

    summary.monthBreakdown[monthStr].count += 1;
    summary.monthBreakdown[monthStr].amount += parseFloat(record.amount);
  }

  // Convert Sets to counts for JSON compatibility
  summary.uniqueMembers = summary.uniqueMembers.size;

  for (const sport in summary.sportBreakdown) {
    summary.sportBreakdown[sport].uniqueMembers =
      summary.sportBreakdown[sport].uniqueMembers.size;
  }

  return summary;
}

/**
 * Gets members with pending or overdue payments
 *
 * @param {string} sport - Optional sport filter
 * @return {Array} Array of members with payment status
 */
function getMembersWithPaymentStatus(sport = null) {
  const ss =
    arguments[1] && arguments[1].context && arguments[1].context.spreadsheet
      ? arguments[1].context.spreadsheet
      : SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  const settings = getSettings();

  // Get active members
  const members = getAllMembers({
    status: MEMBER_STATUS.ACTIVE,
    sport: sport,
  });

  const results = [];
  const today = new Date();

  // Check each member's payment status
  for (const member of members) {
    // Skip if sport filter is applied and member doesn't have that sport
    if (sport && !member.sports.includes(sport)) {
      continue;
    }

    // Get the sports to check (either all or just the specified one)
    const sportsToCheck = sport ? [sport] : member.sports;

    for (const sportName of sportsToCheck) {
      // Get the latest payment for this sport
      const payments = getPaymentRecords({
        memberId: member.id,
        sport: sportName,
        status: PAYMENT_STATUS.PAID,
      });

      if (payments.length === 0) {
        // No payments found
        results.push({
          member: member,
          sport: sportName,
          status: "Never paid",
          lastPayment: null,
          daysOverdue: null,
        });
        continue;
      }

      // Find the most recent payment with end date
      const paymentsWithEndDate = payments.filter((p) => p.periodEnd);

      if (paymentsWithEndDate.length === 0) {
        // No payments with end date found
        results.push({
          member: member,
          sport: sportName,
          status: "No subscription end date",
          lastPayment: payments[payments.length - 1],
          daysOverdue: null,
        });
        continue;
      }

      // Sort by end date (descending)
      paymentsWithEndDate.sort(
        (a, b) => new Date(b.periodEnd) - new Date(a.periodEnd)
      );

      const latestPayment = paymentsWithEndDate[0];
      const endDate = new Date(latestPayment.periodEnd);

      // Calculate days until/since end date
      const daysDiff = Math.round((endDate - today) / (1000 * 60 * 60 * 24));

      if (daysDiff > 0) {
        // Payment is current
        results.push({
          member: member,
          sport: sportName,
          status: "Current",
          lastPayment: latestPayment,
          daysRemaining: daysDiff,
        });
      } else if (daysDiff >= -parseInt(settings.latePaymentDays)) {
        // Payment is due soon or recently expired
        results.push({
          member: member,
          sport: sportName,
          status: "Due",
          lastPayment: latestPayment,
          daysOverdue: -daysDiff,
        });
      } else {
        // Payment is overdue
        results.push({
          member: member,
          sport: sportName,
          status: "Overdue",
          lastPayment: latestPayment,
          daysOverdue: -daysDiff,
        });
      }
    }
  }

  return results;
}

/**
 * Gets the monthly fee for a sport
 *
 * @param {string} sportName - Name of the sport
 * @return {number} Monthly fee for the sport
 */
function getSportFee(sportName) {
  const ss =
    arguments[1] && arguments[1].context && arguments[1].context.spreadsheet
      ? arguments[1].context.spreadsheet
      : SpreadsheetApp.getActiveSpreadsheet();
  const sportsSheet = ss.getSheetByName(SHEET_NAMES.SPORTS);

  // Get all sports data
  const sportsData = sportsSheet.getDataRange().getValues();

  // Find the sport
  for (let i = 1; i < sportsData.length; i++) {
    if (sportsData[i][0] === sportName) {
      return parseFloat(sportsData[i][1]);
    }
  }

  return 0; // Default if sport not found
}
