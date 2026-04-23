// Logique du tableau de bord client — recherche + carte + favoris + demandes

AUTH.requireAuth();
const user = AUTH.getUser();

// Afficher le nom utilisateur dans la nav
const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U';
document.querySelectorAll('.nav-avatar').forEach(el => {
  el.textContent = initials;
  el.title = user?.full_name;
});

let allProviders = [];
let userLat = null, userLng = null;
let activeCategory = '';
let selectedProvider = null;

// ─── Géolocalisation ─────────────────────────────────────────
function initGeolocation() {
  const locEl = document.querySelector('.nav-loc');
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      if (locEl) { locEl.innerHTML = '<i data-lucide="map-pin"></i> Position détectée'; lucide.createIcons({ el: locEl }); }
      loadProviders();
    },
    () => {
      // Fallback sur Abidjan Centre si refus géoloc
      userLat = 5.3364;
      userLng = -4.0267;
      loadProviders();
    }
  );
}

// ─── Chargement des prestataires ─────────────────────────────
async function loadProviders() {
  const q       = document.querySelector('.nav-search-input')?.value?.trim() || '';
  const listEl  = document.getElementById('providerList');
  const countEl = document.querySelector('.sidebar-count span');

  if (listEl) listEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gray-mid);font-family:var(--font-mono);font-size:.75rem;">Chargement…</div>';

  try {
    const params = { limit: 50 };
    if (q)             params.q        = q;
    if (userLat)       params.lat      = userLat;
    if (userLng)       params.lng      = userLng;
    if (activeCategory) params.category = activeCategory;

    const availToggle = document.getElementById('availToggle');
    if (availToggle && !availToggle.classList.contains('off')) params.available = 'true';

    const distRange = document.getElementById('distRange');
    if (distRange && userLat) params.radius = distRange.value;

    const data = await api.providers.list(params);
    allProviders = data.providers;

    if (countEl) countEl.textContent = allProviders.length;
    renderList(allProviders);
    if (allProviders.length > 0 && !selectedProvider) openDetail(allProviders[0]);

  } catch (err) {
    if (listEl) listEl.innerHTML = `<div style="padding:2rem;color:var(--accent2);font-size:.8rem;">${err.message}</div>`;
  }
}

// ─── Rendu de la liste sidebar ───────────────────────────────
function renderList(providers) {
  const listEl = document.getElementById('providerList');
  if (!listEl) return;

  if (providers.length === 0) {
    listEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gray-mid);font-family:var(--font-mono);font-size:.75rem;">Aucun prestataire trouvé</div>';
    return;
  }

  listEl.innerHTML = providers.map(p => {
    const initials = p.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const dist = p.distance_km !== null ? `${p.distance_km} km` : '';
    const avail = p.is_available
      ? '<span style="color:var(--accent3);font-size:.65rem;font-family:var(--font-mono);">● Disponible</span>'
      : '<span style="color:var(--gray-mid);font-size:.65rem;font-family:var(--font-mono);">● Occupé</span>';
    const stars = '★'.repeat(Math.round(p.avg_rating || 0));

    return `
      <div class="pcard" data-id="${p.id}" onclick="openDetail(${p.id})">
        <div class="pcard-av" style="background:rgba(232,224,58,.1);color:var(--accent);border:1px solid rgba(232,224,58,.2);">${initials}</div>
        <div class="pcard-info">
          <div class="pcard-name">${p.full_name} ${p.is_verified ? '<i data-lucide="shield-check"></i>' : ''}</div>
          <div class="pcard-role">${p.title} · ${p.neighborhood || p.city}</div>
          <div style="display:flex;gap:.8rem;margin-top:.3rem;align-items:center;">
            ${avail}
            ${dist ? `<span style="font-size:.65rem;font-family:var(--font-mono);color:var(--gray-mid);"><i data-lucide="map-pin"></i> ${dist}</span>` : ''}
            ${p.avg_rating ? `<span style="font-size:.68rem;color:var(--accent);">${stars} ${p.avg_rating}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Ouvrir le détail prestataire ─────────────────────────────
async function openDetail(providerOrId) {
  const id = typeof providerOrId === 'object' ? providerOrId.id : providerOrId;

  document.querySelectorAll('.pcard').forEach(c => c.classList.toggle('active', c.dataset.id == id));

  const panel = document.getElementById('detailPanel');
  if (!panel) return;

  panel.innerHTML = '<div style="padding:3rem;text-align:center;color:var(--gray-mid);font-family:var(--font-mono);font-size:.75rem;">Chargement…</div>';

  try {
    const params = {};
    if (userLat) params.lat = userLat;
    if (userLng) params.lng = userLng;

    const p = await api.providers.get(id, params);
    selectedProvider = p;

    const initials = p.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const stars = p.avg_rating ? '★'.repeat(Math.round(p.avg_rating)) + '☆'.repeat(5 - Math.round(p.avg_rating)) : '—';
    const dist  = p.distance_km !== null ? `<i data-lucide="map-pin"></i> ${p.distance_km} km` : '';
    const skillsHtml = (p.skills || []).map(s => `<span class="tag">${s}</span>`).join('');
    const reviewsHtml = (p.reviews || []).slice(0,3).map(r => `
      <div style="padding:1rem;border:1px solid rgba(30,29,26,.08);margin-bottom:.6rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:.4rem;">
          <span style="font-size:.82rem;font-weight:500;">${r.client_name}</span>
          <span style="color:var(--accent);font-size:.78rem;">${'★'.repeat(r.rating)}</span>
        </div>
        <p style="font-size:.8rem;color:var(--gray-mid);font-style:italic;">"${r.comment || ''}"</p>
        <span style="font-size:.65rem;font-family:var(--font-mono);color:var(--gray-mid);">${new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
      </div>
    `).join('') || '<p style="color:var(--gray-mid);font-size:.8rem;">Aucun avis pour le moment.</p>';

    panel.innerHTML = `
      <div style="padding:2rem;">
        <div style="display:flex;align-items:flex-start;gap:1.2rem;margin-bottom:1.5rem;">
          <div style="width:64px;height:64px;background:rgba(232,224,58,.1);color:var(--accent);border:1px solid rgba(232,224,58,.25);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.4rem;flex-shrink:0;">${initials}</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;">
              <h2 style="font-size:1.2rem;font-weight:500;">${p.full_name}</h2>
              ${p.is_verified ? '<span style="background:var(--black);color:var(--accent3);font-size:.6rem;letter-spacing:1px;padding:.25rem .6rem;font-family:var(--font-mono);"><i data-lucide="shield-check"></i> VÉRIFIÉ</span>' : ''}
              ${p.is_available ? '<span style="background:rgba(46,255,158,.1);color:var(--accent3);border:1px solid rgba(46,255,158,.3);font-size:.6rem;letter-spacing:1px;padding:.25rem .6rem;font-family:var(--font-mono);">DISPONIBLE</span>' : '<span style="background:rgba(30,29,26,.05);color:var(--gray-mid);border:1px solid rgba(30,29,26,.1);font-size:.6rem;letter-spacing:1px;padding:.25rem .6rem;font-family:var(--font-mono);">OCCUPÉ</span>'}
            </div>
            <div style="font-family:var(--font-mono);font-size:.72rem;color:var(--gray-mid);margin-top:.3rem;letter-spacing:1px;">${p.title} · ${p.neighborhood || p.city}</div>
            <div style="display:flex;gap:1.2rem;margin-top:.5rem;align-items:center;flex-wrap:wrap;">
              <span style="color:var(--accent);font-size:.85rem;">${stars}</span>
              <span style="font-size:.75rem;color:var(--gray-mid);font-family:var(--font-mono);">${p.avg_rating || '—'}/5 (${p.review_count || 0} avis)</span>
              ${dist ? `<span style="font-size:.72rem;color:var(--accent3);font-family:var(--font-mono);">${dist}</span>` : ''}
              ${p.hourly_rate ? `<span style="font-size:.72rem;font-family:var(--font-mono);color:var(--gray-mid);">${p.hourly_rate.toLocaleString('fr-FR')} FCFA/h</span>` : ''}
            </div>
          </div>
        </div>

        ${p.description ? `<p style="font-size:.85rem;color:var(--gray-dark);line-height:1.75;margin-bottom:1.5rem;font-weight:300;">${p.description}</p>` : ''}

        ${skillsHtml ? `<div style="margin-bottom:1.5rem;"><div style="font-size:.68rem;font-family:var(--font-mono);letter-spacing:2px;text-transform:uppercase;color:var(--gray-mid);margin-bottom:.6rem;">COMPÉTENCES</div><div style="display:flex;flex-wrap:wrap;gap:.4rem;">${skillsHtml}</div></div>` : ''}

        <div style="display:flex;gap:.8rem;margin-bottom:2rem;flex-wrap:wrap;">
          <button onclick="contactProvider(${p.user_id}, '${p.full_name}')" style="flex:1;min-width:120px;padding:.8rem 1.2rem;background:var(--accent);color:var(--black);border:none;cursor:pointer;font-family:var(--font-body);font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;transition:background .2s;" onmouseover="this.style.background='var(--black)';this.style.color='var(--white)'" onmouseout="this.style.background='var(--accent)';this.style.color='var(--black)'"><i data-lucide="message-circle"></i> Contacter</button>
          <button onclick="requestService(${p.id}, '${p.full_name}')" style="flex:1;min-width:120px;padding:.8rem 1.2rem;background:transparent;color:var(--black);border:1px solid rgba(30,29,26,.3);cursor:pointer;font-family:var(--font-body);font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;transition:border-color .2s;"><i data-lucide="check-circle"></i> Demander</button>
          <button onclick="toggleFavorite(${p.id}, this)" id="favBtn-${p.id}" data-fav="false" style="padding:.8rem 1rem;background:transparent;border:1px solid rgba(30,29,26,.2);cursor:pointer;font-size:1.1rem;transition:border-color .2s;" title="Ajouter aux favoris"><i data-lucide="heart"></i></button>
          <a href="provider-profile.html?id=${p.id}" style="padding:.8rem 1rem;background:transparent;border:1px solid rgba(30,29,26,.2);cursor:pointer;font-family:var(--font-mono);font-size:.68rem;letter-spacing:1px;text-transform:uppercase;color:var(--black);text-decoration:none;display:flex;align-items:center;">Profil complet →</a>
        </div>

        <div style="border-top:1px solid rgba(30,29,26,.08);padding-top:1.5rem;">
          <div style="font-family:var(--font-display);font-size:1.2rem;letter-spacing:1px;text-transform:uppercase;margin-bottom:1rem;">Avis clients</div>
          ${reviewsHtml}
          ${(p.reviews?.length || 0) > 0 ? `<div style="margin-top:1rem;"><div style="font-size:.78rem;font-weight:500;margin-bottom:.8rem;">Laisser un avis</div>${reviewForm(p.id)}</div>` : `<div style="margin-top:1rem;">${reviewForm(p.id)}</div>`}
        </div>
      </div>
    `;

    lucide.createIcons();
    checkFavorite(p.id);

  } catch (err) {
    panel.innerHTML = `<div style="padding:2rem;color:var(--accent2);">${err.message}</div>`;
  }
}

function reviewForm(providerId) {
  return `
    <div style="border:1px solid rgba(30,29,26,.08);padding:1rem;">
      <div style="display:flex;gap:.4rem;margin-bottom:.6rem;" id="starPicker-${providerId}">
        ${[1,2,3,4,5].map(n => `<span data-val="${n}" onclick="setRating(${providerId},${n})" style="font-size:1.4rem;cursor:pointer;color:var(--gray-light);transition:color .15s;">★</span>`).join('')}
      </div>
      <textarea id="reviewComment-${providerId}" placeholder="Votre avis…" style="width:100%;padding:.7rem;border:1px solid rgba(30,29,26,.12);background:transparent;font-family:var(--font-body);font-size:.83rem;resize:vertical;min-height:70px;outline:none;color:var(--black);"></textarea>
      <button onclick="submitReview(${providerId})" style="margin-top:.6rem;padding:.6rem 1.4rem;background:var(--black);color:var(--white);border:none;cursor:pointer;font-family:var(--font-body);font-size:.75rem;letter-spacing:1.5px;text-transform:uppercase;">Publier</button>
    </div>
  `;
}

let selectedRatings = {};
function setRating(providerId, val) {
  selectedRatings[providerId] = val;
  document.querySelectorAll(`#starPicker-${providerId} span`).forEach((s, i) => {
    s.style.color = i < val ? 'var(--accent)' : 'var(--gray-light)';
  });
}

async function submitReview(providerId) {
  const rating  = selectedRatings[providerId];
  const comment = document.getElementById(`reviewComment-${providerId}`)?.value?.trim();
  if (!rating) return alert('Veuillez sélectionner une note');
  try {
    await api.reviews.create(providerId, { rating, comment });
    openDetail(providerId);
  } catch (err) {
    alert(err.message);
  }
}

// ─── Favoris ─────────────────────────────────────────────────
async function checkFavorite(providerId) {
  try {
    const { is_favorite } = await api.favorites.check(providerId);
    const btn = document.getElementById(`favBtn-${providerId}`);
    if (btn) { btn.dataset.fav = is_favorite ? 'true' : 'false'; btn.innerHTML = '<i data-lucide="heart"></i>'; btn.style.color = is_favorite ? 'var(--accent2)' : ''; lucide.createIcons({ el: btn }); }
  } catch {}
}

async function toggleFavorite(providerId, btn) {
  try {
    const isFav = btn.dataset.fav === 'true';
    if (isFav) {
      await api.favorites.remove(providerId);
      btn.dataset.fav = 'false'; btn.style.color = '';
    } else {
      await api.favorites.add(providerId);
      btn.dataset.fav = 'true'; btn.style.color = 'var(--accent2)';
    }
    btn.innerHTML = '<i data-lucide="heart"></i>';
    lucide.createIcons({ el: btn });
  } catch (err) {
    alert(err.message);
  }
}

// ─── Contact / messagerie ─────────────────────────────────────
function contactProvider(userId, name) {
  window.location.href = `messages.html?user=${userId}&name=${encodeURIComponent(name)}`;
}

// ─── Demande de service ──────────────────────────────────────
function requestService(providerId, providerName) {
  window.location.href = `provider-profile.html?id=${providerId}&action=request`;
}

// ─── Catégories ──────────────────────────────────────────────
async function loadCategories() {
  try {
    const { categories } = await api.categories.list();
    const wrap = document.querySelector('.cats-wrap');
    if (!wrap) return;
    const pills = [{ slug: '', name: 'Tous' }, ...categories].map(c => `
      <button class="cat-pill${c.slug === activeCategory ? ' active' : ''}" onclick="filterByCategory('${c.slug}')">
        ${c.icon || ''} ${c.name}
      </button>
    `).join('');
    wrap.innerHTML = pills;
  } catch {}
}

function filterByCategory(slug) {
  activeCategory = slug;
  document.querySelectorAll('.cat-pill').forEach(p => {
    const isActive = (p.textContent.includes(slug) && slug) || (!slug && p.textContent.trim().startsWith('Tous'));
    p.classList.toggle('active', p.onclick?.toString().includes(`'${slug}'`));
  });
  loadProviders();
}

window.filterByCategory = filterByCategory;
window.openDetail       = openDetail;
window.toggleFavorite   = toggleFavorite;
window.contactProvider  = contactProvider;
window.requestService   = requestService;
window.setRating        = setRating;
window.submitReview     = submitReview;

// ─── Déconnexion ─────────────────────────────────────────────
document.querySelectorAll('[data-action="logout"]').forEach(el => {
  el.addEventListener('click', AUTH.logout);
});

// ─── Recherche ───────────────────────────────────────────────
const searchInput = document.querySelector('.nav-search-input');
if (searchInput) {
  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(loadProviders, 350);
  });
}
const searchBtn = document.querySelector('.nav-search-btn');
if (searchBtn) searchBtn.addEventListener('click', loadProviders);

// ─── Lecture des paramètres URL (depuis skillmap.html) ───────
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const q        = params.get('q');
  const category = params.get('category');
  const provider = params.get('provider');

  if (q) {
    const input = document.querySelector('.nav-search-input');
    if (input) input.value = q;
  }
  if (category) activeCategory = category;
  if (provider) {
    // Affiche directement la fiche du prestataire demandé
    setTimeout(() => {
      document.getElementById('detailPanel').style.display = 'block';
      openDetail(parseInt(provider));
    }, 900);
  }
}

// ─── Init ────────────────────────────────────────────────────
readUrlParams();
loadCategories();
initGeolocation();
