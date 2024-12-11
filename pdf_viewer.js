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
    this.canvasContainer = this.container.appendChild(document.createElement("div"));
    this.canvasContainer.className = "canvas-container";

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .pdf-container {
        width: 100%;
        height: 100%;
        overflow: auto;
        background: #f5f5f5;
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
      .canvas-container {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .pdf-page {
        margin-bottom: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        background: white;
      }
    `;
    element.appendChild(style);

    // Load PDF.js if not already loaded
    if (!window.pdfjsLib) {
      console.log('Loading PDF.js...');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        console.log('PDF.js loaded successfully');
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
    
    console.log('Loading PDF from:', pdfUrl);
    
    // Set container height
    this.container.style.height = `${height}px`;
    
    // Clear previous content
    this.canvasContainer.innerHTML = '';
    
    // Function to render a page
    const renderPage = async (page, scale = 1.5) => {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page';
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      this.canvasContainer.appendChild(canvas);
    };

    // Load and render the PDF using PDF.js
    if (window.pdfjsLib) {
      window.pdfjsLib.getDocument({ url: pdfUrl, withCredentials: true })
        .promise.then(async pdf => {
          console.log('PDF loaded successfully');
          this.messageEl.className = "pdf-message";
          
          // Render all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            await renderPage(page);
            console.log(`Page ${pageNum} rendered`);
          }
          
          doneRendering();
        })
        .catch(error => {
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
