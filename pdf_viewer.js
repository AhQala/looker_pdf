looker.plugins.visualizations.add({
  options: {
    apps_script_url: {
      type: "string",
      label: "Apps Script Web App URL",
      default: "https://script.google.com/a/macros/google.com/s/AKfycbzIp_FtOZPUPCxi4TOWjlq9gISZLvxLy9N63H-r_13o_u_iggyue-3MPOv7YDu0pXOD/exec",
      section: "Settings"
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
        margin: 1rem;
      }
      .loading-message {
        color: #2b6cb0;
        padding: 1rem;
        background: #ebf8ff;
        border-radius: 4px;
        text-align: center;
        margin: 1rem;
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
    const appsScriptUrl = config.apps_script_url;
    
    this.container.innerHTML = '<div class="loading-message">Loading PDF...</div>';
    console.log("Processing URL:", pdfUrl);

    fetch(`${appsScriptUrl}?url=${encodeURIComponent(pdfUrl)}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.error) throw new Error(data.error);
      
      this.container.innerHTML = '';
      data.images.forEach(image => {
        const img = document.createElement('img');
        img.src = `data:image/jpeg;base64,${image.data}`;
        img.className = 'pdf-page';
        this.container.appendChild(img);
      });
    })
    .catch(error => {
      console.error('Error:', error);
      this.container.innerHTML = `<div class="error-message">Error loading PDF: ${error.message}</div>`;
    })
    .finally(doneRendering);
  }
});
