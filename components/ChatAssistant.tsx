
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  Image as ImageIcon, 
  Maximize2, 
  Minimize2, 
  User, 
  Bot,
  Volume2,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface ChatAssistantProps {
  logoUrl: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ logoUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Welcome to AIGODS. I am your Intelligent AI Assistant. How may I assist you today? 👑" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMsg: Message = { role: 'user', content: inputText, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const parts: any[] = [{ text: `${SYSTEM_INSTRUCTION}\n\nUser Query: ${inputText}` }];
      
      if (userMsg.image) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: userMsg.image.split(',')[1]
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I am processing your request. Please wait." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred. Please contact @AIGODSCOIN on X." }]);
    }
  };

  const startVoiceCall = async () => {
    setIsInCall(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = audioContextRef.current.createGain();
    outputNode.connect(audioContextRef.current.destination);

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => console.log('Live session opened'),
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && audioContextRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
          }
        },
        onclose: () => setIsInCall(false),
        onerror: (e) => console.error("Live Voice Error:", e)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    liveSessionRef.current = await sessionPromise;
  };

  const endVoiceCall = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    setIsInCall(false);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(numChannels, dataInt16.length / numChannels, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = buffer.getChannelData(ch);
      for (let i = 0; i < channelData.length; i++) channelData[i] = dataInt16[i * numChannels + ch] / 32768.0;
    }
    return buffer;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end">
      {!isOpen && (
        <button onClick={() => {setIsOpen(true); setIsMinimized(false);}} className="relative w-24 h-24 md:w-32 md:h-32 group hover:scale-110 transition-all cursor-pointer">
          <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative w-full h-full rounded-full border-4 border-cyan-400 bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
            <img src={logoUrl} alt="AI Assistant" className="w-full h-full object-cover" />
          </div>
        </button>
      )}

      {isOpen && (
        <div className={`flex flex-col bg-[#050508] border border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden transition-all ${isFullScreen ? 'fixed inset-4' : isMinimized ? 'h-20 w-80' : 'w-[90vw] md:w-[480px] h-[75vh]'}`}>
          <div className="p-6 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 overflow-hidden"><img src={logoUrl} /></div>
              <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">AIGODS AI <Sparkles size={12} /></h4>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)}><Minimize2 size={18} /></button>
              <button onClick={() => setIsFullScreen(!isFullScreen)}><Maximize2 size={18} /></button>
              <button onClick={() => setIsOpen(false)} className="text-red-500"><X size={24} /></button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] ${msg.role === 'user' ? 'bg-cyan-500 text-black font-bold' : 'bg-gray-900 text-white border border-gray-800'}`}>
                      {msg.image && <img src={msg.image} className="w-full rounded-xl mb-3" />}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isInCall && (
                  <div className="flex flex-col items-center py-10 space-y-5">
                    <Volume2 size={48} className="text-cyan-400 animate-pulse" />
                    <button onClick={endVoiceCall} className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold">End Call</button>
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-900/40 border-t border-gray-800">
                {selectedImage && <div className="relative mb-4 inline-block"><img src={selectedImage} className="w-16 h-16 rounded-xl" /><button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full"><X size={10} /></button></div>}
                <div className="flex items-center gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-gray-800 rounded-2xl"><ImageIcon size={24} /></button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <button onClick={startVoiceCall} className={`p-4 rounded-2xl ${isInCall ? 'bg-green-500' : 'bg-gray-800'}`}><Phone size={24} /></button>
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-black rounded-2xl p-4 text-white focus:outline-none" placeholder="Ask AIGODS..." />
                  <button onClick={handleSendMessage} className="p-4 bg-cyan-500 text-black rounded-2xl"><Send size={24} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
