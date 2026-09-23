/**
 * Optional Production Firebase Cloud Function: createAdminUser
 *
 * Deploy this to Firebase Cloud Functions if you prefer server-side user provisioning
 * via Firebase Admin SDK instead of the client-side secondary auth instance.
 *
 * Deployment:
 * firebase deploy --only functions
 */

/*
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.createAdminUser = functions.https.onCall(async (data, context) => {
  // 1. Verify that the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can create accounts.'
    );
  }

  // 2. Verify that the caller has admin permissions in Firestore
  const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().group_id !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can create new users.'
    );
  }

  const { username, password, groupId, status } = data;

  if (!username || !password) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Username and password are required.'
    );
  }

  const cleanUsername = username.trim().toLowerCase();
  const email = `${cleanUsername}@expensetracker.local`;

  // 3. Create user in Firebase Authentication
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: cleanUsername,
  });

  // 4. Create user profile in Firestore
  const userData = {
    user_id: userRecord.uid,
    username: cleanUsername,
    email: email,
    group_id: groupId || 'field_worker',
    status: status || 'Active',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

  return { success: true, user: userData };
});
*/
