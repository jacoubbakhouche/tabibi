import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
}

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: 'patient' | 'doctor';
}

interface ChatPageProps {
    onChatStateChange?: (isOpen: boolean) => void;
}

export default function ChatPage({ onChatStateChange }: ChatPageProps) {
    const location = useLocation();
    const { user, userRole } = useAuth();
    const [conversations, setConversations] = useState<Profile[]>([]);
    const [activeChat, setActiveChat] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load: Check for passed state AND fetch convos
    useEffect(() => {
        if (!user) return;

        const initChat = async () => {
            await fetchConversations();

            // Check if we navigated here with a target user
            const state = location.state as { targetUser?: any };
            if (state?.targetUser) {
                // Normalize target user to Profile format
                const target: Profile = {
                    id: state.targetUser.id,
                    full_name: state.targetUser.profiles?.full_name || state.targetUser.full_name || 'User',
                    avatar_url: state.targetUser.profiles?.avatar_url || state.targetUser.avatar_url,
                    role: userRole === 'patient' ? 'doctor' : 'patient'
                };
                setActiveChat(target);
                // Also add to conversations if not present
                setConversations(prev => {
                    if (prev.find(c => c.id === target.id)) return prev;
                    return [target, ...prev];
                });
            }
        };

        initChat();
    }, [user, userRole]);

    // Handle Active Chat Changes
    useEffect(() => {
        if (onChatStateChange) {
            onChatStateChange(!!activeChat);
        }
    }, [activeChat]);

    // Cleanup on unmount (ensure tab bar comes back)
    useEffect(() => {
        return () => {
            if (onChatStateChange) onChatStateChange(false);
        }
    }, []);

    // Fetch messages for active chat
    useEffect(() => {
        if (activeChat && user) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Polling every 3s
            return () => clearInterval(interval);
        }
    }, [activeChat, user]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            if (!user) return;

            const conversationPartners = new Set<string>();
            const profilesMap = new Map<string, Profile>();

            // 1. Fetch from Appointments 
            // helpful for finding people you SHOULD talk to, even if no messages yet
            if (userRole === 'patient') {
                const { data } = await supabase
                    .from('appointments')
                    .select('doctor_id, doctors(id, profiles(full_name, avatar_url))')
                    .eq('patient_id', user.id);

                data?.forEach((a: any) => {
                    if (a.doctors?.id) {
                        conversationPartners.add(a.doctors.id);
                        profilesMap.set(a.doctors.id, {
                            id: a.doctors.id,
                            full_name: a.doctors.profiles?.full_name || 'Doctor',
                            avatar_url: a.doctors.profiles?.avatar_url,
                            role: 'doctor'
                        });
                    }
                });
            } else if (userRole === 'doctor') {
                // Fetch patients from appointments
                const { data } = await supabase
                    .from('appointments')
                    .select('patient_id')
                    .eq('doctor_id', user.id);

                data?.forEach((a: any) => {
                    if (a.patient_id) conversationPartners.add(a.patient_id);
                });
            }

            // 2. Fetch from Messages (Source of Truth for "Chats")
            // Get all messages where I am sender OR receiver
            const { data: messagesData } = await supabase
                .from('messages')
                .select('sender_id, receiver_id')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (messagesData) {
                messagesData.forEach(msg => {
                    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                    conversationPartners.add(otherId);
                });
            }

            // 3. Fetch Profiles for all partners
            if (conversationPartners.size > 0) {
                const ids = Array.from(conversationPartners);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, role')
                    .in('id', ids);

                profiles?.forEach(p => {
                    const existing = profilesMap.get(p.id);
                    // Use existing role if known, else from profile, else guess
                    let role = existing?.role || p.role;
                    if (!role) {
                        role = userRole === 'patient' ? 'doctor' : 'patient';
                    }

                    profilesMap.set(p.id, {
                        id: p.id,
                        full_name: p.full_name || 'User',
                        avatar_url: p.avatar_url,
                        role: role as 'patient' | 'doctor'
                    });
                });
            }

            setConversations(Array.from(profilesMap.values()));

        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!activeChat || !user) return;
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || !user) return;

        const msg = {
            sender_id: user.id,
            receiver_id: activeChat.id,
            content: newMessage,
            created_at: new Date().toISOString()
        };

        // Optimistic UI updates
        setMessages(prev => [...prev, { ...msg, id: 'temp-' + Date.now(), is_read: false }]);
        setNewMessage('');

        await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: activeChat.id,
            content: msg.content
        });

        fetchMessages();
    };

    if (!activeChat) {
        // List View
        return (
            <div className="h-full bg-white flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : (
                        conversations.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10">
                                <p>No conversations yet.</p>
                                <p className="text-sm">Book an appointment (or wait for a message) to start chatting.</p>
                            </div>
                        ) : (
                            conversations.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    className="flex items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-gray-100"
                                >
                                    <img
                                        src={chat.avatar_url || "https://via.placeholder.com/50"}
                                        alt={chat.full_name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                    />
                                    <div className="ml-4 flex-1">
                                        <h3 className="font-semibold text-gray-900">{chat.full_name}</h3>
                                        <p className="text-sm text-gray-500 truncate">Tap to chat...</p>
                                    </div>
                                    <span className="text-xs text-gray-400">12:30 PM</span>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        );
    }

    // Chat View
    return (
        <div className="h-full flex flex-col bg-gray-50 fixed inset-0 z-[1050]"> {/* Overlays everything */}

            {/* Header */}
            <div className="bg-white p-3 border-b flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center">
                    <button
                        onClick={() => setActiveChat(null)}
                        className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <img
                        src={activeChat.avatar_url || "https://via.placeholder.com/40"}
                        alt={activeChat.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{activeChat.full_name}</h3>
                        <span className="text-xs text-green-500 flex items-center">● Online</span>
                    </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-500">
                    <Phone className="w-5 h-5 cursor-pointer hover:text-blue-600" />
                    <Video className="w-5 h-5 cursor-pointer hover:text-blue-600" />
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-black" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t">
                <form onSubmit={sendMessage} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent focus:outline-none text-sm"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="text-blue-600 ml-2 disabled:text-gray-400">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
