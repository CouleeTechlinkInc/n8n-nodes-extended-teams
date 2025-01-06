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
		inputs: ['main'],
		outputs: ['main'],
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

### 2. Credentials Structure
Create a new file `src/credentials/YourCredentials.credentials.ts`:
```typescript
import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class YourCredentials implements ICredentialType {
	name = 'yourCredentialsName';
	displayName = 'Your Credentials';
	documentationUrl = 'your/documentation/url';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		// Add more credential properties as needed
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '={{"Bearer " + $credentials.apiKey}}',
			},
		},
	};
}
```

### 3. Register Node and Credentials
Update `src/nodes/index.ts`:
```typescript
import { YourNode } from './YourNode.node';

export { YourNode };
```

Update `src/credentials/index.ts`:
```typescript
import { YourCredentials } from './YourCredentials.credentials';

export { YourCredentials };
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
npm link n8n-nodes-<your-package-name>

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

### 2. Adding Debug Logs
```typescript
import { LoggerProxy as Logger } from 'n8n-workflow';

// In your node's execute function
Logger.debug('Debug message');
Logger.info('Info message');
Logger.warn('Warning message');
Logger.error('Error message');
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

## Common Issues and Solutions

### 1. Node Not Appearing in n8n
- Check package.json n8n configuration
- Verify node registration in index.ts
- Ensure proper build and link

### 2. Credential Issues
- Verify credential properties
- Check authentication implementation
- Test with different authentication methods

### 3. Build Issues
- Clear node_modules and rebuild
- Check TypeScript configuration
- Verify dependency versions

## Resources
- [n8n Node Development Documentation](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Node Examples](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [npm Documentation](https://docs.npmjs.com/) 