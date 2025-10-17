// Area Calculator System for 3D Home Design Application
// Calculates comprehensive area measurements for floor plans

export class AreaCalculator {
    constructor(gridSize = 20) {
        this.gridSize = gridSize; // pixels per foot
        this.epsilon = 5; // pixels - tolerance for point matching
        
        // Standard dimensions (in feet)
        this.standardDimensions = {
            windowHeight: 4,
            doorHeight: 7,
            wallThickness: 0.5
        };
    }

    /**
     * Main method to calculate all areas for a floorplan
     * @param {Object} floorplanData - Complete floorplan data
     * @returns {Object} Comprehensive area breakdown
     */
    calculateAllAreas(floorplanData) {
        if (!floorplanData || !floorplanData.floors || floorplanData.floors.length === 0) {
            console.warn('⚠️ No floorplan data provided for area calculation');
            return this.getEmptyAreas();
        }

        console.log('📐 Calculating areas for', floorplanData.floors.length, 'floor(s)');
        
        const floors = [];
        let totals = {
            floorArea: 0,
            wallArea: 0,
            roofArea: 0,
            patioArea: 0,
            totalLivingSpace: 0
        };
        
        let breakdown = {
            interiorWallArea: 0,
            exteriorWallArea: 0,
            windowArea: 0,
            doorArea: 0
        };

        // Calculate areas for each floor
        for (let i = 0; i < floorplanData.floors.length; i++) {
            const floor = floorplanData.floors[i];
            const floorAreas = this.calculateFloorAreas(floor, i + 1);
            floors.push(floorAreas);
            
            // Add to totals
            totals.floorArea += floorAreas.floorArea;
            totals.wallArea += floorAreas.totalWallArea;
            totals.roofArea += floorAreas.roofArea;
            totals.patioArea += floorAreas.patioArea;
            totals.totalLivingSpace += floorAreas.floorArea;
            
            // Add to breakdown
            breakdown.interiorWallArea += floorAreas.interiorWallArea;
            breakdown.exteriorWallArea += floorAreas.exteriorWallArea;
            breakdown.windowArea += floorAreas.windowArea;
            breakdown.doorArea += floorAreas.doorArea;
        }

        const result = {
            floors,
            totals,
            breakdown,
            timestamp: new Date().toISOString(),
            gridSize: this.gridSize
        };

        console.log('✅ Area calculations complete:', result);
        return result;
    }

    /**
     * Calculate areas for a single floor
     * @param {Object} floor - Floor data
     * @param {number} floorNumber - Floor number (1-based)
     * @returns {Object} Floor area breakdown
     */
    calculateFloorAreas(floor, floorNumber) {
        const walls = floor.walls || [];
        const doors = floor.doors || [];
        const windows = floor.windows || [];
        const patios = floor.patios || [];
        
        // Calculate floor area using polygon method
        const floorArea = this.calculateFloorArea(walls);
        
        // Calculate wall areas
        const wallHeight = floor.wallHeight || 8;
        const totalWallArea = this.calculateTotalWallArea(walls, wallHeight, doors, windows);
        const exteriorWallArea = this.calculateExteriorWallArea(walls, wallHeight, doors, windows);
        const interiorWallArea = totalWallArea - exteriorWallArea;
        
        // Calculate roof area
        const roofArea = this.calculateRoofArea(floor, floorArea);
        
        // Calculate patio area
        const patioArea = this.calculatePatioArea(patios);
        
        // Calculate window and door areas
        const windowArea = this.calculateWindowArea(windows);
        const doorArea = this.calculateDoorArea(doors);
        
        // Calculate perimeter
        const perimeter = this.calculatePerimeter(walls);

        return {
            floorNumber,
            floorName: floor.name || `Floor ${floorNumber}`,
            floorArea,
            totalWallArea,
            exteriorWallArea,
            interiorWallArea,
            roofArea,
            patioArea,
            windowArea,
            doorArea,
            ceilingArea: floorArea, // Same as floor area
            wallHeight,
            perimeter
        };
    }

    /**
     * Calculate floor area using shoelace formula for polygon
     * @param {Array} walls - Array of wall objects
     * @returns {number} Floor area in square feet
     */
    calculateFloorArea(walls) {
        if (walls.length < 3) {
            return 0; // Need at least 3 walls to form a closed polygon
        }

        try {
            const polygon = this.getFloorPolygon(walls);
            if (polygon.length < 3) {
                return 0;
            }

            // Shoelace formula for polygon area
            let area = 0;
            for (let i = 0; i < polygon.length; i++) {
                const j = (i + 1) % polygon.length;
                area += polygon[i].x * polygon[j].y;
                area -= polygon[j].x * polygon[i].y;
            }
            
            const areaPixels = Math.abs(area) / 2;
            const areaFeet = areaPixels / (this.gridSize * this.gridSize);
            
            return Math.round(areaFeet * 100) / 100; // Round to 2 decimal places
        } catch (error) {
            console.warn('⚠️ Error calculating floor area:', error);
            return 0;
        }
    }

    /**
     * Trace connected walls to form a closed polygon
     * @param {Array} walls - Array of wall objects
     * @returns {Array} Array of points forming the polygon
     */
    getFloorPolygon(walls) {
        if (walls.length < 3) {
            return [];
        }

        const visited = new Set();
        const polygon = [];
        
        // Start with the first wall
        let currentWall = walls[0];
        let currentPoint = { x: currentWall.startX, y: currentWall.startY };
        polygon.push(currentPoint);
        visited.add(0);
        
        // Find the end point of the first wall
        let endPoint = { x: currentWall.endX, y: currentWall.endY };
        
        // Trace the perimeter
        while (polygon.length < walls.length) {
            polygon.push(endPoint);
            
            // Find the next wall that connects to this end point
            let nextWallIndex = -1;
            for (let i = 0; i < walls.length; i++) {
                if (visited.has(i)) continue;
                
                const wall = walls[i];
                const startConnects = this.pointsClose(endPoint, { x: wall.startX, y: wall.startY });
                const endConnects = this.pointsClose(endPoint, { x: wall.endX, y: wall.endY });
                
                if (startConnects) {
                    nextWallIndex = i;
                    endPoint = { x: wall.endX, y: wall.endY };
                    break;
                } else if (endConnects) {
                    nextWallIndex = i;
                    endPoint = { x: wall.startX, y: wall.startY };
                    break;
                }
            }
            
            if (nextWallIndex === -1) {
                // No more connected walls found
                break;
            }
            
            visited.add(nextWallIndex);
        }
        
        // Check if we've formed a closed polygon
        if (polygon.length > 2) {
            const firstPoint = polygon[0];
            const lastPoint = polygon[polygon.length - 1];
            if (!this.pointsClose(firstPoint, lastPoint)) {
                // Connect the last point to the first point to close the polygon
                polygon.push({ x: firstPoint.x, y: firstPoint.y });
            }
        }
        
        return polygon;
    }

    /**
     * Calculate total wall area (including openings)
     * @param {Array} walls - Array of wall objects
     * @param {number} wallHeight - Wall height in feet
     * @param {Array} doors - Array of door objects
     * @param {Array} windows - Array of window objects
     * @returns {number} Total wall area in square feet
     */
    calculateTotalWallArea(walls, wallHeight, doors, windows) {
        let totalArea = 0;
        
        walls.forEach(wall => {
            const length = this.getWallLength(wall);
            const lengthFeet = length / this.gridSize;
            const wallArea = lengthFeet * wallHeight;
            totalArea += wallArea;
        });
        
        // Subtract door and window areas
        const doorArea = this.calculateDoorArea(doors);
        const windowArea = this.calculateWindowArea(windows);
        
        return Math.round((totalArea - doorArea - windowArea) * 100) / 100;
    }

    /**
     * Calculate exterior wall area (perimeter walls only)
     * @param {Array} walls - Array of wall objects
     * @param {number} wallHeight - Wall height in feet
     * @param {Array} doors - Array of door objects
     * @param {Array} windows - Array of window objects
     * @returns {number} Exterior wall area in square feet
     */
    calculateExteriorWallArea(walls, wallHeight, doors, windows) {
        // For now, assume all walls are exterior walls
        // In a more complex implementation, we'd determine which walls are exterior
        // based on their position relative to the building perimeter
        return this.calculateTotalWallArea(walls, wallHeight, doors, windows);
    }

    /**
     * Calculate roof area based on roof style and pitch
     * @param {Object} floor - Floor data
     * @param {number} floorArea - Floor area in square feet
     * @returns {number} Roof area in square feet
     */
    calculateRoofArea(floor, floorArea) {
        if (!floor.hasRoof) {
            return 0;
        }

        const roofStyle = floor.roofStyle || 'flat';
        const roofPitch = floor.roofPitch || 6;
        const roofOverhang = floor.roofOverhang || 1.0;
        
        // Get floor bounds to calculate roof dimensions
        const bounds = this.getFloorBounds(floor);
        
        switch (roofStyle.toLowerCase()) {
            case 'flat':
                return this.calculateFlatRoofArea(bounds, roofOverhang);
                
            case 'gable':
                return this.calculateGableRoofArea(bounds, roofPitch, roofOverhang);
                
            case 'hip':
                return this.calculateHipRoofArea(bounds, roofPitch, roofOverhang);
                
            default:
                console.warn('⚠️ Unknown roof style:', roofStyle);
                return floorArea;
        }
    }

    /**
     * Calculate flat roof area
     * @param {Object} bounds - Floor bounds
     * @param {number} overhang - Roof overhang in feet
     * @returns {number} Roof area in square feet
     */
    calculateFlatRoofArea(bounds, overhang) {
        const width = bounds.width + (overhang * 2);
        const depth = bounds.depth + (overhang * 2);
        return Math.round((width * depth) * 100) / 100;
    }

    /**
     * Calculate gable roof area
     * @param {Object} bounds - Floor bounds
     * @param {number} pitch - Roof pitch (rise:run ratio)
     * @param {number} overhang - Roof overhang in feet
     * @returns {number} Roof area in square feet
     */
    calculateGableRoofArea(bounds, pitch, overhang) {
        const width = bounds.width + (overhang * 2);
        const depth = bounds.depth + (overhang * 2);
        
        // Calculate slope length for gable roof
        const rise = (depth / 2) * (pitch / 12);
        const slopeLength = Math.sqrt(Math.pow(depth / 2, 2) + Math.pow(rise, 2));
        
        // Two slopes for gable roof
        const roofArea = 2 * (width * slopeLength);
        return Math.round(roofArea * 100) / 100;
    }

    /**
     * Calculate hip roof area
     * @param {Object} bounds - Floor bounds
     * @param {number} pitch - Roof pitch (rise:run ratio)
     * @param {number} overhang - Roof overhang in feet
     * @returns {number} Roof area in square feet
     */
    calculateHipRoofArea(bounds, pitch, overhang) {
        const width = bounds.width + (overhang * 2);
        const depth = bounds.depth + (overhang * 2);
        
        // Hip roof has four triangular faces
        const rise = Math.min(width, depth) / 2 * (pitch / 12);
        const slopeLength = Math.sqrt(Math.pow(Math.min(width, depth) / 2, 2) + Math.pow(rise, 2));
        
        // Simplified hip roof calculation
        const baseArea = width * depth;
        const slopeFactor = 1.2; // Approximate factor for hip roof complexity
        const roofArea = baseArea * slopeFactor;
        
        return Math.round(roofArea * 100) / 100;
    }

    /**
     * Calculate total patio area
     * @param {Array} patios - Array of patio objects
     * @returns {number} Total patio area in square feet
     */
    calculatePatioArea(patios) {
        let totalArea = 0;
        
        patios.forEach(patio => {
            const widthFeet = patio.width / this.gridSize;
            const heightFeet = patio.height / this.gridSize;
            totalArea += widthFeet * heightFeet;
        });
        
        return Math.round(totalArea * 100) / 100;
    }

    /**
     * Calculate total window area
     * @param {Array} windows - Array of window objects
     * @returns {number} Total window area in square feet
     */
    calculateWindowArea(windows) {
        let totalArea = 0;
        
        windows.forEach(window => {
            const widthFeet = window.width;
            const heightFeet = this.standardDimensions.windowHeight;
            totalArea += widthFeet * heightFeet;
        });
        
        return Math.round(totalArea * 100) / 100;
    }

    /**
     * Calculate total door area
     * @param {Array} doors - Array of door objects
     * @returns {number} Total door area in square feet
     */
    calculateDoorArea(doors) {
        let totalArea = 0;
        
        doors.forEach(door => {
            const widthFeet = door.width;
            const heightFeet = this.standardDimensions.doorHeight;
            totalArea += widthFeet * heightFeet;
        });
        
        return Math.round(totalArea * 100) / 100;
    }

    /**
     * Calculate exterior perimeter
     * @param {Array} walls - Array of wall objects
     * @returns {number} Perimeter in feet
     */
    calculatePerimeter(walls) {
        let perimeter = 0;
        
        walls.forEach(wall => {
            const length = this.getWallLength(wall);
            const lengthFeet = length / this.gridSize;
            perimeter += lengthFeet;
        });
        
        return Math.round(perimeter * 100) / 100;
    }

    /**
     * Get floor bounds (bounding box)
     * @param {Object} floor - Floor data
     * @returns {Object} Bounds object with minX, maxX, minY, maxY, width, depth
     */
    getFloorBounds(floor) {
        const walls = floor.walls || [];
        
        if (walls.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, depth: 0 };
        }
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        walls.forEach(wall => {
            minX = Math.min(minX, wall.startX, wall.endX);
            minY = Math.min(minY, wall.startY, wall.endY);
            maxX = Math.max(maxX, wall.startX, wall.endX);
            maxY = Math.max(maxY, wall.startY, wall.endY);
        });
        
        const width = (maxX - minX) / this.gridSize;
        const depth = (maxY - minY) / this.gridSize;
        
        return {
            minX,
            maxX,
            minY,
            maxY,
            width: Math.round(width * 100) / 100,
            depth: Math.round(depth * 100) / 100
        };
    }

    /**
     * Get wall length in pixels
     * @param {Object} wall - Wall object
     * @returns {number} Wall length in pixels
     */
    getWallLength(wall) {
        const dx = wall.endX - wall.startX;
        const dy = wall.endY - wall.startY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if two points are within epsilon distance
     * @param {Object} p1 - First point
     * @param {Object} p2 - Second point
     * @param {number} epsilon - Distance tolerance
     * @returns {boolean} True if points are close
     */
    pointsClose(p1, p2, epsilon = this.epsilon) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy) < epsilon;
    }

    /**
     * Format area report as text with emojis
     * @param {Object} areas - Area calculation results
     * @returns {string} Formatted text report
     */
    formatAreaReport(areas) {
        if (!areas || !areas.totals) {
            return 'No area data available';
        }

        let report = '=== BUILDING AREA REPORT ===\n\n';
        
        // Totals section
        report += '📊 TOTALS:\n';
        report += `  Total Living Space: ${this.formatNumber(areas.totals.totalLivingSpace)} sq ft\n`;
        report += `  Total Floor Area: ${this.formatNumber(areas.totals.floorArea)} sq ft\n`;
        report += `  Total Wall Area: ${this.formatNumber(areas.totals.wallArea)} sq ft\n`;
        report += `  Total Roof Area: ${this.formatNumber(areas.totals.roofArea)} sq ft\n`;
        report += `  Total Patio Area: ${this.formatNumber(areas.totals.patioArea)} sq ft\n\n`;
        
        // Breakdown section
        report += '🔍 BREAKDOWN:\n';
        report += `  Exterior Walls: ${this.formatNumber(areas.breakdown.exteriorWallArea)} sq ft\n`;
        report += `  Interior Walls: ${this.formatNumber(areas.breakdown.interiorWallArea)} sq ft\n`;
        report += `  Windows: ${this.formatNumber(areas.breakdown.windowArea)} sq ft\n`;
        report += `  Doors: ${this.formatNumber(areas.breakdown.doorArea)} sq ft\n\n`;
        
        // By floor section
        report += '🏢 BY FLOOR:\n';
        areas.floors.forEach(floor => {
            report += `  ${floor.floorName}:\n`;
            report += `    Floor: ${this.formatNumber(floor.floorArea)} sq ft\n`;
            report += `    Walls: ${this.formatNumber(floor.totalWallArea)} sq ft\n`;
            report += `    Ceiling: ${this.formatNumber(floor.ceilingArea)} sq ft\n`;
            report += `    Roof: ${this.formatNumber(floor.roofArea)} sq ft\n`;
            report += `    Patios: ${this.formatNumber(floor.patioArea)} sq ft\n`;
            report += `    Perimeter: ${this.formatNumber(floor.perimeter)} ft\n`;
            report += `    Wall Height: ${floor.wallHeight} ft\n\n`;
        });
        
        return report;
    }

    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        return Math.round(num).toLocaleString();
    }

    /**
     * Get empty areas object for when no data is available
     * @returns {Object} Empty areas structure
     */
    getEmptyAreas() {
        return {
            floors: [],
            totals: {
                floorArea: 0,
                wallArea: 0,
                roofArea: 0,
                patioArea: 0,
                totalLivingSpace: 0
            },
            breakdown: {
                interiorWallArea: 0,
                exteriorWallArea: 0,
                windowArea: 0,
                doorArea: 0
            },
            timestamp: new Date().toISOString(),
            gridSize: this.gridSize
        };
    }
}
