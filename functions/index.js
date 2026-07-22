/**
 * functions/index.js
 * -----------------------------------------------------------------------
 * Entry point for all Cloud Functions. Initializes the Admin SDK once,
 * then exports every function from its own file. Add new functions
 * (onDonationWebhook, sendFormNotificationEmail, etc. — see the project
 * plan's `functions/` folder listing) the same way as they're built in
 * later phases.
 * -----------------------------------------------------------------------
 */

const admin = require('firebase-admin');
admin.initializeApp();

exports.setUserRole = require('./setUserRole').setUserRole;
