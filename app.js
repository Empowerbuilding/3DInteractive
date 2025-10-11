// 2D Floor Plan Designer Application
// Simplified version - 2D drawing only, no 3D visualization

import { FloorPlanEditor } from './floorplan-editor.js';

class FloorPlanApp {
    constructor() {
        console.log('🏗️ Initializing 2D Floor Plan Designer...');
        
        // Initialize 2D floor plan editor
        this.floorPlanEditor = new FloorPlanEditor('floor-plan-canvas');
        console.log('✅ Floor Plan Editor initialized');
        
        // Floor plan updates happen automatically through the editor
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Clear Plan button
        document.getElementById('clear-plan')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.clear();
                console.log('Floor plan cleared');
            }
        });
        
        // Undo button
        document.getElementById('undo')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.undo();
                console.log('Undo last point');
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
    }
    
    exportDesign() {
        if (!this.floorPlanEditor) {
            console.log('No floor plan to export');
            return;
        }

        const floorPlanData = this.floorPlanEditor.getFloorPlanData();
        
        // Create export data
        const exportData = {
            version: '3.0-Multi-Floor',
            created: new Date().toISOString(),
            floors: floorPlanData.floors
        };
        
        // Download as JSON
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `floor-plan-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ Floor plan exported successfully');
        
        // Calculate totals for alert
        const totalWalls = floorPlanData.floors.reduce((sum, floor) => sum + floor.walls.length, 0);
        const totalDoors = floorPlanData.floors.reduce((sum, floor) => sum + floor.doors.length, 0);
        const totalWindows = floorPlanData.floors.reduce((sum, floor) => sum + floor.windows.length, 0);
        alert(`Exported ${floorPlanData.floors.length} floor(s):\n${totalWalls} walls, ${totalDoors} doors, ${totalWindows} windows`);
    }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Floor Plan Designer...');
    const app = new FloorPlanApp();
    window.floorPlanApp = app;
    console.log('✅ Floor Plan Designer initialized successfully');
});
