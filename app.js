// 2D Floor Plan Designer Application + 3D Viewer
// Integrated dual-view system

import { FloorPlanEditor } from './floorplan-editor.js';
import { ThreeJSGenerator } from './threejs-generator.js';

class FloorPlanApp {
    constructor() {
        console.log('🏗️ Initializing 2D Floor Plan Designer + 3D Viewer...');
        
        // Initialize 2D floor plan editor
        this.floorPlanEditor = new FloorPlanEditor('floor-plan-canvas');
        console.log('✅ Floor Plan Editor initialized');
        
        // Initialize 3D generator
        this.threejsGenerator = new ThreeJSGenerator('three-canvas');
        console.log('✅ Three.js Generator initialized');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial 3D generation
        this.update3DModel();
    }

    setupEventListeners() {
        // 2D CONTROLS
        
        // Clear Plan button
        document.getElementById('clear-plan')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.clear();
                this.update3DModel();
            }
        });
        
        // Undo button
        document.getElementById('undo')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.undo();
                this.update3DModel();
            }
        });
        
        // Set up mode buttons with exclusive selection
        this.setupModeButtons();
        
        // Floor management
        document.getElementById('add-floor')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.addFloor();
                this.update3DModel();
            }
        });
        
        // Floor selector change - update all current floor settings
        document.getElementById('floor-selector')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.switchFloor(parseInt(e.target.value));
                
                // Update wall height slider
                const currentHeight = this.floorPlanEditor.getCurrentFloorWallHeight();
                const heightSlider = document.getElementById('wall-height');
                if (heightSlider) {
                    heightSlider.value = currentHeight;
                    document.getElementById('wall-height-value').textContent = `${currentHeight}ft`;
                }
                
                // Update roof settings
                const hasRoof = this.floorPlanEditor.getCurrentFloorHasRoof();
                const hasRoofCheckbox = document.getElementById('floor-has-roof');
                if (hasRoofCheckbox) {
                    hasRoofCheckbox.checked = hasRoof;
                }
                
                const roofStyle = this.floorPlanEditor.getCurrentFloorRoofStyle();
                const roofStyleSelect = document.getElementById('roof-style');
                if (roofStyleSelect) {
                    roofStyleSelect.value = roofStyle;
                }
                
                const roofPitch = this.floorPlanEditor.getCurrentFloorRoofPitch();
                const pitchSlider = document.getElementById('roof-pitch');
                if (pitchSlider) {
                    pitchSlider.value = roofPitch;
                    document.getElementById('roof-pitch-value').textContent = `${roofPitch}:12`;
                }
                
                const roofOverhang = this.floorPlanEditor.getCurrentFloorRoofOverhang();
                const overhangSlider = document.getElementById('roof-overhang');
                if (overhangSlider) {
                    overhangSlider.value = roofOverhang;
                    document.getElementById('roof-overhang-value').textContent = `${roofOverhang} ft`;
                }
            }
        });
        
        document.getElementById('show-floor-overlay')?.addEventListener('change', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.render();
            }
        });
        
        // Export Design button
        document.getElementById('export-design')?.addEventListener('click', () => {
            this.exportDesign();
        });
        
        // ==================== 3D MODEL UPSCALE BUTTON ====================
        document.getElementById('upscale-3d-btn')?.addEventListener('click', async () => {
            const btn = document.getElementById('upscale-3d-btn');
            const statusText = document.getElementById('upscale-status');
            
            // Disable button and show loading
            btn.disabled = true;
            btn.innerHTML = '<span>⏳</span><span>Processing...</span>';
            if (statusText) statusText.textContent = 'Capturing 3D model...';
            
            try {
                // Get the 3D canvas
                const canvas = document.getElementById('three-canvas');
                if (!canvas) {
                    throw new Error('3D canvas not found');
                }
                
                console.log('📸 Capturing canvas:', {
                    width: canvas.width,
                    height: canvas.height,
                    displayWidth: canvas.clientWidth,
                    displayHeight: canvas.clientHeight
                });
                
                if (statusText) statusText.textContent = 'Preparing image...';
                
                // Convert canvas to blob with maximum quality
                const blob = await new Promise((resolve, reject) => {
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Failed to capture image'));
                    }, 'image/png', 1.0);
                });
                
                if (statusText) statusText.textContent = 'Sending to AI upscaler...';
                
                // Create FormData
                const formData = new FormData();
                formData.append('screenshot', blob, `3d-model-${Date.now()}.png`);
                formData.append('timestamp', new Date().toISOString());
                formData.append('source', 'floor-plan-designer');
                
                // Get floor plan data and transform it for n8n workflow
                if (this.floorPlanEditor) {
                    const floorPlanData = this.floorPlanEditor.getFloorPlanData();
                    
                    // Calculate building dimensions from walls
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    floorPlanData.floors.forEach(floor => {
                        floor.walls.forEach(wall => {
                            minX = Math.min(minX, wall.x1, wall.x2);
                            minY = Math.min(minY, wall.y1, wall.y2);
                            maxX = Math.max(maxX, wall.x1, wall.x2);
                            maxY = Math.max(maxY, wall.y1, wall.y2);
                        });
                    });
                    
                    const widthFeet = Math.round((maxX - minX) / 10); // Assuming 10 pixels = 1 foot
                    const depthFeet = Math.round((maxY - minY) / 10);
                    const totalWindows = floorPlanData.floors.reduce((sum, f) => sum + f.windows.length, 0);
                    const totalDoors = floorPlanData.floors.reduce((sum, f) => sum + f.doors.length, 0);
                    
                    // Get settings from UI
                    const roofStyle = document.getElementById('roof-style')?.value || 'hip';
                    const wallHeight = parseFloat(document.getElementById('wall-height')?.value || 8);
                    
                    // Transform to the format n8n expects
                    const designData = {
                        structure: {
                            stories: floorPlanData.floors.length,
                            width: widthFeet,
                            depth: depthFeet,
                            roofStyle: roofStyle,
                            wallHeight: wallHeight
                        },
                        materials: {
                            exterior: 'vinyl siding', // Default materials
                            roof: 'asphalt shingles'
                        },
                        features: {
                            windows: totalWindows > 0 ? 'multiple' : 'standard',
                            garage: 'none', // Could be enhanced to detect garage from floor plan
                            frontPorch: totalDoors > 0 ? 'covered' : 'none',
                            backPorch: 'none',
                            chimney: false
                        },
                        floorPlan: floorPlanData // Include raw floor plan data too
                    };
                    
                    formData.append('designData', JSON.stringify(designData));
                }
                
                // Send to n8n webhook
                const response = await fetch('https://n8n.empowerbuilding.ai/webhook/4239cad4-0815-4c94-a526-f4335b175aed', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
                }
                
                // Try to parse JSON response, but handle empty/invalid responses gracefully
                let result = null;
                const responseText = await response.text();
                console.log('📥 Raw response:', responseText);
                
                if (responseText && responseText.trim()) {
                    try {
                        result = JSON.parse(responseText);
                        console.log('✅ Upscale result:', result);
                    } catch (parseError) {
                        console.warn('⚠️ Response is not JSON:', responseText);
                        result = { message: 'Success', rawResponse: responseText };
                    }
                } else {
                    console.log('✅ Webhook accepted request (empty response)');
                    result = { message: 'Request submitted successfully' };
                }
                
                // Success state
                btn.innerHTML = '<span>✅</span><span>Success!</span>';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                if (statusText) {
                    statusText.textContent = '✨ Image upscaled successfully!';
                    statusText.style.color = '#10b981';
                }
                
                // Show result if available
                if (result && (result.upscaledImageUrl || result.outputUrl || result.imageUrl)) {
                    const imageUrl = result.upscaledImageUrl || result.outputUrl || result.imageUrl;
                    const modal = document.createElement('div');
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.8);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                        animation: fadeIn 0.3s;
                    `;
                    modal.innerHTML = `
                        <div style="background: white; border-radius: 16px; padding: 24px; max-width: 90vw; max-height: 90vh; overflow: auto;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <h3 style="margin: 0; font-size: 20px; font-weight: 700;">Upscaled 3D Model</h3>
                                <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; padding: 8px; line-height: 1;">×</button>
                            </div>
                            <img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Upscaled 3D Model" />
                            <div style="margin-top: 16px; display: flex; gap: 8px;">
                                <a href="${imageUrl}" download="upscaled-3d-model.png" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; border-radius: 8px; text-decoration: none; font-weight: 600;">📥 Download Image</a>
                                <button onclick="this.closest('div').parentElement.remove()" style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Close</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    
                    // Click outside to close
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.remove();
                        }
                    });
                }
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = '<span>📸</span><span>Upscale 3D Model</span>';
                    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    if (statusText) {
                        statusText.textContent = '';
                        statusText.style.color = '';
                    }
                }, 3000);
                
            } catch (error) {
                console.error('❌ Upscale error:', error);
                
                // Error state
                btn.innerHTML = '<span>❌</span><span>Failed</span>';
                btn.style.background = '#ef4444';
                if (statusText) {
                    statusText.textContent = `Error: ${error.message}`;
                    statusText.style.color = '#ef4444';
                }
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = '<span>📸</span><span>Upscale 3D Model</span>';
                    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    if (statusText) {
                        statusText.textContent = '';
                        statusText.style.color = '';
                    }
                }, 3000);
            }
        });
        
        // PATIO CONTROLS
        
        // Patio Roof Checkbox
        document.getElementById('patio-has-roof')?.addEventListener('change', (e) => {
            const hasRoof = e.target.checked;
            const roofStyle = document.getElementById('patio-roof-style')?.value || 'flat';
            
            if (this.floorPlanEditor) {
                if (this.floorPlanEditor.selectedPatio !== null) {
                    // Update only the selected patio
                    this.floorPlanEditor.updatePatioRoofSettings(
                        this.floorPlanEditor.selectedPatio,
                        hasRoof,
                        roofStyle
                    );
                } else {
                    // Update all patios and set as default for new ones
                    this.floorPlanEditor.updateAllPatioRoofSettings(hasRoof, roofStyle);
                }
                this.update3DModel();
            }
        });

        // Patio Roof Style Dropdown
        document.getElementById('patio-roof-style')?.addEventListener('change', (e) => {
            const roofStyle = e.target.value;
            const hasRoof = document.getElementById('patio-has-roof')?.checked || false;
            
            if (this.floorPlanEditor) {
                if (this.floorPlanEditor.selectedPatio !== null) {
                    // Update only the selected patio
                    this.floorPlanEditor.updatePatioRoofSettings(
                        this.floorPlanEditor.selectedPatio,
                        hasRoof,
                        roofStyle
                    );
        } else {
                    // Update all patios and set as default for new ones
                    this.floorPlanEditor.updateAllPatioRoofSettings(hasRoof, roofStyle);
                }
                this.update3DModel();
            }
        });
        
        // 3D CONTROLS
        
        // Wall Height Slider
        // Wall Height Slider - now affects current floor only
        document.getElementById('wall-height')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('wall-height-value').textContent = `${value}ft`;
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorWallHeight(value);
                this.update3DModel();
            }
        });
        
        // Floor Has Roof Checkbox
        document.getElementById('floor-has-roof')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorHasRoof(e.target.checked);
                this.update3DModel();
            }
        });
        
        // Show Roof Checkbox (Global visibility toggle)
        document.getElementById('show-roof')?.addEventListener('change', (e) => {
            if (this.threejsGenerator) {
                this.threejsGenerator.setShowRoof(e.target.checked);
                this.update3DModel();
            }
        });
        
        // Roof Style Dropdown - per floor
        document.getElementById('roof-style')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorRoofStyle(e.target.value);
                this.update3DModel();
            }
        });
        
        // Roof Pitch Slider - per floor
        document.getElementById('roof-pitch')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('roof-pitch-value').textContent = `${value}:12`;
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorRoofPitch(value);
                this.update3DModel();
            }
        });
        
        // Roof Overhang Slider - per floor
        document.getElementById('roof-overhang')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('roof-overhang-value').textContent = `${value.toFixed(1)} ft`;
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorRoofOverhang(value);
                this.update3DModel();
            }
        });
        
        // Manual Regenerate Button
        document.getElementById('regenerate-3d')?.addEventListener('click', () => {
            this.update3DModel();
        });
        
        // Sidebar toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar?.classList.toggle('collapsed');
        });
    }
    
    setupModeButtons() {
        const modeButtons = {
            'mode-draw': 'draw',
            'mode-edit': 'edit',
            'mode-door': 'door',
            'mode-window': 'window',
            'mode-patio': 'patio'
        };

        // Function to update active button state
        const setActiveMode = (activeButtonId) => {
            // Remove active class from all buttons
            Object.keys(modeButtons).forEach(buttonId => {
                const btn = document.getElementById(buttonId);
                if (btn) {
                    btn.classList.remove('active');
                }
            });

            // If activeButtonId is provided, set it as active
            if (activeButtonId) {
                const activeBtn = document.getElementById(activeButtonId);
                if (activeBtn) {
                    activeBtn.classList.add('active');
                }
            }
        };

        // Set up click handlers for each mode button
        Object.keys(modeButtons).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            const mode = modeButtons[buttonId];

            if (button) {
                button.addEventListener('click', () => {
                    // If clicking the already-active button, deselect it
                    if (button.classList.contains('active')) {
                        setActiveMode(null);  // Deselect all
                        if (this.floorPlanEditor) {
                            this.floorPlanEditor.setMode('view');  // Set to neutral view mode
                        }
            } else {
                        // Activate this button and deactivate others
                        setActiveMode(buttonId);
                        if (this.floorPlanEditor) {
                            this.floorPlanEditor.setMode(mode);
                        }
                    }
                });
            }
        });

        // Set default mode to 'draw' on startup
        setActiveMode('mode-draw');
        if (this.floorPlanEditor) {
            this.floorPlanEditor.setMode('draw');
        }
    }
    
    update3DModel() {
        if (!this.floorPlanEditor || !this.threejsGenerator) {
            return;
        }
        
        const floorplanData = this.floorPlanEditor.getFloorPlanData();
        this.threejsGenerator.generate3DFromFloorplan(floorplanData);
    }
    
    exportDesign() {
        if (!this.floorPlanEditor) {
            console.log('No floor plan to export');
            return;
        }

        const floorPlanData = this.floorPlanEditor.getFloorPlanData();
        
        // Create export data
        const exportData = {
            version: '3.0-Multi-Floor-With-3D',
            created: new Date().toISOString(),
            floors: floorPlanData.floors,
            settings: {
                gridSize: floorPlanData.gridSize,
                wallHeight: this.threejsGenerator.wallHeight,
                showRoof: this.threejsGenerator.showRoof
            }
        };
        
        // Download as JSON
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `floor-plan-3d-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ Floor plan exported successfully');
        
        const totalWalls = floorPlanData.floors.reduce((sum, floor) => sum + floor.walls.length, 0);
        const totalDoors = floorPlanData.floors.reduce((sum, floor) => sum + floor.doors.length, 0);
        const totalWindows = floorPlanData.floors.reduce((sum, floor) => sum + floor.windows.length, 0);
        alert(`Exported ${floorPlanData.floors.length} floor(s):\n${totalWalls} walls, ${totalDoors} doors, ${totalWindows} windows`);
    }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on mobile - if so, skip desktop app initialization
    const isMobile = window.innerWidth < 1025;
    const mobileLayout = document.querySelector('.mobile-layout');
    const isMobileLayoutVisible = mobileLayout && window.getComputedStyle(mobileLayout).display !== 'none';
    
    if (isMobile || isMobileLayoutVisible) {
        console.log('📱 Mobile detected - skipping desktop app initialization');
        return;
    }
    
    console.log('DOM loaded, initializing Floor Plan Designer + 3D Viewer...');
    const floorPlanApp = new FloorPlanApp();
    window.floorPlanApp = floorPlanApp;
    console.log('✅ Application initialized successfully');
});
