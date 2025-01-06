import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';
import { basename } from 'path';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

export class TeamsFileUpload implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Microsoft Teams File Upload',
		name: 'teamsFileUpload',
		icon: 'file:teams.svg',
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
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				required: true,
				description: 'The path of the file to upload',
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

		for (let i = 0; i < items.length; i++) {
			const chatId = this.getNodeParameter('chatId', i) as string;
			const filePath = this.getNodeParameter('filePath', i) as string;
			const message = this.getNodeParameter('message', i, '') as string;

			try {
				// Get file stats
				const fileStats = await stat(filePath);
				const fileName = basename(filePath);

				// Step 1: Create upload session
				const uploadSession = await this.helpers.request({
					method: 'POST',
					url: `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
					headers: {
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
				const fileStream = createReadStream(filePath);
				const uploadResponse = await this.helpers.request({
					method: 'PUT',
					url: uploadSession.uploadUrl,
					headers: {
						'Content-Length': fileStats.size,
					},
					body: fileStream,
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