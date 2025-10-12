// mobile-app.js
// Mobile-specific functionality for the Floor Plan Designer

import { FloorPlanEditor } from './floorplan-editor.js';
import { ThreeJSGenerator } from './threejs-generator.js';

class MobileFloorPlanApp {
    constructor() {
        console.log('📱 Initializing Mobile Floor Plan App...');
        
        this.currentView = '2d'; // '2d' or '3d'
        this.floorPlanEditor = null;
        this.threejsGenerator = null;
        this.canvas = document.getElementById('mobile-canvas');
        
        this.init();
    }

    init() {
        // Initialize 2D editor first
        this.floorPlanEditor = new FloorPlanEditor('mobile-canvas');
        
        // Initialize 3D generator (will create its own canvas/renderer)
        this.threejsGenerator = new ThreeJSGenerator('mobile-canvas');
        
        // Hide 3D renderer initially (show 2D canvas)
        if (this.threejsGenerator.renderer) {
            this.threejsGenerator.renderer.domElement.style.display = 'none';
        }
        
        this.setupEventListeners();
        this.setupBottomSheet();
        this.setupSideMenu();
        
        console.log('✅ Mobile app initialized');
    }

    setupEventListeners() {
        // View Switcher (2D/3D Toggle)
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Tool Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Drawing Mode Buttons
        document.querySelectorAll('.mobile-tool-btn[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (mode && this.floorPlanEditor) {
                    this.floorPlanEditor.setMode(mode);
                    // Visual feedback
                    document.querySelectorAll('.mobile-tool-btn[data-mode]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // Door/Window mode buttons
        document.querySelectorAll('.mobile-tool-btn-wide[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (mode && this.floorPlanEditor) {
                    this.floorPlanEditor.setMode(mode);
                    // Visual feedback
                    document.querySelectorAll('.mobile-tool-btn-wide[data-mode]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // Clear Plan
        document.getElementById('mobile-clear-plan')?.addEventListener('click', () => {
            if (confirm('Clear entire floor plan?')) {
                this.floorPlanEditor.clear();
            }
        });

        // Undo
        document.getElementById('mobile-undo')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.undo();
            }
        });

        // Update 3D FAB
        document.getElementById('mobile-update-3d')?.addEventListener('click', () => {
            this.update3DModel();
            // Show brief confirmation
            const fab = document.getElementById('mobile-update-3d');
            fab.style.transform = 'scale(1.1)';
            setTimeout(() => { fab.style.transform = 'scale(1)'; }, 200);
        });

        // Floor Management
        document.getElementById('mobile-add-floor')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.addFloor();
                this.updateFloorSelector();
            }
        });

        document.getElementById('mobile-floor-selector')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.switchFloor(parseInt(e.target.value));
            }
        });

        // Settings Controls
        document.getElementById('mobile-wall-height')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const display = document.getElementById('mobile-wall-height-value');
            if (display) {
                display.textContent = `${value} ft`;
            }
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorWallHeight(value);
            }
        });

        document.getElementById('mobile-show-roof')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorHasRoof(e.target.checked);
                this.update3DModel();
            }
        });

        document.getElementById('mobile-show-floor-overlay')?.addEventListener('change', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.render();
            }
        });

        document.getElementById('mobile-roof-style')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorRoofStyle(e.target.value);
            }
        });

        // Door Style
        document.getElementById('mobile-door-style')?.addEventListener('change', (e) => {
            // This syncs with the existing door style in floorplan-editor
            const desktopSelect = document.getElementById('door-style');
            if (desktopSelect) {
                desktopSelect.value = e.target.value;
            }
        });

        // Export
        document.getElementById('mobile-export-design')?.addEventListener('click', () => {
            this.exportDesign();
        });

        // Hamburger Menu
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            this.openSideMenu();
        });
    }

    setupBottomSheet() {
        const sheet = document.getElementById('mobile-tools-sheet');
        if (!sheet) return;

        const handle = sheet.querySelector('.sheet-handle');
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const startDrag = (e) => {
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            isDragging = true;
            sheet.style.transition = 'none';
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            
            currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            const isExpanded = sheet.classList.contains('expanded');
            
            if (deltaY > 0) {
                // Dragging down
                if (isExpanded) {
                    sheet.style.transform = `translateY(${deltaY}px)`;
                }
            } else {
                // Dragging up
                if (!isExpanded) {
                    const peekHeight = window.innerHeight * 0.35 - 140; // 35% collapsed
                    const newPos = Math.max(0, peekHeight + deltaY);
                    sheet.style.transform = `translateY(${newPos}px)`;
                }
            }
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            
            sheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const deltaY = currentY - startY;
            
            if (deltaY > 80) {
                // Swipe down - collapse
                sheet.classList.remove('expanded');
                sheet.style.transform = 'translateY(calc(100% - 140px))';
            } else if (deltaY < -80) {
                // Swipe up - expand
                sheet.classList.add('expanded');
                sheet.style.transform = 'translateY(0)';
            } else {
                // Return to current state
                if (sheet.classList.contains('expanded')) {
                    sheet.style.transform = 'translateY(0)';
                } else {
                    sheet.style.transform = 'translateY(calc(100% - 140px))';
                }
            }
        };

        // Touch events
        if (handle) {
            handle.addEventListener('touchstart', startDrag, { passive: true });
            document.addEventListener('touchmove', doDrag, { passive: true });
            document.addEventListener('touchend', endDrag);

            // Mouse events for testing on desktop
            handle.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', endDrag);
        }

        // Close button
        sheet.querySelector('.sheet-close')?.addEventListener('click', () => {
            sheet.classList.remove('expanded');
        });

        // Clicking tabs expands sheet if collapsed
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!sheet.classList.contains('expanded')) {
                    sheet.classList.add('expanded');
                }
            });
        });
    }

    setupSideMenu() {
        const menu = document.getElementById('mobile-side-menu');
        const overlay = document.getElementById('mobile-overlay');
        const openBtn = document.getElementById('mobile-menu-btn');
        const closeBtn = menu?.querySelector('.side-menu-close');

        const openMenu = () => {
            menu?.classList.add('open');
            overlay?.classList.add('visible');
        };

        const closeMenu = () => {
            menu?.classList.remove('open');
            overlay?.classList.remove('visible');
        };

        openBtn?.addEventListener('click', openMenu);
        closeBtn?.addEventListener('click', closeMenu);
        overlay?.addEventListener('click', closeMenu);

        // Menu actions
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                
                if (action === 'new-plan') {
                    if (confirm('Start a new plan? Current work will be lost.')) {
                        this.floorPlanEditor.clear();
                    }
                } else if (action === 'export') {
                    this.exportDesign();
                } else if (action === 'help') {
                    alert('Floor Plan Designer Help:\n\n' +
                          '1. Draw walls by tapping and dragging\n' +
                          '2. Add doors/windows by selecting tool and tapping walls\n' +
                          '3. Switch to 3D view to see your design\n' +
                          '4. Swipe up tool sheet for more options\n' +
                          '5. Tap "Update" button to refresh 3D model');
                }
                
                closeMenu();
            });
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        const hint = document.querySelector('.controls-hint');

        if (view === '2d') {
            // Show 2D canvas, hide 3D
            this.floorPlanEditor.canvas.style.display = 'block';
            if (this.threejsGenerator.renderer) {
                this.threejsGenerator.renderer.domElement.style.display = 'none';
            }
            if (hint) {
                hint.style.display = 'none';
            }
        } else {
            // Show 3D canvas, hide 2D
            this.update3DModel();
            this.floorPlanEditor.canvas.style.display = 'none';
            if (this.threejsGenerator.renderer) {
                this.threejsGenerator.renderer.domElement.style.display = 'block';
            }
            if (hint) {
                hint.style.display = 'block';
                // Hide hint after 3 seconds
                setTimeout(() => {
                    hint.style.display = 'none';
                }, 3000);
            }
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
    }

    update3DModel() {
        if (!this.floorPlanEditor || !this.threejsGenerator) return;
        
        const floorplanData = this.floorPlanEditor.getFloorPlanData();
        this.threejsGenerator.generate3DFromFloorplan(floorplanData);
    }

    updateFloorSelector() {
        const selector = document.getElementById('mobile-floor-selector');
        if (!selector || !this.floorPlanEditor) return;

        const numFloors = this.floorPlanEditor.floors.length;
        selector.innerHTML = '';
        
        for (let i = 0; i < numFloors; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Floor ${i + 1}`;
            selector.appendChild(option);
        }
        
        selector.value = this.floorPlanEditor.currentFloor;
    }

    exportDesign() {
        if (!this.floorPlanEditor) return;

        const floorPlanData = this.floorPlanEditor.getFloorPlanData();
        
        const exportData = {
            version: '3.0-Mobile',
            created: new Date().toISOString(),
            floors: floorPlanData.floors,
            settings: {
                gridSize: floorPlanData.gridSize
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `floor-plan-mobile-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        alert('Design exported successfully! 📥');
    }

    openSideMenu() {
        const menu = document.getElementById('mobile-side-menu');
        const overlay = document.getElementById('mobile-overlay');
        menu?.classList.add('open');
        overlay?.classList.add('visible');
    }
}

// Initialize mobile app only on mobile devices
if (window.innerWidth <= 1024) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📱 Mobile device detected, loading mobile app...');
        const mobileApp = new MobileFloorPlanApp();
        window.mobileApp = mobileApp;
    });
}

