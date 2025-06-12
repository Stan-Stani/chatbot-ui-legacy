import React from 'react';
import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import { Promptbar } from '@/components/Promptbar/Promptbar';
import { ChatBody, Conversation, Message } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { ErrorMessage } from '@/types/error';
import { LatestExportFormat, SupportedExportFormats } from '@/types/export';
import { Folder, FolderType } from '@/types/folder';
import {
  OpenAIModel,
  OpenAIModelID,
  OpenAIModels,
  fallbackModelID,
} from '@/types/openai';
import { Plugin, PluginKey } from '@/types/plugin';
import { Prompt } from '@/types/prompt';
import { getEndpoint } from '@/utils/app/api';
import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT, APP_VERSION } from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import {
  exportData,
  exportDataWithCorrupted,
  importData,
} from '@/utils/app/importExport';
import { savePrompts } from '@/utils/app/prompts';
import { IconArrowBarLeft, IconArrowBarRight } from '@tabler/icons-react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface HomeProps {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
}

const Home: React.FC<HomeProps> = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
}) => {
  const { t } = useTranslation('chat');

  // STATE ----------------------------------------------

  const [apiKey, setApiKey] = useState<string>('');
  const [pluginKeys, setPluginKeys] = useState<PluginKey[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lightMode, setLightMode] = useState<'dark' | 'light'>('dark');
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false);

  const [modelError, setModelError] = useState<ErrorMessage | null>(null);

  const [models, setModels] = useState<OpenAIModel[]>([]);

  const [folders, setFolders] = useState<Folder[]>([]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation>();
  const [currentMessage, setCurrentMessage] = useState<Message>();

  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showPromptbar, setShowPromptbar] = useState<boolean>(true);

  // REFS ----------------------------------------------

  const stopConversationRef = useRef<boolean>(false);

  // CORRUPTED BACKUP VIEW --------------------------------------
  const [corruptedConv, setCorruptedConv] = useState<string | null>(null);
  const [corruptedSelConv, setCorruptedSelConv] = useState<string | null>(null);

  useEffect(() => {
    // On mount, check if corrupted is stored in localStorage
    const corrConv = localStorage.getItem('corrupted_conversationHistory');
    const corrSelConv = localStorage.getItem('corrupted_selectedConversation');
    setCorruptedConv(corrConv);
    setCorruptedSelConv(corrSelConv);
  }, []);

  // VERSION/CACHE BUSTING & MIGRATION --------------------------------------
  useEffect(() => {
    const storedVersion = localStorage.getItem('APP_VERSION');
    if (storedVersion !== APP_VERSION) {
      localStorage.removeItem('corrupted_chat_ack');
      try {
        // Try to migrate all stored conversations/models cleanly
        const rawConv = localStorage.getItem('conversationHistory');
        const rawSelConv = localStorage.getItem('selectedConversation');
        let migrated = false;

        if (rawConv) {
          try {
            const parsed = JSON.parse(rawConv);
            // Clean any models/system prompts/etc.
            const cleaned = cleanConversationHistory(parsed);
            localStorage.setItem(
              'conversationHistory',
              JSON.stringify(cleaned),
            );
            migrated = true;
          } catch {
            // Fallback: save corrupted data under a backup key before removal
            localStorage.setItem('corrupted_conversationHistory', rawConv);
            localStorage.removeItem('conversationHistory');
          }
        }
        if (rawSelConv) {
          try {
            const parsed = JSON.parse(rawSelConv);
            // Clean up selected conversation
            const cleaned = cleanSelectedConversation(parsed);
            localStorage.setItem(
              'selectedConversation',
              JSON.stringify(cleaned),
            );
            migrated = true;
          } catch {
            // Fallback: save corrupted data under a backup key before removal
            localStorage.setItem('corrupted_selectedConversation', rawSelConv);
            localStorage.removeItem('selectedConversation');
          }
        }

        localStorage.setItem('APP_VERSION', APP_VERSION);
        if (migrated) {
          // Optionally, show a toast or log indicating migration was run
          // toast.success('Chatbot upgraded and old chats migrated!');
        }
      } catch (e) {
        // As last resort, backup corrupt state before clearing
        const rawConv = localStorage.getItem('conversationHistory');
        const rawSelConv = localStorage.getItem('selectedConversation');
        if (rawConv) {
          localStorage.setItem('corrupted_conversationHistory', rawConv);
          localStorage.removeItem('conversationHistory');
        }
        if (rawSelConv) {
          localStorage.setItem('corrupted_selectedConversation', rawSelConv);
          localStorage.removeItem('selectedConversation');
        }
        localStorage.setItem('APP_VERSION', APP_VERSION);
      }
    }
  }, []);

  // FETCH RESPONSE ----------------------------------------------

  const handleSend = async (
    message: Message,
    deleteCount = 0,
    plugin: Plugin | null = null,
  ) => {
    if (selectedConversation) {
      let updatedConversation: Conversation;

      if (deleteCount) {
        const updatedMessages = [...selectedConversation.messages];
        for (let i = 0; i < deleteCount; i++) {
          updatedMessages.pop();
        }

        updatedConversation = {
          ...selectedConversation,
          messages: [...updatedMessages, message],
        };
      } else {
        updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, message],
        };
      }

      setSelectedConversation(updatedConversation);
      setLoading(true);
      setMessageIsStreaming(true);

      const chatBody: ChatBody = {
        model: updatedConversation.model,
        messages: updatedConversation.messages,
        key: apiKey,
        prompt: updatedConversation.prompt,
      };

      const endpoint = getEndpoint(plugin);
      let body;

      if (!plugin) {
        body = JSON.stringify(chatBody);
      } else {
        body = JSON.stringify({
          ...chatBody,
          googleAPIKey: pluginKeys
            .find((key) => key.pluginId === 'google-search')
            ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
          googleCSEId: pluginKeys
            .find((key) => key.pluginId === 'google-search')
            ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
        });
      }

      const controller = new AbortController();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body,
      });

      if (!response.ok) {
        setLoading(false);
        setMessageIsStreaming(false);
        toast.error(response.statusText);
        return;
      }

      const data = response.body;

      if (!data) {
        setLoading(false);
        setMessageIsStreaming(false);
        return;
      }

      if (!plugin) {
        if (updatedConversation.messages.length === 1) {
          const { content } = message;
          const customName =
            content.length > 30 ? content.substring(0, 30) + '...' : content;

          updatedConversation = {
            ...updatedConversation,
            name: customName,
          };
        }

        setLoading(false);

        const reader = data.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let isFirst = true;
        let text = '';

        while (!done) {
          if (stopConversationRef.current === true) {
            controller.abort();
            done = true;
            break;
          }
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value);

          text += chunkValue;

          if (isFirst) {
            isFirst = false;
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: chunkValue },
            ];

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };

            setSelectedConversation(updatedConversation);
          } else {
            const updatedMessages: Message[] = updatedConversation.messages.map(
              (message, index) => {
                if (index === updatedConversation.messages.length - 1) {
                  return {
                    ...message,
                    content: text,
                  };
                }

                return message;
              },
            );

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };

            setSelectedConversation(updatedConversation);
          }
        }

        saveConversation(updatedConversation);

        const updatedConversations: Conversation[] = conversations.map(
          (conversation) => {
            if (conversation.id === selectedConversation.id) {
              return updatedConversation;
            }

            return conversation;
          },
        );

        if (updatedConversations.length === 0) {
          updatedConversations.push(updatedConversation);
        }

        setConversations(updatedConversations);
        saveConversations(updatedConversations);

        setMessageIsStreaming(false);
      } else {
        const { answer } = await response.json();

        const updatedMessages: Message[] = [
          ...updatedConversation.messages,
          { role: 'assistant', content: answer },
        ];

        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages,
        };

        setSelectedConversation(updatedConversation);
        saveConversation(updatedConversation);

        const updatedConversations: Conversation[] = conversations.map(
          (conversation) => {
            if (conversation.id === selectedConversation.id) {
              return updatedConversation;
            }

            return conversation;
          },
        );

        if (updatedConversations.length === 0) {
          updatedConversations.push(updatedConversation);
        }

        setConversations(updatedConversations);
        saveConversations(updatedConversations);

        setLoading(false);
        setMessageIsStreaming(false);
      }
    }
  };

  // FETCH MODELS ----------------------------------------------

  const fetchModels = async (key: string) => {
    // return
    const error = {
      title: t('Error fetching models.'),
      code: null,
      messageLines: [
        t(
          'Make sure your OpenAI API key is set in the bottom left of the sidebar.',
        ),
        t('If you completed this step, OpenAI may be experiencing issues.'),
      ],
    } as ErrorMessage;

    const response = await fetch('/api/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
      }),
    });

    if (!response.ok) {
      try {
        const data = await response.json();
        Object.assign(error, {
          code: data.error?.code,
          messageLines: [data.error?.message],
        });
      } catch (e) {}
      setModelError(error);
      return;
    }

    const data = await response.json();

    if (!data) {
      setModelError(error);
      return;
    }

    setModels(data);
    setModelError(null);
  };

  // BASIC HANDLERS --------------------------------------------

  const handleLightMode = (mode: 'dark' | 'light') => {
    setLightMode(mode);
    localStorage.setItem('theme', mode);
  };

  const handleApiKeyChange = (apiKey: string) => {
    setApiKey(apiKey);
    localStorage.setItem('apiKey', apiKey);
  };

  const handlePluginKeyChange = (pluginKey: PluginKey) => {
    if (pluginKeys.some((key) => key.pluginId === pluginKey.pluginId)) {
      const updatedPluginKeys = pluginKeys.map((key) => {
        if (key.pluginId === pluginKey.pluginId) {
          return pluginKey;
        }

        return key;
      });

      setPluginKeys(updatedPluginKeys);

      localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys));
    } else {
      setPluginKeys([...pluginKeys, pluginKey]);

      localStorage.setItem(
        'pluginKeys',
        JSON.stringify([...pluginKeys, pluginKey]),
      );
    }
  };

  const handleClearPluginKey = (pluginKey: PluginKey) => {
    const updatedPluginKeys = pluginKeys.filter(
      (key) => key.pluginId !== pluginKey.pluginId,
    );

    if (updatedPluginKeys.length === 0) {
      setPluginKeys([]);
      localStorage.removeItem('pluginKeys');
      return;
    }

    setPluginKeys(updatedPluginKeys);

    localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys));
  };

  const handleToggleChatbar = () => {
    setShowSidebar(!showSidebar);
    localStorage.setItem('showChatbar', JSON.stringify(!showSidebar));
  };

  const handleTogglePromptbar = () => {
    setShowPromptbar(!showPromptbar);
    localStorage.setItem('showPromptbar', JSON.stringify(!showPromptbar));
  };

  const handleExportData = () => {
    // If corrupted backup fields exist, export with them attached:
    const corruptedConv = localStorage.getItem('corrupted_conversationHistory');
    const corruptedSelConv = localStorage.getItem(
      'corrupted_selectedConversation',
    );
    if (corruptedConv || corruptedSelConv) {
      exportDataWithCorrupted();
    } else {
      exportData();
    }
  };

  const handleImportConversations = (data: SupportedExportFormats) => {
    const { history, folders, prompts }: LatestExportFormat = importData(data);

    setConversations(history);
    setSelectedConversation(history[history.length - 1]);
    setFolders(folders);
    setPrompts(prompts);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    saveConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];

    setFolders(updatedFolders);
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    setFolders(updatedFolders);
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        };
      }

      return c;
    });
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        };
      }

      return p;
    });
    setPrompts(updatedPrompts);
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    setFolders(updatedFolders);
    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    // Only use the last convo's model if it currently exists in OpenAIModels
    let newModel;
    const validModelIds = Object.values(OpenAIModels).map((m) => m.id);
    if (
      lastConversation &&
      lastConversation.model &&
      lastConversation.model.id &&
      validModelIds.includes(lastConversation.model.id)
    ) {
      newModel = lastConversation.model;
    } else {
      newModel = {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      };
    }

    const newConversation: Conversation = {
      id: uuidv4(),
      name: `${t('New Conversation')}`,
      messages: [],
      model: newModel,
      prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: null,
    };

    const updatedConversations = [...conversations, newConversation];

    setSelectedConversation(newConversation);
    setConversations(updatedConversations);

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    setLoading(false);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter(
      (c) => c.id !== conversation.id,
    );
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    if (updatedConversations.length > 0) {
      setSelectedConversation(
        updatedConversations[updatedConversations.length - 1],
      );
      saveConversation(updatedConversations[updatedConversations.length - 1]);
    } else {
      setSelectedConversation({
        id: uuidv4(),
        name: 'New conversation',
        messages: [],
        model: OpenAIModels[defaultModelId],
        prompt: DEFAULT_SYSTEM_PROMPT,
        folderId: null,
      });
      localStorage.removeItem('selectedConversation');
    }
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    setSelectedConversation(single);
    setConversations(all);
  };

  const handleClearConversations = () => {
    setConversations([]);
    localStorage.removeItem('conversationHistory');

    setSelectedConversation({
      id: uuidv4(),
      name: 'New conversation',
      messages: [],
      model: OpenAIModels[defaultModelId],
      prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: null,
    });
    localStorage.removeItem('selectedConversation');

    const updatedFolders = folders.filter((f) => f.type !== 'chat');
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
  };

  const handleEditMessage = (message: Message, messageIndex: number) => {
    if (selectedConversation) {
      const updatedMessages = selectedConversation.messages
        .map((m, i) => {
          if (i < messageIndex) {
            return m;
          }
        })
        .filter((m) => m) as Message[];

      const updatedConversation = {
        ...selectedConversation,
        messages: updatedMessages,
      };

      const { single, all } = updateConversation(
        updatedConversation,
        conversations,
      );

      setSelectedConversation(single);
      setConversations(all);

      setCurrentMessage(message);
    }
  };

  // PROMPT OPERATIONS --------------------------------------------

  const handleCreatePrompt = () => {
    const newPrompt: Prompt = {
      id: uuidv4(),
      name: `Prompt ${prompts.length + 1}`,
      description: '',
      content: '',
      model: OpenAIModels[defaultModelId],
      folderId: null,
    };

    const updatedPrompts = [...prompts, newPrompt];

    setPrompts(updatedPrompts);
    savePrompts(updatedPrompts);
  };

  const handleUpdatePrompt = (prompt: Prompt) => {
    const updatedPrompts = prompts.map((p) => {
      if (p.id === prompt.id) {
        return prompt;
      }

      return p;
    });

    setPrompts(updatedPrompts);
    savePrompts(updatedPrompts);
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    const updatedPrompts = prompts.filter((p) => p.id !== prompt.id);
    setPrompts(updatedPrompts);
    savePrompts(updatedPrompts);
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (currentMessage) {
      handleSend(currentMessage);
      setCurrentMessage(undefined);
    }
  }, [currentMessage]);

  useEffect(() => {
    if (window.innerWidth < 640) {
      setShowSidebar(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (apiKey) {
      fetchModels(apiKey);
    }
  }, [apiKey]);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme) {
      setLightMode(theme as 'dark' | 'light');
    }

    const apiKey = localStorage.getItem('apiKey');
    if (serverSideApiKeyIsSet) {
      fetchModels('');
      setApiKey('');
      localStorage.removeItem('apiKey');
    } else if (apiKey) {
      setApiKey(apiKey);
      fetchModels(apiKey);
    }

    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      setPluginKeys([]);
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      setPluginKeys(JSON.parse(pluginKeys));
    }

    if (window.innerWidth < 640) {
      setShowSidebar(false);
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      setShowSidebar(showChatbar === 'true');
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      setShowPromptbar(showPromptbar === 'true');
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      setFolders(JSON.parse(folders));
    }

    const prompts = localStorage.getItem('prompts');
    if (prompts) {
      setPrompts(JSON.parse(prompts));
    }

    const conversationHistory = localStorage.getItem('conversationHistory');
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory);
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory,
      );
      setConversations(cleanedConversationHistory);
    }

    const selectedConversation = localStorage.getItem('selectedConversation');
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      );
      setSelectedConversation(cleanedSelectedConversation);
    } else {
      setSelectedConversation({
        id: uuidv4(),
        name: 'New conversation',
        messages: [],
        model: OpenAIModels[defaultModelId],
        prompt: DEFAULT_SYSTEM_PROMPT,
        folderId: null,
      });
    }
  }, [serverSideApiKeyIsSet]);

  return (
    <>
      {(corruptedConv || corruptedSelConv) &&
        !localStorage.getItem('corrupted_chat_ack') && (
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483001,
              background: 'rgba(0,0,0,0.33)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '2px solid #E57373',
                borderRadius: 10,
                boxShadow: '0 6px 32px 0 rgba(0,0,0,.18)',
                maxWidth: 400,
                width: '90%',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  color: '#c00',
                  fontWeight: 600,
                  fontSize: 18,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                Some old chat data was detected but could not be automatically
                converted.
              </div>
              <div
                style={{
                  color: '#444',
                  textAlign: 'center',
                  fontSize: 14,
                  marginBottom: 12,
                }}
              >
                <b>What can you do?</b>
                <br />
                <ul
                  style={{
                    textAlign: 'left',
                    paddingLeft: 20,
                    marginTop: 4,
                    marginBottom: 8,
                  }}
                >
                  <p style={{ marginBottom: 2 }}>
                    Your raw backup is still saved in browser storage as{' '}
                    <code>corrupted_conversationHistory</code>
                    {corruptedSelConv ? ' and ' : ''}
                    <code>
                      {corruptedSelConv ? 'corrupted_selectedConversation' : ''}
                    </code>
                    .
                  </p>
                  <br />
                  <p style={{ marginBottom: 2 }}>
                    You can save this backup long-term by using{' '}
                    <b>Export data</b> in the sidebar menu. Your next export
                    will contain the corrupted data as well.
                  </p>
                  <br />
                  <p style={{ marginBottom: 2 }}>
                    If you don't need to save it, you can dismiss this notice.
                  </p>
                </ul>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#666',
                  marginBottom: 18,
                  textAlign: 'center',
                }}
              ></div>
              <div style={{ display: 'flex', gap: 11, marginBottom: 8 }}>
                <button
                  style={{
                    background: '#E57373',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    borderRadius: 5,
                    padding: '7px 16px',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    let text = '';
                    if (corruptedConv) {
                      text += `corrupted_conversationHistory:\n${corruptedConv}\n\n`;
                    }
                    if (corruptedSelConv) {
                      text += `corrupted_selectedConversation:\n${corruptedSelConv}`;
                    }
                    navigator.clipboard.writeText(text.trim());
                    toast.success('Backup copied to clipboard!');
                  }}
                >
                  Copy backup to clipboard
                </button>
                <button
                  style={{
                    background: '#bbb',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 500,
                    borderRadius: 5,
                    padding: '7px 16px',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    localStorage.setItem('corrupted_chat_ack', '1');
                    setCorruptedConv(null);
                    setCorruptedSelConv(null);
                  }}
                  title="You won't see this again on this device until there is new corrupted data."
                >
                  Don't show again
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#777', textAlign: 'center' }}>
                You can always export history from the sidebar.
                <br />
                This dialog will only reappear if new corrupted data is
                detected.
              </div>
            </div>
          </div>
        )}
      <Head>
        <title>Chatbot UI</title>
        <meta name="description" content="ChatGPT but better." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            {showSidebar ? (
              <div>
                <Chatbar
                  loading={messageIsStreaming}
                  conversations={conversations}
                  lightMode={lightMode}
                  selectedConversation={selectedConversation}
                  apiKey={apiKey}
                  pluginKeys={pluginKeys}
                  folders={folders.filter((folder) => folder.type === 'chat')}
                  onToggleLightMode={handleLightMode}
                  onCreateFolder={(name) => handleCreateFolder(name, 'chat')}
                  onDeleteFolder={handleDeleteFolder}
                  onUpdateFolder={handleUpdateFolder}
                  onNewConversation={handleNewConversation}
                  onSelectConversation={handleSelectConversation}
                  onDeleteConversation={handleDeleteConversation}
                  onUpdateConversation={handleUpdateConversation}
                  onApiKeyChange={handleApiKeyChange}
                  onClearConversations={handleClearConversations}
                  onExportConversations={handleExportData}
                  onImportConversations={handleImportConversations}
                  onPluginKeyChange={handlePluginKeyChange}
                  onClearPluginKey={handleClearPluginKey}
                />

                <button
                  className="fixed left-[270px] top-5 z-50 h-7 w-7 hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:left-[270px] sm:top-0.5 sm:h-8 sm:w-8 sm:text-neutral-700"
                  onClick={handleToggleChatbar}
                >
                  <IconArrowBarLeft />
                </button>
                <div
                  onClick={handleToggleChatbar}
                  className="absolute left-0 top-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
                ></div>
              </div>
            ) : (
              <button
                className="fixed left-4 top-2.5 z-50 h-7 w-7 text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:left-4 sm:top-0.5 sm:h-8 sm:w-8 sm:text-neutral-700"
                onClick={handleToggleChatbar}
              >
                <IconArrowBarRight />
              </button>
            )}

            <div className="flex flex-1">
              <Chat
                conversation={selectedConversation}
                messageIsStreaming={messageIsStreaming}
                apiKey={apiKey}
                serverSideApiKeyIsSet={serverSideApiKeyIsSet}
                defaultModelId={defaultModelId}
                modelError={modelError}
                models={models}
                loading={loading}
                prompts={prompts}
                onSend={handleSend}
                onUpdateConversation={handleUpdateConversation}
                onEditMessage={handleEditMessage}
                stopConversationRef={stopConversationRef}
              />
            </div>

            {showPromptbar ? (
              <div>
                <Promptbar
                  prompts={prompts}
                  folders={folders.filter((folder) => folder.type === 'prompt')}
                  onCreatePrompt={handleCreatePrompt}
                  onUpdatePrompt={handleUpdatePrompt}
                  onDeletePrompt={handleDeletePrompt}
                  onCreateFolder={(name) => handleCreateFolder(name, 'prompt')}
                  onDeleteFolder={handleDeleteFolder}
                  onUpdateFolder={handleUpdateFolder}
                />
                <button
                  className="fixed right-[270px] top-5 z-50 h-7 w-7 hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:right-[270px] sm:top-0.5 sm:h-8 sm:w-8 sm:text-neutral-700"
                  onClick={handleTogglePromptbar}
                >
                  <IconArrowBarRight />
                </button>
                <div
                  onClick={handleTogglePromptbar}
                  className="absolute left-0 top-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
                ></div>
              </div>
            ) : (
              <button
                className="fixed right-4 top-2.5 z-50 h-7 w-7 text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:right-4 sm:top-0.5 sm:h-8 sm:w-8 sm:text-neutral-700"
                onClick={handleTogglePromptbar}
              >
                <IconArrowBarLeft />
              </button>
            )}
          </div>
        </main>
      )}
    </>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const defaultModelId =
    (process.env.DEFAULT_MODEL &&
      Object.values(OpenAIModelID).includes(
        process.env.DEFAULT_MODEL as OpenAIModelID,
      ) &&
      process.env.DEFAULT_MODEL) ||
    fallbackModelID;

  // const defaultModelId = process.env.DEFAULT_MODEL;

  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY_ONE,
      defaultModelId,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
      ])),
    },
  };
};
