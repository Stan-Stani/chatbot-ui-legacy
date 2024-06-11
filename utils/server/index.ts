import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';
import {
  OPENAI_API_ENDPOINT_ONE,
  OPENAI_API_ENDPOINT_THREE,
  OPENAI_API_ENDPOINT_TWO,
  OPENAI_API_KEY_ONE,
  OPENAI_API_KEY_THREE,
  OPENAI_API_KEY_TWO,
} from '../app/const';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}


export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  key: string,
  messages: Message[],
) => {
  let modelEndpoint = '';
  let apiKey = '';
  switch (model.id) {
    default:
    case 'chatbot_35_turbo_16k':
      modelEndpoint = OPENAI_API_ENDPOINT_ONE;
      apiKey = OPENAI_API_KEY_ONE;
      break;

    case 'chatbot-gpt4-turbo-128k':
      modelEndpoint = OPENAI_API_ENDPOINT_TWO;
      apiKey = OPENAI_API_KEY_TWO;
      break;

    case 'chatbot-gpt4o':
      modelEndpoint = OPENAI_API_ENDPOINT_THREE;
      apiKey = OPENAI_API_KEY_THREE;
      break;
  }

  const res = await fetch(`${modelEndpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': `${key ? key : apiKey}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: model.id,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 800,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            if (text === null && json.choices[0]['finish_reason'] === 'stop') {
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            // controller.error(e);
            console.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
