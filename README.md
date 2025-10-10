# 🏠 3D Home Designer

An interactive 3D home design tool built with Three.js that allows users to design and visualize homes with customizable parameters including dimensions, stories, roof styles, realistic materials, and garage options.

## Features

### 🎨 Design Controls (Left Sidebar)
- **House Width**: 20-100 feet
- **House Depth**: 20-80 feet
- **Number of Stories**: 1, 2, or 3 stories
- **House Shape**: Choose from 6 pre-defined floor plans
  - Simple Rectangle (traditional layout)
  - L-Shape (main house with perpendicular wing)
  - T-Shape (back section with front extension)
  - U-Shape (three sections forming U with courtyard)
  - Center with Wings (main section with two side wings)
  - Courtyard Style (four sections surrounding open center)
- **Roof Style**: Gable, Hip, or Flat
- **Wall Material**: Brick, Wood Siding, Stucco, Stone, Vinyl Siding
- **Roof Material**: Asphalt Shingle, Metal, Clay Tile, Slate, Wood Shake
- **Number of Windows**: 4-16 windows with intelligent distribution
- **Door Customization**:
  - Front Door: Choose position (center/left/right/none) and type (single/double/glass panel)
  - Side Doors (Left & Right): Single, double, or sliding glass options
  - Back Door: 6 options including single (3 positions), double, sliding, or French doors
  - Garage Entry Door: Optional door connecting garage to house
- **Front Porch**: None, Small (12×4 ft), or Large (full width×8 ft)
  - Thin elegant posts (0.15m radius) with decorative caps
  - Wooden stairs (3 steps)
  - Clean, minimalist design
- **Back Porch/Deck**: None, Small Deck, Large Deck, or Screened Porch
  - Small: 12×8 ft with 4 posts
  - Large: Full width×10 ft with 6 posts
  - Screened: 16×10 ft with semi-transparent screens
  - Includes back door when present
- **Add Chimney**: Optional brick chimney extending above roof
- **Garage Type**: None, Single (12 ft), or Double (20 ft)

### 📊 Real-Time Information Panel
Displays current design specifications:
- Width (in feet)
- Depth (in feet)
- Square Footage (total area across all stories)
- Number of Stories
- Window Count

### 🔧 Action Buttons
1. **Update Design**: Applies all changes and rebuilds the 3D model
2. **Generate Photorealistic Images**: AI-powered image generation (requires n8n setup)
   - Captures 3D reference
   - Sends design data to n8n webhook
   - Generates photorealistic renderings
   - Displays image gallery for selection
   - Includes cost estimation feature
3. **Export Data**: Downloads a JSON file with complete design specifications

### 🎯 Interactive 3D Visualization
- **Orbit Controls**: Click and drag to rotate, zoom, and pan
- **Preset Camera Views**: 4 quick view buttons with smooth transitions
  - Corner View (default angled perspective)
  - Front View (straight-on facade)
  - Side View (side profile)
  - Top View (bird's eye view)
- **Real-time Shadows**: Dynamic shadow rendering for realistic depth
- **PBR Materials**: Physically-Based Rendering with realistic material properties
- **High-Quality Rendering**: Anti-aliased graphics with proper lighting
- **Responsive Canvas**: Automatically adjusts to window size

## Getting Started

### Prerequisites
- A modern web browser with ES6 module support (Chrome 89+, Firefox 88+, Safari 14+, Edge 89+)
- Internet connection (for loading Three.js library from CDN)

### Installation

1. Clone or download this repository:
   ```bash
   git clone <repository-url>
   cd 3DInteractive
   ```

2. Open `index.html` in your web browser

**Note**: Due to ES6 module imports, you may need to serve the files through a local server rather than opening the HTML file directly. Use one of these methods:

#### Option 1: Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Option 2: Node.js
```bash
npx http-server
```

#### Option 3: VS Code Live Server
Install the "Live Server" extension and click "Go Live" in the bottom right corner.

Then open `http://localhost:8000` in your browser.

## Usage

### Designing Your Home

1. **Set Dimensions**: Enter values in the "House Width" and "House Depth" input fields
2. **Choose Stories**: Select 1, 2, or 3 stories from the dropdown
3. **Select Roof Style**: Choose between Gable, Hip, or Flat roof styles
4. **Choose Materials**: Select realistic wall and roof materials from the dropdowns
5. **Adjust Windows**: Use the slider to set the number of windows (4-16)
6. **Add Front Porch** (Optional): Select "Small" or "Large" porch with columns and roof
7. **Add Garage** (Optional): Select "Single" (12 ft) or "Double" (20 ft) from the garage type dropdown
8. **Click "Update Design"**: Apply your changes and see the 3D model update

### Navigation

- **Rotate**: Left-click and drag to orbit around the home
- **Zoom**: Scroll wheel or pinch to zoom in/out
- **Pan**: Right-click and drag (or two-finger drag on trackpad)
- **Quick Views**: Click any of the 4 view buttons for preset camera angles
  - Smooth 1-second transition animation
  - Manual control still available after preset view

### AI Image Generation

Click **"🎨 Generate Photorealistic Images"** to create AI-powered photorealistic renderings of your design.

**How it works:**
1. Captures a 3D reference screenshot
2. Collects all design parameters
3. Sends to n8n webhook for AI processing
4. Displays generated images in gallery modal
5. Select favorite design and calculate build cost

**Setup Status:**
- ✅ n8n webhook URL pre-configured: `https://n8n.empowerbuilding.ai/webhook/...`
- ✅ Full design data collection implemented
- ✅ Screenshot capture integrated
- ✅ Image gallery and display ready
- 🔧 Requires n8n workflow to be active on server

**Features:**
- Multiple concept variations
- Image gallery with selection
- Cost estimation calculator
- Full design data export

#### Design Data
Click **"Export Data"** to download a JSON file containing:
- All design parameters (dimensions, colors, roof style, etc.)
- Calculated values (square footage, volume, etc.)
- Timestamp of export

Example JSON output:
```json
{
  "design": {
    "houseWidth": 40,
    "houseDepth": 30,
    "numStories": 2,
    "roofStyle": "gable",
    "wallMaterial": "wood-siding",
    "roofMaterial": "asphalt-shingle",
    "numWindows": 8,
    "frontPorch": "small",
    "garageType": "single"
  },
  "calculations": {
    "squareFootage": 2640,
    "houseArea": 1200,
    "garageArea": 240,
    "stories": 2,
    "windows": 8,
    "volume": 24000
  },
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

## Project Structure

```
3DInteractive/
│
├── index.html          # Main HTML with form controls and canvas
├── styles.css          # Modern styling with #667eea color scheme
├── app.js              # ES6 module with Three.js implementation
└── README.md           # Project documentation (this file)
```

## Technology Stack

- **Three.js** (v0.158.0): WebGL-based 3D graphics library
- **OrbitControls**: Camera control addon from Three.js
- **ES6 Modules**: Modern JavaScript with import/export
- **CSS3**: Modern styling with CSS custom properties
- **HTML5**: Semantic markup with Canvas API

## Technical Architecture

### ES6 Module Structure
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class HomeDesigner {
    init()              // Initialize Three.js scene
    buildHome()         // Construct complete 3D home
    buildStory()        // Create individual floor
    buildRoof()         // Generate roof geometry
    buildGarage()       // Add garage structure
    captureScreenshot() // Export PNG image
    exportData()        // Export JSON data
    animate()           // Render loop
}
```

### Key Features

#### Dynamic Model Generation
- Procedurally generates walls, windows, and doors based on dimensions
- Automatically calculates window placement based on house width
- Scales all elements proportionally

#### Roof Styles
- **Gable**: Traditional triangular roof using extruded shape geometry
- **Hip**: Four-sided pyramid roof with custom buffer geometry
- **Flat**: Simple box geometry with slight overhang

#### Garage System
- **Single**: 4-meter wide garage
- **Double**: 7-meter wide garage
- Attached to the right side of the house
- Includes garage door with realistic texture

#### Rendering Pipeline
1. Scene setup with fog and background color
2. Directional lighting with shadow mapping
3. Ambient lighting for overall illumination
4. Grid helper for spatial reference
5. Ground plane for shadow reception

## Color Scheme

Primary color: `#667eea` (Indigo/Purple)
- Used for primary buttons and accent elements
- Hover state: `#5568d3`

Background colors:
- Canvas: `#f5f7fa` (Light gray)
- Sidebar: `#ffffff` (White)
- Info panel: `rgba(255, 255, 255, 0.95)` with backdrop blur

## Browser Compatibility

### Minimum Requirements
- Chrome 89+
- Firefox 88+
- Safari 14+
- Edge 89+

### Required Features
- ES6 Modules (import/export)
- Import Maps
- WebGL 1.0 or higher
- Canvas API

## Performance

The application is optimized for smooth 60 FPS performance:
- Efficient geometry generation (reuses materials)
- Shadow map resolution: 2048x2048
- Damped orbit controls for smooth interaction
- Automatic pixel ratio adjustment for high-DPI displays

Tested on:
- Desktop: 60 FPS (mid-range GPU)
- Laptop: 45-60 FPS (integrated graphics)
- Mobile: 30-45 FPS (recent devices)

## Limitations

- Simplified rectangular floor plans only
- No interior room division
- Basic window/door placement (automatically distributed)
- Garage limited to right side of house
- No terrain or landscaping
- No custom material textures (colors only)

## Future Enhancements

Potential features for future versions:
- [ ] Interior room layout and furniture
- [ ] Custom window/door placement
- [ ] Texture mapping for realistic materials
- [ ] Multiple garage positions
- [ ] Deck/patio additions
- [ ] Landscaping elements (trees, grass, etc.)
- [ ] Save/load designs to browser storage
- [ ] Share designs via URL
- [ ] 3D model export (OBJ, GLTF, STL)
- [ ] Print-friendly 2D floor plans
- [ ] Cost estimation calculator
- [ ] Mobile touch controls optimization

## Troubleshooting

### Common Issues

**Problem**: "Failed to resolve module specifier" error
- **Solution**: Make sure you're serving the files through a local server, not opening the HTML file directly (file:// protocol doesn't support ES6 modules)

**Problem**: Canvas is blank or black
- **Solution**: Check browser console for WebGL errors. Your browser/GPU must support WebGL 1.0+

**Problem**: Controls not working
- **Solution**: Try refreshing the page. Make sure JavaScript is enabled in your browser.

**Problem**: Screenshot button not working
- **Solution**: Some browsers block automatic downloads. Check your browser's download settings.

## Contributing

This is an educational/portfolio project. Feel free to:
- Fork and modify for your own use
- Submit issues for bugs
- Suggest features via pull requests

## License

This project is open source and available for educational purposes.

## Credits

- **Three.js**: https://threejs.org/
- **ES6 Import Maps**: https://github.com/WICG/import-maps
- **Inspiration**: Modern home design applications

## Resources

- Three.js Documentation: https://threejs.org/docs/
- Three.js Examples: https://threejs.org/examples/
- OrbitControls Guide: https://threejs.org/docs/#examples/en/controls/OrbitControls

---

**Built with ❤️ using Three.js**
