import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

export class TeamsFileUpload implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Microsoft Teams File Upload',
		name: 'teamsFileUpload',
		icon: {
			light: 'file:teams.svg',
			dark: 'file:teams.svg',
		},
		group: ['transform'],
		version: 1,
		description: 'Upload files to Microsoft Teams chat messages',
		defaults: {
			name: 'Teams File Upload',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'microsoftTeamsOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the chat to upload the file to',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property that contains the file data',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Optional message to send with the file',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get credentials for this execution
		const credentials = await this.getCredentials('microsoftTeamsOAuth2Api') as {
			access_token: string;
		};

		for (let i = 0; i < items.length; i++) {
			const chatId = this.getNodeParameter('chatId', i) as string;
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
			const message = this.getNodeParameter('message', i, '') as string;

			try {
				const binaryData = items[i].binary?.[binaryPropertyName];
				
				if (!binaryData) {
					throw new Error('No binary data found. Please make sure to connect a node that outputs files.');
				}

				const fileName = binaryData.fileName || 'file';
				const fileBuffer = Buffer.from(binaryData.data, 'base64');

				// Step 1: Create upload session
				const uploadSession = await this.helpers.request({
					method: 'POST',
					url: `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
					headers: {
						'Authorization': `Bearer ${credentials.access_token}`,
						'Content-Type': 'application/json',
					},
					body: {
						body: {
							content: message || fileName,
						},
						attachments: [
							{
								contentType: 'reference',
								contentUrl: null,
								name: fileName,
							},
						],
					},
					json: true,
				});

				// Step 2: Upload the file
				const uploadResponse = await this.helpers.request({
					method: 'PUT',
					url: uploadSession.uploadUrl,
					headers: {
						'Authorization': `Bearer ${credentials.access_token}`,
						'Content-Length': fileBuffer.length,
					},
					body: fileBuffer,
				});

				returnData.push({
					json: {
						success: true,
						messageId: uploadSession.id,
						fileName,
						uploadResponse,
					},
				});
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error.message || 'An error occurred while uploading the file',
						},
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error.message || 'An error occurred while uploading the file');
			}
		}

		return [returnData];
	}
} 