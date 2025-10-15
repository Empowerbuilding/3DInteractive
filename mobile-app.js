// mobile-app.js
// Mobile-specific functionality for Concept Studio

import { FloorPlanEditor } from './floorplan-editor.js';
import { ThreeJSGenerator } from './threejs-generator.js';

class MobileFloorPlanApp {
    constructor() {
        console.log('📱 Mobile App Constructor Called');
        console.log('Window width:', window.innerWidth);
        
        this.currentView = '2d'; // '2d' or '3d'
        this.floorPlanEditor = null;
        this.threejsGenerator = null;
        this.canvas2D = document.getElementById('mobile-canvas-2d');
        this.canvas3D = document.getElementById('mobile-canvas-3d');
        
        console.log('2D Canvas element:', this.canvas2D);
        console.log('3D Canvas element:', this.canvas3D);
        
        if (!this.canvas2D || !this.canvas3D) {
            console.error('❌ CRITICAL: mobile canvases not found!');
            console.log('Available canvases:', document.querySelectorAll('canvas'));
            return;
        }
        
        console.log('✅ Both canvases found, initializing...');
        this.init();
    }

    init() {
        if (!this.canvas2D || !this.canvas3D) {
            console.error('Mobile canvases not found!');
            return;
        }
        
        console.log('📱 Initializing mobile app...');
        
        // CRITICAL: Set canvas sizes BEFORE initializing anything
        const container = document.querySelector('.mobile-canvas-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            
            // Set both canvases to proper size IMMEDIATELY
            [this.canvas2D, this.canvas3D].forEach(canvas => {
                if (!canvas) return;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.width = Math.floor(rect.width);
                canvas.height = Math.floor(rect.height);
            });
            
            console.log(`✅ Canvases pre-sized to ${Math.floor(rect.width)}x${Math.floor(rect.height)}`);
        }
        
        // Check if desktop app already created instances
        if (window.floorPlanApp) {
            console.log('⚠️ Desktop app detected - using its instances');
            this.floorPlanEditor = window.floorPlanApp.floorPlanEditor;
            this.threejsGenerator = window.floorPlanApp.threejsGenerator;
        } else {
            console.log('📱 Creating new mobile instances...');
            
            // Initialize 2D editor with canvas that's already properly sized
            this.floorPlanEditor = new FloorPlanEditor('mobile-canvas-2d');
            console.log('✅ 2D editor initialized');
            
            // Initialize 3D generator with properly sized canvas
            this.threejsGenerator = new ThreeJSGenerator('mobile-canvas-3d');
            console.log('✅ 3D generator initialized');
            
            // Verify 3D canvas size
            console.log('3D Canvas size after init:', {
                width: this.canvas3D.width,
                height: this.canvas3D.height,
                styleWidth: this.canvas3D.style.width,
                styleHeight: this.canvas3D.style.height
            });
        }
        
        // Generate initial 3D model (even if empty)
        this.update3DModel();
        
        // Hide 3D canvas initially
        this.canvas3D.style.display = 'none';
        
        // Set up resize handler
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.setupEventListeners();
        this.setupBottomSheet();
        this.setupSideMenu();
        this.setupBottomSheetObserver();
        this.setupCanvasInteraction();
        
        console.log('✅ Mobile app fully initialized with smart undo button and tap-to-edit');
    }

    resizeCanvas() {
        const container = document.querySelector('.mobile-canvas-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        
        // Set both canvases to match container exactly
        // CSS size = buffer size for perfect 1:1 coordinate mapping
        [this.canvas2D, this.canvas3D].forEach(canvas => {
            if (!canvas) return;
            
            // Remove any inline styles that might interfere
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            // Set buffer size to match actual display size
            canvas.width = Math.floor(rect.width);
            canvas.height = Math.floor(rect.height);
        });
        
        // Notify Three.js renderer of size change
        if (this.threejsGenerator && this.threejsGenerator.renderer) {
            this.threejsGenerator.renderer.setSize(Math.floor(rect.width), Math.floor(rect.height), false);
            
            // Update camera aspect ratio for mobile screen
            if (this.threejsGenerator.camera) {
                this.threejsGenerator.camera.aspect = rect.width / rect.height;
                this.threejsGenerator.camera.updateProjectionMatrix();
            }
        }
        
        // Re-render the 2D canvas with correct dimensions
        if (this.floorPlanEditor) {
            this.floorPlanEditor.render();
        }
        
        console.log(`✅ Mobile canvases resized to ${Math.floor(rect.width)}x${Math.floor(rect.height)}`);
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
                if (mode === 'show-all') {
                    // Handle show-all mode
                    this.toggleShowAllMode();
                    // Visual feedback
                    document.querySelectorAll('.mobile-tool-btn-wide[data-mode]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                } else if (mode && this.floorPlanEditor) {
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

        // Mobile Quick Undo Button (floating button)
        document.getElementById('mobile-quick-undo')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.undo();
            }
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

        // NEW: Floor has roof checkbox
        document.getElementById('mobile-floor-has-roof')?.addEventListener('change', (e) => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorHasRoof(e.target.checked);
                this.update3DModel();
            }
        });

        // NEW: Roof pitch slider
        document.getElementById('mobile-roof-pitch')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const display = document.getElementById('mobile-roof-pitch-value');
            if (display) {
                display.textContent = `${value}:12`;
            }
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorRoofPitch(value);
                this.update3DModel();
            }
        });

        // NEW: Roof overhang slider
        document.getElementById('mobile-roof-overhang')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const display = document.getElementById('mobile-roof-overhang-value');
            if (display) {
                display.textContent = `${value.toFixed(1)} ft`;
            }
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setCurrentFloorRoofOverhang(value);
                this.update3DModel();
            }
        });

        // NEW: Patio roof checkbox
        document.getElementById('mobile-patio-has-roof')?.addEventListener('change', (e) => {
            const hasRoof = e.target.checked;
            const roofStyle = document.getElementById('mobile-patio-roof-style')?.value || 'flat';
            
            if (this.floorPlanEditor) {
                if (this.floorPlanEditor.selectedPatio !== null) {
                    this.floorPlanEditor.updatePatioRoofSettings(
                        this.floorPlanEditor.selectedPatio,
                        hasRoof,
                        roofStyle
                    );
                } else {
                    this.floorPlanEditor.updateAllPatioRoofSettings(hasRoof, roofStyle);
                }
                this.update3DModel();
            }
        });

        // NEW: Patio roof style
        document.getElementById('mobile-patio-roof-style')?.addEventListener('change', (e) => {
            const roofStyle = e.target.value;
            const hasRoof = document.getElementById('mobile-patio-has-roof')?.checked || false;
            
            if (this.floorPlanEditor) {
                if (this.floorPlanEditor.selectedPatio !== null) {
                    this.floorPlanEditor.updatePatioRoofSettings(
                        this.floorPlanEditor.selectedPatio,
                        hasRoof,
                        roofStyle
                    );
                } else {
                    this.floorPlanEditor.updateAllPatioRoofSettings(hasRoof, roofStyle);
                }
                this.update3DModel();
            }
        });

        // Export
        document.getElementById('mobile-export-design')?.addEventListener('click', () => {
            this.exportDesign();
        });

        // ==================== MOBILE 3D MODEL UPSCALE BUTTON ====================
        // Setup mobile upscale button with retry logic to handle script loading order
        const setupUpscaleButton = () => {
            const mobileUpscaleBtn = document.getElementById('mobile-upscale-3d');
            
            if (!mobileUpscaleBtn) {
                console.error('❌ Mobile upscale button #mobile-upscale-3d not found!');
                return;
            }
            
            // Remove any existing listeners by cloning the node
            const newBtn = mobileUpscaleBtn.cloneNode(true);
            mobileUpscaleBtn.parentNode.replaceChild(newBtn, mobileUpscaleBtn);
            
            // Add fresh event listener
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Mobile upscale button clicked!');
                
                if (typeof window.openLeadModal === 'function') {
                    console.log('✅ Opening lead modal via window.openLeadModal');
                    window.openLeadModal();
                } else {
                    console.warn('⚠️ window.openLeadModal not available, using fallback');
                    
                    // Direct DOM manipulation fallback
                    const modal = document.getElementById('leadModal');
                    if (modal) {
                        modal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                        console.log('✅ Opened modal via DOM manipulation');
                    } else {
                        console.error('❌ Lead modal element not found!');
                        alert('Modal not ready. Please try again.');
                    }
                }
            });
            
            console.log('✅ Mobile upscale button event listener attached');
        };

        // Try immediately
        setupUpscaleButton();

        // Retry after delay to ensure lead-generation.js is loaded
        setTimeout(setupUpscaleButton, 300);
        setTimeout(setupUpscaleButton, 1000);

        // Hamburger Menu
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            this.openSideMenu();
        });

        // Mobile Header Generate Button
        document.getElementById('mobile-header-generate-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Mobile header generate button clicked!');
            
            if (typeof window.openLeadModal === 'function') {
                console.log('✅ Opening lead modal via window.openLeadModal');
                window.openLeadModal();
            } else {
                console.warn('⚠️ window.openLeadModal not available, using fallback');
                
                // Direct DOM manipulation fallback
                const modal = document.getElementById('leadModal');
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    console.log('✅ Opened modal via DOM manipulation');
                } else {
                    console.error('❌ Lead modal element not found!');
                    alert('Modal not ready. Please try again.');
                }
            }
        });
    }

    setupBottomSheet() {
        const sheet = document.getElementById('mobile-tools-sheet');
        if (!sheet) return;

        // Start collapsed by default - just tabs showing
        sheet.classList.remove('expanded');

        const handle = sheet.querySelector('.sheet-handle');
        const toolTabs = sheet.querySelector('.tool-tabs');
        const sheetHeader = sheet.querySelector('.sheet-header');
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let startTime = 0;

        const startDrag = (e) => {
            // Don't start drag if clicking on a button
            if (e.target.closest('.tab-btn, .sheet-close')) {
                return;
            }
            
            e.preventDefault();
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            startTime = Date.now();
            isDragging = true;
            sheet.style.transition = 'none';
            console.log('🟢 Drag started at Y:', startY);
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            const isExpanded = sheet.classList.contains('expanded');
            
            if (deltaY > 0) {
                // Dragging down
                if (isExpanded) {
                    // Apply resistance when dragging down from expanded state
                    const resistance = 0.5;
                    sheet.style.transform = `translateY(${deltaY * resistance}px)`;
                }
            } else {
                // Dragging up
                if (!isExpanded) {
                    // When collapsed, allow full movement up
                    // Start from collapsed position and move toward 0
                    const collapsedHeight = 80;
                    const maxMove = window.innerHeight - collapsedHeight;
                    const move = Math.min(Math.abs(deltaY), maxMove);
                    sheet.style.transform = `translateY(calc(100% - ${collapsedHeight + move}px))`;
                }
            }
        };

        const endDrag = () => {
            if (!isDragging) return;
            
            const endTime = Date.now();
            const deltaY = currentY - startY;
            const duration = endTime - startTime;
            const velocity = Math.abs(deltaY) / duration; // pixels per ms
            
            console.log('🔴 Drag ended - deltaY:', deltaY, 'velocity:', velocity.toFixed(2));
            
            isDragging = false;
            
            sheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const isExpanded = sheet.classList.contains('expanded');
            
            // Lower threshold: 40px or fast swipe (velocity > 0.5)
            const isSwipeUp = deltaY < -40 || (deltaY < 0 && velocity > 0.5);
            const isSwipeDown = deltaY > 40 || (deltaY > 0 && velocity > 0.5);
            
            if (isSwipeUp && !isExpanded) {
                // Swipe up - expand
                console.log('✅ Expanding sheet');
                sheet.classList.add('expanded');
                sheet.style.transform = 'translateY(0)';
            } else if (isSwipeDown && isExpanded) {
                // Swipe down - collapse
                console.log('✅ Collapsing sheet');
                sheet.classList.remove('expanded');
                sheet.style.transform = 'translateY(calc(100% - 80px))';
            } else {
                // Return to current state
                console.log('↩️ Returning to current state');
                if (isExpanded) {
                    sheet.style.transform = 'translateY(0)';
                } else {
                    sheet.style.transform = 'translateY(calc(100% - 80px))';
                }
            }
        };

        // Make handle, tabs, and header swipeable for maximum touch area
        const swipeAreas = [handle, toolTabs, sheetHeader].filter(el => el);
        
        swipeAreas.forEach(area => {
            // Touch events - NOT passive so we can preventDefault
            area.addEventListener('touchstart', startDrag, { passive: false });
            area.addEventListener('touchmove', doDrag, { passive: false });
            area.addEventListener('touchend', endDrag, { passive: false });

            // Mouse events for testing on desktop
            area.addEventListener('mousedown', startDrag);
        });
        
        // Document-level listeners for when dragging continues outside the area
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);

        // Close button
        sheet.querySelector('.sheet-close')?.addEventListener('click', () => {
            sheet.classList.remove('expanded');
        });

        // Clicking tabs expands sheet if collapsed
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!sheet.classList.contains('expanded')) {
                    console.log('📌 Tab clicked - expanding sheet');
                    sheet.classList.add('expanded');
                    sheet.style.transform = 'translateY(0)';
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
                    alert('Concept Studio Help:\n\n' +
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
        console.log(`🔄 Switching to ${view} view`);
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        const hint = document.querySelector('.controls-hint');

        if (view === '2d') {
            // Show 2D canvas, hide 3D
            this.canvas2D.style.display = 'block';
            this.canvas3D.style.display = 'none';
            console.log('✅ Switched to 2D view');
            if (hint) {
                hint.style.display = 'none';
            }
        } else {
            console.log('📐 Switching to 3D view...');
            
            // CRITICAL: Ensure 3D canvas has proper size before showing
            const container = document.querySelector('.mobile-canvas-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                this.canvas3D.style.width = '100%';
                this.canvas3D.style.height = '100%';
                this.canvas3D.width = Math.floor(rect.width);
                this.canvas3D.height = Math.floor(rect.height);
                
                console.log('3D Canvas resized before display:', {
                    width: this.canvas3D.width,
                    height: this.canvas3D.height
                });
            }
            
            // Show 3D canvas, hide 2D
            this.canvas2D.style.display = 'none';
            this.canvas3D.style.display = 'block';
            
            console.log('Canvas visibility:', {
                canvas2D: this.canvas2D.style.display,
                canvas3D: this.canvas3D.style.display,
                canvas3DWidth: this.canvas3D.width,
                canvas3DHeight: this.canvas3D.height
            });
            
            // Update Three.js renderer size
            if (this.threejsGenerator && this.threejsGenerator.renderer) {
                const rect = container.getBoundingClientRect();
                this.threejsGenerator.renderer.setSize(Math.floor(rect.width), Math.floor(rect.height), false);
                
                if (this.threejsGenerator.camera) {
                    this.threejsGenerator.camera.aspect = rect.width / rect.height;
                    this.threejsGenerator.camera.updateProjectionMatrix();
                }
                
                console.log('✅ Renderer and camera updated');
            }
            
            // Update 3D model
            console.log('🔄 Calling update3DModel...');
            this.update3DModel();
            
            // Give Three.js a moment to render, then reset camera
            setTimeout(() => {
                console.log('📹 Setting up camera...');
                if (this.threejsGenerator && this.threejsGenerator.camera) {
                    console.log('Camera before:', this.threejsGenerator.camera.position);
                    
                    // Reset camera to a good default position
                    this.threejsGenerator.camera.position.set(30, 30, 30);
                    this.threejsGenerator.camera.lookAt(0, 0, 0);
                    
                    console.log('Camera after:', this.threejsGenerator.camera.position);
                    
                    if (this.threejsGenerator.controls) {
                        this.threejsGenerator.controls.target.set(0, 0, 0);
                        this.threejsGenerator.controls.update();
                        console.log('✅ Controls updated');
                    }
                    
                    // Force a render
                    if (this.threejsGenerator.renderer) {
                        this.threejsGenerator.renderer.render(
                            this.threejsGenerator.scene, 
                            this.threejsGenerator.camera
                        );
                        console.log('✅ Forced render complete');
                    }
                } else {
                    console.error('❌ Camera not found!');
                }
                
                console.log('✅ Switched to 3D view');
            }, 100);
            
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
        
        // Debug: Check if there's actually data to render
        console.log('🔄 Updating 3D model with data:', {
            floors: floorplanData.floors.length,
            walls: floorplanData.floors[0]?.walls.length || 0,
            doors: floorplanData.floors[0]?.doors.length || 0,
            windows: floorplanData.floors[0]?.windows.length || 0
        });
        
        this.threejsGenerator.generate3DFromFloorplan(floorplanData);
        
        console.log('✅ 3D model updated');
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

    /**
     * Setup observer to hide/show undo button when bottom sheet opens/closes
     */
    setupBottomSheetObserver() {
        // Find the bottom sheet element
        const bottomSheet = document.getElementById('mobile-tools-sheet');
        const undoBtn = document.querySelector('.quick-undo-btn');
        
        if (!bottomSheet) {
            console.warn('⚠️ Bottom sheet not found for undo button observer');
            return;
        }
        
        if (!undoBtn) {
            console.warn('⚠️ Undo button not found for visibility control');
            return;
        }
        
        console.log('✅ Setting up bottom sheet observer for undo button');
        
        // Use MutationObserver to watch for class changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isOpen = bottomSheet.classList.contains('expanded');
                    
                    console.log('Bottom sheet state changed:', isOpen ? 'OPEN' : 'CLOSED');
                    
                    if (isOpen) {
                        // Bottom sheet is open - hide undo button
                        undoBtn.style.opacity = '0';
                        undoBtn.style.pointerEvents = 'none';
                        undoBtn.style.transform = 'translateY(20px)';
                    } else {
                        // Bottom sheet is closed - show undo button
                        undoBtn.style.opacity = '1';
                        undoBtn.style.pointerEvents = 'auto';
                        undoBtn.style.transform = 'translateY(0)';
                    }
                }
            });
        });
        
        // Start observing the bottom sheet for class changes
        observer.observe(bottomSheet, { 
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Store observer so we can disconnect it later if needed
        this.bottomSheetObserver = observer;
    }

    /**
     * Setup canvas interaction for tap-to-edit functionality
     */
    setupCanvasInteraction() {
        if (!this.canvas2D) {
            console.warn('⚠️ 2D canvas not found for tap-to-edit setup');
            return;
        }

        console.log('✅ Setting up canvas tap-to-edit interaction');

        // Add click/touch event listeners
        this.canvas2D.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas2D.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.handleCanvasClick(touch);
        });

        // Initialize selection state
        this.selectedObject = null;
        this.showAllMode = false;
    }

    /**
     * Handle canvas clicks for direct object selection
     */
    handleCanvasClick(event) {
        const rect = this.canvas2D.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas2D.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas2D.height / rect.height);
        
        console.log('Canvas clicked at:', x, y);
        
        // Check if we clicked on an existing object
        const clickedObject = this.findObjectAtPoint(x, y);
        
        if (clickedObject) {
            // User tapped an object - select it!
            this.selectObject(clickedObject);
        } else {
            // Clicked empty space
            if (this.selectedObject) {
                // Deselect current object
                this.deselectObject();
            } else if (this.floorPlanEditor && this.floorPlanEditor.mode === 'draw') {
                // Continue drawing walls as normal - let the floor plan editor handle it
                console.log('Continuing draw mode - delegating to floor plan editor');
            }
        }
    }

    /**
     * Find which object (wall/door/window) was clicked
     */
    findObjectAtPoint(x, y) {
        if (!this.floorPlanEditor) return null;

        const tolerance = 10; // 10px click tolerance
        const floorplanData = this.floorPlanEditor.getFloorPlanData();
        
        if (!floorplanData || !floorplanData.floors) return null;
        
        // Check all floors
        for (let floorIndex = 0; floorIndex < floorplanData.floors.length; floorIndex++) {
            const floor = floorplanData.floors[floorIndex];
            
            // Check walls
            if (floor.walls) {
                for (let wallIndex = 0; wallIndex < floor.walls.length; wallIndex++) {
                    const wall = floor.walls[wallIndex];
                    if (this.isPointNearWall(x, y, wall, tolerance)) {
                        return {
                            type: 'wall',
                            floorIndex,
                            index: wallIndex,
                            data: wall
                        };
                    }
                }
            }
            
            // Check doors
            if (floor.doors) {
                for (let doorIndex = 0; doorIndex < floor.doors.length; doorIndex++) {
                    const door = floor.doors[doorIndex];
                    if (this.isPointNearDoor(x, y, door, tolerance)) {
                        return {
                            type: 'door',
                            floorIndex,
                            index: doorIndex,
                            data: door
                        };
                    }
                }
            }
            
            // Check windows
            if (floor.windows) {
                for (let windowIndex = 0; windowIndex < floor.windows.length; windowIndex++) {
                    const window = floor.windows[windowIndex];
                    if (this.isPointNearWindow(x, y, window, tolerance)) {
                        return {
                            type: 'window',
                            floorIndex,
                            index: windowIndex,
                            data: window
                        };
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Check if point is near a wall
     */
    isPointNearWall(x, y, wall, tolerance) {
        const x1 = wall.startX;
        const y1 = wall.startY;
        const x2 = wall.endX;
        const y2 = wall.endY;
        
        // Distance from point to line segment
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= tolerance;
    }

    /**
     * Check if point is near a door
     */
    isPointNearDoor(x, y, door, tolerance) {
        // Doors are positioned along walls, check if point is near the door position
        const doorWidth = 30; // Match your door rendering width
        const doorHeight = 10;
        
        // Simple bounding box check around door position
        const minX = door.position - doorWidth/2;
        const maxX = door.position + doorWidth/2;
        const minY = door.position - doorHeight/2;
        const maxY = door.position + doorHeight/2;
        
        return x >= minX - tolerance && x <= maxX + tolerance &&
               y >= minY - tolerance && y <= maxY + tolerance;
    }

    /**
     * Check if point is near a window
     */
    isPointNearWindow(x, y, window, tolerance) {
        // Windows are positioned along walls, check if point is near the window position
        const windowWidth = 20; // Match your window rendering width
        const windowHeight = 8;
        
        const minX = window.position - windowWidth/2;
        const maxX = window.position + windowWidth/2;
        const minY = window.position - windowHeight/2;
        const maxY = window.position + windowHeight/2;
        
        return x >= minX - tolerance && x <= maxX + tolerance &&
               y >= minY - tolerance && y <= maxY + tolerance;
    }

    /**
     * Select an object and show edit options
     */
    selectObject(object) {
        console.log('Selected:', object.type, object);
        
        // Store selected object
        this.selectedObject = object;
        
        // Show context menu in bottom sheet
        this.showEditBottomSheet(object);
        
        // Request redraw to show selection highlight
        if (this.floorPlanEditor) {
            this.floorPlanEditor.render();
            this.highlightSelectedObject();
        }
    }

    /**
     * Deselect current object
     */
    deselectObject() {
        console.log('Deselected');
        
        this.selectedObject = null;
        
        // Hide bottom sheet
        this.hideEditBottomSheet();
        
        // Redraw canvas without highlight
        if (this.floorPlanEditor) {
            this.floorPlanEditor.render();
        }
    }

    /**
     * Highlight the selected object on canvas
     */
    highlightSelectedObject() {
        if (!this.selectedObject || !this.floorPlanEditor) return;
        
        const canvas = this.canvas2D;
        const ctx = canvas.getContext('2d');
        const obj = this.selectedObject;
        
        ctx.save();
        
        // Draw highlight effect
        ctx.strokeStyle = '#667eea'; // Primary color
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#667eea';
        
        if (obj.type === 'wall') {
            const wall = obj.data;
            ctx.beginPath();
            ctx.moveTo(wall.startX, wall.startY);
            ctx.lineTo(wall.endX, wall.endY);
            ctx.stroke();
        } else if (obj.type === 'door') {
            const door = obj.data;
            // Draw highlight around door position
            ctx.strokeRect(door.position - 17, door.position - 7, 34, 14);
        } else if (obj.type === 'window') {
            const window = obj.data;
            // Draw highlight around window position
            ctx.strokeRect(window.position - 12, window.position - 6, 24, 12);
        }
        
        ctx.restore();
    }

    /**
     * Show bottom sheet with edit options for selected object
     */
    showEditBottomSheet(object) {
        const bottomSheet = document.getElementById('mobile-tools-sheet');
        
        if (!bottomSheet) {
            console.warn('⚠️ Bottom sheet not found for context menu');
            return;
        }
        
        // Create context menu HTML based on object type
        let menuHTML = `
            <div class="edit-context-menu">
                <h3 class="context-menu-title">Edit ${object.type.charAt(0).toUpperCase() + object.type.slice(1)}</h3>
                <div class="context-menu-actions">
        `;
        
        if (object.type === 'wall') {
            menuHTML += `
                <button class="context-btn" data-action="delete-wall">
                    <span>🗑️</span> Delete Wall
                </button>
                <button class="context-btn" data-action="split-wall">
                    <span>✂️</span> Split Wall
                </button>
            `;
        } else if (object.type === 'door') {
            menuHTML += `
                <button class="context-btn" data-action="delete-door">
                    <span>🗑️</span> Delete Door
                </button>
                <button class="context-btn" data-action="move-door">
                    <span>↔️</span> Move Door
                </button>
            `;
        } else if (object.type === 'window') {
            menuHTML += `
                <button class="context-btn" data-action="delete-window">
                    <span>🗑️</span> Delete Window
                </button>
                <button class="context-btn" data-action="move-window">
                    <span>↔️</span> Move Window
                </button>
            `;
        }
        
        menuHTML += `
                <button class="context-btn context-btn-cancel" data-action="cancel">
                    <span>✕</span> Cancel
                </button>
            </div>
        </div>
        `;
        
        // Replace bottom sheet content
        bottomSheet.innerHTML = menuHTML;
        bottomSheet.classList.add('expanded');
        
        // Setup action listeners
        this.setupContextMenuListeners();
    }

    /**
     * Hide the edit bottom sheet
     */
    hideEditBottomSheet() {
        const bottomSheet = document.getElementById('mobile-tools-sheet');
        
        if (!bottomSheet) return;
        
        bottomSheet.classList.remove('expanded');
        
        // TODO: Restore default bottom sheet content (tools)
        // For now, we'll let the user manually open the tools again
    }

    /**
     * Setup listeners for context menu buttons
     */
    setupContextMenuListeners() {
        const buttons = document.querySelectorAll('.context-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleContextAction(action);
            });
        });
    }

    /**
     * Handle context menu actions
     */
    handleContextAction(action) {
        if (!this.selectedObject) return;
        
        const obj = this.selectedObject;
        
        switch(action) {
            case 'delete-wall':
                this.deleteWall(obj.floorIndex, obj.index);
                break;
            case 'delete-door':
                this.deleteDoor(obj.floorIndex, obj.index);
                break;
            case 'delete-window':
                this.deleteWindow(obj.floorIndex, obj.index);
                break;
            case 'split-wall':
                this.splitWall(obj.floorIndex, obj.index);
                break;
            case 'move-door':
                this.startMovingDoor(obj);
                break;
            case 'move-window':
                this.startMovingWindow(obj);
                break;
            case 'cancel':
                this.deselectObject();
                break;
        }
        
        // Deselect after action
        if (action !== 'cancel') {
            this.deselectObject();
        }
    }

    /**
     * Delete methods
     */
    deleteWall(floorIndex, wallIndex) {
        if (this.floorPlanEditor) {
            const floorplanData = this.floorPlanEditor.getFloorPlanData();
            if (floorplanData && floorplanData.floors[floorIndex]) {
                floorplanData.floors[floorIndex].walls.splice(wallIndex, 1);
                this.floorPlanEditor.render();
                console.log('Wall deleted');
            }
        }
    }

    deleteDoor(floorIndex, doorIndex) {
        if (this.floorPlanEditor) {
            const floorplanData = this.floorPlanEditor.getFloorPlanData();
            if (floorplanData && floorplanData.floors[floorIndex]) {
                floorplanData.floors[floorIndex].doors.splice(doorIndex, 1);
                this.floorPlanEditor.render();
                console.log('Door deleted');
            }
        }
    }

    deleteWindow(floorIndex, windowIndex) {
        if (this.floorPlanEditor) {
            const floorplanData = this.floorPlanEditor.getFloorPlanData();
            if (floorplanData && floorplanData.floors[floorIndex]) {
                floorplanData.floors[floorIndex].windows.splice(windowIndex, 1);
                this.floorPlanEditor.render();
                console.log('Window deleted');
            }
        }
    }

    /**
     * Placeholder methods for future enhancements
     */
    splitWall(floorIndex, wallIndex) {
        console.log('Split wall functionality - to be implemented');
        // TODO: Implement wall splitting
    }

    startMovingDoor(object) {
        console.log('Move door functionality - to be implemented');
        // TODO: Implement door moving
    }

    startMovingWindow(object) {
        console.log('Move window functionality - to be implemented');
        // TODO: Implement window moving
    }

    /**
     * Toggle show-all mode to highlight all editable objects
     */
    toggleShowAllMode() {
        this.showAllMode = !this.showAllMode;
        
        if (this.showAllMode) {
            // Highlight all editable elements
            this.highlightAllObjects();
        } else {
            // Remove highlights
            if (this.floorPlanEditor) {
                this.floorPlanEditor.render();
                // Re-highlight selected object if any
                if (this.selectedObject) {
                    this.highlightSelectedObject();
                }
            }
        }
        
        console.log('Show all mode:', this.showAllMode ? 'ON' : 'OFF');
    }

    /**
     * Highlight all editable objects on the canvas
     */
    highlightAllObjects() {
        if (!this.floorPlanEditor) return;
        
        const canvas = this.canvas2D;
        const ctx = canvas.getContext('2d');
        const floorplanData = this.floorPlanEditor.getFloorPlanData();
        
        if (!floorplanData || !floorplanData.floors) return;
        
        // Draw semi-transparent highlights on all objects
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        
        floorplanData.floors.forEach(floor => {
            // Highlight walls
            if (floor.walls) {
                floor.walls.forEach(wall => {
                    ctx.beginPath();
                    ctx.moveTo(wall.startX, wall.startY);
                    ctx.lineTo(wall.endX, wall.endY);
                    ctx.stroke();
                });
            }
            
            // Highlight doors
            if (floor.doors) {
                floor.doors.forEach(door => {
                    ctx.strokeRect(door.position - 15, door.position - 5, 30, 10);
                });
            }
            
            // Highlight windows
            if (floor.windows) {
                floor.windows.forEach(window => {
                    ctx.strokeRect(window.position - 10, window.position - 4, 20, 8);
                });
            }
        });
        
        ctx.restore();
    }
}

// Initialize mobile app - SIMPLIFIED DETECTION
function initMobileApp() {
    console.log('🔍 Checking device...');
    console.log('Window width:', window.innerWidth);
    console.log('Is mobile layout visible?', window.getComputedStyle(document.querySelector('.mobile-layout')).display !== 'none');
    
    // Check if mobile layout is actually visible (CSS media query handles this)
    const mobileLayout = document.querySelector('.mobile-layout');
    const isMobileLayout = mobileLayout && window.getComputedStyle(mobileLayout).display !== 'none';
    
    if (isMobileLayout) {
        console.log('📱 Mobile layout detected, initializing mobile app...');
        const mobileApp = new MobileFloorPlanApp();
        window.mobileApp = mobileApp;
    } else {
        console.log('💻 Desktop layout detected, skipping mobile app initialization');
    }
}

// Wait for DOM and styles to fully load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileApp);
} else {
    // DOM already loaded
    setTimeout(initMobileApp, 100); // Small delay to ensure CSS is applied
}

