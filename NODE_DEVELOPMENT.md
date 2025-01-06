# n8n Custom Node Development Guide

## Initial Setup
## Node Development

### 1. Basic Node Structure
Create a new file `src/nodes/YourNode.node.ts`:
```typescript
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

export class YourNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Your Node',
		name: 'yourNodeName',
		icon: 'file:yourNode.svg',
		group: ['transform'],
		version: 1,
		description: 'Description of your node',
		defaults: {
			name: 'Your Node',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'yourCredentialsName',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create something',
						action: 'Create something',
					},
				],
				default: 'create',
			},
			// Add more properties as needed
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		// Your node logic here
		
		return [returnData];
	}
}
```

### 2. Node Export Structure
Create `src/nodes/index.ts` to properly export your nodes:
```typescript
import type { INodeType } from 'n8n-workflow';
import { YourNode } from './YourNode.node';

// Export as array for n8n to discover
export const nodes: INodeType[] = [
	new YourNode(),
];

// Also export the class for reuse
export { YourNode };
```

### 3. Main Export File
Create `src/index.ts` in your project root:
```typescript
import { nodes } from './nodes';

export { nodes };
```

### 4. Package Configuration
Update your `package.json`:
```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "description": "Your package description",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": [
      "dist/nodes/YourNode.node.js"
    ]
  }
}
```

### 5. TypeScript Configuration
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "target": "es2019",
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "declaration": true,
    "removeComments": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules/**/*", "dist/**/*"]
}
```

## Testing Your Node

### 1. Local Testing
```bash
# Build your node
npm run build

# Create a symbolic link
npm link

# Navigate to your n8n installation
cd /path/to/n8n

# Link your node package
npm link your-package-name

# Restart n8n
n8n start
```

### 2. Development Testing
For faster development cycles:
```bash
# In your node package directory
npm run dev

# In another terminal (n8n directory)
n8n start
```

## Debugging

### 1. VS Code Launch Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Node",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/n8n/bin/n8n",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "N8N_USER_FOLDER": "${workspaceFolder}"
      }
    }
  ]
}
```

### 2. Common Issues and Solutions

#### Node Not Loading in n8n
If you see "Unexpected token '*'" error or nodes not loading:
1. Ensure your package.json `n8n.nodes` paths are specific:
```json
"n8n": {
  "nodes": [
    "dist/nodes/YourNode.node.js"
  ]
}
```
2. Verify your node exports follow the correct pattern in src/nodes/index.ts:
```typescript
export const nodes: INodeType[] = [
  new YourNode(),
];
```
3. Check that main index.ts exports nodes correctly:
```typescript
export { nodes };
```

#### Build Issues
- Ensure rootDir in tsconfig.json points to src:
```json
{
  "compilerOptions": {
    "rootDir": "./src"
  }
}
```
- Clean dist directory before rebuilding:
```bash
rm -rf dist && npm run build
```

## Publishing

### 1. Prepare for Publishing
```bash
# Update version in package.json
npm version patch/minor/major

# Build the package
npm run build

# Create README.md with documentation
touch README.md
```

### 2. Publish to npm
```bash
# Login to npm
npm login

# Publish package
npm publish

# For scoped packages
npm publish --access public
```

## Best Practices

### 1. Code Organization
- Keep node logic in separate files
- Use TypeScript interfaces for data structures
- Implement proper error handling
- Add comprehensive comments

### 2. Testing
Create test files for your node:
```bash
mkdir -p __tests__
touch __tests__/YourNode.test.ts
```

Example test structure:
```typescript
import { YourNode } from '../src/nodes/YourNode.node';

describe('YourNode', () => {
  let node: YourNode;

  beforeEach(() => {
    node = new YourNode();
  });

  it('should have valid properties', () => {
    expect(node.description.properties).toBeDefined();
  });

  // Add more tests
});
```

### 3. Documentation
Create comprehensive documentation in your README.md:
- Installation instructions
- Configuration details
- Usage examples
- Troubleshooting guide
- API references

## Resources
- [n8n Node Development Documentation](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Node Examples](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [npm Documentation](https://docs.npmjs.com/) 