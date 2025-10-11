// 2D Floor Plan Drawing Editor - Drag-to-Draw Walls
// Click and drag to draw individual wall segments

export class FloorPlanEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Data structure - array of walls
        this.walls = []; // Each wall: {startX, startY, endX, endY}
        this.currentWall = null; // Wall being drawn
        this.isDrawing = false;
        this.mode = 'draw'; // Current mode: draw, edit, door, window
        this.selectedWallIndex = null;
        this.shiftKeyPressed = false;
        
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
            selectedEndpoint: '#e74c3c'
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
        for (const wall of this.walls) {
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
            // Select a wall
            this.selectWallAt(pos.x, pos.y);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDrawing || this.mode !== 'draw' || !this.currentWall) return;
        
        let pos = this.getMousePos(e);
        
        // If Shift is pressed, constrain to horizontal or vertical
        if (this.shiftKeyPressed) {
            const dx = Math.abs(pos.x - this.currentWall.startX);
            const dy = Math.abs(pos.y - this.currentWall.startY);
            
            if (dx > dy) {
                // More horizontal
                pos.y = this.currentWall.startY;
            } else {
                // More vertical
                pos.x = this.currentWall.startX;
            }
        }
        
        // Update the wall endpoint as user drags
        this.currentWall.endX = pos.x;
        this.currentWall.endY = pos.y;
        
        // Redraw canvas with preview
        this.render();
    }
    
    handleMouseUp(e) {
        if (!this.isDrawing || this.mode !== 'draw' || !this.currentWall) return;
        
        let pos = this.getMousePos(e);
        
        // If Shift is pressed, constrain to horizontal or vertical
        if (this.shiftKeyPressed) {
            const dx = Math.abs(pos.x - this.currentWall.startX);
            const dy = Math.abs(pos.y - this.currentWall.startY);
            
            if (dx > dy) {
                pos.y = this.currentWall.startY;
            } else {
                pos.x = this.currentWall.startX;
            }
        }
        
        // Finalize the wall
        this.currentWall.endX = pos.x;
        this.currentWall.endY = pos.y;
        
        // Only add wall if it has some length
        const length = this.calculateWallLength(this.currentWall);
        if (length > 10) { // Minimum 10 pixels
            this.walls.push({
                startX: this.currentWall.startX,
                startY: this.currentWall.startY,
                endX: this.currentWall.endX,
                endY: this.currentWall.endY
            });
            
            console.log('Wall added:', this.walls[this.walls.length - 1]);
        }
        
        this.isDrawing = false;
        this.currentWall = null;
        
        this.render();
        this.updateMeasurements();
    }
    
    handleKeyDown(e) {
        if (e.key === 'Shift') {
            this.shiftKeyPressed = true;
        }
        
        if (e.key === 'Delete' && this.selectedWallIndex !== null) {
            this.walls.splice(this.selectedWallIndex, 1);
            this.selectedWallIndex = null;
            this.render();
            this.updateMeasurements();
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
        
        this.walls.forEach((wall, index) => {
            const dist = this.pointToLineDistance(x, y, wall);
            if (dist < 10 && dist < closestDist) {
                closestDist = dist;
                closestIndex = index;
            }
        });
        
        this.selectedWallIndex = closestIndex;
        this.render();
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
        
        // Draw all completed walls
        ctx.lineWidth = 3;
        
        this.walls.forEach((wall, index) => {
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
    
    calculateWallLength(wall) {
        const dx = wall.endX - wall.startX;
        const dy = wall.endY - wall.startY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    updateMeasurements() {
        const wallCountDisplay = document.getElementById('wall-count');
        const totalLengthDisplay = document.getElementById('total-length');
        
        if (wallCountDisplay) {
            wallCountDisplay.textContent = this.walls.length;
        }
        
        if (totalLengthDisplay) {
            const totalLength = this.walls.reduce((sum, wall) => {
                return sum + this.calculateWallLength(wall);
            }, 0);
            const totalLengthFeet = totalLength / this.gridSize;
            totalLengthDisplay.textContent = totalLengthFeet.toFixed(1);
        }
    }
    
    clear() {
        this.walls = [];
        this.currentWall = null;
        this.isDrawing = false;
        this.selectedWallIndex = null;
        this.render();
        this.updateMeasurements();
    }
    
    undo() {
        if (this.walls.length > 0) {
            this.walls.pop();
            this.selectedWallIndex = null;
            this.render();
            this.updateMeasurements();
            console.log('Undo - removed last wall. Total walls:', this.walls.length);
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
        } else if (mode === 'door' || mode === 'window') {
            this.canvas.style.cursor = 'crosshair';
        }
        
        this.render();
    }
    
    getFloorPlanData() {
        // Convert canvas coordinates to real-world coordinates (feet)
        const wallsInFeet = this.walls.map(wall => ({
            start: {
                x: wall.startX / this.gridSize,
                y: wall.startY / this.gridSize
            },
            end: {
                x: wall.endX / this.gridSize,
                y: wall.endY / this.gridSize
            }
        }));
        
        const totalLength = this.walls.reduce((sum, wall) => {
            return sum + this.calculateWallLength(wall);
        }, 0) / this.gridSize;
        
        return {
            walls: wallsInFeet,
            wallCount: this.walls.length,
            totalLength: totalLength,
            gridSize: this.gridSize
        };
    }
}
