
export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
   
   

    return new Response(
      JSON.stringify([

        { id: 'chatbot-gpt4.1', name: 'chatbot-gpt4.1' },
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
