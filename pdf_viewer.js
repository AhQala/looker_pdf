looker.plugins.visualizations.add({
  options: {
    apps_script_url: {
      type: "string",
      label: "Apps Script URL",
      default: "https://script.google.com/a/macros/google.com/s/AKfycbxlrip7TgmjkGYGhDW-n_MQhUaAqaX30je8qLECTEcVG7klAm_W4GM8GQcvoCaxkZZs-g/exec",
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
    
    const appsScriptUrl = config.apps_script_url;
    this.container.innerHTML = '<div class="loading-message">Converting PDF...</div>';

    fetch(appsScriptUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {'Accept': 'application/json'}
    })
    .then(response => response.json())
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
      this.container.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    })
    .finally(doneRendering);
  }
});
