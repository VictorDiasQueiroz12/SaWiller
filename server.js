const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = 3000;
const DB_PATH  = path.join(__dirname, 'dados.json');

// ─── Middlewares ───────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Banco de dados (dados.json) ───────────────────────────

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { usuarios: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── Rotas ────────────────────────────────────────────────

// Cadastro
app.post('/api/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ ok: false, msg: 'Campos obrigatórios ausentes.' });
  }

  const db = readDB();
  const existe = db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existe) {
    return res.status(409).json({ ok: false, msg: 'Este e-mail já está cadastrado.' });
  }

  const novoUsuario = {
    id:         Date.now(),
    nome:       nome.trim(),
    email:      email.trim().toLowerCase(),
    senha,                          // ⚠️ Em produção: use bcrypt para hash
    criadoEm:  new Date().toISOString()
  };

  db.usuarios.push(novoUsuario);
  writeDB(db);

  res.status(201).json({ ok: true, msg: 'Conta criada com sucesso!' });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ ok: false, msg: 'Campos obrigatórios ausentes.' });
  }

  const db      = readDB();
  const usuario = db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!usuario) {
    return res.status(404).json({ ok: false, msg: 'Usuário não encontrado.' });
  }

  if (usuario.senha !== senha) {
    return res.status(401).json({ ok: false, msg: 'Senha incorreta.' });
  }

  // Retorna dados públicos (nunca retorne a senha)
  res.json({ ok: true, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
});

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✦ Orion Capital rodando em http://localhost:${PORT}\n`);
});
