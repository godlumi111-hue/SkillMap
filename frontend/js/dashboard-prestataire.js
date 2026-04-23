// Logique du tableau de bord prestataire

AUTH.requireAuth();
const user = AUTH.getUser();
const providerData = JSON.parse(localStorage.getItem('skillmap_provider') || 'null');

if (user?.role !== 'provider') {
  window.location.href = 'home-client.html';
}

// ─── Afficher le nom dans la sidebar ─────────────────────────
document.querySelectorAll('.sidebar-uname').forEach(el => {
  el.textContent = user?.full_name || 'Prestataire';
});
document.querySelectorAll('.sidebar-av').forEach(el => {
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'P';
  el.textContent = initials;
});

// ─── Charger le profil complet ───────────────────────────────
async function loadProfile() {
  try {
    const { user: u, provider: p } = await api.auth.me();
    updateAvailabilityUI(!!p?.is_available);
    loadStats(p?.id);
    loadRequests();
    loadMessages();

    // Wire up "Mon profil public" links with actual provider ID
    if (p?.id) {
      const profileUrl = `provider-profile.html?id=${p.id}`;
      const btnVoir = document.getElementById('btnVoirProfil');
      if (btnVoir) btnVoir.href = profileUrl;
      const btnModifier = document.getElementById('btnModifierProfil');
      if (btnModifier) btnModifier.onclick = () => window.location.href = profileUrl;
      const navMonProfil = document.getElementById('navMonProfil');
      if (navMonProfil) navMonProfil.href = profileUrl;
    }

    // Update sidebar name/avatar from live data
    if (u?.full_name) {
      document.querySelectorAll('.sidebar-uname').forEach(el => el.textContent = u.full_name);
      const initials = u.full_name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      document.querySelectorAll('.sidebar-av').forEach(el => el.textContent = initials);
    }
    if (p?.title) {
      document.querySelector('.pp-role') && (document.querySelector('.pp-role').textContent = p.title + (p.neighborhood ? ' · ' + p.neighborhood : ''));
    }
  } catch {}
}

// ─── Statistiques ─────────────────────────────────────────────
async function loadStats(providerId) {
  const statsGrid = document.querySelector('.stats-grid');
  if (!statsGrid) return;

  try {
    const requests = await api.services.list({ limit: 100 });
    const all = requests.requests || [];
    const completed  = all.filter(r => r.status === 'completed').length;
    const pending    = all.filter(r => r.status === 'pending').length;

    const me = await api.auth.me();
    const p  = me.provider;

    // Reviews
    let avgRating = '—', reviewCount = 0;
    if (p?.id) {
      const { stats } = await api.reviews.list(p.id);
      avgRating    = stats.avg ? `${stats.avg}★` : '—';
      reviewCount  = stats.count || 0;
    }

    const cards = statsGrid.querySelectorAll('.stat-card');
    if (cards[0]) { cards[0].querySelector('.stat-card-num').textContent = completed; cards[0].querySelector('.stat-card-label').textContent = 'Prestations terminées'; }
    if (cards[1]) { cards[1].querySelector('.stat-card-num').style.color = 'var(--accent)'; cards[1].querySelector('.stat-card-num').textContent = avgRating; cards[1].querySelector('.stat-card-label').textContent = 'Note moyenne'; }
    if (cards[2]) { cards[2].querySelector('.stat-card-num').textContent = pending; cards[2].querySelector('.stat-card-label').textContent = 'Demandes en attente'; }
    if (cards[3]) { cards[3].querySelector('.stat-card-num').style.color = 'var(--accent3)'; cards[3].querySelector('.stat-card-num').textContent = p?.views_count || 0; cards[3].querySelector('.stat-card-label').textContent = 'Vues du profil'; }

  } catch {}
}

// ─── Demandes de service ──────────────────────────────────────
async function loadRequests() {
  const container = document.getElementById('requestsList');
  if (!container) return;

  try {
    const { requests } = await api.services.list();
    const pending = requests.filter(r => r.status === 'pending');

    // Badge notification
    const badge = document.querySelector('.snav-badge');
    if (badge) badge.textContent = pending.length || '';

    const statusColors = {
      pending: 'var(--accent)', accepted: 'var(--accent3)',
      in_progress: '#5b9ef4', completed: 'var(--gray-mid)',
      cancelled: 'var(--accent2)', rejected: 'var(--accent2)'
    };
    const statusLabels = {
      pending: 'En attente', accepted: 'Acceptée',
      in_progress: 'En cours', completed: 'Terminée',
      cancelled: 'Annulée', rejected: 'Refusée'
    };

    container.innerHTML = requests.slice(0, 20).map(r => `
      <div style="border:1px solid rgba(30,29,26,.08);background:var(--white);padding:1.1rem 1.2rem;margin-bottom:.6rem;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.5rem;">
          <div>
            <div style="font-size:.9rem;font-weight:500;">${r.title}</div>
            <div style="font-size:.72rem;font-family:var(--font-mono);color:var(--gray-mid);margin-top:.2rem;">${r.client_name} · ${new Date(r.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
          <span style="font-size:.6rem;font-family:var(--font-mono);letter-spacing:1px;padding:.25rem .7rem;border:1px solid ${statusColors[r.status] || 'var(--gray-light)'};color:${statusColors[r.status] || 'var(--gray-mid)'};">${statusLabels[r.status] || r.status}</span>
        </div>
        ${r.description ? `<p style="font-size:.8rem;color:var(--gray-dark);margin-bottom:.8rem;font-weight:300;">${r.description}</p>` : ''}
        ${r.client_phone ? `<div style="font-size:.72rem;font-family:var(--font-mono);color:var(--gray-mid);margin-bottom:.8rem;"><i data-lucide="phone"></i> ${r.client_phone}</div>` : ''}
        ${r.status === 'pending' ? `
          <div style="display:flex;gap:.6rem;">
            <button onclick="updateStatus(${r.id},'accepted')" style="padding:.5rem 1rem;background:var(--accent3);color:var(--black);border:none;cursor:pointer;font-family:var(--font-body);font-size:.72rem;letter-spacing:1px;text-transform:uppercase;">Accepter</button>
            <button onclick="updateStatus(${r.id},'rejected')" style="padding:.5rem 1rem;background:transparent;border:1px solid rgba(30,29,26,.2);cursor:pointer;font-family:var(--font-body);font-size:.72rem;letter-spacing:1px;text-transform:uppercase;">Refuser</button>
          </div>
        ` : r.status === 'accepted' ? `
          <button onclick="updateStatus(${r.id},'completed')" style="padding:.5rem 1rem;background:var(--black);color:var(--white);border:none;cursor:pointer;font-family:var(--font-body);font-size:.72rem;letter-spacing:1px;text-transform:uppercase;">Marquer terminé</button>
        ` : ''}
      </div>
    `).join('') || '<div style="color:var(--gray-mid);font-size:.8rem;font-family:var(--font-mono);">Aucune demande</div>';

  } catch (err) {
    container.innerHTML = `<div style="color:var(--accent2);font-size:.8rem;">${err.message}</div>`;
  }
}

async function updateStatus(id, status) {
  try {
    await api.services.updateStatus(id, status);
    loadRequests();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}

// ─── Messages ────────────────────────────────────────────────
async function loadMessages() {
  const container = document.getElementById('messagesList');
  if (!container) return;

  try {
    const { conversations } = await api.messages.conversations();
    const unread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

    const msgBadge = document.getElementById('msgBadge') || document.querySelector('.snav-badge.green');
    if (msgBadge) { msgBadge.textContent = unread || ''; msgBadge.style.display = unread > 0 ? '' : 'none'; }

    container.innerHTML = conversations.slice(0, 10).map(c => `
      <div style="display:flex;gap:.8rem;padding:.8rem;border:1px solid rgba(30,29,26,.08);background:var(--white);margin-bottom:.4rem;cursor:pointer;" onclick="openConversation(${c.partner_id}, '${c.partner_name}')">
        <div style="width:36px;height:36px;background:rgba(30,29,26,.06);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.9rem;flex-shrink:0;">${c.partner_name?.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:.2rem;">
            <span style="font-size:.82rem;font-weight:500;">${c.partner_name}</span>
            ${c.unread > 0 ? `<span style="background:var(--accent2);color:var(--white);font-size:.6rem;padding:.15rem .4rem;border-radius:2px;">${c.unread}</span>` : ''}
          </div>
          <div style="font-size:.72rem;color:var(--gray-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.last_message}</div>
        </div>
      </div>
    `).join('') || '<div style="color:var(--gray-mid);font-size:.8rem;font-family:var(--font-mono);">Aucun message</div>';

  } catch {}
}

function openConversation(userId, name) {
  const panel = document.getElementById('chatPanel');
  if (!panel) { alert(`Conversation avec ${name} — fonctionnalité en cours`); return; }
  loadThread(userId, name, panel);
}

async function loadThread(userId, name, panel) {
  panel.style.display = 'block';
  panel.innerHTML = `<div style="font-family:var(--font-display);font-size:1.2rem;letter-spacing:1px;margin-bottom:1rem;">${name}</div><div id="threadMessages" style="max-height:300px;overflow-y:auto;margin-bottom:.8rem;"></div>
    <div style="display:flex;gap:.6rem;">
      <input id="replyInput" placeholder="Répondre…" style="flex:1;padding:.6rem .8rem;border:1px solid rgba(30,29,26,.2);background:transparent;font-family:var(--font-body);font-size:.85rem;outline:none;color:var(--black);" onkeydown="if(event.key==='Enter')sendReply(${userId})">
      <button onclick="sendReply(${userId})" style="padding:.6rem 1rem;background:var(--black);color:var(--white);border:none;cursor:pointer;font-size:.8rem;">Envoyer</button>
    </div>`;

  try {
    const { messages } = await api.messages.thread(userId);
    const threadEl = document.getElementById('threadMessages');
    threadEl.innerHTML = messages.map(m => {
      const isMine = m.sender_id === user.id;
      return `<div style="margin-bottom:.5rem;text-align:${isMine?'right':'left'};">
        <span style="display:inline-block;max-width:80%;background:${isMine?'var(--black)':'rgba(30,29,26,.06)'};color:${isMine?'var(--white)':'var(--black)'};padding:.5rem .8rem;font-size:.82rem;">${m.content}</span>
      </div>`;
    }).join('');
    threadEl.scrollTop = threadEl.scrollHeight;
  } catch {}
}

window.sendReply = async function(userId) {
  const input = document.getElementById('replyInput');
  if (!input?.value?.trim()) return;
  try {
    await api.messages.send(userId, input.value.trim());
    input.value = '';
    loadMessages();
  } catch (err) { alert(err.message); }
};

// ─── Disponibilité ────────────────────────────────────────────
function updateAvailabilityUI(isAvail) {
  const pill   = document.querySelector('.toggle-pill');
  const status = document.querySelector('.avail-status');
  if (pill)   pill.classList.toggle('off', !isAvail);
  if (status) { status.textContent = isAvail ? 'Disponible' : 'Indisponible'; status.style.color = isAvail ? 'var(--accent3)' : 'var(--gray-mid)'; }
}

const togglePill = document.querySelector('.toggle-pill');
if (togglePill) {
  togglePill.addEventListener('click', async () => {
    const isNowAvail = togglePill.classList.contains('off');
    try {
      await api.providers.toggleAvailability({ is_available: isNowAvail });
      updateAvailabilityUI(isNowAvail);
    } catch (err) { alert(err.message); }
  });
}

// ─── Navigation sidebar ───────────────────────────────────────
document.querySelectorAll('.snav-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.snav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// ─── Déconnexion ─────────────────────────────────────────────
document.querySelectorAll('[data-action="logout"], .sidebar-footer a[href*="logout"]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); AUTH.logout(); });
});
const logoutLinks = document.querySelectorAll('.sidebar-footer a');
logoutLinks.forEach(a => {
  if (a.textContent.includes('Déconnexion') || a.textContent.includes('Logout')) {
    a.addEventListener('click', e => { e.preventDefault(); AUTH.logout(); });
  }
});

window.updateStatus        = updateStatus;
window.openConversation    = openConversation;

// ─── Init ────────────────────────────────────────────────────
loadProfile();
