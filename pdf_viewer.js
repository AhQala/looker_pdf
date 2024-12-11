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
      }
      .viewer-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .pdf-frame {
        flex: 1;
        border: none;
        min-height: 500px;
      }
      .pdf-nav {
        padding: 10px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        text-align: center;
      }
      .pdf-link {
        display: inline-block;
        padding: 8px 16px;
        background: #4285f4;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 0 5px;
      }
      .error-message {
        padding: 20px;
        text-align: center;
        color: #d32f2f;
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

    // Create navigation and frame
    this.viewerContainer.innerHTML = `
      <div class="pdf-nav">
        <a href="${pdfUrl}" target="_blank" class="pdf-link">Open PDF in New Tab</a>
      </div>
      <iframe 
        class="pdf-frame"
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
        src="/api/embed/pdf?url=${encodeURIComponent(pdfUrl)}"
        style="height: ${height - 60}px"
      ></iframe>
    `;

    doneRendering();
  }
});
