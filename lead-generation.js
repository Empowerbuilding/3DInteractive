// lead-generation.js
// Lead Generation Modal Handler

// Auto-format phone number as user types
document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('leadPhoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 3) {
                e.target.value = value;
            } else if (value.length <= 6) {
                e.target.value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                e.target.value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        });
    }

    // Clear errors on input
    ['leadNameInput', 'leadEmailInput', 'leadPhoneInput'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                document.getElementById(id.replace('Input', 'Error')).classList.remove('visible');
            });
        }
    });

    // Close modal when clicking outside
    const modal = document.getElementById('leadModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                window.closeLeadModal();
            }
        });
    }
});

// Expose functions to window object for ES6 module access
window.openLeadModal = function openLeadModal() {
    console.log('🎯 openLeadModal called');
    const modal = document.getElementById('leadModal');
    
    if (!modal) {
        console.error('❌ Modal element #leadModal not found');
        alert('Error: Modal not found. Please refresh the page.');
        return;
    }
    
    console.log('📋 Modal found, opening...');
    
    // CRITICAL: Force visibility with inline styles
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.zIndex = '999999';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    
    // Add active class for animation
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    console.log('✅ Modal opened successfully');
    console.log('Modal computed display:', window.getComputedStyle(modal).display);
    console.log('Modal computed z-index:', window.getComputedStyle(modal).zIndex);
};

window.closeLeadModal = function closeLeadModal() {
    console.log('🔴 closeLeadModal called');
    const modal = document.getElementById('leadModal');
    
    if (!modal) {
        console.error('❌ Modal element not found');
        return;
    }
    
    // Remove active class for animation
    modal.classList.remove('active');
    
    // Wait for animation, then hide
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    
    // Clear form
    const nameInput = document.getElementById('leadNameInput');
    const emailInput = document.getElementById('leadEmailInput');
    const phoneInput = document.getElementById('leadPhoneInput');
    
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
    
    // Clear errors
    document.querySelectorAll('.lead-form-input').forEach(input => {
        input.classList.remove('error');
    });
    document.querySelectorAll('.lead-error-message').forEach(msg => {
        msg.classList.remove('visible');
    });
    
    console.log('✅ Modal closed successfully');
};

function validateLeadForm() {
    let isValid = true;

    // Validate name
    const name = document.getElementById('leadNameInput').value.trim();
    if (!name) {
        document.getElementById('leadNameInput').classList.add('error');
        document.getElementById('leadNameError').classList.add('visible');
        isValid = false;
    }

    // Validate email
    const email = document.getElementById('leadEmailInput').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('leadEmailInput').classList.add('error');
        document.getElementById('leadEmailError').classList.add('visible');
        isValid = false;
    }

    // Validate phone
    const phone = document.getElementById('leadPhoneInput').value.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone || phoneDigits.length < 10) {
        document.getElementById('leadPhoneInput').classList.add('error');
        document.getElementById('leadPhoneError').classList.add('visible');
        isValid = false;
    }

    return isValid;
}

// NEW: Separate function to show notification immediately
function showEmailNotification() {
    const isMobileView = window.innerWidth < 1025;
    const notificationModal = document.createElement('div');
    notificationModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,${isMobileView ? '0.9' : '0.8'});
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: fadeIn 0.3s;
    `;
    notificationModal.innerHTML = `
        <div style="background: white; border-radius: ${isMobileView ? '20px' : '16px'}; padding: ${isMobileView ? '28px' : '32px'}; max-width: ${isMobileView ? '100%' : '500px'}; ${isMobileView ? 'width: 100%;' : ''} text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="font-size: ${isMobileView ? '72px' : '64px'}; margin-bottom: 16px;">📧</div>
            <h2 style="margin: 0 0 16px 0; font-size: ${isMobileView ? '22px' : '24px'}; font-weight: 700; color: #1f2937;">Check Your Email!</h2>
            <p style="margin: 0 0 ${isMobileView ? '20px' : '24px'} 0; font-size: ${isMobileView ? '15px' : '16px'}; color: #6b7280; line-height: 1.6;">
                Your AI-enhanced photorealistic images will appear in your email inbox within <strong style="color: #667eea;">5 minutes or less</strong>.
            </p>
            <div style="background: #f0f4ff; padding: 16px; border-radius: 12px; margin-bottom: ${isMobileView ? '20px' : '24px'};">
                <p style="margin: 0; font-size: 14px; color: #667eea; font-weight: ${isMobileView ? '600' : '500'};">
                    ⏱️ Processing your 3D model with AI...
                </p>
            </div>
            <button onclick="this.closest('div').parentElement.remove()" style="width: 100%; padding: ${isMobileView ? '16px' : '14px'}; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 16px; ${isMobileView ? 'min-height: 48px;' : ''} transition: transform 0.2s;">
                Got it!
            </button>
        </div>
    `;
    document.body.appendChild(notificationModal);

    // Click/tap outside to close
    notificationModal.addEventListener('click', (e) => {
        if (e.target === notificationModal) {
            notificationModal.remove();
        }
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notificationModal)) {
            notificationModal.remove();
        }
    }, 10000);
}

// Expose to window object for onclick handler in HTML
window.handleLeadSubmit = async function handleLeadSubmit() {
    if (!validateLeadForm()) {
        return;
    }

    const submitBtn = document.getElementById('leadSubmitBtn');
    const statusText = document.getElementById('upscale-status') || document.getElementById('mobile-upscale-status');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 Processing...';

    const leadData = {
        name: document.getElementById('leadNameInput').value.trim(),
        email: document.getElementById('leadEmailInput').value.trim(),
        phone: document.getElementById('leadPhoneInput').value.trim(),
        timestamp: new Date().toISOString()
    };

    console.log('✅ Lead captured:', leadData);

    try {
        // Close modal first
        window.closeLeadModal();
        
        // SHOW SUCCESS NOTIFICATION IMMEDIATELY (before webhook)
        showEmailNotification();
        
        // Trigger the actual upscale with lead data (async in background)
        triggerUpscaleWithLead(leadData, statusText).catch(error => {
            console.error('❌ Background processing error:', error);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ There was an error processing your request. Please try again.');
    }
};

async function triggerUpscaleWithLead(leadData, statusText) {
    // Determine if we're on mobile or desktop
    const isMobile = window.innerWidth < 1025;
    
    // Get the correct 3D canvas
    let canvas = document.getElementById('three-canvas');
    if (isMobile || !canvas || canvas.offsetParent === null) {
        canvas = document.getElementById('mobile-canvas-3d');
        
        // If on mobile, switch to 3D view first
        if (isMobile && window.mobileApp) {
            window.mobileApp.switchView('3d');
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    if (!canvas) {
        throw new Error('Unable to find 3D canvas');
    }

    // Set ideal camera position BEFORE capturing screenshot
    const threejsGenerator = window.floorPlanApp?.threejsGenerator || window.mobileApp?.threejsGenerator;

    if (threejsGenerator && threejsGenerator.camera && threejsGenerator.controls) {
        console.log('📸 Setting optimal camera angle for screenshot...');
        
        // Calculate building center and dimensions from the scene
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        let maxY = -Infinity;
        
        threejsGenerator.scene.children.forEach(child => {
            if (child.userData.isBuilding && child.geometry) {
                // Calculate bounds from geometry and position
                const pos = child.position;
                const geometry = child.geometry;
                
                // If geometry has boundingBox, use it
                if (!geometry.boundingBox) {
                    geometry.computeBoundingBox();
                }
                
                if (geometry.boundingBox) {
                    const bbox = geometry.boundingBox;
                    minX = Math.min(minX, pos.x + bbox.min.x);
                    maxX = Math.max(maxX, pos.x + bbox.max.x);
                    minZ = Math.min(minZ, pos.z + bbox.min.z);
                    maxZ = Math.max(maxZ, pos.z + bbox.max.z);
                    maxY = Math.max(maxY, pos.y + bbox.max.y);
                }
            }
        });
        
        // Calculate building center
        const buildingCenterX = (minX + maxX) / 2;
        const buildingCenterZ = (minZ + maxZ) / 2;
        const buildingWidth = maxX - minX;
        const buildingDepth = maxZ - minZ;
        const buildingSize = Math.max(buildingWidth, buildingDepth);
        const buildingHeight = maxY;
        
        // Human eye level height (6 feet = ~1.8 meters)
        const eyeLevel = 1.8;
        
        // Calculate optimal distance - far enough to see whole building but close enough to fill frame
        // Distance formula: size / (2 * tan(fov/2)) with some padding
        const fovRadians = (threejsGenerator.camera.fov * Math.PI) / 180;
        const optimalDistance = (buildingSize * 1.2) / (2 * Math.tan(fovRadians / 2));
        
        // Position camera in front of building at eye level, looking UP at it
        // Place camera to the front-right for a nice 3/4 view angle
        const cameraX = buildingCenterX + buildingSize * 0.6;  // Offset to the side
        const cameraY = eyeLevel;  // 6 feet off ground
        const cameraZ = buildingCenterZ + optimalDistance;  // In front of building
        
        // Calculate the point to look at (slightly above center to avoid seeing roof)
        const lookAtY = buildingHeight * 0.4;  // Look at middle-upper part of building
        
        threejsGenerator.camera.position.set(cameraX, cameraY, cameraZ);
        threejsGenerator.camera.lookAt(buildingCenterX, lookAtY, buildingCenterZ);
        
        // Update controls to match
        threejsGenerator.controls.target.set(buildingCenterX, lookAtY, buildingCenterZ);
        threejsGenerator.controls.update();
        
        // Force a render with new camera position
        threejsGenerator.renderer.render(threejsGenerator.scene, threejsGenerator.camera);
        
        console.log('✅ Camera positioned at eye level:', {
            position: { x: cameraX, y: cameraY, z: cameraZ },
            lookingAt: { x: buildingCenterX, y: lookAtY, z: buildingCenterZ },
            buildingSize: { width: buildingWidth, depth: buildingDepth, height: buildingHeight }
        });
        
        // Small delay to ensure render completes
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('📸 Capturing optimized view...');

    // Convert canvas to blob
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to capture image'));
        }, 'image/png', 1.0);
    });

    // Create FormData with lead info and screenshot
    const formData = new FormData();
    formData.append('screenshot', blob, `3d-model-${leadData.name.replace(/\s+/g, '-')}-${Date.now()}.png`);
    formData.append('leadName', leadData.name);
    formData.append('leadEmail', leadData.email);
    formData.append('leadPhone', leadData.phone);
    formData.append('timestamp', leadData.timestamp);
    formData.append('source', 'floor-plan-designer');
    formData.append('device', isMobile ? 'mobile' : 'desktop');

    // Add design data if available
    const floorPlanApp = window.floorPlanApp || window.mobileApp?.floorPlanEditor;
    if (floorPlanApp) {
        const editor = floorPlanApp.floorPlanEditor || floorPlanApp;
        if (editor && editor.getFloorPlanData) {
            const floorPlanData = editor.getFloorPlanData();
            
            // Calculate building dimensions
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            floorPlanData.floors.forEach(floor => {
                floor.walls.forEach(wall => {
                    minX = Math.min(minX, wall.startX, wall.endX);
                    minY = Math.min(minY, wall.startY, wall.endY);
                    maxX = Math.max(maxX, wall.startX, wall.endX);
                    maxY = Math.max(maxY, wall.endY, wall.endY);
                });
            });
            
            const gridSize = floorPlanData.gridSize || 10;
            const widthFeet = Math.round((maxX - minX) / gridSize);
            const depthFeet = Math.round((maxY - minY) / gridSize);
            const totalWindows = floorPlanData.floors.reduce((sum, f) => sum + f.windows.length, 0);
            const totalDoors = floorPlanData.floors.reduce((sum, f) => sum + f.doors.length, 0);
            
            const designData = {
                structure: {
                    stories: floorPlanData.floors.length,
                    width: widthFeet,
                    depth: depthFeet,
                    roofStyle: floorPlanData.floors[0]?.roofStyle || 'hip',
                    wallHeight: floorPlanData.floors[0]?.wallHeight || 8
                },
                materials: {
                    exterior: 'vinyl siding',
                    roof: 'asphalt shingles'
                },
                features: {
                    windows: totalWindows > 0 ? 'multiple' : 'standard',
                    garage: 'none',
                    frontPorch: totalDoors > 0 ? 'covered' : 'none',
                    backPorch: 'none',
                    chimney: false
                },
                floorPlan: floorPlanData
            };
            
            formData.append('designData', JSON.stringify(designData));
        }
    }

    // Send to n8n webhook (fire and forget - no await)
    fetch('https://n8n.empowerbuilding.ai/webhook/4239cad4-0815-4c94-a526-f4335b175aed', {
        method: 'POST',
        body: formData
    }).then(response => {
        console.log('✅ Webhook request sent successfully');
    }).catch(error => {
        console.error('⚠️ Webhook error (not critical):', error);
    });
}

