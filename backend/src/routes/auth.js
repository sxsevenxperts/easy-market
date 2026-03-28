/**
 * Auth routes — Smart Market
 * POST /api/v1/auth/login
 */

const express = require('express');
const router = express.Router();
const { generateToken } = require('../middleware/auth');

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, senha, password } = req.body;
  const pass = senha || password;

  if (!email || !pass) {
    return res.status(400).json({ sucesso: false, erro: 'E-mail e senha são obrigatórios' });
  }

  const supabase = req.supabase;
  if (!supabase) {
    return res.status(503).json({ sucesso: false, erro: 'Banco de dados indisponível' });
  }

  try {
    // Buscar loja pelo login_usuario e senha_usuario
    const { data: loja, error } = await supabase
      .from('lojas')
      .select('id, nome, nome_usuario, login_usuario, ativo, plano, data_expiracao, cidade, estado')
      .eq('login_usuario', email)
      .eq('senha_usuario', pass)
      .eq('ativo', true)
      .single();

    if (error || !loja) {
      return res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas' });
    }

    // Verificar expiração
    if (loja.data_expiracao) {
      const expires = new Date(loja.data_expiracao);
      const daysOverdue = Math.max(0, Math.ceil((Date.now() - expires) / 86400000));
      if (daysOverdue >= 30) {
        return res.status(403).json({ sucesso: false, erro: 'Assinatura expirada', daysOverdue });
      }
    }

    const token = generateToken({
      sub: loja.id,
      email: loja.login_usuario,
      nome: loja.nome,
      plano: loja.plano,
    });

    return res.json({
      sucesso: true,
      token,
      loja: {
        id: loja.id,
        nome: loja.nome,
        nome_usuario: loja.nome_usuario,
        email: loja.login_usuario,
        plano: loja.plano,
        cidade: loja.cidade,
        estado: loja.estado,
        data_expiracao: loja.data_expiracao,
      },
    });
  } catch (err) {
    console.error('[Auth] Erro no login:', err.message);
    return res.status(500).json({ sucesso: false, erro: 'Erro interno' });
  }
});

module.exports = router;
