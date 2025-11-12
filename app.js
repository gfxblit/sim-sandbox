// AI Avatar Programming Sim - Main Application

class AvatarSim {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.avatars = [];
        this.worldObjects = [];
        this.selectedAvatarIndex = 0;
        this.timeStep = 1 / 60;

        this.init();
        this.animate();
        this.setupUI();
    }

    init() {
        // Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Cannon.js physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        // Ground
        this.createGround();

        // Create initial avatars
        this.createAvatar(0, 2, 0, 0x3498db); // Blue
        this.createAvatar(-5, 2, 5, 0xe74c3c); // Red
        this.createAvatar(5, 2, 5, 0x2ecc71); // Green

        // Add some world objects
        this.createWorldBox(-10, 1, -10, 0xf39c12);
        this.createWorldBox(10, 1, -10, 0x9b59b6);
        this.createWorldBox(0, 1, -15, 0x1abc9c);

        // Mouse controls
        this.setupControls();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createGround() {
        // Visual ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x90ee90,
            roughness: 0.8,
            metalness: 0.2
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

        // Grid helper
        const gridHelper = new THREE.GridHelper(100, 20, 0x000000, 0x000000);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // Physics ground
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
    }

    createAvatar(x, y, z, color) {
        const avatar = new Avatar(x, y, z, color, this.scene, this.world);
        this.avatars.push(avatar);
        return avatar;
    }

    createWorldBox(x, y, z, color) {
        const size = 2;

        // Visual
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);
        this.world.addBody(body);

        this.worldObjects.push({ mesh, body });
    }

    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const rotationSpeed = 0.005;
        const cameraDistance = 35;

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            const phi = Math.atan2(this.camera.position.z, this.camera.position.x);
            const theta = Math.atan2(
                Math.sqrt(this.camera.position.x ** 2 + this.camera.position.z ** 2),
                this.camera.position.y
            );

            const newPhi = phi - deltaX * rotationSpeed;
            const newTheta = Math.max(0.1, Math.min(Math.PI - 0.1, theta + deltaY * rotationSpeed));

            this.camera.position.x = cameraDistance * Math.sin(newTheta) * Math.cos(newPhi);
            this.camera.position.y = cameraDistance * Math.cos(newTheta);
            this.camera.position.z = cameraDistance * Math.sin(newTheta) * Math.sin(newPhi);
            this.camera.lookAt(0, 2, 0);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const currentDistance = this.camera.position.length();
            const newDistance = Math.max(10, Math.min(100, currentDistance + e.deltaY * zoomSpeed));
            const scale = newDistance / currentDistance;
            this.camera.position.multiplyScalar(scale);
        });
    }

    setupUI() {
        const uploadBtn = document.getElementById('upload-btn');
        const stopBtn = document.getElementById('stop-btn');
        const spawnBtn = document.getElementById('spawn-btn');
        const codeEditor = document.getElementById('code-editor');
        const avatarSelect = document.getElementById('avatar-select');

        uploadBtn.addEventListener('click', () => {
            const code = codeEditor.value;
            const avatarIndex = parseInt(avatarSelect.value);
            if (this.avatars[avatarIndex]) {
                try {
                    this.avatars[avatarIndex].uploadProgram(code);
                    this.logConsole(`✓ Program uploaded to Avatar ${avatarIndex + 1}`);
                } catch (error) {
                    this.logConsole(`✗ Error: ${error.message}`, true);
                }
            }
        });

        stopBtn.addEventListener('click', () => {
            const avatarIndex = parseInt(avatarSelect.value);
            if (this.avatars[avatarIndex]) {
                this.avatars[avatarIndex].stopProgram();
                this.logConsole(`⏹ Program stopped for Avatar ${avatarIndex + 1}`);
            }
        });

        spawnBtn.addEventListener('click', () => {
            const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const x = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;

            this.createAvatar(x, 2, z, randomColor);

            // Update select dropdown
            const option = document.createElement('option');
            option.value = this.avatars.length - 1;
            option.textContent = `Avatar ${this.avatars.length} (Custom)`;
            avatarSelect.appendChild(option);

            this.logConsole(`➕ New avatar spawned at (${x.toFixed(1)}, ${z.toFixed(1)})`);
        });

        // Example programs
        const examples = {
            follow: `function(world) {
    // Follow the nearest avatar
    if (world.avatars.length > 0) {
        const target = world.avatars[0];
        const dx = target.position.x - world.self.position.x;
        const dz = target.position.z - world.self.position.z;
        const targetAngle = Math.atan2(dz, dx);

        let angleDiff = targetAngle - world.self.rotation;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        if (Math.abs(angleDiff) > 0.1) {
            return [
                { type: 'turn', angle: angleDiff * 0.3 }
            ];
        } else {
            return [
                { type: 'move', direction: 'forward', speed: 3 }
            ];
        }
    }

    return [
        { type: 'move', direction: 'forward', speed: 1 },
        { type: 'turn', angle: 0.02 }
    ];
}`,
            dance: `function(world) {
    // Dance in a pattern
    const wave = Math.sin(world.time * 2);
    const shouldJump = Math.sin(world.time * 3) > 0.7;

    const actions = [
        { type: 'move', direction: 'forward', speed: 2 + wave },
        { type: 'turn', angle: -0.05 }
    ];

    if (shouldJump) {
        actions.push({ type: 'jump' });
    }

    return actions;
}`,
            builder: `function(world) {
    // Build structures while moving
    const shouldBuild = Math.random() < 0.02;

    const actions = [
        { type: 'move', direction: 'forward', speed: 1 },
        { type: 'turn', angle: -0.03 }
    ];

    if (shouldBuild) {
        actions.push({ type: 'createBox', offset: { x: 0, y: 0, z: -2 } });
        actions.push({ type: 'log', message: "Building..." });
    }

    return actions;
}`,
            explorer: `function(world) {
    // Random explorer that avoids obstacles
    let turnAngle = 0;

    // Random direction changes
    if (Math.random() < 0.02) {
        turnAngle = (Math.random() - 0.5) * 0.2;
    }

    // Avoid nearby objects
    if (world.objects.length > 0 && world.objects[0].distance < 5) {
        turnAngle = 0.1;
    }

    const actions = [
        { type: 'move', direction: 'forward', speed: 2 },
        { type: 'turn', angle: turnAngle }
    ];

    if (Math.random() < 0.005) {
        actions.push({ type: 'jump' });
        actions.push({ type: 'log', message: "Exploring!" });
    }

    return actions;
}`
        };

        document.querySelectorAll('.example-link').forEach(link => {
            link.addEventListener('click', () => {
                const example = link.getAttribute('data-example');
                if (examples[example]) {
                    codeEditor.value = examples[example];
                    this.logConsole(`📝 Loaded example: ${link.textContent}`);
                }
            });
        });
    }

    logConsole(message, isError = false) {
        const consoleDiv = document.getElementById('console');
        const msgDiv = document.createElement('div');
        msgDiv.className = isError ? 'console-error' : 'console-msg';
        msgDiv.textContent = `> ${message}`;
        consoleDiv.appendChild(msgDiv);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;

        // Keep only last 50 messages
        while (consoleDiv.children.length > 50) {
            consoleDiv.removeChild(consoleDiv.firstChild);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update physics
        this.world.step(this.timeStep);

        // Update avatars
        this.avatars.forEach(avatar => {
            avatar.update(this.avatars, this.worldObjects);
        });

        // Update world objects
        this.worldObjects.forEach(obj => {
            obj.mesh.position.copy(obj.body.position);
            obj.mesh.quaternion.copy(obj.body.quaternion);
        });

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Avatar Class
class Avatar {
    constructor(x, y, z, color, scene, world) {
        this.scene = scene;
        this.world = world;
        this.color = color;
        this.program = null;
        this.programFunction = null;

        this.createBody(x, y, z);
        this.rotation = 0;
    }

    createBody(x, y, z) {
        // Create humanoid representation
        const group = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.color });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.y = 0.75;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: this.color });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        headMesh.position.y = 1.8;
        headMesh.castShadow = true;
        group.add(headMesh);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.85, 0.35);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.85, 0.35);
        group.add(rightEye);

        // Pupils
        const pupilGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.15, 1.85, 0.4);
        group.add(leftPupil);
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.15, 1.85, 0.4);
        group.add(rightPupil);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.25, 1, 0.25);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.65, 0.75, 0);
        leftArm.castShadow = true;
        group.add(leftArm);
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.65, 0.75, 0);
        rightArm.castShadow = true;
        group.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.25, -0.4, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.25, -0.4, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);

        group.position.set(x, y, z);
        this.mesh = group;
        this.scene.add(group);

        // Physics body
        const shape = new CANNON.Cylinder(0.5, 0.5, 2, 8);
        this.body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(x, y, z),
            linearDamping: 0.9,
            angularDamping: 0.9
        });
        this.body.addShape(shape);
        this.body.fixedRotation = true;
        this.body.updateMassProperties();
        this.world.addBody(this.body);
    }

    uploadProgram(code) {
        try {
            // Expect a function that takes world state and returns actions
            // Wrap the code in a function declaration
            const wrappedCode = `return (${code});`;
            const programFunction = new Function(wrappedCode);
            this.program = code;
            this.programFunction = programFunction();

            // Validate it's a function
            if (typeof this.programFunction !== 'function') {
                throw new Error('Program must be a function that takes (world) as parameter');
            }
        } catch (error) {
            throw new Error(`Program compilation failed: ${error.message}`);
        }
    }

    stopProgram() {
        this.program = null;
        this.programFunction = null;
        // Stop movement
        this.body.velocity.set(0, this.body.velocity.y, 0);
        this.body.angularVelocity.set(0, 0, 0);
    }

    update(allAvatars, worldObjects) {
        // Sync mesh with physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.rotation.y = this.rotation;

        // Execute program
        if (this.programFunction) {
            try {
                const worldState = this.buildWorldState(allAvatars, worldObjects);
                const actions = this.programFunction(worldState);
                if (actions) {
                    this.executeActions(actions, worldObjects);
                }
            } catch (error) {
                console.error('Program execution error:', error);
                this.stopProgram();
            }
        }
    }

    buildWorldState(allAvatars, worldObjects) {
        const perceptionRange = 20; // Distance avatars can perceive
        const perceptionAngle = Math.PI * 0.75; // 135 degrees (field of view)

        // Build self state
        const self = {
            position: {
                x: this.body.position.x,
                y: this.body.position.y,
                z: this.body.position.z
            },
            velocity: {
                x: this.body.velocity.x,
                y: this.body.velocity.y,
                z: this.body.velocity.z
            },
            rotation: this.rotation,
            onGround: Math.abs(this.body.velocity.y) < 0.1
        };

        // Forward direction vector
        const forwardX = Math.sin(this.rotation);
        const forwardZ = Math.cos(this.rotation);

        // Find nearby avatars within perception range and viewing angle
        const avatars = [];
        allAvatars.forEach(avatar => {
            if (avatar === this) return;

            const dx = avatar.body.position.x - this.body.position.x;
            const dz = avatar.body.position.z - this.body.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < perceptionRange) {
                // Check if within viewing angle
                const dotProduct = (dx * forwardX + dz * forwardZ) / distance;
                const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

                if (angle < perceptionAngle / 2) {
                    avatars.push({
                        position: {
                            x: avatar.body.position.x,
                            y: avatar.body.position.y,
                            z: avatar.body.position.z
                        },
                        velocity: {
                            x: avatar.body.velocity.x,
                            y: avatar.body.velocity.y,
                            z: avatar.body.velocity.z
                        },
                        distance: distance,
                        angle: angle
                    });
                }
            }
        });

        // Sort by distance
        avatars.sort((a, b) => a.distance - b.distance);

        // Find nearby objects within perception range and viewing angle
        const objects = [];
        worldObjects.forEach(obj => {
            const dx = obj.body.position.x - this.body.position.x;
            const dz = obj.body.position.z - this.body.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < perceptionRange) {
                // Check if within viewing angle
                const dotProduct = (dx * forwardX + dz * forwardZ) / distance;
                const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

                if (angle < perceptionAngle / 2) {
                    objects.push({
                        position: {
                            x: obj.body.position.x,
                            y: obj.body.position.y,
                            z: obj.body.position.z
                        },
                        distance: distance,
                        angle: angle
                    });
                }
            }
        });

        // Sort by distance
        objects.sort((a, b) => a.distance - b.distance);

        return {
            self,
            avatars,
            objects,
            time: Date.now() / 1000
        };
    }

    executeActions(actions, worldObjects) {
        // Actions should be an array of action objects
        if (!Array.isArray(actions)) {
            console.warn('Actions must be an array');
            return;
        }

        // Process each action
        actions.forEach(action => {
            if (!action || !action.type) return;

            switch (action.type) {
                case 'move':
                    this.handleMoveAction(action);
                    break;

                case 'turn':
                    this.handleTurnAction(action);
                    break;

                case 'jump':
                    this.handleJumpAction(action);
                    break;

                case 'createBox':
                    this.handleCreateBoxAction(action, worldObjects);
                    break;

                case 'log':
                    this.handleLogAction(action);
                    break;

                default:
                    console.warn(`Unknown action type: ${action.type}`);
            }
        });
    }

    handleMoveAction(action) {
        const direction = action.direction || 'forward';
        const speed = action.speed || 0;

        if (direction === 'forward') {
            const dir = new CANNON.Vec3(
                Math.sin(this.rotation) * speed,
                0,
                Math.cos(this.rotation) * speed
            );
            this.body.velocity.x = dir.x;
            this.body.velocity.z = dir.z;
        } else if (direction === 'backward') {
            const dir = new CANNON.Vec3(
                -Math.sin(this.rotation) * speed,
                0,
                -Math.cos(this.rotation) * speed
            );
            this.body.velocity.x = dir.x;
            this.body.velocity.z = dir.z;
        } else if (direction === 'stop') {
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
        }
    }

    handleTurnAction(action) {
        // angle: positive = left, negative = right
        const angle = action.angle || 0;
        this.rotation += angle;
    }

    handleJumpAction(action) {
        if (Math.abs(this.body.velocity.y) < 0.1) {
            this.body.velocity.y = 5;
        }
    }

    handleCreateBoxAction(action, worldObjects) {
        const offset = action.offset || { x: 0, y: 0, z: 0 };
        const size = 1;
        const worldPos = new THREE.Vector3(
            this.body.position.x + (offset.x || 0),
            this.body.position.y + (offset.y || 0) + 1,
            this.body.position.z + (offset.z || 0)
        );

        // Visual
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.7
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(worldPos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
        const body = new CANNON.Body({
            mass: 0.5,
            position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z)
        });
        body.addShape(shape);
        this.world.addBody(body);

        worldObjects.push({ mesh, body });
    }

    handleLogAction(action) {
        const message = action.message || '';
        console.log(`[Avatar]: ${message}`);
    }
}

// Initialize the simulation
window.addEventListener('DOMContentLoaded', () => {
    const sim = new AvatarSim();
    window.sim = sim; // For debugging
});
