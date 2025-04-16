export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
}

export enum OpenAIModelID {
  GPT_4_1 = 'chatbot-gpt4.1',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_4_1;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_4_1]: {
    id: OpenAIModelID.GPT_4_1,
    name: 'chatbot-gpt4.1',
    maxLength: 12000,
    tokenLimit: 4000,
  },
};
