/**
 * Manhattan Art Comic - Lightbox & Viewer
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Lightbox with zoom and pan
 * - Keyboard navigation (arrow keys, Esc)
 * - Touch/swipe gestures for mobile
 * - Download with artist attribution
 */

// ============================================
// STATE
// ============================================

let comics = [];
let currentIndex = 0;
let isZoomed = false;
let isPanning = false;
let hasDragged = false;
let startX = 0;
let startY = 0;
let scrollLeft = 0;
let scrollTop = 0;

// Touch handling
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadComics();
    renderComics();
    setupLazyLoading();
    setupLightbox();
    setupKeyboardNavigation();
    setupTouchGestures();
});

// ============================================
// LOAD COMIC DATA
// ============================================

async function loadComics() {
    try {
        const response = await fetch(CONFIG.comicDataPath);
        if (!response.ok) {
            throw new Error('Failed to load comic data');
        }
        const data = await response.json();
        comics = data.comics;
        console.log(`Loaded ${comics.length} comics`);
    } catch (error) {
        console.error('Error loading comics:', error);
        document.getElementById('comics-container').innerHTML = 
            '<div class="loading">Error loading comics. Please refresh the page.</div>';
    }
}

// ============================================
// RENDER COMICS
// ============================================

function renderComics() {
    const container = document.getElementById('comics-container');
    container.innerHTML = '';
    
    comics.forEach((comic, index) => {
        const comicItem = document.createElement('div');
        comicItem.className = 'comic-item';
        comicItem.innerHTML = `
            <div class="comic-date">${comic.date}</div>
            <div class="comic-title">${comic.title}</div>
            <div class="comic-image-wrapper" data-index="${index}">
                <img 
                    class="comic-image lazy" 
                    data-src="${getThumbUrl(comic)}" 
                    alt="${comic.title} by Andrew Newell Walther"
                    loading="lazy"
                >
            </div>
        `;
        
        container.appendChild(comicItem);
    });
    
    // Add click handlers
    document.querySelectorAll('.comic-image-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            openLightbox(index);
        });
        
        // Keyboard accessibility
        wrapper.setAttribute('tabindex', '0');
        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const index = parseInt(e.currentTarget.dataset.index);
                openLightbox(index);
            }
        });
    });
}

// ============================================
// LAZY LOADING
// ============================================

function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// URL HELPERS
// ============================================

function getThumbUrl(comic) {
    return `${CONFIG.r2BaseUrl}/thumbs/${comic.filename}.${comic.format}`;
}

function getFullUrl(comic) {
    return `${CONFIG.r2BaseUrl}/full/${comic.filename}.${comic.format}`;
}

// ============================================
// LIGHTBOX
// ============================================

function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const overlay = lightbox.querySelector('.lightbox-overlay');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const imageContainer = lightbox.querySelector('.lightbox-image-container');
    const image = document.getElementById('lightbox-image');
    
    // Close lightbox
    overlay.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', closeLightbox);
    
    // Navigation
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));
    
    // Zoom on click — zoom into the clicked point on desktop
    imageContainer.addEventListener('click', (e) => {
        if (e.target !== image) return;
        if ('ontouchstart' in window) return; // mobile uses pinch/swipe instead
        if (hasDragged) { hasDragged = false; return; } // suppress click after a pan drag
        if (!isZoomed) {
            // Calculate click position as a fraction of the image
            const rect = image.getBoundingClientRect();
            const fracX = (e.clientX - rect.left) / rect.width;
            const fracY = (e.clientY - rect.top) / rect.height;
            zoomIntoPoint(fracX, fracY);
        } else {
            resetZoom();
        }
    });
    
    // Pan when zoomed
    setupPanning(imageContainer, image);
    
    // Prevent right-click menu on mobile, but allow on desktop for saving
    image.addEventListener('contextmenu', (e) => {
        // On mobile, prevent context menu (since we can't save anyway)
        if ('ontouchstart' in window) {
            e.preventDefault();
        }
        // On desktop, allow right-click to save
    });
    
    // Download handler - add artist name to filename
    image.addEventListener('contextmenu', (e) => {
        if (!('ontouchstart' in window)) {
            // Desktop: modify download attribute
            const comic = comics[currentIndex];
            image.download = `andrew-newell-walther-${comic.filename}.${comic.format}`;
        }
    });
}

function openLightbox(index) {
    currentIndex = index;
    const lightbox = document.getElementById('lightbox');
    const image = document.getElementById('lightbox-image');
    const spinner = document.querySelector('.lightbox-spinner');
    const comic = comics[index];

    // Show spinner, hide image until loaded
    spinner.classList.add('active');
    image.style.opacity = '0';

    // Set image
    image.onload = () => {
        spinner.classList.remove('active');
        image.style.opacity = '1';
    };
    image.onerror = () => {
        spinner.classList.remove('active');
        image.style.opacity = '1';
    };
    image.src = getFullUrl(comic);
    image.alt = `${comic.title} by Andrew Newell Walther`;

    // Set download attribute with artist name
    image.download = `andrew-newell-walther-${comic.filename}.${comic.format}`;

    // Update info
    document.getElementById('lightbox-date').textContent = comic.date;
    document.getElementById('lightbox-title').textContent = comic.title;
    document.getElementById('lightbox-counter').textContent = `${index + 1} of ${comics.length}`;

    // Update navigation buttons
    document.querySelector('.lightbox-prev').disabled = (index === 0);
    document.querySelector('.lightbox-next').disabled = (index === comics.length - 1);

    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset zoom
    isZoomed = false;
    resetZoom();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset zoom
    isZoomed = false;
    resetZoom();
}

function navigateLightbox(direction) {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < comics.length) {
        openLightbox(newIndex);
    }
}

// ============================================
// ZOOM & PAN
// ============================================

function zoomIntoPoint(fracX, fracY) {
    const container = document.querySelector('.lightbox-image-container');
    const image = document.getElementById('lightbox-image');

    isZoomed = true;
    container.classList.add('zoomed');
    image.style.maxWidth = 'none';
    image.style.width = '200%';
    image.style.cursor = 'move';

    // After the DOM repaints at the new size, scroll so the clicked point stays centred
    requestAnimationFrame(() => {
        const scrollX = fracX * image.offsetWidth - container.clientWidth / 2;
        const scrollY = fracY * image.offsetHeight - container.clientHeight / 2;
        container.scrollLeft = Math.max(0, scrollX);
        container.scrollTop = Math.max(0, scrollY);
    });
}

function toggleZoom() {
    if (!isZoomed) {
        zoomIntoPoint(0.5, 0.5); // fallback: zoom into centre
    } else {
        resetZoom();
    }
}

function resetZoom() {
    const container = document.querySelector('.lightbox-image-container');
    const image = document.getElementById('lightbox-image');
    
    isZoomed = false;
    container.classList.remove('zoomed');
    image.style.maxWidth = '100%';
    image.style.width = 'auto';
    image.style.cursor = 'zoom-in';
    container.scrollLeft = 0;
    container.scrollTop = 0;
}

function setupPanning(container, image) {
    // Mouse panning
    container.addEventListener('mousedown', (e) => {
        if (!isZoomed) return;

        isPanning = true;
        hasDragged = false;
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        container.style.cursor = 'grabbing';
    });
    
    container.addEventListener('mouseleave', () => {
        isPanning = false;
        if (isZoomed) {
            container.style.cursor = 'grab';
        }
    });
    
    container.addEventListener('mouseup', () => {
        isPanning = false;
        if (isZoomed) {
            container.style.cursor = 'grab';
        }
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        hasDragged = true;
        
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
    
    // Touch panning (for mobile when zoomed)
    let touchStartScrollLeft = 0;
    let touchStartScrollTop = 0;
    
    container.addEventListener('touchstart', (e) => {
        if (!isZoomed || e.touches.length !== 1) return;
        
        touchStartScrollLeft = container.scrollLeft;
        touchStartScrollTop = container.scrollTop;
    });
    
    container.addEventListener('touchmove', (e) => {
        if (!isZoomed || e.touches.length !== 1) return;
        e.preventDefault();
    });
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                navigateLightbox(-1);
                break;
            case 'ArrowRight':
                navigateLightbox(1);
                break;
            case 'z':
            case 'Z':
                toggleZoom();
                break;
        }
    });
}

// ============================================
// TOUCH GESTURES (MOBILE)
// ============================================

function setupTouchGestures() {
    const lightbox = document.getElementById('lightbox');
    
    lightbox.addEventListener('touchstart', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (isZoomed) return; // Don't swipe when zoomed
        
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    });
    
    lightbox.addEventListener('touchend', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (isZoomed) return; // Don't swipe when zoomed
        
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    });
}

function handleSwipe() {
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Horizontal swipe threshold
    const minSwipeDistance = 50;
    
    // Check if horizontal swipe is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
            // Swiped left - go to next
            navigateLightbox(1);
        } else {
            // Swiped right - go to previous
            navigateLightbox(-1);
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Preload adjacent images for smoother navigation
function preloadAdjacentImages() {
    const prevIndex = currentIndex - 1;
    const nextIndex = currentIndex + 1;
    
    if (prevIndex >= 0) {
        const img = new Image();
        img.src = getFullUrl(comics[prevIndex]);
    }
    
    if (nextIndex < comics.length) {
        const img = new Image();
        img.src = getFullUrl(comics[nextIndex]);
    }
}

// Call preload when lightbox opens
const originalOpenLightbox = openLightbox;
openLightbox = function(index) {
    originalOpenLightbox(index);
    setTimeout(preloadAdjacentImages, 500);
};
