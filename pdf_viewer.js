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
    this.messageEl.className = "pdf-message visible"; // Make visible by default
    this.messageEl.textContent = "Loading PDF..."; // Add loading message
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
        border: none;
      }
      .pdf-viewer iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
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
    
    // Debug message
    console.log('Attempting to load PDF from:', pdfUrl);
    
    // Set container height
    this.container.style.height = `${height}px`;
    
    // Create an iframe to load the PDF
    this.viewerContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.className = 'pdf-viewer';
    
    // Use Google Drive's viewer for PDFs
    const encodedUrl = encodeURIComponent(pdfUrl);
    const viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
    
    // Debug message
    console.log('Google Docs Viewer URL:', viewerUrl);
    
    iframe.src = viewerUrl;
    
    this.viewerContainer.appendChild(iframe);
    
    // Handle load errors
    iframe.onerror = (error) => {
      console.error('iframe load error:', error);
      this.messageEl.textContent = "Error loading PDF. Please check permissions and try again.";
      this.messageEl.className = "pdf-message visible";
    };

    // Handle successful load
    iframe.onload = () => {
      console.log('iframe loaded successfully');
      this.messageEl.className = "pdf-message";
    };

    doneRendering();
  }
});
