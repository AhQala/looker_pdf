// pdf_viewer.js
looker.plugins.visualizations.add({
  options: {
    pdf_url: {
      type: "string",
      label: "PDF URL",
      default: "",
      section: "PDF Settings"
    },
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
    this.messageEl.className = "pdf-message";
    this.canvasContainer = this.container.appendChild(document.createElement("div"));
    this.canvasContainer.className = "pdf-canvas-container";

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .pdf-container {
        width: 100%;
        height: 100%;
        overflow: auto;
        background: #525659;
        position: relative;
      }
      .pdf-message {
        color: white;
        padding: 1rem;
        text-align: center;
        display: none;
      }
      .pdf-message.visible {
        display: block;
      }
      .pdf-canvas-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100%;
        padding: 1rem;
      }
      .pdf-canvas-container canvas {
        max-width: 100%;
        margin-bottom: 1rem;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    `;
    element.appendChild(style);

    // Load PDF.js from CDN
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
  },

  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this.clearErrors();
    
    // Get PDF URL from the first row's first column
    if (!data || !data[0] || !queryResponse.fields.dimension_like[0]) {
      this.addError({
        title: "No Data",
        message: "This visualization requires a dimension containing a PDF URL."
      });
      return;
    }

    const pdfUrl = data[0][queryResponse.fields.dimension_like[0].name].value;
    const height = config.pdf_height || this.options.pdf_height.default;
    const scale = config.scale || this.options.scale.default;

    // Set container height
    this.container.style.height = `${height}px`;

    // Show loading message
    this.messageEl.textContent = "Loading PDF...";
    this.messageEl.className = "pdf-message visible";
    this.canvasContainer.innerHTML = "";

    // Load and render PDF
    if (window.pdfjsLib) {
      window.pdfjsLib.getDocument(pdfUrl).promise
        .then(pdf => {
          this.messageEl.className = "pdf-message";
          
          // Render all pages
          const renderPage = (pageNum) => {
            return pdf.getPage(pageNum).then(page => {
              const viewport = page.getViewport({ scale });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderContext = {
                canvasContext: context,
                viewport: viewport
              };

              return page.render(renderContext).promise.then(() => {
                this.canvasContainer.appendChild(canvas);
                if (pageNum < pdf.numPages) {
                  return renderPage(pageNum + 1);
                }
              });
            });
          };

          return renderPage(1);
        })
        .then(() => {
          doneRendering();
        })
        .catch(error => {
          this.messageEl.textContent = "Error loading PDF: " + error.message;
          this.messageEl.className = "pdf-message visible";
          doneRendering();
        });
    } else {
      this.messageEl.textContent = "PDF.js is still loading. Please wait...";
      setTimeout(() => this.updateAsync(data, element, config, queryResponse, details, doneRendering), 1000);
    }
  }
});
