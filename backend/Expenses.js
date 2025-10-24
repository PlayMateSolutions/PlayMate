/**
 * Functions for managing expenses in the Sports Membership Management App
 * Created: September 12, 2025
 */

// Helper to get Tamotsu Expenses table
function getExpensesTable(context) {
  Logger.log("Initializing Expenses table with context: " + JSON.stringify(context));
  Tamotsu.initialize(context.spreadsheet);
  return Tamotsu.Table.define(
    {
      sheetName: SHEET_NAMES.EXPENSES,
      idColumn: "id",
    },
    {
      validate: function (on) {
        this.errors = {};
        if (!this["amount"]) this.errors["amount"] = "can't be blank";
        if (!this["date"]) this.errors["date"] = "can't be blank";
        if (Object.keys(this.errors).length > 0) {
          Logger.log("Validation errors: " + JSON.stringify(this.errors));
        }
        return Object.keys(this.errors).length === 0;
      },
    }
  );
}

/**
 * Records an expense for the gym using Tamotsu
 * @param {Object} expenseData - Object containing expense details
 * @return {string} ID of the newly created expense record
 */
function recordExpense(expenseData) {
  var Expenses = getExpensesTable(expenseData.context);
  if (!expenseData["date"]) expenseData["date"] = new Date();
  var expenseRow = Object.assign({}, expenseData);
  delete expenseRow.context;
  delete expenseRow.id;
  var newExpense = Expenses.create(expenseRow);
  if (newExpense === false) {
    throw new Error("Validation failed: Invalid expense data.");
  }

  Logger.log("Expense context: " + JSON.stringify(expenseData.context));

  // Update last updated timestamp for expenses
  if (expenseData.context && expenseData.context.spreadsheet) {
    updateSetting(
      "Expenses Last Updated",
      new Date().toISOString(),
      expenseData.context.spreadsheet
    );
    Logger.log("Expense recorded: " + JSON.stringify(newExpense));
  }

  return {
    expenseId: newExpense["id"] ? String(newExpense["id"]) : null,
  };
}

/**
 * Get all expenses
 * @param {Object} payload - Request payload with optional filters
 * @return {Object} List of expenses
 */
function getAllExpenses(payload) {
  var Expenses = getExpensesTable(payload.context);
  return Expenses.all().map(function(row) {
    return row;
  });
}
