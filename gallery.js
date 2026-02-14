// Gallery System with Series Support
(function() {
  'use strict';

  let currentSeriesIndex = 0;
  let currentImageIndex = 0;
  let allSeries = [];
  let lightboxOpen = false;
  let scale = 1;
  let isDragging = false;
  let startX = 0, startY = 0;
  let translateX = 0, translateY = 0;
  let lastDistance = 0;
  let dragMoved = false;
  let touchStartX = 0;
  let touchStartY = 0;
  const isMobile = () => window.innerWidth <= 768;
  const MOBILE_ZOOM = 1.5;

  document.addEventListener('contextmenu', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });

  // ==============================
  // INIT GALLERY
  // ==============================
  function initGallery(seriesData) {
    allSeries = seriesData;
    const container = document.getElementById('gallery-container');
    if (!container) return;

    seriesData.forEach((series, seriesIdx) => {
      const section = document.createElement('div');
      section.className = 'gallery-series';
      section.dataset.seriesIndex = seriesIdx;

      // Series header
      const header = document.createElement('div');
      header.className = 'series-header';

      const titleEl = document.createElement('h2');
      titleEl.className = 'series-title';
      titleEl.textContent = series.title;
      header.appendChild(titleEl);

      if (series.subtitle) {
        const sub = document.createElement('p');
        sub.className = 'series-subtitle';
        sub.textContent = series.subtitle;
        header.appendChild(sub);
      }

      if (series.description) {
        const descWrap = document.createElement('div');
        descWrap.className = 'series-desc-wrap';

        const descText = document.createElement('p');
        descText.className = 'series-desc';
        descText.textContent = series.description;

        const toggle = document.createElement('button');
        toggle.className = 'desc-toggle';
        toggle.textContent = 'More information';

        let expanded = false;
        toggle.addEventListener('click', () => {
          expanded = !expanded;
          descText.classList.toggle('expanded', expanded);
          toggle.textContent = expanded ? 'Less information' : 'More information';
        });

        descWrap.appendChild(descText);
        descWrap.appendChild(toggle);
        header.appendChild(descWrap);
      }

      section.appendChild(header);

      // Scroll row
      const scrollRow = document.createElement('div');
      scrollRow.className = 'series-scroll-row';

      series.images.forEach((img, imgIdx) => {
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'gallery-thumb-container';

        const thumb = document.createElement('img');
        thumb.className = 'gallery-thumb';
        thumb.loading = 'lazy';
        thumb.style.backgroundColor = '#e0e0e0';

        const r2 = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
        thumb.src = r2 + img.filename;
        thumb.alt = img.title || 'Artwork';

        const label = document.createElement('div');
        label.className = 'museum-label';
        let labelParts = [];
        if (img.title) labelParts.push(img.title);
        if (img.year) labelParts.push(img.year);
        if (img.medium) labelParts.push(img.medium);
        if (img.dimensions) labelParts.push(img.dimensions);
        label.textContent = labelParts.join(', ');

        thumbContainer.appendChild(thumb);
        thumbContainer.appendChild(label);
        thumbContainer.addEventListener('click', () => openLightbox(seriesIdx, imgIdx));
        scrollRow.appendChild(thumbContainer);
      });

      section.appendChild(scrollRow);
      container.appendChild(section);
    });

    createLightbox();
  }

  // ==============================
  // CREATE LIGHTBOX
  // ==============================
  function createLightbox() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <div class="lightbox-image-container">
          <div class="lightbox-loader" style="display:none;position:absolute;z-index:9999;">
            <div style="font-size:3rem;color:white;animation:spin 1.5s linear infinite;">☢</div>
          </div>
          <img id="lightbox-image" src="" alt="" draggable="false" />
        </div>
        <div class="lightbox-caption"></div>
        <div class="lightbox-controls">
          <button class="lightbox-prev" aria-label="Previous">&#8249;</button>
          <button class="lightbox-zoom" aria-label="Toggle zoom">&#x1F50D;</button>
          <div class="zoom-slider-wrap">
            <input type="range" class="zoom-slider" min="25" max="200" value="25" step="5">
            <span class="zoom-label">25%</span>
          </div>
          <button class="lightbox-inquire" aria-label="Inquire">Inquire</button>
          <button class="lightbox-next" aria-label="Next">&#8250;</button>
        </div>
        <div class="lightbox-series-card"></div>
      </div>
    `;
    document.body.appendChild(lb);

    const img = document.getElementById('lightbox-image');
    const imgContainer = lb.querySelector('.lightbox-image-container');
    const zoomSlider = lb.querySelector('.zoom-slider');
    const zoomLabel = lb.querySelector('.zoom-label');
    const sliderWrap = lb.querySelector('.zoom-slider-wrap');

    lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox-prev').addEventListener('click', e => { e.stopPropagation(); if (scale === 1) showPrevImage(); });
    lb.querySelector('.lightbox-next').addEventListener('click', e => { e.stopPropagation(); if (scale === 1) showNextImage(); });
    lb.querySelector('.lightbox-zoom').addEventListener('click', e => { e.stopPropagation(); toggleZoom(); });
    lb.querySelector('.lightbox-inquire').addEventListener('click', e => { e.stopPropagation(); openInquiry(); });

    // Zoom slider (desktop only)
    zoomSlider.addEventListener('input', () => {
      scale = parseInt(zoomSlider.value) / 100;
      zoomLabel.textContent = zoomSlider.value + '%';
      if (scale === 1) {
        resetZoom();
      } else {
        img.classList.add('zoomed');
        imgContainer.classList.add('zoomed');
        updateTransform();
      }
    });

    // Click image to zoom (desktop: use slider value, mobile: fixed 200%)
    imgContainer.addEventListener('click', e => {
      if (e.target !== img) return;
      if (isDragging || dragMoved) return;
      if (isMobile()) {
        if (scale === 1) {
          scale = MOBILE_ZOOM;
          img.classList.add('zoomed');
          imgContainer.classList.add('zoomed');
          // Zoom to click point
          const rect = img.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          translateX = -px * rect.width * scale;
          translateY = -py * rect.height * scale;
          updateTransform();
        } else {
          resetZoom();
        }
      } else {
        if (scale === 1) {
          scale = parseInt(zoomSlider.value) / 100;
          if (scale === 1) scale = 0.5;
          const rect = img.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          translateX = -px * rect.width * scale;
          translateY = -py * rect.height * scale;
          img.classList.add('zoomed');
          imgContainer.classList.add('zoomed');
          sliderWrap.style.display = 'flex';
          updateTransform();
        } else {
          resetZoom();
        }
      }
    });

    // Mouse drag
    img.addEventListener('mousedown', e => {
      if (scale === 1) return;
      isDragging = true;
      dragMoved = false;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      dragMoved = true;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      setTimeout(() => { dragMoved = false; }, 50);
    });

    // Touch handling
    img.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Swipe through images (when not zoomed)
    imgContainer.addEventListener('touchstart', e => {
      if (scale > 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    imgContainer.addEventListener('touchend', e => {
      if (scale > 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) showNextImage();
        else showPrevImage();
      }
    }, { passive: true });

    // Close on backdrop
    lb.addEventListener('click', e => { if (e.target === lb && scale === 1) closeLightbox(); });

    // Keyboard
    document.addEventListener('keydown', handleKeyboard);
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastDistance = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging = true;
      dragMoved = false;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      if (lastDistance > 0) {
        scale = Math.max(1, Math.min(4, scale * (dist / lastDistance)));
        const img = document.getElementById('lightbox-image');
        const container = document.querySelector('.lightbox-image-container');
        if (scale > 1) {
          img.classList.add('zoomed');
          container.classList.add('zoomed');
        } else {
          resetZoom(); return;
        }
        updateTransform();
      }
      lastDistance = dist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault();
      dragMoved = true;
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      updateTransform();
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length === 0) {
      isDragging = false;
      lastDistance = 0;
      setTimeout(() => { dragMoved = false; }, 50);
    }
  }

  function updateTransform() {
    const img = document.getElementById('lightbox-image');
    img.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
  }

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    const img = document.getElementById('lightbox-image');
    const container = document.querySelector('.lightbox-image-container');
    const sliderWrap = document.querySelector('.zoom-slider-wrap');
    if (img) { img.classList.remove('zoomed'); img.style.transform = ''; }
    if (container) container.classList.remove('zoomed');
    if (sliderWrap) sliderWrap.style.display = 'none';
    const slider = document.querySelector('.zoom-slider');
    const label = document.querySelector('.zoom-label');
    if (slider) { slider.value = 150; }
    if (label) label.textContent = '150%';
  }

  function toggleZoom() {
    if (scale > 1) {
      resetZoom();
    } else {
      const img = document.getElementById('lightbox-image');
      const container = document.querySelector('.lightbox-image-container');
      const sliderWrap = document.querySelector('.zoom-slider-wrap');
      const slider = document.querySelector('.zoom-slider');
      scale = isMobile() ? MOBILE_ZOOM : (parseInt(slider.value) / 100 || 2.0);
      translateX = 0;
      translateY = 0;
      img.classList.add('zoomed');
      container.classList.add('zoomed');
      if (!isMobile() && sliderWrap) sliderWrap.style.display = 'flex';
      updateTransform();
    }
  }

  // ==============================
  // LIGHTBOX OPEN/CLOSE
  // ==============================
  function openLightbox(seriesIdx, imgIdx) {
    currentSeriesIndex = seriesIdx;
    currentImageIndex = imgIdx;
    lightboxOpen = true;
    const lb = document.getElementById('lightbox');
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
    showCurrentImage();
    preloadAdjacentImages();
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
    lightboxOpen = false;
    resetZoom();
  }

  function showCurrentImage() {
    const series = allSeries[currentSeriesIndex];
    const image = series.images[currentImageIndex];
    const img = document.getElementById('lightbox-image');
    const caption = document.querySelector('.lightbox-caption');
    const seriesCard = document.querySelector('.lightbox-series-card');
    const inquireBtn = document.querySelector('.lightbox-inquire');
    const loader = document.querySelector('.lightbox-loader');

    seriesCard.style.display = 'none';
    img.style.opacity = '0';

    const r2 = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
    const newSrc = r2 + image.filename;

    // Show loader only if image takes more than 200ms to load
    let loaderTimeout = setTimeout(() => {
      loader.style.display = 'flex';
    }, 200);

    // Load image
    const tempImg = new Image();
    tempImg.onload = () => {
      clearTimeout(loaderTimeout);
      img.src = newSrc;
      img.alt = image.title || 'Artwork';
      img.style.opacity = '1';
      loader.style.display = 'none';
      resetZoom();
    };
    tempImg.onerror = () => {
      clearTimeout(loaderTimeout);
      loader.style.display = 'none';
      img.style.opacity = '1';
    };
    tempImg.src = newSrc;

    let parts = [];
    if (image.title) parts.push(image.title);
    if (image.year) parts.push(image.year);
    if (image.medium) parts.push(image.medium);
    if (image.dimensions) parts.push(image.dimensions);
    caption.textContent = parts.join(', ');
    caption.style.display = parts.length ? 'block' : 'none';

    // Disable inquire for Unstretched series or unavailable images
    const isUnstretched = series.title && series.title.toLowerCase().includes('unstretched');
    inquireBtn.classList.toggle('unavailable', image.available === false || isUnstretched);
  }

  function showNextImage() {
    const series = allSeries[currentSeriesIndex];
    if (currentImageIndex < series.images.length - 1) {
      currentImageIndex++;
      showCurrentImage();
      preloadAdjacentImages();
    } else if (currentSeriesIndex < allSeries.length - 1) {
      showSeriesTransition('next');
    }
  }

  function showPrevImage() {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      showCurrentImage();
      preloadAdjacentImages();
    } else if (currentSeriesIndex > 0) {
      showSeriesTransition('prev');
    }
  }

  function showSeriesTransition(direction) {
    const seriesCard = document.querySelector('.lightbox-series-card');
    const img = document.getElementById('lightbox-image');
    const caption = document.querySelector('.lightbox-caption');
    img.style.display = 'none';
    caption.style.display = 'none';
    seriesCard.style.display = 'flex';
    const nextIdx = direction === 'next' ? currentSeriesIndex + 1 : currentSeriesIndex - 1;
    const next = allSeries[nextIdx];
    seriesCard.innerHTML = `
      <h2>${next.title}</h2>
      ${next.subtitle ? `<p>${next.subtitle}</p>` : ''}
      <div class="series-arrow">${direction === 'next' ? '→' : '←'}</div>
    `;
    setTimeout(() => {
      if (!lightboxOpen) return;
      currentSeriesIndex = nextIdx;
      currentImageIndex = direction === 'next' ? 0 : allSeries[nextIdx].images.length - 1;
      img.style.display = 'block';
      showCurrentImage();
      preloadAdjacentImages();
    }, 1500);
  }

  function openInquiry() {
    const image = allSeries[currentSeriesIndex].images[currentImageIndex];
    if (image.available === false) return;
    const subject = encodeURIComponent(`Inquiry: ${image.title || 'Artwork'}`);
    const body = encodeURIComponent(
      `I am interested in the following work:\n\nTitle: ${image.title || 'Untitled'}\nYear: ${image.year || 'N/A'}\nMedium: ${image.medium || 'N/A'}\n` +
      (image.dimensions ? `Dimensions: ${image.dimensions}\n` : '') +
      `\n\nMessage:\n\n`
    );
    window.open(`mailto:newell.pdx@gmail.com?subject=${subject}&body=${body}`, '_blank');
  }

  function preloadAdjacentImages() {
    const r2 = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
    const series = allSeries[currentSeriesIndex];
    for (let offset = -2; offset <= 2; offset++) {
      if (offset === 0) continue;
      const idx = currentImageIndex + offset;
      if (idx >= 0 && idx < series.images.length) {
        const img = new Image();
        img.src = r2 + series.images[idx].filename;
      }
    }
  }

  function handleKeyboard(e) {
    if (!lightboxOpen || scale > 1) return;
    switch(e.key) {
      case 'Escape': closeLightbox(); break;
      case 'ArrowRight': showNextImage(); break;
      case 'ArrowLeft': showPrevImage(); break;
      case 'ArrowDown':
        if (currentSeriesIndex < allSeries.length - 1) { currentSeriesIndex++; currentImageIndex = 0; showCurrentImage(); preloadAdjacentImages(); }
        break;
      case 'ArrowUp':
        if (currentSeriesIndex > 0) { currentSeriesIndex--; currentImageIndex = allSeries[currentSeriesIndex].images.length - 1; showCurrentImage(); preloadAdjacentImages(); }
        break;
    }
  }

  // ==============================
  // LIST VIEW TOGGLE
  // ==============================
  function initListView() {
    const toggle = document.getElementById('list-view-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const container = document.getElementById('gallery-container');
      container.classList.toggle('list-view');
      toggle.textContent = container.classList.contains('list-view') ? 'Gallery View' : 'List View';
    });
  }

  window.initGallery = initGallery;
  window.addEventListener('DOMContentLoaded', initListView);
})();