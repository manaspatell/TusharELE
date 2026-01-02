// Admin authentication middleware
const isAdmin = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  // Respect router base path when mounted under a custom admin prefix
  const base = req.baseUrl || '/admin-tushar-ele-8429';
  return res.redirect(`${base}/login`);
};

module.exports = { isAdmin };
