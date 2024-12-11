# Looker PDF Viewer Visualization

A custom Looker visualization that renders PDF documents using PDF.js.

## Features
- Renders PDF documents directly in Looker dashboards
- Supports multi-page PDFs
- Adjustable height and zoom settings
- Responsive design that works across different screen sizes

## Installation

1. Fork or clone this repository
2. Get a CDN link to the visualization file using [jsDelivr](https://www.jsdelivr.com/) or [raw.githack.com](https://raw.githack.com/)
3. In Looker Admin > Visualizations, add a new visualization:
   - Enter a name (e.g., "PDF Viewer")
   - Paste the CDN URL to `pdf_viewer.js`
   - Save the visualization

## Usage

1. Create a query that includes a dimension containing PDF URLs
2. Select the "PDF Viewer" visualization
3. Configure the visualization settings:
   - Viewer Height: Set the height of the PDF viewer in pixels
   - Zoom Scale: Adjust the zoom level (1.0 = 100%)

## Requirements

- The PDF URLs must be accessible to Looker users
- Modern web browser with JavaScript enabled
- PDF URLs should use HTTPS and have appropriate CORS headers

## Example Look/Dashboard Setup

1. Create a dimension in your LookML that returns PDF URLs:
```lookml
dimension: document_url {
  sql: ${TABLE}.pdf_url ;;
  html: {{ value }} ;;
}
```

2. Create a Look or Dashboard tile using this dimension
3. Select the PDF Viewer visualization
4. Adjust the height and zoom settings as needed

## Troubleshooting

If the PDF fails to load, check:
1. The PDF URL is accessible and uses HTTPS
2. CORS headers are properly set on the PDF server
3. The PDF URL is correctly formatted and encoded
4. The browser console for any JavaScript errors

## Security Notes

- Ensure your PDF URLs are from trusted sources
- Consider implementing URL allowlisting in your LookML
- PDFs are rendered client-side using PDF.js for security
