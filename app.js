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
        // Desktop upscale button - open lead generation modal
        document.getElementById('upscale-3d-btn')?.addEventListener('click', () => {
            window.openLeadModal();
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
