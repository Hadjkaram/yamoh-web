"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, CheckCircle2, Loader2, ShieldCheck, History } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const AMOUNTS = [500, 1000, 2000, 5000];

const PROVIDERS = [
  { id: "wave", name: "Wave", logo: "/wave.png", color: "bg-blue-50 border-blue-500" },
  { id: "om", name: "Orange Money", logo: "/OM.png", color: "bg-orange-50 border-orange-500" },
  { id: "mtn", name: "MTN Mobile Money", logo: "/MTN.jpeg", color: "bg-yellow-50 border-yellow-400" },
  { id: "moov", name: "Moov Money", logo: "/MOOV.png", color: "bg-blue-50 border-blue-600" }
];

export default function RechargePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [soldeActuel, setSoldeActuel] = useState<number>(0);
  
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [provider, setProvider] = useState<string>("wave");
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/connexion'); return; }
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('solde_wallet')
        .eq('id', session.user.id)
        .single();
        
      if (profile) setSoldeActuel(profile.solde_wallet || 0);
      setLoading(false);
    }
    fetchData();
  }, [router]);

  const handleAmountClick = (val: number) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setAmount(parseInt(e.target.value) || 0);
  };

  // --- SIMULATEUR DE PAIEMENT (EN ATTENDANT LUNDI) ---
  const handlePayment = async () => {
    if (amount < 100) {
      alert("Le montant minimum de recharge est de 100 FCFA.");
      return;
    }

    setProcessing(true);

    // 1. Simulation du temps d'attente de l'API (Wave/OM...)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // 2. Mise à jour du solde dans la base de données
      const nouveauSolde = soldeActuel + amount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ solde_wallet: nouveauSolde })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. Historique de la transaction
      await supabase.from('paiements').insert([{
        user_id: user.id,
        montant: amount,
        type: 'gain', // C'est une entrée d'argent sur le wallet
        methode: PROVIDERS.find(p => p.id === provider)?.name || 'Mobile Money',
        libelle: `Recharge Wallet via ${PROVIDERS.find(p => p.id === provider)?.name}`
      }]);

      // 4. Succès et redirection
      setSuccess(true);
      setTimeout(() => {
        router.push('/publier'); // Ramène direct à la publication !
      }, 2500);

    } catch (error) {
      alert("Erreur lors de la recharge. Veuillez réessayer.");
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-yamo-teal">Chargement...</div>;

  if (success) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={50} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Recharge réussie !</h1>
        <p className="text-gray-500 text-lg mb-8">Votre solde a été mis à jour de +{amount.toLocaleString()} FCFA.</p>
        <div className="flex items-center gap-2 text-yamo-teal font-bold animate-pulse">
          <Loader2 className="animate-spin" size={20} /> Retour au formulaire...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-20">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-black transition"><ArrowLeft size={24} /></button>
          <h1 className="text-xl font-bold text-yamo-teal">Recharger mon compte</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        
        {/* SOLDE ACTUEL */}
        <div className="bg-yamo-teal p-8 rounded-[2.5rem] text-white shadow-xl shadow-yamo-teal/20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex items-center gap-3 mb-2 opacity-90">
            <Wallet size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Solde actuel</h2>
          </div>
          <p className="text-5xl font-black">{soldeActuel.toLocaleString()} <span className="text-2xl opacity-80 font-bold">FCFA</span></p>
        </div>

        {/* MONTANT À RECHARGER */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-6">
          <h3 className="font-black text-gray-900 mb-4 text-lg">Sélectionnez un montant</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {AMOUNTS.map((val) => (
              <button 
                key={val} 
                onClick={() => handleAmountClick(val)}
                className={`py-4 rounded-2xl font-black text-lg transition-all border-2 ${amount === val && customAmount === "" ? 'bg-yamo-teal border-yamo-teal text-white shadow-md scale-[1.02]' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}
              >
                {val.toLocaleString()} F
              </button>
            ))}
          </div>

          <div className="relative mt-4">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Autre :</span>
            <input 
              type="number" 
              placeholder="Ex: 1500" 
              value={customAmount}
              onChange={handleCustomAmountChange}
              className="w-full bg-gray-50 border-2 border-gray-100 py-4 pl-20 pr-4 rounded-2xl outline-none focus:border-yamo-teal font-black text-xl text-gray-900 transition-colors"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">FCFA</span>
          </div>
        </div>

        {/* MOYEN DE PAIEMENT */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8">
          <h3 className="font-black text-gray-900 mb-4 text-lg flex items-center gap-2">
            Moyen de paiement <ShieldCheck size={18} className="text-green-500" />
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {PROVIDERS.map((p) => (
              <button 
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${provider === p.id ? p.color + ' shadow-md scale-105' : 'border-gray-100 bg-gray-50 opacity-60 hover:opacity-100'}`}
              >
                <div className="w-16 h-16 relative rounded-xl overflow-hidden mb-2 bg-white shadow-sm">
                  <Image src={p.logo} alt={p.name} fill className="object-contain p-1" />
                </div>
                <span className={`font-bold text-xs text-center ${provider === p.id ? 'text-gray-900' : 'text-gray-500'}`}>{p.name}</span>
                {provider === p.id && (
                  <div className="absolute -top-2 -right-2 bg-yamo-teal text-white rounded-full p-1 shadow-sm">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* BOUTON PAYER */}
        {processing ? (
          <div className="w-full bg-gray-100 text-gray-500 font-black text-xl py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-yamo-teal" size={32} />
            <span className="text-sm">Connexion à {PROVIDERS.find(p => p.id === provider)?.name}...</span>
          </div>
        ) : (
          <button 
            onClick={handlePayment}
            disabled={amount < 100}
            className="w-full bg-yamo-orange text-white font-black text-xl py-6 rounded-[2rem] shadow-xl shadow-yamo-orange/20 hover:bg-[#D55A1A] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
          >
            Payer {amount > 0 ? amount.toLocaleString() : 0} FCFA
          </button>
        )}
        
        <p className="text-center text-xs text-gray-400 font-bold mt-6 flex items-center justify-center gap-1">
          <ShieldCheck size={14} /> Paiement sécurisé et crypté
        </p>

      </div>
    </main>
  );
}