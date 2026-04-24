// Logique d'authentification — injecter dans login.html

const AUTH = {
  getToken:  () => localStorage.getItem('skillmap_token'),
  getUser:   () => JSON.parse(localStorage.getItem('skillmap_user') || 'null'),
  save(token, user, provider) {
    localStorage.setItem('skillmap_token', token);
    localStorage.setItem('skillmap_user', JSON.stringify(user));
    if (provider) localStorage.setItem('skillmap_provider', JSON.stringify(provider));
  },
  logout() {
    localStorage.removeItem('skillmap_token');
    localStorage.removeItem('skillmap_user');
    localStorage.removeItem('skillmap_provider');
    window.location.href = 'login.html';
  },
  isLoggedIn: () => !!localStorage.getItem('skillmap_token'),
  redirectIfLoggedIn() {
    if (!AUTH.isLoggedIn()) return;
    const user = AUTH.getUser();
    if (user?.role === 'admin') window.location.href = 'admin.html';
    else if (user?.role === 'provider') window.location.href = 'home-prestataire.html';
    else window.location.href = 'home-client.html';
  },
  requireAuth() {
    if (!AUTH.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }
};

window.AUTH = AUTH;

// ─── Logique spécifique à login.html ────────────────────────
if (document.getElementById('authForm')) {
  // Éviter la boucle si déjà connecté
  AUTH.redirectIfLoggedIn();

  window.handleSubmit = async function () {
    const btn      = document.querySelector('.btn-submit');
    const btnText  = document.getElementById('btnText');
    // Lire l'état depuis le DOM (robuste quelle que soit la déclaration JS)
    const isLogin  = document.getElementById('tabLogin')?.classList.contains('active') ?? true;
    const isPresta = document.getElementById('modePresta')?.classList.contains('active') ?? false;

    const email    = document.querySelector('input[type="email"]').value.trim();
    const password = document.querySelector('input[type="password"]').value;

    if (!email || !password) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    btn.disabled  = true;
    btnText.textContent = 'Chargement…';
    clearError();

    try {
      let data;
      if (isLogin) {
        data = await api.auth.login({ email, password });
      } else {
        // Enforce role/mode match on registration
        const modePrestaActive = document.getElementById('modePresta')?.classList.contains('active') ?? false;
        if (modePrestaActive && !isPresta) {
          showError('En mode "Je propose", l\'inscription est réservée aux prestataires');
          btn.disabled = false; btnText.textContent = 'Créer mon compte'; return;
        }
        if (!modePrestaActive && isPresta) {
          showError('En mode "Je cherche", l\'inscription est réservée aux clients');
          btn.disabled = false; btnText.textContent = 'Créer mon compte'; return;
        }

        const full_name = document.querySelector('input[placeholder*="Koné"]')?.value?.trim();
        const city      = document.querySelector('input[placeholder*="Cocody"]')?.value?.trim();
        if (!full_name) { showError('Nom complet requis'); return; }

        const body = {
          email, password, full_name,
          city: city || 'Abidjan',
          role: isPresta ? 'provider' : 'client'
        };

        if (isPresta) {
          const title = document.getElementById('jobSelect')?.value?.trim();
          if (!title) { showError('Veuillez choisir votre métier principal'); btn.disabled = false; btnText.textContent = 'Créer mon compte'; return; }
          const chips = [...document.querySelectorAll('.skill-chip.selected')].map(c => c.textContent.trim());
          const rate  = parseInt(document.getElementById('rateInput')?.value) || 0;
          body.title        = title;
          body.skills       = chips;
          body.hourly_rate  = rate || undefined;
          body.neighborhood = document.getElementById('neighborhoodInput')?.value?.trim() || undefined;
          body.description  = document.getElementById('descInput')?.value?.trim() || undefined;
        }

        data = await api.auth.register(body);
      }

      AUTH.save(data.token, data.user, data.provider);
      btnText.textContent = 'Bienvenue !';

      setTimeout(() => {
        const role = data.user.role;
        if (role === 'admin') window.location.href = 'admin.html';
        else if (role === 'provider') window.location.href = 'home-prestataire.html';
        else window.location.href = 'home-client.html';
      }, 600);

    } catch (err) {
      showError(err.message || 'Une erreur est survenue');
      btn.disabled = false;
      btnText.textContent = isLogin ? 'Se connecter' : 'Créer mon compte';
    }
  };

  function showError(msg) {
    let el = document.getElementById('authError');
    if (!el) {
      el = document.createElement('p');
      el.id = 'authError';
      el.style.cssText = 'color:#ff4d2e;font-size:.8rem;margin-top:.8rem;font-family:var(--font-mono);letter-spacing:1px;';
      document.getElementById('authForm').appendChild(el);
    }
    el.textContent = 'Erreur: ' + msg;
  }

  function showError(msg) {
    let el = document.getElementById('authError');
    if (!el) {
      el = document.createElement('p');
      el.id = 'authError';
      el.style.cssText = 'color:#ff4d2e;font-size:.8rem;margin-top:.8rem;font-family:var(--font-mono);letter-spacing:1px;';
      document.getElementById('authForm').appendChild(el);
    }
    el.textContent = 'Erreur: ' + msg;
  }

  function clearError() {
    const el = document.getElementById('authError');
    if (el) el.textContent = '';
  }
}
