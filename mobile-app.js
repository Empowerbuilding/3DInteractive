// mobile-app.js
// Mobile-specific functionality for the Floor Plan Designer

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
        
        console.log('✅ Mobile app fully initialized');
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

        // ==================== MOBILE 3D MODEL UPSCALE BUTTON ====================
        document.getElementById('mobile-upscale-3d')?.addEventListener('click', async () => {
            const btn = document.getElementById('mobile-upscale-3d');
            const statusText = document.getElementById('mobile-upscale-status');
            
            // Disable button and show loading
            btn.disabled = true;
            btn.innerHTML = '⏳ Processing...';
            btn.style.opacity = '0.6';
            if (statusText) statusText.textContent = 'Capturing 3D model...';
            
            try {
                // Switch to 3D view if not already there
                if (this.currentView !== '3d') {
                    this.switchView('3d');
                    // Wait for view to fully switch and render
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
                
                // Get the 3D canvas
                const canvas = document.getElementById('mobile-canvas-3d');
                if (!canvas) {
                    throw new Error('3D canvas not found');
                }
                
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
                formData.append('screenshot', blob, `3d-model-mobile-${Date.now()}.png`);
                formData.append('timestamp', new Date().toISOString());
                formData.append('source', 'floor-plan-designer-mobile');
                formData.append('device', 'mobile');
                
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
                    
                    // Get settings from mobile UI
                    const roofStyle = document.getElementById('mobile-roof-style')?.value || 'hip';
                    const wallHeight = parseFloat(document.getElementById('mobile-wall-height')?.value || 8);
                    
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
                btn.innerHTML = '✅ Success!';
                btn.style.background = '#10b981';
                btn.style.opacity = '1';
                if (statusText) {
                    statusText.textContent = '✨ Image upscaled successfully!';
                    statusText.style.color = '#10b981';
                }
                
                // Show result if available
                if (result && (result.upscaledImageUrl || result.outputUrl || result.imageUrl)) {
                    const imageUrl = result.upscaledImageUrl || result.outputUrl || result.imageUrl;
                    
                    // Create mobile-optimized modal
                    const modal = document.createElement('div');
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.9);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                        animation: fadeIn 0.3s;
                    `;
                    modal.innerHTML = `
                        <div style="background: white; border-radius: 20px; padding: 20px; max-width: 100%; max-height: 90vh; overflow: auto; width: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Upscaled 3D Model</h3>
                                <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; padding: 4px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
                            </div>
                            <img src="${imageUrl}" style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); margin-bottom: 16px;" alt="Upscaled 3D Model" />
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <a href="${imageUrl}" download="upscaled-3d-model.png" style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">📥 Download Image</a>
                                <button onclick="this.closest('div').parentElement.remove()" style="padding: 16px; background: #6b7280; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 16px;">Close</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    
                    // Add tap to close
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.remove();
                        }
                    });
                }
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = '📸 Upscale 3D Model';
                    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    btn.style.opacity = '1';
                    if (statusText) {
                        statusText.textContent = '';
                        statusText.style.color = '';
                    }
                }, 3000);
                
            } catch (error) {
                console.error('❌ Upscale error:', error);
                
                // Error state
                btn.innerHTML = '❌ Failed - Tap to Retry';
                btn.style.background = '#ef4444';
                btn.style.opacity = '1';
                if (statusText) {
                    statusText.textContent = `Error: ${error.message}`;
                    statusText.style.color = '#ef4444';
                }
                
                // Reset button after 4 seconds
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = '📸 Upscale 3D Model';
                    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    btn.style.opacity = '1';
                    if (statusText) {
                        statusText.textContent = '';
                        statusText.style.color = '';
                    }
                }, 4000);
            }
        });

        // Hamburger Menu
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            this.openSideMenu();
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

