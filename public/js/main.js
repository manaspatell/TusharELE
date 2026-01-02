// Main JavaScript for Customer Site - Tushar Electronics

// Send Product Inquiry Function
window.sendProductInquiry = function (productId, productName) {
  const inquiryModal = document.getElementById('inquiryModal');
  if (inquiryModal) {
    const productIdInput = document.getElementById('inquiryProductId');
    const productNameInput = document.getElementById('inquiryProductName');
    const displayProductName = document.getElementById('displayProductName');
    const displayProductId = document.getElementById('displayProductId');

    if (productIdInput) {
      productIdInput.value = productId;
    }
    if (productNameInput) {
      productNameInput.value = productName || '';
    }
    if (displayProductName) {
      displayProductName.value = productName || 'Product';
    }
    if (displayProductId) {
      displayProductId.value = productId;
    }

    const modal = new bootstrap.Modal(inquiryModal);
    modal.show();
  } else {
    window.location.href = '/contact?product=' + productId;
  }
};

// Newsletter Subscription
document
  .getElementById('newsletterForm')
  ?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;

    try {
      const response = await fetch('/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (result.success) {
        showNotification(result.message, 'success');
        e.target.reset();
      } else {
        showNotification(result.message, 'danger');
      }
    } catch (error) {
      showNotification('Failed to subscribe. Please try again.', 'danger');
    }
  });

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  notification.style.cssText =
    'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  // If the URL contains a `search` query param, persist it into the search inputs
  try {
    const urlSearch = new URL(window.location.href).searchParams.get('search');
    if (urlSearch) {
      const desktopEl = document.getElementById('searchInput');
      const mobileEl = document.getElementById('searchInputMobile');
      if (desktopEl) desktopEl.value = urlSearch;
      if (mobileEl) mobileEl.value = urlSearch;
    }
  } catch (e) {
    // ignore if URL parsing fails
  }
  // Handle image loading errors - show placeholder
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', function () {
      // If image fails to load, try to show a placeholder
      if (!this.src.includes('placeholder') && !this.src.includes('data:')) {
        this.src =
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
        this.style.backgroundColor = '#f0f0f0';
      }
    });
  });

  // Mark lazy-loaded images as loaded when they finish loading so CSS can fade them in
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', function () {
        this.classList.add('loaded');
      });
    }
  });

  // Carousel initialization is handled in page-specific scripts
  // to ensure Bootstrap is fully loaded
});

// Mobile full-screen search toggle (Flipkart/Amazon style)
document.addEventListener('DOMContentLoaded', function () {
  try {
    const body = document.body;
    const mobileInput = document.getElementById('searchInputMobile');
    const closeBtn = document.getElementById('mobileSearchClose');
    const form = document.querySelector('.mobile-search-form');
    const navbar = document.querySelector('nav.navbar');

    const activate = () => {
      if (
        window.innerWidth <= 767 &&
        body &&
        !body.classList.contains('mobile-search-active')
      ) {
        // Preserve any existing value before activating overlay
        const prev = mobileInput ? mobileInput.value : '';
        body.classList.add('mobile-search-active');
        if (mobileInput) {
          setTimeout(() => {
            mobileInput.focus();
            // Reapply preserved value to avoid any visual reset
            mobileInput.value = prev;
          }, 50);
        }
      }
    };
    const deactivate = () => {
      body.classList.remove('mobile-search-active');
    };

    if (mobileInput) {
      mobileInput.addEventListener('focus', function (e) {
        // Prevent bubbling, but do NOT prevent default so typing works
        e.stopPropagation();
        activate();
      });
      // Allow typing: do not prevent default on input interactions
      mobileInput.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      mobileInput.addEventListener('mousedown', function (e) {
        e.stopPropagation();
      });
      mobileInput.addEventListener(
        'touchstart',
        function (e) {
          e.stopPropagation();
        },
        { passive: true }
      );
      // Optional: tap on container also activates
      const container = document.querySelector('.mobile-search-bar-container');
      if (container) {
        container.addEventListener('click', (e) => {
          // Only activate when clicking the container background, not the input/buttons
          if (e.target === container) {
            e.preventDefault();
            e.stopPropagation();
            activate();
          }
        });
        container.addEventListener('mousedown', (e) => {
          if (e.target === container) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
        container.addEventListener(
          'touchstart',
          (e) => {
            if (e.target === container) {
              e.preventDefault();
              e.stopPropagation();
            }
          },
          { passive: false }
        );
      }
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        deactivate();
      });
    }
    // Close overlay after submitting
    if (form) {
      form.addEventListener('submit', function () {
        deactivate();
      });
    }
    // Escape key closes overlay
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') deactivate();
    });
    // Resize guard
    window.addEventListener('resize', function () {
      if (window.innerWidth > 767) deactivate();
    });

    // Global click guard while overlay is active: block navigation outside search form
    document.addEventListener(
      'click',
      function (e) {
        if (!body.classList.contains('mobile-search-active')) return;
        const withinForm = e.target.closest('.mobile-search-form');
        if (!withinForm) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
    // Specifically block brand/toggler clicks while active
    const brand = document.querySelector('.navbar-brand');
    const toggler = document.querySelector('.navbar-toggler');
    [brand, toggler].forEach((el) => {
      if (!el) return;
      el.addEventListener(
        'click',
        function (e) {
          if (body.classList.contains('mobile-search-active')) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );
    });
  } catch (err) {
    console.warn('Mobile search overlay init failed', err);
  }
});

// Restore trust-badges animations on desktop: add animate classes with a slight stagger
document.addEventListener('DOMContentLoaded', function () {
  try {
    // Respect user's reduced-motion preference
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const wrapper = document.querySelector('.trust-badges-wrapper');
    if (!wrapper) return;

    // Add a fade-up to the wrapper
    wrapper.classList.add('animate-fade-up');
    // make it visible after a short delay so CSS transition can run
    setTimeout(() => wrapper.classList.add('animate-fade-up--visible'), 50);

    const badges = Array.from(wrapper.querySelectorAll('.trust-badge'));
    badges.forEach((el, i) => {
      // staggered addition so CSS animation delay works nicely
      setTimeout(
        () => {
          el.classList.add('animate-pop');
        },
        60 * (i + 1)
      );
    });
  } catch (err) {
    console.error('Error initializing trust-badges animations:', err);
  }
});

// Lightweight auto-scroll for mobile "Shop by Category" slider
document.addEventListener('DOMContentLoaded', function () {
  try {
    if (!document.body.classList.contains('home-page')) return;
    if (window.innerWidth > 600) return; // mobile only

    const row = document.querySelector('.category-section .row.g-4');
    if (!row) return;

    let autoScrollId = null;
    let pausedUntil = 0;
    const step = 0.4; // pixels per frame approx (very slow)
    const pauseAfterInteractionMs = 6000;

    function loop() {
      if (!row) return;
      const now = performance.now();
      if (now < pausedUntil) {
        autoScrollId = requestAnimationFrame(loop);
        return;
      }

      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll <= 0) {
        autoScrollId = requestAnimationFrame(loop);
        return;
      }

      // Advance slowly and wrap around smoothly
      let next = row.scrollLeft + step;
      if (next >= maxScroll - 1) {
        next = 0;
      }
      row.scrollLeft = next;

      autoScrollId = requestAnimationFrame(loop);
    }

    function pauseAutoScroll() {
      pausedUntil = performance.now() + pauseAfterInteractionMs;
    }

    // Pause when user interacts with the slider
    ['touchstart', 'mousedown', 'wheel', 'keydown'].forEach((evt) => {
      row.addEventListener(evt, pauseAutoScroll, { passive: true });
    });

    // Start loop
    autoScrollId = requestAnimationFrame(loop);

    // Clean up on page unload
    window.addEventListener('beforeunload', function () {
      if (autoScrollId) cancelAnimationFrame(autoScrollId);
    });
  } catch (e) {
    console.error('Auto-scroll category slider failed:', e);
  }
});

// (Feature removed)

// Expand search input when focused/clicked (desktop only)
(function () {
  function isDesktop() {
    try {
      return window.innerWidth >= 768;
    } catch (e) {
      return true;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.search-container');
    const input = document.getElementById('searchInput');
    if (!container || !input) return;

    function expand() {
      if (!isDesktop()) return;
      container.classList.add('search-expanded');
    }
    function collapse() {
      container.classList.remove('search-expanded');
    }

    input.addEventListener('focus', expand);
    input.addEventListener('click', expand);
    input.addEventListener('blur', function () {
      // give time for suggestion clicks to register
      setTimeout(collapse, 180);
    });

    // Collapse when clicking outside the search area
    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) collapse();
    });

    // Recompute on resize
    window.addEventListener('resize', function () {
      if (!isDesktop()) container.classList.remove('search-expanded');
    });
  });
})();

// Global client-side validation for inquiry forms: basic email format check
// Rely on HTML5/email pattern and server-side validation for stricter checks.
document.addEventListener('submit', function (e) {
  const form = e.target;
  if (!form || form.id !== 'inquiryForm') return;

  try {
    const emailInput = form.querySelector('input[name="email"]');
    if (emailInput) {
      const value = (emailInput.value || '').toString().trim();
      const basicEmailRegex = /^\S+@\S+\.\S+$/;
      if (value && !basicEmailRegex.test(value)) {
        e.preventDefault();
        e.stopPropagation();
        alert('Please enter a valid email address');
        emailInput.focus();
        return false;
      }
    }
  } catch (err) {
    console.error('Inquiry form client-side validation error:', err);
  }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Theme toggle removed per user request

// Search suggestions (desktop + mobile)
document.addEventListener('DOMContentLoaded', function () {
  const desktopInput = document.getElementById('searchInput');
  const mobileInput = document.getElementById('searchInputMobile');
  const desktopBox = document.getElementById('searchSuggestions');
  const mobileBox = document.getElementById('searchSuggestionsMobile');

  if (!desktopBox && !mobileBox) return; // no suggestion UI present

  let controller = null;
  const debounce = (fn, wait) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  const renderSuggestions = (container, data) => {
    if (!container) return;
    const { categories = [], products = [] } = data || {};
    if (categories.length + products.length === 0) {
      container.innerHTML = `
                <div class="suggestion-no-match">
                    <div class="no-match-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="#F7A400" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div>
                        <div class="no-match-title">No suggestions</div>
                        <div class="no-match-sub">Try a different keyword</div>
                    </div>
                </div>`;
      container.classList.add('show');
      return;
    }

    const items = [];
    if (categories.length) {
      items.push(
        '<div class="suggestion-section p-2"><strong style="padding-left:12px;">Categories</strong></div>'
      );
      categories.forEach((cat) => {
        items.push(`
                    <div class="suggestion-item" data-type="category" data-slug="${cat.slug}" data-name="${cat.name}">
                        <div style="width:36px;flex:0 0 36px;display:flex;align-items:center;justify-content:center;">
                            <i class="bi bi-tags" style="font-size:1.1rem;color:#F7A400;"></i>
                        </div>
                        <div style="flex:1">${cat.name}</div>
                    </div>
                `);
      });
    }

    if (products.length) {
      items.push(
        '<div class="suggestion-section p-2"><strong style="padding-left:12px;">Products</strong></div>'
      );
      products.forEach((p) => {
        // prefer thumbnail if available, otherwise show product icon
        let thumb = null;
        if (p.images && p.images.length && p.images[0]) {
          const img0 = p.images[0];
          if (typeof img0 === 'string') {
            if (img0.startsWith('http') || img0.startsWith('/')) {
              thumb = img0;
            } else {
              thumb = '/uploads/products/' + img0;
            }
          }
        }
        const thumbHtml = thumb
          ? '<img src="' +
            thumb +
            '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">'
          : '<i class="bi bi-box-seam" style="font-size:1.1rem;color:#6b7280;"></i>';
        items.push(`
                    <div class="suggestion-item" data-type="product" data-slug="${p.slug}" data-name="${p.name}">
                        <div style="width:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;">
                            ${thumbHtml}
                        </div>
                        <div style="flex:1">${p.name} <small style="color:#6b7280; margin-left:8px;">₹${p.price || ''}</small></div>
                    </div>
                `);
      });
    }

    container.innerHTML = items.join('');
    container.classList.add('show');

    // Attach handlers: use pointerdown to navigate immediately (prevents input blur hiding interference)
    container.querySelectorAll('.suggestion-item').forEach((el) => {
      const navigate = () => {
        const type = el.getAttribute('data-type');
        const slug = el.getAttribute('data-slug');
        const name = el.getAttribute('data-name') || '';
        // Autofill both inputs (desktop/mobile) if present
        try {
          if (desktopInput) desktopInput.value = name;
          if (mobileInput) mobileInput.value = name;
        } catch (e) {
          // ignore
        }

        // include the selected name as a `search` query param so the destination page
        // can preserve the input value in the header via client-side hydration
        const q = name ? `?search=${encodeURIComponent(name)}` : '';
        if (type === 'category') {
          window.location.href = `/category/${slug}${q}`;
        } else if (type === 'product') {
          window.location.href = `/product/${slug}${q}`;
        }
      };

      // pointerdown fires before blur; prevent default to stop focus changes
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate();
      });

      // fallback click handler
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate();
      });
    });
  };

  // Render default suggested products (for empty search input)
  const renderDefaultProducts = (container, products) => {
    if (!container) return;
    const items = [];
    items.push(
      '<div class="suggestion-section p-2"><strong style="padding-left:12px;">Suggested Products</strong></div>'
    );
    (products || []).forEach((p) => {
      let thumb = null;
      if (p.images && p.images.length && p.images[0]) {
        const img0 = p.images[0];
        if (typeof img0 === 'string') {
          if (img0.startsWith('http') || img0.startsWith('/')) {
            thumb = img0;
          } else {
            thumb = '/uploads/products/' + img0;
          }
        }
      }
      const thumbHtml = thumb
        ? '<img src="' +
          thumb +
          '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">'
        : '<i class="bi bi-box-seam" style="font-size:1.1rem;color:#6b7280;"></i>';
      items.push(`
                <div class="suggestion-item" data-type="product" data-slug="${p.slug}" data-name="${p.name}">
                    <div style="width:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;">
                        ${thumbHtml}
                    </div>
                    <div style="flex:1">${p.name} ${p.price ? `<small style=\"color:#6b7280; margin-left:8px;\">₹${p.price}</small>` : ''}</div>
                </div>
            `);
    });

    container.innerHTML = items.join('');
    container.classList.add('show');

    // Attach navigation handlers
    container.querySelectorAll('.suggestion-item').forEach((el) => {
      const navigate = () => {
        const slug = el.getAttribute('data-slug');
        const name = el.getAttribute('data-name') || '';
        try {
          if (desktopInput) desktopInput.value = name;
          if (mobileInput) mobileInput.value = name;
        } catch (e) {}
        const q = name ? `?search=${encodeURIComponent(name)}` : '';
        window.location.href = `/product/${slug}${q}`;
      };
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate();
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate();
      });
    });
  };

  const fetchSuggestedProducts = async (container) => {
    if (!container) return;
    try {
      const res = await fetch('/api/suggested-products');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const products =
        data && Array.isArray(data.products) ? data.products : [];
      if (products.length) {
        renderDefaultProducts(container, products);
      } else {
        container.classList.remove('show');
        container.innerHTML = '';
      }
    } catch (err) {
      console.error('Suggested products fetch error:', err);
      container.classList.remove('show');
    }
  };

  const fetchSuggestions = async (q, container) => {
    const isMobileOverlayActive = document.body.classList.contains(
      'mobile-search-active'
    );
    const isMobileContainer =
      container && container.id === 'searchSuggestionsMobile';
    if (!q || q.trim().length === 0) {
      // When overlay is active on mobile and query is empty, show default suggested products
      if (isMobileOverlayActive && isMobileContainer) {
        return fetchSuggestedProducts(container);
      }
      if (container) {
        container.classList.remove('show');
        container.innerHTML = '';
      }
      return;
    }

    // abort previous
    if (controller) controller.abort();
    controller = new AbortController();

    try {
      const res = await fetch(
        `/api/search-suggestions?q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      renderSuggestions(container, data);
    } catch (err) {
      if (err.name === 'AbortError') return; // expected
      console.error('Search suggestions error:', err);
      if (container) container.classList.remove('show');
    }
  };

  const debouncedFetchDesktop = debounce(
    (val) => fetchSuggestions(val, desktopBox),
    250
  );
  const debouncedFetchMobile = debounce(
    (val) => fetchSuggestions(val, mobileBox),
    250
  );

  if (desktopInput) {
    desktopInput.addEventListener('input', (e) =>
      debouncedFetchDesktop(e.target.value)
    );
    desktopInput.addEventListener('focus', (e) => {
      if (desktopInput.value.trim()) debouncedFetchDesktop(desktopInput.value);
    });
    desktopInput.addEventListener('blur', () =>
      setTimeout(() => desktopBox?.classList.remove('show'), 180)
    );
  }

  if (mobileInput) {
    const activateMobileSearch = () => {
      try {
        document.body.classList.add('mobile-search-active');
      } catch (err) {}
      const closeBtn = document.getElementById('mobileSearchClose');
      if (closeBtn) closeBtn.classList.remove('d-none');
      // Guard period to prevent immediate outside collapse
      window.__mobileSearchActivating = true;
      setTimeout(() => {
        window.__mobileSearchActivating = false;
      }, 250);
    };
    mobileInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (
        !val.trim() &&
        document.body.classList.contains('mobile-search-active')
      ) {
        // show defaults when cleared
        fetchSuggestedProducts(mobileBox);
      } else {
        debouncedFetchMobile(val);
      }
    });
    mobileInput.addEventListener('focus', (e) => {
      activateMobileSearch();
      const val = mobileInput.value.trim();
      if (val) {
        debouncedFetchMobile(val);
      } else {
        // on open with empty query show defaults
        fetchSuggestedProducts(mobileBox);
      }
    });
    mobileInput.addEventListener('click', (e) => {
      e.stopPropagation();
      activateMobileSearch();
    });
    mobileInput.addEventListener(
      'touchstart',
      (e) => {
        e.stopPropagation();
        activateMobileSearch();
      },
      { passive: true }
    );
    // Do not auto-collapse suggestions on blur while expanded; only collapse when explicitly closed.
    mobileInput.addEventListener('blur', () => {
      // If expansion class not present, allow hiding suggestions; otherwise keep state.
      if (!document.body.classList.contains('mobile-search-active')) {
        setTimeout(() => mobileBox?.classList.remove('show'), 180);
      }
    });
  }

  // Mobile search expansion toggle / close handler
  (function initMobileSearchExpansion() {
    const closeBtn = document.getElementById('mobileSearchClose');
    const mobileContainer = document.querySelector(
      '.mobile-search-bar-container'
    );
    const mobileForm = document.querySelector('.mobile-search-form');
    const mobileInner = document.querySelector('.mobile-search-inner');
    if (!closeBtn || !mobileContainer || !mobileInput) return;

    function deactivateMobileSearch() {
      document.body.classList.remove('mobile-search-active');
      closeBtn.classList.add('d-none');
      // hide suggestions
      if (mobileBox) mobileBox.classList.remove('show');
    }

    closeBtn.addEventListener('click', function () {
      deactivateMobileSearch();
      try {
        mobileInput.blur();
      } catch (e) {}
    });

    // Collapse on outside tap while active
    document.addEventListener('click', function (e) {
      if (!document.body.classList.contains('mobile-search-active')) return;
      // Ignore clicks during activation guard window
      if (window.__mobileSearchActivating) return;
      // Keep active if click is inside form OR suggestions dropdown OR input itself
      if (
        mobileForm.contains(e.target) ||
        (mobileBox && mobileBox.contains(e.target))
      )
        return;
      deactivateMobileSearch();
    });

    // Also allow tapping the container area (outside input) to activate
    if (mobileInner) {
      mobileInner.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!document.body.classList.contains('mobile-search-active')) {
          try {
            mobileInput.focus();
          } catch (e) {}
        }
      });
      mobileInner.addEventListener(
        'touchstart',
        function (e) {
          e.stopPropagation();
          if (!document.body.classList.contains('mobile-search-active')) {
            try {
              mobileInput.focus();
            } catch (e) {}
          }
        },
        { passive: true }
      );
    }

    // Optional: ESC key closes expanded search
    document.addEventListener('keydown', function (e) {
      if (
        e.key === 'Escape' &&
        document.body.classList.contains('mobile-search-active')
      ) {
        deactivateMobileSearch();
      }
    });
  })();

  // Handle product share - Copy Link button
  const copyLinkBtn = document.getElementById('copyProductLink');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const productUrl = this.getAttribute('data-product-url');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(productUrl)
          .then(() => {
            // Show success feedback
            const originalText = this.innerHTML;
            this.classList.add('copied');
            this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';

            // Revert after 2 seconds
            setTimeout(() => {
              this.classList.remove('copied');
              this.innerHTML = originalText;
            }, 2000);

            showNotification('Product link copied to clipboard!', 'success');
          })
          .catch(() => {
            showNotification(
              'Failed to copy link. Please try manually.',
              'danger'
            );
          });
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = productUrl;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          showNotification('Product link copied to clipboard!', 'success');
          this.classList.add('copied');
          const originalText = this.innerHTML;
          this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
          setTimeout(() => {
            this.classList.remove('copied');
            this.innerHTML = originalText;
          }, 2000);
        } catch (err) {
          showNotification(
            'Failed to copy link. Please try manually.',
            'danger'
          );
        }
        document.body.removeChild(textarea);
      }
    });
  }
});

// Lightweight intersection observer for page reveal animations (About / Contact etc.)
document.addEventListener('DOMContentLoaded', function () {
  try {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const selector =
      '.fade-section, .slide-up, .fade-left, .scale-in, .fade-in-up, .slide-in-field';
    const nodes = document.querySelectorAll(selector);
    if (!nodes || nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
    );

    nodes.forEach((n) => observer.observe(n));
  } catch (err) {
    // silent
  }
});

// Footer reveal: add `.visible` to compact footer when it scrolls into view
document.addEventListener('DOMContentLoaded', function () {
  try {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const footer = document.querySelector('.site-footer.premium-footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            footer.classList.add('visible');
            // stagger badge pops if present
            const badges = footer.querySelectorAll('.badges .badge');
            badges.forEach((b, i) =>
              setTimeout(() => b.classList.add('animate-pop'), 60 * (i + 1))
            );
            obs.unobserve(footer);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(footer);
  } catch (err) {
    console.error('Footer reveal init failed:', err);
  }
});

// Welcome Banner: letter-by-letter drop animation (home page only)
(function () {
  function splitIntoLetters(root) {
    // Avoid double-processing
    if (!root || (root.dataset && root.dataset.lettersEnhanced === '1')) return;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );
    const nodesToProcess = [];
    let current = walker.currentNode;
    while (current) {
      // Only split text nodes that have non-whitespace content
      if (
        current.nodeType === Node.TEXT_NODE &&
        current.nodeValue &&
        current.nodeValue.trim().length > 0
      ) {
        nodesToProcess.push(current);
      }
      current = walker.nextNode();
    }

    let delay = 0;
    const step = 70; // ms between letters (slower cascade)

    function hasAncestorClass(node, className) {
      let n = node && node.parentNode;
      while (n && n !== root) {
        if (n.nodeType === 1 && n.classList && n.classList.contains(className))
          return true;
        n = n.parentNode;
      }
      return false;
    }

    nodesToProcess.forEach((textNode) => {
      const text = textNode.nodeValue;
      const frag = document.createDocumentFragment();
      const inBrand = hasAncestorClass(textNode, 'brand-highlight');
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch.trim() === '') {
          // Preserve spaces as plain text
          frag.appendChild(document.createTextNode(ch));
        } else {
          const span = document.createElement('span');
          span.className = inBrand ? 'wb-letter brand-highlight' : 'wb-letter';
          span.textContent = ch;
          span.style.animationDelay = delay + 'ms';
          frag.appendChild(span);
          delay += step;
        }
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });

    if (root.dataset) root.dataset.lettersEnhanced = '1';
  }

  function initWelcomeLetters() {
    try {
      if (!document.body.classList.contains('home-page')) return;
      const banner = document.querySelector('.welcome-banner');
      const title = banner ? banner.querySelector('.welcome-title') : null;
      if (!banner || !title) return;

      splitIntoLetters(title);

      // Trigger animation on the container so CSS targets .wb-letter
      requestAnimationFrame(() => {
        banner.classList.add('letters-anim');
      });
    } catch (e) {
      // silent
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeLetters);
  } else {
    initWelcomeLetters();
  }
})();
