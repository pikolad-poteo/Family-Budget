const express = require('express');
const { SUPPORTED_LANGUAGES } = require('../scr/i18n');

const router = express.Router();

router.get('/language/:language', (req, res) => {
  const { language } = req.params;

  if (SUPPORTED_LANGUAGES.includes(language)) {
    req.session.language = language;
  }

  res.redirect(req.get('referer') || '/dashboard');
});

module.exports = router;
