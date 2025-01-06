import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
	IDataObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

interface MicrosoftError {
	error?: {
		error?: {
			message?: string;
			code?: string;
		};
	};
	statusCode?: number;
}

async function microsoftApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: any = {},
	qs: IDataObject = {},
	uri?: string,
	headers: IDataObject = {},
): Promise<any> {
	const options: IRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		uri: uri || `https://graph.microsoft.com${resource}`,
		json: true,
	};
	try {
		if (Object.keys(headers).length !== 0) {
			options.headers = Object.assign({}, options.headers, headers);
		}
		return await this.helpers.requestOAuth2.call(this, 'microsoftTeamsOAuth2Api', options);
	} catch (error) {
		const microsoftError = error as MicrosoftError;
		const errorOptions: IDataObject = {};
		
		if (microsoftError.error?.error) {
			const httpCode = microsoftError.statusCode;
			const errorDetails = microsoftError.error.error;
			errorOptions.message = errorDetails.message;
			errorOptions.description = `Error ${errorDetails.code}: ${errorDetails.message}`;
		}
		
		throw new NodeApiError(this.getNode(), microsoftError as JsonObject, errorOptions);
	}
}

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
				const uploadSession = await microsoftApiRequest.call(
					this,
					'POST',
					`/v1.0/chats/${chatId}/messages`,
					{
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
				);

				// Step 2: Upload the file using direct PUT request since it's binary data
				const uploadResponse = await this.helpers.requestOAuth2.call(
					this,
					'microsoftTeamsOAuth2Api',
					{
						method: 'PUT',
						uri: uploadSession.uploadUrl,
						headers: {
							'Content-Length': fileBuffer.length,
						},
							body: fileBuffer,
						json: false, // Important: don't parse binary data as JSON
					},
				);

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
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [returnData];
	}
} 