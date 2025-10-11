// 2D Floor Plan Drawing Editor - Drag-to-Draw Walls
// Click and drag to draw individual wall segments

export class FloorPlanEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Multi-floor support
        this.floors = [
            {
                id: 1,
                name: 'Floor 1',
                walls: [],
                doors: [],
                windows: [],
                patios: []
            }
        ];
        this.currentFloor = 0; // Index of current floor being edited
        
        // Drawing state
        this.currentWall = null; // Wall being drawn
        this.isDrawing = false;
        this.mode = 'draw'; // Current mode: draw, edit, door, window, patio
        this.selectedWallIndex = null;
        this.shiftKeyPressed = false;
        
        // Patio drawing state
        this.currentPatio = null; // Patio being drawn
        this.isDrawingPatio = false;
        this.selectedPatio = null; // Index of selected patio
        this.isDraggingPatio = false;
        this.draggedPatioCorner = null; // Which corner: 'nw', 'ne', 'sw', 'se', or null for whole patio
        
        // Dragging state
        this.isDraggingWall = false;
        this.isDraggingEndpoint = false;
        this.draggedWallIndex = null;
        this.draggedEndpointType = null; // 'start' or 'end'
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Door/Window settings
        this.doorStyle = 'swing'; // Options: 'swing', 'pocket', 'bifold', 'double'
        this.doorWidthSwing = 3; // feet (36 inches) - for swing and pocket doors
        this.doorWidthBifold = 4; // feet (48 inches) - for bifold doors
        this.doorWidthDouble = 6; // feet (72 inches) - for double doors
        this.windowWidth = 4; // feet (default 48 inches)
        
        // Selection state for doors/windows
        this.selectedDoor = null; // index of selected door
        this.selectedWindow = null; // index of selected window
        this.isDraggingDoorWindow = false;
        
        // Grid settings
        this.gridSize = 20; // pixels per foot
        this.showGrid = true;
        this.snapToGrid = true;
        this.snapDistance = 15; // pixels - snap to endpoints within this distance
        
        // Visual settings
        this.colors = {
            grid: '#e5e7eb',
            wall: '#2c3e50',
            wallPreview: '#e74c3c',
            endpoint: '#3498db',
            selectedWall: '#f39c12',
            selectedEndpoint: '#e74c3c',
            patio: '#D2B48C',        // Tan/beige for patio
            patioSelected: '#DEB887', // Lighter tan when selected
            patioGrid: '#C4A57B'     // Grid lines on patio
        };
        
        // Resize canvas to fill container
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 60; // Account for info bar
        this.render();
    }
    
    setupEventListeners() {
        // Mouse events for drawing
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // Snap to grid if enabled
        if (this.snapToGrid && !this.shiftKeyPressed) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }
        
        // Check for snapping to existing endpoints
        const snapPoint = this.findSnapPoint(x, y);
        if (snapPoint) {
            return snapPoint;
        }
        
        return { x, y };
    }
    
    findSnapPoint(x, y) {
        // Find nearby wall endpoints to snap to
        for (const wall of this.floors[this.currentFloor].walls) {
            // Check start point
            const distStart = Math.sqrt(
                Math.pow(wall.startX - x, 2) + Math.pow(wall.startY - y, 2)
            );
            if (distStart < this.snapDistance) {
                return { x: wall.startX, y: wall.startY };
            }
            
            // Check end point
            const distEnd = Math.sqrt(
                Math.pow(wall.endX - x, 2) + Math.pow(wall.endY - y, 2)
            );
            if (distEnd < this.snapDistance) {
                return { x: wall.endX, y: wall.endY };
            }
        }
        return null;
    }
    
    findEndpointAt(x, y) {
        const hitRadius = 10; // pixels - how close you need to click
        
        for (let i = 0; i < this.floors[this.currentFloor].walls.length; i++) {
            const wall = this.floors[this.currentFloor].walls[i];
            
            // Check start point
            const distStart = Math.sqrt(
                Math.pow(wall.startX - x, 2) + Math.pow(wall.startY - y, 2)
            );
            if (distStart < hitRadius) {
                return { wallIndex: i, type: 'start' };
            }
            
            // Check end point
            const distEnd = Math.sqrt(
                Math.pow(wall.endX - x, 2) + Math.pow(wall.endY - y, 2)
            );
            if (distEnd < hitRadius) {
                return { wallIndex: i, type: 'end' };
            }
        }
        
        return null;
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        
        if (this.mode === 'draw') {
            // Start drawing a wall
            this.currentWall = {
                startX: pos.x,
                startY: pos.y,
                endX: pos.x,
                endY: pos.y
            };
            this.isDrawing = true;
        } else if (this.mode === 'edit') {
            // Check patio corners first (if one is selected)
            if (this.selectedPatio !== null) {
                const corner = this.findPatioCornerAt(pos.x, pos.y);
                if (corner) {
                    this.isDraggingPatio = true;
                    this.draggedPatioCorner = corner;
                    this.render();
                    return;
                }
            }
            
            // Check patios
            const patioIndex = this.findPatioAt(pos.x, pos.y);
            if (patioIndex !== null) {
                this.selectedPatio = patioIndex;
                this.selectedDoor = null;
                this.selectedWindow = null;
                this.selectedWallIndex = null;
                this.isDraggingPatio = true;
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;
                this.render();
                return;
            }
            
            // Clear patio selection
            this.selectedPatio = null;
            
            // Check doors
            const doorIndex = this.findDoorAt(pos.x, pos.y);
            if (doorIndex !== null) {
                this.selectedDoor = doorIndex;
                this.selectedWindow = null;
                this.selectedWallIndex = null;
                this.isDraggingDoorWindow = true;
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;
                this.render();
                return;
            }
            
            // Check windows
            const windowIndex = this.findWindowAt(pos.x, pos.y);
            if (windowIndex !== null) {
                this.selectedWindow = windowIndex;
                this.selectedDoor = null;
                this.selectedWallIndex = null;
                this.isDraggingDoorWindow = true;
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;
                this.render();
                return;
            }
            
            // Then check walls (existing code)
            this.selectedDoor = null;
            this.selectedWindow = null;
            
            // Check if clicking on an endpoint first
            const endpoint = this.findEndpointAt(pos.x, pos.y);
            if (endpoint) {
                // Start dragging an endpoint
                this.isDraggingEndpoint = true;
                this.draggedWallIndex = endpoint.wallIndex;
                this.draggedEndpointType = endpoint.type;
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;
                this.selectedWallIndex = endpoint.wallIndex;
            } else {
                // Check if clicking on a wall
                this.selectWallAt(pos.x, pos.y);
                if (this.selectedWallIndex !== null) {
                    // Start dragging the whole wall
                    this.isDraggingWall = true;
                    this.draggedWallIndex = this.selectedWallIndex;
                    this.dragStartX = pos.x;
                    this.dragStartY = pos.y;
                }
            }
        } else if (this.mode === 'door' || this.mode === 'window') {
            // Find which wall was clicked
            const wallIndex = this.findWallAt(pos.x, pos.y);
            if (wallIndex !== null) {
                const wall = this.floors[this.currentFloor].walls[wallIndex];
                
                // Calculate position along wall (0 to 1)
                const position = this.getPositionOnWall(pos.x, pos.y, wall);
                
                // Add door or window
                if (this.mode === 'door') {
                    const doorStyle = document.getElementById('door-style')?.value || 'swing';
                    
                    // Determine door width based on style
                    let doorWidth;
                    if (doorStyle === 'double') {
                        doorWidth = this.doorWidthDouble; // 6 feet
                    } else if (doorStyle === 'bifold') {
                        doorWidth = this.doorWidthBifold; // 4 feet
                    } else {
                        doorWidth = this.doorWidthSwing; // 3 feet (swing and pocket)
                    }
                    
                    const item = {
                        wallIndex: wallIndex,
                        position: position, // 0 to 1 along the wall
                        width: doorWidth,
                        style: doorStyle,
                        swingDirection: 1 // 1 = swings right, -1 = swings left
                    };
                    this.floors[this.currentFloor].doors.push(item);
                    console.log(`${doorStyle} door (${doorWidth}') added:`, item);
                } else {
                    const item = {
                        wallIndex: wallIndex,
                        position: position,
                        width: this.windowWidth
                    };
                    this.floors[this.currentFloor].windows.push(item);
                    console.log('Window added:', item);
                }
                
                this.render();
                this.updateMeasurements();
            }
        } else if (this.mode === 'patio') {
            // Start drawing a patio (rectangle)
            this.currentPatio = {
                startX: pos.x,
                startY: pos.y,
                endX: pos.x,
                endY: pos.y
            };
            this.isDrawingPatio = true;
        }
    }
    
    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        // Handle drawing mode
        if (this.isDrawing && this.mode === 'draw' && this.currentWall) {
            let finalPos = { ...pos };
            
            // If Shift is pressed, constrain to horizontal or vertical
            if (this.shiftKeyPressed) {
                const dx = Math.abs(pos.x - this.currentWall.startX);
                const dy = Math.abs(pos.y - this.currentWall.startY);
                
                if (dx > dy) {
                    finalPos.y = this.currentWall.startY;
                } else {
                    finalPos.x = this.currentWall.startX;
                }
            }
            
            this.currentWall.endX = finalPos.x;
            this.currentWall.endY = finalPos.y;
            this.render();
        }
        
        // Handle dragging a wall endpoint
        else if (this.isDraggingEndpoint && this.draggedWallIndex !== null) {
            const wall = this.floors[this.currentFloor].walls[this.draggedWallIndex];
            
            if (this.draggedEndpointType === 'start') {
                wall.startX = pos.x;
                wall.startY = pos.y;
            } else {
                wall.endX = pos.x;
                wall.endY = pos.y;
            }
            
            this.render();
        }
        
        // Handle dragging an entire wall
        else if (this.isDraggingWall && this.draggedWallIndex !== null) {
            const wall = this.floors[this.currentFloor].walls[this.draggedWallIndex];
            const dx = pos.x - this.dragStartX;
            const dy = pos.y - this.dragStartY;
            
            wall.startX += dx;
            wall.startY += dy;
            wall.endX += dx;
            wall.endY += dy;
            
            this.dragStartX = pos.x;
            this.dragStartY = pos.y;
            
            this.render();
        }
        
        // Handle dragging doors/windows along their wall
        else if (this.isDraggingDoorWindow && this.mode === 'edit') {
            if (this.selectedDoor !== null) {
                const door = this.floors[this.currentFloor].doors[this.selectedDoor];
                const wall = this.floors[this.currentFloor].walls[door.wallIndex];
                if (wall) {
                    // Update door position along wall
                    const newPos = this.getPositionOnWall(pos.x, pos.y, wall);
                    door.position = newPos;
                    this.render();
                }
            } else if (this.selectedWindow !== null) {
                const window = this.floors[this.currentFloor].windows[this.selectedWindow];
                const wall = this.floors[this.currentFloor].walls[window.wallIndex];
                if (wall) {
                    // Update window position along wall
                    const newPos = this.getPositionOnWall(pos.x, pos.y, wall);
                    window.position = newPos;
                    this.render();
                }
            }
        }
        
        // Handle drawing patio
        else if (this.isDrawingPatio && this.mode === 'patio' && this.currentPatio) {
            let finalPos = { ...pos };
            
            // If Shift is pressed, make it a square
            if (this.shiftKeyPressed) {
                const dx = Math.abs(pos.x - this.currentPatio.startX);
                const dy = Math.abs(pos.y - this.currentPatio.startY);
                const size = Math.max(dx, dy);
                
                finalPos.x = this.currentPatio.startX + (pos.x > this.currentPatio.startX ? size : -size);
                finalPos.y = this.currentPatio.startY + (pos.y > this.currentPatio.startY ? size : -size);
            }
            
            this.currentPatio.endX = finalPos.x;
            this.currentPatio.endY = finalPos.y;
            this.render();
        }
        
        // Handle dragging patios
        else if (this.isDraggingPatio && this.selectedPatio !== null) {
            const patio = this.floors[this.currentFloor].patios[this.selectedPatio];
            
            if (this.draggedPatioCorner) {
                // Resize patio by dragging corner
                const oldX = patio.x;
                const oldY = patio.y;
                const oldWidth = patio.width;
                const oldHeight = patio.height;
                
                switch(this.draggedPatioCorner) {
                    case 'nw':
                        patio.x = pos.x;
                        patio.y = pos.y;
                        patio.width = oldX + oldWidth - pos.x;
                        patio.height = oldY + oldHeight - pos.y;
                        break;
                    case 'ne':
                        patio.y = pos.y;
                        patio.width = pos.x - patio.x;
                        patio.height = oldY + oldHeight - pos.y;
                        break;
                    case 'sw':
                        patio.x = pos.x;
                        patio.width = oldX + oldWidth - pos.x;
                        patio.height = pos.y - patio.y;
                        break;
                    case 'se':
                        patio.width = pos.x - patio.x;
                        patio.height = pos.y - patio.y;
                        break;
                }
            } else {
                // Move entire patio
                const dx = pos.x - this.dragStartX;
                const dy = pos.y - this.dragStartY;
                
                patio.x += dx;
                patio.y += dy;
                
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;
            }
            
            this.render();
        }
        
        // Update cursor for patio corners in edit mode
        else if (this.mode === 'edit' && this.selectedPatio !== null) {
            const corner = this.findPatioCornerAt(pos.x, pos.y);
            if (corner) {
                this.canvas.style.cursor = this.getCornerCursor(corner);
            } else if (this.isPointInPatio(pos.x, pos.y, this.floors[this.currentFloor].patios[this.selectedPatio])) {
                this.canvas.style.cursor = 'move';
            } else {
                this.canvas.style.cursor = 'pointer';
            }
        }
        
        // Update cursor in edit mode
        else if (this.mode === 'edit') {
            const endpoint = this.findEndpointAt(pos.x, pos.y);
            if (endpoint) {
                this.canvas.style.cursor = 'grab';
            } else {
                const closestWall = this.findWallAt(pos.x, pos.y);
                if (closestWall !== null) {
                    this.canvas.style.cursor = 'move';
                } else {
                    this.canvas.style.cursor = 'pointer';
                }
            }
        }
    }
    
    handleMouseUp(e) {
        const pos = this.getMousePos(e);
        
        // Handle finishing drawing a wall
        if (this.isDrawing && this.mode === 'draw' && this.currentWall) {
            let finalPos = { ...pos };
            
            if (this.shiftKeyPressed) {
                const dx = Math.abs(pos.x - this.currentWall.startX);
                const dy = Math.abs(pos.y - this.currentWall.startY);
                
                if (dx > dy) {
                    finalPos.y = this.currentWall.startY;
                } else {
                    finalPos.x = this.currentWall.startX;
                }
            }
            
            this.currentWall.endX = finalPos.x;
            this.currentWall.endY = finalPos.y;
            
            const length = this.calculateWallLength(this.currentWall);
            if (length > 10) {
                this.floors[this.currentFloor].walls.push({
                    startX: this.currentWall.startX,
                    startY: this.currentWall.startY,
                    endX: this.currentWall.endX,
                    endY: this.currentWall.endY
                });
                console.log('Wall added:', this.floors[this.currentFloor].walls[this.floors[this.currentFloor].walls.length - 1]);
            }
            
            this.isDrawing = false;
            this.currentWall = null;
            this.render();
            this.updateMeasurements();
        }
        
        // Stop dragging
        if (this.isDraggingWall) {
            this.isDraggingWall = false;
            this.draggedWallIndex = null;
            this.updateMeasurements();
            console.log('Wall moved');
        }
        
        if (this.isDraggingEndpoint) {
            this.isDraggingEndpoint = false;
            this.draggedWallIndex = null;
            this.draggedEndpointType = null;
            this.updateMeasurements();
            console.log('Endpoint moved');
        }
        
        // Stop dragging door/window
        if (this.isDraggingDoorWindow) {
            this.isDraggingDoorWindow = false;
            console.log('Door/Window repositioned');
        }
        
        // Finish drawing patio
        if (this.isDrawingPatio && this.mode === 'patio' && this.currentPatio) {
            let finalPos = { ...pos };
            
            if (this.shiftKeyPressed) {
                const dx = Math.abs(pos.x - this.currentPatio.startX);
                const dy = Math.abs(pos.y - this.currentPatio.startY);
                const size = Math.max(dx, dy);
                
                finalPos.x = this.currentPatio.startX + (pos.x > this.currentPatio.startX ? size : -size);
                finalPos.y = this.currentPatio.startY + (pos.y > this.currentPatio.startY ? size : -size);
            }
            
            this.currentPatio.endX = finalPos.x;
            this.currentPatio.endY = finalPos.y;
            
            // Calculate dimensions
            const x = Math.min(this.currentPatio.startX, this.currentPatio.endX);
            const y = Math.min(this.currentPatio.startY, this.currentPatio.endY);
            const width = Math.abs(this.currentPatio.endX - this.currentPatio.startX);
            const height = Math.abs(this.currentPatio.endY - this.currentPatio.startY);
            
            // Only add if it has some size (minimum 2 feet)
            if (width > this.gridSize * 2 && height > this.gridSize * 2) {
                this.floors[this.currentFloor].patios.push({ x, y, width, height });
                console.log('Patio added:', this.floors[this.currentFloor].patios[this.floors[this.currentFloor].patios.length - 1]);
            }
            
            this.isDrawingPatio = false;
            this.currentPatio = null;
            this.render();
            this.updateMeasurements();
        }
        
        // Stop dragging patio
        if (this.isDraggingPatio) {
            this.isDraggingPatio = false;
            this.draggedPatioCorner = null;
            this.updateMeasurements();
            console.log('Patio moved/resized');
        }
        
        this.render();
        
        // Trigger 3D update
        if (window.floorPlanApp) {
            window.floorPlanApp.update3DModel();
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Shift') {
            this.shiftKeyPressed = true;
        }
        
        // F key to flip door swing direction (only for swing and pocket doors)
        if ((e.key === 'f' || e.key === 'F') && this.selectedDoor !== null) {
            const door = this.floors[this.currentFloor].doors[this.selectedDoor];
            if (door && (door.style === 'swing' || door.style === 'pocket')) {
                // Flip the swing direction
                door.swingDirection = door.swingDirection === 1 ? -1 : 1;
                const direction = door.swingDirection === 1 ? 'right' : 'left';
                console.log(`${door.style} door swing flipped to ${direction}`);
                this.render();
            }
        }
        
        if (e.key === 'Delete') {
            if (this.selectedWallIndex !== null) {
                this.floors[this.currentFloor].walls.splice(this.selectedWallIndex, 1);
                this.selectedWallIndex = null;
                this.render();
                this.updateMeasurements();
                console.log('Wall deleted');
            } else if (this.selectedDoor !== null) {
                this.floors[this.currentFloor].doors.splice(this.selectedDoor, 1);
                this.selectedDoor = null;
                this.render();
                this.updateMeasurements();
                console.log('Door deleted');
            } else if (this.selectedWindow !== null) {
                this.floors[this.currentFloor].windows.splice(this.selectedWindow, 1);
                this.selectedWindow = null;
                this.render();
                this.updateMeasurements();
                console.log('Window deleted');
            } else if (this.selectedPatio !== null) {
                this.floors[this.currentFloor].patios.splice(this.selectedPatio, 1);
                this.selectedPatio = null;
                this.render();
                this.updateMeasurements();
                console.log('Patio deleted');
            }
            
            // Trigger 3D update after deletion
            if (window.floorPlanApp) {
                window.floorPlanApp.update3DModel();
            }
        }
    }
    
    handleKeyUp(e) {
        if (e.key === 'Shift') {
            this.shiftKeyPressed = false;
        }
    }
    
    selectWallAt(x, y) {
        // Find wall closest to click point
        let closestDist = Infinity;
        let closestIndex = null;
        
        this.floors[this.currentFloor].walls.forEach((wall, index) => {
            const dist = this.pointToLineDistance(x, y, wall);
            if (dist < 10 && dist < closestDist) {
                closestDist = dist;
                closestIndex = index;
            }
        });
        
        this.selectedWallIndex = closestIndex;
        this.render();
    }
    
    findWallAt(x, y) {
        for (let i = 0; i < this.floors[this.currentFloor].walls.length; i++) {
            const dist = this.pointToLineDistance(x, y, this.floors[this.currentFloor].walls[i]);
            if (dist < 10) {
                return i;
            }
        }
        return null;
    }
    
    findDoorAt(x, y) {
        // Check if click is near a door
        for (let i = 0; i < this.floors[this.currentFloor].doors.length; i++) {
            const door = this.floors[this.currentFloor].doors[i];
            const wall = this.floors[this.currentFloor].walls[door.wallIndex];
            if (!wall) continue;
            
            const doorPos = this.getDoorWindowPosition(wall, door.position, door.width);
            const dist = Math.sqrt(
                Math.pow(doorPos.x - x, 2) + Math.pow(doorPos.y - y, 2)
            );
            
            if (dist < door.width * this.gridSize) {
                return i;
            }
        }
        return null;
    }
    
    findWindowAt(x, y) {
        // Check if click is near a window
        for (let i = 0; i < this.floors[this.currentFloor].windows.length; i++) {
            const window = this.floors[this.currentFloor].windows[i];
            const wall = this.floors[this.currentFloor].walls[window.wallIndex];
            if (!wall) continue;
            
            const winPos = this.getDoorWindowPosition(wall, window.position, window.width);
            const dist = Math.sqrt(
                Math.pow(winPos.x - x, 2) + Math.pow(winPos.y - y, 2)
            );
            
            if (dist < window.width * this.gridSize) {
                return i;
            }
        }
        return null;
    }
    
    findPatioAt(x, y) {
        // Find patio at position (check from top to bottom)
        for (let i = this.floors[this.currentFloor].patios.length - 1; i >= 0; i--) {
            if (this.isPointInPatio(x, y, this.floors[this.currentFloor].patios[i])) {
                return i;
            }
        }
        return null;
    }
    
    isPointInPatio(x, y, patio) {
        return x >= patio.x && x <= patio.x + patio.width &&
               y >= patio.y && y <= patio.y + patio.height;
    }
    
    findPatioCornerAt(x, y) {
        if (this.selectedPatio === null) return null;
        
        const patio = this.floors[this.currentFloor].patios[this.selectedPatio];
        const handleSize = 12; // Hit area
        
        // Check each corner
        if (Math.abs(x - patio.x) < handleSize && Math.abs(y - patio.y) < handleSize) {
            return 'nw';
        }
        if (Math.abs(x - (patio.x + patio.width)) < handleSize && Math.abs(y - patio.y) < handleSize) {
            return 'ne';
        }
        if (Math.abs(x - patio.x) < handleSize && Math.abs(y - (patio.y + patio.height)) < handleSize) {
            return 'sw';
        }
        if (Math.abs(x - (patio.x + patio.width)) < handleSize && Math.abs(y - (patio.y + patio.height)) < handleSize) {
            return 'se';
        }
        
        return null;
    }
    
    getCornerCursor(corner) {
        switch(corner) {
            case 'nw': return 'nw-resize';
            case 'ne': return 'ne-resize';
            case 'sw': return 'sw-resize';
            case 'se': return 'se-resize';
            default: return 'pointer';
        }
    }
    
    getPositionOnWall(x, y, wall) {
        // Calculate position along wall as percentage (0 to 1)
        const dx = wall.endX - wall.startX;
        const dy = wall.endY - wall.startY;
        const wallLength = Math.sqrt(dx * dx + dy * dy);
        
        // Vector from wall start to click point
        const px = x - wall.startX;
        const py = y - wall.startY;
        
        // Project onto wall vector
        const dot = (px * dx + py * dy) / (wallLength * wallLength);
        
        // Clamp to 0-1 range and ensure some margin from ends
        return Math.max(0.1, Math.min(0.9, dot));
    }
    
    getDoorWindowPosition(wall, position, width) {
        // Calculate actual x,y position on wall
        const x = wall.startX + (wall.endX - wall.startX) * position;
        const y = wall.startY + (wall.endY - wall.startY) * position;
        
        // Calculate angle perpendicular to wall
        const angle = Math.atan2(wall.endY - wall.startY, wall.endX - wall.startX);
        
        return { x, y, angle };
    }
    
    pointToLineDistance(px, py, wall) {
        const { startX, startY, endX, endY } = wall;
        
        const A = px - startX;
        const B = py - startY;
        const C = endX - startX;
        const D = endY - startY;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = startX;
            yy = startY;
        } else if (param > 1) {
            xx = endX;
            yy = endY;
        } else {
            xx = startX + param * C;
            yy = startY + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, w, h);
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Draw floor below as light overlay if enabled and not on first floor
        const showOverlay = document.getElementById('show-floor-overlay')?.checked;
        if (showOverlay && this.currentFloor > 0) {
            this.drawFloorOverlay(this.currentFloor - 1);
        }
        
        // Draw all completed walls
        ctx.lineWidth = 3;
        
        this.floors[this.currentFloor].walls.forEach((wall, index) => {
            const isSelected = index === this.selectedWallIndex;
            
            ctx.strokeStyle = isSelected ? this.colors.selectedWall : this.colors.wall;
            ctx.beginPath();
            ctx.moveTo(wall.startX, wall.startY);
            ctx.lineTo(wall.endX, wall.endY);
            ctx.stroke();
            
            // Draw endpoints
            ctx.fillStyle = isSelected ? this.colors.selectedEndpoint : this.colors.endpoint;
            ctx.beginPath();
            ctx.arc(wall.startX, wall.startY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wall.endX, wall.endY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw wall length label
            if (isSelected || this.mode === 'draw') {
                const midX = (wall.startX + wall.endX) / 2;
                const midY = (wall.startY + wall.endY) / 2;
                const length = this.calculateWallLength(wall) / this.gridSize;
                
                ctx.fillStyle = '#2c3e50';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${length.toFixed(1)} ft`, midX, midY - 10);
            }
        });
        
        // Draw wall being drawn (preview)
        if (this.isDrawing && this.currentWall) {
            ctx.strokeStyle = this.colors.wallPreview;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]); // Dashed line for preview
            
            ctx.beginPath();
            ctx.moveTo(this.currentWall.startX, this.currentWall.startY);
            ctx.lineTo(this.currentWall.endX, this.currentWall.endY);
            ctx.stroke();
            
            ctx.setLineDash([]); // Reset to solid lines
            
            // Show length of wall being drawn
            const midX = (this.currentWall.startX + this.currentWall.endX) / 2;
            const midY = (this.currentWall.startY + this.currentWall.endY) / 2;
            const length = this.calculateWallLength(this.currentWall) / this.gridSize;
            
            ctx.fillStyle = this.colors.wallPreview;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${length.toFixed(1)} ft`, midX, midY - 10);
        }
        
        // Draw patios
        this.floors[this.currentFloor].patios.forEach((patio, index) => {
            const isSelected = index === this.selectedPatio;
            
            ctx.save();
            
            // Patio base fill
            ctx.fillStyle = isSelected ? this.colors.patioSelected : this.colors.patio;
            ctx.fillRect(patio.x, patio.y, patio.width, patio.height);
            
            // Patio border
            ctx.strokeStyle = isSelected ? '#FF6B6B' : '#8B7355';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(patio.x, patio.y, patio.width, patio.height);
            
            // Patio texture (grid pattern to show pavers/tiles)
            ctx.strokeStyle = this.colors.patioGrid;
            ctx.lineWidth = 1;
            const tileSize = this.gridSize; // 1 foot tiles
            
            // Vertical lines
            for (let x = patio.x + tileSize; x < patio.x + patio.width; x += tileSize) {
                ctx.beginPath();
                ctx.moveTo(x, patio.y);
                ctx.lineTo(x, patio.y + patio.height);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = patio.y + tileSize; y < patio.y + patio.height; y += tileSize) {
                ctx.beginPath();
                ctx.moveTo(patio.x, y);
                ctx.lineTo(patio.x + patio.width, y);
                ctx.stroke();
            }
            
            // Label
            const centerX = patio.x + patio.width / 2;
            const centerY = patio.y + patio.height / 2;
            const widthFeet = (patio.width / this.gridSize).toFixed(1);
            const heightFeet = (patio.height / this.gridSize).toFixed(1);
            
            ctx.fillStyle = isSelected ? '#FF6B6B' : '#654321';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PATIO', centerX, centerY - 8);
            ctx.font = '12px sans-serif';
            ctx.fillText(`${widthFeet}' × ${heightFeet}'`, centerX, centerY + 8);
            
            // Corner resize handles when selected
            if (isSelected) {
                const handleSize = 8;
                ctx.fillStyle = '#FF6B6B';
                
                // NW corner
                ctx.fillRect(patio.x - handleSize/2, patio.y - handleSize/2, handleSize, handleSize);
                // NE corner
                ctx.fillRect(patio.x + patio.width - handleSize/2, patio.y - handleSize/2, handleSize, handleSize);
                // SW corner
                ctx.fillRect(patio.x - handleSize/2, patio.y + patio.height - handleSize/2, handleSize, handleSize);
                // SE corner
                ctx.fillRect(patio.x + patio.width - handleSize/2, patio.y + patio.height - handleSize/2, handleSize, handleSize);
            }
            
            ctx.restore();
        });
        
        // Draw patio being drawn (preview)
        if (this.isDrawingPatio && this.currentPatio) {
            const x = Math.min(this.currentPatio.startX, this.currentPatio.endX);
            const y = Math.min(this.currentPatio.startY, this.currentPatio.endY);
            const width = Math.abs(this.currentPatio.endX - this.currentPatio.startX);
            const height = Math.abs(this.currentPatio.endY - this.currentPatio.startY);
            
            ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
            ctx.fillRect(x, y, width, height);
            
            ctx.strokeStyle = '#D2B48C';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
            
            // Show dimensions
            const widthFeet = (width / this.gridSize).toFixed(1);
            const heightFeet = (height / this.gridSize).toFixed(1);
            
            ctx.fillStyle = '#8B7355';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${widthFeet}' × ${heightFeet}'`, x + width/2, y + height/2);
        }
        
        // Draw doors
        this.floors[this.currentFloor].doors.forEach((door, index) => {
            const wall = this.floors[this.currentFloor].walls[door.wallIndex];
            if (!wall) return;
            
            const isSelected = this.selectedDoor === index;
            const doorPos = this.getDoorWindowPosition(wall, door.position, door.width);
            
            ctx.save();
            ctx.translate(doorPos.x, doorPos.y);
            ctx.rotate(doorPos.angle);
            
            const doorWidthPx = door.width * this.gridSize;
            
            // Render based on door style
            switch(door.style || 'swing') {
                case 'swing':
                    // Traditional swing door with arc
                    ctx.strokeStyle = isSelected ? '#FF6B6B' : '#8B4513';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    
                    // Door frame opening (gap in wall)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(-doorWidthPx/2, -5, doorWidthPx, 10);
                    
                    // Get swing direction (default to 1 if not set)
                    const swingDir = door.swingDirection || 1;
                    
                    // Door swing arc (flips based on direction)
                    ctx.beginPath();
                    if (swingDir === 1) {
                        // Swings to the right
                        ctx.arc(-doorWidthPx/2, 0, doorWidthPx, 0, Math.PI / 2);
                    } else {
                        // Swings to the left
                        ctx.arc(doorWidthPx/2, 0, doorWidthPx, Math.PI / 2, Math.PI);
                    }
                    ctx.stroke();
                    
                    // Door panel line
                    ctx.strokeStyle = isSelected ? '#FF6B6B' : '#654321';
                    ctx.lineWidth = isSelected ? 4 : 3;
                    ctx.beginPath();
                    if (swingDir === 1) {
                        ctx.moveTo(-doorWidthPx/2, 0);
                        ctx.lineTo(-doorWidthPx/2, doorWidthPx);
                    } else {
                        ctx.moveTo(doorWidthPx/2, 0);
                        ctx.lineTo(doorWidthPx/2, doorWidthPx);
                    }
                    ctx.stroke();
                    break;
                    
                case 'pocket':
                    // Improved pocket door - slides into wall pocket
                    
                    // Door frame opening (white gap in wall)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(-doorWidthPx/2, -6, doorWidthPx, 12);
                    
                    // Wall pocket indicator (where door slides into) - on the left side
                    ctx.fillStyle = '#e0e0e0';
                    ctx.fillRect(-doorWidthPx/2 - doorWidthPx * 0.15, -6, doorWidthPx * 0.15, 12);
                    
                    // Pocket outline
                    ctx.strokeStyle = '#999999';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-doorWidthPx/2 - doorWidthPx * 0.15, -6, doorWidthPx * 0.15, 12);
                    
                    // Door panel (partially visible, sliding into pocket)
                    ctx.fillStyle = isSelected ? '#FF6B6B' : '#A0826D';
                    ctx.fillRect(-doorWidthPx/2, -5, doorWidthPx * 0.15, 10);
                    
                    // Door edge detail
                    ctx.strokeStyle = isSelected ? '#FF6B6B' : '#654321';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    ctx.beginPath();
                    ctx.moveTo(-doorWidthPx/2 + doorWidthPx * 0.15, -5);
                    ctx.lineTo(-doorWidthPx/2 + doorWidthPx * 0.15, 5);
                    ctx.stroke();
                    
                    // Arrow showing slide direction
                    ctx.strokeStyle = '#666666';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(doorWidthPx/2 - 10, 0);
                    ctx.lineTo(-doorWidthPx/2 - 5, 0);
                    // Arrowhead pointing left (into pocket)
                    ctx.lineTo(-doorWidthPx/2 - 2, -3);
                    ctx.moveTo(-doorWidthPx/2 - 5, 0);
                    ctx.lineTo(-doorWidthPx/2 - 2, 3);
                    ctx.stroke();
                    break;
                    
                case 'bifold':
                    // Bifold door (folds in middle)
                    ctx.strokeStyle = isSelected ? '#FF6B6B' : '#8B4513';
                    ctx.lineWidth = 2;
                    
                    // Opening
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(-doorWidthPx/2, -5, doorWidthPx, 10);
                    
                    // Two panels
                    ctx.strokeStyle = isSelected ? '#FF6B6B' : '#654321';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    
                    // Get swing direction (default to 1 if not set)
                    const bifoldDir = door.swingDirection || 1;
                    const foldOffset = bifoldDir * 3; // Offset for fold direction
                    
                    // Left panel (folds based on direction)
                    ctx.beginPath();
                    ctx.moveTo(-doorWidthPx/2, -5);
                    ctx.lineTo(-doorWidthPx/4, -8 - foldOffset);
                    ctx.lineTo(-doorWidthPx/4, 8 + foldOffset);
                    ctx.lineTo(-doorWidthPx/2, 5);
                    ctx.stroke();
                    
                    // Right panel (folds based on direction)
                    ctx.beginPath();
                    ctx.moveTo(doorWidthPx/2, -5);
                    ctx.lineTo(doorWidthPx/4, -8 - foldOffset);
                    ctx.lineTo(doorWidthPx/4, 8 + foldOffset);
                    ctx.lineTo(doorWidthPx/2, 5);
                    ctx.stroke();
                    break;
                    
                case 'double':
                    // Double door (french doors)
                    ctx.strokeStyle = isSelected ? '#FF6B6B' : '#8B4513';
                    ctx.lineWidth = 2;
                    
                    // Opening
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(-doorWidthPx/2, -5, doorWidthPx, 10);
                    
                    // Two door panels swinging outward
                    ctx.strokeStyle = isSelected ? '#FF6B6B' : '#654321';
                    ctx.lineWidth = isSelected ? 4 : 3;
                    
                    // Get swing direction (default to 1 if not set)
                    const doubleDir = door.swingDirection || 1;
                    
                    if (doubleDir === 1) {
                        // Swings outward (default)
                        // Left door
                        ctx.beginPath();
                        ctx.arc(-doorWidthPx/2, 0, doorWidthPx/2, 0, Math.PI / 2);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(-doorWidthPx/2, 0);
                        ctx.lineTo(-doorWidthPx/2, doorWidthPx/2);
                        ctx.stroke();
                        
                        // Right door (mirror)
                        ctx.beginPath();
                        ctx.arc(doorWidthPx/2, 0, doorWidthPx/2, Math.PI / 2, Math.PI);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(doorWidthPx/2, 0);
                        ctx.lineTo(doorWidthPx/2, doorWidthPx/2);
                        ctx.stroke();
                    } else {
                        // Swings inward (flipped)
                        // Left door
                        ctx.beginPath();
                        ctx.arc(-doorWidthPx/2, 0, doorWidthPx/2, Math.PI, 3 * Math.PI / 2);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(-doorWidthPx/2, 0);
                        ctx.lineTo(-doorWidthPx/2, -doorWidthPx/2);
                        ctx.stroke();
                        
                        // Right door (mirror)
                        ctx.beginPath();
                        ctx.arc(doorWidthPx/2, 0, doorWidthPx/2, 3 * Math.PI / 2, 2 * Math.PI);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(doorWidthPx/2, 0);
                        ctx.lineTo(doorWidthPx/2, -doorWidthPx/2);
                        ctx.stroke();
                    }
                    break;
            }
            
            // Selection indicator
            if (isSelected) {
                ctx.strokeStyle = '#FF6B6B';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(-doorWidthPx/2 - 5, -10, doorWidthPx + 10, 20);
                ctx.setLineDash([]);
                
                // Show flip instruction (only for swing and pocket doors)
                if (door.style === 'swing' || door.style === 'pocket') {
                    ctx.fillStyle = '#FF6B6B';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'center';
                    const swingText = (door.swingDirection || 1) === 1 ? 'Right' : 'Left';
                    ctx.fillText(`Press F to flip (${swingText})`, 0, 25);
                }
            }
            
            ctx.restore();
        });
        
        // Draw windows
        this.floors[this.currentFloor].windows.forEach((window, index) => {
            const wall = this.floors[this.currentFloor].walls[window.wallIndex];
            if (!wall) return;
            
            const isSelected = this.selectedWindow === index;
            const winPos = this.getDoorWindowPosition(wall, window.position, window.width);
            
            ctx.save();
            ctx.translate(winPos.x, winPos.y);
            ctx.rotate(winPos.angle);
            
            const winWidthPx = window.width * this.gridSize;
            
            // Window opening in wall (white gap)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-winWidthPx/2, -5, winWidthPx, 10);
            
            // Window frame (outer)
            ctx.strokeStyle = isSelected ? '#FF6B6B' : '#4682B4';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(-winWidthPx/2, -6, winWidthPx, 12);
            
            // Glass panes (3 sections)
            ctx.strokeStyle = isSelected ? '#FF6B6B' : '#87CEEB';
            ctx.lineWidth = 1;
            
            // Vertical dividers
            ctx.beginPath();
            ctx.moveTo(-winWidthPx/6, -6);
            ctx.lineTo(-winWidthPx/6, 6);
            ctx.moveTo(winWidthPx/6, -6);
            ctx.lineTo(winWidthPx/6, 6);
            ctx.stroke();
            
            // Horizontal center line
            ctx.beginPath();
            ctx.moveTo(-winWidthPx/2, 0);
            ctx.lineTo(winWidthPx/2, 0);
            ctx.stroke();
            
            // Selection indicator
            if (isSelected) {
                ctx.strokeStyle = '#FF6B6B';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(-winWidthPx/2 - 5, -10, winWidthPx + 10, 20);
                ctx.setLineDash([]);
            }
            
            ctx.restore();
        });
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < w; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < h; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }
    
    drawFloorOverlay(floorIndex) {
        const floor = this.floors[floorIndex];
        const ctx = this.ctx;
        
        // Draw patios from floor below with light overlay
        ctx.globalAlpha = 0.4;
        floor.patios.forEach(patio => {
            ctx.fillStyle = '#E8D4B8'; // Lighter tan
            ctx.fillRect(patio.x, patio.y, patio.width, patio.height);
            ctx.strokeStyle = '#C4A57B';
            ctx.lineWidth = 1;
            ctx.strokeRect(patio.x, patio.y, patio.width, patio.height);
        });
        ctx.globalAlpha = 1.0;
        
        // Draw walls from floor below - more visible
        ctx.strokeStyle = 'rgba(100, 100, 180, 0.65)'; // Blue-gray with more opacity
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]); // Longer dashes for better visibility
        
        floor.walls.forEach(wall => {
            ctx.beginPath();
            ctx.moveTo(wall.startX, wall.startY);
            ctx.lineTo(wall.endX, wall.endY);
            ctx.stroke();
        });
        
        ctx.setLineDash([]); // Reset
        
        // Draw doors and windows from floor below - more visible
        ctx.globalAlpha = 0.5; // Increased from 0.3
        
        // Doors
        floor.doors.forEach(door => {
            const wall = floor.walls[door.wallIndex];
            if (!wall) return;
            const doorPos = this.getDoorWindowPosition(wall, door.position, door.width);
            
            ctx.fillStyle = '#D2B48C';
            ctx.beginPath();
            ctx.arc(doorPos.x, doorPos.y, 6, 0, Math.PI * 2); // Slightly larger
            ctx.fill();
        });
        
        // Windows
        floor.windows.forEach(window => {
            const wall = floor.walls[window.wallIndex];
            if (!wall) return;
            const winPos = this.getDoorWindowPosition(wall, window.position, window.width);
            
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(winPos.x, winPos.y, 5, 0, Math.PI * 2); // Slightly larger
            ctx.fill();
        });
        
        ctx.globalAlpha = 1.0; // Reset
    }
    
    calculateWallLength(wall) {
        const dx = wall.endX - wall.startX;
        const dy = wall.endY - wall.startY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    updateMeasurements() {
        const floor = this.floors[this.currentFloor];
        
        const wallCountDisplay = document.getElementById('wall-count');
        const totalLengthDisplay = document.getElementById('total-length');
        
        if (wallCountDisplay) {
            wallCountDisplay.textContent = floor.walls.length;
        }
        
        if (totalLengthDisplay) {
            const totalLength = floor.walls.reduce((sum, wall) => {
                return sum + this.calculateWallLength(wall);
            }, 0);
            const totalLengthFeet = totalLength / this.gridSize;
            totalLengthDisplay.textContent = 
                `${totalLengthFeet.toFixed(1)} | Doors: ${floor.doors.length} | Windows: ${floor.windows.length}`;
        }
    }
    
    clear() {
        if (confirm(`Clear all content on ${this.floors[this.currentFloor].name}?`)) {
            this.floors[this.currentFloor].walls = [];
            this.floors[this.currentFloor].doors = [];
            this.floors[this.currentFloor].windows = [];
            this.currentWall = null;
            this.isDrawing = false;
            this.selectedWallIndex = null;
            this.render();
            this.updateMeasurements();
        }
    }
    
    undo() {
        const floor = this.floors[this.currentFloor];
        if (floor.walls.length > 0) {
            floor.walls.pop();
            this.selectedWallIndex = null;
            this.render();
            this.updateMeasurements();
            console.log('Undo - removed last wall. Total walls:', floor.walls.length);
        }
    }
    
    setMode(mode) {
        this.mode = mode;
        this.selectedWallIndex = null;
        console.log('Mode changed to:', mode);
        
        // Update mode buttons visual state
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`mode-${mode}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update cursor based on mode
        if (mode === 'draw') {
            this.canvas.style.cursor = 'crosshair';
        } else if (mode === 'edit') {
            this.canvas.style.cursor = 'pointer';
        } else if (mode === 'door' || mode === 'window' || mode === 'patio') {
            this.canvas.style.cursor = 'crosshair';
        }
        
        this.render();
    }
    
    addFloor() {
        const newFloorNumber = this.floors.length + 1;
        
        this.floors.push({
            id: newFloorNumber,
            name: `Floor ${newFloorNumber}`,
            walls: [],
            doors: [],
            windows: []
        });
        
        // Switch to the new floor
        this.currentFloor = this.floors.length - 1;
        
        this.updateFloorSelector();
        this.render();
        
        console.log(`Floor ${newFloorNumber} added`);
    }
    
    switchFloor(floorIndex) {
        if (floorIndex >= 0 && floorIndex < this.floors.length) {
            this.currentFloor = floorIndex;
            this.selectedWallIndex = null;
            this.render();
            this.updateMeasurements();
            console.log(`Switched to Floor ${floorIndex + 1}`);
        }
    }
    
    updateFloorSelector() {
        const selector = document.getElementById('floor-selector');
        if (!selector) return;
        
        selector.innerHTML = '';
        this.floors.forEach((floor, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = floor.name;
            option.selected = index === this.currentFloor;
            selector.appendChild(option);
        });
    }
    
    getFloorPlanData() {
        // Return all floors with their walls, doors, and windows
        return {
            floors: this.floors,
            currentFloor: this.currentFloor,
            gridSize: this.gridSize
        };
    }
}
