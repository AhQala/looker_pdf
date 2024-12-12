looker.plugins.visualizations.add({
  options: {
    pdf_height: {
      type: "number",
      label: "Viewer Height (px)",
      default: 800,
      section: "PDF Settings"
    },
    zoom_level: {
      type: "number",
      label: "Zoom Level",
      default: 1.5,
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
    element.innerHTML = "";
    
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "pdf-container";
    
    this.messageEl = this.container.appendChild(document.createElement("div"));
    this.messageEl.className = "pdf-message";
    
    this.viewerContainer = this.container.appendChild(document.createElement("div"));
    this.viewerContainer.className = "viewer-container";

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
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .pdf-message.error {
        color: #e53e3e;
        display: block;
        background: #fff5f5;
        border-radius: 4px;
        margin: 1rem;
        border: 1px solid #fc8181;
      }
      .pdf-message.loading {
        display: block;
        color: #2b6cb0;
        background: #ebf8ff;
        border-radius: 4px;
        margin: 1rem;
        border: 1px solid #63b3ed;
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
        border-radius: 4px;
      }
      .pdf-controls {
        position: sticky;
        top: 0;
        background: white;
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 20px;
        display: flex;
        justify-content: center;
        gap: 10px;
        z-index: 10;
      }
    `;
    element.appendChild(style);
  },

  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this.clearErrors();
    
    if (!data || !data[0] || !queryResponse.fields.dimension_like[0]) {
      this.addError({
        title: "No Data",
        message: "This visualization requires a dimension containing a PDF URL."
      });
      return doneRendering();
    }

    if (!window.pdfjsLib) {
      this.messageEl.textContent = 'Loading PDF viewer...';
      this.messageEl.className = 'pdf-message loading';
      setTimeout(() => this.updateAsync(data, element, config, queryResponse, details, doneRendering), 1000);
      return;
    }

    const pdfUrl = data[0][queryResponse.fields.dimension_like[0].name].value;
    const blobName = decodeURIComponent(pdfUrl.split('/').pop());
    const cloudFunctionUrl = config.cloud_function_url;
    const zoomLevel = config.zoom_level || 1.5;
    
    this.messageEl.textContent = 'Loading PDF...';
    this.messageEl.className = 'pdf-message loading';
    this.viewerContainer.innerHTML = '';
    this.container.style.height = `${config.pdf_height || 800}px`;

    fetch(`${cloudFunctionUrl}?blob=${encodeURIComponent(blobName)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://efc66c30-8184-4bce-985b-2b39478647db.looker.app'
      },
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.error) throw new Error(data.error);
      if (!data.signed_url) throw new Error('No signed URL received');
      
      return window.pdfjsLib.getDocument(data.signed_url).promise;
    })
    .then(pdf => {
      this.messageEl.className = 'pdf-message';
      
      const renderPage = async (pageNum) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoomLevel });
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
      console.error('PDF Error:', error);
      this.messageEl.textContent = `Error loading PDF: ${error.message}`;
      this.messageEl.className = 'pdf-message error';
    })
    .finally(() => {
      doneRendering();
    });
  }
});
