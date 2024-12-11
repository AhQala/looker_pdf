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
      .viewer-frame {
        flex: 1;
        border: none;
        width: 100%;
        height: 100%;
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

    // Set up the viewer iframe
    const frame = document.createElement('iframe');
    frame.className = 'viewer-frame';
    
    // Use Google Docs viewer
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    frame.src = googleViewerUrl;
    
    // Clear previous content and add new frame
    this.viewerContainer.innerHTML = '';
    this.viewerContainer.appendChild(frame);

    doneRendering();
  }
});
