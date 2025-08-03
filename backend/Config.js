/**
 * Configuration settings for the Sports Membership Management App
 * Created: May 25, 2025
 */

// Sheet names
const SHEET_NAMES = {
  MEMBERS: 'Members',
  ATTENDANCE: 'Attendance',
  PAYMENTS: 'Payments',
  SETTINGS: 'Settings',
  SPORTS: 'Sports'
};

// Column indices for Members sheet
const MEMBERS_COLUMNS = {
  ID: 0,
  FIRST_NAME: 1,
  LAST_NAME: 2,
  EMAIL: 3,
  PHONE: 4,
  PLACE : 5,
  JOIN_DATE: 6,
  STATUS: 7,
  EXPIRY_DATE: 8,
  NOTES: 9
};

// Column indices for Attendance sheet
const ATTENDANCE_COLUMNS = {
  ID: 0,
  MEMBER_ID: 1,
  DATE: 2,
  CHECK_IN_TIME: 3,
  CHECK_OUT_TIME: 4,
  DURATION: 5,
  NOTES: 6
};

// Column indices for Payments sheet
const PAYMENTS_COLUMNS = {
  ID: 0,
  MEMBER_ID: 1,
  DATE: 2,
  AMOUNT: 3,
  PAYMENT_TYPE: 4,
  PERIOD_START: 5,
  PERIOD_END: 6,
  STATUS: 7,
  NOTES: 8
};

// Status options
const MEMBER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended'
};

const PAYMENT_STATUS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled'
};

// Payment types
const PAYMENT_TYPES = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Mobile Payment',
  'Other'
];

// Default sports
const DEFAULT_SPORTS = [
  'Gym',
  'Badminton',
  'Table Tennis',
  'Tennis',
  'Swimming'
];

// API Endpoints
const API_ENDPOINTS = {
  // Member endpoints
  GET_MEMBERS: 'getMembers',
  GET_MEMBER: 'getMember',
  ADD_MEMBER: 'addMember',
  UPDATE_MEMBER: 'updateMember',
  DELETE_MEMBER: 'deleteMember',
  SEARCH_MEMBERS: 'searchMembers',
  
  // Attendance endpoints
  RECORD_ATTENDANCE: 'recordAttendance',
  GET_ATTENDANCE: 'getAttendance',
  GET_MEMBER_ATTENDANCE: 'getMemberAttendance',
  GET_ATTENDANCE_SUMMARY: 'getAttendanceSummary',
  UPDATE_ATTENDANCE: 'updateAttendance',
  
  // Payment endpoints
  RECORD_PAYMENT: 'recordPayment',
  GET_PAYMENTS: 'getPayments',
  GET_MEMBER_PAYMENTS: 'getMemberPayments',
  GET_PAYMENT_SUMMARY: 'getPaymentSummary',
  GET_PAYMENT_STATUS: 'getPaymentStatus',
  
  // Sports endpoints
  GET_SPORTS: 'getSports',
  ADD_SPORT: 'addSport',
  UPDATE_SPORT: 'updateSport',
  
  // Settings endpoints
  GET_SETTINGS: 'getSettings',
  UPDATE_SETTINGS: 'updateSettings'
};