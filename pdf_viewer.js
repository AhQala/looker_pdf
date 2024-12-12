looker.plugins.visualizations.add({
  options: {
    image_height: {
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
    element.innerHTML = "";
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "pdf-container";
    
    const style = document.createElement("style");
    style.textContent = `
      .pdf-container {
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        overflow: auto;
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
    const blobName = decodeURIComponent(pdfUrl.split('/').pop());
    const cloudFunctionUrl = config.cloud_function_url;
    
    this.container.innerHTML = '<div class="loading-message">Loading PDF...</div>';

    fetch(`${cloudFunctionUrl}?blob=${encodeURIComponent(blobName)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://efc66c30-8184-4bce-985b-2b39478647db.looker.app'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      
      this.container.innerHTML = '';
      data.images.forEach(image => {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${image.data}`;
        img.className = 'pdf-page';
        this.container.appendChild(img);
      });
    })
    .catch(error => {
      console.error('Error:', error);
      this.container.innerHTML = `
        <div class="error-message">
          Error loading PDF: ${error.message}
        </div>`;
    })
    .finally(doneRendering);
  }
});
