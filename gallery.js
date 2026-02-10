// Gallery System with Series Support
(function() {
  'use strict';

  let currentSeriesIndex = 0;
  let currentImageIndex = 0;
  let allSeries = [];
  let lightboxOpen = false;
  let isZoomed = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;

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
        
        thumb.style.backgroundColor = '#e0e0e0';
        
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
      if (!isZoomed) showPrevImage();
    });
    lightbox.querySelector('.lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isZoomed) showNextImage();
    });
    lightbox.querySelector('.lightbox-zoom').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleZoom();
    });
    lightbox.querySelector('.lightbox-inquire').addEventListener('click', (e) => {
      e.stopPropagation();
      openInquiry();
    });
    
    // Click image to toggle zoom
    imageContainer.addEventListener('click', (e) => {
      if (e.target === image && !isDragging) {
        toggleZoom();
      }
    });

    // Pan when zoomed
    image.addEventListener('mousedown', startDrag);
    image.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox && !isZoomed) closeLightbox();
    });

    document.addEventListener('keydown', handleKeyboard);
  }

  function startDrag(e) {
    if (!isZoomed) return;
    isDragging = true;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    startX = clientX - translateX;
    startY = clientY - translateY;
  }

  function drag(e) {
    if (!isDragging || !isZoomed) return;
    e.preventDefault();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    translateX = clientX - startX;
    translateY = clientY - startY;
    const img = document.getElementById('lightbox-image');
    img.style.transform = `scale(2) translate(${translateX}px, ${translateY}px)`;
  }

  function endDrag() {
    isDragging = false;
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
    isZoomed = false;

    const img = document.getElementById('lightbox-image');
    img.classList.remove('zoomed');
    img.style.transform = '';
    document.querySelector('.lightbox-image-container').classList.remove('zoomed');
    translateX = 0;
    translateY = 0;
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
    img.classList.remove('zoomed');
    img.style.transform = '';
    document.querySelector('.lightbox-image-container').classList.remove('zoomed');
    isZoomed = false;
    translateX = 0;
    translateY = 0;

    // Build caption with all available data
    let captionParts = [];
    if (image.title) captionParts.push(image.title);
    if (image.year) captionParts.push(image.year);
    if (image.medium) captionParts.push(image.medium);
    if (image.dimensions) captionParts.push(image.dimensions);
    if (image.series) captionParts.push(image.series);
    if (image.collection) captionParts.push(image.collection);
    
    caption.textContent = captionParts.join(', ');
    caption.style.display = captionParts.length > 0 ? 'block' : 'none';

    // Handle inquire button availability
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

  function toggleZoom() {
    const img = document.getElementById('lightbox-image');
    const container = document.querySelector('.lightbox-image-container');
    
    isZoomed = !isZoomed;
    
    if (isZoomed) {
      img.classList.add('zoomed');
      container.classList.add('zoomed');
      container.style.cursor = 'grab';
    } else {
      img.classList.remove('zoomed');
      container.classList.remove('zoomed');
      img.style.transform = '';
      container.style.cursor = 'zoom-in';
      translateX = 0;
      translateY = 0;
    }
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
    if (isZoomed) return; // Disable keyboard navigation when zoomed

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