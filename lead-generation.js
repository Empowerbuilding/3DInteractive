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
                closeLeadModal();
            }
        });
    }
});

function openLeadModal() {
    const modal = document.getElementById('leadModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLeadModal() {
    const modal = document.getElementById('leadModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        // Clear form
        document.getElementById('leadNameInput').value = '';
        document.getElementById('leadEmailInput').value = '';
        document.getElementById('leadPhoneInput').value = '';
        // Clear errors
        document.querySelectorAll('.lead-form-input').forEach(input => {
            input.classList.remove('error');
        });
        document.querySelectorAll('.lead-error-message').forEach(msg => {
            msg.classList.remove('visible');
        });
    }
}

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

async function handleLeadSubmit() {
    if (!validateLeadForm()) {
        return;
    }

    const submitBtn = document.getElementById('leadSubmitBtn');
    const statusText = document.getElementById('upscale-status') || document.getElementById('mobile-upscale-status');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 Processing...';
    
    if (statusText) {
        statusText.textContent = 'Capturing 3D model...';
        statusText.style.color = '#667eea';
    }

    const leadData = {
        name: document.getElementById('leadNameInput').value.trim(),
        email: document.getElementById('leadEmailInput').value.trim(),
        phone: document.getElementById('leadPhoneInput').value.trim(),
        timestamp: new Date().toISOString()
    };

    console.log('✅ Lead captured:', leadData);

    try {
        // Close modal first
        closeLeadModal();
        
        // Trigger the actual upscale with lead data
        await triggerUpscaleWithLead(leadData, statusText);
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ There was an error processing your request. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Generate My Design';
    }
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

    console.log('📸 Capturing canvas:', {
        width: canvas.width,
        height: canvas.height,
        displayWidth: canvas.clientWidth,
        displayHeight: canvas.clientHeight
    });

    if (statusText) {
        statusText.textContent = 'Preparing image...';
    }

    // Convert canvas to blob
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to capture image'));
        }, 'image/png', 1.0);
    });

    if (statusText) {
        statusText.textContent = 'Sending to AI for enhancement...';
    }

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

    // Send to n8n webhook
    const response = await fetch('https://n8n.empowerbuilding.ai/webhook/4239cad4-0815-4c94-a526-f4335b175aed', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    // Parse response
    let result = null;
    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);

    if (responseText && responseText.trim()) {
        try {
            result = JSON.parse(responseText);
            console.log('✅ Upload result:', result);
        } catch (parseError) {
            console.warn('⚠️ Response is not JSON:', responseText);
            result = { message: 'Success', rawResponse: responseText };
        }
    } else {
        console.log('✅ Webhook accepted request');
        result = { message: 'Request submitted successfully' };
    }

    // Success state
    if (statusText) {
        statusText.textContent = '✨ Request submitted successfully!';
        statusText.style.color = '#10b981';
    }

    // Show email notification popup
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

    // Reset status after delay
    setTimeout(() => {
        if (statusText) {
            statusText.textContent = '';
            statusText.style.color = '';
        }
    }, 5000);
}

