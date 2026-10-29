'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const state = { rugs: [], selected: '', baseline: true, compare: [], filters: new Set() };
  const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
  let toastTimer;
  const roomPath = (slug) => `assets/rooms/${slug || 'baseline'}.webp`;
  const swatchPath = (slug) => `assets/swatches/${slug}.jpg`;
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const getRug = (slug) => state.rugs.find((rug) => rug.slug === slug);
  const tags = (rug) => Array.isArray(rug.tags) ? rug.tags.map((tag) => String(tag).toLowerCase()) : [];

  function notify(message) {
    clearTimeout(toastTimer);
    $('status-message').textContent = message;
    $('status-message').hidden = false;
    toastTimer = setTimeout(() => { $('status-message').hidden = true; }, 4000);
  }

  function readURL() {
    const params = new URL(location.href).searchParams;
    state.selected = getRug(params.get('rug'))?.slug || '';
    state.baseline = !state.selected || params.get('view') === 'baseline';
    state.compare = [...new Set((params.get('compare') || '').split(','))].filter((slug) => getRug(slug)).slice(0, 3);
  }

  function writeURL() {
    const url = new URL(location.href);
    for (const key of ['rug', 'compare', 'view']) url.searchParams.delete(key);
    if (state.selected) url.searchParams.set('rug', state.selected);
    if (state.selected && state.baseline) url.searchParams.set('view', 'baseline');
    if (state.compare.length) url.searchParams.set('compare', state.compare.join(','));
    history.replaceState(null, '', url);
  }

  function imageFallback(event) {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    img.classList.add('image-unavailable');
    if (img.id === 'baseline-image' || img.id === 'selected-image') {
      if (img.id === 'baseline-image' || (!state.baseline && img.id === 'selected-image')) $('room-fallback').hidden = false;
    }
  }
  document.addEventListener('error', imageFallback, true);
  function updateRoomFallback() {
    const images = state.baseline ? [$('baseline-image')] : [$('baseline-image'), $('selected-image')];
    $('room-fallback').hidden = !images.some((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src'));
  }
  $('baseline-image').addEventListener('load', updateRoomFallback);
  $('selected-image').addEventListener('load', updateRoomFallback);

  function renderPreview() {
    const rug = getRug(state.selected);
    const showOriginal = state.baseline || !rug;
    $('rug-select').value = state.selected;
    $('room-stage').classList.toggle('is-baseline', showOriginal);
    $('selected-image').hidden = showOriginal;
    $('slider-controls').hidden = showOriginal;
    $('room-fallback').hidden = true;
    if (rug) {
      const src = roomPath(rug.slug);
      if ($('selected-image').getAttribute('src') !== src) $('selected-image').src = src;
      $('selected-image').alt = `Artist’s visualization of ${rug.name} in the bedroom with the pale pine Japanese queen bed`;
      $('preview-details').innerHTML = `<span class="eyebrow">RANK ${escape(rug.rank)} · ${escape(rug.size || '8 × 11 ft')}</span><p>${escape(rug.name)} <span class="small">${escape(currency.format(rug.price))}</span></p>`;
    } else {
      $('preview-details').innerHTML = '<span class="eyebrow">THE STARTING POINT</span><p>A little space to imagine.</p>';
    }
    $('room-badge').textContent = showOriginal ? 'BASELINE RENDER · NO RUG' : `${rug.name.toUpperCase()} · ARTIST’S VISUALIZATION`;
    $('baseline-toggle').disabled = !rug;
    $('baseline-toggle').textContent = showOriginal ? (rug ? 'Return to rug view' : 'Showing baseline render') : 'View baseline render';
    $('baseline-toggle').setAttribute('aria-pressed', String(showOriginal));
    document.querySelectorAll('[data-preview-thumb]').forEach((button) => {
      const active = button.dataset.previewThumb === (showOriginal ? '' : state.selected);
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateRoomFallback();
  }

  function selectRug(slug, scroll = false) {
    state.selected = getRug(slug)?.slug || '';
    state.baseline = !state.selected;
    renderPreview();
    writeURL();
    if (scroll) $('room-heading').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  function tradeoffs(rug) {
    return `<div class="tradeoffs">${(rug.pros || []).map((text) => `<p>${escape(text)}</p>`).join('')}${(rug.cons || []).map((text) => `<p class="con">${escape(text)}</p>`).join('')}</div>${rug.sourceNote ? `<p class="source-note">Source note: ${escape(rug.sourceNote)}</p>` : ''}`;
  }

  function card(rug, comparison = false) {
    const checked = state.compare.includes(rug.slug);
    const disabled = !checked && state.compare.length >= 3;
    return `<article class="rug-card" data-rug="${escape(rug.slug)}"><div class="card-media"><button type="button" class="card-preview" data-preview="${escape(rug.slug)}" aria-label="Preview ${escape(rug.name)} in the room"><img class="card-room" src="${roomPath(rug.slug)}" alt="Artist’s room visualization with ${escape(rug.name)}" width="1448" height="1086" loading="lazy" decoding="async"><span class="image-action">Preview in room ↗</span></button><span class="rank" aria-label="Rank ${escape(rug.rank)}">${escape(String(rug.rank).padStart(2, '0'))}</span></div><div class="swatch-row"><img class="swatch" src="${swatchPath(rug.slug)}" alt="Actual catalogue swatch of ${escape(rug.name)}" width="140" height="140" loading="lazy" decoding="async"><div class="swatch-copy"><strong>Original catalogue swatch</strong>October catalogue · p. ${escape(rug.page)}</div></div><div class="card-title-row"><h3>${escape(rug.name)}</h3><span class="price">${escape(currency.format(rug.price))}</span></div><p class="product-meta">${escape(rug.size || '8 × 11 ft')} · ${escape(rug.collection || 'Decoliving')} · Catalogue p. ${escape(rug.page)}</p><p class="recommendation">${escape(rug.recommendation)}</p>${tradeoffs(rug)}${comparison ? `<button type="button" class="text-button remove-compare" data-remove="${escape(rug.slug)}" aria-label="Remove ${escape(rug.name)} from shortlist">Remove from shortlist ×</button>` : `<label class="compare-label"><input type="checkbox" data-compare="${escape(rug.slug)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span>Compare ${escape(rug.name)}${disabled ? ' · shortlist full' : ''}</span></label>`}</article>`;
  }

  function renderCollection() {
    const shown = state.rugs.filter((rug) => state.filters.size === 0 || tags(rug).some((tag) => state.filters.has(tag)));
    $('rug-grid').innerHTML = shown.map((rug) => card(rug)).join('');
    if (!shown.length) $('rug-grid').innerHTML = '<p>No rugs match these filters. Select “All twelve” to reset.</p>';
    $('results-count').textContent = `${shown.length} of ${state.rugs.length} rugs${state.filters.size > 1 ? ' · any selected style' : ''}`;
    document.querySelectorAll('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === 'all' ? state.filters.size === 0 : state.filters.has(button.dataset.filter);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function syncCheckboxes() {
    document.querySelectorAll('[data-compare]').forEach((input) => {
      const selected = state.compare.includes(input.dataset.compare);
      input.checked = selected;
      input.disabled = !selected && state.compare.length >= 3;
      const rug = getRug(input.dataset.compare);
      input.nextElementSibling.textContent = `Compare ${rug.name}${input.disabled ? ' · shortlist full' : ''}`;
    });
  }

  function renderComparison() {
    $('compare-grid').innerHTML = state.compare.map((slug) => card(getRug(slug), true)).join('');
    $('compare-empty').hidden = state.compare.length > 0;
    $('clear-compare').hidden = state.compare.length === 0;
    $('compare-count').textContent = `${state.compare.length} of 3 selected${state.compare.length === 3 ? ' · remove a rug to choose another' : ''}`;
    $('nav-count').textContent = state.compare.length;
    syncCheckboxes();
  }

  function changeComparison(slug, include) {
    if (!getRug(slug)) return;
    if (include && !state.compare.includes(slug)) {
      if (state.compare.length === 3) { notify('Choose up to three rugs. Remove one to add another.'); syncCheckboxes(); return; }
      state.compare.push(slug);
    } else if (!include) state.compare = state.compare.filter((item) => item !== slug);
    renderComparison();
    writeURL();
  }

  $('rug-select').addEventListener('change', (event) => selectRug(event.target.value));
  $('baseline-toggle').addEventListener('click', () => { state.baseline = !state.baseline; renderPreview(); writeURL(); });
  $('reveal').addEventListener('input', (event) => {
    const split = Number(event.target.value);
    $('room-stage').style.setProperty('--split', `${100 - split}%`);
    $('reveal-value').textContent = `${split}% reveal`;
    event.target.setAttribute('aria-valuetext', `${split}% of the rug visualization revealed`);
  });
  document.addEventListener('click', (event) => {
    const preview = event.target.closest('[data-preview]');
    if (preview) { selectRug(preview.dataset.preview, true); return; }
    const thumb = event.target.closest('[data-preview-thumb]');
    if (thumb) { selectRug(thumb.dataset.previewThumb); return; }
    const remove = event.target.closest('[data-remove]');
    if (remove) {
      const nextFocus = $('clear-compare');
      changeComparison(remove.dataset.remove, false);
      (nextFocus.hidden ? $('compare-heading') : nextFocus).focus({ preventScroll: true });
      return;
    }
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      const tag = filter.dataset.filter;
      if (tag === 'all') state.filters.clear();
      else if (state.filters.has(tag)) state.filters.delete(tag);
      else state.filters.add(tag);
      renderCollection();
    }
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-compare]')) changeComparison(event.target.dataset.compare, event.target.checked);
  });
  $('clear-compare').addEventListener('click', () => {
    state.compare = [];
    renderComparison();
    writeURL();
    $('compare-heading').focus({ preventScroll: true });
    notify('Shortlist cleared.');
  });
  $('compare-heading').tabIndex = -1;
  $('share').addEventListener('click', async () => {
    writeURL();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(location.href);
      notify('Study link copied, including your room and shortlist.');
    } catch {
      $('share-url').value = location.href;
      $('share-dialog').showModal();
      $('share-url').focus();
      $('share-url').select();
    }
  });
  window.addEventListener('popstate', () => { readURL(); renderPreview(); renderCollection(); renderComparison(); });

  async function init() {
    try {
      const response = await fetch('rugs.json');
      if (!response.ok) throw new Error(`Collection HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length !== 12 || data.some((rug) => !/^[a-z0-9-]+$/.test(rug.slug) || !rug.name || !Number.isFinite(Number(rug.price)))) throw new Error('Invalid collection data');
      state.rugs = data.slice().sort((a, b) => a.rank - b.rank);
      $('rug-select').insertAdjacentHTML('beforeend', state.rugs.map((rug) => `<option value="${escape(rug.slug)}">${escape(rug.name)} · ${escape(currency.format(rug.price))}</option>`).join(''));
      $('preview-thumbnails').innerHTML = `<button class="thumbnail" type="button" data-preview-thumb="" aria-pressed="true"><img src="${roomPath('')}" alt="" width="160" height="110" loading="lazy"><span>No rug</span></button>${state.rugs.map((rug) => `<button class="thumbnail" type="button" data-preview-thumb="${escape(rug.slug)}" aria-pressed="false" aria-label="Preview ${escape(rug.name)}"><img src="${swatchPath(rug.slug)}" alt="" width="160" height="110" loading="lazy"><span>${escape(rug.name)}</span></button>`).join('')}`;
      readURL();
      renderPreview();
      renderCollection();
      renderComparison();
    } catch (error) {
      $('load-error').hidden = false;
      $('results-count').textContent = 'Collection unavailable';
      console.error('Unable to load the rug study:', error);
    }
  }
  init();
})();
