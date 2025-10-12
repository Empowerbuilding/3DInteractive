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
        
        // 3D Settings
        this.wallHeight = 8; // feet
        this.wallThickness = 0.33; // feet (4 inches)
        this.showRoof = true;
        this.roofStyle = 'hip'; // 'hip', 'gable', or 'flat'
        this.roofPitch = 6; // pitch ratio (6:12 means 6" rise per 12" run)
        this.roofOverhang = 1; // feet
        
        // Materials
        this.materials = {
            wall: null,
            floor: null,
            ceiling: null,
            door: null,
            window: null,
            roof: null,
            patio: null
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
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 150;
        
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
        const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x888888);
        this.scene.add(gridHelper);
        
        // Initialize materials
        this.initMaterials();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('✅ Three.js Scene Initialized');
    }
    
    initMaterials() {
        this.materials.wall = new THREE.MeshStandardMaterial({ 
            color: 0xe8dcc4,
            roughness: 0.7 
        });
        
        this.materials.floor = new THREE.MeshStandardMaterial({ 
            color: 0xd4a574,
            roughness: 0.8 
        });
        
        this.materials.ceiling = new THREE.MeshStandardMaterial({ 
            color: 0xf5f5f5,
            roughness: 0.9 
        });
        
        this.materials.door = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.5 
        });
        
        this.materials.window = new THREE.MeshStandardMaterial({ 
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.5
        });
        
        this.materials.roof = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.9 
        });
        
        this.materials.patio = new THREE.MeshStandardMaterial({ 
            color: 0xa0826d,
            roughness: 0.8 
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
                
                // Create door mesh
                const doorGeometry = new THREE.BoxGeometry(
                    opening.width,
                    opening.height,
                    this.wallThickness * feetToMeters * 0.5
                );
                const doorMesh = new THREE.Mesh(doorGeometry, this.materials.door);
                const doorPosX = startX + dx * opening.pos;
                const doorPosZ = startZ + dz * opening.pos;
                doorMesh.position.set(
                    doorPosX,
                    yOffset + opening.height / 2,
                    doorPosZ
                );
                doorMesh.rotation.y = angle;
                doorMesh.castShadow = true;
                doorMesh.userData.isBuilding = true;
                this.scene.add(doorMesh);
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
                
                // Window glass
                const windowGeometry = new THREE.BoxGeometry(
                    opening.width,
                    opening.height,
                    this.wallThickness * feetToMeters * 0.3
                );
                const windowMesh = new THREE.Mesh(windowGeometry, this.materials.window);
                const windowPosX = startX + dx * opening.pos;
                const windowPosZ = startZ + dz * opening.pos;
                windowMesh.position.set(
                    windowPosX,
                    yOffset + opening.bottomOffset + opening.height / 2,
                    windowPosZ
                );
                windowMesh.rotation.y = angle;
                windowMesh.userData.isBuilding = true;
                this.scene.add(windowMesh);
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
                this.generatePatioRoof(patio, x, z, width, depth, centerX, centerZ, yOffset, feetToMeters);
            }
        });
    }
    
    generatePatioRoof(patio, x, z, width, depth, centerX, centerZ, yOffset, feetToMeters) {
        const roofHeight = (patio.roofHeight || 8) * feetToMeters;
        const roofStyle = patio.roofStyle || 'flat';
        const postRadius = 0.1; // meters (about 4 inches)
        const postHeight = roofHeight - 0.3; // Slightly lower than roof height
        
        // Create 4 support posts at corners
        const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.8 
        });
        
        const postPositions = [
            { x: x + 0.3, z: z + 0.3 },           // Front-left
            { x: x + width - 0.3, z: z + 0.3 },  // Front-right
            { x: x + 0.3, z: z + depth - 0.3 },  // Back-left
            { x: x + width - 0.3, z: z + depth - 0.3 }  // Back-right
        ];
        
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
        const roofWidth = width + (overhang * 2);
        const roofDepth = depth + (overhang * 2);
        
        let roofMesh;
        
        if (roofStyle === 'flat') {
            // Flat roof
            const roofGeometry = new THREE.BoxGeometry(roofWidth, 0.2, roofDepth);
            roofMesh = new THREE.Mesh(roofGeometry, this.materials.roof);
            roofMesh.position.set(centerX, roofY + 0.1, centerZ);
            
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
            roofMesh.position.set(centerX, roofY, centerZ);
            
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
            roofMesh.position.set(centerX, roofY, centerZ);
        }
        
        if (roofMesh) {
            roofMesh.castShadow = true;
            roofMesh.receiveShadow = true;
            roofMesh.userData.isBuilding = true;
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
        const roofWidth = (maxX - minX) + (2 * overhangMeters);
        const roofDepth = (maxZ - minZ) + (2 * overhangMeters);
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
            
            // Determine distance from center for height calculation
            const distanceFromCenter = ridgeAlongX ? 
                Math.abs(centerZ - (minZ + maxZ) / 2) : 
                Math.abs(centerX - (minX + maxX) / 2);
            
            const buildingHalfSpan = ridgeAlongX ? 
                (maxZ - minZ) / 2 : 
                (maxX - minX) / 2;
            
            // Calculate triangle height at this wall position
            const triangleHeight = roofHeight * (1 - (distanceFromCenter / buildingHalfSpan));
            
            if (triangleHeight <= 0) return;
            
            // Create triangular gable wall geometry
            const geometry = new THREE.BufferGeometry();
            const halfLength = length / 2;
            
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
        const roofWidth = (maxX - minX) + (2 * overhangMeters);
        const roofDepth = (maxZ - minZ) + (2 * overhangMeters);
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
            
            const distanceFromCenter = ridgeAlongX ? 
                Math.abs(centerZ - (minZ + maxZ) / 2) : 
                Math.abs(centerX - (minX + maxX) / 2);
            
            const buildingHalfSpan = ridgeAlongX ? 
                (maxZ - minZ) / 2 : 
                (maxX - minX) / 2;
            
            const triangleHeight = roofHeight * (1 - (distanceFromCenter / buildingHalfSpan));
            
            if (triangleHeight <= 0) return;
            
            const geometry = new THREE.BufferGeometry();
            const halfLength = length / 2;
            
            const vertices = new Float32Array([
                // Front face
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
    
    onWindowResize() {
        if (!this.canvas) return;
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
}

