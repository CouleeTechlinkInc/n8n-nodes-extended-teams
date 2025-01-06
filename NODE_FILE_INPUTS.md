# Working with Files in n8n Nodes

This guide explains how to handle file inputs and outputs in your custom n8n nodes, similar to the "Convert To File" and "Extract From File" functionality.

## File Structure in n8n

In n8n, files are represented as binary data in the node's input/output:

```typescript
interface IBinaryData {
  data: string;          // Base64 encoded file content
  mimeType: string;      // MIME type of the file
  fileName: string;      // Name of the file
  fileExtension: string; // File extension
  fileSize: number;      // Size of the file in bytes
}

interface INodeExecutionData {
  binary?: IBinaryKeyData;  // Binary data object
  json: IDataObject;        // JSON data object
}
```

## Converting Data to Files

### 1. Basic File Creation
```typescript
import { IBinaryData, INodeExecutionData } from 'n8n-workflow';

export class YourNode {
  async execute() {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const newItem: INodeExecutionData = {
        json: {},
        binary: {
          data: {
            // Convert your data to base64
            data: Buffer.from('Your content').toString('base64'),
            mimeType: 'text/plain',
            fileName: 'example.txt',
          },
        },
      };
      returnData.push(newItem);
    }

    return [returnData];
  }
}
```

### 2. Converting JSON to File
```typescript
async execute() {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const json = items[i].json;
    const jsonString = JSON.stringify(json, null, 2);

    const newItem: INodeExecutionData = {
      json: {
        fileName: 'data.json',
      },
      binary: {
        data: {
          data: Buffer.from(jsonString).toString('base64'),
          mimeType: 'application/json',
          fileName: 'data.json',
          fileExtension: 'json',
        },
      },
    };
    returnData.push(newItem);
  }

  return [returnData];
}
```

## Extracting Data from Files

### 1. Basic File Reading
```typescript
async execute() {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const binaryData = items[i].binary;
    
    if (binaryData && binaryData.data) {
      const buffer = Buffer.from(binaryData.data.data, 'base64');
      const content = buffer.toString('utf-8');

      returnData.push({
        json: {
          content,
          fileName: binaryData.data.fileName,
          mimeType: binaryData.data.mimeType,
        },
      });
    }
  }

  return [returnData];
}
```

### 2. Parsing Different File Types

```typescript
async execute() {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const binaryData = items[i].binary?.data;
    
    if (!binaryData) continue;

    const buffer = Buffer.from(binaryData.data, 'base64');

    switch (binaryData.mimeType) {
      case 'application/json':
        const jsonContent = JSON.parse(buffer.toString());
        returnData.push({
          json: jsonContent,
        });
        break;

      case 'text/csv':
        const csvContent = buffer.toString().split('\n').map(line => line.split(','));
        returnData.push({
          json: {
            data: csvContent,
          },
        });
        break;

      default:
        returnData.push({
          json: {
            content: buffer.toString(),
            mimeType: binaryData.mimeType,
          },
        });
    }
  }

  return [returnData];
}
```

## Node Properties for File Handling

### 1. File Input Properties
```typescript
{
  displayName: 'Binary Property',
  name: 'binaryPropertyName',
  type: 'string',
  default: 'data',
  description: 'Name of the binary property that contains the file data',
},
{
  displayName: 'Input File Type',
  name: 'fileType',
  type: 'options',
  options: [
    {
      name: 'JSON',
      value: 'json',
    },
    {
      name: 'CSV',
      value: 'csv',
    },
    {
      name: 'Text',
      value: 'text',
    },
  ],
  default: 'json',
  description: 'Type of file to process',
},
```

### 2. File Output Properties
```typescript
{
  displayName: 'Binary Property',
  name: 'binaryPropertyName',
  type: 'string',
  default: 'data',
  description: 'Name of the binary property in which to store the file data',
},
{
  displayName: 'File Name',
  name: 'fileName',
  type: 'string',
  default: 'file.txt',
  description: 'Name of the output file',
},
```

## Error Handling

```typescript
async execute() {
  try {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const binaryData = items[i].binary?.data;
      
      if (!binaryData) {
        throw new Error('No binary data found');
      }

      if (!this.isSupportedMimeType(binaryData.mimeType)) {
        throw new Error(`Unsupported file type: ${binaryData.mimeType}`);
      }

      // Process file...
      
    }
    return [returnData];
  } catch (error) {
    if (error.message === 'No binary data found') {
      throw new Error('Please provide a file input');
    }
    throw error;
  }
}

private isSupportedMimeType(mimeType: string): boolean {
  const supported = ['application/json', 'text/csv', 'text/plain'];
  return supported.includes(mimeType);
}
```

## Best Practices

1. **Always Validate Input**
   - Check if binary data exists
   - Verify file type/MIME type
   - Validate file size if necessary

2. **Handle Large Files**
   ```typescript
   const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

   if (binaryData.fileSize > MAX_FILE_SIZE) {
     throw new Error('File too large');
   }
   ```

3. **Preserve Metadata**
   - Keep original file name when possible
   - Maintain MIME type information
   - Include file size and other relevant metadata

4. **Memory Management**
   ```typescript
   // For large files, process in chunks
   const chunks: Buffer[] = [];
   let chunk;
   while (null !== (chunk = readNextChunk())) {
     chunks.push(chunk);
     // Process chunk...
   }
   ```

5. **Clear Error Messages**
   ```typescript
   if (!binaryData) {
     throw new Error(
       'No binary data found. Please make sure to connect a node that outputs files.',
     );
   }
   ```

## Examples

### 1. Convert JSON to CSV File
```typescript
async execute() {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const json = items[i].json;
    
    // Convert JSON to CSV
    const headers = Object.keys(json[0]);
    const csvRows = [headers];
    
    json.forEach((row: IDataObject) => {
      csvRows.push(headers.map(header => row[header]));
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    returnData.push({
      json: {
        fileName: 'data.csv',
      },
      binary: {
        data: {
          data: Buffer.from(csvContent).toString('base64'),
          mimeType: 'text/csv',
          fileName: 'data.csv',
          fileExtension: 'csv',
        },
      },
    });
  }

  return [returnData];
}
```

### 2. Extract Images from ZIP
```typescript
async execute() {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const binaryData = items[i].binary?.data;
    
    if (!binaryData || binaryData.mimeType !== 'application/zip') {
      continue;
    }

    const zip = await JSZip.loadAsync(
      Buffer.from(binaryData.data, 'base64'),
    );

    for (const [fileName, file] of Object.entries(zip.files)) {
      if (file.dir) continue;

      const content = await file.async('base64');
      const mimeType = this.getMimeType(fileName);

      returnData.push({
        json: {
          fileName,
        },
        binary: {
          data: {
            data: content,
            mimeType,
            fileName,
            fileExtension: fileName.split('.').pop(),
          },
        },
      });
    }
  }

  return [returnData];
}

private getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    // Add more as needed
  };
  return mimeTypes[extension] || 'application/octet-stream';
}
``` 