import type { INodeType } from 'n8n-workflow';
import { TeamsFileUpload } from './TeamsFileUpload.node';

export const nodes: INodeType[] = [
	new TeamsFileUpload(),
];

export { TeamsFileUpload };
