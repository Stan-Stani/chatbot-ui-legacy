// Update this version whenever you want to force localStorage resets for app-breaking/model changes
export const APP_VERSION = '2024-06-11-v3';
export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.";

export const OPENAI_API_ENDPOINT_ONE =
  process.env.OPENAI_API_ENDPOINT_ONE || 'https://api.openai.com';
export const OPENAI_API_KEY_ONE = process.env.OPENAI_API_KEY_ONE || '';

export const OPENAI_API_ENDPOINT_TWO =
  process.env.OPENAI_API_ENDPOINT_TWO || 'https://api.openai.com';
export const OPENAI_API_KEY_TWO = process.env.OPENAI_API_KEY_TWO || '';

export const OPENAI_API_ENDPOINT_THREE =
  process.env.OPENAI_API_ENDPOINT_THREE || 'https://api.openai.com';
export const OPENAI_API_KEY_THREE = process.env.OPENAI_API_KEY_THREE || '';
