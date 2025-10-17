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
    console.log('🔔 showEmailNotification called');
    const isMobileView = window.innerWidth < 1025;
    console.log('📱 Mobile view detected:', isMobileView);
    
    const notificationModal = document.createElement('div');
    notificationModal.id = 'emailNotificationModal';
    
    // CRITICAL: High z-index to appear above mobile layout (99999) and lead modal (999999)
    notificationModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,${isMobileView ? '0.9' : '0.8'});
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        padding: ${isMobileView ? '24px' : '20px'};
        animation: fadeIn 0.3s;
    `;
    
    notificationModal.innerHTML = `
        <div style="background: white; border-radius: ${isMobileView ? '20px' : '16px'}; padding: ${isMobileView ? '32px 24px' : '32px'}; max-width: ${isMobileView ? '95%' : '500px'}; width: ${isMobileView ? '95%' : 'auto'}; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000001; position: relative;">
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
            <button onclick="this.closest('div').parentElement.remove()" style="width: 100%; padding: ${isMobileView ? '16px' : '14px'}; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 16px; min-height: ${isMobileView ? '52px' : '48px'}; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                Got it!
            </button>
        </div>
    `;
    
    document.body.appendChild(notificationModal);
    console.log('✅ Email notification modal appended to body');
    console.log('📊 Modal computed z-index:', window.getComputedStyle(notificationModal).zIndex);
    console.log('📊 Modal computed display:', window.getComputedStyle(notificationModal).display);

    // Click/tap outside to close
    notificationModal.addEventListener('click', (e) => {
        if (e.target === notificationModal) {
            console.log('👆 Notification closed by clicking outside');
            notificationModal.remove();
        }
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notificationModal)) {
            console.log('⏰ Auto-closing notification after 10 seconds');
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
        console.log('🔴 Closing lead modal...');
        window.closeLeadModal();
        
        // Wait 400ms for lead modal to fully close (animation is 300ms)
        console.log('⏳ Waiting 400ms for modal close animation...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // SHOW SUCCESS NOTIFICATION AFTER MODAL CLOSES (prevents z-index conflicts)
        console.log('📧 Showing email notification...');
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

/**
 * Capture multiple camera angles of the 3D building model from consistent ground-level positions
 * @param {Object} threejsGenerator - The Three.js generator instance
 * @param {Object} statusText - Status text element for user feedback
 * @returns {Array} Array of {name, blob} objects for each angle captured
 */
async function captureMultipleAngles(threejsGenerator, statusText) {
    console.log('📸 Starting multi-angle capture with consistent ground-level angles...');
    
    // Store original camera position and target
    const originalCameraPosition = threejsGenerator.camera.position.clone();
    const originalTarget = threejsGenerator.controls.target.clone();
    
    // Calculate building dimensions and center
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let maxY = -Infinity;
    let buildingObjectCount = 0;
    
    // Loop through scene to find building objects
    threejsGenerator.scene.children.forEach(child => {
        if (child.userData.isBuilding && child.geometry) {
            buildingObjectCount++;
            
            // Compute bounding box if not already computed
            if (!child.geometry.boundingBox) {
                child.geometry.computeBoundingBox();
            }
            
            if (child.geometry.boundingBox) {
                const bbox = child.geometry.boundingBox;
                const pos = child.position;
                
                minX = Math.min(minX, pos.x + bbox.min.x);
                maxX = Math.max(maxX, pos.x + bbox.max.x);
                minZ = Math.min(minZ, pos.z + bbox.min.z);
                maxZ = Math.max(maxZ, pos.z + bbox.max.z);
                maxY = Math.max(maxY, pos.y + bbox.max.y);
            }
        }
    });
    
    // Check if we found any building objects
    if (buildingObjectCount === 0 || minX === Infinity) {
        throw new Error('No building objects found in scene for camera angle calculation');
    }
    
    // Calculate building center and dimensions
    const buildingCenterX = (minX + maxX) / 2;
    const buildingCenterZ = (minZ + maxZ) / 2;
    const buildingWidth = maxX - minX;
    const buildingDepth = maxZ - minZ;
    const buildingHeight = maxY;
    
    console.log('🏢 Building dimensions calculated:', {
        center: { x: buildingCenterX, z: buildingCenterZ },
        size: { width: buildingWidth.toFixed(2), depth: buildingDepth.toFixed(2), height: buildingHeight.toFixed(2) },
        objects: buildingObjectCount
    });
    
    // Calculate consistent camera settings
    // Adjust distance for mobile to ensure ground visibility (mobile screens are typically narrower)
    const isMobile = window.innerWidth < 1025;
    const distanceMultiplier = isMobile ? 2.2 : 1.5; // Mobile needs more distance to show ground
    const cameraDistance = Math.max(buildingWidth, buildingDepth) * distanceMultiplier;
    const eyeLevelHeight = buildingHeight * 0.3; // ADJUSTABLE: Lower = more ground-level
    const lookAtHeight = buildingHeight * 0.4; // ADJUSTABLE: Where camera aims vertically
    
    console.log('📐 Camera settings calculated:', {
        device: isMobile ? 'mobile' : 'desktop',
        distanceMultiplier: distanceMultiplier,
        distance: cameraDistance.toFixed(2),
        eyeLevel: eyeLevelHeight.toFixed(2),
        lookAt: lookAtHeight.toFixed(2)
    });
    
    // Define 3 camera positions using polar coordinates
    const cameraAngles = [
        {
            name: 'front-angle',
            angle: Math.PI / 4, // 45 degrees
            x: buildingCenterX + cameraDistance * Math.cos(Math.PI / 4),
            y: eyeLevelHeight,
            z: buildingCenterZ + cameraDistance * Math.sin(Math.PI / 4)
        },
        {
            name: 'side-view',
            angle: Math.PI / 2, // 90 degrees to the left
            x: buildingCenterX - cameraDistance,
            y: eyeLevelHeight,
            z: buildingCenterZ
        },
        {
            name: 'corner-view',
            angle: 5 * Math.PI / 4, // 225 degrees (opposite of front)
            x: buildingCenterX + cameraDistance * Math.cos(5 * Math.PI / 4),
            y: eyeLevelHeight,
            z: buildingCenterZ + cameraDistance * Math.sin(5 * Math.PI / 4)
        }
    ];
    
    const capturedAngles = [];
    let successfulCaptures = 0;
    
    // Update status for user feedback
    if (statusText) {
        statusText.textContent = '📸 Capturing 3 ground-level angles...';
    }
    
    // Loop through each camera angle
    for (let i = 0; i < cameraAngles.length; i++) {
        const angle = cameraAngles[i];
        
        try {
            console.log(`📸 Capturing angle ${i + 1}/3: ${angle.name} at position (${angle.x.toFixed(2)}, ${angle.y.toFixed(2)}, ${angle.z.toFixed(2)})`);
            
            // Set camera position
            threejsGenerator.camera.position.set(angle.x, angle.y, angle.z);
            
            // Look at the building center at calculated height
            threejsGenerator.camera.lookAt(buildingCenterX, lookAtHeight, buildingCenterZ);
            
            // Update controls to match
            threejsGenerator.controls.target.set(buildingCenterX, lookAtHeight, buildingCenterZ);
            threejsGenerator.controls.update();
            
            // Force a render with new camera position
            threejsGenerator.renderer.render(threejsGenerator.scene, threejsGenerator.camera);
            
            // Wait for render completion (200ms minimum for stability)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Capture enhanced screenshot with architectural details for AI generation
            let blob;
            if (threejsGenerator.captureEnhancedScreenshotForAI) {
                const dataURL = await threejsGenerator.captureEnhancedScreenshotForAI(threejsGenerator.camera, angle.name);
                blob = await new Promise((resolve, reject) => {
                    try {
                        // Convert data URL to blob
                        const byteString = atob(dataURL.split(',')[1]);
                        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let j = 0; j < byteString.length; j++) {
                            ia[j] = byteString.charCodeAt(j);
                        }
                        const blob = new Blob([ab], { type: mimeString });
                        resolve(blob);
                    } catch (error) {
                        reject(error);
                    }
                });
            } else if (threejsGenerator.captureCleanScreenshot) {
                // Fallback to clean screenshot
                const dataURL = threejsGenerator.captureCleanScreenshot();
                blob = await new Promise((resolve, reject) => {
                    try {
                        // Convert data URL to blob
                        const byteString = atob(dataURL.split(',')[1]);
                        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let j = 0; j < byteString.length; j++) {
                            ia[j] = byteString.charCodeAt(j);
                        }
                        const blob = new Blob([ab], { type: mimeString });
                        resolve(blob);
                    } catch (error) {
                        reject(error);
                    }
                });
            } else {
                // Final fallback to canvas capture
                blob = await new Promise((resolve, reject) => {
                    const canvas = threejsGenerator.renderer.domElement;
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Failed to capture image'));
                    }, 'image/png', 1.0);
                });
            }
            
            // Store the captured angle
            capturedAngles.push({
                name: angle.name,
                blob: blob
            });
            
            successfulCaptures++;
            console.log(`✅ Successfully captured angle ${i + 1}/3: ${angle.name}`);
            
        } catch (error) {
            console.error(`❌ Failed to capture angle ${i + 1}/3 (${angle.name}):`, error);
            // Continue with next angle instead of failing completely
        }
    }
    
    // Restore original camera position
    threejsGenerator.camera.position.copy(originalCameraPosition);
    threejsGenerator.controls.target.copy(originalTarget);
    threejsGenerator.controls.update();
    threejsGenerator.renderer.render(threejsGenerator.scene, threejsGenerator.camera);
    
    console.log(`✅ Multi-angle capture complete: ${successfulCaptures}/${cameraAngles.length} ground-level angles captured successfully`);
    
    return capturedAngles;
}

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
        console.log(`📸 Setting optimal camera angle for screenshot (${isMobile ? 'mobile' : 'desktop'})...`);
        
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
        
        // Calculate optimal distance - Balanced for good framing
        // Distance formula: size / (2 * tan(fov/2)) with moderate padding
        const fovRadians = (threejsGenerator.camera.fov * Math.PI) / 180;
        const distanceMultiplier = isMobile ? 2.2 : 1.5; // Mobile needs more distance to show ground
        const optimalDistance = (buildingSize * distanceMultiplier) / (2 * Math.tan(fovRadians / 2));
        
        // Position camera in front of building at eye level, looking UP at it
        // Place camera to the front-right for a nice 3/4 view angle
        const cameraX = buildingCenterX + buildingSize * 0.65;  // Balanced side offset
        const cameraY = eyeLevel;  // 6 feet off ground
        const cameraZ = buildingCenterZ + optimalDistance;  // In front of building
        
        // Calculate the point to look at (slightly above center for balanced view)
        const lookAtY = buildingHeight * 0.38;  // Look at middle area for good composition
        
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

    // Capture multiple camera angles instead of single screenshot
    const capturedAngles = await captureMultipleAngles(threejsGenerator, statusText);
    
    if (capturedAngles.length === 0) {
        throw new Error('Failed to capture any camera angles');
    }

    console.log(`📸 Successfully captured ${capturedAngles.length} angles for AI processing`);

    // Create FormData with lead info and multiple screenshots
    const formData = new FormData();
    
    // Add each captured angle as a separate screenshot
    capturedAngles.forEach((angle, index) => {
        const filename = `3d-model-${leadData.name.replace(/\s+/g, '-')}-${angle.name}-${Date.now()}.png`;
        formData.append(`screenshot_${index}`, angle.blob, filename);
        console.log(`📎 Added ${angle.name} as screenshot_${index}`);
    });
    
    // Add metadata about number of angles
    formData.append('numAngles', capturedAngles.length.toString());
    formData.append('leadName', leadData.name);
    formData.append('leadEmail', leadData.email);
    formData.append('leadPhone', leadData.phone);
    formData.append('timestamp', leadData.timestamp);
    formData.append('source', 'floor-plan-designer');
    formData.append('device', isMobile ? 'mobile' : 'desktop');

    // Calculate comprehensive areas
    let areaData = null;
    if (window.exportAreaDataForWorkflow) {
        areaData = window.exportAreaDataForWorkflow();
        console.log('📐 Area data calculated for n8n:', areaData);
    }

    // Add area data to FormData
    if (areaData) {
        formData.append('areaData', JSON.stringify(areaData));
    }

    // Get design data
    console.log('🔍 Attempting to get design data...');
    
    let designData = null;
    let usingRealData = false;
    
    // Try to get real data from floor plan editor
    try {
        // Try desktop app first
        if (window.floorPlanApp?.floorPlanEditor?.exportFloorplanData) {
            designData = window.floorPlanApp.floorPlanEditor.exportFloorplanData();
            usingRealData = true;
            console.log('✅ Got real design data from desktop floorPlanApp');
        }
        // Try mobile app
        else if (window.mobileApp?.floorPlanEditor?.exportFloorplanData) {
            designData = window.mobileApp.floorPlanEditor.exportFloorplanData();
            usingRealData = true;
            console.log('✅ Got real design data from mobile mobileApp');
        }
        // Try alternative method
        else if (window.floorPlanApp?.floorPlanEditor?.getFloorPlanData) {
            const floorPlanData = window.floorPlanApp.floorPlanEditor.getFloorPlanData();
            if (floorPlanData && floorPlanData.floors) {
                // Calculate building dimensions
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                floorPlanData.floors.forEach(floor => {
                    if (floor.walls) {
                        floor.walls.forEach(wall => {
                            minX = Math.min(minX, wall.startX, wall.endX);
                            minY = Math.min(minY, wall.startY, wall.endY);
                            maxX = Math.max(maxX, wall.startX, wall.endX);
                            maxY = Math.max(maxY, wall.startY, wall.endY);
                        });
                    }
                });
                
                const gridSize = floorPlanData.gridSize || 10;
                const widthFeet = Math.round((maxX - minX) / gridSize);
                const depthFeet = Math.round((maxY - minY) / gridSize);
                const totalWindows = floorPlanData.floors.reduce((sum, f) => sum + (f.windows?.length || 0), 0);
                const totalDoors = floorPlanData.floors.reduce((sum, f) => sum + (f.doors?.length || 0), 0);
                
                designData = {
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
                usingRealData = true;
                console.log('✅ Got real design data from getFloorPlanData method');
            }
        }
    } catch (error) {
        console.warn('⚠️ Error getting real design data:', error);
    }
    
    // Fallback to dummy data if not available
    if (!designData || !designData.structure) {
        console.warn('⚠️ Could not get real design data, using dummy data for testing');
        designData = {
            structure: {
                stories: 1,
                width: 40,
                depth: 30,
                roofStyle: 'hip',
                wallHeight: 8
            },
            materials: {
                exterior: 'vinyl siding',
                roof: 'asphalt shingles'
            },
            features: {
                frontPorch: 'none',
                garage: 'none',
                windows: 'standard',
                backPorch: 'none',
                chimney: false
            }
        };
        usingRealData = false;
    }
    
    console.log('✅ Design data to send:', designData);
    console.log('📊 Using real data:', usingRealData);
    
    // Add to FormData (CRITICAL: must stringify)
    formData.append('designData', JSON.stringify(designData));
    console.log('✅ designData appended to FormData');

    // Update status to show generation is starting
    if (statusText) {
        statusText.textContent = `🚀 Generating ${capturedAngles.length} photorealistic images...`;
    }

    // Send to n8n webhook (fire and forget - no await)
    fetch('https://n8n.empowerbuilding.ai/webhook/4239cad4-0815-4c94-a526-f4335b175aed', {
        method: 'POST',
        body: formData
    }).then(response => {
        console.log('✅ Webhook request sent successfully with', capturedAngles.length, 'angles');
    }).catch(error => {
        console.error('⚠️ Webhook error (not critical):', error);
    });
}

