const crypto = require('crypto');

const requestId = (req, res, next) => {
  const id = req.get('X-Request-ID') || crypto.randomBytes(16).toString('hex');
  req.requestId = id;
  res.set('X-Request-ID', id);
  next();
};

module.exports = requestId;
