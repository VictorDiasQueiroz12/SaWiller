const $ = (id) => document.getElementById(id);

// Sessão guardada em memória (dura até fechar a aba)
let sessaoAtual = null;

// ── Validação ──────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function setFieldError(errId, msg, inputId) {
  const errEl = $(errId);
  if (errEl) errEl.textContent = msg;
  const input = $(inputId);
  if (input) input.classList.toggle('error-input', !!msg);
}

function clearErrors(errIds, inputIds) {
  errIds.forEach(id => setFieldError(id, '', null));
  inputIds.forEach(id => $(id)?.classList.remove('error-input'));
}

function showAlert(alertId, msg, type) {
  const el = $(alertId);
  el.textContent = msg;
  el.className = `alert ${type}`;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 4000);
}

function validateRegister(nome, email, senha) {
  clearErrors(
    ['regNameErr', 'regEmailErr', 'regPasswordErr'],
    ['regName', 'regEmail', 'regPassword']
  );
  let ok = true;
  if (!nome.trim() || nome.trim().length < 2) {
    setFieldError('regNameErr', 'Nome deve ter pelo menos 2 caracteres.', 'regName');
    ok = false;
  }
  if (!isValidEmail(email)) {
    setFieldError('regEmailErr', 'E-mail inválido.', 'regEmail');
    ok = false;
  }
  if (!senha || senha.length < 6) {
    setFieldError('regPasswordErr', 'Senha precisa ter pelo menos 6 caracteres.', 'regPassword');
    ok = false;
  }
  return ok;
}

function validateLogin(email, senha) {
  clearErrors(
    ['loginEmailErr', 'loginPasswordErr'],
    ['loginEmail', 'loginPassword']
  );
  let ok = true;
  if (!isValidEmail(email)) {
    setFieldError('loginEmailErr', 'E-mail inválido.', 'loginEmail');
    ok = false;
  }
  if (!senha) {
    setFieldError('loginPasswordErr', 'Informe sua senha.', 'loginPassword');
    ok = false;
  }
  return ok;
}

// ── Comunicação com a API (server.js) ─────────────────────

async function apiPost(rota, corpo) {
  const res  = await fetch(rota, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(corpo)
  });
  return res.json(); // sempre retorna { ok, msg, usuario? }
}

// ── Eventos ───────────────────────────────────────────────

$('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const nome  = $('regName').value;
  const email = $('regEmail').value;
  const senha = $('regPassword').value;

  if (!validateRegister(nome, email, senha)) return;

  const btn = this.querySelector('button[type=submit]');
  btn.disabled = true;

  const res = await apiPost('/api/cadastro', { nome, email, senha });

  btn.disabled = false;

  if (!res.ok) {
    showAlert('registerMsg', res.msg, 'error');
    return;
  }

  showAlert('registerMsg', '✓ Conta criada! Agora faça o login.', 'success');
  this.reset();
  setTimeout(() => switchTab('login'), 1500);
});

$('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = $('loginEmail').value;
  const senha = $('loginPassword').value;

  if (!validateLogin(email, senha)) return;

  const btn = this.querySelector('button[type=submit]');
  btn.disabled = true;

  const res = await apiPost('/api/login', { email, senha });

  btn.disabled = false;

  if (!res.ok) {
    showAlert('loginMsg', res.msg, 'error');
    return;
  }

  sessaoAtual = res.usuario; // guarda em memória
  showWelcome(res.usuario);
});

$('logoutBtn').addEventListener('click', () => {
  sessaoAtual = null;
  showAuthScreen();
});

// ── UI ────────────────────────────────────────────────────

function switchTab(tab) {
  const isLogin = tab === 'login';
  $('loginForm').classList.toggle('hidden', !isLogin);
  $('registerForm').classList.toggle('hidden', isLogin);
  $('tabLogin').classList.toggle('active', isLogin);
  $('tabRegister').classList.toggle('active', !isLogin);
  $('tabLogin').setAttribute('aria-selected', isLogin);
  $('tabRegister').setAttribute('aria-selected', !isLogin);
  $('tabIndicator').classList.toggle('right', !isLogin);
  ['loginMsg', 'registerMsg'].forEach(id => $(id).classList.add('hidden'));
}

function togglePassword(inputId, btn) {
  const input   = $(inputId);
  const visible = input.type === 'password';
  input.type    = visible ? 'text' : 'password';
  btn.classList.toggle('active', visible);
  btn.innerHTML = visible
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <line x1="1" y1="1" x2="23" y2="23"/>
       </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>
       </svg>`;
}

function showWelcome(usuario) {
  $('welcomeName').textContent  = usuario.nome;
  $('welcomeEmail').textContent = usuario.email;
  $('authScreen').classList.add('hidden');
  $('welcomeScreen').classList.remove('hidden');
}

function showAuthScreen() {
  $('welcomeScreen').classList.add('hidden');
  $('authScreen').classList.remove('hidden');
  switchTab('login');
}

switchTab('login');
