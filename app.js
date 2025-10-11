// 3D Home Designer Application
// Uses Three.js ES6 modules

import { FloorPlanEditor } from './floorplan-editor.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// n8n webhook URL for AI image generation
const N8N_WEBHOOK_URL = 'https://n8n.empowerbuilding.ai/webhook/4239cad4-0815-4c94-a526-f4335b175aed';

class HomeDesigner {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.house = null;
        this.groundPlane = null;
        this.gridHelper = null;
        
        // Design parameters
        this.params = {
            houseWidth: 40,
            houseDepth: 30,
            numStories: 1,
            houseShape: 'rectangle',
            roofStyle: 'gable',
            wallMaterial: 'wood-siding',
            roofMaterial: 'asphalt-shingle',
            numWindows: 8,
            frontDoorPosition: 'center',
            frontDoorType: 'single',
            leftSideDoor: 'none',
            rightSideDoor: 'none',
            backDoor: 'none',
            garageEntryDoor: true,
            frontPorch: 'none',
            backPorch: 'none',
            addChimney: false,
            garageType: 'none'
        };

        // Initialize 2D floor plan editor
        this.floorPlanEditor = new FloorPlanEditor('floor-plan-canvas');
        console.log('Floor Plan Editor initialized');

        // Listen for floor plan updates
        document.addEventListener('floorplan-updated', (e) => {
            console.log('Floor plan updated event received:', e.detail);
            // TODO: Will connect to 3D in next step
        });

        // Material definitions with realistic properties
        this.materials = {
            wall: {
                'brick': { color: 0x8B4513, roughness: 0.9, metalness: 0.0 },
                'wood-siding': { color: 0xD2691E, roughness: 0.8, metalness: 0.0 },
                'stucco': { color: 0xF5DEB3, roughness: 0.95, metalness: 0.0 },
                'stone': { color: 0x808080, roughness: 0.85, metalness: 0.0 },
                'vinyl-siding': { color: 0xE8E8E8, roughness: 0.6, metalness: 0.1 }
            },
            roof: {
                'asphalt-shingle': { color: 0x404040, roughness: 0.9, metalness: 0.0 },
                'metal': { color: 0x708090, roughness: 0.3, metalness: 0.8 },
                'clay-tile': { color: 0xCD5C5C, roughness: 0.7, metalness: 0.0 },
                'slate': { color: 0x2F4F4F, roughness: 0.6, metalness: 0.1 },
                'wood-shake': { color: 0x8B7355, roughness: 0.85, metalness: 0.0 }
            }
        };

        this.initScene();
        this.buildHome();
        this.setupEventListeners();
        this.setupViewControls();
        this.updateInfoPanel();
        this.animate();
    }

    initScene() {
        const container = document.querySelector('.canvas-3d-container');
        const canvas = document.getElementById('three-canvas');

        // Create Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Create PerspectiveCamera positioned at (50, 30, 50) looking at origin
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);

        // Create WebGLRenderer with antialias and preserveDrawingBuffer for screenshots
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create OrbitControls for camera movement
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 200;

        // Ambient light (0.6 intensity)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (0.8 intensity) with shadows enabled
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 80, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -80;
        directionalLight.shadow.camera.right = 80;
        directionalLight.shadow.camera.top = 80;
        directionalLight.shadow.camera.bottom = -80;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Green ground plane (200x200) that receives shadows
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 }); // Light green
        this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.receiveShadow = true;
        this.scene.add(this.groundPlane);

        // Grid helper (optional, for reference)
        this.gridHelper = new THREE.GridHelper(200, 40, 0x999999, 0xcccccc);
        this.scene.add(this.gridHelper);

        // Empty Group called "house" to hold all building components
        this.house = new THREE.Group();
        this.scene.add(this.house);

        // Window resize handler to maintain aspect ratio
        window.addEventListener('resize', () => this.onWindowResize());
    }

    buildHome() {
        // Clear existing house components
        while (this.house.children.length > 0) {
            this.house.remove(this.house.children[0]);
        }

        // Convert feet to meters (1 foot = 0.3048 meters, using simplified 0.3 for easier visualization)
        const widthMeters = this.params.houseWidth * 0.3;
        const depthMeters = this.params.houseDepth * 0.3;
        const storyHeight = 10; // feet per story
        const storyHeightMeters = storyHeight * 0.3;
        const totalHeight = this.params.numStories * storyHeightMeters;

        // Build house based on selected shape
        this.buildHouseByShape(widthMeters, depthMeters, storyHeightMeters, totalHeight);

        // Build garage if selected (position depends on shape)
        if (this.params.garageType !== 'none') {
            const garage = this.buildGarage(widthMeters, depthMeters, storyHeightMeters);
            this.house.add(garage);
        }

        // Build front porch if selected (on main section)
        if (this.params.frontPorch !== 'none') {
            const porch = this.createPorch(this.params.frontPorch, widthMeters, depthMeters, this.params.frontDoorPosition);
            this.house.add(porch);
        }

        // Build back porch/deck if selected
        if (this.params.backPorch !== 'none') {
            // Determine back door position
            let backDoorPos = 'center';
            if (this.params.backDoor.includes('left')) backDoorPos = 'left';
            else if (this.params.backDoor.includes('right')) backDoorPos = 'right';
            
            const backPorch = this.createBackPorch(this.params.backPorch, widthMeters, depthMeters, storyHeightMeters, backDoorPos);
            this.house.add(backPorch);
        }

        // Build chimney if selected
        if (this.params.addChimney) {
            const chimney = this.createChimney(widthMeters, depthMeters, totalHeight, this.params.roofStyle);
            this.house.add(chimney);
        }

        // Build all doors based on selections
        this.buildAllDoors(widthMeters, depthMeters, storyHeightMeters);
    }

    buildHouseByShape(width, depth, storyHeight, totalHeight) {
        switch (this.params.houseShape) {
            case 'rectangle':
                this.buildRectangle(width, depth, storyHeight, totalHeight);
                break;
            case 'l-shape':
                this.buildLShape(width, depth, storyHeight, totalHeight);
                break;
            case 't-shape':
                this.buildTShape(width, depth, storyHeight, totalHeight);
                break;
            case 'u-shape':
                this.buildUShape(width, depth, storyHeight, totalHeight);
                break;
            case 'with-wings':
                this.buildWithWings(width, depth, storyHeight, totalHeight);
                break;
            case 'courtyard':
                this.buildCourtyard(width, depth, storyHeight, totalHeight);
                break;
        }
    }

    buildRectangle(width, depth, storyHeight, totalHeight) {
        // Original simple rectangle - main house
        this.buildSection(width, depth, storyHeight, totalHeight, 0, 0, 'main');
    }

    buildLShape(width, depth, storyHeight, totalHeight) {
        // Main section
        this.buildSection(width, depth, storyHeight, totalHeight, 0, 0, 'main');
        
        // Left wing (90-degree angle)
        const wingWidth = width * 0.6;
        const wingDepth = depth * 0.5;
        const wingX = -width / 2 - wingWidth / 2;
        const wingZ = -depth / 2 + wingDepth / 2;
        this.buildSection(wingWidth, wingDepth, storyHeight, totalHeight, wingX, wingZ, 'wing');
    }

    buildTShape(width, depth, storyHeight, totalHeight) {
        // Main section (back)
        this.buildSection(width, depth, storyHeight, totalHeight, 0, -depth * 0.2, 'main');
        
        // Front extension (centered)
        const extensionWidth = width * 0.4;
        const extensionDepth = depth * 0.6;
        const extensionZ = depth / 2 + extensionDepth / 2 - depth * 0.2;
        this.buildSection(extensionWidth, extensionDepth, storyHeight, totalHeight, 0, extensionZ, 'extension');
    }

    buildUShape(width, depth, storyHeight, totalHeight) {
        // Center section
        const centerDepth = depth * 0.6;
        this.buildSection(width, centerDepth, storyHeight, totalHeight, 0, 0, 'center');
        
        // Left wing
        const wingWidth = width * 0.3;
        const leftWingX = -width / 2 + wingWidth / 2;
        const wingZ = depth / 2 - depth * 0.2;
        this.buildSection(wingWidth, depth, storyHeight, totalHeight, leftWingX, wingZ, 'left-wing');
        
        // Right wing
        const rightWingX = width / 2 - wingWidth / 2;
        this.buildSection(wingWidth, depth, storyHeight, totalHeight, rightWingX, wingZ, 'right-wing');
    }

    buildWithWings(width, depth, storyHeight, totalHeight) {
        // Center main section
        const centerWidth = width * 0.5;
        this.buildSection(centerWidth, depth, storyHeight, totalHeight, 0, 0, 'center');
        
        // Left wing
        const wingWidth = width * 0.25;
        const wingDepth = depth * 0.7;
        const leftWingX = -centerWidth / 2 - wingWidth / 2;
        this.buildSection(wingWidth, wingDepth, storyHeight, totalHeight, leftWingX, 0, 'left-wing');
        
        // Right wing
        const rightWingX = centerWidth / 2 + wingWidth / 2;
        this.buildSection(wingWidth, wingDepth, storyHeight, totalHeight, rightWingX, 0, 'right-wing');
    }

    buildCourtyard(width, depth, storyHeight, totalHeight) {
        // Front section
        const frontDepth = depth * 0.3;
        const frontZ = depth / 2 - frontDepth / 2;
        this.buildSection(width, frontDepth, storyHeight, totalHeight, 0, frontZ, 'front');
        
        // Back section
        const backZ = -depth / 2 + frontDepth / 2;
        this.buildSection(width, frontDepth, storyHeight, totalHeight, 0, backZ, 'back');
        
        // Left section
        const sideWidth = width * 0.3;
        const sideDepth = depth * 0.4;
        const leftX = -width / 2 + sideWidth / 2;
        this.buildSection(sideWidth, sideDepth, storyHeight, totalHeight, leftX, 0, 'left');
        
        // Right section
        const rightX = width / 2 - sideWidth / 2;
        this.buildSection(sideWidth, sideDepth, storyHeight, totalHeight, rightX, 0, 'right');
    }

    buildSection(width, depth, storyHeight, totalHeight, offsetX, offsetZ, sectionType) {
        const sectionGroup = new THREE.Group();
        sectionGroup.position.set(offsetX, 0, offsetZ);
        
        // Build walls and floors for each story
        for (let i = 0; i < this.params.numStories; i++) {
            const story = this.buildStory(width, depth, storyHeight, i);
            sectionGroup.add(story);
        }
        
        // Build roof for this section
        const roof = this.buildRoof(width, depth, totalHeight);
        sectionGroup.add(roof);
        
        this.house.add(sectionGroup);
    }

    buildStory(width, depth, height, storyIndex) {
        const storyGroup = new THREE.Group();
        const yOffset = storyIndex * height;

        // Get material properties
        const wallMatProps = this.materials.wall[this.params.wallMaterial];
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: wallMatProps.color,
            roughness: wallMatProps.roughness,
            metalness: wallMatProps.metalness
        });

        const wallThickness = 0.3;

        // Front wall
        const frontWall = this.createWall(width, height, wallThickness, wallMaterial);
        frontWall.position.set(0, yOffset + height / 2, depth / 2);
        storyGroup.add(frontWall);

        // Back wall
        const backWall = this.createWall(width, height, wallThickness, wallMaterial);
        backWall.position.set(0, yOffset + height / 2, -depth / 2);
        storyGroup.add(backWall);

        // Left wall
        const leftWall = this.createWall(wallThickness, height, depth, wallMaterial);
        leftWall.position.set(-width / 2, yOffset + height / 2, 0);
        storyGroup.add(leftWall);

        // Right wall
        const rightWall = this.createWall(wallThickness, height, depth, wallMaterial);
        rightWall.position.set(width / 2, yOffset + height / 2, 0);
        storyGroup.add(rightWall);

        // Collect door positions for window placement to avoid
        const doorPositions = this.collectDoorPositions(width, depth, storyIndex);

        // Windows - distributed across all walls, avoiding doors
        this.addWindows(storyGroup, width, depth, height, yOffset, storyIndex, doorPositions);

        return storyGroup;
    }

    createWall(width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    collectDoorPositions(width, depth, storyIndex) {
        const doors = [];
        
        if (storyIndex === 0) {
            // Front door
            if (this.params.frontDoorPosition !== 'none') {
                let x = 0;
                if (this.params.frontDoorPosition === 'left') x = -width / 3;
                else if (this.params.frontDoorPosition === 'right') x = width / 3;
                doors.push({ x: x, z: depth / 2, wall: 'front' });
            }
            
            // Side doors
            if (this.params.leftSideDoor !== 'none') {
                doors.push({ x: -width / 2, z: 0, wall: 'left' });
            }
            if (this.params.rightSideDoor !== 'none') {
                doors.push({ x: width / 2, z: 0, wall: 'right' });
            }
            
            // Back door
            if (this.params.backDoor !== 'none') {
                let x = 0;
                if (this.params.backDoor.includes('left')) x = -width / 3;
                else if (this.params.backDoor.includes('right')) x = width / 3;
                doors.push({ x: x, z: -depth / 2, wall: 'back' });
            }
        }
        
        return doors;
    }

    addWindows(group, width, depth, height, yOffset, storyIndex, doorPositions) {
        // Window properties: 3 feet wide, 4 feet tall
        const windowWidthFeet = 3;
        const windowHeightFeet = 4;
        const windowWidth = windowWidthFeet * 0.3; // Convert to meters
        const windowHeight = windowHeightFeet * 0.3; // Convert to meters

        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb, // Blue tint
            transparent: true,
            opacity: 0.7, // Semi-transparent
            roughness: 0.1,
            metalness: 0.9
        });

        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.0
        });

        // Calculate window distribution
        const totalWindows = this.params.numWindows;
        const windowsPerStory = Math.ceil(totalWindows / this.params.numStories);
        
        // Distribute windows: 50% front, 30% back, 20% sides
        let frontWindows = Math.ceil(windowsPerStory * 0.5);
        let backWindows = Math.ceil(windowsPerStory * 0.3);
        let sideWindows = Math.floor(windowsPerStory * 0.2);

        // Ensure even number for front (for symmetry)
        if (frontWindows % 2 !== 0) frontWindows++;

        // Front wall windows - symmetric arrangement, avoiding doors
        const doorClearance = 3 * 0.3; // 3 feet clearance around doors
        
        if (frontWindows > 0) {
            const spacing = width / (frontWindows + 1);
            
            for (let i = 0; i < frontWindows; i++) {
                const xPos = -width / 2 + (i + 1) * spacing;
                
                // Check if window would overlap with any door on front wall
                let skipWindow = false;
                for (const door of doorPositions) {
                    if (door.wall === 'front') {
                        const distanceFromDoor = Math.abs(xPos - door.x);
                        if (distanceFromDoor < doorClearance) {
                            skipWindow = true;
                            break;
                        }
                    }
                }
                
                if (skipWindow) continue;
                
                const window = this.createWindow(windowWidth, windowHeight, frameMaterial, windowMaterial);
                // Position flush with front wall: depth/2 + 0.11
                window.position.set(xPos, yOffset + height / 2, depth / 2 + 0.11);
                group.add(window);
            }
        }

        // Back wall windows - evenly distributed, avoiding doors
        if (backWindows > 0) {
            const spacing = width / (backWindows + 1);
            for (let i = 0; i < backWindows; i++) {
                const xPos = -width / 2 + (i + 1) * spacing;
                
                // Check if window would overlap with any door on back wall
                let skipWindow = false;
                for (const door of doorPositions) {
                    if (door.wall === 'back') {
                        const distanceFromDoor = Math.abs(xPos - door.x);
                        if (distanceFromDoor < doorClearance) {
                            skipWindow = true;
                            break;
                        }
                    }
                }
                
                if (skipWindow) continue;
                
                const window = this.createWindow(windowWidth, windowHeight, frameMaterial, windowMaterial);
                // Position flush with back wall: -depth/2 - 0.11
                window.position.set(xPos, yOffset + height / 2, -depth / 2 - 0.11);
                group.add(window);
            }
        }

        // Side walls windows - left and right (2-3 per story)
        const windowsPerSide = Math.min(3, Math.max(2, Math.floor(sideWindows / 2)));
        
        if (windowsPerSide > 0) {
            // Distribute windows evenly along depth, avoiding corners
            // Use middle portion of the wall: from -depth/3 to depth/3
            const usableDepth = depth * 0.66; // Use 66% of depth to avoid corners
            const depthStart = -usableDepth / 2;
            const spacing = usableDepth / (windowsPerSide + 1);
            
            // Left wall windows
            for (let i = 0; i < windowsPerSide; i++) {
                const zPos = depthStart + (i + 1) * spacing;
                const window = this.createWindow(windowWidth, windowHeight, frameMaterial, windowMaterial);
                
                // Rotate 90 degrees around Y axis for side-facing windows
                window.rotation.y = Math.PI / 2;
                
                // Position flush with left wall: x = -width/2 - 0.11
                window.position.set(-width / 2 - 0.11, yOffset + height / 2, zPos);
                
                // Debug logging (can be removed after testing)
                if (storyIndex === 0 && i === 0) {
                    console.log(`Left side window - x: ${-width / 2 - 0.11}, y: ${yOffset + height / 2}, z: ${zPos}, rotated: ${window.rotation.y}`);
                }
                
                group.add(window);
            }
            
            // Right wall windows
            for (let i = 0; i < windowsPerSide; i++) {
                const zPos = depthStart + (i + 1) * spacing;
                const window = this.createWindow(windowWidth, windowHeight, frameMaterial, windowMaterial);
                
                // Rotate 90 degrees around Y axis for side-facing windows
                window.rotation.y = Math.PI / 2;
                
                // Position flush with right wall: x = width/2 + 0.11
                window.position.set(width / 2 + 0.11, yOffset + height / 2, zPos);
                
                // Debug logging (can be removed after testing)
                if (storyIndex === 0 && i === 0) {
                    console.log(`Right side window - x: ${width / 2 + 0.11}, y: ${yOffset + height / 2}, z: ${zPos}, rotated: ${window.rotation.y}`);
                }
                
                group.add(window);
            }
        }
    }

    createWindow(width, height, frameMaterial, glassMaterial) {
        const windowGroup = new THREE.Group();

        // Frame - thinner depth for flush wall mounting
        const frameGeometry = new THREE.BoxGeometry(width, height, 0.2);
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        windowGroup.add(frame);

        // Glass - very thin for realistic appearance
        const glassGeometry = new THREE.BoxGeometry(width * 0.9, height * 0.9, 0.1);
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        windowGroup.add(glass);

        return windowGroup;
    }

    createDoorByType(doorType, doorMaterial) {
        const doorGroup = new THREE.Group();
        
        // Handle material for all doors
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080, // Metallic gray
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Convert feet to meters
        const ft = 0.3;
        
        switch(doorType) {
            case 'single': {
                const doorWidth = 3.5 * ft;
                const doorHeight = 7 * ft;
                
                const singleGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.2);
                const singleDoor = new THREE.Mesh(singleGeo, doorMaterial);
                singleDoor.castShadow = true;
                doorGroup.add(singleDoor);
                
                // Handle on right side, 3.5 feet high
                const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
                const handle = new THREE.Mesh(handleGeo, handleMaterial);
                handle.position.set(doorWidth / 2 - 0.15, 0, 0.12);
                handle.rotation.z = Math.PI / 2;
                doorGroup.add(handle);
                break;
            }
            
            case 'double': {
                const doorWidth = 6 * ft;
                const doorHeight = 7 * ft;
                
                // Two door panels with small gap
                const leftDoorGeo = new THREE.BoxGeometry(2.9 * ft, doorHeight, 0.2);
                const leftDoor = new THREE.Mesh(leftDoorGeo, doorMaterial);
                leftDoor.position.x = -1.55 * ft;
                leftDoor.castShadow = true;
                doorGroup.add(leftDoor);
                
                const rightDoorGeo = new THREE.BoxGeometry(2.9 * ft, doorHeight, 0.2);
                const rightDoor = new THREE.Mesh(rightDoorGeo, doorMaterial);
                rightDoor.position.x = 1.55 * ft;
                rightDoor.castShadow = true;
                doorGroup.add(rightDoor);
                
                // Handles on center edges
                const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
                const leftHandle = new THREE.Mesh(handleGeo, handleMaterial);
                leftHandle.position.set(-0.15, 0, 0.12);
                leftHandle.rotation.z = Math.PI / 2;
                doorGroup.add(leftHandle);
                
                const rightHandle = new THREE.Mesh(handleGeo.clone(), handleMaterial);
                rightHandle.position.set(0.15, 0, 0.12);
                rightHandle.rotation.z = Math.PI / 2;
                doorGroup.add(rightHandle);
                break;
            }
            
            case 'glass': {
                const doorWidth = 3.5 * ft;
                const doorHeight = 7 * ft;
                
                // Bottom solid panel
                const bottomGeo = new THREE.BoxGeometry(doorWidth, 4 * ft, 0.2);
                const bottomPanel = new THREE.Mesh(bottomGeo, doorMaterial);
                bottomPanel.position.y = -1.5 * ft;
                bottomPanel.castShadow = true;
                doorGroup.add(bottomPanel);
                
                // Top glass panel
                const glassMaterial = new THREE.MeshStandardMaterial({
                    color: 0x87CEEB,
                    transparent: true,
                    opacity: 0.6,
                    metalness: 0.5,
                    roughness: 0.2
                });
                const topGeo = new THREE.BoxGeometry(doorWidth, 3 * ft, 0.2);
                const topPanel = new THREE.Mesh(topGeo, glassMaterial);
                topPanel.position.y = 2 * ft;
                doorGroup.add(topPanel);
                
                // Handle
                const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
                const handle = new THREE.Mesh(handleGeo, handleMaterial);
                handle.position.set(doorWidth / 2 - 0.15, -0.5 * ft, 0.12);
                handle.rotation.z = Math.PI / 2;
                doorGroup.add(handle);
                break;
            }
            
            case 'sliding': {
                const doorWidth = 8 * ft;
                const doorHeight = 7 * ft;
                
                // Large sliding glass door
                const slidingGlassMaterial = new THREE.MeshStandardMaterial({
                    color: 0xB0E0E6,
                    transparent: true,
                    opacity: 0.5,
                    metalness: 0.6,
                    roughness: 0.1
                });
                const slidingGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.2);
                const slidingDoor = new THREE.Mesh(slidingGeo, slidingGlassMaterial);
                doorGroup.add(slidingDoor);
                
                // Frame divider in middle
                const frameMaterial = new THREE.MeshStandardMaterial({
                    color: 0x404040,
                    roughness: 0.3
                });
                const dividerGeo = new THREE.BoxGeometry(0.15, doorHeight, 0.25);
                const divider = new THREE.Mesh(dividerGeo, frameMaterial);
                doorGroup.add(divider);
                
                // Vertical bar handle
                const barHandle = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.03, doorHeight * 0.6, 8),
                    handleMaterial
                );
                barHandle.position.set(doorWidth / 4, 0, 0.13);
                doorGroup.add(barHandle);
                break;
            }
            
            case 'french': {
                const doorWidth = 6 * ft;
                const doorHeight = 7 * ft;
                
                const frenchGlassMaterial = new THREE.MeshStandardMaterial({
                    color: 0x87CEEB,
                    transparent: true,
                    opacity: 0.6,
                    metalness: 0.5,
                    roughness: 0.2
                });
                
                // Left door with glass panes
                const leftFrameGeo = new THREE.BoxGeometry(2.9 * ft, doorHeight, 0.2);
                const leftFrenchDoor = new THREE.Mesh(leftFrameGeo, doorMaterial);
                leftFrenchDoor.position.x = -1.55 * ft;
                leftFrenchDoor.castShadow = true;
                doorGroup.add(leftFrenchDoor);
                
                // Right door with glass panes
                const rightFrameGeo = new THREE.BoxGeometry(2.9 * ft, doorHeight, 0.2);
                const rightFrenchDoor = new THREE.Mesh(rightFrameGeo, doorMaterial);
                rightFrenchDoor.position.x = 1.55 * ft;
                rightFrenchDoor.castShadow = true;
                doorGroup.add(rightFrenchDoor);
                
                // Glass panes (2 per door)
                const paneGeo = new THREE.BoxGeometry(2.5 * ft, 3 * ft, 0.1);
                
                const leftTopPane = new THREE.Mesh(paneGeo, frenchGlassMaterial);
                leftTopPane.position.set(-1.55 * ft, 1.8 * ft, 0);
                doorGroup.add(leftTopPane);
                
                const leftBottomPane = new THREE.Mesh(paneGeo, frenchGlassMaterial);
                leftBottomPane.position.set(-1.55 * ft, -1.8 * ft, 0);
                doorGroup.add(leftBottomPane);
                
                const rightTopPane = new THREE.Mesh(paneGeo, frenchGlassMaterial);
                rightTopPane.position.set(1.55 * ft, 1.8 * ft, 0);
                doorGroup.add(rightTopPane);
                
                const rightBottomPane = new THREE.Mesh(paneGeo, frenchGlassMaterial);
                rightBottomPane.position.set(1.55 * ft, -1.8 * ft, 0);
                doorGroup.add(rightBottomPane);
                
                // Handles on center edges
                const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
                const leftHandle = new THREE.Mesh(handleGeo, handleMaterial);
                leftHandle.position.set(-0.15, 0, 0.12);
                leftHandle.rotation.z = Math.PI / 2;
                doorGroup.add(leftHandle);
                
                const rightHandle = new THREE.Mesh(handleGeo, handleMaterial);
                rightHandle.position.set(0.15, 0, 0.12);
                rightHandle.rotation.z = Math.PI / 2;
                doorGroup.add(rightHandle);
                break;
            }
        }
        
        return doorGroup;
    }

    buildAllDoors(width, depth, storyHeight) {
        const ft = 0.3; // Conversion factor
        
        // Door materials
        const woodDoorMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.6,
            metalness: 0.0
        });
        
        const lightDoorMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0522D,
            roughness: 0.6,
            metalness: 0.0
        });
        
        const garageDoorMaterial = new THREE.MeshStandardMaterial({
            color: 0xE0E0E0,
            roughness: 0.5,
            metalness: 0.1
        });
        
        // Front door
        if (this.params.frontDoorPosition !== 'none') {
            const frontDoor = this.createDoorByType(this.params.frontDoorType, woodDoorMaterial);
            frontDoor.position.y = 7 * ft / 2;
            frontDoor.position.z = depth / 2 + 0.11;
            
            if (this.params.frontDoorPosition === 'center') {
                frontDoor.position.x = 0;
            } else if (this.params.frontDoorPosition === 'left') {
                frontDoor.position.x = -width / 3;
            } else if (this.params.frontDoorPosition === 'right') {
                frontDoor.position.x = width / 3;
            }
            
            this.house.add(frontDoor);
        }
        
        // Left side door
        if (this.params.leftSideDoor !== 'none') {
            const leftDoor = this.createDoorByType(this.params.leftSideDoor, lightDoorMaterial);
            leftDoor.position.x = -width / 2 - 0.11;
            leftDoor.position.y = 7 * ft / 2;
            leftDoor.position.z = 0;
            leftDoor.rotation.y = Math.PI / 2;
            this.house.add(leftDoor);
        }
        
        // Right side door
        if (this.params.rightSideDoor !== 'none') {
            const rightDoor = this.createDoorByType(this.params.rightSideDoor, lightDoorMaterial);
            rightDoor.position.x = width / 2 + 0.11;
            rightDoor.position.y = 7 * ft / 2;
            rightDoor.position.z = 0;
            rightDoor.rotation.y = Math.PI / 2;
            this.house.add(rightDoor);
        }
        
        // Back door
        if (this.params.backDoor !== 'none') {
            let doorType, doorPosition;
            
            if (this.params.backDoor === 'single-center') {
                doorType = 'single';
                doorPosition = 'center';
            } else if (this.params.backDoor === 'single-left') {
                doorType = 'single';
                doorPosition = 'left';
            } else if (this.params.backDoor === 'single-right') {
                doorType = 'single';
                doorPosition = 'right';
            } else if (this.params.backDoor === 'double') {
                doorType = 'double';
                doorPosition = 'center';
            } else if (this.params.backDoor === 'sliding') {
                doorType = 'sliding';
                doorPosition = 'center';
            } else if (this.params.backDoor === 'french') {
                doorType = 'french';
                doorPosition = 'center';
            }
            
            const backDoor = this.createDoorByType(doorType, lightDoorMaterial);
            backDoor.position.y = 7 * ft / 2;
            backDoor.position.z = -depth / 2 - 0.11;
            
            if (doorPosition === 'center') {
                backDoor.position.x = 0;
            } else if (doorPosition === 'left') {
                backDoor.position.x = -width / 3;
            } else if (doorPosition === 'right') {
                backDoor.position.x = width / 3;
            }
            
            this.house.add(backDoor);
        }
        
        // Garage entry door (connects garage to house)
        if (this.params.garageEntryDoor && this.params.garageType !== 'none') {
            const garageEntry = this.createDoorByType('single', garageDoorMaterial);
            garageEntry.position.x = width / 2 + 0.11;
            garageEntry.position.y = 7 * ft / 2;
            garageEntry.position.z = 0;
            garageEntry.rotation.y = Math.PI / 2;
            garageEntry.scale.set(0.7, 1, 1); // Narrower
            this.house.add(garageEntry);
        }
    }

    buildRoof(width, depth, totalHeight) {
        const roofGroup = new THREE.Group();
        
        // Get material properties
        const roofMatProps = this.materials.roof[this.params.roofMaterial];
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: roofMatProps.color,
            roughness: roofMatProps.roughness,
            metalness: roofMatProps.metalness
        });

        const roofPitch = 0.5;
        const roofHeight = width * roofPitch;

        switch (this.params.roofStyle) {
            case 'flat':
                roofGroup.add(this.createFlatRoof(width, depth, totalHeight, roofMaterial));
                break;
            case 'gable':
                roofGroup.add(this.createGableRoof(width, depth, totalHeight, roofHeight, roofMaterial));
                break;
            case 'hip':
                roofGroup.add(this.createHipRoof(width, depth, totalHeight, roofHeight, roofMaterial));
                break;
        }

        return roofGroup;
    }

    createFlatRoof(width, depth, totalHeight, material) {
        const geometry = new THREE.BoxGeometry(width + 0.6, 0.3, depth + 0.6);
        const roof = new THREE.Mesh(geometry, material);
        roof.position.y = totalHeight + 0.15;
        roof.castShadow = true;
        roof.receiveShadow = true;
        return roof;
    }

    createGableRoof(width, depth, totalHeight, roofHeight, material) {
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2 - 0.3, 0);
        shape.lineTo(0, roofHeight);
        shape.lineTo(width / 2 + 0.3, 0);
        shape.lineTo(-width / 2 - 0.3, 0);

        const extrudeSettings = {
            depth: depth + 0.6,
            bevelEnabled: false
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const roof = new THREE.Mesh(geometry, material);
        roof.position.set(0, totalHeight, -depth / 2 - 0.3);
        roof.castShadow = true;
        roof.receiveShadow = true;
        return roof;
    }

    createHipRoof(width, depth, totalHeight, roofHeight, material) {
        const vertices = new Float32Array([
            // Front triangle
            -width / 2 - 0.3, 0, depth / 2 + 0.3,
            width / 2 + 0.3, 0, depth / 2 + 0.3,
            0, roofHeight, 0,
            
            // Back triangle
            -width / 2 - 0.3, 0, -depth / 2 - 0.3,
            0, roofHeight, 0,
            width / 2 + 0.3, 0, -depth / 2 - 0.3,
            
            // Left triangle
            -width / 2 - 0.3, 0, -depth / 2 - 0.3,
            -width / 2 - 0.3, 0, depth / 2 + 0.3,
            0, roofHeight, 0,
            
            // Right triangle
            width / 2 + 0.3, 0, -depth / 2 - 0.3,
            0, roofHeight, 0,
            width / 2 + 0.3, 0, depth / 2 + 0.3
        ]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        const roof = new THREE.Mesh(geometry, material);
        roof.position.y = totalHeight;
        roof.castShadow = true;
        roof.receiveShadow = true;
        return roof;
    }

    buildGarage(houseWidth, houseDepth, storyHeight) {
        const garageGroup = new THREE.Group();
        
        // Garage dimensions in feet, then convert to meters
        const garageWidthFeet = this.params.garageType === 'single' ? 12 : 20;
        const garageDepthFeet = 20;
        const garageWidth = garageWidthFeet * 0.3; // Convert to meters
        const garageDepth = garageDepthFeet * 0.3; // Convert to meters
        const garageHeight = storyHeight; // Same height as one story (10 feet)

        // Get material properties - garage uses same material as house walls
        const wallMatProps = this.materials.wall[this.params.wallMaterial];
        const garageMaterial = new THREE.MeshStandardMaterial({
            color: wallMatProps.color,
            roughness: wallMatProps.roughness,
            metalness: wallMatProps.metalness
        });

        // Position garage to the right of the house
        const garageX = houseWidth / 2 + garageWidth / 2 + 0.3;

        // Garage walls
        const wallThickness = 0.3;

        // Front wall (with garage door opening)
        const frontLeft = this.createWall(garageWidth * 0.1, garageHeight, wallThickness, garageMaterial);
        frontLeft.position.set(garageX - garageWidth / 2 + garageWidth * 0.05, garageHeight / 2, garageDepth / 2);
        garageGroup.add(frontLeft);

        const frontRight = this.createWall(garageWidth * 0.1, garageHeight, wallThickness, garageMaterial);
        frontRight.position.set(garageX + garageWidth / 2 - garageWidth * 0.05, garageHeight / 2, garageDepth / 2);
        garageGroup.add(frontRight);

        const frontTop = this.createWall(garageWidth * 0.8, garageHeight * 0.2, wallThickness, garageMaterial);
        frontTop.position.set(garageX, garageHeight * 0.9, garageDepth / 2);
        garageGroup.add(frontTop);

        // Garage door (gray color, 80% of width, 70% of height)
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080, 
            roughness: 0.7,
            metalness: 0.2
        });
        const garageDoorWidth = garageWidth * 0.8;
        const garageDoorHeight = garageHeight * 0.7;
        const garageDoor = this.createWall(garageDoorWidth, garageDoorHeight, 0.1, doorMaterial);
        garageDoor.position.set(garageX, garageDoorHeight / 2 + 0.1, garageDepth / 2 + 0.16);
        garageGroup.add(garageDoor);

        // Back wall
        const backWall = this.createWall(garageWidth, garageHeight, wallThickness, garageMaterial);
        backWall.position.set(garageX, garageHeight / 2, -garageDepth / 2);
        garageGroup.add(backWall);

        // Left wall (connects to house)
        const leftWall = this.createWall(wallThickness, garageHeight, garageDepth, garageMaterial);
        leftWall.position.set(garageX - garageWidth / 2, garageHeight / 2, 0);
        garageGroup.add(leftWall);

        // Right wall
        const rightWall = this.createWall(wallThickness, garageHeight, garageDepth, garageMaterial);
        rightWall.position.set(garageX + garageWidth / 2, garageHeight / 2, 0);
        garageGroup.add(rightWall);

        // Roof - use same material as house roof
        const roofMatProps = this.materials.roof[this.params.roofMaterial];
        const roofGeometry = new THREE.BoxGeometry(garageWidth + 0.4, 0.2, garageDepth + 0.4);
        const roof = new THREE.Mesh(roofGeometry, new THREE.MeshStandardMaterial({ 
            color: roofMatProps.color,
            roughness: roofMatProps.roughness,
            metalness: roofMatProps.metalness
        }));
        roof.position.set(garageX, garageHeight + 0.1, 0);
        roof.castShadow = true;
        garageGroup.add(roof);

        return garageGroup;
    }

    createPorch(porchSize, houseWidth, houseDepth, doorPosition) {
        const porchGroup = new THREE.Group();
        
        if (porchSize === 'none') {
            return porchGroup;
        }
        
        // Porch dimensions in feet, then convert to meters
        const porchWidthFeet = porchSize === 'small' ? 12 : this.params.houseWidth;
        const porchDepthFeet = porchSize === 'small' ? 4 : 8;
        
        // Convert to meters (0.3 conversion factor)
        const porchWidth = porchWidthFeet * 0.3;
        const porchDepth = porchDepthFeet * 0.3;
        const deckHeight = 0.5; // ~1.5 feet raised platform
        const postHeight = 9.5 * 0.3; // 9.5 feet tall posts
        const roofThickness = 0.2; // Proper overhang thickness
        
        // Calculate porch X position based on door location
        let porchXPosition = 0; // default center
        
        if (porchSize === 'small') {
            // Small porches should center on the door
            if (doorPosition === 'left') {
                porchXPosition = -houseWidth / 3;
            } else if (doorPosition === 'right') {
                porchXPosition = houseWidth / 3;
            }
            // else center (porchXPosition = 0)
        }
        // Large porches always span full width, so stay centered at 0
        
        console.log(`Front porch: Door at ${doorPosition}, Porch centered at x=${porchXPosition.toFixed(2)}`);
        
        // Get roof material properties
        const roofMatProps = this.materials.roof[this.params.roofMaterial];
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: roofMatProps.color,
            roughness: roofMatProps.roughness,
            metalness: roofMatProps.metalness
        });
        
        // 1. DECK PLATFORM
        const deckGeometry = new THREE.BoxGeometry(porchWidth, deckHeight, porchDepth);
        const deckMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887, // Burlywood - wooden decking
            roughness: 0.8,
            metalness: 0.0
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        // Position deck centered on door location
        deck.position.set(porchXPosition, deckHeight / 2, houseDepth / 2 + porchDepth / 2);
        deck.castShadow = true;
        deck.receiveShadow = true;
        porchGroup.add(deck);
        
        // 2. POSTS/COLUMNS (thin, elegant)
        const postMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, // White
            roughness: 0.6,
            metalness: 0.0
        });
        
        // Thin elegant posts - classic porch columns
        const postRadius = 0.15;
        const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
        
        // Post cap material (decorative top)
        const postCapMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5F5F5, // Off-white
            roughness: 0.5,
            metalness: 0.1
        });
        
        let postPositions = [];
        
        if (porchSize === 'large') {
            // 4 posts for large porch, evenly distributed
            postPositions = [
                { x: porchXPosition - porchWidth / 2 + 3 * 0.3, z: houseDepth / 2 + porchDepth - 1 * 0.3 },
                { x: porchXPosition - porchWidth / 4, z: houseDepth / 2 + porchDepth - 1 * 0.3 },
                { x: porchXPosition + porchWidth / 4, z: houseDepth / 2 + porchDepth - 1 * 0.3 },
                { x: porchXPosition + porchWidth / 2 - 3 * 0.3, z: houseDepth / 2 + porchDepth - 1 * 0.3 }
            ];
        } else {
            // 2 posts for small porch, centered on door
            postPositions = [
                { x: porchXPosition - porchWidth / 2 + 1.5 * 0.3, z: houseDepth / 2 + porchDepth - 1 * 0.3 },
                { x: porchXPosition + porchWidth / 2 - 1.5 * 0.3, z: houseDepth / 2 + porchDepth - 1 * 0.3 }
            ];
        }
        
        // Create posts with caps
        postPositions.forEach(pos => {
            // Post
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(pos.x, deckHeight + postHeight / 2, pos.z);
            post.castShadow = true;
            post.receiveShadow = true;
            porchGroup.add(post);
            
            // Post cap (decorative top)
            const capGeometry = new THREE.CylinderGeometry(0.25, 0.18, 0.15, 16);
            const cap = new THREE.Mesh(capGeometry, postCapMaterial);
            cap.position.set(pos.x, deckHeight + postHeight + 0.075, pos.z);
            cap.castShadow = true;
            porchGroup.add(cap);
        });
        
        // 3. ROOF OVERHANG
        const roofGeometry = new THREE.BoxGeometry(porchWidth, roofThickness, porchDepth);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        // Position roof relative to porch position
        roof.position.set(porchXPosition, deckHeight + postHeight + roofThickness / 2, houseDepth / 2 + porchDepth / 2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        porchGroup.add(roof);
        
        // 4. STEPS/STAIRS (from ground to deck)
        const stepMaterial = new THREE.MeshStandardMaterial({
            color: 0xC8B895, // Lighter wood color for contrast
            roughness: 0.85,
            metalness: 0.0
        });
        
        const numSteps = 3;
        const stepWidth = porchSize === 'small' ? porchWidth * 0.6 : porchWidth * 0.4;
        const stepDepth = 0.3;
        const stepRise = deckHeight / numSteps;
        
        for (let i = 0; i < numSteps; i++) {
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepRise, stepDepth);
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            
            // Position steps leading up to deck, centered on porch
            const stepY = stepRise * (i + 0.5);
            const stepZ = houseDepth / 2 + porchDepth + stepDepth * (numSteps - i - 0.5);
            
            step.position.set(porchXPosition, stepY, stepZ);
            step.castShadow = true;
            step.receiveShadow = true;
            porchGroup.add(step);
        }
        
        return porchGroup;
    }

    createBackPorch(porchType, houseWidth, houseDepth, storyHeight, doorPosition) {
        const porchGroup = new THREE.Group();
        
        if (porchType === 'none') {
            return porchGroup;
        }
        
        // Back porch dimensions in feet, then convert to meters
        let porchWidthFeet, porchDepthFeet, numPosts;
        
        if (porchType === 'small') {
            porchWidthFeet = 12;
            porchDepthFeet = 8;
            numPosts = 4;
        } else if (porchType === 'large') {
            porchWidthFeet = this.params.houseWidth; // Full width
            porchDepthFeet = 10;
            numPosts = 6;
        } else if (porchType === 'screened') {
            porchWidthFeet = 16;
            porchDepthFeet = 10;
            numPosts = 6;
        }
        
        // Convert to meters
        const porchWidth = porchWidthFeet * 0.3;
        const porchDepth = porchDepthFeet * 0.3;
        const deckHeight = 0.5; // ~1.5 feet raised platform
        const postHeight = 9.5 * 0.3; // 9.5 feet tall posts
        const roofThickness = 0.2;
        
        // Calculate porch X position based on door location
        let porchXPosition = 0; // default center
        
        if (porchType === 'small') {
            // Small porches should center on the door
            if (doorPosition === 'left') {
                porchXPosition = -houseWidth / 3;
            } else if (doorPosition === 'right') {
                porchXPosition = houseWidth / 3;
            }
            // else center (porchXPosition = 0)
        }
        // Large porches and screened porches span full width, so stay centered at 0
        
        console.log(`Back porch: Door at ${doorPosition}, Porch centered at x=${porchXPosition.toFixed(2)}`);
        
        // Get roof material properties
        const roofMatProps = this.materials.roof[this.params.roofMaterial];
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: roofMatProps.color,
            roughness: roofMatProps.roughness,
            metalness: roofMatProps.metalness
        });
        
        // 1. DECK PLATFORM
        const deckGeometry = new THREE.BoxGeometry(porchWidth, deckHeight, porchDepth);
        const deckMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887, // Burlywood - wooden decking
            roughness: 0.8,
            metalness: 0.0
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        // Position at back of house, centered on door
        deck.position.set(porchXPosition, deckHeight / 2, -houseDepth / 2 - porchDepth / 2);
        deck.castShadow = true;
        deck.receiveShadow = true;
        porchGroup.add(deck);
        
        // 2. POSTS/COLUMNS (thin elegant)
        const postMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, // White
            roughness: 0.6,
            metalness: 0.0
        });
        
        const postRadius = 0.15;
        const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
        
        // Post cap material
        const postCapMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5F5F5, // Off-white
            roughness: 0.5,
            metalness: 0.1
        });
        
        // Position posts based on type - ONLY at outer edge (away from house)
        let postPositions = [];
        
        if (porchType === 'small') {
            // Small deck: 2 posts at outer edge corners only, centered on door
            postPositions = [
                { x: porchXPosition - porchWidth / 2 + 1 * 0.3, z: -houseDepth / 2 - porchDepth + 1 * 0.3 },
                { x: porchXPosition + porchWidth / 2 - 1 * 0.3, z: -houseDepth / 2 - porchDepth + 1 * 0.3 }
            ];
        } else if (porchType === 'large') {
            // Large deck: 4 posts along outer edge only (full width, centered)
            postPositions = [
                { x: porchXPosition - porchWidth / 2 + 3 * 0.3, z: -houseDepth / 2 - porchDepth + 1 * 0.3 },
                { x: porchXPosition - porchWidth / 4, z: -houseDepth / 2 - porchDepth + 1 * 0.3 },
                { x: porchXPosition + porchWidth / 4, z: -houseDepth / 2 - porchDepth + 1 * 0.3 },
                { x: porchXPosition + porchWidth / 2 - 3 * 0.3, z: -houseDepth / 2 - porchDepth + 1 * 0.3 }
            ];
        } else if (porchType === 'screened') {
            // Screened porch: corner posts and front edge posts for screen support (full width)
            postPositions = [
                // Back corners (against house, at edges)
                { x: porchXPosition - porchWidth / 2 + 0.5, z: -houseDepth / 2 - 0.5 },
                { x: porchXPosition + porchWidth / 2 - 0.5, z: -houseDepth / 2 - 0.5 },
                // Front edge (outer, away from house)
                { x: porchXPosition - porchWidth / 2 + 0.5, z: -houseDepth / 2 - porchDepth + 0.5 },
                { x: porchXPosition - porchWidth / 4, z: -houseDepth / 2 - porchDepth + 0.5 },
                { x: porchXPosition + porchWidth / 4, z: -houseDepth / 2 - porchDepth + 0.5 },
                { x: porchXPosition + porchWidth / 2 - 0.5, z: -houseDepth / 2 - porchDepth + 0.5 }
            ];
        }
        
        // Create posts with caps
        postPositions.forEach((pos, index) => {
            // Post
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(pos.x, deckHeight + postHeight / 2, pos.z);
            post.castShadow = true;
            post.receiveShadow = true;
            porchGroup.add(post);
            
            // Debug logging
            if (index === 0) {
                console.log(`Back porch post at: x=${pos.x.toFixed(2)}, y=${(deckHeight + postHeight / 2).toFixed(2)}, z=${pos.z.toFixed(2)}`);
            }
            
            // Post cap
            const capGeometry = new THREE.CylinderGeometry(0.25, 0.18, 0.15, 16);
            const cap = new THREE.Mesh(capGeometry, postCapMaterial);
            cap.position.set(pos.x, deckHeight + postHeight + 0.075, pos.z);
            cap.castShadow = true;
            porchGroup.add(cap);
        });
        
        // 3. ROOF OVERHANG
        const roofGeometry = new THREE.BoxGeometry(porchWidth, roofThickness, porchDepth);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        // Position roof relative to porch position
        roof.position.set(porchXPosition, deckHeight + postHeight + roofThickness / 2, -houseDepth / 2 - porchDepth / 2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        porchGroup.add(roof);
        
        // 4. SCREENED WALLS (only for screened porch)
        // Screens on LEFT, RIGHT, and FRONT (outer edge) - NOT on back (house wall)
        if (porchType === 'screened') {
            const screenMaterial = new THREE.MeshStandardMaterial({
                color: 0x2F4F4F, // Dark greenish-gray
                transparent: true,
                opacity: 0.4,
                roughness: 0.9,
                metalness: 0.0,
                side: THREE.DoubleSide
            });
            
            const screenHeight = postHeight - 0.3;
            const screenThickness = 0.05;
            
            // Left screen (full side)
            const leftScreen = new THREE.Mesh(
                new THREE.BoxGeometry(screenThickness, screenHeight, porchDepth - 1),
                screenMaterial
            );
            leftScreen.position.set(porchXPosition - porchWidth / 2 + 0.5, deckHeight + screenHeight / 2 + 0.3, -houseDepth / 2 - porchDepth / 2);
            porchGroup.add(leftScreen);
            
            // Right screen (full side)
            const rightScreen = new THREE.Mesh(
                new THREE.BoxGeometry(screenThickness, screenHeight, porchDepth - 1),
                screenMaterial
            );
            rightScreen.position.set(porchXPosition + porchWidth / 2 - 0.5, deckHeight + screenHeight / 2 + 0.3, -houseDepth / 2 - porchDepth / 2);
            porchGroup.add(rightScreen);
            
            // Front screen - leave center section open for access
            const frontPanelWidth = (porchWidth - 2.5) / 2; // Leave 2.5m center opening
            
            // Front left screen panel
            const frontLeft = new THREE.Mesh(
                new THREE.BoxGeometry(frontPanelWidth, screenHeight, screenThickness),
                screenMaterial
            );
            frontLeft.position.set(porchXPosition - porchWidth / 2 + frontPanelWidth / 2 + 0.5, deckHeight + screenHeight / 2 + 0.3, -houseDepth / 2 - porchDepth + 0.5);
            porchGroup.add(frontLeft);
            
            // Front right screen panel
            const frontRight = new THREE.Mesh(
                new THREE.BoxGeometry(frontPanelWidth, screenHeight, screenThickness),
                screenMaterial
            );
            frontRight.position.set(porchXPosition + porchWidth / 2 - frontPanelWidth / 2 - 0.5, deckHeight + screenHeight / 2 + 0.3, -houseDepth / 2 - porchDepth + 0.5);
            porchGroup.add(frontRight);
            
            // NO screen on back - that's where the house wall is
        }
        
        // 5. STEPS/STAIRS (from ground to deck)
        const stepMaterial = new THREE.MeshStandardMaterial({
            color: 0xC8B895, // Lighter wood color
            roughness: 0.85,
            metalness: 0.0
        });
        
        const numSteps = 3;
        const stepWidth = porchType === 'small' ? porchWidth * 0.6 : porchWidth * 0.4;
        const stepDepth = 0.3;
        const stepRise = deckHeight / numSteps;
        
        for (let i = 0; i < numSteps; i++) {
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepRise, stepDepth);
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            
            // Position steps leading up to deck, centered on porch
            const stepY = stepRise * (i + 0.5);
            const stepZ = -houseDepth / 2 - porchDepth - stepDepth * (numSteps - i - 0.5);
            
            step.position.set(porchXPosition, stepY, stepZ);
            step.castShadow = true;
            step.receiveShadow = true;
            porchGroup.add(step);
        }
        
        return porchGroup;
    }

    createChimney(houseWidth, houseDepth, totalHeight, roofStyle) {
        const chimneyGroup = new THREE.Group();
        
        // Chimney dimensions in feet, then convert to meters
        const chimneyWidthFeet = 3;
        const chimneyDepthFeet = 2;
        const chimneyExtensionFeet = 4; // Extends above roof peak
        
        const chimneyWidth = chimneyWidthFeet * 0.3;
        const chimneyDepth = chimneyDepthFeet * 0.3;
        const chimneyExtension = chimneyExtensionFeet * 0.3;
        
        // Calculate roof height
        let roofPeakHeight;
        if (roofStyle === 'flat') {
            roofPeakHeight = totalHeight + 0.3;
        } else {
            const roofPitch = 0.5;
            roofPeakHeight = totalHeight + (houseWidth * roofPitch);
        }
        
        // Chimney height: from base (a bit below roof) to above peak
        const chimneyStartHeight = totalHeight - 0.5; // Start slightly below roof
        const chimneyTotalHeight = (roofPeakHeight - chimneyStartHeight) + chimneyExtension;
        
        // Position chimney 1/4 from left edge
        const chimneyX = -houseWidth / 2 + houseWidth / 4;
        const chimneyZ = 0; // Center on depth axis
        
        // Chimney material - brick with rough texture
        const chimneyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Reddish-brown brick
            roughness: 0.95, // Very rough texture
            metalness: 0.0
        });
        
        // Main chimney structure
        const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyTotalHeight, chimneyDepth);
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(chimneyX, chimneyStartHeight + chimneyTotalHeight / 2, chimneyZ);
        chimney.castShadow = true;
        chimney.receiveShadow = true;
        chimneyGroup.add(chimney);
        
        // Chimney cap (slightly wider for realistic look)
        const capGeometry = new THREE.BoxGeometry(chimneyWidth + 0.1, 0.15, chimneyDepth + 0.1);
        const cap = new THREE.Mesh(capGeometry, chimneyMaterial);
        cap.position.set(chimneyX, chimneyStartHeight + chimneyTotalHeight + 0.075, chimneyZ);
        cap.castShadow = true;
        chimneyGroup.add(cap);
        
        return chimneyGroup;
    }

    setupEventListeners() {
        // Update Design button
        document.getElementById('update-design').addEventListener('click', () => {
            this.updateDesignFromForm();
        });

        // Generate AI Images button
        document.getElementById('generate-ai-images').addEventListener('click', async () => {
            await this.generateAIImages();
        });

        // Export Data button
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        // Real-time updates on form changes
        const form = document.getElementById('design-form');
        form.addEventListener('input', (e) => {
            // Update info panel in real-time
            const width = parseInt(document.getElementById('house-width').value);
            const depth = parseInt(document.getElementById('house-depth').value);
            const stories = parseInt(document.getElementById('num-stories').value);
            const numWindows = parseInt(document.getElementById('num-windows').value);
            const garageType = document.getElementById('garage-type').value;
            
            document.getElementById('info-width').textContent = `${width} ft`;
            document.getElementById('info-depth').textContent = `${depth} ft`;
            document.getElementById('info-stories').textContent = stories;
            document.getElementById('info-windows').textContent = numWindows;
            
            // Update window count display next to slider
            if (e.target.id === 'num-windows') {
                document.getElementById('num-windows-value').textContent = numWindows;
            }
            
            // Calculate total square footage including garage
            let totalSqft = width * depth * stories;
            if (garageType !== 'none') {
                const garageWidth = garageType === 'single' ? 12 : 20;
                const garageDepth = 20;
                totalSqft += garageWidth * garageDepth;
            }
            
            document.getElementById('info-sqft').textContent = `${totalSqft.toLocaleString()} sq ft`;
        });

        // Clear Plan button
        document.getElementById('clear-plan')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.clear();
                console.log('Floor plan cleared');
            }
        });

        // Undo button
        document.getElementById('undo')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.undo();
                console.log('Undo last point');
            }
        });

        // Mode buttons
        document.getElementById('mode-draw')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('draw');
            }
        });

        document.getElementById('mode-edit')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('edit');
            }
        });

        document.getElementById('mode-door')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('door');
            }
        });

        document.getElementById('mode-window')?.addEventListener('click', () => {
            if (this.floorPlanEditor) {
                this.floorPlanEditor.setMode('window');
            }
        });
    }

    setupViewControls() {
        // Corner View (default)
        document.getElementById('cornerView').addEventListener('click', () => {
            this.setActiveView('cornerView');
            this.animateCamera(
                new THREE.Vector3(50, 30, 50),
                new THREE.Vector3(0, 10, 0)
            );
        });

        // Front View
        document.getElementById('frontView').addEventListener('click', () => {
            this.setActiveView('frontView');
            this.animateCamera(
                new THREE.Vector3(0, 15, 60),
                new THREE.Vector3(0, 10, 0)
            );
        });

        // Side View
        document.getElementById('sideView').addEventListener('click', () => {
            this.setActiveView('sideView');
            this.animateCamera(
                new THREE.Vector3(60, 15, 0),
                new THREE.Vector3(0, 10, 0)
            );
        });

        // Top View
        document.getElementById('topView').addEventListener('click', () => {
            this.setActiveView('topView');
            this.animateCamera(
                new THREE.Vector3(0, 80, 0),
                new THREE.Vector3(0, 0, 0)
            );
        });
    }

    setActiveView(viewId) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');
    }

    animateCamera(targetPosition, targetLookAt, duration = 1000) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth easing (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, targetPosition, eased);
            
            // Interpolate look-at target
            const currentTarget = new THREE.Vector3();
            currentTarget.lerpVectors(startTarget, targetLookAt, eased);
            this.controls.target.copy(currentTarget);
            
            this.camera.lookAt(currentTarget);
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    updateDesignFromForm() {
        // Get form values
        this.params.houseWidth = parseInt(document.getElementById('house-width').value);
        this.params.houseDepth = parseInt(document.getElementById('house-depth').value);
        this.params.numStories = parseInt(document.getElementById('num-stories').value);
        this.params.houseShape = document.getElementById('house-shape').value;
        this.params.roofStyle = document.getElementById('roof-style').value;
        this.params.wallMaterial = document.getElementById('wall-material').value;
        this.params.roofMaterial = document.getElementById('roof-material').value;
        this.params.numWindows = parseInt(document.getElementById('num-windows').value);
        this.params.frontDoorPosition = document.getElementById('front-door-position').value;
        this.params.frontDoorType = document.getElementById('front-door-type').value;
        this.params.leftSideDoor = document.getElementById('left-side-door').value;
        this.params.rightSideDoor = document.getElementById('right-side-door').value;
        this.params.backDoor = document.getElementById('back-door').value;
        this.params.garageEntryDoor = document.getElementById('garage-entry-door').checked;
        this.params.frontPorch = document.getElementById('front-porch').value;
        this.params.backPorch = document.getElementById('back-porch').value;
        this.params.addChimney = document.getElementById('add-chimney').checked;
        this.params.garageType = document.getElementById('garage-type').value;

        // Rebuild the home
        this.buildHome();
        this.updateInfoPanel();
    }

    updateInfoPanel() {
        document.getElementById('info-width').textContent = `${this.params.houseWidth} ft`;
        document.getElementById('info-depth').textContent = `${this.params.houseDepth} ft`;
        document.getElementById('info-stories').textContent = this.params.numStories;
        document.getElementById('info-windows').textContent = this.params.numWindows;
        
        // Calculate house square footage based on shape
        let sqft = this.calculateShapeSquareFootage();
        
        // Add garage square footage if garage is present
        if (this.params.garageType !== 'none') {
            const garageWidth = this.params.garageType === 'single' ? 12 : 20;
            const garageDepth = 20;
            sqft += garageWidth * garageDepth;
        }
        
        document.getElementById('info-sqft').textContent = `${sqft.toLocaleString()} sq ft`;
    }

    calculateShapeSquareFootage() {
        const width = this.params.houseWidth;
        const depth = this.params.houseDepth;
        const stories = this.params.numStories;
        let totalSqft = 0;

        switch (this.params.houseShape) {
            case 'rectangle':
                totalSqft = width * depth * stories;
                break;
            case 'l-shape':
                // Main + wing
                totalSqft = (width * depth + (width * 0.6) * (depth * 0.5)) * stories;
                break;
            case 't-shape':
                // Main + extension
                totalSqft = (width * depth + (width * 0.4) * (depth * 0.6)) * stories;
                break;
            case 'u-shape':
                // Center + two wings
                totalSqft = (width * (depth * 0.6) + 2 * ((width * 0.3) * depth)) * stories;
                break;
            case 'with-wings':
                // Center + two wings
                totalSqft = ((width * 0.5) * depth + 2 * ((width * 0.25) * (depth * 0.7))) * stories;
                break;
            case 'courtyard':
                // Four sections
                totalSqft = (2 * (width * (depth * 0.3)) + 2 * ((width * 0.3) * (depth * 0.4))) * stories;
                break;
        }

        return Math.round(totalSqft);
    }

    async generateAIImages() {
        const button = document.getElementById('generate-ai-images');
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Generating... (30-60 seconds)';
        button.disabled = true;

        try {
            // 1. Capture 3D screenshot from optimal angle
            const savedPosition = this.camera.position.clone();
            const savedTarget = this.controls.target.clone();
            
            this.camera.position.set(50, 25, 50);
            this.camera.lookAt(0, 10, 0);
            this.controls.target.set(0, 10, 0);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);

            const screenshotBlob = await new Promise(resolve => {
                this.renderer.domElement.toBlob(blob => resolve(blob), 'image/png', 0.95);
            });

            // Restore camera position
            this.camera.position.copy(savedPosition);
            this.controls.target.copy(savedTarget);
            this.controls.update();

            // 2. Collect design data
            const designData = {
                structure: {
                    width: this.params.houseWidth,
                    depth: this.params.houseDepth,
                    stories: this.params.numStories,
                    roofStyle: this.params.roofStyle,
                    houseShape: this.params.houseShape
                },
                materials: {
                    exterior: this.params.wallMaterial,
                    roof: this.params.roofMaterial
                },
                features: {
                    windows: this.params.numWindows,
                    garage: this.params.garageType,
                    frontPorch: this.params.frontPorch,
                    backPorch: this.params.backPorch,
                    chimney: this.params.addChimney,
                    frontDoor: {
                        position: this.params.frontDoorPosition,
                        type: this.params.frontDoorType
                    },
                    backDoor: this.params.backDoor,
                    leftSideDoor: this.params.leftSideDoor,
                    rightSideDoor: this.params.rightSideDoor,
                    garageEntryDoor: this.params.garageEntryDoor
                },
                calculated: {
                    totalSqft: this.calculateShapeSquareFootage() + 
                              (this.params.garageType !== 'none' ? 
                                (this.params.garageType === 'single' ? 240 : 400) : 0)
                }
            };

            // 3. Send to n8n webhook
            const formData = new FormData();
            formData.append('screenshot', screenshotBlob, 'reference.png');
            formData.append('designData', JSON.stringify(designData));

            // TODO: Replace with your actual n8n webhook URL
            const n8nWebhookUrl = 'https://YOUR_N8N_URL/webhook/generate-images';
            
            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // 4. Display generated images
            this.displayGeneratedImages(result.images, designData);

        } catch (error) {
            console.error('Error generating images:', error);
            
            // For demo purposes, show what the request would look like
            if (error.message.includes('YOUR_N8N_URL')) {
                alert('📝 Demo Mode: AI generation is ready!\n\n' +
                      'To enable:\n' +
                      '1. Set up your n8n workflow\n' +
                      '2. Replace YOUR_N8N_URL in app.js with your webhook URL\n' +
                      '3. Configure image generation in n8n\n\n' +
                      'Design data has been collected and is ready to send.');
                console.log('Design data ready:', this.params);
            } else {
                alert('Failed to generate images. Please try again.\n\nError: ' + error.message);
            }
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    displayGeneratedImages(images, designData) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            color: white;
            text-align: center;
            margin-bottom: 20px;
            position: relative;
        `;
        header.innerHTML = `
            <h2 style="margin-bottom: 10px;">🏡 Your AI-Generated Home Concepts</h2>
            <p style="color: #ccc; font-size: 0.95rem;">Select your favorite design</p>
            <button onclick="document.getElementById('imageModal').remove()" 
                    style="position: absolute; top: 0; right: 20px; background: #ff4444; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                ✕ Close
            </button>
        `;
        modal.appendChild(header);

        // Image grid
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        `;

        images.forEach((imageUrl, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: transform 0.3s;
                cursor: pointer;
            `;
            card.onmouseover = () => card.style.transform = 'scale(1.02)';
            card.onmouseout = () => card.style.transform = 'scale(1)';

            card.innerHTML = `
                <img src="${imageUrl}" 
                     style="width: 100%; height: 300px; object-fit: cover; cursor: pointer;"
                     onclick="window.open('${imageUrl}', '_blank')">
                <div style="padding: 15px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Concept ${index + 1}</h3>
                    <p style="color: #666; font-size: 0.85rem; margin-bottom: 15px;">
                        ${designData.calculated.totalSqft.toLocaleString()} sq ft • 
                        ${designData.structure.stories} ${designData.structure.stories === 1 ? 'Story' : 'Stories'}
                    </p>
                    <button onclick="selectDesign('${imageUrl}', ${index})"
                            style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 8px;">
                        ✓ Select This Design
                    </button>
                    <button onclick="window.open('${imageUrl}', '_blank')"
                            style="width: 100%; padding: 10px; background: #f0f0f0; color: #333; border: none; border-radius: 6px; cursor: pointer;">
                        🔍 View Full Size
                    </button>
                </div>
            `;

            grid.appendChild(card);
        });

        modal.appendChild(grid);
        document.body.appendChild(modal);
    }

    selectDesign(imageUrl, designData) {
        // Store selected design
        window.selectedDesign = {
            image: imageUrl,
            data: designData,
            timestamp: new Date().toISOString()
        };

        // Close modal
        const modal = document.getElementById('imageModal');
        if (modal) modal.remove();

        // Show success message with cost calculation option
        const confirmDiv = document.createElement('div');
        confirmDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 1001;
            text-align: center;
            max-width: 500px;
        `;

        confirmDiv.innerHTML = `
            <h2 style="color: #667eea; margin-bottom: 15px;">✓ Design Selected!</h2>
            <img src="${imageUrl}" style="width: 100%; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin-bottom: 20px; color: #666; line-height: 1.6;">
                Your selected design has been saved.<br>
                Ready to see how much this would cost to build?
            </p>
            <button onclick="homeDesigner.calculateCostForDesign()" 
                    style="width: 100%; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 10px;">
                💰 Calculate Build Cost
            </button>
            <button onclick="this.parentElement.remove()" 
                    style="width: 100%; padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; cursor: pointer;">
                Close
            </button>
        `;

        document.body.appendChild(confirmDiv);
    }

    async generateAIImages() {
        console.log('🚀 Starting image generation...');
        
        const button = document.getElementById('generate-ai-images');
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Generating... (30-60 seconds)';
        button.disabled = true;

        try {
            // 1. Capture 3D screenshot from optimal angle
            console.log('📸 Capturing screenshot...');
            
            // Save current camera position and controls state
            const savedPosition = this.camera.position.clone();
            const savedTarget = this.controls.target.clone();
            const savedBackground = this.scene.background.clone();
            const savedGridVisible = this.gridHelper.visible;
            
            // Calculate dynamic camera distance based on house width
            const widthMeters = this.params.houseWidth * 0.3;
            const cameraDistance = widthMeters * 1.2;
            
            console.log(`Calculated camera distance: ${cameraDistance.toFixed(2)}m based on house width: ${this.params.houseWidth}ft`);
            
            // Hide grid and change background to white for clean screenshot
            this.gridHelper.visible = false;
            this.scene.background = new THREE.Color(0xFFFFFF);
            
            // Position camera for optimal photorealistic rendering
            // Slightly elevated front-angle view matches real estate photography
            this.camera.position.set(cameraDistance, cameraDistance * 0.35, cameraDistance);
            console.log('Camera positioned at:', this.camera.position);
            this.camera.lookAt(0, 8, 0);
            this.controls.target.set(0, 8, 0);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);

            // Convert to blob
            const screenshotBlob = await new Promise(resolve => {
                this.renderer.domElement.toBlob(blob => resolve(blob), 'image/png', 0.95);
            });
            
            console.log(`✅ Screenshot captured, size: ${(screenshotBlob.size / 1024).toFixed(2)} KB`);

            // IMMEDIATELY restore original view so user doesn't see any change
            this.camera.position.copy(savedPosition);
            this.controls.target.copy(savedTarget);
            this.gridHelper.visible = savedGridVisible;
            this.scene.background = savedBackground;
            this.controls.update();
            
            console.log('🔄 Original view restored');

            // 2. Collect design data
            console.log('📋 Collecting design data...');
            
            const designData = {
                structure: {
                    width: this.params.houseWidth,
                    depth: this.params.houseDepth,
                    stories: this.params.numStories,
                    roofStyle: this.params.roofStyle,
                    houseShape: this.params.houseShape
                },
                materials: {
                    exterior: this.params.wallMaterial,
                    roof: this.params.roofMaterial
                },
                features: {
                    windows: this.params.numWindows,
                    garage: this.params.garageType,
                    frontPorch: this.params.frontPorch,
                    backPorch: this.params.backPorch,
                    chimney: this.params.addChimney,
                    frontDoor: {
                        position: this.params.frontDoorPosition,
                        type: this.params.frontDoorType
                    },
                    backDoor: this.params.backDoor,
                    leftSideDoor: this.params.leftSideDoor,
                    rightSideDoor: this.params.rightSideDoor,
                    garageEntryDoor: this.params.garageEntryDoor
                },
                calculated: {
                    totalSqft: this.calculateShapeSquareFootage() + 
                              (this.params.garageType !== 'none' ? 
                                (this.params.garageType === 'single' ? 240 : 400) : 0)
                }
            };
            
            console.log('📊 Design data collected:', designData);

            // 3. Send to n8n webhook
            const formData = new FormData();
            formData.append('screenshot', screenshotBlob, 'reference.png');
            formData.append('designData', JSON.stringify(designData));

            console.log('📤 Sending to n8n webhook...');
            console.log('Webhook URL:', N8N_WEBHOOK_URL);
            
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData
            });

            console.log('📥 Response received, status:', response.status);

            if (!response.ok) {
                throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Response parsed:', result);

            // 4. Display generated images
            if (result.images && result.images.length > 0) {
                console.log(`🎨 Displaying ${result.images.length} generated images`);
                this.displayGeneratedImages(result.images, result.designData || designData);
            } else {
                throw new Error('No images returned from server');
            }

        } catch (error) {
            console.error('❌ Error generating images:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Friendly error messages
            let errorMessage = 'Failed to generate images. ';
            
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                errorMessage += 'Could not connect to server. Please check your internet connection and ensure n8n is running.';
            } else if (error.message.includes('Server returned error')) {
                errorMessage += error.message;
            } else if (error.message.includes('No images')) {
                errorMessage += 'Server did not return any images. Please try again.';
            } else {
                errorMessage += 'An unexpected error occurred.\n\nError: ' + error.message;
            }
            
            alert(errorMessage);
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
            console.log('🔄 Button state restored');
        }
    }

    displayGeneratedImages(images, designData) {
        console.log('🖼️ Displaying generated images modal...');
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            color: white;
            text-align: center;
            margin-bottom: 20px;
            position: relative;
        `;
        header.innerHTML = `
            <h2 style="margin-bottom: 10px; font-size: 2rem;">🎉 Your AI-Generated Home Concepts</h2>
            <p style="color: #ccc; font-size: 0.95rem;">Click any image to view full size</p>
            <button onclick="document.getElementById('imageModal').remove()" 
                    style="position: absolute; top: 0; right: 20px; background: white; color: #333; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                ✕ Close
            </button>
        `;
        modal.appendChild(header);

        // Image grid
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        `;

        images.forEach((imageUrl, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: transform 0.3s;
            `;
            card.onmouseover = () => card.style.transform = 'scale(1.02)';
            card.onmouseout = () => card.style.transform = 'scale(1)';

            const designDataJson = JSON.stringify(designData).replace(/'/g, "\\'");
            
            card.innerHTML = `
                <img src="${imageUrl}" 
                     style="width: 100%; height: 300px; object-fit: cover; cursor: pointer;"
                     onclick="window.open('${imageUrl}', '_blank')"
                     alt="AI Generated Home Concept ${index + 1}">
                <div style="padding: 15px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Concept ${index + 1}</h3>
                    <p style="color: #666; font-size: 0.85rem; margin-bottom: 15px;">
                        ${designData.calculated.totalSqft.toLocaleString()} sq ft • 
                        ${designData.structure.stories} ${designData.structure.stories === 1 ? 'Story' : 'Stories'}
                    </p>
                    <button onclick="window.open('${imageUrl}', '_blank')"
                            style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 8px; transition: all 0.2s;"
                            onmouseover="this.style.background='#5568d3'"
                            onmouseout="this.style.background='#667eea'">
                        🔍 View Full Size
                    </button>
                </div>
            `;

            grid.appendChild(card);
        });

        modal.appendChild(grid);
        document.body.appendChild(modal);
        
        console.log('✅ Image modal displayed');
    }


    calculateCostForDesign() {
        if (!window.selectedDesign) {
            alert('Please select a design first.');
            return;
        }

        const data = window.selectedDesign.data;
        
        // Simple cost estimation based on square footage
        const baseCostPerSqft = 150; // $150 per sq ft average
        const totalCost = data.calculated.totalSqft * baseCostPerSqft;
        
        // Additional costs for features
        let additionalCosts = 0;
        if (data.features.garage !== 'none') {
            additionalCosts += data.features.garage === 'single' ? 15000 : 25000;
        }
        if (data.features.frontPorch !== 'none') {
            additionalCosts += data.features.frontPorch === 'small' ? 3000 : 8000;
        }
        if (data.features.backPorch !== 'none') {
            additionalCosts += data.features.backPorch === 'screened' ? 12000 : 5000;
        }
        if (data.features.chimney) {
            additionalCosts += 5000;
        }

        const estimatedTotal = totalCost + additionalCosts;
        const lowRange = estimatedTotal * 0.85;
        const highRange = estimatedTotal * 1.15;

        // Create cost breakdown modal
        const costModal = document.createElement('div');
        costModal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 1002;
            max-width: 600px;
            width: 90%;
        `;

        costModal.innerHTML = `
            <h2 style="color: #667eea; margin-bottom: 20px; text-align: center;">💰 Estimated Build Cost</h2>
            
            <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: 600;">Base Construction:</span>
                    <span>${data.calculated.totalSqft.toLocaleString()} sq ft × $${baseCostPerSqft}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #ddd;">
                    <span style="font-weight: 600;">Additional Features:</span>
                    <span>$${additionalCosts.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold; color: #667eea;">
                    <span>Estimated Range:</span>
                    <span>$${lowRange.toLocaleString()} - $${highRange.toLocaleString()}</span>
                </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                <strong>Note:</strong> This is a rough estimate. Actual costs vary based on location, materials, labor, and site conditions.
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 10px; color: #333; font-size: 1rem;">Breakdown:</h3>
                <ul style="text-align: left; color: #666; line-height: 1.8;">
                    <li>Base: $${totalCost.toLocaleString()}</li>
                    ${data.features.garage !== 'none' ? `<li>Garage: +$${(data.features.garage === 'single' ? 15000 : 25000).toLocaleString()}</li>` : ''}
                    ${data.features.frontPorch !== 'none' ? `<li>Front Porch: +$${(data.features.frontPorch === 'small' ? 3000 : 8000).toLocaleString()}</li>` : ''}
                    ${data.features.backPorch !== 'none' ? `<li>Back Porch: +$${(data.features.backPorch === 'screened' ? 12000 : 5000).toLocaleString()}</li>` : ''}
                    ${data.features.chimney ? '<li>Chimney: +$5,000</li>' : ''}
                </ul>
            </div>
            
            <button onclick="this.parentElement.remove()" 
                    style="width: 100%; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
                Close
            </button>
        `;

        document.body.appendChild(costModal);
    }

    exportData() {
        // Calculate house square footage
        let squareFootage = this.params.houseWidth * this.params.houseDepth * this.params.numStories;
        
        // Add garage square footage if present
        if (this.params.garageType !== 'none') {
            const garageWidth = this.params.garageType === 'single' ? 12 : 20;
            const garageDepth = 20;
            squareFootage += garageWidth * garageDepth;
        }
        
        const data = {
            design: this.params,
            calculations: {
                squareFootage: squareFootage,
                houseArea: this.params.houseWidth * this.params.houseDepth,
                garageArea: this.params.garageType !== 'none' ? (this.params.garageType === 'single' ? 12 : 20) * 20 : 0,
                stories: this.params.numStories,
                windows: this.params.numWindows,
                volume: this.params.houseWidth * this.params.houseDepth * this.params.numStories * 10 // 10 ft per story
            },
            timestamp: new Date().toISOString()
        };

        // Convert to JSON
        const dataStr = JSON.stringify(data, null, 2);
        
        // Create blob and download
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `home-design-data-${Date.now()}.json`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    onWindowResize() {
        const container = document.querySelector('.canvas-3d-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Animation loop that updates controls and renders the scene
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application and make it globally accessible
const homeDesigner = new HomeDesigner();
window.homeDesigner = homeDesigner;
