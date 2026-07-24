/**
 * functions/index.js
 * -----------------------------------------------------------------------
 * Entry point for all Cloud Functions. Initializes the Admin SDK once,
 * then exports every function from its own file. Add new functions the
 * same way as they're built in later phases.
 * -----------------------------------------------------------------------
 */

const admin = require('firebase-admin');
admin.initializeApp();

exports.setUserRole = require('./setUserRole').setUserRole;
exports.paystackWebhook = require('./paystackWebhook').paystackWebhook;
exports.verifyDonation = require('./verifyDonation').verifyDonation;
exports.scheduledFirestoreBackup = require('./scheduledBackup').scheduledFirestoreBackup;
