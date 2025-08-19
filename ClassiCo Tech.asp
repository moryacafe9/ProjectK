<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="ClassiCo Tech - AI-Powered Website to Database Connector. Upload your ZIP project files for instant database integration.">
  <meta name="theme-color" content="#222">
  <title>ClassiCo Tech – AI Website to Database Connector</title>
  
  <!-- Preload critical resources -->
  <link rel="preconnect" href="http://localhost:8080" crossorigin>
  
  <!-- Critical CSS inlined and minified -->
  <style>
    *{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5;color:#333;line-height:1.6}header{background:#222;color:#fff;padding:20px 40px;text-align:center}header h1{margin:0;font-size:2rem;letter-spacing:1px}.container{max-width:600px;margin:50px auto;padding:30px;background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.1);text-align:center}.drop-zone{border:3px dashed #999;padding:40px;border-radius:10px;cursor:pointer;transition:background .2s ease;will-change:background-color}.drop-zone.dragover{background-color:#e9ecef}.drop-zone:hover{background-color:#f8f9fa}#file-input{display:none}#status{margin-top:20px;font-weight:600;min-height:24px}footer{margin-top:60px;text-align:center;font-size:.9rem;color:#777}code{background:#f1f1f1;padding:3px 6px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,monospace}.success{color:#28a745}.error{color:#dc3545}.loading{color:#007bff}.progress{width:100%;height:4px;background:#e9ecef;border-radius:2px;margin:10px 0;overflow:hidden}.progress-bar{height:100%;background:#007bff;width:0;transition:width .3s ease;border-radius:2px}@media (max-width:768px){.container{margin:20px;padding:20px}header{padding:15px 20px}header h1{font-size:1.5rem}}
  </style>
</head>
<body>

  <header>
    <h1>🌐 ClassiCo Tech</h1>
    <p>AI-Powered Website ➝ Database Connector</p>
  </header>

  <main class="container">
    <h2>Upload Your Website Code</h2>
    <p>Drag & drop your <strong>.zip</strong> project file below</p>

    <div class="drop-zone" id="drop-zone" tabindex="0" role="button" aria-label="Upload ZIP file">
      Drop your ZIP file here or click to browse
    </div>
    <input type="file" id="file-input" accept=".zip" aria-label="Select ZIP file">
    
    <div class="progress" id="progress" style="display:none">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
    <div id="status" role="status" aria-live="polite"></div>
  </main>

  <footer>
    © 2025 ClassiCo Tech. All rights reserved.
  </footer>

  <script>
    // Cache DOM elements for better performance
    const elements = {
      dropZone: document.getElementById('drop-zone'),
      fileInput: document.getElementById('file-input'),
      statusText: document.getElementById('status'),
      progress: document.getElementById('progress'),
      progressBar: document.getElementById('progress-bar')
    };
    
    let currentUpload = null;

    // Optimized event handlers with passive listeners where possible
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        elements.fileInput.click();
      }
    });

    elements.dropZone.addEventListener('dragover', handleDragOver, { passive: false });
    elements.dropZone.addEventListener('dragleave', handleDragLeave, { passive: true });
    elements.dropZone.addEventListener('drop', handleDrop, { passive: false });
    elements.fileInput.addEventListener('change', handleFileSelect, { passive: true });

    function handleDragOver(e) {
      e.preventDefault();
      elements.dropZone.classList.add('dragover');
    }

    function handleDragLeave() {
      elements.dropZone.classList.remove('dragover');
    }

    function handleDrop(e) {
      e.preventDefault();
      elements.dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }

    function handleFileSelect() {
      const file = elements.fileInput.files[0];
      validateAndUpload(file);
    }

    function validateAndUpload(file) {
      if (!file) return;
      
      // Enhanced validation
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (!file.name.toLowerCase().endsWith('.zip')) {
        showError("Please upload a valid .zip file.");
        return;
      }
      if (file.size > maxSize) {
        showError("File too large. Maximum size is 100MB.");
        return;
      }
      
      uploadFile(file);
    }

    async function uploadFile(file) {
      // Cancel any existing upload
      if (currentUpload) {
        currentUpload.abort();
      }

      const controller = new AbortController();
      currentUpload = controller;

      showLoading("Uploading and processing...");
      elements.progress.style.display = 'block';

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8080/upload/", {
          method: "POST",
          body: formData,
          signal: controller.signal
        });

        elements.progress.style.display = 'none';

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const result = await response.json();
        showSuccess(`✅ Success!<br>Database URL: <code>${escapeHtml(result.db_url || 'N/A')}</code>`);
        
        // Reset file input
        elements.fileInput.value = '';
      } catch (error) {
        elements.progress.style.display = 'none';
        if (error.name === 'AbortError') {
          showError("Upload cancelled.");
        } else {
          showError("Upload failed: " + error.message);
        }
      } finally {
        currentUpload = null;
      }
    }

    function showLoading(message) {
      elements.statusText.className = "loading";
      elements.statusText.textContent = message;
    }

    function showSuccess(html) {
      elements.statusText.className = "success";
      elements.statusText.innerHTML = html;
    }

    function showError(message) {
      elements.statusText.className = "error";
      elements.statusText.textContent = "❌ " + message;
    }

    // Security: Escape HTML to prevent XSS
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Performance: Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (currentUpload) {
        currentUpload.abort();
      }
    }, { passive: true });
  </script>

</body>
</html>
