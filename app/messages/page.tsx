"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Send, MessageSquare, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: convData, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`passager_id.eq.${session.user.id},conducteur_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erreur de chargement :", error.message);
        return;
      }

      if (convData && convData.length > 0) {
        const trajetIds = [...new Set(convData.map(c => c.trajet_id).filter(Boolean))];
        const userIds = [...new Set(convData.flatMap(c => [c.passager_id, c.conducteur_id]).filter(Boolean))];

        const { data: trajetsData } = await supabase.from('trajets').select('*').in('id', trajetIds);
        const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);

        const mergedConversations = convData.map(conv => ({
          ...conv,
          trajets: trajetsData?.find(t => t.id === conv.trajet_id) || {},
          passager: profilesData?.find(p => p.id === conv.passager_id) || {},
          conducteur: profilesData?.find(p => p.id === conv.conducteur_id) || {}
        }));

        setConversations(mergedConversations);
        setSelectedConv(mergedConversations[0]);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedConv) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedConv.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConv.id}` }, 
        (payload) => {
          // ANTI-DOUBLON : On vérifie si on n'a pas déjà affiché ce message manuellement
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !selectedConv) return;

    const messageToSend = newMessage;
    setNewMessage(""); // On vide le champ pour que ce soit fluide

    // 1. On insère dans la base ET on récupère la ligne générée (.select().single())
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: selectedConv.id,
        sender_id: userId,
        content: messageToSend
      }])
      .select()
      .single();

    if (error) {
      alert("Erreur d'envoi du message : " + error.message);
      setNewMessage(messageToSend); // En cas d'erreur, on remet le texte dans le champ
    } else if (data) {
      // 2. AFFICHAGE INSTANTANÉ : On ajoute le message validé directement dans notre liste locale
      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* 1. LISTE DES DISCUSSIONS (À GAUCHE) */}
      <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-6 border-b border-gray-100 flex items-center gap-4">
          <Link href="/"><ArrowLeft className="text-gray-600 hover:text-yamo-teal transition" /></Link>
          <h1 className="text-2xl font-black text-yamo-teal">Messages</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold">Aucune discussion en cours</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => setSelectedConv(conv)}
                className={`p-6 border-b border-gray-50 cursor-pointer transition ${selectedConv?.id === conv.id ? 'bg-yamo-teal/5 border-l-4 border-l-yamo-teal' : 'hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="font-black text-gray-900 line-clamp-1">{conv.trajets?.depart?.split(',')[0]} → {conv.trajets?.destination?.split(',')[0]}</p>
                </div>
                <p className="text-sm text-gray-500 truncate font-medium">
                  {userId === conv.conducteur_id ? `Passager : ${conv.passager?.full_name || 'Inconnu'}` : `Conducteur : ${conv.conducteur?.full_name || 'Inconnu'}`}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. ZONE DE CHAT (À DROITE) */}
      <div className={`flex-1 flex flex-col h-screen bg-gray-50 ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            <header className="p-4 bg-white border-b border-gray-100 flex items-center gap-4 shadow-sm z-10">
              <button onClick={() => setSelectedConv(null)} className="md:hidden p-2"><ArrowLeft /></button>
              <div className="w-10 h-10 bg-yamo-teal/10 rounded-full flex items-center justify-center text-yamo-teal font-black text-lg">
                {(userId === selectedConv.conducteur_id ? selectedConv.passager?.full_name : selectedConv.conducteur?.full_name)?.charAt(0).toUpperCase() || <UserIcon size={20} />}
              </div>
              <div>
                <p className="font-black text-gray-900 leading-none">
                  {userId === selectedConv.conducteur_id ? selectedConv.passager?.full_name : selectedConv.conducteur?.full_name}
                </p>
                <p className="text-xs text-yamo-teal font-bold mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yamo-teal animate-pulse"></span> En ligne
                </p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 font-medium">Dites bonjour ! 👋</div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] font-medium text-sm md:text-base shadow-sm ${
                      m.sender_id === userId 
                      ? 'bg-yamo-teal text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message ici..."
                className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-yamo-teal/20 transition font-medium"
              />
              <button type="submit" disabled={!newMessage.trim()} className="bg-yamo-teal text-white p-4 rounded-2xl hover:bg-[#115566] transition shadow-lg shadow-yamo-teal/20 disabled:opacity-50 disabled:cursor-not-allowed">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <div className="p-8 bg-white rounded-full mb-6 shadow-sm border border-gray-50">
              <MessageSquare size={64} className="text-yamo-teal opacity-20" />
            </div>
            <p className="text-xl font-black text-gray-400">Vos discussions apparaîtront ici</p>
          </div>
        )}
      </div>
    </main>
  );
}