
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { JARVIS_SYSTEM_INSTRUCTION, VOICE_NAME, SAMPLE_RATE_INPUT, SAMPLE_RATE_OUTPUT } from './constants';
import { ConnectionStatus, TranscriptionLine, SystemStats } from './types';
import JarvisCore from './components/JarvisCore';
import HUDPanel from './components/HUDPanel';
import SystemMonitor from './components/SystemMonitor';
import StatusIndicator from './components/StatusIndicator';
import { encode, decode, decodeAudioData } from './services/audioUtils';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [transcriptions, setTranscriptions] = useState<TranscriptionLine[]>([]);
  const [stats, setStats] = useState<SystemStats>({ cpu: 12, memory: 34, power: 100, latency: 0 });
  const [isListening, setIsListening] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  
  // Audio Refs
  const audioCtxRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Buffer transcriptions for smooth rendering
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  const initAudio = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = {
        input: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_INPUT }),
        output: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_OUTPUT })
      };
    }
    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  };

  const toggleAR = async () => {
    if (!isARMode) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
        }
        setIsARMode(true);
      } catch (err) {
        console.error("Camera access denied for AR:", err);
      }
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsARMode(false);
    }
  };

  const handleStop = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setStatus(ConnectionStatus.DISCONNECTED);
    setIsListening(false);
  };

  const handleStart = async () => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      await initAudio();
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
          },
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION + (isARMode ? "\nUser is currently in AR mode and viewing through their camera." : ""),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            setIsListening(true);
            
            const source = audioCtxRef.current!.input.createMediaStreamSource(streamRef.current!);
            const processor = audioCtxRef.current!.input.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmData = encode(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            
            source.connect(processor);
            processor.connect(audioCtxRef.current!.input.destination);
          },
          onmessage: async (message) => {
            if (message.serverContent?.inputTranscription) {
              currentInputRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputRef.current += message.serverContent.outputTranscription.text;
            }
            
            if (message.serverContent?.turnComplete) {
              const input = currentInputRef.current;
              const output = currentOutputRef.current;
              if (input) setTranscriptions(prev => [...prev, { id: Math.random().toString(), role: 'user', text: input, timestamp: Date.now() }]);
              if (output) setTranscriptions(prev => [...prev, { id: Math.random().toString(), role: 'assistant', text: output, timestamp: Date.now() }]);
              currentInputRef.current = '';
              currentOutputRef.current = '';
            }

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const outCtx = audioCtxRef.current!.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), outCtx, SAMPLE_RATE_OUTPUT, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('JARVIS Error:', e);
            setStatus(ConnectionStatus.ERROR);
          },
          onclose: () => {
            setStatus(ConnectionStatus.DISCONNECTED);
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to initialize JARVIS:', err);
      setStatus(ConnectionStatus.ERROR);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 5)),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() - 0.5) * 2)),
        power: 99 + Math.random(),
        latency: status === ConnectionStatus.CONNECTED ? 45 + Math.random() * 20 : 0
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="relative h-screen w-screen overflow-hidden text-cyan-400 select-none flex flex-col items-center justify-center">
      {/* AR Camera Layer */}
      {isARMode && (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="fixed top-0 left-0 w-full h-full object-cover scale-x-[-1]" 
          />
          <div className="ar-overlay" />
          <div className="scanlines" />
        </>
      )}

      {/* Header Overlay */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <h1 className="text-2xl font-orbitron font-bold glow-cyan tracking-widest">J.A.R.V.I.S.</h1>
          <div className="text-[10px] uppercase tracking-[0.3em] opacity-60">Just A Rather Very Intelligent System</div>
          <button 
            onClick={toggleAR}
            className={`mt-4 px-4 py-1 text-[10px] font-orbitron border tracking-widest transition-all ${
              isARMode ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-transparent border-cyan-500/30 text-cyan-500/60'
            }`}
          >
            {isARMode ? 'AR_PROTOCOL_ACTIVE' : 'AR_PROTOCOL_STANDBY'}
          </button>
        </div>
        <div className="pointer-events-auto">
          <StatusIndicator status={status} />
        </div>
      </header>

      {/* Main HUD Visualization */}
      <div className="relative w-full h-full flex items-center justify-center p-4 z-10">
        {/* Left Side: System Metrics */}
        <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-8 w-64">
          <SystemMonitor stats={stats} />
        </div>

        {/* Center: Core AI Animation */}
        <div className="relative flex flex-col items-center gap-12">
          <JarvisCore active={isListening} status={status} />
          
          <div className="z-20">
            {status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR ? (
              <button 
                onClick={handleStart}
                className="px-8 py-3 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 rounded-full font-orbitron text-sm tracking-widest transition-all glow-cyan uppercase"
              >
                Initialize Systems
              </button>
            ) : (
              <button 
                onClick={handleStop}
                className="px-8 py-3 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 hover:border-red-400 text-red-400 rounded-full font-orbitron text-sm tracking-widest transition-all uppercase"
              >
                Go Offline
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Transcription / Log */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col w-80 h-[60%]">
          <HUDPanel transcriptions={transcriptions} />
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="absolute bottom-4 left-0 w-full px-8 flex justify-between items-center text-[10px] uppercase opacity-40 z-10">
        <div>STARK INDUSTRIES // MARK LXXXV</div>
        <div className="flex gap-4">
          <div>CAM: {isARMode ? 'ONLINE' : 'OFFLINE'}</div>
          <div>V 3.4.19-BETA // SECURE CONNECTION</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
