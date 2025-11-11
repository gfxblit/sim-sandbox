# AI Avatar Programming Sim 🤖

A web-based 3D simulation where players don't directly control their avatars, but instead **program them** using JavaScript. The unique feature: you can use AI assistants (like Claude, ChatGPT, etc.) to help you write avatar behaviors!

Think of it as a simplified Second Life where avatars are autonomous agents that follow programs you create.

## Features

- **3D Physics Simulation**: Built with Three.js and Cannon.js
- **Programmable Avatars**: Upload JavaScript programs to control avatar behavior
- **AI-Assisted Programming**: Use any AI assistant to help write avatar behaviors
- **Real-time Execution**: Watch your code come to life in the simulation
- **World Building**: Avatars can create objects in the world
- **Multi-Avatar Support**: Spawn and program multiple avatars
- **Social Behaviors**: Avatars can detect and interact with each other

## Quick Start

1. Open `index.html` in a modern web browser
2. You'll see a 3D world with three initial avatars (blue, red, green)
3. Select an avatar from the dropdown
4. Write or paste a program in the code editor
5. Click "Upload Program" to see your avatar come to life!

## Avatar Programming API

Your avatar programs have access to these methods:

### Movement
- `this.moveForward(speed)` - Move forward at given speed
- `this.moveBackward(speed)` - Move backward at given speed
- `this.turnLeft(angle)` - Turn left by angle in radians
- `this.turnRight(angle)` - Turn right by angle in radians
- `this.jump()` - Jump (if on ground)

### Sensing
- `this.getPosition()` - Returns `{x, y, z}` position
- `this.getVelocity()` - Returns `{x, y, z}` velocity
- `this.getRotation()` - Returns rotation angle in radians
- `this.getNearbyAvatars(radius)` - Returns array of nearby avatars with positions
- `this.getNearbyObjects(radius)` - Returns array of nearby objects with positions

### World Interaction
- `this.createBox(offset)` - Create a box at offset from avatar position
- `this.log(message)` - Log a message to console

## Example Programs

### Simple Walker
```javascript
// Walk forward and turn slowly
this.moveForward(2);
this.turnRight(0.02);
```

### Follower AI
```javascript
// Follow the nearest avatar
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
}
```

### Builder Bot
```javascript
// Build a structure while walking
const pos = this.getPosition();
if (Math.random() < 0.02) {
    this.createBox({ x: 0, y: 0, z: -2 });
    this.log("Building...");
}
this.moveForward(1);
this.turnRight(0.03);
```

### Dancing Avatar
```javascript
// Dance with rhythm
const time = Date.now() / 1000;
const wave = Math.sin(time * 2);

this.turnRight(0.05);
this.moveForward(2 + wave);

if (Math.sin(time * 3) > 0.7) {
    this.jump();
}
```

## Using AI to Program Your Avatar

This is where the magic happens! You can use AI assistants to help you create complex behaviors:

### Example AI Prompts

**To Claude, ChatGPT, or any AI assistant:**

> "I'm programming an avatar in a 3D simulation. I have access to these methods: [paste API above]. Can you write me a program that makes the avatar patrol in a square pattern, and if it detects another avatar nearby, it should approach and circle around them?"

> "Create an avatar behavior that explores the world randomly, but avoids obstacles and jumps over objects in its path. Use the getNearbyObjects() method."

> "Write a program for my avatar to build a spiral tower using createBox(), where each box is placed slightly rotated and higher than the last."

> "Make my avatar act like a sheepdog - it should detect all nearby avatars and try to herd them together into one location."

### AI Programming Workflow

1. **Describe the Behavior**: Tell the AI what you want your avatar to do
2. **Copy the Code**: The AI will generate JavaScript code using the API
3. **Paste & Test**: Put the code in the editor and upload it to your avatar
4. **Iterate**: Ask the AI to refine or fix issues you observe
5. **Combine Behaviors**: Use AI to merge multiple behaviors into complex agents

### Advanced AI Use Cases

- **Emergent Behaviors**: Ask AI to create flocking algorithms, predator-prey dynamics
- **Procedural Building**: Generate code for constructing complex structures
- **State Machines**: Create avatars with multiple behavioral states
- **Cooperative Tasks**: Program multiple avatars to work together
- **Learning Behaviors**: Implement simple reinforcement learning loops

## Controls

- **Mouse Drag**: Rotate camera around the scene
- **Mouse Wheel**: Zoom in/out
- **Upload Program**: Start running the current code on selected avatar
- **Stop Program**: Stop the selected avatar's program
- **Spawn Avatar**: Create a new avatar at a random location

## Technical Details

### Architecture
- **Three.js**: 3D rendering and scene management
- **Cannon.js**: Physics simulation and collision detection
- **Vanilla JavaScript**: No framework dependencies for easy customization

### Program Execution
- Programs run in the animation loop (60 FPS)
- Each avatar maintains its own program state
- Code is executed in a controlled context with access to the API
- Programs can be hot-swapped without restarting the simulation

### Physics
- Gravity: -9.82 m/s²
- Avatar mass: 5 units
- Collision detection between all objects
- Ground plane prevents falling

## Extending the Simulation

Want to add more features? Here are some ideas:

1. **Communication**: Add `this.sendMessage()` and message handlers
2. **Energy System**: Avatars need to find energy sources
3. **Inventory**: Avatars can pick up and carry objects
4. **Perception Cone**: Limit vision to forward direction
5. **Terrain**: Add hills, obstacles, and interesting geography
6. **Persistence**: Save/load avatar programs
7. **Multiplayer**: Connect multiple users' avatars in real-time
8. **Visual Programming**: Drag-and-drop behavior blocks
9. **Neural Networks**: Train avatars with ML models
10. **Economy**: Resource gathering and trading between avatars

## Tips for Programming

- Programs run every frame, so keep them efficient
- Use `Math.random()` for probabilistic behaviors
- Store state using `Date.now()` for time-based patterns
- Test with one avatar before applying to multiple
- Use `this.log()` to debug your programs
- Combine simple behaviors to create complex emergent behavior

## Philosophy

This simulation explores a unique interaction paradigm: **indirect control through programming**. Instead of using WASD keys, you write the brain of your avatar. With AI assistants, even non-programmers can create sophisticated behaviors by describing what they want in natural language.

The result is a sandbox where:
- **Players become designers** rather than controllers
- **AI serves as a programming partner**
- **Emergence happens** when programs interact
- **Creativity is expressed through code**

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D Graphics Library
- [Cannon.js](https://schteppe.github.io/cannon.js/) - Physics Engine

---

**Have fun programming your avatars! 🚀**

Remember: The best way to program your avatar is to describe what you want to an AI, let it write the code, test it, and iterate!
