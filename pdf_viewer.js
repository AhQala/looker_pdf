looker.plugins.visualizations.add({
  options: {
    image_height: {
      type: "number",
      label: "Image Height (px)",
      default: 800,
      section: "Settings"
    }
  },

  create: function(element, config) {
    element.innerHTML = "";
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "image-container";
    
    const style = document.createElement("style");
    style.textContent = `
      .image-container {
        width: 100%;
        background: #f5f5f5;
        overflow: auto;
        padding: 20px;
      }
      .pdf-image {
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        border-radius: 4px;
        max-width: 100%;
      }
      .error-message {
        color: #e53e3e;
        padding: 1rem;
        background: #fff5f5;
        border-radius: 4px;
        text-align: center;
      }
    `;
    element.appendChild(style);
  },

  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this.clearErrors();
    
    if (!data || !data[0]) {
      this.addError({title: "No Data"});
      return doneRendering();
    }

    const imageUrl = data[0].image_url?.value;
    if (!imageUrl) {
      this.container.innerHTML = '<div class="error-message">No image URL available</div>';
      return doneRendering();
    }

    this.container.innerHTML = '';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'pdf-image';
    img.style.height = `${config.image_height || 800}px`;
    this.container.appendChild(img);
    
    doneRendering();
  }
});
