/**
 * Debug Routes (DISABLED IN PRODUCTION)
 */

const express = require('express');
const router = express.Router();

// ⚠️  ALL DEBUG ENDPOINTS DISABLED FOR SECURITY
// These expose sensitive environment variables and system information

router.get('/info', (req, res) => {
  res.json({
    sucesso: false,
    erro: 'Debug endpoints disabled in production for security reasons',
    tip: 'Set NODE_ENV=development to enable debug features'
  });
});

router.get('/config', (req, res) => {
  res.json({
    sucesso: false,
    erro: 'Debug endpoints disabled in production for security reasons'
  });
});

router.get('/logs', (req, res) => {
  res.json({
    sucesso: false,
    erro: 'Debug endpoints disabled in production for security reasons'
  });
});

module.exports = router;
