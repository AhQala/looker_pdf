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
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "pdf-container";
    this.viewerContainer = this.container.appendChild(document.createElement("div"));
    this.viewerContainer.className = "viewer-container";

    const style = document.createElement("style");
    style.textContent = `
      .pdf-container {
        width: 100%;
        height: 100%;
        background: white;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      .viewer-container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .viewer-iframe {
        flex: 1;
        border: none;
        background: white;
      }
      .loading-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #444;
        font-family: sans-serif;
      }
      .error-message {
        color: #d32f2f;
        text-align: center;
        padding: 20px;
        font-family: sans-serif;
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
    this.container.style.height = `${height}px`;
    
    // Show loading message
    this.viewerContainer.innerHTML = '<div class="loading-message">Loading PDF...</div>';

    // Create a data URL for the HTML content
    const viewerHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body, html {
              margin: 0;
              padding: 0;
              height: 100vh;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            #viewerContainer {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            iframe {
              flex: 1;
              border: none;
            }
          </style>
        </head>
        <body>
          <div id="viewerContainer">
            <iframe 
              src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pdfUrl)}" 
              width="100%" 
              height="100%" 
              frameborder="0">
            </iframe>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.className = 'viewer-iframe';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation');
    
    // Handle load events
    iframe.onload = () => {
      console.log('Viewer frame loaded');
      this.viewerContainer.querySelector('.loading-message')?.remove();
    };

    // Handle errors
    iframe.onerror = (error) => {
      console.error('Error loading viewer:', error);
      this.viewerContainer.innerHTML = '<div class="error-message">Error loading PDF. Please try again.</div>';
    };

    // Set iframe content
    this.viewerContainer.innerHTML = '';
    this.viewerContainer.appendChild(iframe);
    
    // Create blob URL and set as iframe source
    const blob = new Blob([viewerHtml], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);

    doneRendering();
  }
});
