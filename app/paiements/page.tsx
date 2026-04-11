"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, History, Search } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PaiementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all"); // "all", "gains", "depenses"

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/connexion');
        return;
      }
      setUser(session.user);

      const { data, error } = await supabase
        .from('paiements')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) setPaiements(data);
      setLoading(false);
    }
    loadData();
  }, [router]);

  // Calcul du solde fictif (Somme des gains - Somme des dépenses)
  const solde = paiements.reduce((acc, curr) => {
    return curr.type === 'gain' ? acc + curr.montant : acc - curr.montant;
  }, 0);

  const filteredPaiements = paiements.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "gains") return p.type === "gain";
    if (activeTab === "depenses") return p.type === "depense";
    return true;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-yamo-teal">Chargement de vos finances...</div>;

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-12">
      <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-50 flex items-center gap-4">
        <Link href="/"><ArrowLeft size={24} className="text-gray-600 hover:text-black transition" /></Link>
        <h1 className="text-xl font-black text-yamo-teal">Paiements & Historique</h1>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8">
        
        {/* CARTE DE SOLDE (STYLE BANCAIRE) */}
        <div className="bg-yamo-teal rounded-[2.5rem] p-8 text-white shadow-2xl shadow-yamo-teal/20 mb-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <Wallet size={20} />
              <span className="font-bold uppercase tracking-wider text-sm">Mon Solde Yamoh</span>
            </div>
            <h2 className="text-5xl font-black mb-6">{solde.toLocaleString()} <span className="text-2xl">FCFA</span></h2>
            <div className="flex gap-4">
              <button className="bg-white text-yamo-teal font-black px-6 py-3 rounded-2xl text-sm shadow-lg hover:bg-gray-100 transition">Retirer mes gains</button>
              <button className="bg-yamo-orange text-white font-black px-6 py-3 rounded-2xl text-sm shadow-lg hover:bg-orange-600 transition">Recharger</button>
            </div>
          </div>
        </div>

        {/* FILTRES D'HISTORIQUE */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab("all")} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition ${activeTab === "all" ? 'bg-yamo-teal text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>Tout</button>
          <button onClick={() => setActiveTab("depenses")} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition ${activeTab === "depenses" ? 'bg-yamo-teal text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>Mes dépenses</button>
          <button onClick={() => setActiveTab("gains")} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition ${activeTab === "gains" ? 'bg-yamo-teal text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>Mes gains</button>
        </div>

        {/* LISTE DES TRANSACTIONS */}
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
          {filteredPaiements.length === 0 ? (
            <div className="p-12 text-center">
              <History size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">Aucune transaction trouvée</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredPaiements.map((p) => (
                <div key={p.id} className="p-6 border-b border-gray-50 hover:bg-gray-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.type === 'gain' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {p.type === 'gain' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{p.libelle}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                        {new Date(p.created_at).toLocaleDateString('fr-FR')} • {p.methode}
                      </p>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${p.type === 'gain' ? 'text-green-600' : 'text-gray-900'}`}>
                    {p.type === 'gain' ? '+' : '-'}{p.montant} <span className="text-xs">FCFA</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}