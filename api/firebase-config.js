module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const env = process.env || {};

  const apiKey = env.FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '';
  const authDomain = env.FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || '';
  const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '';
  const storageBucket = env.FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET || '';
  const messagingSenderId = env.FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
  const appId = env.FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID || '';

  const configured = Boolean(apiKey && authDomain && projectId && appId);

  res.status(200).json({
    ok: true,
    configured,
    config: configured
      ? {
          apiKey,
          authDomain,
          projectId,
          storageBucket,
          messagingSenderId,
          appId
        }
      : null
  });
};
