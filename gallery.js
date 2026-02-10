// Gallery System with Series Support
(function() {
  'use strict';

  let currentSeriesIndex = 0;
  let currentImageIndex = 0;
  let allSeries = [];
  let lightboxOpen = false;

  // Disable right-click on images
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // Prevent image dragging
  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // Initialize gallery from data
  function initGallery(seriesData) {
    allSeries = seriesData;
    const container = document.getElementById('gallery-container');
    if (!container) return;

    seriesData.forEach((series, seriesIdx) => {
      const seriesSection = document.createElement('div');
      seriesSection.className = 'gallery-series';
      seriesSection.dataset.seriesIndex = seriesIdx;

      // Series header
      const header = document.createElement('div');
      header.className = 'series-header';
      
      const title = document.createElement('h2');
      title.className = 'series-title';
      title.textContent = series.title;
      header.appendChild(title);

      if (series.subtitle) {
        const subtitle = document.createElement('p');
        subtitle.className = 'series-subtitle';
        subtitle.textContent = series.subtitle;
        header.appendChild(subtitle);
      }

      seriesSection.appendChild(header);

      // Horizontal scrolling row
      const scrollRow = document.createElement('div');
      scrollRow.className = 'series-scroll-row';

      series.images.forEach((img, imgIdx) => {
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'gallery-thumb-container';

        const thumb = document.createElement('img');
        thumb.className = 'gallery-thumb';
        thumb.dataset.seriesIndex = seriesIdx;
        thumb.dataset.imageIndex = imgIdx;
        thumb.loading = 'lazy';
        
        // Placeholder while loading
        thumb.style.backgroundColor = '#e0e0e0';
        
        // Build R2 URL
        const r2BaseUrl = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
        thumb.src = r2BaseUrl + img.filename;
        thumb.alt = img.title || 'Artwork';

        // Museum label overlay on hover
        const label = document.createElement('div');
        label.className = 'museum-label';
        let labelText = '';
        if (img.title) labelText += img.title;
        if (img.year) labelText += (labelText ? ', ' : '') + img.year;
        if (img.medium) labelText += (labelText ? ', ' : '') + img.medium;
        label.textContent = labelText;

        thumbContainer.appendChild(thumb);
        thumbContainer.appendChild(label);

        // Click to open lightbox
        thumbContainer.addEventListener('click', () => openLightbox(seriesIdx, imgIdx));

        scrollRow.appendChild(thumbContainer);
      });

      seriesSection.appendChild(scrollRow);
      container.appendChild(seriesSection);
    });

    // Create lightbox
    createLightbox();
  }

  function createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <button class="lightbox-prev" aria-label="Previous">‹</button>
        <div class="lightbox-image-container">
          <img id="lightbox-image" src="" alt="" />
          <button class="lightbox-zoom" aria-label="Toggle zoom">🔍</button>
        </div>
        <button class="lightbox-next" aria-label="Next">›</button>
        <div class="lightbox-caption"></div>
        <div class="lightbox-series-card"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    // Event listeners
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', showPrevImage);
    lightbox.querySelector('.lightbox-next').addEventListener('click', showNextImage);
    lightbox.querySelector('.lightbox-zoom').addEventListener('click', toggleZoom);
    
    // Click outside to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Mobile swipe for series change
    let touchStartY = 0;
    lightbox.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });
    lightbox.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSeries();
        else prevSeries();
      }
    });
  }

  function openLightbox(seriesIdx, imgIdx) {
    currentSeriesIndex = seriesIdx;
    currentImageIndex = imgIdx;
    lightboxOpen = true;

    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    showCurrentImage();
    preloadAdjacentImages();
  }

  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxOpen = false;

    // Reset zoom
    const img = document.getElementById('lightbox-image');
    img.classList.remove('zoomed');
  }

  function showCurrentImage() {
    const series = allSeries[currentSeriesIndex];
    const image = series.images[currentImageIndex];
    
    const img = document.getElementById('lightbox-image');
    const caption = document.querySelector('.lightbox-caption');
    const seriesCard = document.querySelector('.lightbox-series-card');

    // Hide series card
    seriesCard.style.display = 'none';

    // Build R2 URL
    const r2BaseUrl = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
    img.src = r2BaseUrl + image.filename;
    img.alt = image.title || 'Artwork';
    img.classList.remove('zoomed');

    // Build caption
    let captionParts = [];
    if (image.title) captionParts.push(image.title);
    if (image.year) captionParts.push(image.year);
    if (image.medium) captionParts.push(image.medium);
    if (image.series) captionParts.push(image.series);
    if (image.collection) captionParts.push(image.collection);
    
    caption.textContent = captionParts.join(', ');
    caption.style.display = captionParts.length > 0 ? 'block' : 'none';
  }

  function showNextImage() {
    const series = allSeries[currentSeriesIndex];
    
    if (currentImageIndex < series.images.length - 1) {
      currentImageIndex++;
      showCurrentImage();
      preloadAdjacentImages();
    } else {
      // End of series - show transition card
      if (currentSeriesIndex < allSeries.length - 1) {
        showSeriesTransition('next');
      }
    }
  }

  function showPrevImage() {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      showCurrentImage();
      preloadAdjacentImages();
    } else {
      // Beginning of series - show transition card
      if (currentSeriesIndex > 0) {
        showSeriesTransition('prev');
      }
    }
  }

  function showSeriesTransition(direction) {
    const seriesCard = document.querySelector('.lightbox-series-card');
    const img = document.getElementById('lightbox-image');
    const caption = document.querySelector('.lightbox-caption');

    img.style.display = 'none';
    caption.style.display = 'none';
    seriesCard.style.display = 'flex';

    const nextSeriesIdx = direction === 'next' ? currentSeriesIndex + 1 : currentSeriesIndex - 1;
    const nextSeries = allSeries[nextSeriesIdx];
    const arrow = direction === 'next' ? '→' : '←';
    
    seriesCard.innerHTML = `
      <h2>${nextSeries.title}</h2>
      ${nextSeries.subtitle ? `<p>${nextSeries.subtitle}</p>` : ''}
      <div class="series-arrow">${arrow}</div>
    `;

    // Auto-advance after a moment
    setTimeout(() => {
      if (lightboxOpen) {
        currentSeriesIndex = nextSeriesIdx;
        currentImageIndex = direction === 'next' ? 0 : allSeries[nextSeriesIdx].images.length - 1;
        img.style.display = 'block';
        showCurrentImage();
        preloadAdjacentImages();
      }
    }, 1500);
  }

  function nextSeries() {
    if (currentSeriesIndex < allSeries.length - 1) {
      currentSeriesIndex++;
      currentImageIndex = 0;
      showCurrentImage();
      preloadAdjacentImages();
    }
  }

  function prevSeries() {
    if (currentSeriesIndex > 0) {
      currentSeriesIndex--;
      currentImageIndex = allSeries[currentSeriesIndex].images.length - 1;
      showCurrentImage();
      preloadAdjacentImages();
    }
  }

  function toggleZoom() {
    const img = document.getElementById('lightbox-image');
    
    if (!img.classList.contains('zoomed')) {
      // Load full-res on first zoom
      const series = allSeries[currentSeriesIndex];
      const image = series.images[currentImageIndex];
      const r2BaseUrl = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
      img.src = r2BaseUrl + image.filename; // In production, you'd have a full-res version
    }
    
    img.classList.toggle('zoomed');
  }

  function preloadAdjacentImages() {
    const r2BaseUrl = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
    
    // Preload 2 ahead and 2 behind
    for (let offset = -2; offset <= 2; offset++) {
      if (offset === 0) continue;
      
      const imgIdx = currentImageIndex + offset;
      const series = allSeries[currentSeriesIndex];
      
      if (imgIdx >= 0 && imgIdx < series.images.length) {
        const img = new Image();
        img.src = r2BaseUrl + series.images[imgIdx].filename;
      }
    }
  }

  function handleKeyboard(e) {
    if (!lightboxOpen) return;

    switch(e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
      case 'ArrowLeft':
        showPrevImage();
        break;
      case 'ArrowDown':
        nextSeries();
        break;
      case 'ArrowUp':
        prevSeries();
        break;
    }
  }

  // List view toggle
  function initListView() {
    const toggle = document.getElementById('list-view-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const container = document.getElementById('gallery-container');
      container.classList.toggle('list-view');
      toggle.textContent = container.classList.contains('list-view') ? 'Gallery View' : 'List View';
    });
  }

  // Expose init function
  window.initGallery = initGallery;
  window.addEventListener('DOMContentLoaded', initListView);
})();