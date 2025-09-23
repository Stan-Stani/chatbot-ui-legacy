export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
}

export enum OpenAIModelID {
  GPT_4_1 = 'chatbot-gpt4.1',
  GPT_5 = 'gpt5',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_4_1;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_4_1]: {
    id: OpenAIModelID.GPT_4_1,
    name: OpenAIModelID.GPT_4_1,
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [OpenAIModelID.GPT_5]: {
    id: OpenAIModelID.GPT_5,
    name: OpenAIModelID.GPT_5,
    /** Idk what the limits actually are for 5 but we're using these as
     * sensible defaults
     */
    maxLength: 12000,
    tokenLimit: 4000,
  },
};
