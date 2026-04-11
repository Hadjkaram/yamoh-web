"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Star, MessageCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AvisPage() {
  const [avis, setAvis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvis() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Note: Vous devrez créer une table 'avis' dans Supabase plus tard
      const { data } = await supabase
        .from('avis')
        .select('*, profiles:auteur_id(full_name)')
        .eq('destinataire_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) setAvis(data);
      setLoading(false);
    }
    fetchAvis();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-12">
      <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-50 flex items-center gap-4">
        <Link href="/profil"><ArrowLeft size={24} className="text-gray-900" /></Link>
        <h1 className="text-xl font-black text-yamo-teal">Avis</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 mt-10">
        <div className="flex items-center gap-4 mb-10 bg-white p-8 rounded-[2rem] shadow-sm">
          <div className="bg-yamo-teal/10 p-4 rounded-full">
            <Star size={40} className="text-yamo-teal fill-yamo-teal" />
          </div>
          <div>
            <h2 className="text-3xl font-black">4.9 / 5</h2>
            <p className="text-gray-500 font-bold">{avis.length} avis reçus</p>
          </div>
        </div>

        <div className="space-y-6">
          {avis.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
              <MessageCircle size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">Vous n'avez pas encore reçu d'avis.</p>
            </div>
          ) : (
            avis.map((a) => (
              <div key={a.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-black text-gray-900">{a.profiles?.full_name}</p>
                  <div className="flex text-yamo-orange">
                    {[...Array(a.note)].map((_, i) => <Star key={i} size={16} className="fill-current" />)}
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{a.commentaire}"</p>
                <p className="text-xs text-gray-400 mt-4 font-bold uppercase">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}