'use strict';

// This module deliberately has no Firebase SDK dependency. All privileged writes
// happen in transactions, through an Admin Firestore instance supplied by the API.
const WEEKLY_REWARD_XP = 500;
const REQUIRED_VALID_TASKS = 5;
const THEME_PRICE_XP = 3000;
const PURCHASABLE_THEMES = Object.freeze({
  christmas: Object.freeze({ id: 'christmas', name: 'Christmas 🎄', title: 'Christmas Theme', costXp: THEME_PRICE_XP }),
  nature: Object.freeze({ id: 'nature', name: 'Nature 🌿', title: 'Nature Theme', costXp: THEME_PRICE_XP }),
  antarctica: Object.freeze({ id: 'antarctica', name: 'Antarctica 🐧', title: 'Antarctica Theme', costXp: THEME_PRICE_XP })
});
const KNOWN_THEMES = ['default', 'candy', 'matcha', 'pastel-bento', 'butter-pop', 'pink-flow', ...Object.keys(PURCHASABLE_THEMES)];
const DAY_MS = 86400000;
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

function economyError(statusCode, code, message, details = {}) {
  return Object.assign(new Error(message), { statusCode, code, ...details, isPublic: true });
}

function validDocumentId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128
    && value !== '.' && value !== '..' && !value.includes('/') && !/^__.*__$/.test(value);
}

function requireUser(uid) {
  if (!validDocumentId(uid)) throw economyError(401, 'UNAUTHORIZED', 'Sesi akun tidak valid. Silakan masuk kembali.');
}

function getJakartaWeekInfo(nowMs = Date.now()) {
  if (!Number.isFinite(nowMs)) throw new TypeError('Invalid server time');
  const local = new Date(nowMs + JAKARTA_OFFSET_MS);
  const isoDay = local.getUTCDay() || 7;
  const mondayLocalMs = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - isoDay + 1);
  const weekStartMs = mondayLocalMs - JAKARTA_OFFSET_MS;
  const thursday = new Date(mondayLocalMs + 3 * DAY_MS);
  const isoYear = thursday.getUTCFullYear();
  const weekNo = Math.ceil(((thursday.getTime() - Date.UTC(isoYear, 0, 1)) / DAY_MS + 1) / 7);
  return {
    // Monday's Jakarta calendar date is readable and remains stable at year boundaries.
    weekKey: new Date(mondayLocalMs).toISOString().slice(0, 10),
    legacyWeekKey: `${isoYear}-W${String(weekNo).padStart(2, '0')}`,
    weekStartMs,
    weekEndMs: weekStartMs + 7 * DAY_MS - 1,
    timezone: 'Asia/Jakarta',
    serverTimeMs: nowMs,
    serverNowMs: nowMs
  };
}

function nonNegativeInt(value, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw economyError(503, 'ECONOMY_DATA_INVALID', 'Data XP belum dapat diproses. Silakan coba lagi nanti.');
  }
  return value;
}

function walletValues(data = {}) {
  const xpBalance = nonNegativeInt(data.xpBalance);
  const totalXpSpent = nonNegativeInt(data.totalXpSpent ?? data.lifetimeSpentXp);
  return {
    xpBalance,
    walletVersion: nonNegativeInt(data.walletVersion),
    lifetimeXpEarned: nonNegativeInt(data.lifetimeXpEarned ?? data.lifetimeEarnedXp,
      nonNegativeInt(xpBalance + totalXpSpent)),
    totalXpSpent,
    purchasedThemes: Array.from(new Set(['default', ...(Array.isArray(data.purchasedThemes)
      ? data.purchasedThemes.filter((id) => KNOWN_THEMES.includes(id)) : [])]))
  };
}

function references(db, uid, info) {
  const user = db.collection('users').doc(uid);
  return {
    user,
    wallet: user.collection('economy').doc('wallet'),
    week: user.collection('weeks').doc(info.weekKey),
    reward: user.collection('rewards').doc(info.weekKey),
    legacyReward: user.collection('rewards').doc(info.legacyWeekKey),
    legacyLedger: user.collection('xpTransactions').doc(`weekly_${info.legacyWeekKey}`),
    ledger: user.collection('xpTransactions').doc(`weekly_${info.weekKey}`)
  };
}

async function readWeek(tx, refs) {
  const [wallet, week, reward, legacyReward, legacyLedger, ledger] = await Promise.all([
    tx.get(refs.wallet), tx.get(refs.week), tx.get(refs.reward), tx.get(refs.legacyReward), tx.get(refs.legacyLedger), tx.get(refs.ledger)
  ]);
  return { wallet, week, reward, legacyReward, legacyLedger, ledger };
}

function hasReward(state) {
  return state.reward.exists || state.legacyReward.exists || state.legacyLedger.exists || state.ledger.exists;
}

function existingCount(state) {
  const data = state.week.exists ? state.week.data() : {};
  return Math.max(nonNegativeInt(data.completedCount ?? data.eligibleCount), hasReward(state) ? REQUIRED_VALID_TASKS : 0);
}

function progressValues(info, completedCount, rewarded, nowMs) {
  return {
    weekKey: info.weekKey,
    legacyWeekKey: info.legacyWeekKey,
    weekStartMs: info.weekStartMs,
    weekEndMs: info.weekEndMs,
    timezone: info.timezone,
    completedCount,
    eligibleCount: completedCount,
    requiredCount: REQUIRED_VALID_TASKS,
    rewardXp: WEEKLY_REWARD_XP,
    rewarded,
    updatedAt: new Date(nowMs).toISOString(),
    updatedAtMs: nowMs
  };
}

function resultValues(info, wallet, count, rewarded, xpAwarded = 0, extra = {}) {
  return {
    ...info,
    ...wallet,
    completedCount: count,
    eligibleCount: count,
    requiredCount: REQUIRED_VALID_TASKS,
    rewardXp: WEEKLY_REWARD_XP,
    rewarded,
    xpAwarded,
    ...extra
  };
}

// All reads must be completed before calling this helper.
function writeRewardIfEligible(tx, refs, state, uid, info, count, nowMs) {
  const wallet = walletValues(state.wallet.exists ? state.wallet.data() : {});
  const rewarded = hasReward(state);
  if (rewarded || count < REQUIRED_VALID_TASKS) return { wallet, rewarded, xpAwarded: 0 };
  const nowIso = new Date(nowMs).toISOString();
  const next = {
    ...wallet,
    walletVersion: nonNegativeInt(wallet.walletVersion + 1),
    xpBalance: nonNegativeInt(wallet.xpBalance + WEEKLY_REWARD_XP),
    lifetimeXpEarned: nonNegativeInt(wallet.lifetimeXpEarned + WEEKLY_REWARD_XP)
  };
  tx.create(refs.reward, {
    uid,
    weekKey: info.weekKey,
    legacyWeekKey: info.legacyWeekKey,
    timezone: info.timezone,
    type: 'WEEKLY_5_TASKS',
    xpAwarded: WEEKLY_REWARD_XP,
    completedCount: count,
    claimedAt: nowIso,
    claimedAtMs: nowMs
  });
  tx.create(refs.ledger, {
    txId: `weekly_${info.weekKey}`,
    uid,
    type: 'EARN_WEEKLY_GOAL',
    amount: WEEKLY_REWARD_XP,
    description: 'Weekly Goal Completed',
    weekKey: info.weekKey,
    balanceBefore: wallet.xpBalance,
    balanceAfter: next.xpBalance,
    createdAt: nowIso,
    createdAtMs: nowMs
  });
  tx.set(refs.wallet, {
    ...next,
    lastRewardWeekKey: info.weekKey,
    updatedAt: nowIso,
    updatedAtMs: nowMs
  }, { merge: true });
  return { wallet: next, rewarded: true, xpAwarded: WEEKLY_REWARD_XP };
}

async function completeTask(db, uid, taskId, nowMs = Date.now()) {
  requireUser(uid);
  if (!validDocumentId(taskId)) throw economyError(400, 'INVALID_TASK_ID', 'ID tugas tidak valid.');
  const info = getJakartaWeekInfo(nowMs);
  const refs = references(db, uid, info);
  const taskRef = refs.user.collection('tasks').doc(taskId);
  const receiptRef = refs.user.collection('taskCompletions').doc(taskId);
  return db.runTransaction(async (tx) => {
    const [state, taskSnap, receiptSnap] = await Promise.all([
      readWeek(tx, refs), tx.get(taskRef), tx.get(receiptRef)
    ]);
    const walletData = state.wallet.exists ? state.wallet.data() : {};
    const wallet = walletValues(walletData);
    const count = existingCount(state);
    if (receiptSnap.exists) {
      // Retrying after a timeout, uncompletion, deletion or another week is a no-op.
      return resultValues(info, wallet, count, hasReward(state), 0, {
        taskId, alreadyRecorded: true, receiptWeekKey: receiptSnap.data().weekKey
      });
    }
    const task = taskSnap.exists ? taskSnap.data() : {};
    const legacyRewarded = task.xpRewarded === true || Boolean(task.rewardedWeekKey)
      || (Array.isArray(walletData.rewardedTaskIds) && walletData.rewardedTaskIds.includes(taskId));
    if (legacyRewarded) {
      // Preserve old rewards permanently without re-crediting the task. New code
      // never truncates receipts or relies on the old capped wallet ID array.
      const originalWeek = typeof task.rewardedWeekKey === 'string' ? task.rewardedWeekKey : 'legacy';
      tx.create(receiptRef, {
        uid, taskId, weekKey: originalWeek, legacy: true,
        recordedAt: new Date(nowMs).toISOString(), recordedAtMs: nowMs
      });
      return resultValues(info, wallet, count, hasReward(state), 0, {
        taskId, alreadyRecorded: true, receiptWeekKey: originalWeek
      });
    }
    if (!taskSnap.exists) throw economyError(404, 'TASK_NOT_FOUND', 'Tugas belum tersimpan di cloud. Sinkronkan lalu coba lagi.');
    if (task.id !== taskId || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 500) {
      throw economyError(400, 'INVALID_TASK', 'Tugas harus memiliki ID tetap dan judul yang valid.');
    }
    if (task.status !== 'completed') {
      throw economyError(409, 'TASK_NOT_COMPLETED', 'Tugas belum ditandai selesai di cloud.');
    }
    const nextCount = nonNegativeInt(count + 1);
    const nowIso = new Date(nowMs).toISOString();
    tx.create(receiptRef, {
      uid, taskId, weekKey: info.weekKey, timezone: info.timezone,
      completedAt: nowIso, completedAtMs: nowMs, recordedAt: nowIso, recordedAtMs: nowMs
    });
    // Client completion dates are display data only; trusted time comes from the server.
    tx.update(taskRef, {
      completedAtMs: nowMs, updatedAt: nowIso, updatedAtMs: nowMs, lastModifiedBy: 'server-completion'
    });
    const award = writeRewardIfEligible(tx, refs, state, uid, info, nextCount, nowMs);
    tx.set(refs.week, progressValues(info, nextCount, award.rewarded, nowMs), { merge: true });
    return resultValues(info, award.wallet, nextCount, award.rewarded, award.xpAwarded, {
      taskId, alreadyRecorded: false, receiptWeekKey: info.weekKey
    });
  });
}

async function claimWeeklyReward(db, uid, nowMs = Date.now()) {
  requireUser(uid);
  const info = getJakartaWeekInfo(nowMs);
  const refs = references(db, uid, info);
  const receiptsQuery = refs.user.collection('taskCompletions').where('weekKey', '==', info.weekKey);
  return db.runTransaction(async (tx) => {
    const [state, receipts] = await Promise.all([readWeek(tx, refs), tx.get(receiptsQuery)]);
    // Reconciliation never queries editable client tasks or timestamps.
    const receiptCount = receipts.size ?? receipts.docs.length;
    const count = Math.max(receiptCount + ((state.legacyReward.exists || state.legacyLedger.exists) ? REQUIRED_VALID_TASKS : 0),
      hasReward(state) ? REQUIRED_VALID_TASKS : 0);
    const award = writeRewardIfEligible(tx, refs, state, uid, info, count, nowMs);
    tx.set(refs.week, progressValues(info, count, award.rewarded, nowMs), { merge: true });
    return resultValues(info, award.wallet, count, award.rewarded, award.xpAwarded, {
      alreadyClaimed: hasReward(state)
    });
  });
}

async function purchaseTheme(db, uid, themeId, nowMs = Date.now()) {
  requireUser(uid);
  if (typeof themeId !== 'string' || !Object.hasOwn(PURCHASABLE_THEMES, themeId)) {
    throw economyError(400, 'INVALID_THEME_ID', 'Pilih tema Christmas, Nature, atau Antarctica.');
  }
  const theme = PURCHASABLE_THEMES[themeId];
  const user = db.collection('users').doc(uid);
  const walletRef = user.collection('economy').doc('wallet');
  const purchaseRef = user.collection('purchases').doc(`theme_${themeId}`);
  const ledgerRef = user.collection('xpTransactions').doc(`purchase_${themeId}`);
  const prefRef = user.collection('settings').doc('preferences');
  return db.runTransaction(async (tx) => {
    const [walletSnap, purchaseSnap, ledgerSnap, prefSnap] = await Promise.all([
      tx.get(walletRef), tx.get(purchaseRef), tx.get(ledgerRef), tx.get(prefRef)
    ]);
    const wallet = walletValues(walletSnap.exists ? walletSnap.data() : {});
    const alreadyOwned = wallet.purchasedThemes.includes(themeId) || purchaseSnap.exists || ledgerSnap.exists;
    const nextThemes = Array.from(new Set([...wallet.purchasedThemes, themeId]));
    if (alreadyOwned) {
      // A retried successful purchase is success, with no second deduction.
      const ownedWallet = { ...wallet, purchasedThemes: nextThemes };
      if (!wallet.purchasedThemes.includes(themeId)) {
        ownedWallet.walletVersion = nonNegativeInt(wallet.walletVersion + 1);
        tx.set(walletRef, {
          ...ownedWallet, updatedAt: new Date(nowMs).toISOString(), updatedAtMs: nowMs
        }, { merge: true });
      }
      return { ...ownedWallet, themeId, themeName: theme.name, priceXp: THEME_PRICE_XP, costXp: 0, alreadyOwned: true };
    }
    if (wallet.xpBalance < THEME_PRICE_XP) {
      throw economyError(400, 'INSUFFICIENT_XP_BALANCE', 'Saldo XP belum cukup. Tema ini memerlukan 3.000 XP.', {
        currentBalance: wallet.xpBalance, requiredXp: THEME_PRICE_XP
      });
    }
    const nowIso = new Date(nowMs).toISOString();
    const next = {
      ...wallet,
      walletVersion: nonNegativeInt(wallet.walletVersion + 1),
      xpBalance: wallet.xpBalance - THEME_PRICE_XP,
      totalXpSpent: nonNegativeInt(wallet.totalXpSpent + THEME_PRICE_XP),
      purchasedThemes: nextThemes
    };
    tx.set(walletRef, { ...next, updatedAt: nowIso, updatedAtMs: nowMs }, { merge: true });
    tx.create(purchaseRef, {
      purchaseId: `theme_${themeId}`, uid, themeId, themeName: theme.name, costXp: THEME_PRICE_XP,
      balanceBefore: wallet.xpBalance, balanceAfter: next.xpBalance, purchasedAt: nowIso, purchasedAtMs: nowMs
    });
    tx.create(ledgerRef, {
      txId: `purchase_${themeId}`, uid, themeId, type: 'SPEND_THEME_PURCHASE', amount: -THEME_PRICE_XP,
      description: `${theme.title} Purchased`, balanceBefore: wallet.xpBalance, balanceAfter: next.xpBalance,
      createdAt: nowIso, createdAtMs: nowMs
    });
    if (prefSnap.exists) {
      // Keep the user's free base vibe and independent light/dark setting intact.
      tx.set(prefRef, { profile: { activeTheme: themeId }, updatedAt: nowIso, updatedAtMs: nowMs }, { merge: true });
    }
    return { ...next, themeId, themeName: theme.name, priceXp: THEME_PRICE_XP, costXp: THEME_PRICE_XP, alreadyOwned: false };
  });
}

module.exports = {
  WEEKLY_REWARD_XP, REQUIRED_VALID_TASKS, THEME_PRICE_XP, PURCHASABLE_THEMES,
  economyError, validDocumentId, getJakartaWeekInfo, walletValues,
  completeTask, claimWeeklyReward, purchaseTheme
};
