looker.plugins.visualizations.add({
  options: {
    cloud_function_url: {
      type: "string",
      default: "https://us-central1-csrm-nova-prod.cloudfunctions.net/intel_hub_pdfs",
      section: "Settings"
    }
  },

  create: function(element, config) {
    element.innerHTML = "";
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "pdf-container";
    
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
        padding: 20px;
      }
      .pdf-page {
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        margin-bottom: 20px;
        border-radius: 4px;
        max-width: 100%;
      }
      .error-message {
        color: #e53e3e;
        padding: 1rem;
        background: #fff5f5;
        border-radius: 4px;
        text-align: center;
      }
      .loading-message {
        color: #2b6cb0;
        padding: 1rem;
        background: #ebf8ff;
        border-radius: 4px;
        text-align: center;
      }
    `;
    element.appendChild(style);
  },

  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this.clearErrors();
    
    if (!data || !data[0] || !queryResponse.fields.dimension_like[0]) {
      this.addError({title: "No Data"});
      return doneRendering();
    }

    const pdfUrl = data[0][queryResponse.fields.dimension_like[0].name].value;
    const blobName = pdfUrl.split('/intel_hub_pdfs/')[1];
    const cloudFunctionUrl = config.cloud_function_url;
    
    this.container.innerHTML = '<div class="loading-message">Loading PDF...</div>';

    fetch(`${cloudFunctionUrl}?blob=${encodeURIComponent(blobName)}`, {
      method: 'GET',
      mode: 'no-cors',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.type === 'opaque') {
        return response.blob();
      }
      return response.json();
    })
    .then(data => {
      if (data instanceof Blob) {
        return window.pdfjsLib.getDocument({data: data}).promise;
      }
      return window.pdfjsLib.getDocument({url: data.signed_url}).promise;
    })
    .then(pdf => this.renderPDF(pdf))
    .catch(error => {
      console.error('Error:', error);
      this.container.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    })
    .finally(doneRendering);
  },

  renderPDF: async function(pdf) {
    this.container.innerHTML = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
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
      
      this.container.appendChild(canvas);
    }
  }
});
