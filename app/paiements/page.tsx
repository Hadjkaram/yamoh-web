"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Wallet, History, ShieldCheck, X, Phone } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// NOUVEAU : Ajout de la liste pour le modal
const PROVIDERS = [
  { id: "wave", name: "Wave CI", logo: "/wave.png", color: "bg-blue-50 border-blue-200 text-blue-900", numero: "+225 01 01 59 41 53" },
  { id: "om", name: "Orange Money", logo: "/OM.png", color: "bg-orange-50 border-orange-200 text-orange-900", numero: "+225 07 89 77 07 03" },
  { id: "mtn", name: "MTN MoMo", logo: "/MTN.jpeg", color: "bg-yellow-50 border-yellow-300 text-yellow-900", numero: "+225 05 08 60 90 98" },
  { id: "moov", name: "Moov Money", logo: "/MOOV.png", color: "bg-blue-50 border-blue-300 text-blue-900", numero: "+225 01 01 59 41 53" }
];

export default function PaiementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Modal de recharge
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/connexion'); return; }

      // 1. Charger le vrai profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      setUserProfile(profile);

      // 2. Charger l'historique
      const { data } = await supabase
        .from('paiements')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) setPaiements(data);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const filteredPaiements = paiements.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "recharges") return p.type === "gain" && p.libelle.includes("Recharge");
    if (activeTab === "commissions") return p.type === "depense" && p.libelle.includes("Commission");
    if (activeTab === "depenses") return p.type === "depense";
    return true;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-yamo-teal">Chargement de vos finances...</div>;

  const isChauffeur = userProfile?.role === 'chauffeur';
  const soldeActuel = userProfile?.solde_wallet || 0;

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-12 relative">
      <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-40 flex items-center gap-4 shadow-sm">
        <Link href="/"><ArrowLeft size={24} className="text-gray-600 hover:text-black transition" /></Link>
        <h1 className="text-xl font-black text-yamo-teal">Portefeuille & Historique</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 mt-8">
        
        {/* CARTE DE SOLDE - VUE CHAUFFEUR */}
        {isChauffeur ? (
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl mb-10 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yamo-teal/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 opacity-60 mb-2">
                  <Wallet size={20} />
                  <span className="font-bold uppercase tracking-widest text-xs">Portefeuille Yamoh</span>
                </div>
                <h2 className={`text-5xl font-black ${soldeActuel <= 0 ? 'text-red-400' : 'text-white'}`}>
                  {soldeActuel.toLocaleString()} <span className="text-xl opacity-80">FCFA</span>
                </h2>
                {soldeActuel <= 0 && (
                  <div className="mt-3 bg-red-500/20 text-red-300 text-sm font-bold px-3 py-1.5 rounded-lg inline-flex">
                    ⚠️ Solde insuffisant pour publier des trajets.
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRechargeModal(true)}
                  className="flex-1 md:flex-none bg-yamo-teal text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-yamo-teal/30 hover:bg-[#115566] transition flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft size={20} /> Recharger
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CARTE INFORMATIVE - VUE PASSAGER */
          <div className="bg-yamo-teal rounded-[2.5rem] p-8 text-white shadow-2xl shadow-yamo-teal/20 mb-10 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 opacity-90 mb-4">
                <ShieldCheck size={28} />
                <span className="font-black text-xl">Paiement à bord</span>
              </div>
              <p className="text-lg font-medium opacity-90 leading-relaxed mb-6">
                Chez Yamoh, vous ne payez aucun frais en ligne. Réglez directement votre place au chauffeur via Wave, Orange Money ou en Espèces lors de votre embarquement.
              </p>
            </div>
          </div>
        )}

        {/* FILTRES D'HISTORIQUE */}
        <h3 className="font-black text-xl text-gray-900 mb-4">Historique des transactions</h3>
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setActiveTab("all")} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition ${activeTab === "all" ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>Tout</button>
          
          {isChauffeur ? (
            <>
              <button onClick={() => setActiveTab("recharges")} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition ${activeTab === "recharges" ? 'bg-green-500 text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>Mes Recharges</button>
              <button onClick={() => setActiveTab("commissions")} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition ${activeTab === "commissions" ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>Commissions Yamoh (10%)</button>
            </>
          ) : (
            <button onClick={() => setActiveTab("depenses")} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition ${activeTab === "depenses" ? 'bg-yamo-teal text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>Mes billets achetés</button>
          )}
        </div>

        {/* LISTE DES TRANSACTIONS */}
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
          {filteredPaiements.length === 0 ? (
            <div className="p-12 text-center">
              <History size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold text-lg">Aucune transaction trouvée.</p>
              <p className="text-gray-400 text-sm mt-1">Vos futurs paiements apparaîtront ici.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {filteredPaiements.map((p) => {
                const isGain = p.type === 'gain';
                const isCommission = p.libelle.toLowerCase().includes('commission');
                
                return (
                  <div key={p.id} className="p-6 hover:bg-gray-50 transition flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center flex-shrink-0 ${
                        isGain ? 'bg-green-50 text-green-500' : 
                        isCommission ? 'bg-orange-50 text-orange-500' : 
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {isGain ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-lg leading-tight mb-1">{p.libelle}</p>
                        <p className="text-sm text-gray-400 font-bold">
                          {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-xl font-black ${isGain ? 'text-green-500' : isCommission ? 'text-orange-500' : 'text-gray-900'}`}>
                        {isGain ? '+' : '-'}{p.montant} <span className="text-sm">FCFA</span>
                      </p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">{p.methode}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE RECHARGE (INSTRUCTIONS) --- */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-sm relative animate-in zoom-in duration-200">
            <button onClick={() => setShowRechargeModal(false)} className="absolute top-6 right-6 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition">
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-yamo-teal/10 text-yamo-teal rounded-full flex items-center justify-center mb-6">
              <Phone size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2">Recharger mon compte</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">
              Pour créditer votre portefeuille, effectuez un dépôt sur l'un de ces numéros :
            </p>
            
            {/* LISTE DES NUMÉROS DE PAIEMENT */}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {PROVIDERS.map(p => (
                 <div key={p.id} className={`border p-4 rounded-2xl flex items-center justify-between ${p.color}`}>
                    <div>
                      <p className="font-black opacity-80 text-sm">{p.name}</p>
                      <p className="font-bold text-lg tracking-widest mt-1">{p.numero}</p>
                    </div>
                    <img src={p.logo} alt={p.name} className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-sm" />
                 </div>
              ))}
            </div>

            <Link href="/recharge" className="w-full mt-6">
              <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-xl">
                Lancer la recharge
              </button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}