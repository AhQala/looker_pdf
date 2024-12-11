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
    this.canvasContainer = this.container.appendChild(document.createElement("div"));
    this.canvasContainer.className = "canvas-container";

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
        font-family: sans-serif;
      }
      .pdf-message.visible {
        display: block;
      }
      .canvas-container {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .canvas-container canvas {
        margin-bottom: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        background: white;
      }
    `;
    element.appendChild(style);

    // Load PDF.js if not already loaded
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        console.log('PDF.js loaded');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
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
    const scale = config.scale || this.options.scale.default;
    
    console.log('Attempting to load PDF from:', pdfUrl);
    
    // Set container height
    this.container.style.height = `${height}px`;
    
    // Clear previous content
    this.canvasContainer.innerHTML = '';
    this.messageEl.className = "pdf-message visible";
    this.messageEl.textContent = "Loading PDF...";

    // Function to render a single page
    const renderPage = async (page, pageNumber) => {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      try {
        await page.render(renderContext).promise;
        this.canvasContainer.appendChild(canvas);
        console.log(`Page ${pageNumber} rendered successfully`);
      } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
      }
    };

    // Load and render PDF
    if (window.pdfjsLib) {
      // Get authentication token if available
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const loadingTask = window.pdfjsLib.getDocument({
        url: pdfUrl,
        httpHeaders: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });

      loadingTask.promise
        .then(async (pdf) => {
          console.log('PDF loaded successfully');
          this.messageEl.className = "pdf-message";
          
          // Render all pages
          const pagePromises = [];
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            pagePromises.push(renderPage(page, pageNum));
          }
          
          await Promise.all(pagePromises);
          doneRendering();
        })
        .catch((error) => {
          console.error('Error loading PDF:', error);
          this.messageEl.textContent = "Error loading PDF. Please check permissions and try again.";
          doneRendering();
        });
    } else {
      console.log('Waiting for PDF.js to load...');
      setTimeout(() => this.updateAsync(data, element, config, queryResponse, details, doneRendering), 1000);
    }
  }
});
