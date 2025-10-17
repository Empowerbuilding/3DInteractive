// Area Integration System for 3D Home Design Application
// Handles UI integration and real-time area calculations

import { AreaCalculator } from './area-calculator.js';

class AreaIntegration {
    constructor() {
        // Initialize area calculator with default grid size
        this.areaCalculator = new AreaCalculator(20);
        this.currentAreaData = null;
        this.updateTimeout = null;
        this.isInitialized = false;
        
        // Debounce delay for area calculations
        this.debounceDelay = 500;
        
        console.log('📐 Area Integration System initialized');
        this.initialize();
    }

    /**
     * Initialize the area integration system
     */
    initialize() {
        if (this.isInitialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
        } else {
            this.setupIntegration();
        }
        
        this.isInitialized = true;
    }

    /**
     * Setup integration with existing floor plan editor
     */
    setupIntegration() {
        // Hook into floor plan editor's render cycle
        this.hookIntoRenderCycle();
        
        // Create initial UI elements
        this.createAreaPanel();
        
        // Setup global functions
        this.setupGlobalFunctions();
        
        console.log('✅ Area integration setup complete');
    }

    /**
     * Hook into the floor plan editor's render cycle
     */
    hookIntoRenderCycle() {
        // Find the floor plan editor instance
        const floorPlanEditor = window.floorPlanApp?.floorPlanEditor || window.mobileApp?.floorPlanEditor;
        
        if (floorPlanEditor) {
            // Store original render method
            const originalRender = floorPlanEditor.render.bind(floorPlanEditor);
            
            // Wrap render method to include area calculations
            floorPlanEditor.render = (...args) => {
                // Call original render
                const result = originalRender(...args);
                
                // Debounced area calculation
                this.debouncedAreaUpdate();
                
                return result;
            };
            
            console.log('✅ Hooked into floor plan editor render cycle');
        } else {
            // Retry after a short delay if floor plan editor not found
            setTimeout(() => this.hookIntoRenderCycle(), 1000);
        }
    }

    /**
     * Debounced area update to prevent excessive calculations
     */
    debouncedAreaUpdate() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.updateComprehensiveMeasurements();
        }, this.debounceDelay);
    }

    /**
     * Update comprehensive measurements and UI
     * @returns {Object|null} Area data or null if not available
     */
    updateComprehensiveMeasurements() {
        try {
            // Get floorplan data
            const floorplanData = this.getFloorplanData();
            
            if (!floorplanData) {
                console.log('📐 No floorplan data available for area calculation');
                return null;
            }
            
            // Calculate areas
            const areas = this.areaCalculator.calculateAllAreas(floorplanData);
            
            // Store current area data
            this.currentAreaData = areas;
            
            // Log formatted report
            console.log(this.areaCalculator.formatAreaReport(areas));
            
            // Update UI
            this.updateAreaDisplays(areas);
            
            return areas;
        } catch (error) {
            console.error('❌ Error updating comprehensive measurements:', error);
            return null;
        }
    }

    /**
     * Get floorplan data from the appropriate source
     * @returns {Object|null} Floorplan data or null
     */
    getFloorplanData() {
        // Try desktop app first - use getFloorPlanData method
        if (window.floorPlanApp?.floorPlanEditor?.getFloorPlanData) {
            return window.floorPlanApp.floorPlanEditor.getFloorPlanData();
        }
        
        // Try mobile app
        if (window.mobileApp?.floorPlanEditor?.getFloorPlanData) {
            return window.mobileApp.floorPlanEditor.getFloorPlanData();
        }
        
        // Try alternative method with exportFloorplanData if available
        if (window.floorPlanApp?.floorPlanEditor?.exportFloorplanData) {
            return window.floorPlanApp.floorPlanEditor.exportFloorplanData();
        }
        
        if (window.mobileApp?.floorPlanEditor?.exportFloorplanData) {
            return window.mobileApp.floorPlanEditor.exportFloorplanData();
        }
        
        return null;
    }

    /**
     * Update area displays in the UI
     * @param {Object} areas - Area calculation results
     */
    updateAreaDisplays(areas) {
        if (!areas || !areas.totals) return;
        
        // Update existing square footage display if it exists
        this.updateSquareFootageDisplay(areas.totals.totalLivingSpace);
        
        // Create/update area details panel
        this.createAreaDetailsPanel(areas);
        
        // Show/hide panel based on whether there's data
        const panel = document.getElementById('area-details-panel');
        if (panel) {
            panel.style.display = areas.totals.totalLivingSpace > 0 ? 'block' : 'none';
        }
    }

    /**
     * Update square footage display in existing UI
     * @param {number} squareFootage - Total living space
     */
    updateSquareFootageDisplay(squareFootage) {
        // Look for existing square footage displays and update them
        const elements = document.querySelectorAll('[data-square-footage], .square-footage, #square-footage');
        elements.forEach(element => {
            element.textContent = this.areaCalculator.formatNumber(squareFootage);
        });
    }

    /**
     * Create area details panel in sidebar
     * @param {Object} areas - Area calculation results
     */
    createAreaDetailsPanel(areas) {
        let panel = document.getElementById('area-details-panel');
        
        if (!panel) {
            // Create the panel if it doesn't exist
            panel = document.createElement('div');
            panel.id = 'area-details-panel';
            panel.className = 'sidebar-section';
            
            // Insert after model stats section or at end of sidebar
            const modelStats = document.querySelector('.sidebar-section:has(#stat-floors)');
            if (modelStats) {
                modelStats.insertAdjacentElement('afterend', panel);
            } else {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.appendChild(panel);
                }
            }
        }
        
        // Generate panel content
        panel.innerHTML = this.generateAreaPanelHTML(areas);
        
        // Setup event listeners for the panel
        this.setupAreaPanelEvents(panel);
    }

    /**
     * Generate HTML for area details panel
     * @param {Object} areas - Area calculation results
     * @returns {string} HTML content
     */
    generateAreaPanelHTML(areas) {
        const totals = areas.totals;
        
        return `
            <h3 class="section-title">
                <span>📐 Area Calculations</span>
            </h3>
            <div class="area-grid">
                <div class="area-item">
                    <span class="area-label">🏠 Living Space</span>
                    <span class="area-value">${this.areaCalculator.formatNumber(totals.totalLivingSpace)} sq ft</span>
                </div>
                <div class="area-item">
                    <span class="area-label">🧱 Total Walls</span>
                    <span class="area-value">${this.areaCalculator.formatNumber(totals.wallArea)} sq ft</span>
                </div>
                <div class="area-item">
                    <span class="area-label">🏠 Total Roof</span>
                    <span class="area-value">${this.areaCalculator.formatNumber(totals.roofArea)} sq ft</span>
                </div>
                <div class="area-item">
                    <span class="area-label">🏡 Patios</span>
                    <span class="area-value">${this.areaCalculator.formatNumber(totals.patioArea)} sq ft</span>
                </div>
            </div>
            <button id="view-detailed-breakdown" class="btn-secondary full-width" style="margin-top: 12px;">
                📊 View Detailed Breakdown
            </button>
        `;
    }

    /**
     * Setup event listeners for area panel
     * @param {HTMLElement} panel - Area panel element
     */
    setupAreaPanelEvents(panel) {
        const breakdownBtn = panel.querySelector('#view-detailed-breakdown');
        if (breakdownBtn) {
            breakdownBtn.addEventListener('click', () => {
                this.showDetailedAreasModal(this.currentAreaData);
            });
        }
    }

    /**
     * Show detailed areas modal
     * @param {Object} areas - Area calculation results
     */
    showDetailedAreasModal(areas) {
        if (!areas) {
            console.warn('⚠️ No area data available for detailed breakdown');
            return;
        }
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📊 Detailed Area Breakdown</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    ${this.generateDetailedAreaHTML(areas)}
                </div>
                <div class="modal-footer">
                    <button id="download-area-report" class="btn-secondary">
                        📥 Download Report
                    </button>
                    <button class="modal-close-btn btn-primary">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modal);
        
        // Setup event listeners
        this.setupModalEvents(modal);
        
        // Show modal with animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    /**
     * Generate detailed area HTML tables
     * @param {Object} areas - Area calculation results
     * @returns {string} HTML content
     */
    generateDetailedAreaHTML(areas) {
        const totals = areas.totals;
        const breakdown = areas.breakdown;
        const floors = areas.floors;
        
        let html = '';
        
        // Summary Totals
        html += `
            <div class="area-section">
                <h3>📊 Summary Totals</h3>
                <table class="area-table">
                    <tr>
                        <td>Total Living Space</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(totals.totalLivingSpace)} sq ft</td>
                    </tr>
                    <tr>
                        <td>Total Floor Area</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(totals.floorArea)} sq ft</td>
                    </tr>
                    <tr>
                        <td>Total Wall Area</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(totals.wallArea)} sq ft</td>
                    </tr>
                    <tr>
                        <td>Total Roof Area</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(totals.roofArea)} sq ft</td>
                    </tr>
                    <tr>
                        <td>Total Patio Area</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(totals.patioArea)} sq ft</td>
                    </tr>
                </table>
            </div>
        `;
        
        // Wall Breakdown
        html += `
            <div class="area-section">
                <h3>🧱 Wall Breakdown</h3>
                <table class="area-table">
                    <tr>
                        <td>Exterior Walls</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(breakdown.exteriorWallArea)} sq ft</td>
                    </tr>
                    <tr>
                        <td>Interior Walls</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(breakdown.interiorWallArea)} sq ft</td>
                    </tr>
                    <tr>
                        <td>Windows</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(breakdown.windowArea)} sq ft</td>
                    </tr>
                    <tr>
                        <td>Doors</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(breakdown.doorArea)} sq ft</td>
                    </tr>
                </table>
            </div>
        `;
        
        // By Floor
        if (floors && floors.length > 0) {
            html += `
                <div class="area-section">
                    <h3>🏢 By Floor</h3>
                    <table class="area-table">
                        <thead>
                            <tr>
                                <th>Floor</th>
                                <th>Floor Area</th>
                                <th>Wall Area</th>
                                <th>Roof Area</th>
                                <th>Patio Area</th>
                                <th>Perimeter</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            floors.forEach(floor => {
                html += `
                    <tr>
                        <td>${floor.floorName}</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(floor.floorArea)} sq ft</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(floor.totalWallArea)} sq ft</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(floor.roofArea)} sq ft</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(floor.patioArea)} sq ft</td>
                        <td class="area-value">${this.areaCalculator.formatNumber(floor.perimeter)} ft</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        return html;
    }

    /**
     * Setup modal event listeners
     * @param {HTMLElement} modal - Modal element
     */
    setupModalEvents(modal) {
        // Close buttons
        const closeBtns = modal.querySelectorAll('.modal-close, .modal-close-btn');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(modal));
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        // Download report button
        const downloadBtn = modal.querySelector('#download-area-report');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadAreaReport());
        }
        
        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Close modal with animation
     * @param {HTMLElement} modal - Modal element
     */
    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Download area report as text file
     */
    downloadAreaReport() {
        if (!this.currentAreaData) {
            console.warn('⚠️ No area data available for download');
            return;
        }
        
        const report = this.areaCalculator.formatAreaReport(this.currentAreaData);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `area-report-${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ Area report downloaded');
    }

    /**
     * Export area data for n8n workflow
     * @returns {Object|null} Formatted area data or null
     */
    exportAreaDataForWorkflow() {
        if (!this.currentAreaData) {
            console.log('📐 No area data available for workflow export');
            return null;
        }
        
        const workflowData = {
            areas: this.currentAreaData,
            timestamp: new Date().toISOString(),
            gridSize: this.areaCalculator.gridSize
        };
        
        console.log('📐 Area data formatted for n8n workflow:', workflowData);
        return workflowData;
    }

    /**
     * Setup global functions for external access
     */
    setupGlobalFunctions() {
        // Make functions available globally
        window.updateComprehensiveMeasurements = () => this.updateComprehensiveMeasurements();
        window.exportAreaDataForWorkflow = () => this.exportAreaDataForWorkflow();
        window.downloadAreaReport = () => this.downloadAreaReport();
        window.showDetailedAreasModal = (areas) => this.showDetailedAreasModal(areas);
        
        console.log('✅ Global area functions exposed');
    }
}

// Initialize area integration when module loads
const areaIntegration = new AreaIntegration();

// Export for potential external use
export { AreaIntegration };
