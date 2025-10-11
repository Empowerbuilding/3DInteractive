// 2D Floor Plan Drawing Editor
// Handles canvas drawing and user interactions

export class FloorPlanEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Drawing state - MUST BE INITIALIZED FIRST!
        this.vertices = []; // Array of {x, y} points
        this.isDrawing = false;
        this.isClosed = false;
        this.mode = 'draw'; // Current mode: draw, edit, door, window
        
        // Grid settings
        this.gridSize = 20; // pixels per foot
        this.showGrid = true;
        
        // Visual settings
        this.colors = {
            grid: '#e5e7eb',
            wall: '#1f2937',
            vertex: '#667eea',
            vertexHover: '#5568d3'
        };
        
        // NOW it's safe to resize (which calls render)
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render (optional, already done by resizeCanvas)
        // this.render();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 60; // Account for info bar
        this.render();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // Snap to grid
        x = Math.round(x / this.gridSize) * this.gridSize;
        y = Math.round(y / this.gridSize) * this.gridSize;
        
        return { x, y };
    }
    
    handleClick(e) {
        if (this.isClosed) return;
        
        const pos = this.getMousePos(e);
        this.vertices.push(pos);
        this.render();
        
        console.log('Added vertex:', pos);
        console.log('Total vertices:', this.vertices.length);
    }
    
    handleDoubleClick(e) {
        e.preventDefault();
        
        if (this.vertices.length >= 3) {
            this.isClosed = true;
            console.log('Shape closed with', this.vertices.length, 'vertices');
            this.render();
            
            // Notify that floor plan is ready
            this.notifyUpdate();
        }
    }
    
    handleMouseMove(e) {
        // TODO: Show hover preview in next version
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
        
        // Draw lines between vertices
        if (this.vertices.length > 0) {
            this.drawLines();
        }
        
        // Draw vertices (dots)
        this.drawVertices();
        
        // Update measurements
        this.updateMeasurements();
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
    
    drawLines() {
        const ctx = this.ctx;
        
        if (this.isClosed) {
            // Fill the floor area
            ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.beginPath();
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Draw wall lines
        ctx.strokeStyle = this.colors.wall;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        
        if (this.isClosed) {
            ctx.closePath();
        }
        
        ctx.stroke();
    }
    
    drawVertices() {
        const ctx = this.ctx;
        
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i];
            
            ctx.fillStyle = this.colors.vertex;
            ctx.beginPath();
            ctx.arc(v.x, v.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw vertex number
            ctx.fillStyle = '#1f2937';
            ctx.font = '12px sans-serif';
            ctx.fillText(`${i + 1}`, v.x + 10, v.y - 10);
        }
    }
    
    updateMeasurements() {
        const display = document.getElementById('measurement-display');
        if (!display) return;
        
        if (this.vertices.length === 0) {
            display.textContent = 'Click to start drawing';
            return;
        }
        
        if (this.vertices.length < 3) {
            display.textContent = `${this.vertices.length} points placed. Need ${3 - this.vertices.length} more to close.`;
            return;
        }
        
        const area = this.calculateArea();
        display.textContent = `Area: ${area.toFixed(0)} sq ft | ${this.vertices.length} corners`;
    }
    
    calculateArea() {
        if (this.vertices.length < 3) return 0;
        
        let area = 0;
        for (let i = 0; i < this.vertices.length; i++) {
            const j = (i + 1) % this.vertices.length;
            area += this.vertices[i].x * this.vertices[j].y;
            area -= this.vertices[j].x * this.vertices[i].y;
        }
        area = Math.abs(area / 2);
        
        // Convert pixels to square feet
        const sqFeet = area / (this.gridSize * this.gridSize);
        return sqFeet;
    }
    
    clear() {
        this.vertices = [];
        this.isClosed = false;
        this.render();
    }

    undo() {
        if (this.vertices.length > 0) {
            // If shape was closed, reopen it first
            if (this.isClosed) {
                this.isClosed = false;
            }
            
            this.vertices.pop();
            this.render();
            console.log('Undo - removed last vertex. Total:', this.vertices.length);
        }
    }

    setMode(mode) {
        this.mode = mode;
        console.log('Mode changed to:', mode);
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`mode-${mode}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        if (mode === 'draw') {
            this.canvas.style.cursor = 'crosshair';
        } else if (mode === 'edit') {
            this.canvas.style.cursor = 'move';
        } else if (mode === 'door' || mode === 'window') {
            this.canvas.style.cursor = 'pointer';
        }
    }
    
    getFloorPlanData() {
        // Convert canvas coordinates to real-world coordinates (feet)
        const realVertices = this.vertices.map(v => ({
            x: v.x / this.gridSize,
            y: v.y / this.gridSize
        }));
        
        return {
            vertices: realVertices,
            area: this.calculateArea(),
            isClosed: this.isClosed
        };
    }
    
    notifyUpdate() {
        // Dispatch custom event that 3D viewer can listen to
        const event = new CustomEvent('floorplan-updated', {
            detail: this.getFloorPlanData()
        });
        document.dispatchEvent(event);
        
        console.log('Floor plan updated:', this.getFloorPlanData());
    }
}

