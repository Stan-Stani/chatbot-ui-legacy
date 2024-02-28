import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { OPENAI_API_HOST } from '@/utils/app/const';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    // const { key } = (await req.json()) as {
    //   key: string;
    // };

    // const response = await fetch(`${OPENAI_API_HOST}/v1/models`, {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
    //     ...(process.env.OPENAI_ORGANIZATION && {
    //       'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
    //     })
    //   },
    // });

    // if (response.status === 401) {
    //   return new Response(response.body, {
    //     status: 500,
    //     headers: response.headers,
    //   });
    // } else if (response.status !== 200) {
    //   console.error(
    //     `OpenAI API returned an error ${
    //       response.status
    //     }: ${await response.text()}`,
    //   );
    //   throw new Error('OpenAI API returned an error');
    // }

    const json = {
      object: 'list',
      data: [
        {
          id: 'gpt-4-vision-preview',
          object: 'model',
          created: 1698894917,
          owned_by: 'system',
        },
        {
          id: 'dall-e-3',
          object: 'model',
          created: 1698785189,
          owned_by: 'system',
        },
        {
          id: 'gpt-4-turbo-preview',
          object: 'model',
          created: 1706037777,
          owned_by: 'system',
        },
        {
          id: 'gpt-3.5-turbo-0613',
          object: 'model',
          created: 1686587434,
          owned_by: 'openai',
        },
        {
          id: 'text-embedding-3-large',
          object: 'model',
          created: 1705953180,
          owned_by: 'system',
        },
        {
          id: 'dall-e-2',
          object: 'model',
          created: 1698798177,
          owned_by: 'system',
        },
        {
          id: 'gpt-3.5-turbo-instruct-0914',
          object: 'model',
          created: 1694122472,
          owned_by: 'system',
        },
        {
          id: 'whisper-1',
          object: 'model',
          created: 1677532384,
          owned_by: 'openai-internal',
        },
        {
          id: 'tts-1-hd-1106',
          object: 'model',
          created: 1699053533,
          owned_by: 'system',
        },
        {
          id: 'tts-1-hd',
          object: 'model',
          created: 1699046015,
          owned_by: 'system',
        },
        {
          id: 'babbage-002',
          object: 'model',
          created: 1692634615,
          owned_by: 'system',
        },
        {
          id: 'gpt-3.5-turbo-instruct',
          object: 'model',
          created: 1692901427,
          owned_by: 'system',
        },
        {
          id: 'gpt-4-1106-preview',
          object: 'model',
          created: 1698957206,
          owned_by: 'system',
        },
        {
          id: 'gpt-3.5-turbo-0125',
          object: 'model',
          created: 1706048358,
          owned_by: 'system',
        },
        {
          id: 'gpt-3.5-turbo',
          object: 'model',
          created: 1677610602,
          owned_by: 'openai',
        },
        {
          id: 'davinci-002',
          object: 'model',
          created: 1692634301,
          owned_by: 'system',
        },
        {
          id: 'text-embedding-ada-002',
          object: 'model',
          created: 1671217299,
          owned_by: 'openai-internal',
        },
        {
          id: 'gpt-3.5-turbo-0301',
          object: 'model',
          created: 1677649963,
          owned_by: 'openai',
        },
        {
          id: 'text-embedding-3-small',
          object: 'model',
          created: 1705948997,
          owned_by: 'system',
        },
        {
          id: 'gpt-3.5-turbo-16k',
          object: 'model',
          created: 1683758102,
          owned_by: 'openai-internal',
        },
        {
          id: 'tts-1',
          object: 'model',
          created: 1681940951,
          owned_by: 'openai-internal',
        },
        {
          id: 'tts-1-1106',
          object: 'model',
          created: 1699053241,
          owned_by: 'system',
        },
        {
          id: 'gpt-3.5-turbo-1106',
          object: 'model',
          created: 1698959748,
          owned_by: 'system',
        },
        {
          id: 'gpt-4',
          object: 'model',
          created: 1687882411,
          owned_by: 'openai',
        },
        {
          id: 'gpt-4-0613',
          object: 'model',
          created: 1686588896,
          owned_by: 'openai',
        },
        {
          id: 'gpt-3.5-turbo-16k-0613',
          object: 'model',
          created: 1685474247,
          owned_by: 'openai',
        },
        {
          id: 'gpt-4-0125-preview',
          object: 'model',
          created: 1706037612,
          owned_by: 'system',
        },
      ],
    };

    // const models: OpenAIModel[] = json.data
    //   .map((model: any) => {
    //     for (const [key, value] of Object.entries(OpenAIModelID)) {
    //       if (value === model.id) {
    //         return {
    //           id: model.id,
    //           name: OpenAIModels[value].name,
    //         };
    //       }
    //     }
    //   })
    //   .filter(Boolean);

    return new Response(
      JSON.stringify([
        { id: 'chatbot_35_turbo_16k', name: 'chatbot_35_turbo_16k' },
      ]),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
