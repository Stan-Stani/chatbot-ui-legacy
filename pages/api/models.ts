import { OpenAIModelID } from '../../types/openai';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    return new Response(
      JSON.stringify([
        { id: OpenAIModelID.GPT_4_1, name: OpenAIModelID.GPT_4_1 },
        { id: OpenAIModelID.GPT_5, name: OpenAIModelID.GPT_5 },
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
