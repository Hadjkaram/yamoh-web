"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Phone, MessageSquare, Music, Save, 
  Camera, ChevronRight, Star, ShieldCheck, Mail, Coins, 
  Lock, MapPin, Cigarette, Dog, Info, Award, Car
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ProfilPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Données utilisateur dynamiques
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [prefs, setPrefs] = useState({ music: true, chat: true, smoke: false, pets: false });
  
  // Statistiques réelles
  const [stats, setStats] = useState({ solde: 0, trajetsCount: 0 });

  useEffect(() => {
    async function loadFullProfil() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/connexion'); return; }
      setUser(session.user);

      // 1. Récupérer les infos du profil
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setBio(profile.bio || "");
        if (profile.preferences) setPrefs(profile.preferences);
      }

      // 2. Récupérer le solde réel (Somme des gains - Somme des dépenses)
      const { data: paiements } = await supabase.from('paiements').select('montant, type').eq('user_id', session.user.id);
      const totalSolde = paiements?.reduce((acc, curr) => curr.type === 'gain' ? acc + curr.montant : acc - curr.montant, 0) || 0;

      // 3. Récupérer le nombre de trajets publiés
      const { count } = await supabase.from('trajets').select('*', { count: 'exact', head: true }).eq('conducteur_nom', profile?.full_name);

      setStats({ solde: totalSolde, trajetsCount: count || 0 });
      setLoading(false);
    }
    loadFullProfil();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, phone: phone, bio: bio, preferences: prefs
    }).eq('id', user?.id);
    setSaving(false);
    if (!error) alert("Profil mis à jour en temps réel !");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-yamo-teal">Connexion à Supabase...</div>;

  return (
    <main className="min-h-screen bg-white font-sans">
      <header className="px-6 py-6 bg-white border-b border-gray-50 sticky top-0 z-50 flex items-center gap-4">
        <Link href="/"><ArrowLeft size={24} className="text-gray-900" /></Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-black text-gray-900 mb-10">Profil</h1>

        <div className="flex gap-10 border-b border-gray-100 mb-12">
          <button onClick={() => setActiveTab("about")} className={`pb-4 text-lg font-bold transition-all ${activeTab === "about" ? "border-b-4 border-yamo-teal text-yamo-teal" : "text-gray-400 hover:text-gray-600"}`}>À propos de vous</button>
          <button onClick={() => setActiveTab("account")} className={`pb-4 text-lg font-bold transition-all ${activeTab === "account" ? "border-b-4 border-yamo-teal text-yamo-teal" : "text-gray-400 hover:text-gray-600"}`}>Compte</button>
        </div>

        {activeTab === "about" ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-black text-yamo-teal border-4 border-white shadow-xl">
                    {fullName?.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-yamo-teal p-2 rounded-full text-white border-2 border-white shadow-lg"><Camera size={16} /></button>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{fullName}</h2>
                  <p className="text-gray-500 font-medium flex items-center gap-1"><Award size={16} className="text-blue-500" /> Ambassadeur</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" />
            </div>

            {/* STATISTIQUES RÉELLES CONNECTÉES */}
            <div className="grid grid-cols-2 gap-4">
               <Link href="/paiements" className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center gap-2 hover:bg-gray-100 transition">
                 <Coins className="text-yamo-teal" />
                 <p className="text-xl font-black">{stats.solde.toLocaleString()} FCFA</p>
                 <p className="text-xs font-bold text-gray-400 uppercase text-center">Argent économisé</p>
               </Link>
               <Link href="/dashboard" className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center gap-2 hover:bg-gray-100 transition">
                 <Car className="text-yamo-teal" />
                 <p className="text-xl font-black">{stats.trajetsCount}</p>
                 <p className="text-xs font-bold text-gray-400 uppercase text-center">Trajets publiés</p>
               </Link>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Vérifications</h3>
              <div className="space-y-4">
                <Link href="/verif-identite">
                    <VerificationItem icon={<ShieldCheck size={18}/>} title="Vérifier une pièce d'identité" checked={false} />
                </Link>
                <VerificationItem icon={<Mail size={18}/>} title="Adresse e-mail vérifiée" checked={!!user?.email_confirmed_at} />
                <VerificationItem icon={<Phone size={18}/>} title="Numéro de téléphone vérifié" checked={!!phone} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">À propos de vous</h3>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-gray-700">Ma minibio</label>
                <textarea 
                  rows={3} 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal font-medium" 
                />
              </div>
              <div className="space-y-4">
                <div onClick={() => setPrefs({...prefs, chat: !prefs.chat})} className="cursor-pointer">
                    <PreferenceToggle icon={<MessageSquare size={18}/>} title="Je suis un vrai moulin à paroles !" active={prefs.chat} />
                </div>
                <div onClick={() => setPrefs({...prefs, music: !prefs.music})} className="cursor-pointer">
                    <PreferenceToggle icon={<Music size={18}/>} title="Musique tout le long !" active={prefs.music} />
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full bg-yamo-teal text-white font-black py-5 rounded-[2rem] shadow-xl shadow-yamo-teal/20 transition">
              {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
            </button>
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-gray-50 animate-in fade-in slide-in-from-right-4">
            <Link href="/avis"><AccountItem icon={<Star />} title="Avis" /></Link>
            <Link href="/vehicules"><AccountItem icon={<Car />} title="Mes véhicules" /></Link>
            <Link href="/messages"><AccountItem icon={<MessageSquare />} title="Mes messages" /></Link>
            <AccountItem icon={<Lock />} title="Mot de passe" />
            <Link href="/paiements"><AccountItem icon={<Coins />} title="Paiements et remboursements" /></Link>
            <button onClick={handleLogout} className="w-full text-left py-6 text-red-600 font-bold flex items-center justify-between group">
              <span>Déconnexion</span>
              <ChevronRight className="text-gray-200 group-hover:text-red-600 transition" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function VerificationItem({ icon, title, checked }: { icon: any, title: string, checked: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded-xl transition px-2">
      <div className="flex items-center gap-3 text-gray-700 font-medium">
        {checked ? <ShieldCheck size={18} className="text-green-500" /> : <div className="text-yamo-teal">{icon}</div>}
        <span className={checked ? 'text-gray-900 font-bold' : 'text-yamo-teal font-bold'}>{title}</span>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </div>
  );
}

function PreferenceToggle({ icon, title, active }: { icon: any, title: string, active: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition ${active ? 'border-yamo-teal bg-yamo-teal/5' : 'border-gray-50'}`}>
      <div className="flex items-center gap-4">
        <div className={active ? "text-yamo-teal" : "text-gray-400"}>{icon}</div>
        <p className={`font-bold ${active ? "text-gray-900" : "text-gray-400"}`}>{title}</p>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-yamo-teal' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
      </div>
    </div>
  );
}

function AccountItem({ icon, title }: { icon: any, title: string }) {
  return (
    <div className="py-6 flex items-center justify-between group cursor-pointer hover:pl-2 transition-all">
      <div className="flex items-center gap-4 text-gray-700">
        <div className="text-gray-300 group-hover:text-yamo-teal transition">{icon}</div>
        <span className="font-bold text-gray-800">{title}</span>
      </div>
      <ChevronRight className="text-gray-300 group-hover:text-yamo-teal" />
    </div>
  );
}