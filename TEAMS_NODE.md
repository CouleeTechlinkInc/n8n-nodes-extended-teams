# Creating a Microsoft Teams File Upload Node

## Overview
This guide explains how to create a custom n8n node that can upload files to Microsoft Teams chat messages. This extends the functionality of the existing Teams node to include file attachments in messages.

## Prerequisites
- Understanding of n8n node development
- Microsoft Teams API credentials
- Access to Microsoft Graph API

## Authentication
Your node will use the same authentication as the existing Teams node:
```typescript
export class YourCustomNode implements INodeType {
  description: INodeTypeDescription = {
    credentials: [
      {
        name: 'microsoftTeamsOAuth2Api',
        required: true,
      },
    ],
    // ... rest of description
  };
}
```

## API Endpoints
The file upload process uses these Microsoft Graph API endpoints:
1. Create upload session: `POST /teams/{team-id}/channels/{channel-id}/messages/delta`
2. Upload file chunks: `PUT /teams/{team-id}/channels/{channel-id}/messages/{message-id}/attachments`
3. Complete message: `POST /teams/{team-id}/channels/{channel-id}/messages`

## Implementation Steps

### 1. Node Structure
```typescript
export class TeamsFileUploadNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Microsoft Teams File Upload',
    name: 'teamsFileUpload',
    icon: 'file:teams.svg',
    group: ['transform'],
    version: 1,
    description: 'Upload files to Microsoft Teams messages',
    defaults: {
      name: 'Teams File Upload',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      // ... properties similar to chatMessage node
      {
        displayName: 'File',
        name: 'file',
        type: 'string',
        default: '',
        description: 'The file path of the file to upload',
        required: true,
      },
    ],
  };
}
```

### 2. File Upload Process
The file upload process involves:

1. Create an upload session:
```typescript
const createUploadSession = async (teamId: string, channelId: string) => {
  const response = await microsoftApiRequest.call(
    this,
    'POST',
    `/v1.0/teams/${teamId}/channels/${channelId}/messages`,
    {
      attachments: [
        {
          contentType: 'reference',
          contentUrl: null,
          name: fileName,
        },
      ],
    },
  );
  return response.uploadSession;
};
```

2. Upload the file in chunks:
```typescript
const uploadFileChunks = async (uploadUrl: string, fileBuffer: Buffer) => {
  const chunkSize = 4 * 1024 * 1024; // 4MB chunks
  for (let i = 0; i < fileBuffer.length; i += chunkSize) {
    const chunk = fileBuffer.slice(i, i + chunkSize);
    await microsoftApiRequest.call(
      this,
      'PUT',
      uploadUrl,
      chunk,
      {
        headers: {
          'Content-Length': chunk.length,
          'Content-Range': `bytes ${i}-${i + chunk.length - 1}/${fileBuffer.length}`,
        },
      },
    );
  }
};
```

3. Create the message with the attachment:
```typescript
const createMessage = async (teamId: string, channelId: string, messageText: string, fileId: string) => {
  return await microsoftApiRequest.call(
    this,
    'POST',
    `/v1.0/teams/${teamId}/channels/${channelId}/messages`,
    {
      body: {
        content: messageText,
      },
      attachments: [
        {
          id: fileId,
          contentType: 'reference',
          contentUrl: fileUrl,
          name: fileName,
        },
      ],
    },
  );
};
```

## Usage Example
```typescript
// Node execution
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const teamId = this.getNodeParameter('teamId', i) as string;
    const channelId = this.getNodeParameter('channelId', i) as string;
    const message = this.getNodeParameter('message', i) as string;
    const filePath = this.getNodeParameter('file', i) as string;

    // 1. Read file
    const fileBuffer = await fs.promises.readFile(filePath);
    const fileName = path.basename(filePath);

    // 2. Create upload session
    const uploadSession = await createUploadSession(teamId, channelId);

    // 3. Upload file chunks
    await uploadFileChunks(uploadSession.uploadUrl, fileBuffer);

    // 4. Create message with attachment
    const result = await createMessage(teamId, channelId, message, uploadSession.fileId);

    returnData.push({ json: result });
  }

  return [returnData];
}
```

## Error Handling
Implement proper error handling for:
- File size limits (max 4GB)
- Invalid file types
- Upload session timeouts
- Network errors during chunk upload

## Testing
Test your node with:
- Different file sizes (small, medium, large)
- Various file types
- Different message types (plain text, HTML)
- Error conditions

## Limitations
- Maximum file size: 4GB
- Supported file types: Check Microsoft Teams documentation for current list
- Rate limits: Follow Microsoft Graph API guidelines

## Resources
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/api/resources/teams-api-overview)
- [File Upload API Reference](https://docs.microsoft.com/en-us/graph/api/chatmessage-post?view=graph-rest-1.0&tabs=http)
- [n8n Node Development Documentation](https://docs.n8n.io/integrations/creating-nodes/) 