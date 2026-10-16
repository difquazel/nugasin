'use strict';

const { getAdminFirestore, verifyBearerToken } = require('./_firebase-admin');
const { completeTask } = require('../lib/economy');
const { preparePost, parseJsonBody, sendJson, sendError } = require('../lib/http');

module.exports = async function handler(req, res) {
  if (!preparePost(req, res)) return;
  try {
    const user = await verifyBearerToken(req);
    const body = await parseJsonBody(req);
    const result = await completeTask(getAdminFirestore(), user.uid, body.taskId);
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    return sendError(res, error);
  }
};
