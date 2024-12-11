looker.plugins.visualizations.add({
  options: {
    pdf_height: {
      type: "number",
      label: "Viewer Height (px)",
      default: 800,
      section: "PDF Settings"
    },
    cloud_function_url: {
      type: "string",
      label: "Cloud Function URL",
      default: "https://us-central1-csrm-nova-prod.cloudfunctions.net/intel_hub_pdfs",
      section: "PDF Settings"
    }
  },
  create: function(element, config) {
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "pdf-container";
    this.messageEl = this.container.appendChild(document.createElement("div"));
    this.messageEl.className = "pdf-message";
    this.viewerContainer = this.container.appendChild(document.createElement("div"));
    this.viewerContainer.className = "viewer-container";

    // Load PDF.js if not already loaded
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }

    const style = document.createElement("style");
    style.textContent = `
      .pdf-container {
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        position: relative;
        overflow: auto;
      }
      .pdf-message {
        color: #333;
        padding: 1rem;
        text-align: center;
        display: none;
        font-family: sans-serif;
      }
      .pdf-message.error {
        color: red;
        display: block;
      }
      .viewer-container {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .pdf-page {
        margin-bottom: 20px;
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        max-width: 100%;
      }
      .pdf-nav {
        padding: 10px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        text-align: center;
      }
      .pdf-link {
        display: inline-block;
        padding: 8px 16px;
        background: #4285f4;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 0 5px;
      }
    `;
    element.appendChild(style);
  },
  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this.clearErrors();
    
    // Validate input data
    if (!data || !data[0] || !queryResponse.fields.dimension_like[0]) {
      this.addError({
        title: "No Data",
        message: "This visualization requires a dimension containing a PDF URL."
      });
      return;
    }

    // Validate Cloud Function URL
    const cloudFunctionUrl = config.cloud_function_url || 
      "https://us-central1-csrm-nova-prod.cloudfunctions.net/intel_hub_pdfs";
    
    const pdfUrl = data[0][queryResponse.fields.dimension_like[0].name].value;
    const height = config.pdf_height || this.options.pdf_height.default;
    
    // Get the blob name from the URL
    const blobName = pdfUrl.split('/').pop();
    
    // Reset containers
    this.messageEl.textContent = 'Loading PDF...';
    this.messageEl.className = 'pdf-message';
    this.viewerContainer.innerHTML = '';
    this.container.style.height = `${height}px`;
    
    // Create navigation section
    const navContainer = document.createElement('div');
    navContainer.className = 'pdf-nav';
    navContainer.innerHTML = `
      <a href="${pdfUrl}" target="_blank" class="pdf-link">Open Original PDF</a>
    `;
    this.viewerContainer.appendChild(navContainer);

    // Fetch signed URL and render PDF
    fetch(`${cloudFunctionUrl}?blob=${encodeURIComponent(blobName)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        return response.json();
      })
      .then(data => {
        const signedUrl = data.signed_url;
        if (window.pdfjsLib) {
          return window.pdfjsLib.getDocument(signedUrl).promise;
        } else {
          throw new Error('PDF.js not loaded');
        }
      })
      .then(pdf => {
        this.messageEl.className = 'pdf-message';
        
        // Render all pages
        const renderPage = async (pageNum) => {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.className = 'pdf-page';
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          this.viewerContainer.appendChild(canvas);

          if (pageNum < pdf.numPages) {
            await renderPage(pageNum + 1);
          }
        };

        return renderPage(1);
      })
      .catch(error => {
        console.error('Error:', error);
        this.messageEl.textContent = "Error loading PDF. Please check permissions and URL.";
        this.messageEl.className = 'pdf-message error';
      })
      .finally(() => {
        doneRendering();
      });
  }
});
