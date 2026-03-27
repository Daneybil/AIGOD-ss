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
  Sparkles,
  Mic,
  MicOff,
  PhoneOff,
  Paperclip,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SYSTEM_INSTRUCTION } from '../constants.ts';

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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isConfigured, setIsConfigured] = useState({ thinking: true, whisper: true, tts: true });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const isProcessingCallRef = useRef(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = "https://ui-avatars.com/api/?name=AIGODS&background=0D0D0D&color=00ffff&size=256&bold=true";
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setIsConfigured(data.config);
      } catch (e) {
        console.warn("Health check failed");
      }
    };
    if (isOpen) checkHealth();
  }, [isOpen]);

  const handleSendMessage = async (overrideText?: string) => {
    const textToUse = overrideText || inputText;
    if (!textToUse.trim() && !selectedImage) return;

    const userMsg: Message = { role: 'user', content: textToUse, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsThinking(true);

    try {
      let responseText = "";
      
      if (userMsg.image) {
        // Use Vision API
        const formData = new FormData();
        const blob = await fetch(userMsg.image).then(r => r.blob());
        formData.append("image", blob);
        formData.append("prompt", `${SYSTEM_INSTRUCTION}\n\nUser Query: ${textToUse}`);
        
        const res = await fetch("/api/vision", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Vision API Error");
        const data = await res.json();
        responseText = data.choices[0].message.content;
      } else {
        // Use Chat API
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: SYSTEM_INSTRUCTION },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: textToUse }
            ]
          })
        });
        if (!res.ok) throw new Error("Chat API Error");
        const data = await res.json();
        responseText = data.choices[0].message.content;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      if (isInCall) {
        await speakText(responseText);
      }
    } catch (error: any) {
      console.error("AI Error:", error?.message || "Communication failed");
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred. Please ensure your NVIDIA API keys are set in the environment variables. 👑" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play();
        audioPlayerRef.current.onended = () => setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording Error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    try {
      setIsTranscribing(true);
      isProcessingCallRef.current = true;
      const formData = new FormData();
      formData.append("audio", blob);
      
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Transcription API Error");
      const data = await res.json();
      if (data.text) {
        if (isInCall) {
          await handleSendMessage(data.text);
        } else {
          setInputText(data.text);
        }
      }
    } catch (error) {
      console.error("Transcription Error:", error);
    } finally {
      setIsTranscribing(false);
      isProcessingCallRef.current = false;
      // If still in call, restart recording
      if (isInCall && mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
      }
    }
  };

  const startVoiceCall = async () => {
    try {
      setIsInCall(true);
      setMessages(prev => [...prev, { role: 'assistant', content: "Voice Call Protocol Active. I am listening... 👑" }]);
      
      // Request permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Audio Context for VAD
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await handleTranscription(audioBlob);
        }
        
        // Restart recording if still in call and not processing
        if (isInCall && !isProcessingCallRef.current) {
          audioChunksRef.current = [];
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
            mediaRecorderRef.current.start();
          }
        }
      };

      mediaRecorder.start();

      // Improved Silence Detection (VAD)
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      vadIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || !mediaRecorderRef.current || isProcessingCallRef.current || isSpeaking) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // If volume is above threshold, reset silence timer
        if (average > 15) { 
          silenceStartRef.current = null;
        } else {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = Date.now();
          } else if (Date.now() - silenceStartRef.current > 2000) { // 2s silence
            if (mediaRecorderRef.current.state === 'recording' && audioChunksRef.current.length > 0) {
              mediaRecorderRef.current.stop();
            }
            silenceStartRef.current = null;
          }
        }
      }, 100);

    } catch (error) {
      console.error("Call Setup Error:", error);
      setIsInCall(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to access microphone. Please ensure permissions are granted. 👑" }]);
    }
  };

  const endVoiceCall = () => {
    setIsInCall(false);
    if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
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
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60] flex flex-col items-end">
      <audio ref={audioPlayerRef} className="hidden" />
      {!isOpen && (
        <button onClick={() => {setIsOpen(true); setIsMinimized(false);}} className="relative w-20 h-20 md:w-32 md:h-32 group hover:scale-110 transition-all cursor-pointer">
          <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative w-full h-full rounded-full border-4 border-cyan-400 bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
            <img 
              src={logoUrl} 
              alt="AI Assistant" 
              className="w-full h-full object-cover" 
              style={{ display: 'block', visibility: 'visible', opacity: 1 }}
              onError={handleImageError}
            />
          </div>
        </button>
      )}

      {isOpen && (
        <div className={`flex flex-col bg-[#050508] border border-gray-800 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden transition-all ${isFullScreen ? 'fixed inset-4' : isMinimized ? 'h-20 w-80' : 'w-[90vw] md:w-[480px] h-[65vh] md:h-[75vh] max-h-[550px] md:max-h-none'}`}>
          <div className="p-4 md:p-6 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 overflow-hidden">
                <img 
                  src={logoUrl} 
                  className="w-full h-full object-cover" 
                  style={{ display: 'block', visibility: 'visible', opacity: 1 }}
                  onError={handleImageError}
                />
              </div>
              <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">AIGODS AI <Sparkles size={12} /></h4>
            </div>
            <div className="flex gap-2 text-white">
              <button onClick={() => setIsMinimized(!isMinimized)}><Minimize2 size={18} /></button>
              <button onClick={() => setIsFullScreen(!isFullScreen)}><Maximize2 size={18} /></button>
              <button onClick={() => setIsOpen(false)} className="text-red-500 ml-2"><X size={24} /></button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative">
                {/* Background Logo - Subtle and Dark with Professional Motion */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="bg-logo-container"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative flex items-center justify-center"
                    >
                      {/* Main Logo with slow, complex motion - Brighter and more visible */}
                      <motion.img 
                        src={logoUrl} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0.1, 0.2, 0.1],
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                          filter: ['blur(4px)', 'blur(0px)', 'blur(4px)']
                        }}
                        transition={{ 
                          duration: 15, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                        className="w-96 h-96 object-contain grayscale brightness-[0.6]" 
                        onError={handleImageError}
                      />
                      
                      {/* Secondary "Ghost" Logo for interchanging effect - More active */}
                      <motion.img 
                        src={logoUrl} 
                        initial={{ opacity: 0, scale: 1.2 }}
                        animate={{ 
                          opacity: [0, 0.08, 0],
                          scale: [1.2, 0.95, 1.2],
                          rotate: [0, -15, 15, 0]
                        }}
                        transition={{ 
                          duration: 20, 
                          repeat: Infinity, 
                          ease: "linear" 
                        }}
                        className="absolute w-96 h-96 object-contain grayscale brightness-[0.4] blur-lg"
                      />

                      {/* Ambient Glow - More intense */}
                      <motion.div 
                        animate={{ 
                          opacity: [0.2, 0.4, 0.2],
                          scale: [1, 1.3, 1],
                          background: [
                            'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
                            'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                            'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)'
                          ]
                        }}
                        transition={{ duration: 12, repeat: Infinity }}
                        className="absolute inset-0 w-[600px] h-[600px] rounded-full"
                      ></motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="relative z-10 space-y-8">
                  {(!isConfigured.thinking || !isConfigured.whisper || !isConfigured.tts) && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center">
                      ⚠️  NVIDIA API Keys Missing. Please set them in environment variables.
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] p-5 rounded-[2rem] ${msg.role === 'user' ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20' : 'bg-gray-900 text-white border border-gray-800 shadow-xl'}`}>
                        {msg.image && <img src={msg.image} className="w-full rounded-xl mb-3 border border-gray-700" />}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isThinking && (
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-[10px] uppercase font-black tracking-widest animate-pulse">AI Thinking...</span>
                    </div>
                  )}
                </div>

                {isInCall && (
                  <div className="flex flex-col items-center py-10 space-y-5 relative z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                      <Volume2 size={64} className={`text-cyan-400 ${isSpeaking ? 'animate-bounce' : 'animate-pulse'}`} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-400">Live Voice Protocol Active</p>
                    <button onClick={endVoiceCall} className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2">
                      <PhoneOff size={14} /> End Call
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 md:p-8 bg-gray-900/40 border-t border-gray-800">
                {selectedImage && <div className="relative mb-4 inline-block"><img src={selectedImage} className="w-16 h-16 rounded-xl" /><button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full"><X size={10} className="text-white"/></button></div>}
                
                {isTranscribing && <p className="text-[10px] text-cyan-400 uppercase font-black mb-2 animate-pulse">Transcribing Voice Note...</p>}

                <div className="flex items-center gap-1.5 md:gap-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 md:p-3 bg-gray-800 rounded-xl text-white hover:bg-gray-700 transition-colors" title="Send Image">
                      <Paperclip size={16} className="md:w-5 md:h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2 md:p-3 rounded-xl text-white transition-all ${isRecording ? 'bg-red-500 scale-110 animate-pulse' : 'bg-gray-800 hover:bg-gray-700'}`}
                      title={isRecording ? "Click to Stop Recording" : "Click to Start Recording"}
                    >
                      {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>

                    <button 
                      onClick={isInCall ? endVoiceCall : startVoiceCall} 
                      className={`p-2 md:p-3 rounded-xl text-white transition-all ${isInCall ? 'bg-green-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                      title="Start Voice Call"
                    >
                      <Phone size={16} className="md:w-5 md:h-5" />
                    </button>
                  </div>

                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                    className="flex-1 bg-black rounded-xl p-2.5 md:p-3 text-white text-xs md:text-sm focus:outline-none border border-gray-800 focus:border-cyan-500 transition-colors min-w-0" 
                    placeholder="Ask AIGODS..." 
                  />
                  
                  <button onClick={handleSendMessage} className="p-2.5 md:p-3 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-colors flex-shrink-0">
                    <Send size={16} className="md:w-5 md:h-5" />
                  </button>
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