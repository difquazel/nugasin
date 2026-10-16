'use strict';

const { getAdminFirestore, verifyBearerToken } = require('./_firebase-admin');
const { claimWeeklyReward } = require('../lib/economy');
const { preparePost, parseJsonBody, sendJson, sendError } = require('../lib/http');

module.exports = async function handler(req, res) {
  if (!preparePost(req, res)) return;
  try {
    const user = await verifyBearerToken(req);
    await parseJsonBody(req);
    const result = await claimWeeklyReward(getAdminFirestore(), user.uid);
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    return sendError(res, error);
  }
};
