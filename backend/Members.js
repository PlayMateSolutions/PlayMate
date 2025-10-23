/**
 * Extends a member's expiry date based on payment
 * @param {Object} params - { memberId, periodStart, periodEnd, context }
 * @return {string|null} New expiry date in ISO format (e.g., 2025-10-23T13:44:46.753Z) if successful, null otherwise
 */
function extendMemberExpiryDate(params) {
  Logger.log('[extendMemberExpiryDate] params: ' + JSON.stringify(params));
  var Member = getMemberTable(params.context);
  Logger.log('[extendMemberExpiryDate] Member table initialized');
  var member = Member.find(Number(params.id));
  if (!member) {
    Logger.log('[extendMemberExpiryDate] Member not found: ' + params.id);
    return null;
  }
  var currentExpiry = member['expiryDate'] ? new Date(member['expiryDate']) : null;
  var periodStart = params.periodStart ? new Date(params.periodStart) : null;
  var periodEnd = params.periodEnd ? new Date(params.periodEnd) : null;
  if (!periodEnd) {
    Logger.log('[extendMemberExpiryDate] No periodEnd provided.');
    return null;
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
  var isoExpiry = newExpiry.toISOString();
  member['expiryDate'] = isoExpiry;
  Logger.log('[extendMemberExpiryDate] Member updated: ' + JSON.stringify(member));
  member.save();
  Logger.log('[extendMemberExpiryDate] Expiry date set for memberId: ' + params.id + ' to ' + isoExpiry);
  return isoExpiry;
}

// Helper to get Tamotsu Member table
function getMemberTable(context) {
  Tamotsu.initialize(context.spreadsheet);
  return Tamotsu.Table.define(
    {
      sheetName: SHEET_NAMES.MEMBERS,
      idColumn: "id",
    },
    {
      validate: function (on) {
        this.errors = {};
        // Required fields
        if (!this["firstName"]) this.errors["firstName"] = "can't be blank";
        if (!this["phone"]) this.errors["phone"] = "can't be blank";
        // Email format
        if (
          this["email"] &&
          !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this["email"])
        ) {
          this.errors["email"] = "is not a valid email";
        }
        // Status allowed values
        var allowedStatus = ["Active", "Inactive"];
        if (this["status"] && allowedStatus.indexOf(this["status"]) === -1) {
          this.errors["status"] = "must be Active or Inactive";
        }
        // Dates
        if (this["joinDate"] && isNaN(Date.parse(this["joinDate"]))) {
          this.errors["joinDate"] = "is not a valid date";
        }
        if (this["expiryDate"] && isNaN(Date.parse(this["expiryDate"]))) {
          this.errors["expiryDate"] = "is not a valid date";
        }

        // ID must exist on update
        if (on === "update" && !this["id"]) {
          this.errors["id"] = "is required for update";
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
  Logger.log('addMember: memberData = ' + JSON.stringify(memberData));
  var Member = getMemberTable(memberData.context);

  // Check for duplicate phone number
  var existing = Member.where(function (m) {
    return String(m["phone"]) === String(memberData["phone"]);
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
  return newMember["id"] ? String(newMember["id"]) : null;
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
  var member = Member.find(String(memberId));
  if (!member) {
    return false;
  }
  // Update only the fields present in the payload (column header keys)
  Object.keys(payload).forEach(function (key) {
    if (key !== "context" && key !== "id") {
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
    return String(m["phone"]) === String(payload["phone"]);
  }).first();
  return result || null;
}

function getAllMembers(payload) {
  var Member = getMemberTable(payload.context);
  return Member.all();
}
