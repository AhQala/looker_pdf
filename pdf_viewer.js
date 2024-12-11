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
    
    // Clear previous content
    this.viewerContainer.innerHTML = '';

    // Create a sandboxed iframe that uses Mozilla's PDF.js viewer
    const frame = document.createElement('iframe');
    frame.className = 'pdf-frame';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    
    // Use Mozilla's PDF.js viewer with our PDF URL
    const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
    frame.src = viewerUrl;
    console.log('Viewer URL:', viewerUrl);

    frame.onload = () => {
      console.log('PDF viewer loaded');
      this.messageEl.className = "pdf-message";
    };

    frame.onerror = (error) => {
      console.error('Error loading PDF viewer:', error);
      this.messageEl.textContent = "Error loading PDF. Please check permissions and try again.";
    };

    this.viewerContainer.appendChild(frame);
    doneRendering();
  }
});
