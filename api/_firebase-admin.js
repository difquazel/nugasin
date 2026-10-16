'use strict';

const { economyError, getJakartaWeekInfo } = require('../lib/economy');
const { parseJsonBody } = require('../lib/http');
let adminSdk;
let initializedApp;
let initError = null;

function getAdminApp() {
  if (initializedApp) return initializedApp;
  try {
    // Explicit service-account credentials only. Never fall back to browser
    // config, application-default credentials, or an unrelated initialized app.
    const env = process.env;
    let serviceAccount;
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      serviceAccount = {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: parsed.private_key || parsed.privateKey
      };
    } else {
      serviceAccount = {
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY
      };
    }
    if (!serviceAccount || !['projectId', 'clientEmail', 'privateKey'].every((key) =>
      typeof serviceAccount[key] === 'string' && serviceAccount[key].trim())) {
      throw new Error('Explicit Firebase Admin credentials are required');
    }
    serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');
    adminSdk = adminSdk || require('firebase-admin');
    initializedApp = adminSdk.initializeApp({
      credential: adminSdk.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId
    }, 'nugasin-privileged');
    initError = null;
    return initializedApp;
  } catch (error) {
    // Keep diagnostics in memory only; never serialize private SDK errors.
    initError = error;
    throw economyError(503, 'SERVER_NOT_CONFIGURED', 'Layanan XP belum dikonfigurasi. Data tugas tetap aman.');
  }
}

function getAdminFirestore() {
  const app = getAdminApp();
  return adminSdk.firestore(app);
}

function getAdminAuth() {
  const app = getAdminApp();
  return adminSdk.auth(app);
}

async function verifyBearerToken(req) {
  const headers = req.headers || {};
  const authHeader = headers.authorization || headers.Authorization || '';
  const match = typeof authHeader === 'string' ? /^Bearer\s+(\S+)$/i.exec(authHeader) : null;
  if (!match || match[1].length > 8192) {
    throw economyError(401, 'UNAUTHORIZED', 'Silakan masuk dengan Google untuk menggunakan XP.');
  }
  const auth = getAdminAuth();
  try {
    return await auth.verifyIdToken(match[1], true);
  } catch (_) {
    throw economyError(401, 'UNAUTHORIZED', 'Sesi akun berakhir atau tidak valid. Silakan masuk kembali.');
  }
}

module.exports = {
  getAdminApp,
  getAdminFirestore,
  getAdminAuth,
  verifyBearerToken,
  getJakartaWeekInfo,
  getCurrentIsoWeekKey: (dateObj = new Date()) => getJakartaWeekInfo(dateObj.getTime()).legacyWeekKey,
  parseJsonBody,
  getInitError: () => initError
};
