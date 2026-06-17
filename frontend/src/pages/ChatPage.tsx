import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { conversationApi, personaApi } from '../services/api';
import type { Conversation, Message, Persona } from '../types';
import PersonaSelector from '../components/PersonaSelector';

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadPersonas();
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && !currentConversation) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await conversationApi.getAll();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadPersonas = async () => {
    try {
      const response = await personaApi.getAll();
      setPersonas(response.data.personas);
    } catch (error) {
      console.error('Failed to load personas:', error);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const response = await conversationApi.getById(id);
      setCurrentConversation(response.data.conversation);
      setMessages(response.data.messages.filter(m => m.role !== 'system'));
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const createNewConversation = async (personaId?: string) => {
    try {
      const persona = personaId ? personas.find(p => p.id === personaId) : null;
      const title = persona 
        ? (i18n.language === 'zh' ? persona.name : persona.nameEn)
        : t('chat.newChat');
      
      const response = await conversationApi.create({
        title,
        personaId: personaId || undefined,
      });
      
      await loadConversations();
      
      setCurrentConversation(response.data.conversation);
      setMessages([]);
      setShowPersonaSelector(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(t('chat.deleteConfirm'))) return;

    try {
      await conversationApi.delete(id);
      setConversations(conversations.filter(c => c.id !== id));
      
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!currentConversation) {
      setShowPersonaSelector(true);
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await conversationApi.sendMessage(currentConversation.id, userMessage);
      
      setMessages([
        ...messages,
        { id: 'temp-user', conversation_id: currentConversation.id, role: 'user', content: userMessage, created_at: new Date().toISOString() },
        response.data.message,
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getCurrentPersona = () => {
    if (!currentConversation?.persona_id) return null;
    return personas.find(p => p.id === currentConversation.persona_id);
  };

  const getPersonaName = (persona: Persona | undefined) => {
    if (!persona) return '';
    return i18n.language === 'zh' ? persona.name : persona.nameEn;
  };

  const currentPersona = getCurrentPersona();

  return (
    <div className="h-full flex">
      {/* Conversation List */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowPersonaSelector(true)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>{t('chat.newChat')}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm">{t('chat.noConversations')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversation?.id === conv.id
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(conv.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-6">
          {currentConversation ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {currentPersona?.avatar || '🤖'}
              </span>
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  {currentPersona ? getPersonaName(currentPersona) : currentConversation.title}
                </h2>
                {currentPersona && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {i18n.language === 'zh' ? currentPersona.description : currentPersona.descriptionEn}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <h2 className="font-semibold text-gray-800 dark:text-white">
              {t('chat.startNewChat')}
            </h2>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <p className="text-6xl mb-4">
                {currentPersona?.avatar || '👋'}
              </p>
              <p className="text-lg font-medium mb-2">
                {currentPersona 
                  ? getPersonaName(currentPersona)
                  : t('chat.startNewChat')
                }
              </p>
              {currentPersona && (
                <p className="text-sm text-center max-w-md">
                  {i18n.language === 'zh' ? currentPersona.description : currentPersona.descriptionEn}
                </p>
              )}
              {!currentConversation && (
                <button
                  onClick={() => setShowPersonaSelector(true)}
                  className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  {t('chat.choosePersona')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' && currentPersona && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{currentPersona.avatar}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {getPersonaName(currentPersona)}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('chat.thinking')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chat.typeMessage')}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('chat.send')}
            </button>
          </div>
        </div>
      </div>

      {/* Persona Selector Modal */}
      {showPersonaSelector && (
        <PersonaSelector
          personas={personas}
          onSelect={(personaId) => createNewConversation(personaId)}
          onClose={() => setShowPersonaSelector(false)}
        />
      )}
    </div>
  );
}
