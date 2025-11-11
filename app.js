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
            follow: `// Follow the nearest avatar
const nearby = this.getNearbyAvatars(20);
if (nearby.length > 0) {
    const target = nearby[0];
    const pos = this.getPosition();
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const angle = Math.atan2(dz, dx);
    const myAngle = this.getRotation();

    let angleDiff = angle - myAngle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    if (Math.abs(angleDiff) > 0.1) {
        if (angleDiff > 0) this.turnLeft(0.05);
        else this.turnRight(0.05);
    } else {
        this.moveForward(3);
    }
}`,
            dance: `// Dance in a pattern
const time = Date.now() / 1000;
const wave = Math.sin(time * 2);

this.turnRight(0.05);
this.moveForward(2 + wave);

if (Math.sin(time * 3) > 0.7) {
    this.jump();
}`,
            builder: `// Build structures
const pos = this.getPosition();
if (Math.random() < 0.02) {
    this.createBox({ x: 0, y: 0, z: -2 });
    this.log("Building...");
}

this.moveForward(1);
this.turnRight(0.03);`,
            explorer: `// Random explorer
if (Math.random() < 0.02) {
    this.turnRight((Math.random() - 0.5) * 0.2);
}

this.moveForward(2);

const nearby = this.getNearbyObjects(5);
if (nearby.length > 0) {
    this.turnRight(0.1);
}

if (Math.random() < 0.005) {
    this.jump();
    this.log("Exploring!");
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
            // Create a safe execution context
            const programFunction = new Function('ctx', `
                with(ctx) {
                    ${code}
                }
            `);
            this.program = code;
            this.programFunction = programFunction;
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
                const api = this.createAPI(allAvatars, worldObjects);
                this.programFunction(api);
            } catch (error) {
                console.error('Program execution error:', error);
                this.stopProgram();
            }
        }
    }

    createAPI(allAvatars, worldObjects) {
        const self = this;
        return {
            moveForward: (speed) => {
                const direction = new CANNON.Vec3(
                    Math.sin(self.rotation) * speed,
                    0,
                    Math.cos(self.rotation) * speed
                );
                self.body.velocity.x = direction.x;
                self.body.velocity.z = direction.z;
            },
            moveBackward: (speed) => {
                const direction = new CANNON.Vec3(
                    -Math.sin(self.rotation) * speed,
                    0,
                    -Math.cos(self.rotation) * speed
                );
                self.body.velocity.x = direction.x;
                self.body.velocity.z = direction.z;
            },
            turnLeft: (angle) => {
                self.rotation += angle;
            },
            turnRight: (angle) => {
                self.rotation -= angle;
            },
            jump: () => {
                if (Math.abs(self.body.velocity.y) < 0.1) {
                    self.body.velocity.y = 5;
                }
            },
            getPosition: () => {
                return {
                    x: self.body.position.x,
                    y: self.body.position.y,
                    z: self.body.position.z
                };
            },
            getVelocity: () => {
                return {
                    x: self.body.velocity.x,
                    y: self.body.velocity.y,
                    z: self.body.velocity.z
                };
            },
            getRotation: () => {
                return self.rotation;
            },
            getNearbyAvatars: (radius) => {
                const nearby = [];
                const myPos = self.body.position;

                allAvatars.forEach(avatar => {
                    if (avatar === self) return;
                    const distance = myPos.distanceTo(avatar.body.position);
                    if (distance < radius) {
                        nearby.push({
                            x: avatar.body.position.x,
                            y: avatar.body.position.y,
                            z: avatar.body.position.z,
                            distance: distance
                        });
                    }
                });

                return nearby.sort((a, b) => a.distance - b.distance);
            },
            getNearbyObjects: (radius) => {
                const nearby = [];
                const myPos = self.body.position;

                worldObjects.forEach(obj => {
                    const distance = myPos.distanceTo(obj.body.position);
                    if (distance < radius) {
                        nearby.push({
                            x: obj.body.position.x,
                            y: obj.body.position.y,
                            z: obj.body.position.z,
                            distance: distance
                        });
                    }
                });

                return nearby.sort((a, b) => a.distance - b.distance);
            },
            createBox: (offset = { x: 0, y: 0, z: 0 }) => {
                const size = 1;
                const worldPos = new THREE.Vector3(
                    self.body.position.x + offset.x,
                    self.body.position.y + offset.y + 1,
                    self.body.position.z + offset.z
                );

                // Visual
                const geometry = new THREE.BoxGeometry(size, size, size);
                const material = new THREE.MeshStandardMaterial({
                    color: self.color,
                    roughness: 0.7
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(worldPos);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                self.scene.add(mesh);

                // Physics
                const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
                const body = new CANNON.Body({
                    mass: 0.5,
                    position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z)
                });
                body.addShape(shape);
                self.world.addBody(body);

                worldObjects.push({ mesh, body });
            },
            log: (message) => {
                console.log(`[Avatar]: ${message}`);
            }
        };
    }
}

// Initialize the simulation
window.addEventListener('DOMContentLoaded', () => {
    const sim = new AvatarSim();
    window.sim = sim; // For debugging
});
