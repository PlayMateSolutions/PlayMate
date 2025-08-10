/**
 * Extends a member's expiry date based on payment
 * @param {Object} params - { memberId, periodStart, periodEnd, context }
 * @return {boolean} True if update was successful, false otherwise
 */
function extendMemberExpiryDate(params) {
  Logger.log('[extendMemberExpiryDate] params: ' + JSON.stringify(params));
  var Member = getMemberTable(params.context);
  Logger.log('[extendMemberExpiryDate] Member table initialized');
  var member = Member.find(1);
  if (!member) {
    Logger.log('[extendMemberExpiryDate] Member not found: ' + params.memberId);
    return false;
  }
  var currentExpiry = member['Expiry Date'] ? new Date(member['Expiry Date']) : null;
  var periodStart = params.periodStart ? new Date(params.periodStart) : null;
  var periodEnd = params.periodEnd ? new Date(params.periodEnd) : null;
  if (!periodEnd) {
    Logger.log('[extendMemberExpiryDate] No periodEnd provided.');
    return false;
  }
  var newExpiry;
  if (!currentExpiry || currentExpiry < new Date()) {
    // Expired or no expiry: set to period end
    newExpiry = periodEnd;
  } else {
    // Not expired: extend by the difference between periodEnd and periodStart
    if (periodStart && periodEnd) {
      var diffMs = periodEnd.getTime() - periodStart.getTime();
      newExpiry = new Date(currentExpiry.getTime() + diffMs);
    } else {
      // Fallback: just set to period end
      newExpiry = periodEnd;
    }
  }
  member['Expiry Date'] = newExpiry;
  member.save();
  Logger.log('[extendMemberExpiryDate] Expiry date set for memberId: ' + params.memberId + ' to ' + newExpiry);
  return true;
}

// Helper to get Tamotsu Member table
function getMemberTable(context) {
  Tamotsu.initialize(context.spreadsheet);
  return Tamotsu.Table.define(
    {
      sheetName: SHEET_NAMES.MEMBERS,
      idColumn: "ID",
    },
    {
      validate: function (on) {
        this.errors = {};
        // Required fields
        if (!this["First Name"]) this.errors["First Name"] = "can't be blank";
        if (!this["Phone"]) this.errors["Phone"] = "can't be blank";
        // Email format
        if (
          this["Email"] &&
          !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this["Email"])
        ) {
          this.errors["Email"] = "is not a valid email";
        }
        // Status allowed values
        var allowedStatus = ["Active", "Inactive"];
        if (this["Status"] && allowedStatus.indexOf(this["Status"]) === -1) {
          this.errors["Status"] = "must be Active or Inactive";
        }
        // Dates
        if (this["Join Date"] && isNaN(Date.parse(this["Join Date"]))) {
          this.errors["Join Date"] = "is not a valid date";
        }
        if (this["Expiry Date"] && isNaN(Date.parse(this["Expiry Date"]))) {
          this.errors["Expiry Date"] = "is not a valid date";
        }

        // ID must exist on update
        if (on === "update" && !this["ID"]) {
          this.errors["ID"] = "is required for update";
        }

        if (Object.keys(this.errors).length > 0) {
          Logger.log("Validation errors: " + JSON.stringify(this.errors));
        }

        return Object.keys(this.errors).length === 0;
      },
    }
  );
}
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
  var Member = getMemberTable(memberData.context);

  // Check for duplicate phone number
  var existing = Member.where(function (m) {
    return String(m["Phone"]) === String(memberData["Phone"]);
  }).first();
  if (existing) {
    throw new Error("A member with this phone number already exists.");
  }

  // Use the payload directly as attributes
  var attrs = Object.assign({}, memberData);
  delete attrs.context; // Remove context if present

  var newMember = Member.create(attrs);
  Logger.log('addMember: newMember = ' + JSON.stringify(newMember));
  if (newMember === false) {
    throw new Error('Validation failed: Invalid member data.');
  }

  // Update last updated timestamp for members
  if (memberData.context && memberData.context.spreadsheet) {
    updateSetting(
      "Members Last Updated",
      new Date().toISOString(),
      memberData.context.spreadsheet
    );
  }

  // Return the new member's ID
  return newMember["ID"] ? String(newMember["ID"]) : null;
}

/**
 * Updates an existing member's information
 *
 * @param {string} memberId - ID of the member to update
 * @param {Object} updatedData - Object containing updated member details
 * @return {boolean} True if update was successful, false otherwise
 */
function updateMember(memberId, payload) {
  var Member = getMemberTable(payload.context);
  var member = Member.find(memberId);
  if (!member) {
    return false;
  }
  // Update only the fields present in the payload (column header keys)
  Object.keys(payload).forEach(function (key) {
    if (key !== "context" && key !== "ID") {
      member[key] = payload[key];
    }
  });
  member.save();
  return true;
}

/**
 * Gets a member by ID
 *
 * @param {string} memberId - ID of the member to retrieve
 * @return {Object|null} Member object or null if not found
 */
function getMemberByPhoneNo(payload) {
  var Member = getMemberTable(payload.context);
  var result = Member.where(function (m) {
    return String(m["Phone"]) === String(payload["Phone"]);
  }).first();
  return result || null;
}

function getAllMembers(payload) {
  var Member = getMemberTable(payload.context);
  return Member.all();
}
