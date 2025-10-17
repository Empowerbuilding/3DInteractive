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
     * Create area panel in sidebar
     */
    createAreaPanel() {
        console.log('📐 Creating area panel...');
        
        let panel = document.getElementById('area-details-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'area-details-panel';
            panel.className = 'sidebar-section';
            panel.style.display = 'none';
            
            const sidebar = document.querySelector('.sidebar');
            const infoPanel = document.querySelector('.info-panel');
            
            if (sidebar) {
                if (infoPanel && infoPanel.nextSibling) {
                    sidebar.insertBefore(panel, infoPanel.nextSibling);
                } else {
                    sidebar.appendChild(panel);
                }
                console.log('✅ Area panel created');
            } else {
                console.error('❌ Sidebar not found');
            }
        }
        
        return panel;
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
        if (!areas || !areas.totals) {
            console.warn('⚠️ No area data to display');
            return;
        }
        
        let panel = document.getElementById('area-details-panel');
        
        if (!panel) {
            panel = this.createAreaPanel();
        }
        
        if (!panel) {
            console.error('❌ Could not create panel');
            return;
        }
        
        // Show the panel
        panel.style.display = 'block';
        
        // Build content with inline styles
        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                <h3 style="color: white; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                    📐 Area Calculations
                </h3>
                
                <div style="display: grid; gap: 12px; margin-bottom: 12px;">
                    <!-- Living Space -->
                    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; font-weight: 500;">Living Space:</span>
                        <span style="font-size: 16px; font-weight: 700;">${areas.totals.totalLivingSpace.toLocaleString()} sq ft</span>
                    </div>
                    
                    <!-- Total Walls -->
                    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; font-weight: 500;">Total Walls:</span>
                        <span style="font-size: 16px; font-weight: 700;">${areas.totals.wallArea.toLocaleString()} sq ft</span>
                    </div>
                    
                    <!-- Total Roof -->
                    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; font-weight: 500;">Total Roof:</span>
                        <span style="font-size: 16px; font-weight: 700;">${areas.totals.roofArea.toLocaleString()} sq ft</span>
                    </div>
                    
                    <!-- Patios -->
                    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; font-weight: 500;">Patios:</span>
                        <span style="font-size: 16px; font-weight: 700;">${areas.totals.patioArea.toLocaleString()} sq ft</span>
                    </div>
                </div>
                
                <button id="show-detailed-areas-btn" style="width: 100%; padding: 10px 20px; background: rgba(255, 255, 255, 0.2); color: white; border: 2px solid white; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                    View Detailed Breakdown
                </button>
            </div>
        `;
        
        // Add click handler for detail button
        const detailBtn = document.getElementById('show-detailed-areas-btn');
        if (detailBtn) {
            detailBtn.onclick = () => this.showDetailedModal(areas);
        }
        
        console.log('✅ Area panel updated with data');
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
     * Show detailed modal with inline styles (fallback method)
     * @param {Object} areas - Area calculation results
     */
    showDetailedModal(areas) {
        // Remove existing modal if any
        const existing = document.querySelector('.area-modal-overlay');
        if (existing) existing.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'area-modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.7); display: flex;
            align-items: center; justify-content: center;
            z-index: 10000; padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; max-width: 700px; width: 100%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
                <div style="padding: 24px; border-bottom: 2px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px; color: #2c3e50;">📐 Detailed Area Breakdown</h2>
                    <button class="close-modal-btn" style="background: none; border: none; font-size: 28px; color: #999; cursor: pointer;">✕</button>
                </div>
                
                <div style="padding: 24px;">
                    ${this.generateDetailedHTML(areas)}
                </div>
                
                <div style="padding: 16px 24px; border-top: 2px solid #e0e0e0; display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="download-btn" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        📄 Download Report
                    </button>
                    <button class="close-modal-btn" style="padding: 10px 20px; background: #e0e0e0; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.onclick = () => modal.remove();
        });
        
        modal.querySelector('.download-btn').onclick = () => {
            this.downloadReport(areas);
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    /**
     * Generate detailed HTML with inline styles (fallback method)
     * @param {Object} areas - Area calculation results
     * @returns {string} HTML content
     */
    generateDetailedHTML(areas) {
        let html = `
            <div style="margin-bottom: 32px;">
                <h3 style="color: #667eea; font-size: 18px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
                    📊 Summary Totals
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Total Living Space</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.totals.totalLivingSpace.toLocaleString()} sq ft
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Total Wall Area</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.totals.wallArea.toLocaleString()} sq ft
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Total Roof Area</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.totals.roofArea.toLocaleString()} sq ft
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Patio Area</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.totals.patioArea.toLocaleString()} sq ft
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-bottom: 32px;">
                <h3 style="color: #667eea; font-size: 18px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
                    🔍 Wall Breakdown
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Exterior Walls</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.breakdown.exteriorWallArea.toLocaleString()} sq ft
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Interior Walls</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.breakdown.interiorWallArea.toLocaleString()} sq ft
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Windows</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.breakdown.windowArea.toLocaleString()} sq ft
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #555; font-weight: 500;">Doors</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                            ${areas.breakdown.doorArea.toLocaleString()} sq ft
                        </td>
                    </tr>
                </table>
            </div>
        `;
        
        // Add per-floor breakdown
        areas.floors.forEach(floor => {
            html += `
                <div style="margin-bottom: 32px;">
                    <h3 style="color: #667eea; font-size: 18px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
                        🏢 ${floor.floorName}
                    </h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 12px 0; color: #555; font-weight: 500;">Floor Area</td>
                            <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                                ${floor.floorArea.toLocaleString()} sq ft
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 12px 0; color: #555; font-weight: 500;">Wall Area</td>
                            <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                                ${floor.totalWallArea.toLocaleString()} sq ft
                            </td>
                        </tr>
                        ${floor.roofArea > 0 ? `
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 12px 0; color: #555; font-weight: 500;">Roof Area</td>
                            <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                                ${floor.roofArea.toLocaleString()} sq ft
                            </td>
                        </tr>
                        ` : ''}
                        ${floor.patioArea > 0 ? `
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 12px 0; color: #555; font-weight: 500;">Patio Area</td>
                            <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                                ${floor.patioArea.toLocaleString()} sq ft
                            </td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 12px 0; color: #555; font-weight: 500;">Perimeter</td>
                            <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #667eea;">
                                ${floor.perimeter} ft
                            </td>
                        </tr>
                    </table>
                </div>
            `;
        });
        
        return html;
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
     * Download report (fallback method)
     * @param {Object} areas - Area calculation results
     */
    downloadReport(areas) {
        const report = this.areaCalculator.formatAreaReport(areas);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `area-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ Report downloaded');
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
        
        // Make AreaCalculator class available globally for mobile app
        window.AreaCalculator = AreaCalculator;
        
        console.log('✅ Global area functions exposed');
    }
}

// Initialize area integration when module loads
const areaIntegration = new AreaIntegration();

// Export for potential external use
export { AreaIntegration };
