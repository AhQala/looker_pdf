looker.plugins.visualizations.add({
  options: {
    pdf_height: {
      type: "number",
      label: "Viewer Height (px)",
      default: 800,
      section: "PDF Settings"
    }
  },
  create: function(element, config) {
    // Create container elements
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "pdf-container";
    this.messageEl = this.container.appendChild(document.createElement("div"));
    this.messageEl.className = "pdf-message visible";
    this.messageEl.textContent = "Loading PDF...";
    this.viewerContainer = this.container.appendChild(document.createElement("div"));
    this.viewerContainer.className = "pdf-viewer";

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .pdf-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: white;
        position: relative;
      }
      .pdf-message {
        color: #333;
        padding: 1rem;
        text-align: center;
        display: none;
        font-family: sans-serif;
      }
      .pdf-message.visible {
        display: block;
      }
      .pdf-viewer {
        width: 100%;
        height: 100%;
      }
      .pdf-frame {
        width: 100%;
        height: 100%;
        border: none;
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
      return;
    }

    const pdfUrl = data[0][queryResponse.fields.dimension_like[0].name].value;
    const height = config.pdf_height || this.options.pdf_height.default;
    
    console.log('Loading PDF from:', pdfUrl);
    
    // Set container height
    this.container.style.height = `${height}px`;
    
    // Create the iframe with specific attributes for authentication
    this.viewerContainer.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.className = 'pdf-frame';
    frame.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation');
    frame.setAttribute('allow', 'fullscreen');
    
    // Use a data URL to create an HTML wrapper that preserves authentication
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
            #pdf-embed { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <embed id="pdf-embed" 
                 type="application/pdf" 
                 src="${pdfUrl}"
                 width="100%"
                 height="100%">
        </body>
      </html>
    `;
    
    // Create blob URL
    const blob = new Blob([htmlContent], { type: 'text/html' });
    frame.src = URL.createObjectURL(blob);
    
    frame.onload = () => {
      console.log('Frame loaded');
      this.messageEl.className = "pdf-message";
    };
    
    frame.onerror = (error) => {
      console.error('Frame load error:', error);
      this.messageEl.textContent = "Error loading PDF. Please check permissions and try again.";
      this.messageEl.className = "pdf-message visible";
    };

    this.viewerContainer.appendChild(frame);
    doneRendering();
  }
});
