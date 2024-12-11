looker.plugins.visualizations.add({
  options: {
    pdf_height: {
      type: "number",
      label: "Viewer Height (px)",
      default: 600,
      section: "PDF Settings"
    },
    scale: {
      type: "number",
      label: "Zoom Scale",
      default: 1.0,
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
        background: #525659;
        position: relative;
      }
      .pdf-message {
        color: white;
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
        background: white;
      }
      .pdf-viewer iframe {
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
    
    console.log('Original PDF URL:', pdfUrl);
    
    // Set container height
    this.container.style.height = `${height}px`;
    
    // Create iframe with Google Docs viewer
    this.viewerContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation');
    
    // Use Google Docs viewer
    const encodedUrl = encodeURIComponent(pdfUrl);
    const viewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
    iframe.src = viewerUrl;
    
    console.log('Viewer URL:', viewerUrl);

    // Add load event listener
    iframe.onload = () => {
      console.log('PDF viewer loaded successfully');
      this.messageEl.className = "pdf-message";
    };

    // Add error event listener
    iframe.onerror = (error) => {
      console.error('Error loading PDF viewer:', error);
      this.messageEl.textContent = "Error loading PDF. Please check permissions and try again.";
    };

    this.viewerContainer.appendChild(iframe);
    doneRendering();
  }
});
