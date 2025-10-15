// threejs-generator.js
// Converts 2D floorplan data to 3D Three.js models

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ThreeJSGenerator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // 3D Settings - Enhanced for high-contrast AI detection
        this.wallHeight = 8; // feet
        this.wallThickness = 0.5; // feet (6 inches) - Increased thickness for better visibility
        this.showRoof = true;
        this.roofStyle = 'hip'; // 'hip', 'gable', or 'flat'
        this.roofPitch = 6; // pitch ratio (6:12 means 6" rise per 12" run)
        this.roofOverhang = 2; // feet - Increased for more prominent overhang
        
        // Materials - Enhanced for high-contrast architectural features
        this.materials = {
            wall: null,
            floor: null,
            ceiling: null,
            door: null,
            window: null,
            windowFrame: null,
            doorFrame: null,
            roof: null,
            patio: null,
            trim: null,
            foundation: null
        };
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing Three.js Scene...');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
        
        // Camera
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(30, 30, 30);
        
        // Renderer - Enhanced for high-contrast architectural features
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: false, // Disable anti-aliasing for sharp edges
            preserveDrawingBuffer: true // Required for canvas.toBlob() screenshots
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFHardShadowMap; // Harder shadows for definition
        this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Better color accuracy
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 150;
        
        // Mobile touch controls
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a7c59,
            roughness: 0.8 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Grid
        this.gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x888888);
        this.scene.add(this.gridHelper);
        
        // Initialize materials
        this.initMaterials();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('✅ Three.js Scene Initialized');
    }
    
    initMaterials() {
        // Enhanced materials for high-contrast AI detection
        this.materials.wall = new THREE.MeshStandardMaterial({ 
            color: 0xf0f0f0, // Brighter, more neutral wall color
            roughness: 0.8,
            metalness: 0.0
        });
        
        this.materials.floor = new THREE.MeshStandardMaterial({ 
            color: 0xe0e0e0, // Lighter floor for contrast
            roughness: 0.9,
            metalness: 0.0
        });
        
        this.materials.ceiling = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, // Pure white ceiling
            roughness: 0.9,
            metalness: 0.0
        });
        
        // Bold, dark door for maximum contrast
        this.materials.door = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, // Very dark brown/black
            roughness: 0.3,
            metalness: 0.1
        });
        
        // Pure black window glass for maximum contrast
        this.materials.window = new THREE.MeshStandardMaterial({ 
            color: 0x000000, // Pure black glass
            transparent: false, // Remove transparency for solid appearance
            opacity: 1.0,
            roughness: 0.1,
            metalness: 0.8
        });
        
        // Bold window frame material
        this.materials.windowFrame = new THREE.MeshStandardMaterial({ 
            color: 0x444444, // Dark gray frame
            roughness: 0.2,
            metalness: 0.3
        });
        
        // Bold door frame material
        this.materials.doorFrame = new THREE.MeshStandardMaterial({ 
            color: 0x333333, // Dark frame
            roughness: 0.2,
            metalness: 0.2
        });
        
        // High contrast roof
        this.materials.roof = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, // Very dark roof
            roughness: 0.9,
            metalness: 0.0
        });
        
        this.materials.patio = new THREE.MeshStandardMaterial({ 
            color: 0x888888, // Neutral gray patio
            roughness: 0.9,
            metalness: 0.0
        });
        
        // Bold trim material for architectural details
        this.materials.trim = new THREE.MeshStandardMaterial({ 
            color: 0x555555, // Dark gray trim
            roughness: 0.3,
            metalness: 0.2
        });
        
        // High-contrast foundation
        this.materials.foundation = new THREE.MeshStandardMaterial({ 
            color: 0x666666, // Medium gray foundation
            roughness: 0.9,
            metalness: 0.0
        });
    }
    
    generate3DFromFloorplan(floorplanData) {
        console.log('🏗️ Generating 3D Model from Floorplan...');
        
        if (!floorplanData || !floorplanData.floors) {
            console.error('Invalid floorplan data');
            return;
        }
        
        // Clear existing 3D models (keep lights, ground, grid)
        this.clearBuilding();
        
        const gridSize = floorplanData.gridSize || 20; // pixels per foot
        const feetToMeters = 0.3048; // conversion factor
        
        let cumulativeHeight = 0; // Track cumulative height for stacking floors
        
        floorplanData.floors.forEach((floor, floorIndex) => {
            const yOffset = cumulativeHeight;
            
            // Generate walls for this floor
            this.generateWalls(floor, floorIndex, gridSize, feetToMeters, yOffset);
            
            // Generate floors and ceilings
            this.generateFloorsAndCeilings(floor, floorIndex, gridSize, feetToMeters, yOffset, floorplanData.floors.length);
            
            // Generate patios
            this.generatePatios(floor, gridSize, feetToMeters, yOffset);
            
            // Add this floor's height to cumulative total
            const floorWallHeight = (floor.wallHeight || 8) * feetToMeters;
            cumulativeHeight += floorWallHeight;
            
            // Generate roof for THIS floor if it has one
            if (this.showRoof && floor.hasRoof && floor.walls.length > 0) {
                const roofY = cumulativeHeight;
                this.generateRoofForFloor(floor, gridSize, feetToMeters, roofY);
                this.generateGableEndWallsForFloor(floor, gridSize, feetToMeters, roofY);
            }
        });
        
        // Update stats
        this.updateStats(floorplanData);
        
        console.log('✅ 3D Model Generated');
    }
    
    generateWalls(floor, floorIndex, gridSize, feetToMeters, yOffset) {
        // Get wall height for THIS specific floor
        const wallHeight = floor.wallHeight || 8; // Default to 8 if not set
        const wallHeightMeters = wallHeight * feetToMeters;
        
        floor.walls.forEach((wall, wallIndex) => {
            const startX = (wall.startX / gridSize) * feetToMeters;
            const startZ = (wall.startY / gridSize) * feetToMeters;
            const endX = (wall.endX / gridSize) * feetToMeters;
            const endZ = (wall.endY / gridSize) * feetToMeters;
            
            const dx = endX - startX;
            const dz = endZ - startZ;
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);
            
            const centerX = (startX + endX) / 2;
            const centerZ = (startZ + endZ) / 2;
            
            // Check for doors/windows on this wall
            const doorsOnWall = floor.doors.filter(d => d.wallIndex === wallIndex);
            const windowsOnWall = floor.windows.filter(w => w.wallIndex === wallIndex);
            
            if (doorsOnWall.length === 0 && windowsOnWall.length === 0) {
                // Simple solid wall
                this.createWallSegment(
                    length, 
                    wallHeightMeters,  // Use floor-specific height
                    this.wallThickness * feetToMeters,
                    centerX,
                    yOffset + wallHeightMeters / 2,
                    centerZ,
                    angle
                );
            } else {
                // Wall with openings
                this.createWallWithOpenings(
                    wall, wallIndex, floor, length, angle, 
                    startX, startZ, dx, dz, 
                    yOffset, gridSize, feetToMeters,
                    doorsOnWall, windowsOnWall,
                    wallHeightMeters  // Pass wall height
                );
            }
        });
    }
    
    createWallSegment(width, height, depth, x, y, z, rotation) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, this.materials.wall);
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotation;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isBuilding = true;
        mesh.userData.isWall = true;
        mesh.userData.wallMaterial = 'vinyl-siding';
        this.scene.add(mesh);
    }
    
    createWallWithOpenings(wall, wallIndex, floor, length, angle, startX, startZ, dx, dz, yOffset, gridSize, feetToMeters, doorsOnWall, windowsOnWall, wallHeightMeters) {
        const segments = [];
        let lastPos = 0;
        
        // Collect all openings
        const openings = [
            ...doorsOnWall.map(d => ({ 
                pos: d.position, 
                width: d.width * feetToMeters, 
                height: 7 * feetToMeters, 
                type: 'door' 
            })),
            ...windowsOnWall.map(w => ({ 
                pos: w.position, 
                width: w.width * feetToMeters, 
                height: 3 * feetToMeters, 
                type: 'window',
                bottomOffset: 3 * feetToMeters
            }))
        ].sort((a, b) => a.pos - b.pos);
        
        openings.forEach(opening => {
            const openingStart = opening.pos - (opening.width / length) / 2;
            const openingEnd = opening.pos + (opening.width / length) / 2;
            
            // Wall segment before opening
            if (openingStart > lastPos) {
                const segmentLength = (openingStart - lastPos) * length;
                const segmentCenter = (lastPos + openingStart) / 2;
                const segmentX = startX + dx * segmentCenter;
                const segmentZ = startZ + dz * segmentCenter;
                
                this.createWallSegment(
                    segmentLength,
                    wallHeightMeters,
                    this.wallThickness * feetToMeters,
                    segmentX,
                    yOffset + wallHeightMeters / 2,
                    segmentZ,
                    angle
                );
            }
            
            // Add the opening (door or window)
            if (opening.type === 'door') {
                // Calculate wall segment above door
                const aboveLength = (openingEnd - openingStart) * length;
                const aboveCenter = (openingStart + openingEnd) / 2;
                const aboveX = startX + dx * aboveCenter;
                const aboveZ = startZ + dz * aboveCenter;
                const aboveHeight = wallHeightMeters - opening.height;
                
                // Create wall above door (if there's space)
                if (aboveHeight > 0.1) {  // Only create if height is meaningful
                    this.createWallSegment(
                        aboveLength,
                        aboveHeight,
                        this.wallThickness * feetToMeters,
                        aboveX,
                        yOffset + opening.height + aboveHeight / 2,
                        aboveZ,
                        angle
                    );
                }
                
                // Enhanced door with bold frame and trim
                const doorPosX = startX + dx * opening.pos;
                const doorPosZ = startZ + dz * opening.pos;
                
                // Door frame (thick, bold frame)
                const frameThickness = 0.1; // 10cm thick frame
                const frameGeometry = new THREE.BoxGeometry(
                    opening.width + frameThickness * 2,
                    opening.height + frameThickness * 2,
                    this.wallThickness * feetToMeters + 0.05
                );
                const frameMesh = new THREE.Mesh(frameGeometry, this.materials.doorFrame);
                frameMesh.position.set(
                    doorPosX,
                    yOffset + opening.height / 2,
                    doorPosZ
                );
                frameMesh.rotation.y = angle;
                frameMesh.castShadow = true;
                frameMesh.userData.isBuilding = true;
                this.scene.add(frameMesh);
                
                // Door panel (dark, inset from frame)
                const doorGeometry = new THREE.BoxGeometry(
                    opening.width,
                    opening.height,
                    this.wallThickness * feetToMeters * 0.3
                );
                const doorMesh = new THREE.Mesh(doorGeometry, this.materials.door);
                doorMesh.position.set(
                    doorPosX,
                    yOffset + opening.height / 2,
                    doorPosZ + (this.wallThickness * feetToMeters * 0.1) // Slightly inset
                );
                doorMesh.rotation.y = angle;
                doorMesh.castShadow = true;
                doorMesh.userData.isBuilding = true;
                doorMesh.userData.isDoor = true;
                this.scene.add(doorMesh);
                
                // Door handle/hardware (small dark rectangle)
                const handleGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.02);
                const handleMesh = new THREE.Mesh(handleGeometry, this.materials.doorFrame);
                handleMesh.position.set(
                    doorPosX + opening.width * 0.3,
                    yOffset + opening.height * 0.5,
                    doorPosZ + (this.wallThickness * feetToMeters * 0.2) + 0.01
                );
                handleMesh.rotation.y = angle;
                handleMesh.castShadow = true;
                handleMesh.userData.isBuilding = true;
                this.scene.add(handleMesh);
            } else if (opening.type === 'window') {
                // Wall above window
                const aboveLength = (openingEnd - openingStart) * length;
                const aboveCenter = (openingStart + openingEnd) / 2;
                const aboveX = startX + dx * aboveCenter;
                const aboveZ = startZ + dz * aboveCenter;
                const aboveHeight = wallHeightMeters - (opening.bottomOffset + opening.height);
                
                this.createWallSegment(
                    aboveLength,
                    aboveHeight,
                    this.wallThickness * feetToMeters,
                    aboveX,
                    yOffset + opening.bottomOffset + opening.height + aboveHeight / 2,
                    aboveZ,
                    angle
                );
                
                // Wall below window
                this.createWallSegment(
                    aboveLength,
                    opening.bottomOffset,
                    this.wallThickness * feetToMeters,
                    aboveX,
                    yOffset + opening.bottomOffset / 2,
                    aboveZ,
                    angle
                );
                
                // Enhanced window with bold frame and glass
                const windowPosX = startX + dx * opening.pos;
                const windowPosZ = startZ + dz * opening.pos;
                
                // Window frame (thick, bold frame)
                const frameThickness = 0.15; // 15cm thick frame
                const frameGeometry = new THREE.BoxGeometry(
                    opening.width + frameThickness * 2,
                    opening.height + frameThickness * 2,
                    this.wallThickness * feetToMeters + 0.1
                );
                const frameMesh = new THREE.Mesh(frameGeometry, this.materials.windowFrame);
                frameMesh.position.set(
                    windowPosX,
                    yOffset + opening.bottomOffset + opening.height / 2,
                    windowPosZ
                );
                frameMesh.rotation.y = angle;
                frameMesh.castShadow = true;
                frameMesh.userData.isBuilding = true;
                this.scene.add(frameMesh);
                
                // Window glass (pure black, inset from frame)
                const glassGeometry = new THREE.BoxGeometry(
                    opening.width,
                    opening.height,
                    this.wallThickness * feetToMeters * 0.2
                );
                const windowMesh = new THREE.Mesh(glassGeometry, this.materials.window);
                windowMesh.position.set(
                    windowPosX,
                    yOffset + opening.bottomOffset + opening.height / 2,
                    windowPosZ + (this.wallThickness * feetToMeters * 0.1) // Slightly inset
                );
                windowMesh.rotation.y = angle;
                windowMesh.userData.isBuilding = true;
                windowMesh.userData.isWindow = true;
                this.scene.add(windowMesh);
                
                // Window sill (horizontal ledge)
                const sillGeometry = new THREE.BoxGeometry(
                    opening.width + frameThickness * 2,
                    0.05, // 5cm thick sill
                    this.wallThickness * feetToMeters + 0.2
                );
                const sillMesh = new THREE.Mesh(sillGeometry, this.materials.windowFrame);
                sillMesh.position.set(
                    windowPosX,
                    yOffset + opening.bottomOffset - 0.025,
                    windowPosZ + (this.wallThickness * feetToMeters * 0.1)
                );
                sillMesh.rotation.y = angle;
                sillMesh.castShadow = true;
                sillMesh.userData.isBuilding = true;
                this.scene.add(sillMesh);
            }
            
            lastPos = openingEnd;
        });
        
        // Wall segment after last opening
        if (lastPos < 1) {
            const segmentLength = (1 - lastPos) * length;
            const segmentCenter = (lastPos + 1) / 2;
            const segmentX = startX + dx * segmentCenter;
            const segmentZ = startZ + dz * segmentCenter;
            
            this.createWallSegment(
                segmentLength,
                wallHeightMeters,
                this.wallThickness * feetToMeters,
                segmentX,
                yOffset + wallHeightMeters / 2,
                segmentZ,
                angle
            );
        }
    }
    
    generateFloorsAndCeilings(floor, floorIndex, gridSize, feetToMeters, yOffset, totalFloors) {
        // Calculate bounding box from walls for this floor
        if (floor.walls.length === 0) return;
        
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        
        floor.walls.forEach(wall => {
            const x1 = (wall.startX / gridSize) * feetToMeters;
            const z1 = (wall.startY / gridSize) * feetToMeters;
            const x2 = (wall.endX / gridSize) * feetToMeters;
            const z2 = (wall.endY / gridSize) * feetToMeters;
            
            minX = Math.min(minX, x1, x2);
            maxX = Math.max(maxX, x1, x2);
            minZ = Math.min(minZ, z1, z2);
            maxZ = Math.max(maxZ, z1, z2);
        });
        
        // Add small margin
        const margin = 0.5; // meters
        minX -= margin;
        maxX += margin;
        minZ -= margin;
        maxZ += margin;
        
        const width = maxX - minX;
        const depth = maxZ - minZ;
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        const floorThickness = 0.15; // Thinner slab (about 6 inches)
        
        // ONLY create a floor slab for the ground floor
        if (floorIndex === 0) {
            const floorGeometry = new THREE.BoxGeometry(width, floorThickness, depth);
            const floorMesh = new THREE.Mesh(floorGeometry, this.materials.floor);
            floorMesh.position.set(centerX, yOffset, centerZ);
            floorMesh.receiveShadow = true;
            floorMesh.castShadow = true;
            floorMesh.userData.isBuilding = true;
            this.scene.add(floorMesh);
        }
        
        // Don't create any intermediate floor slabs
        // The walls define the structure, and the roof caps it off
    }
    
    generatePatios(floor, gridSize, feetToMeters, yOffset) {
        if (!floor.patios) return;
        
        floor.patios.forEach(patio => {
            const x = (patio.x / gridSize) * feetToMeters;
            const z = (patio.y / gridSize) * feetToMeters;
            const width = (patio.width / gridSize) * feetToMeters;
            const depth = (patio.height / gridSize) * feetToMeters;
            
            const centerX = x + width / 2;
            const centerZ = z + depth / 2;
            
            // Patio floor/deck
            const patioGeometry = new THREE.BoxGeometry(width, 0.3, depth);
            const patioMesh = new THREE.Mesh(patioGeometry, this.materials.patio);
            patioMesh.position.set(centerX, yOffset + 0.15, centerZ);
            patioMesh.castShadow = true;
            patioMesh.receiveShadow = true;
            patioMesh.userData.isBuilding = true;
            this.scene.add(patioMesh);
            
            // Generate roof over patio if enabled
            if (patio.hasRoof) {
                this.generatePatioRoof(patio, floor, x, z, width, depth, centerX, centerZ, yOffset, feetToMeters, gridSize);
            }
        });
    }
    
    generatePatioRoof(patio, floor, x, z, width, depth, centerX, centerZ, yOffset, feetToMeters, gridSize) {
        const roofHeight = (patio.roofHeight || 8) * feetToMeters;
        const roofStyle = patio.roofStyle || 'flat';
        const postRadius = 0.1; // meters (about 4 inches)
        const postHeight = roofHeight - 0.3; // Slightly lower than roof height
        
        // Helper function to check if a point is near any wall
        const isPointNearWall = (pointX, pointZ) => {
            const postTolerance = 1.5 * feetToMeters; // 1.5 feet tolerance for post placement
            
            for (let wall of floor.walls) {
                const wallStartX = (wall.startX / gridSize) * feetToMeters;
                const wallStartZ = (wall.startY / gridSize) * feetToMeters;
                const wallEndX = (wall.endX / gridSize) * feetToMeters;
                const wallEndZ = (wall.endY / gridSize) * feetToMeters;
                
                // Calculate distance from point to wall line segment
                const dx = wallEndX - wallStartX;
                const dz = wallEndZ - wallStartZ;
                const wallLength = Math.sqrt(dx * dx + dz * dz);
                
                if (wallLength < 0.01) continue; // Skip zero-length walls
                
                // Normalized direction vector
                const ndx = dx / wallLength;
                const ndz = dz / wallLength;
                
                // Vector from wall start to point
                const px = pointX - wallStartX;
                const pz = pointZ - wallStartZ;
                
                // Project point onto wall line
                const projection = px * ndx + pz * ndz;
                
                // Clamp projection to wall segment
                const clampedProjection = Math.max(0, Math.min(wallLength, projection));
                
                // Find closest point on wall segment
                const closestX = wallStartX + ndx * clampedProjection;
                const closestZ = wallStartZ + ndz * clampedProjection;
                
                // Calculate distance from point to closest point on wall
                const distX = pointX - closestX;
                const distZ = pointZ - closestZ;
                const distance = Math.sqrt(distX * distX + distZ * distZ);
                
                // If point is too close to wall, don't place post here
                if (distance < postTolerance) {
                    return true;
                }
            }
            
            return false;
        };
        
        // Create support posts only at corners that are NOT too close to walls
        const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.8 
        });
        
        const postPositions = [];
        
        // Check each corner position
        const potentialPosts = [
            { x: x + 0.3, z: z + 0.3 },           // Front-left
            { x: x + width - 0.3, z: z + 0.3 },  // Front-right
            { x: x + 0.3, z: z + depth - 0.3 },  // Back-left
            { x: x + width - 0.3, z: z + depth - 0.3 }  // Back-right
        ];
        
        // Only add posts that aren't near walls
        potentialPosts.forEach(pos => {
            if (!isPointNearWall(pos.x, pos.z)) {
                postPositions.push(pos);
            }
        });
        
        // Create the posts
        postPositions.forEach(pos => {
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(pos.x, yOffset + postHeight / 2, pos.z);
            post.castShadow = true;
            post.receiveShadow = true;
            post.userData.isBuilding = true;
            this.scene.add(post);
        });
        
        // Generate roof based on style
        const roofY = yOffset + postHeight;
        const overhang = 0.5; // meters overhang
        
        // Detect which edges are near walls to avoid overhang into house
        const edgeTolerance = 0.8 * feetToMeters; // 0.8 feet tolerance
        const patioLeft = x;
        const patioRight = x + width;
        const patioFront = z;
        const patioBack = z + depth;
        
        let leftNearWall = false;
        let rightNearWall = false;
        let frontNearWall = false;
        let backNearWall = false;
        
        // Check if any edge is close to a wall
        floor.walls.forEach(wall => {
            const wallStartX = (wall.startX / gridSize) * feetToMeters;
            const wallStartZ = (wall.startY / gridSize) * feetToMeters;
            const wallEndX = (wall.endX / gridSize) * feetToMeters;
            const wallEndZ = (wall.endY / gridSize) * feetToMeters;
            
            const wallMinX = Math.min(wallStartX, wallEndX);
            const wallMaxX = Math.max(wallStartX, wallEndX);
            const wallMinZ = Math.min(wallStartZ, wallEndZ);
            const wallMaxZ = Math.max(wallStartZ, wallEndZ);
            
            // Check if wall runs along an edge (with some overlap)
            const overlapZ = !(wallMaxZ < patioFront - edgeTolerance || wallMinZ > patioBack + edgeTolerance);
            const overlapX = !(wallMaxX < patioLeft - edgeTolerance || wallMinX > patioRight + edgeTolerance);
            
            // Check vertical walls (left/right edges)
            if (Math.abs(wallMaxX - wallMinX) < edgeTolerance && overlapZ) {
                if (Math.abs((wallMinX + wallMaxX) / 2 - patioLeft) < edgeTolerance) {
                    leftNearWall = true;
                }
                if (Math.abs((wallMinX + wallMaxX) / 2 - patioRight) < edgeTolerance) {
                    rightNearWall = true;
                }
            }
            
            // Check horizontal walls (front/back edges)
            if (Math.abs(wallMaxZ - wallMinZ) < edgeTolerance && overlapX) {
                if (Math.abs((wallMinZ + wallMaxZ) / 2 - patioFront) < edgeTolerance) {
                    frontNearWall = true;
                }
                if (Math.abs((wallMinZ + wallMaxZ) / 2 - patioBack) < edgeTolerance) {
                    backNearWall = true;
                }
            }
        });
        
        // Calculate roof dimensions with smart overhang
        const overhangLeft = leftNearWall ? 0 : overhang;
        const overhangRight = rightNearWall ? 0 : overhang;
        const overhangFront = frontNearWall ? 0 : overhang;
        const overhangBack = backNearWall ? 0 : overhang;
        
        const roofWidth = width + overhangLeft + overhangRight;
        const roofDepth = depth + overhangFront + overhangBack;
        
        // Adjust roof center based on asymmetric overhang
        const roofCenterX = centerX + (overhangRight - overhangLeft) / 2;
        const roofCenterZ = centerZ + (overhangBack - overhangFront) / 2;
        
        let roofMesh;
        
        if (roofStyle === 'flat') {
            // Flat roof
            const roofGeometry = new THREE.BoxGeometry(roofWidth, 0.2, roofDepth);
            roofMesh = new THREE.Mesh(roofGeometry, this.materials.roof);
            roofMesh.position.set(roofCenterX, roofY + 0.1, roofCenterZ);
            
        } else if (roofStyle === 'gable') {
            // Gable roof
            const ridgeHeight = 1.5; // meters (about 5 feet)
            const ridgeAlongX = roofWidth > roofDepth;
            const geometry = new THREE.BufferGeometry();
            
            let vertices;
            if (ridgeAlongX) {
                const halfWidth = roofWidth / 2;
                const halfDepth = roofDepth / 2;
                vertices = new Float32Array([
                    // Front slope
                    -halfWidth, ridgeHeight, 0,
                    -halfWidth, 0, -halfDepth,
                    halfWidth, 0, -halfDepth,
                    -halfWidth, ridgeHeight, 0,
                    halfWidth, 0, -halfDepth,
                    halfWidth, ridgeHeight, 0,
                    // Back slope
                    -halfWidth, ridgeHeight, 0,
                    halfWidth, 0, halfDepth,
                    -halfWidth, 0, halfDepth,
                    -halfWidth, ridgeHeight, 0,
                    halfWidth, ridgeHeight, 0,
                    halfWidth, 0, halfDepth
                ]);
            } else {
                const halfWidth = roofWidth / 2;
                const halfDepth = roofDepth / 2;
                vertices = new Float32Array([
                    // Left slope
                    0, ridgeHeight, -halfDepth,
                    -halfWidth, 0, -halfDepth,
                    -halfWidth, 0, halfDepth,
                    0, ridgeHeight, -halfDepth,
                    -halfWidth, 0, halfDepth,
                    0, ridgeHeight, halfDepth,
                    // Right slope
                    0, ridgeHeight, -halfDepth,
                    halfWidth, 0, halfDepth,
                    halfWidth, 0, -halfDepth,
                    0, ridgeHeight, -halfDepth,
                    0, ridgeHeight, halfDepth,
                    halfWidth, 0, halfDepth
                ]);
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            const gableMaterial = this.materials.roof.clone();
            gableMaterial.side = THREE.DoubleSide;
            
            roofMesh = new THREE.Mesh(geometry, gableMaterial);
            roofMesh.position.set(roofCenterX, roofY, roofCenterZ);
            
        } else if (roofStyle === 'hip') {
            // Hip roof
            const ridgeHeight = 1.5; // meters
            const geometry = new THREE.BufferGeometry();
            const halfWidth = roofWidth / 2;
            const halfDepth = roofDepth / 2;
            
            const vertices = new Float32Array([
                // Front face
                -halfWidth, 0, -halfDepth,
                halfWidth, 0, -halfDepth,
                0, ridgeHeight, 0,
                // Right face
                halfWidth, 0, -halfDepth,
                halfWidth, 0, halfDepth,
                0, ridgeHeight, 0,
                // Back face
                halfWidth, 0, halfDepth,
                -halfWidth, 0, halfDepth,
                0, ridgeHeight, 0,
                // Left face
                -halfWidth, 0, halfDepth,
                -halfWidth, 0, -halfDepth,
                0, ridgeHeight, 0
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            const hipMaterial = this.materials.roof.clone();
            hipMaterial.side = THREE.DoubleSide;
            
            roofMesh = new THREE.Mesh(geometry, hipMaterial);
            roofMesh.position.set(roofCenterX, roofY, roofCenterZ);
        }
        
        if (roofMesh) {
            roofMesh.castShadow = true;
            roofMesh.receiveShadow = true;
            roofMesh.userData.isBuilding = true;
            roofMesh.userData.isRoof = true;
            roofMesh.userData.roofMaterial = 'asphalt-shingle';
            this.scene.add(roofMesh);
        }
    }
    
    generateRoof(floorplanData, gridSize, feetToMeters, roofY) {
        const topFloor = floorplanData.floors[floorplanData.floors.length - 1];
        
        // Calculate bounding box
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        topFloor.walls.forEach(wall => {
            const x1 = (wall.startX / gridSize) * feetToMeters;
            const z1 = (wall.startY / gridSize) * feetToMeters;
            const x2 = (wall.endX / gridSize) * feetToMeters;
            const z2 = (wall.endY / gridSize) * feetToMeters;
            minX = Math.min(minX, x1, x2);
            maxX = Math.max(maxX, x1, x2);
            minZ = Math.min(minZ, z1, z2);
            maxZ = Math.max(maxZ, z1, z2);
        });
        
        // Add overhang to dimensions
        const overhangMeters = this.roofOverhang * feetToMeters;
        const roofWidth = (maxX - minX) + (2 * overhangMeters);
        const roofDepth = (maxZ - minZ) + (2 * overhangMeters);
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        // Calculate roof height from pitch (pitch is rise per 12" run)
        // Height = (width / 2) * (pitch / 12)
        const roofHeight = (Math.max(roofWidth, roofDepth) / 2) * (this.roofPitch / 12);
        
        let roofMesh;
        
        if (this.roofStyle === 'flat') {
            // Flat roof - just a thin box
            const roofGeometry = new THREE.BoxGeometry(roofWidth, 0.3, roofDepth);
            roofMesh = new THREE.Mesh(roofGeometry, this.materials.roof);
            roofMesh.position.set(centerX, roofY + 0.15, centerZ);
            
        } else if (this.roofStyle === 'hip') {
            // Hip roof - rectangular pyramid (4-sided)
            const geometry = new THREE.BufferGeometry();
            
            // Create vertices for a rectangular pyramid
            // Base corners at roofY, apex at roofY + roofHeight
            const halfWidth = roofWidth / 2;
            const halfDepth = roofDepth / 2;
            
            const vertices = new Float32Array([
                // Front face (facing -Z)
                -halfWidth, 0, -halfDepth,  // bottom left
                halfWidth, 0, -halfDepth,   // bottom right
                0, roofHeight, 0,            // apex
                
                // Right face (facing +X)
                halfWidth, 0, -halfDepth,   // bottom front
                halfWidth, 0, halfDepth,    // bottom back
                0, roofHeight, 0,            // apex
                
                // Back face (facing +Z)
                halfWidth, 0, halfDepth,    // bottom right
                -halfWidth, 0, halfDepth,   // bottom left
                0, roofHeight, 0,            // apex
                
                // Left face (facing -X)
                -halfWidth, 0, halfDepth,   // bottom back
                -halfWidth, 0, -halfDepth,  // bottom front
                0, roofHeight, 0             // apex
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            // Create double-sided material for hip roof to prevent disappearing when viewed from above
            const hipRoofMaterial = this.materials.roof.clone();
            hipRoofMaterial.side = THREE.DoubleSide;
            
            roofMesh = new THREE.Mesh(geometry, hipRoofMaterial);
            roofMesh.position.set(centerX, roofY, centerZ);
            
        } else if (this.roofStyle === 'gable') {
            // Gable roof - triangular ends
            // Determine which direction is longer for ridge orientation
            const ridgeAlongX = roofWidth > roofDepth;
            
            if (ridgeAlongX) {
                // Ridge runs along X axis (width), triangular ends on Z axis (depth)
                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    // Front triangle
                    -roofWidth/2, 0, -roofDepth/2,
                    roofWidth/2, 0, -roofDepth/2,
                    0, roofHeight, -roofDepth/2,
                    
                    // Back triangle
                    -roofWidth/2, 0, roofDepth/2,
                    0, roofHeight, roofDepth/2,
                    roofWidth/2, 0, roofDepth/2,
                    
                    // Left slope
                    -roofWidth/2, 0, -roofDepth/2,
                    0, roofHeight, -roofDepth/2,
                    0, roofHeight, roofDepth/2,
                    
                    -roofWidth/2, 0, -roofDepth/2,
                    0, roofHeight, roofDepth/2,
                    -roofWidth/2, 0, roofDepth/2,
                    
                    // Right slope
                    roofWidth/2, 0, -roofDepth/2,
                    roofWidth/2, 0, roofDepth/2,
                    0, roofHeight, roofDepth/2,
                    
                    roofWidth/2, 0, -roofDepth/2,
                    0, roofHeight, roofDepth/2,
                    0, roofHeight, -roofDepth/2
                ]);
                
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.computeVertexNormals();
                
                // Create double-sided material for gable roof to prevent disappearing when viewed from above
                const gableRoofMaterial = this.materials.roof.clone();
                gableRoofMaterial.side = THREE.DoubleSide;
                
                roofMesh = new THREE.Mesh(geometry, gableRoofMaterial);
                roofMesh.position.set(centerX, roofY, centerZ);
                
            } else {
                // Ridge runs along Z axis (depth), triangular ends on X axis (width)
                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    // Front triangle
                    -roofWidth/2, 0, -roofDepth/2,
                    -roofWidth/2, 0, roofDepth/2,
                    -roofWidth/2, roofHeight, 0,
                    
                    // Back triangle
                    roofWidth/2, 0, -roofDepth/2,
                    roofWidth/2, roofHeight, 0,
                    roofWidth/2, 0, roofDepth/2,
                    
                    // Left slope
                    -roofWidth/2, 0, -roofDepth/2,
                    -roofWidth/2, roofHeight, 0,
                    roofWidth/2, roofHeight, 0,
                    
                    -roofWidth/2, 0, -roofDepth/2,
                    roofWidth/2, roofHeight, 0,
                    roofWidth/2, 0, -roofDepth/2,
                    
                    // Right slope
                    -roofWidth/2, 0, roofDepth/2,
                    roofWidth/2, 0, roofDepth/2,
                    roofWidth/2, roofHeight, 0,
                    
                    -roofWidth/2, 0, roofDepth/2,
                    roofWidth/2, roofHeight, 0,
                    -roofWidth/2, roofHeight, 0
                ]);
                
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.computeVertexNormals();
                
                // Create double-sided material for gable roof to prevent disappearing when viewed from above
                const gableRoofMaterial = this.materials.roof.clone();
                gableRoofMaterial.side = THREE.DoubleSide;
                
                roofMesh = new THREE.Mesh(geometry, gableRoofMaterial);
                roofMesh.position.set(centerX, roofY, centerZ);
            }
        }
        
        if (roofMesh) {
            roofMesh.castShadow = true;
            roofMesh.receiveShadow = true;
            roofMesh.userData.isBuilding = true;
            roofMesh.userData.isRoof = true;
            roofMesh.userData.roofMaterial = 'asphalt-shingle';
            this.scene.add(roofMesh);
        }
    }
    
    generateGableEndWalls(floorplanData, gridSize, feetToMeters, roofY) {
        if (this.roofStyle !== 'gable') return;
        
        const topFloor = floorplanData.floors[floorplanData.floors.length - 1];
        
        // Calculate bounding box to determine ridge orientation
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        topFloor.walls.forEach(wall => {
            const x1 = (wall.startX / gridSize) * feetToMeters;
            const z1 = (wall.startY / gridSize) * feetToMeters;
            const x2 = (wall.endX / gridSize) * feetToMeters;
            const z2 = (wall.endY / gridSize) * feetToMeters;
            minX = Math.min(minX, x1, x2);
            maxX = Math.max(maxX, x1, x2);
            minZ = Math.min(minZ, z1, z2);
            maxZ = Math.max(maxZ, z1, z2);
        });
        
        const overhangMeters = this.roofOverhang * feetToMeters;
        
        // Building dimensions WITHOUT overhang
        const buildingWidth = maxX - minX;
        const buildingDepth = maxZ - minZ;
        
        // Roof dimensions WITH overhang
        const roofWidth = buildingWidth + (2 * overhangMeters);
        const roofDepth = buildingDepth + (2 * overhangMeters);
        const roofHeight = (Math.max(roofWidth, roofDepth) / 2) * (this.roofPitch / 12);
        
        // Determine ridge orientation
        const ridgeAlongX = roofWidth > roofDepth;
        
        // For each wall, check if it's a gable end wall
        topFloor.walls.forEach((wall, wallIndex) => {
            const startX = (wall.startX / gridSize) * feetToMeters;
            const startZ = (wall.startY / gridSize) * feetToMeters;
            const endX = (wall.endX / gridSize) * feetToMeters;
            const endZ = (wall.endY / gridSize) * feetToMeters;
            
            const dx = endX - startX;
            const dz = endZ - startZ;
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);
            
            // Determine if this wall is perpendicular to the ridge
            // If ridge runs along X, gable ends are on walls perpendicular to X (parallel to Z axis)
            // If ridge runs along Z, gable ends are on walls perpendicular to Z (parallel to X axis)
            const isGableEnd = ridgeAlongX ? 
                (Math.abs(Math.sin(angle)) < 0.1) :   // Wall is mostly horizontal (perpendicular to ridge along X)
                (Math.abs(Math.cos(angle)) < 0.1);    // Wall is mostly vertical (perpendicular to ridge along Z)
            
            if (!isGableEnd) return;
            
            // Calculate the center position of the gable wall
            const centerX = (startX + endX) / 2;
            const centerZ = (startZ + endZ) / 2;
            
            // KEY FIX: Calculate distance from ROOF center (same as building center)
            const roofCenterX = (minX + maxX) / 2;
            const roofCenterZ = (minZ + maxZ) / 2;
            
            // Distance from gable wall to roof center
            const distanceFromRoofCenter = ridgeAlongX ? 
                Math.abs(centerZ - roofCenterZ) : 
                Math.abs(centerX - roofCenterX);
            
            // Use ROOF half-span for calculating triangle height
            const roofHalfSpan = ridgeAlongX ? roofDepth / 2 : roofWidth / 2;
            
            // Calculate triangle height - inversely proportional to distance from center
            // Formula creates linear slope: height = peak - (peak * distance/span)
            const triangleHeight = roofHeight - (roofHeight * (distanceFromRoofCenter / roofHalfSpan));
            
            if (triangleHeight <= 0.01) return;  // Small tolerance for floating point
            
            // Create triangular gable wall geometry - keep at original wall width
            const geometry = new THREE.BufferGeometry();
            const halfLength = length / 2;  // Original width, not extended
            
            // Triangle vertices: bottom-left, bottom-right, top-center
            const vertices = new Float32Array([
                // Front face
                -halfLength, 0, 0,
                halfLength, 0, 0,
                0, triangleHeight, 0,
                
                // Back face (for double-sided appearance)
                -halfLength, 0, 0,
                0, triangleHeight, 0,
                halfLength, 0, 0
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            const gableMesh = new THREE.Mesh(geometry, this.materials.wall);
            gableMesh.position.set(centerX, roofY, centerZ);
            gableMesh.rotation.y = angle;
            gableMesh.castShadow = true;
            gableMesh.receiveShadow = true;
            gableMesh.userData.isBuilding = true;
            gableMesh.userData.isWall = true;
            gableMesh.userData.wallMaterial = 'vinyl-siding';
            
            this.scene.add(gableMesh);
        });
    }
    
    generateRoofForFloor(floor, gridSize, feetToMeters, roofY) {
        // Get roof settings from this floor's data
        const roofStyle = floor.roofStyle || 'hip';
        const roofPitch = floor.roofPitch || 6;
        const roofOverhang = floor.roofOverhang || 1.0;
        
        // Calculate bounding box for THIS floor only
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        floor.walls.forEach(wall => {
            const x1 = (wall.startX / gridSize) * feetToMeters;
            const z1 = (wall.startY / gridSize) * feetToMeters;
            const x2 = (wall.endX / gridSize) * feetToMeters;
            const z2 = (wall.endY / gridSize) * feetToMeters;
            minX = Math.min(minX, x1, x2);
            maxX = Math.max(maxX, x1, x2);
            minZ = Math.min(minZ, z1, z2);
            maxZ = Math.max(maxZ, z1, z2);
        });
        
        // Add overhang to dimensions
        const overhangMeters = roofOverhang * feetToMeters;
        const roofWidth = (maxX - minX) + (2 * overhangMeters);
        const roofDepth = (maxZ - minZ) + (2 * overhangMeters);
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        // Calculate roof height from pitch
        const roofHeight = (Math.max(roofWidth, roofDepth) / 2) * (roofPitch / 12);
        
        let roofMesh;
        
        if (roofStyle === 'flat') {
            // Flat roof
            const roofGeometry = new THREE.BoxGeometry(roofWidth, 0.3, roofDepth);
            roofMesh = new THREE.Mesh(roofGeometry, this.materials.roof);
            roofMesh.position.set(centerX, roofY + 0.15, centerZ);
            
        } else if (roofStyle === 'hip') {
            // Hip roof - rectangular pyramid
            const geometry = new THREE.BufferGeometry();
            const halfWidth = roofWidth / 2;
            const halfDepth = roofDepth / 2;
            
            const vertices = new Float32Array([
                // Front face
                -halfWidth, 0, -halfDepth,
                halfWidth, 0, -halfDepth,
                0, roofHeight, 0,
                // Right face
                halfWidth, 0, -halfDepth,
                halfWidth, 0, halfDepth,
                0, roofHeight, 0,
                // Back face
                halfWidth, 0, halfDepth,
                -halfWidth, 0, halfDepth,
                0, roofHeight, 0,
                // Left face
                -halfWidth, 0, halfDepth,
                -halfWidth, 0, -halfDepth,
                0, roofHeight, 0
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            const hipRoofMaterial = this.materials.roof.clone();
            hipRoofMaterial.side = THREE.DoubleSide;
            
            roofMesh = new THREE.Mesh(geometry, hipRoofMaterial);
            roofMesh.position.set(centerX, roofY, centerZ);
            
        } else if (roofStyle === 'gable') {
            // Gable roof
            const ridgeAlongX = roofWidth > roofDepth;
            const geometry = new THREE.BufferGeometry();
            
            let vertices;
            if (ridgeAlongX) {
                const halfWidth = roofWidth / 2;
                const halfDepth = roofDepth / 2;
                vertices = new Float32Array([
                    // Front slope
                    -halfWidth, roofHeight, 0,
                    -halfWidth, 0, -halfDepth,
                    halfWidth, 0, -halfDepth,
                    -halfWidth, roofHeight, 0,
                    halfWidth, 0, -halfDepth,
                    halfWidth, roofHeight, 0,
                    // Back slope
                    -halfWidth, roofHeight, 0,
                    halfWidth, 0, halfDepth,
                    -halfWidth, 0, halfDepth,
                    -halfWidth, roofHeight, 0,
                    halfWidth, roofHeight, 0,
                    halfWidth, 0, halfDepth
                ]);
            } else {
                const halfWidth = roofWidth / 2;
                const halfDepth = roofDepth / 2;
                vertices = new Float32Array([
                    // Left slope
                    0, roofHeight, -halfDepth,
                    -halfWidth, 0, -halfDepth,
                    -halfWidth, 0, halfDepth,
                    0, roofHeight, -halfDepth,
                    -halfWidth, 0, halfDepth,
                    0, roofHeight, halfDepth,
                    // Right slope
                    0, roofHeight, -halfDepth,
                    halfWidth, 0, halfDepth,
                    halfWidth, 0, -halfDepth,
                    0, roofHeight, -halfDepth,
                    0, roofHeight, halfDepth,
                    halfWidth, 0, halfDepth
                ]);
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            const gableRoofMaterial = this.materials.roof.clone();
            gableRoofMaterial.side = THREE.DoubleSide;
            
            roofMesh = new THREE.Mesh(geometry, gableRoofMaterial);
            roofMesh.position.set(centerX, roofY, centerZ);
        }
        
        if (roofMesh) {
            roofMesh.castShadow = true;
            roofMesh.receiveShadow = true;
            roofMesh.userData.isBuilding = true;
            roofMesh.userData.isRoof = true;
            roofMesh.userData.roofMaterial = 'asphalt-shingle';
            this.scene.add(roofMesh);
        }
    }
    
    generateGableEndWallsForFloor(floor, gridSize, feetToMeters, roofY) {
        const roofStyle = floor.roofStyle || 'hip';
        if (roofStyle !== 'gable') return;
        
        const roofPitch = floor.roofPitch || 6;
        const roofOverhang = floor.roofOverhang || 1.0;
        
        // Calculate bounding box
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        floor.walls.forEach(wall => {
            const x1 = (wall.startX / gridSize) * feetToMeters;
            const z1 = (wall.startY / gridSize) * feetToMeters;
            const x2 = (wall.endX / gridSize) * feetToMeters;
            const z2 = (wall.endY / gridSize) * feetToMeters;
            minX = Math.min(minX, x1, x2);
            maxX = Math.max(maxX, x1, x2);
            minZ = Math.min(minZ, z1, z2);
            maxZ = Math.max(maxZ, z1, z2);
        });
        
        const overhangMeters = roofOverhang * feetToMeters;
        
        // Building dimensions WITHOUT overhang
        const buildingWidth = maxX - minX;
        const buildingDepth = maxZ - minZ;
        
        // Roof dimensions WITH overhang
        const roofWidth = buildingWidth + (2 * overhangMeters);
        const roofDepth = buildingDepth + (2 * overhangMeters);
        
        // Calculate roof height based on the FULL roof span (including overhang)
        const roofHeight = (Math.max(roofWidth, roofDepth) / 2) * (roofPitch / 12);
        
        const ridgeAlongX = roofWidth > roofDepth;
        
        // Generate gable end walls
        floor.walls.forEach((wall, wallIndex) => {
            const startX = (wall.startX / gridSize) * feetToMeters;
            const startZ = (wall.startY / gridSize) * feetToMeters;
            const endX = (wall.endX / gridSize) * feetToMeters;
            const endZ = (wall.endY / gridSize) * feetToMeters;
            
            const dx = endX - startX;
            const dz = endZ - startZ;
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);
            
            const isGableEnd = ridgeAlongX ? 
                (Math.abs(Math.cos(angle)) < 0.5) : 
                (Math.abs(Math.sin(angle)) < 0.5);
            
            if (!isGableEnd) return;
            
            const centerX = (startX + endX) / 2;
            const centerZ = (startZ + endZ) / 2;
            
            // KEY FIX: Calculate distance from ROOF center (same as building center)
            const roofCenterX = (minX + maxX) / 2;
            const roofCenterZ = (minZ + maxZ) / 2;
            
            // Distance from the gable wall to the roof center
            const distanceFromRoofCenter = ridgeAlongX ? 
                Math.abs(centerZ - roofCenterZ) : 
                Math.abs(centerX - roofCenterX);
            
            // Use ROOF half-span for calculation
            const roofHalfSpan = ridgeAlongX ? roofDepth / 2 : roofWidth / 2;
            
            // Calculate triangle height from roof center
            // At the building edge, we're (buildingHalfSpan) away from roof center
            // Roof extends (roofHalfSpan) from roof center
            // Formula: height = roofHeight - (roofHeight * distance/span)
            // This creates a linear slope from peak (roofHeight at center) to edge (0 at roofHalfSpan)
            const triangleHeight = roofHeight - (roofHeight * (distanceFromRoofCenter / roofHalfSpan));
            
            if (triangleHeight <= 0.01) return;  // Small tolerance for floating point
            
            const geometry = new THREE.BufferGeometry();
            const halfLength = length / 2;  // Keep wall at ORIGINAL width
            
            const vertices = new Float32Array([
                // Front face - keep wall at original width (aligned with building)
                -halfLength, 0, 0,
                halfLength, 0, 0,
                0, triangleHeight, 0,
                // Back face
                -halfLength, 0, 0,
                0, triangleHeight, 0,
                halfLength, 0, 0
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            const gableMesh = new THREE.Mesh(geometry, this.materials.wall);
            gableMesh.position.set(centerX, roofY, centerZ);
            gableMesh.rotation.y = angle;
            gableMesh.castShadow = true;
            gableMesh.receiveShadow = true;
            gableMesh.userData.isBuilding = true;
            gableMesh.userData.isWall = true;
            gableMesh.userData.wallMaterial = 'vinyl-siding';
            
            this.scene.add(gableMesh);
        });
    }
    
    clearBuilding() {
        const objectsToRemove = [];
        this.scene.children.forEach(child => {
            if (child.userData.isBuilding) {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        });
    }
    
    updateStats(floorplanData) {
        const totalWalls = floorplanData.floors.reduce((sum, f) => sum + f.walls.length, 0);
        const totalDoors = floorplanData.floors.reduce((sum, f) => sum + f.doors.length, 0);
        const totalWindows = floorplanData.floors.reduce((sum, f) => sum + f.windows.length, 0);
        
        document.getElementById('stat-floors').textContent = floorplanData.floors.length;
        document.getElementById('stat-walls').textContent = totalWalls;
        document.getElementById('stat-doors').textContent = totalDoors;
        document.getElementById('stat-windows').textContent = totalWindows;
    }
    
    setWallHeight(height) {
        this.wallHeight = height;
    }
    
    setShowRoof(show) {
        this.showRoof = show;
    }
    
    setRoofStyle(style) {
        this.roofStyle = style;
    }
    
    setRoofPitch(pitch) {
        this.roofPitch = pitch;
    }
    
    setRoofOverhang(overhang) {
        this.roofOverhang = overhang;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Capture a clean screenshot without grid lines or helpers for AI upscaling
     * @returns {string} Data URL of the clean screenshot
     */
    captureCleanScreenshot() {
        console.log('📸 Capturing clean screenshot (hiding grid and helpers)...');
        
        // Store original visibility states
        const originalGridVisibility = this.gridHelper.visible;
        
        // Hide grid and any other helpers
        this.gridHelper.visible = false;
        
        // Render one clean frame
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        
        // Capture screenshot
        const dataURL = this.renderer.domElement.toDataURL('image/png', 1.0);
        
        // Restore original visibility states
        this.gridHelper.visible = originalGridVisibility;
        
        // Render again to restore normal view
        this.renderer.render(this.scene, this.camera);
        
        console.log('✅ Clean screenshot captured, grid restored');
        return dataURL;
    }

    /**
     * Capture enhanced screenshot with architectural details for AI generation
     * This adds temporary window frames, door panels, roof lines, etc.
     * @param {THREE.Camera} camera - The camera to render from
     * @param {string} angleName - Name of the angle (for logging)
     * @returns {string} - Data URL of the captured screenshot
     */
    async captureEnhancedScreenshotForAI(camera, angleName) {
        console.log(`📸 Capturing enhanced AI reference: ${angleName}`);
        
        // Store original renderer settings
        const originalSize = new THREE.Vector2();
        this.renderer.getSize(originalSize);
        const originalPixelRatio = this.renderer.getPixelRatio();
        const originalShadows = this.renderer.shadowMap.enabled;
        const originalGridVisibility = this.gridHelper.visible;
        
        // Enhance rendering quality temporarily
        this.renderer.setSize(2048, 2048);  // High resolution
        this.renderer.setPixelRatio(2);  // Sharper details
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Hide grid for clean capture
        this.gridHelper.visible = false;
        
        // Array to store temporary objects for cleanup
        const tempObjects = [];
        
        // Add architectural details to all objects in scene
        this.scene.traverse((object) => {
            // Add window details
            if (object.userData.isBuilding && object.userData.isWindow) {
                const windowDetails = this.addWindowDetails(object);
                tempObjects.push(...windowDetails);
            }
            
            // Add door details
            if (object.userData.isBuilding && object.userData.isDoor) {
                const doorDetails = this.addDoorDetails(object);
                tempObjects.push(...doorDetails);
            }
            
            // Add roof texture lines
            if (object.userData.isBuilding && object.userData.isRoof) {
                const roofDetails = this.addRoofDetails(object);
                tempObjects.push(...roofDetails);
            }
            
            // Add wall siding lines
            if (object.userData.isBuilding && object.userData.isWall) {
                const sidingLines = this.addSidingLines(object);
                tempObjects.push(...sidingLines);
            }
            
            // Add edge lines for clarity
            if (object.userData.isBuilding && object.isMesh && object.geometry) {
                const edges = new THREE.EdgesGeometry(object.geometry, 15);
                const line = new THREE.LineSegments(
                    edges,
                    new THREE.LineBasicMaterial({ 
                        color: 0x000000, 
                        linewidth: 2,
                        transparent: true,
                        opacity: 0.8
                    })
                );
                object.add(line);
                tempObjects.push(line);
            }
        });
        
        // Render the enhanced scene
        this.controls.update();
        this.renderer.render(this.scene, camera);
        
        // Capture as high-quality PNG
        const dataUrl = this.renderer.domElement.toDataURL('image/png', 1.0);
        
        // RESTORE original settings
        this.renderer.setSize(originalSize.x, originalSize.y);
        this.renderer.setPixelRatio(originalPixelRatio);
        this.renderer.shadowMap.enabled = originalShadows;
        this.gridHelper.visible = originalGridVisibility;
        
        // Remove ALL temporary objects
        tempObjects.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        
        console.log(`✅ Enhanced screenshot captured: ${(dataUrl.length / 1024).toFixed(1)}KB`);
        return dataUrl;
    }

    /**
     * Add detailed window frames, glass, and mullions
     */
    addWindowDetails(windowObject) {
        const details = [];
        
        // Get window dimensions
        const bbox = new THREE.Box3().setFromObject(windowObject);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const width = size.x || 1;
        const height = size.y || 1.5;
        const depth = 0.15;
        
        // Window frame material (dark trim)
        const frameThickness = 0.08;
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c,  // Dark gray/black
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Top frame
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, depth),
            frameMaterial
        );
        topFrame.position.copy(windowObject.position);
        topFrame.position.y += height/2 + frameThickness/2;
        topFrame.rotation.copy(windowObject.rotation);
        this.scene.add(topFrame);
        details.push(topFrame);
        
        // Bottom frame
        const bottomFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, depth),
            frameMaterial
        );
        bottomFrame.position.copy(windowObject.position);
        bottomFrame.position.y -= height/2 + frameThickness/2;
        bottomFrame.rotation.copy(windowObject.rotation);
        this.scene.add(bottomFrame);
        details.push(bottomFrame);
        
        // Left frame
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, height, depth),
            frameMaterial
        );
        leftFrame.position.copy(windowObject.position);
        leftFrame.position.x -= width/2 + frameThickness/2;
        leftFrame.rotation.copy(windowObject.rotation);
        this.scene.add(leftFrame);
        details.push(leftFrame);
        
        // Right frame
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, height, depth),
            frameMaterial
        );
        rightFrame.position.copy(windowObject.position);
        rightFrame.position.x += width/2 + frameThickness/2;
        rightFrame.rotation.copy(windowObject.rotation);
        this.scene.add(rightFrame);
        details.push(rightFrame);
        
        // Mullion material (window dividers)
        const mullionMaterial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 0.6
        });
        
        // Vertical mullion (center)
        const verticalMullion = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, height, depth),
            mullionMaterial
        );
        verticalMullion.position.copy(windowObject.position);
        verticalMullion.rotation.copy(windowObject.rotation);
        this.scene.add(verticalMullion);
        details.push(verticalMullion);
        
        // Horizontal mullion (center)
        const horizontalMullion = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.04, depth),
            mullionMaterial
        );
        horizontalMullion.position.copy(windowObject.position);
        horizontalMullion.rotation.copy(windowObject.rotation);
        this.scene.add(horizontalMullion);
        details.push(horizontalMullion);
        
        // Update window to be semi-transparent glass
        if (windowObject.material) {
            const originalMaterial = windowObject.material;
            windowObject.material = new THREE.MeshPhysicalMaterial({
                color: 0x88ccff,  // Blue tint
                transparent: true,
                opacity: 0.3,
                roughness: 0.1,
                metalness: 0.1,
                transmission: 0.9,
                thickness: 0.01
            });
            // Store original to restore later
            windowObject.userData.originalMaterial = originalMaterial;
        }
        
        return details;
    }

    /**
     * Add door frame, panels, and handle
     */
    addDoorDetails(doorObject) {
        const details = [];
        
        // Get door dimensions
        const bbox = new THREE.Box3().setFromObject(doorObject);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const width = size.x || 1;
        const height = size.y || 2.2;
        const depth = 0.15;
        
        // Door frame (white trim)
        const frameThickness = 0.1;
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,  // White
            roughness: 0.6
        });
        
        // Top frame
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, depth),
            frameMaterial
        );
        topFrame.position.copy(doorObject.position);
        topFrame.position.y += height/2 + frameThickness/2;
        topFrame.rotation.copy(doorObject.rotation);
        this.scene.add(topFrame);
        details.push(topFrame);
        
        // Left frame
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, height + frameThickness, depth),
            frameMaterial
        );
        leftFrame.position.copy(doorObject.position);
        leftFrame.position.x -= width/2 + frameThickness/2;
        leftFrame.rotation.copy(doorObject.rotation);
        this.scene.add(leftFrame);
        details.push(leftFrame);
        
        // Right frame
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, height + frameThickness, depth),
            frameMaterial
        );
        rightFrame.position.copy(doorObject.position);
        rightFrame.position.x += width/2 + frameThickness/2;
        rightFrame.rotation.copy(doorObject.rotation);
        this.scene.add(rightFrame);
        details.push(rightFrame);
        
        // Door panel material (wood)
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,  // Brown wood
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Add 2x2 grid of raised panels
        const panelWidth = width * 0.35;
        const panelHeight = height * 0.35;
        const panelDepth = 0.05;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const panel = new THREE.Mesh(
                    new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth),
                    panelMaterial
                );
                panel.position.copy(doorObject.position);
                panel.position.x += (col - 0.5) * panelWidth * 1.3;
                panel.position.y += (0.5 - row) * panelHeight * 1.3;
                panel.position.z += depth/2 + panelDepth/2;
                panel.rotation.copy(doorObject.rotation);
                this.scene.add(panel);
                details.push(panel);
            }
        }
        
        // Door handle (silver/chrome)
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.2,
            metalness: 0.9
        });
        
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8),
            handleMaterial
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.copy(doorObject.position);
        handle.position.x += width * 0.35;
        handle.position.z += depth/2 + 0.05;
        this.scene.add(handle);
        details.push(handle);
        
        // Update door material to wood
        if (doorObject.material) {
            const originalMaterial = doorObject.material;
            doorObject.material = panelMaterial.clone();
            doorObject.userData.originalMaterial = originalMaterial;
        }
        
        return details;
    }

    /**
     * Add roof texture lines (shingles or metal seams)
     */
    addRoofDetails(roofObject) {
        const details = [];
        
        // Get roof dimensions
        const bbox = new THREE.Box3().setFromObject(roofObject);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        
        // Get roof material type
        const roofType = roofObject.userData.roofMaterial || 'asphalt-shingle';
        
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 1,
            transparent: true,
            opacity: 0.6
        });
        
        if (roofType === 'asphalt-shingle' || roofType === 'slate' || roofType === 'clay-tile' || roofType === 'wood-shake') {
            // Horizontal shingle lines
            const numLines = Math.floor(size.y / 0.3);
            
            for (let i = 1; i < numLines; i++) {
                const y = bbox.min.y + i * 0.3;
                const points = [
                    new THREE.Vector3(bbox.min.x, y, bbox.max.z + 0.05),
                    new THREE.Vector3(bbox.max.x, y, bbox.max.z + 0.05)
                ];
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.scene.add(line);
                details.push(line);
            }
        } else if (roofType === 'metal') {
            // Vertical standing seam lines
            const numSeams = Math.floor(size.x / 0.6);
            
            for (let i = 1; i < numSeams; i++) {
                const x = bbox.min.x + i * 0.6;
                const points = [
                    new THREE.Vector3(x, bbox.min.y, bbox.max.z + 0.05),
                    new THREE.Vector3(x, bbox.max.y, bbox.max.z + 0.05)
                ];
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.scene.add(line);
                details.push(line);
            }
        }
        
        return details;
    }

    /**
     * Add horizontal siding lines to walls
     */
    addSidingLines(wallObject) {
        const details = [];
        
        // Get wall dimensions
        const bbox = new THREE.Box3().setFromObject(wallObject);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        
        const wallType = wallObject.userData.wallMaterial || '';
        
        // Only add lines for siding materials
        if (wallType === 'vinyl-siding' || wallType === 'wood-siding') {
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: 1,
                transparent: true,
                opacity: 0.4
            });
            
            // Horizontal siding lines every 20cm
            const lineSpacing = 0.2;
            const numLines = Math.floor(size.y / lineSpacing);
            
            for (let i = 1; i < numLines; i++) {
                const y = bbox.min.y + i * lineSpacing;
                const points = [
                    new THREE.Vector3(bbox.min.x, y, bbox.max.z + 0.05),
                    new THREE.Vector3(bbox.max.x, y, bbox.max.z + 0.05)
                ];
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.scene.add(line);
                details.push(line);
            }
        }
        
        return details;
    }
    
    onWindowResize() {
        if (!this.canvas) return;
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
}

