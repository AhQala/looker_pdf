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

    // Load PDF.js
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }

    // Add styles
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
    `;
    element.appendChild(style);
  },
  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this.clearError();
    
    if (!data || !data[0] || !queryResponse.fields.dimension_like[0]) {
      this.addError({title: "No Data"});
      return;
    }

    const pdfUrl = data[0][queryResponse.fields.dimension_like[0].name].value;
    const blobName = decodeURIComponent(pdfUrl.split('/').pop());
    const cloudFunctionUrl = config.cloud_function_url;
    
    this.messageEl.textContent = 'Loading PDF...';
    this.messageEl.className = 'pdf-message';
    this.viewerContainer.innerHTML = '';
    this.container.style.height = `${config.pdf_height || 800}px`;

    fetch(`${cloudFunctionUrl}?blob=${encodeURIComponent(blobName)}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        return window.pdfjsLib.getDocument(data.signed_url).promise;
      })
      .then(pdf => {
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
        console.error('PDF Error:', error);
        this.messageEl.textContent = `Error loading PDF: ${error.message}`;
        this.messageEl.className = 'pdf-message error';
      })
      .finally(doneRendering);
  }
});
