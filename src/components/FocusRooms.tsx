import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Clock, Zap, Play, Pause, RotateCcw, MessageSquare, Shield, Globe, Lock, Brain, Send } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { formatISTTime } from "../lib/utils";

interface UserProfile {
  id: string;
  name: string;
}

interface RoomData {
  name: string;
  users: UserProfile[];
  timer: number;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export const FocusRooms = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [focusGoal, setFocusGoal] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine the environment correctly
    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ["websocket"]
    });
    
    setSocket(newSocket);

    newSocket.on("room-data", (data: RoomData) => {
      setCurrentRoom(data);
    });

    newSocket.on("timer-status", ({ isActive, timer }) => {
      setCurrentRoom(prev => prev ? { ...prev, isActive, timer } : null);
    });

    newSocket.on("timer-update", (timer: number) => {
      setCurrentRoom(prev => prev ? { ...prev, timer } : null);
    });

    newSocket.on("new-chat-message", (msg: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-49), msg]);
    });

    return () => {
      newSocket.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  const joinRoom = (roomName: string) => {
    if (socket) {
      socket.emit("join-room", roomName);
      setSelectedRoom(roomName);
    }
  };

  const toggleTimer = () => {
    if (socket && currentRoom) {
      const newActive = !currentRoom.isActive;
      socket.emit("toggle-timer", { roomName: currentRoom.name, isActive: newActive });
    }
  };

  const sendMessage = () => {
    if (socket && selectedRoom && chatInput.trim()) {
      socket.emit("send-message", { 
        roomName: selectedRoom, 
        text: chatInput,
        userName: "Mark" // Fallback or from profile
      });
      setChatInput("");
    }
  };

  useEffect(() => {
    if (currentRoom?.isActive) {
      timerRef.current = setInterval(() => {
        setCurrentRoom(prev => {
          if (!prev || prev.timer <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
          const nextTimer = prev.timer - 1;
          // Periodically sync with server to ensure consistency
          if (nextTimer % 5 === 0 && socket) {
            socket.emit("sync-timer", { roomName: prev.name, timer: nextTimer });
          }
          return { ...prev, timer: nextTimer };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRoom?.isActive, socket]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [momentum, setMomentum] = useState(65);

  useEffect(() => {
    // Pulse momentum based on timer activity
    const interval = setInterval(() => {
      setMomentum(prev => {
        if (currentRoom?.isActive) {
          return Math.min(100, prev + (Math.random() * 2));
        }
        return Math.max(30, prev - (Math.random() * 1.5));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentRoom?.isActive]);

  const rooms = [
    { name: "Deep Work Library", users: 12, mode: "Silent", icon: Globe },
    { name: "STEM Study Group", users: 5, mode: "Collaborative", icon: Brain },
    { name: "CS Final Prep", users: 8, mode: "Focus Only", icon: Lock },
    { name: "Late Night Coffee", users: 15, mode: "Casual", icon: Users },
  ];

  if (!selectedRoom) {
    return (
      <div className="space-y-10">
        <div>
          <h2 className="text-4xl font-bold text-ink mb-2 tracking-tight">Collaborative Focus Rooms</h2>
          <p className="text-ink-muted font-light">Study alongside others and stay accountable with shared timers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {rooms.map((room, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-[2.5rem] border-white/60 hover:border-primary/40 transition-all cursor-pointer group shadow-2xl shadow-primary/5"
              onClick={() => joinRoom(room.name)}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                <room.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-ink text-xl mb-1 group-hover:text-primary transition-colors">{room.name}</h3>
              <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest text-ink-muted mb-6">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {room.users} Active</span>
                <span className="text-primary">•</span>
                <span className="flex items-center gap-1.5">{room.mode}</span>
              </div>
              <button className="w-full py-3 bg-white border border-primary text-primary font-bold rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/10 tracking-tight">
                Enter Room
              </button>
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#0D0B21] to-[#151619] p-12 rounded-[3.5rem] text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-primary shadow-2xl border border-white/20">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight">Create Private Room</h3>
              <p className="text-white/50 leading-relaxed font-light max-w-xl text-lg">
                Need a quiet space for your specific project or group? Start a private focus room and invite only the people you choose.
              </p>
              <button className="px-10 py-4 bg-primary text-white rounded-[1.5rem] font-bold shadow-2xl shadow-primary/40 hover:scale-105 transition-all">
                Launch Space
              </button>
            </div>
            <div className="w-full md:w-80 h-48 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center p-8 text-center space-y-4">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <img key={i} src={`https://picsum.photos/seed/user${i}/64/64`} className="w-12 h-12 rounded-full border-4 border-[#0D0B21] ring-2 ring-white/10" referrerPolicy="no-referrer" />
                 ))}
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Invite friends via room code</p>
               <div className="px-5 py-2.5 bg-white/10 rounded-xl text-sm font-bold tracking-widest border border-white/20">#FOCUS-2024</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 min-h-[80vh]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSelectedRoom(null)}
            className="p-3 glass hover:bg-white/20 rounded-2xl text-ink-muted transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-ink tracking-tight">{currentRoom?.name}</h2>
            <p className="text-xs text-ink-muted flex items-center gap-2 font-medium">
               <Users className="w-4 h-4 text-primary" /> {currentRoom?.users.length || 0} Learners focusing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className={`px-6 py-3 font-bold rounded-2xl shadow-xl flex items-center gap-2 transition-all ${isChatOpen ? 'bg-primary text-white' : 'bg-white text-ink border border-white/60 hover:bg-neutral-50'}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <MessageSquare className="w-4 h-4" /> {isChatOpen ? 'Close Chat' : 'Room Chat'}
          </button>
          <button className="px-6 py-3 bg-red-500 text-white font-bold rounded-2xl shadow-xl shadow-red-200 flex items-center gap-2 hover:scale-105 transition-all" onClick={() => {
            setSelectedRoom(null);
            setIsChatOpen(false);
          }}>
            Leave Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className={isChatOpen ? "lg:col-span-8" : "lg:col-span-8"}>
          <div className="space-y-8">
              <div className={`bg-gradient-to-br from-indigo-600 via-primary to-purple-700 min-h-[450px] rounded-[4rem] text-white flex flex-col items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-700 group ${currentRoom?.isActive ? 'shadow-primary/50 ring-8 ring-primary/10' : 'shadow-primary/30'}`}>
               {/* Momentum Indicator */}
               <div className="absolute top-10 left-10 flex flex-col items-start gap-1 z-20">
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Group Momentum</span>
                 <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                        animate={{ width: `${momentum}%` }}
                        className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                       />
                    </div>
                    <span className="text-[10px] font-black">{Math.round(momentum)}%</span>
                 </div>
               </div>
               {/* Background Effects */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-[100px] transition-all duration-1000 ${currentRoom?.isActive ? 'scale-150 opacity-100 animate-pulse' : 'scale-75 opacity-20'}`} />
               
               <div className="relative z-10 text-center space-y-8">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black uppercase tracking-[0.3em] opacity-60 mb-4">Study Session</span>
                    <div className={`text-[120px] font-black tracking-tighter tabular-nums leading-none select-none drop-shadow-2xl transition-all duration-500 ${currentRoom?.isActive ? 'scale-105 text-white' : 'scale-100 text-white/90'}`}>
                      {formatTime(currentRoom?.timer || 1500)}
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <button 
                      onClick={toggleTimer}
                      className="w-20 h-20 bg-white text-primary rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                    >
                      {currentRoom?.isActive ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-2" fill="currentColor" />}
                    </button>
                    <button 
                      onClick={() => {
                        if (socket && currentRoom) {
                          socket.emit("sync-timer", { roomName: currentRoom.name, timer: 25 * 60 });
                        }
                      }}
                      className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/30 transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-widest border border-white/10">
                    <Zap className={`w-4 h-4 ${currentRoom?.isActive ? 'text-yellow-400 animate-pulse' : 'text-white/40'}`} />
                    {currentRoom?.isActive ? 'DEEP WORK IN PROGRESS' : 'READY TO START'}
                  </div>
               </div>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border-white/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-ink flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" /> Session Goal
                </h3>
                <span className="text-[10px] font-black uppercase text-ink-muted tracking-[0.1em]">Share with your group</span>
              </div>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={focusGoal}
                  onChange={(e) => setFocusGoal(e.target.value)}
                  placeholder="What is your primary focus for this block?"
                  className="flex-1 bg-white/50 border-white/60 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <button className="px-6 bg-primary text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <AnimatePresence mode="wait">
            {isChatOpen ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass rounded-[2.5rem] border-white/60 flex flex-col h-[650px] overflow-hidden"
              >
                <div className="p-6 border-b border-white/20 bg-white/10 flex items-center justify-between">
                  <h4 className="font-bold text-ink flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Room Chat
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Live</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{msg.userName}</span>
                        <span className="text-[8px] text-ink-muted">{formatISTTime(new Date(msg.timestamp))}</span>
                      </div>
                      <div className="bg-white/40 border border-white/60 p-3 rounded-2xl rounded-tl-none text-xs text-ink leading-relaxed font-medium">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-6 bg-white/10 border-t border-white/20">
                  <div className="relative">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="w-full bg-white/60 border-white/60 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button 
                      onClick={sendMessage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="glass p-8 rounded-[2.5rem]">
                  <h3 className="text-xl font-bold text-ink mb-6 flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" /> Active Learners
                  </h3>
                  <div className="space-y-6">
                    {currentRoom?.users.map((user, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={`absolute -inset-1 rounded-[1.25rem] bg-gradient-to-tr from-primary to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity blur-sm ${currentRoom?.isActive ? 'opacity-30' : ''}`} />
                            <img src={`https://picsum.photos/seed/${user.id}/80/80`} className="w-14 h-14 rounded-2xl border-2 border-white/80 shadow-lg relative z-10 object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm z-20" />
                          </div>
                          <div>
                            <p className="font-bold text-ink text-base group-hover:text-primary transition-colors leading-none mb-1">{user.name}</p>
                            <div className="flex items-center gap-1.5 min-w-0">
                               <div className={`w-1.5 h-1.5 rounded-full ${currentRoom?.isActive ? 'bg-primary animate-pulse' : 'bg-neutral-300'}`} />
                               <p className="text-[10px] text-ink-muted uppercase font-black tracking-widest truncate max-w-[120px]">
                                 {currentRoom?.isActive ? 'Deep Focus' : 'Just Joined'}
                               </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] bg-emerald-50/30 border-emerald-100/50">
                   <div className="flex items-center gap-3 mb-4">
                     <Shield className="w-6 h-6 text-emerald-600" />
                     <h4 className="font-bold text-emerald-900">Focus Insight</h4>
                   </div>
                   <p className="text-xs text-emerald-800/70 leading-relaxed font-medium">
                     Students who study in groups are 34% more likely to stick to their schedule. Use the shared timer to sync your breaks!
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
