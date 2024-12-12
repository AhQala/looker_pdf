looker.plugins.visualizations.add({
  options: {
    iframe_height: {
      type: "number",
      label: "Viewer Height (px)",
      default: 800,
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
        padding: 20px;
      }
      .error-message {
        color: #e53e3e;
        padding: 1rem;
        background: #fff5f5;
        border-radius: 4px;
        text-align: center;
      }
      .pdf-iframe {
        border: none;
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        border-radius: 4px;
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
    const height = config.iframe_height || 800;

    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.className = 'pdf-iframe';
    iframe.width = "100%";
    iframe.height = height + "px";
    iframe.sandbox = "allow-scripts allow-same-origin";
    
    this.container.innerHTML = '';
    this.container.appendChild(iframe);
    
    doneRendering();
  }
});
