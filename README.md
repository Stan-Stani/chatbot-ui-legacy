# Chatbot UI

Chatbot UI is an advanced chatbot kit for OpenAI's chat models built on top of [Chatbot UI Lite](https://github.com/mckaywrigley/chatbot-ui-lite) using Next.js, TypeScript, and Tailwind CSS.

See a [demo](https://twitter.com/mckaywrigley/status/1640380021423603713?s=46&t=AowqkodyK6B4JccSOxSPew).

![Chatbot UI](./public/screenshot.png)

## Updates

Chatbot UI will be updated over time.

Expect frequent improvements.

**Next up:**

- [ ] Delete messages
- [ ] More model settings
- [ ] Plugins

**Recent updates:**

- [x] Prompt templates (3/27/23)
- [x] Regenerate & edit responses (3/25/23)
- [x] Folders (3/24/23)
- [x] Search chat content (3/23/23)
- [x] Stop message generation (3/22/23)
- [x] Import/Export chats (3/22/23)
- [x] Custom system prompt (3/21/23)
- [x] Error handling (3/20/23)
- [x] GPT-4 support (access required) (3/20/23)
- [x] Search conversations (3/19/23)
- [x] Code syntax highlighting (3/18/23)
- [x] Toggle sidebar (3/18/23)
- [x] Conversation naming (3/18/23)
- [x] Github flavored markdown (3/18/23)
- [x] Add OpenAI API key in app (3/18/23)
- [x] Markdown support (3/17/23)

## Modifications

Modify the chat interface in `components/Chat`.

Modify the sidebar interface in `components/Sidebar`.

Modify the system prompt in `utils/index.ts`.


**3. Provide Endpoints and Credentials in .env.local**

Create a .env.local file in the root of the repo with your OpenAI endpoint and API keys:


```bash
OPENAI_API_ENDPOINT_ONE=https://yourEndpointBlah
OPENAI_API_KEY_ONE=yourEndpointOneAPIKey

OPENAI_API_ENDPOINT_TWO=blah
OPENAI_API_KEY_TWO=blah

OPENAI_API_ENDPOINT_THREE=blah
OPENAI_API_KEY_THREE=blah
```

You'll want to update: `utils\app\const.ts` and `utils\server\index.ts` if you are using different
model names than our default or you want to add more models.

> You can set `OPENAI_API_HOST` where access to the official OpenAI host is restricted or unavailable, allowing users to configure an alternative host for their specific needs.

> Additionally, if you have multiple OpenAI Organizations, you can set `OPENAI_ORGANIZATION` to specify one.

**4. Run App**

```bash
npm run dev
```

**5. Use It**

You should be able to start chatting.

