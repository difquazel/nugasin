module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    status: 'online',
    platform: process.env.VERCEL ? 'vercel' : 'local',
    credit: 'Made by Maurence',
    serverTime: new Date().toISOString()
  });
};
