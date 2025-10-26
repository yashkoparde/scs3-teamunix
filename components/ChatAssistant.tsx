import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CrowdData, ChatMessage } from '../types';
import { getChatResponse } from '../services/geminiService';
import useSpeech from '../hooks/useSpeech';
import { SendIcon, MicIcon, VolumeUpIcon, VolumeOffIcon, XMarkIcon } from './index';

interface ChatAssistantProps {
  crowdData: CrowdData | null;
  historicalData: CrowdData[];
  onClose: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ crowdData, historicalData, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  const {
    isListening,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  } = useSpeech({
    onResult: (transcript) => {
      setInputValue(transcript);
    },
  });

  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBodyRef.current?.scrollTo(0, chatBodyRef.current.scrollHeight);
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatHistory = messages.slice(-6); // Keep context small
      const aiResponseText = await getChatResponse(chatHistory, crowdData, historicalData, messageText);
      const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);
      if (isTtsEnabled) {
        speak(aiResponseText);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, I'm having trouble connecting." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, crowdData, historicalData, speak, isTtsEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };
  
  const toggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleTts = () => {
    if (!isTtsEnabled) {
        setIsTtsEnabled(true);
    } else {
        setIsTtsEnabled(false);
        cancelSpeech();
    }
  };


  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700 h-full flex flex-col max-h-[70vh] w-full">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-bold">AI Safety Assistant</h3>
        <div className="flex items-center gap-2">
            <button onClick={toggleTts} className="text-slate-400 hover:text-white transition-colors">
                {isTtsEnabled ? <VolumeUpIcon className="w-6 h-6" /> : <VolumeOffIcon className="w-6 h-6"/>}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
      <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-slate-400 pt-10">
                <p className="font-semibold">Ask about the current crowd status!</p>
                <p className="text-sm mt-1">e.g., "Is it safe?", "What's the trend?", "What was the peak headcount?"</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-xs xl:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xs md:max-w-md lg:max-w-xs xl:max-w-md px-4 py-2 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none">
                     <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-teal-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-teal-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-teal-400 rounded-full animate-pulse"></span>
                    </div>
                </div>
            </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Type or speak a message...'}
            className="w-full bg-transparent p-3 focus:outline-none text-sm"
            disabled={isLoading}
          />
          <button type="button" onClick={toggleListen} className={`p-3 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'} transition-colors`}>
            {isListening ? <MicIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
          </button>
          <button type="submit" disabled={isLoading || !inputValue} className="p-3 bg-teal-600 rounded-r-lg text-white hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant;