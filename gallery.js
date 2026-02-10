// Gallery System with Series Support
(function() {
  'use strict';

  let currentSeriesIndex = 0;
  let currentImageIndex = 0;
  let allSeries = [];
  let lightboxOpen = false;
  let scale = 1;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;
  let lastDistance = 0;

  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  function initGallery(seriesData) {
    allSeries = seriesData;
    const container = document.getElementById('gallery-container');
    if (!container) return;

    seriesData.forEach((series, seriesIdx) => {
      const seriesSection = document.createElement('div');
      seriesSection.className = 'gallery-series';
      seriesSection.dataset.seriesIndex = seriesIdx;

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
        thumb.style.backgroundColor = '#e0e0e0';
        
        const r2BaseUrl = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
        thumb.src = r2BaseUrl + img.filename;
        thumb.alt = img.title || 'Artwork';

        const label = document.createElement('div');
        label.className = 'museum-label';
        let labelText = '';
        if (img.title) labelText += img.title;
        if (img.year) labelText += (labelText ? ', ' : '') + img.year;
        if (img.medium) labelText += (labelText ? ', ' : '') + img.medium;
        if (img.dimensions) labelText += (labelText ? ', ' : '') + img.dimensions;
        label.textContent = labelText;

        thumbContainer.appendChild(thumb);
        thumbContainer.appendChild(label);
        thumbContainer.addEventListener('click', () => openLightbox(seriesIdx, imgIdx));
        scrollRow.appendChild(thumbContainer);
      });

      seriesSection.appendChild(scrollRow);
      container.appendChild(seriesSection);
    });

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
        </div>
        <button class="lightbox-next" aria-label="Next">›</button>
        <button class="lightbox-zoom" aria-label="Toggle zoom">🔍</button>
        <button class="lightbox-inquire" aria-label="Inquire">Inquire</button>
        <div class="lightbox-caption"></div>
        <div class="lightbox-series-card"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    const imageContainer = lightbox.querySelector('.lightbox-image-container');
    const image = document.getElementById('lightbox-image');

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      if (scale === 1) showPrevImage();
    });
    lightbox.querySelector('.lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      if (scale === 1) showNextImage();
    });
    lightbox.querySelector('.lightbox-zoom').addEventListener('click', (e) => {
      e.stopPropagation();
      resetZoom();
    });
    lightbox.querySelector('.lightbox-inquire').addEventListener('click', (e) => {
      e.stopPropagation();
      openInquiry();
    });
    
    // Click to zoom at point
    imageContainer.addEventListener('click', zoomAtPoint);

    // Mouse drag
    image.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Touch drag
    image.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', endDrag);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox && scale === 1) closeLightbox();
    });

    document.addEventListener('keydown', handleKeyboard);
  }

  function zoomAtPoint(e) {
    if (e.target.id !== 'lightbox-image') return;
    if (isDragging) return;

    const img = document.getElementById('lightbox-image');
    const container = document.querySelector('.lightbox-image-container');
    const rect = img.getBoundingClientRect();
    
    // Calculate click position relative to image
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Calculate position as percentage
    const percentX = (clickX / rect.width) - 0.5;
    const percentY = (clickY / rect.height) - 0.5;

    if (scale === 1) {
      // Zoom in
      scale = 2.5;
      translateX = -percentX * rect.width * scale;
      translateY = -percentY * rect.height * scale;
      
      img.classList.add('zoomed');
      container.classList.add('zoomed');
    } else {
      // Zoom out
      resetZoom();
    }
    
    updateTransform();
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    } else if (e.touches.length === 1 && scale > 1) {
      // Single touch drag when zoomed
      startDrag(e);
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastDistance > 0) {
        const delta = distance / lastDistance;
        scale = Math.max(1, Math.min(5, scale * delta));
        
        const img = document.getElementById('lightbox-image');
        const container = document.querySelector('.lightbox-image-container');
        
        if (scale > 1) {
          img.classList.add('zoomed');
          container.classList.add('zoomed');
        } else {
          img.classList.remove('zoomed');
          container.classList.remove('zoomed');
          translateX = 0;
          translateY = 0;
        }
        
        updateTransform();
      }
      
      lastDistance = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      // Drag when zoomed
      drag(e);
    }
  }

  function startDrag(e) {
    if (scale === 1) return;
    
    e.preventDefault();
    isDragging = true;
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    startX = clientX - translateX;
    startY = clientY - translateY;
  }

  function drag(e) {
    if (!isDragging || scale === 1) return;
    
    e.preventDefault();
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    translateX = clientX - startX;
    translateY = clientY - startY;
    
    updateTransform();
  }

  function endDrag(e) {
    if (e.touches && e.touches.length > 0) return;
    isDragging = false;
    lastDistance = 0;
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
    
    img.classList.remove('zoomed');
    container.classList.remove('zoomed');
    img.style.transform = '';
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
    resetZoom();
  }

  function showCurrentImage() {
    const series = allSeries[currentSeriesIndex];
    const image = series.images[currentImageIndex];
    
    const img = document.getElementById('lightbox-image');
    const caption = document.querySelector('.lightbox-caption');
    const seriesCard = document.querySelector('.lightbox-series-card');
    const inquireBtn = document.querySelector('.lightbox-inquire');

    seriesCard.style.display = 'none';

    const r2BaseUrl = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
    img.src = r2BaseUrl + image.filename;
    img.alt = image.title || 'Artwork';
    
    resetZoom();

    let captionParts = [];
    if (image.title) captionParts.push(image.title);
    if (image.year) captionParts.push(image.year);
    if (image.medium) captionParts.push(image.medium);
    if (image.dimensions) captionParts.push(image.dimensions);
    if (image.series) captionParts.push(image.series);
    if (image.collection) captionParts.push(image.collection);
    
    caption.textContent = captionParts.join(', ');
    caption.style.display = captionParts.length > 0 ? 'block' : 'none';

    if (image.available === false) {
      inquireBtn.classList.add('unavailable');
    } else {
      inquireBtn.classList.remove('unavailable');
    }
  }

  function showNextImage() {
    const series = allSeries[currentSeriesIndex];
    
    if (currentImageIndex < series.images.length - 1) {
      currentImageIndex++;
      showCurrentImage();
      preloadAdjacentImages();
    } else {
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

  function openInquiry() {
    const series = allSeries[currentSeriesIndex];
    const image = series.images[currentImageIndex];
    
    if (image.available === false) return;
    
    const subject = encodeURIComponent(`Inquiry: ${image.title || 'Artwork'}`);
    const body = encodeURIComponent(
      `I am interested in the following work:\n\n` +
      `Title: ${image.title || 'Untitled'}\n` +
      `Year: ${image.year || 'N/A'}\n` +
      `Medium: ${image.medium || 'N/A'}\n` +
      (image.dimensions ? `Dimensions: ${image.dimensions}\n` : '') +
      `\n\nMessage:\n\n`
    );
    
    window.open(`mailto:newell.pdx@gmail.com?subject=${subject}&body=${body}`, '_blank');
  }

  function preloadAdjacentImages() {
    const r2BaseUrl = 'https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/';
    
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
    if (scale > 1) return;

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
        if (currentSeriesIndex < allSeries.length - 1) {
          currentSeriesIndex++;
          currentImageIndex = 0;
          showCurrentImage();
          preloadAdjacentImages();
        }
        break;
      case 'ArrowUp':
        if (currentSeriesIndex > 0) {
          currentSeriesIndex--;
          currentImageIndex = allSeries[currentSeriesIndex].images.length - 1;
          showCurrentImage();
          preloadAdjacentImages();
        }
        break;
    }
  }

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