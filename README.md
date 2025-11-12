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

Programs are **pure functions** that receive world state and return **declarative actions**. This structured approach ensures predictable, frame-by-frame execution with clear action semantics.

### Function Signature

```javascript
function(world) {
    // Your logic here
    // Return an array of action objects
    return [
        { type: 'move', direction: 'forward', speed: 2 },
        { type: 'turn', angle: 0.02 }
    ];
}
```

### World State Input

Each frame, your function receives a `world` object:

#### `world.self` - Your Avatar's State
- `position` - `{x, y, z}` position in the world
- `velocity` - `{x, y, z}` current velocity
- `rotation` - Current rotation angle in radians
- `onGround` - Boolean, true if avatar is on the ground

#### `world.avatars` - Nearby Avatars (Array)
Only includes avatars within **20 units** and **135° field of view**:
- `position` - `{x, y, z}` avatar position
- `velocity` - `{x, y, z}` avatar velocity
- `distance` - Distance from you
- `angle` - Angle from your forward direction

Sorted by distance (closest first).

#### `world.objects` - Nearby Objects (Array)
Only includes objects within **20 units** and **135° field of view**:
- `position` - `{x, y, z}` object position
- `distance` - Distance from you
- `angle` - Angle from your forward direction

Sorted by distance (closest first).

#### `world.time` - Current Time
Current simulation time in seconds (useful for time-based behaviors).

### Declarative Actions

Return an **array of action objects**. Each action has a `type` field and type-specific parameters.

#### Available Action Types

**Movement Action**
```javascript
{ type: 'move', direction: 'forward'|'backward'|'stop', speed: number }
```
- `direction`: Direction to move
- `speed`: Movement speed in units per frame

**Turn Action**
```javascript
{ type: 'turn', angle: number }
```
- `angle`: Rotation change in radians (**positive = left, negative = right**)

**Jump Action**
```javascript
{ type: 'jump' }
```
- No parameters needed
- Only executes if avatar is on ground

**Create Box Action**
```javascript
{ type: 'createBox', offset: {x, y, z} }
```
- `offset`: Position offset relative to avatar

**Log Action**
```javascript
{ type: 'log', message: string }
```
- `message`: Message to output to console

#### Action Array Example
```javascript
// Multiple actions can be performed in one frame
return [
    { type: 'move', direction: 'forward', speed: 3 },
    { type: 'turn', angle: 0.05 },
    { type: 'jump' },
    { type: 'log', message: "Moving forward!" }
];
```

## Example Programs

### Simple Walker
```javascript
function(world) {
    // Walk forward and turn slowly in a circle
    return [
        { type: 'move', direction: 'forward', speed: 2 },
        { type: 'turn', angle: 0.02 }
    ];
}
```

### Follower AI
```javascript
function(world) {
    // Follow the nearest avatar in view
    if (world.avatars.length > 0) {
        const target = world.avatars[0];
        const dx = target.position.x - world.self.position.x;
        const dz = target.position.z - world.self.position.z;
        const targetAngle = Math.atan2(dz, dx);

        // Calculate angle difference
        let angleDiff = targetAngle - world.self.rotation;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Turn towards target or move forward
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

    // No avatars visible, just wander
    return [
        { type: 'move', direction: 'forward', speed: 1 },
        { type: 'turn', angle: 0.02 }
    ];
}
```

### Builder Bot
```javascript
function(world) {
    // Build a structure while moving in a circle
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
}
```

### Dancing Avatar
```javascript
function(world) {
    // Dance with rhythm based on time
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
}
```

### Obstacle Avoider
```javascript
function(world) {
    // If there's an object close and in view, turn away
    let turnAngle = 0;

    if (world.objects.length > 0 && world.objects[0].distance < 5) {
        turnAngle = 0.15;  // Turn left to avoid
    }

    return [
        { type: 'move', direction: 'forward', speed: 2 },
        { type: 'turn', angle: turnAngle }
    ];
}
```

## Using AI to Program Your Avatar

This is where the magic happens! You can use AI assistants to help you create complex behaviors:

### Example AI Prompts

**To Claude, ChatGPT, or any AI assistant:**

> "I'm programming an avatar in a 3D simulation. Each frame, my function receives a `world` object with:
> - `world.self` (position, velocity, rotation, onGround)
> - `world.avatars` (nearby avatars in 135° FOV: position, velocity, distance, angle)
> - `world.objects` (nearby objects in 135° FOV: position, distance, angle)
> - `world.time` (current time in seconds)
>
> The function must return an array of declarative action objects:
> - `{ type: 'move', direction: 'forward'|'backward'|'stop', speed: number }`
> - `{ type: 'turn', angle: number }` (positive = left, negative = right)
> - `{ type: 'jump' }`
> - `{ type: 'createBox', offset: {x, y, z} }`
> - `{ type: 'log', message: string }`
>
> Can you write a function that makes the avatar patrol in a square pattern, and if it detects another avatar, approach and circle around them?"

> "Write an avatar program that explores randomly but avoids obstacles when they're within 3 units. When it sees an object directly ahead, it should turn away."

> "Create a program that builds a spiral tower using createBox(). Track state across frames using world.time to control when and where to place boxes."

> "Make my avatar act like a sheepdog - when it sees multiple avatars, calculate their center point and try to push them together by positioning between the furthest one and the center."

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

- **Pure Functions**: Programs run every frame (60 FPS), so keep them efficient
- **Declarative Actions**: Return arrays of explicit action objects - it's clear what you're commanding
- **Stateless**: Functions receive fresh world state each frame - use `world.time` for temporal patterns
- **Field of View**: Avatars only see what's within 20 units and 135° viewing cone
- **Probabilistic Behavior**: Use `Math.random()` for non-deterministic actions
- **Conditional Actions**: Build action arrays dynamically with conditionals and `.push()`
- **Debugging**: Include `{ type: 'log', message: '...' }` actions to output debug info
- **Emergent Behavior**: Simple rules + multiple avatars = complex interactions
- **Test Incrementally**: Start with basic movement, then add perception and reactions

## Philosophy

This simulation explores a unique interaction paradigm: **indirect control through programming**. Instead of using WASD keys, you write the brain of your avatar. With AI assistants, even non-programmers can create sophisticated behaviors by describing what they want in natural language.

The **declarative action system** makes available behaviors explicit and composable. Each action has a clear type and purpose. The **structured function API** (world state in → action array out) creates a clean contract that's easy for both humans and AI to reason about. Limited perception (field of view, range) forces interesting emergent behaviors as avatars react to their local environment.

The result is a sandbox where:
- **Players become designers** rather than controllers
- **AI serves as a programming partner** to translate ideas into code
- **Emergence happens** when simple programs interact in complex ways
- **Creativity is expressed through logic** rather than reflexes
- **Predictability meets chaos** through deterministic rules and probabilistic choices
- **Actions are explicit** - you can see exactly what an avatar can do

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D Graphics Library
- [Cannon.js](https://schteppe.github.io/cannon.js/) - Physics Engine

---

**Have fun programming your avatars! 🚀**

Remember: The best way to program your avatar is to describe what you want to an AI, let it write the code, test it, and iterate!
