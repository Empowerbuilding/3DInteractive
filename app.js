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
        
        // Mode buttons
        document.getElementById('mode-draw')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('draw');
            }
        });
        
        document.getElementById('mode-edit')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('edit');
            }
        });
        
        document.getElementById('mode-door')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('door');
            }
        });
        
        document.getElementById('mode-window')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('window');
            }
        });
        
        document.getElementById('mode-patio')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('patio');
            }
        });
        
        // Floor management
        document.getElementById('add-floor')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.addFloor();
                this.update3DModel();
            }
        });
        
        document.getElementById('floor-selector')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.switchFloor(parseInt(e.target.value));
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
        
        // 3D CONTROLS
        
        // Wall Height Slider
        document.getElementById('wall-height')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('wall-height-value').textContent = `${value}ft`;
            if (this.threejsGenerator) {
                this.threejsGenerator.setWallHeight(value);
                this.update3DModel();
            }
        });
        
        // Show Roof Checkbox
        document.getElementById('show-roof')?.addEventListener('change', (e) => {
            if (this.threejsGenerator) {
                this.threejsGenerator.setShowRoof(e.target.checked);
                this.update3DModel();
            }
        });
        
        // Roof Style Dropdown
        document.getElementById('roof-style')?.addEventListener('change', (e) => {
            if (this.threejsGenerator) {
                this.threejsGenerator.setRoofStyle(e.target.value);
                this.update3DModel();
            }
        });
        
        // Roof Pitch Slider
        document.getElementById('roof-pitch')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('roof-pitch-value').textContent = `${value}:12`;
            if (this.threejsGenerator) {
                this.threejsGenerator.setRoofPitch(value);
                this.update3DModel();
            }
        });
        
        // Roof Overhang Slider
        document.getElementById('roof-overhang')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('roof-overhang-value').textContent = `${value.toFixed(1)} ft`;
            if (this.threejsGenerator) {
                this.threejsGenerator.setRoofOverhang(value);
                this.update3DModel();
            }
        });
        
        // Manual Regenerate Button
        document.getElementById('regenerate-3d')?.addEventListener('click', () => {
            this.update3DModel();
        });
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
    console.log('DOM loaded, initializing Floor Plan Designer + 3D Viewer...');
    const floorPlanApp = new FloorPlanApp();
    window.floorPlanApp = floorPlanApp;
    console.log('✅ Application initialized successfully');
});
