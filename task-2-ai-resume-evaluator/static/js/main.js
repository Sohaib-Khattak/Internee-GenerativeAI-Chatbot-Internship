/**
 * AI Resume Evaluator — Client-Side JavaScript
 *
 * Features:
 * - Drag-and-drop file upload UI
 * - Dark mode toggle with localStorage persistence
 * - Form validation before submit
 * - Loading spinner on evaluate
 * - Flash message auto-dismiss
 * - Cold start loading indicator
 * - File selection info display
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Dark Mode Toggle
  // =========================================================================

  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const html = document.documentElement;

  function getStoredTheme() {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch (e) {
      return 'light';
    }
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // localStorage unavailable
    }
  }

  // Initialize theme from stored preference
  const storedTheme = getStoredTheme();
  setTheme(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = html.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // =========================================================================
  // 2. Flash Message Auto-Dismiss
  // =========================================================================

  function setupFlashDismiss() {
    const messages = document.querySelectorAll('.flash-message');
    messages.forEach(function (msg) {
      // Auto-dismiss after 5 seconds
      setTimeout(function () {
        fadeOut(msg);
      }, 5000);

      // Click to dismiss immediately
      msg.addEventListener('click', function () {
        fadeOut(msg);
      });
    });
  }

  function fadeOut(element) {
    if (!element || element.dataset.fading) return;
    element.dataset.fading = 'true';
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    element.style.opacity = '0';
    element.style.transform = 'translateX(50px)';
    setTimeout(function () {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  setupFlashDismiss();

  // =========================================================================
  // 3. File Upload — Drag-and-Drop
  // =========================================================================

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const evaluateBtn = document.getElementById('evaluateBtn');

  if (dropZone && fileInput) {
    // Click to open file picker
    dropZone.addEventListener('click', function (e) {
      // Don't trigger if clicking a child button/link
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
      fileInput.click();
    });

    // File selected via input
    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        handleFileSelect(this.files[0]);
      }
    });

    // Drag events
    ['dragenter', 'dragover'].forEach(function (event) {
      dropZone.addEventListener(event, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'dragend'].forEach(function (event) {
      dropZone.addEventListener(event, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        // Set the file input's files so it submits correctly
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
        } catch (err) {
          // Fallback — at least we show the info
        }
        handleFileSelect(file);
      }
    });
  }

  /**
   * Handle a selected/dropped file.
   * Validates type and size, shows file info, enables submit button.
   */
  function handleFileSelect(file) {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const validExts = ['.pdf', '.docx', '.txt'];

    if (!validExts.includes(ext)) {
      showFlash('error', 'Unsupported format. Use PDF, DOCX, or TXT.');
      resetFileInput();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFlash('error', 'File too large. Max 5 MB.');
      resetFileInput();
      return;
    }

    // Show file info
    if (fileInfo && fileName && fileSize) {
      fileInfo.style.display = 'flex';
      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);
    }

    if (evaluateBtn) {
      evaluateBtn.disabled = false;
    }

    // Change drop zone appearance
    if (dropZone) {
      dropZone.style.borderColor = 'var(--accent-500)';
      dropZone.querySelector('.upload-zone-text').textContent = 'File selected!';
      dropZone.querySelector('.upload-zone-icon').textContent = '✅';
    }
  }

  /**
   * Remove the selected file and reset the upload zone.
   */
  window.removeFile = function () {
    resetFileInput();
    if (fileInfo) fileInfo.style.display = 'none';
    if (evaluateBtn) evaluateBtn.disabled = true;

    if (dropZone) {
      dropZone.style.borderColor = '';
      dropZone.querySelector('.upload-zone-text').textContent = 'Click to upload or drag and drop';
      dropZone.querySelector('.upload-zone-icon').textContent = '📄';
    }
  };

  function resetFileInput() {
    if (fileInput) {
      try {
        fileInput.value = '';
        const dt = new DataTransfer();
        fileInput.files = dt.files;
      } catch (e) {
        fileInput.value = '';
      }
    }
  }

  // =========================================================================
  // 4. Loading State on Evaluate
  // =========================================================================

  const evaluateForm = document.getElementById('evaluateForm');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const slowWarning = document.getElementById('slowWarning');
  let slowTimeout = null;

  if (evaluateForm) {
    evaluateForm.addEventListener('submit', function () {
      const btn = document.getElementById('runEvalBtn');
      if (btn) btn.disabled = true;

      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
      }

      // Show slow warning after 15 seconds
      slowTimeout = setTimeout(function () {
        if (slowWarning) slowWarning.hidden = false;
      }, 15000);
    });
  }

  // =========================================================================
  // 5. Upload Form — Client-Side Validation
  // =========================================================================

  const uploadForm = document.getElementById('uploadForm');

  if (uploadForm) {
    uploadForm.addEventListener('submit', function (e) {
      const fileInput = document.getElementById('fileInput');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        e.preventDefault();
        showFlash('error', 'Please select a file first.');
        return;
      }

      const file = fileInput.files[0];
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const validExts = ['.pdf', '.docx', '.txt'];

      if (!validExts.includes(ext)) {
        e.preventDefault();
        showFlash('error', 'Unsupported format. Use PDF, DOCX, or TXT.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        e.preventDefault();
        showFlash('error', 'File too large. Max 5 MB.');
        return;
      }
    });
  }

  // =========================================================================
  // 6. Utilities
  // =========================================================================

  /**
   * Format bytes to human-readable size.
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  /**
   * Show a flash message programmatically.
   */
  function showFlash(category, message) {
    var container = document.getElementById('flashMessages');
    if (!container) {
      container = document.createElement('div');
      container.className = 'flash-messages';
      container.id = 'flashMessages';
      document.body.appendChild(container);
    }

    var icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    var msg = document.createElement('div');
    msg.className = 'flash-message flash-' + category;
    msg.textContent = (icons[category] || '') + ' ' + message;
    msg.style.cursor = 'pointer';
    msg.addEventListener('click', function () { fadeOut(msg); });
    container.appendChild(msg);

    setTimeout(function () { fadeOut(msg); }, 5000);
  }

  // =========================================================================
  // 7. Cold Start Detection
  // =========================================================================

  // If the page load took unusually long (>3s), it's likely a cold start
  if (document.readyState === 'complete') {
    checkColdStart();
  } else {
    window.addEventListener('load', checkColdStart);
  }

  function checkColdStart() {
    // Use Navigation Timing API if available
    if (window.performance && window.performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      if (loadTime > 3000) {
        // Show subtle cold start indicator
        const footer = document.querySelector('.footer p');
        if (footer && !document.querySelector('.cold-start-badge')) {
          const badge = document.createElement('span');
          badge.className = 'cold-start-badge';
          badge.textContent = ' ⚡ Cold start detected — app is waking up';
          badge.style.cssText = 'font-size: 0.75rem; color: var(--gray-400); margin-left: var(--space-2);';
          footer.appendChild(badge);
          setTimeout(function () { fadeOut(badge); }, 5000);
        }
      }
    }
  }

  // =========================================================================
  // 8. Loading Spinner on Upload Process
  // =========================================================================

  // When the upload form is submitted, show a loading state
  if (uploadForm) {
    const originalSubmit = uploadForm.submit;
    // Monitor for form submission from the "Process" button
    const processBtn = uploadForm.querySelector('[type="submit"]');
    if (processBtn) {
      processBtn.addEventListener('click', function () {
        // Brief delay to allow the browser to submit naturally
      });
    }
  }

})();
