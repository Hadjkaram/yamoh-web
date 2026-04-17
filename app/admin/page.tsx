"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, ShieldCheck, Users, Map, Wallet, Search, 
  CheckCircle, XCircle, Eye, AlertTriangle, LogOut, Loader2,
  Clock, CheckCircle2, Ban, MoreVertical, Lock, User as UserIcon,
  Activity, TrendingUp, DollarSign, MapPin, Navigation, Car, PlusCircle, Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ERPAdmin() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("kyc");
  const [globalSearch, setGlobalSearch] = useState("");
  
  // --- ÉTATS D'AUTHENTIFICATION ADMIN ---
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // --- ÉTATS DONNÉES ---
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDocs, setUserDocs] = useState<{recto?: string, verso?: string, selfie?: string} | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [liveTrips, setLiveTrips] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  
  const [statsCompta, setStatsCompta] = useState({ volumeGlobal: 0, commissionYamoh: 0, totalBillets: 0, totalWallets: 0 });
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [loadingCompta, setLoadingCompta] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIsAuthorized(false); return; }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role === 'admin') setIsAuthorized(true);
    else setIsAuthorized(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const formattedEmail = adminEmail.includes('@') ? adminEmail : `${adminEmail.replace(/\s+/g, '')}@yamoh.net`;
    const { data, error } = await supabase.auth.signInWithPassword({ email: formattedEmail, password: adminPassword });

    if (error) { alert("Accès refusé : Identifiants incorrects."); setAuthLoading(false); return; }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (profile?.role === 'admin') setIsAuthorized(true);
    else { await supabase.auth.signOut(); alert("Erreur : Ce compte n'a pas les droits d'administration."); }
    setAuthLoading(false);
  };

  useEffect(() => {
    if (isAuthorized) {
      if (activeMenu === "kyc") fetchPendingKYC();
      if (activeMenu === "users") fetchAllUsers();
      if (activeMenu === "live") fetchLiveTrips();
      if (activeMenu === "compta" || activeMenu === "dashboard") fetchCompta();
    }
  }, [activeMenu, isAuthorized]);

  const fetchPendingKYC = async () => {
    setLoadingKyc(true);
    const { data } = await supabase.from('profiles').select('*').eq('verification_status', 'en_attente').order('created_at', { ascending: false });
    if (data) setPendingUsers(data);
    setLoadingKyc(false);
  };

  const loadUserDocuments = async (userId: string) => {
    setLoadingDocs(true);
    const { data: files, error } = await supabase.storage.from('kyc_documents').list(userId);
    if (files && !error) {
      let docs: any = {};
      files.forEach(file => {
        const { data: urlData } = supabase.storage.from('kyc_documents').getPublicUrl(`${userId}/${file.name}`);
        if (file.name.includes('recto')) docs.recto = urlData.publicUrl;
        if (file.name.includes('verso')) docs.verso = urlData.publicUrl;
        if (file.name.includes('selfie')) docs.selfie = urlData.publicUrl;
      });
      setUserDocs(docs);
    } else setUserDocs({});
    setLoadingDocs(false);
  };

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    loadUserDocuments(user.id);
  };

  const handleActionKYC = async (userId: string, action: 'verifie' | 'rejete') => {
    const confirm = window.confirm(`Voulez-vous vraiment ${action === 'verifie' ? 'VALIDER' : 'REJETER'} ce profil ?`);
    if (!confirm) return;

    await supabase.from('profiles').update({ verification_status: action }).eq('id', userId);
    await supabase.from('notifications').insert([{
      user_id: userId, titre: action === 'verifie' ? "Identité Validée ✅" : "Identité Rejetée ❌",
      message: action === 'verifie' ? "Votre compte est vérifié à 100% !" : "Vos documents n'ont pas pu être validés. Recommencez.",
      type: 'systeme'
    }]);
    alert(`Profil ${action === 'verifie' ? 'validé' : 'rejeté'}.`);
    setSelectedUser(null); fetchPendingKYC(); 
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setAllUsers(data);
    setLoadingUsers(false);
  };

  // --- NOUVELLE FONCTION : SUPPRIMER UN UTILISATEUR ---
  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirm = window.confirm(`⚠️ ATTENTION : Voulez-vous vraiment bannir et supprimer les données de ${userName} ? Cette action est irréversible.`);
    if (!confirm) return;

    // Suppression du profil (si la BDD a le "Cascade Delete" activé, ça supprimera aussi ses trajets/réservations)
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      alert(`${userName} a été supprimé de la plateforme avec succès.`);
      fetchAllUsers(); // On met à jour la liste
    }
  };

  const fetchLiveTrips = async () => {
    setLoadingLive(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('trajets').select('*, reservations(*)').gte('date_depart', today).order('date_depart', { ascending: true });
    if (data) setLiveTrips(data);
    setLoadingLive(false);
  };

  const fetchCompta = async () => {
    setLoadingCompta(true);
    const { data: resas } = await supabase.from('reservations').select('places_reservees, statut, trajets(prix)').eq('statut', 'valide');
    let volumeGlobal = 0; let totalBillets = 0;
    if (resas) {
      totalBillets = resas.length;
      resas.forEach((r: any) => { if (r.trajets?.prix) volumeGlobal += (r.places_reservees || 1) * r.trajets.prix; });
    }
    const commissionYamoh = volumeGlobal * 0.10;
    
    const { data: drivers } = await supabase.from('profiles').select('*').eq('role', 'chauffeur').order('solde_wallet', { ascending: false });
    let totalWallets = 0;
    if (drivers) { setChauffeurs(drivers); drivers.forEach(d => { totalWallets += (d.solde_wallet || 0); }); }
    
    setStatsCompta({ volumeGlobal, commissionYamoh, totalBillets, totalWallets });
    setLoadingCompta(false);
  };

  const handleRechargerWallet = async (chauffeur: any) => {
    const montantStr = window.prompt(`Entrez le montant à recharger pour ${chauffeur.full_name} (en FCFA) :`);
    if (!montantStr) return;
    const montant = parseInt(montantStr, 10);
    if (isNaN(montant) || montant <= 0) { alert("Montant invalide."); return; }

    const nouveauSolde = (chauffeur.solde_wallet || 0) + montant;
    const { error } = await supabase.from('profiles').update({ solde_wallet: nouveauSolde }).eq('id', chauffeur.id);
    
    if (error) {
      alert("Erreur lors de la recharge : " + error.message);
    } else {
      await supabase.from('notifications').insert([{
        user_id: chauffeur.id, titre: "Recharge effectuée 💰", message: `Votre portefeuille Yamoh a été crédité de ${montant} FCFA. Nouveau solde : ${nouveauSolde} FCFA.`, type: 'systeme'
      }]);
      alert(`Recharge de ${montant} FCFA effectuée avec succès !`);
      fetchCompta(); 
    }
  };

  if (isAuthorized === null) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-yamo-teal font-black">VÉRIFICATION...</div>;

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-yamo-teal/10 rounded-full flex items-center justify-center text-yamo-teal mb-4"><Lock size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900">Yamoh Admin</h1>
            <p className="text-gray-500 font-medium mt-2">Zone réservée au personnel autorisé</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Identifiant</label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-4 text-gray-400" size={20} />
                <input type="text" placeholder="Numéro ou Email" className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl outline-none focus:border-yamo-teal font-bold" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-gray-400" size={20} />
                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl outline-none focus:border-yamo-teal font-bold" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-yamo-teal text-white font-black py-5 rounded-2xl shadow-xl shadow-yamo-teal/20 hover:bg-[#115566] transition flex justify-center items-center">
              {authLoading ? <Loader2 className="animate-spin" /> : "Déverrouiller l'accès"}
            </button>
          </form>
          <button onClick={() => router.push('/')} className="w-full mt-6 text-gray-400 font-bold hover:text-gray-600 transition">Retour au site</button>
        </div>
      </main>
    );
  }

  const filteredUsers = allUsers.filter(u => u.full_name?.toLowerCase().includes(globalSearch.toLowerCase()) || u.phone?.includes(globalSearch));
  const filteredChauffeurs = chauffeurs.filter(c => c.full_name?.toLowerCase().includes(globalSearch.toLowerCase()) || c.phone?.includes(globalSearch));
  
  const menuTitles: any = {
    dashboard: { title: "Vue d'ensemble", desc: "Statistiques globales de Yamoh." },
    kyc: { title: "Centre de Vérification KYC", desc: "Validez les documents d'identité pour sécuriser la plateforme." },
    live: { title: "Trajets en direct", desc: "Suivez l'activité des covoiturages d'aujourd'hui." },
    users: { title: "Base Utilisateurs", desc: "Gérez tous les membres inscrits sur Yamoh." },
    compta: { title: "Comptabilité & Wallets", desc: "Gérez les recharges des chauffeurs et suivez les revenus." }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black text-yamo-teal tracking-wider">YAMOH<span className="text-white text-sm ml-2 font-medium">ERP</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuBtn icon={<LayoutDashboard size={20}/>} label="Vue d'ensemble" active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} />
          <MenuBtn icon={<ShieldCheck size={20}/>} label="Vérifications (KYC)" badge={pendingUsers.length > 0 ? pendingUsers.length : undefined} active={activeMenu === "kyc"} onClick={() => setActiveMenu("kyc")} />
          <MenuBtn icon={<Map size={20}/>} label="Trajets en direct" active={activeMenu === "live"} onClick={() => setActiveMenu("live")} />
          <MenuBtn icon={<Users size={20}/>} label="Utilisateurs" active={activeMenu === "users"} onClick={() => setActiveMenu("users")} />
          <MenuBtn icon={<Wallet size={20}/>} label="Comptabilité" active={activeMenu === "compta"} onClick={() => setActiveMenu("compta")} />
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={async () => { await supabase.auth.signOut(); setIsAuthorized(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition">
            <LogOut size={20} /> Déconnexion Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900">{menuTitles[activeMenu]?.title}</h2>
            <p className="text-gray-500 font-medium mt-1">{menuTitles[activeMenu]?.desc}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="text" placeholder="Rechercher..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm outline-none focus:border-yamo-teal w-72 transition-all focus:w-96" />
          </div>
        </header>

        {activeMenu === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
             <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="bg-yamo-teal/10 p-5 rounded-full text-yamo-teal"><Users size={32}/></div>
                <div><p className="text-gray-500 font-bold uppercase text-xs">Total Utilisateurs</p><p className="text-3xl font-black">{allUsers.length}</p></div>
             </div>
             <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="bg-yamo-orange/10 p-5 rounded-full text-yamo-orange"><CheckCircle2 size={32}/></div>
                <div><p className="text-gray-500 font-bold uppercase text-xs">Billets Scannés</p><p className="text-3xl font-black">{statsCompta.totalBillets}</p></div>
             </div>
             <div className="bg-gray-900 p-8 rounded-[2rem] shadow-xl text-white flex items-center gap-6">
                <div className="bg-white/10 p-5 rounded-full text-white"><TrendingUp size={32}/></div>
                <div><p className="text-gray-400 font-bold uppercase text-xs">Revenu Yamoh</p><p className="text-3xl font-black">{statsCompta.commissionYamoh.toLocaleString()} F</p></div>
             </div>
          </div>
        )}

        {activeMenu === "kyc" && (
           loadingKyc ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
           pendingUsers.length === 0 ? (
            <div className="bg-white p-16 rounded-[2rem] text-center border border-gray-100 shadow-sm">
              <ShieldCheck size={64} className="mx-auto text-green-500 mb-4 opacity-50" />
              <h3 className="text-2xl font-black">Tout est propre !</h3><p className="text-gray-500">Aucun profil en attente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#E8F4F8] text-yamo-teal font-black text-xl rounded-full flex items-center justify-center">{user.full_name?.charAt(0).toUpperCase()}</div>
                    <div><h4 className="font-black text-lg leading-tight">{user.full_name}</h4><p className="text-xs font-bold text-gray-400 uppercase">{user.role}</p></div>
                  </div>
                  <div className="bg-orange-50 text-orange-600 px-4 py-3 rounded-xl text-sm font-bold flex justify-between mb-6"><span>Doc : {user.kyc_doc_type?.toUpperCase() || '?'}</span><AlertTriangle size={16} /></div>
                  <button onClick={() => openUserModal(user)} className="mt-auto w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition flex justify-center gap-2"><Eye size={18} /> Examiner</button>
                </div>
              ))}
            </div>
          )
        )}

        {activeMenu === "live" && (
           loadingLive ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
           liveTrips.length === 0 ? (
             <div className="bg-white p-16 rounded-[2rem] text-center border border-gray-100 shadow-sm">
                <Car size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-black">Aucun trajet aujourd'hui</h3><p className="text-gray-500">C'est calme sur la route.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
               {liveTrips.map(trip => {
                 const resas = trip.reservations || [];
                 const totalPrises = resas.reduce((acc: number, curr: any) => acc + (curr.places_reservees || 1), 0);
                 const isFull = totalPrises >= (trip.places_disponibles + totalPrises);
                 
                 return (
                   <div key={trip.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start mb-4">
                       <div>
                         <span className="bg-yamo-teal/10 text-yamo-teal text-xs font-black px-3 py-1 rounded-full uppercase">Aujourd'hui • {trip.heure_depart?.substring(0,5)}</span>
                         <h4 className="font-black text-xl mt-3 flex items-center gap-2"><MapPin size={20} className="text-yamo-orange"/> {trip.depart.split(',')[0]}</h4>
                         <h4 className="font-black text-xl text-gray-400 flex items-center gap-2"><Navigation size={20}/> {trip.destination.split(',')[0]}</h4>
                       </div>
                       <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 ${isFull ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
                         <span className="font-black text-xl leading-none">{totalPrises}</span>
                         <span className="text-[10px] font-bold">/ {trip.places_disponibles + totalPrises}</span>
                       </div>
                     </div>
                     <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">{trip.conducteur_nom?.charAt(0)}</div>
                         <p className="font-bold text-gray-800 text-sm">{trip.conducteur_nom}</p>
                       </div>
                       <p className="font-black text-yamo-teal">{trip.prix} F</p>
                     </div>
                   </div>
                 );
               })}
             </div>
           )
        )}

        {/* --- MODULE 4: UTILISATEURS (MISE À JOUR AVEC SUPPRESSION) --- */}
        {activeMenu === "users" && (
           loadingUsers ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
           <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-black">
                    <th className="p-6">Utilisateur</th><th className="p-6">Rôle</th><th className="p-6">Contact</th><th className="p-6">Statut KYC</th><th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-6 flex items-center gap-4">
                        <div className="w-10 h-10 bg-yamo-teal/10 text-yamo-teal font-black rounded-full flex items-center justify-center">{u.full_name?.charAt(0) || '?'}</div>
                        <div><p className="font-bold">{u.full_name}</p><p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p></div>
                      </td>
                      <td className="p-6"><span className={`px-3 py-1 text-xs font-black uppercase rounded-lg ${u.role === 'chauffeur' ? 'bg-yamo-orange/10 text-yamo-orange' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                      <td className="p-6 font-medium text-sm">{u.phone}</td>
                      <td className="p-6">
                        {u.verification_status === 'verifie' ? <span className="text-green-600 font-bold text-sm flex gap-1"><CheckCircle2 size={16}/> Vérifié</span> :
                         u.verification_status === 'en_attente' ? <span className="text-orange-500 font-bold text-sm flex gap-1"><Clock size={16}/> Attente</span> :
                         <span className="text-gray-400 font-bold text-sm flex gap-1"><ShieldCheck size={16}/> Non initié</span>}
                      </td>
                      <td className="p-6 text-right">
                        {/* BOUTON DE SUPPRESSION AJOUTÉ ICI */}
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition" 
                          title="Bannir et Supprimer"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        )}

        {activeMenu === "compta" && (
           loadingCompta ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
           <div className="space-y-8 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                 <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4"><Activity size={24}/></div>
                 <p className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Volume global (Brut)</p>
                 <p className="text-3xl font-black text-gray-900">{statsCompta.volumeGlobal.toLocaleString()} <span className="text-lg">FCFA</span></p>
               </div>
               <div className="bg-gray-900 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
                 <div className="w-12 h-12 bg-white/10 text-yamo-teal rounded-full flex items-center justify-center mb-4"><TrendingUp size={24}/></div>
                 <p className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-1">Chiffre d'Affaires Yamoh (10%)</p>
                 <p className="text-4xl font-black text-yamo-teal">{statsCompta.commissionYamoh.toLocaleString()} <span className="text-lg text-white">FCFA</span></p>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                 <div className="w-12 h-12 bg-yamo-orange/10 text-yamo-orange rounded-full flex items-center justify-center mb-4"><Wallet size={24}/></div>
                 <p className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Total Soldes Chauffeurs</p>
                 <p className="text-3xl font-black text-gray-900">{statsCompta.totalWallets.toLocaleString()} <span className="text-lg">FCFA</span></p>
               </div>
             </div>

             <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100"><h3 className="text-xl font-black text-gray-900">Portefeuilles Chauffeurs</h3><p className="text-gray-500 text-sm mt-1">Rechargez les comptes suite aux paiements Mobile Money.</p></div>
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-black"><th className="p-6">Chauffeur</th><th className="p-6">Contact</th><th className="p-6">Solde Wallet</th><th className="p-6 text-right">Action</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredChauffeurs.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-6 flex items-center gap-4"><div className="w-10 h-10 bg-gray-100 font-black rounded-full flex items-center justify-center text-gray-700">{c.full_name?.charAt(0) || '?'}</div><p className="font-bold">{c.full_name}</p></td>
                        <td className="p-6 font-medium text-sm text-gray-600">{c.phone}</td>
                        <td className="p-6"><span className={`font-black text-lg ${c.solde_wallet > 0 ? 'text-green-600' : 'text-red-500'}`}>{c.solde_wallet || 0} FCFA</span></td>
                        <td className="p-6 text-right"><button onClick={() => handleRechargerWallet(c)} className="bg-yamo-teal/10 text-yamo-teal hover:bg-yamo-teal hover:text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 ml-auto"><PlusCircle size={16}/> Recharger</button></td>
                      </tr>
                    ))}
                    {filteredChauffeurs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold">Aucun chauffeur trouvé.</td></tr>}
                  </tbody>
               </table>
             </div>
           </div>
        )}
      </main>

      {/* --- MODAL KYC --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <header className="px-8 py-6 border-b border-gray-100 flex justify-between bg-gray-50">
              <div><h3 className="text-2xl font-black text-gray-900">Examen : {selectedUser.full_name}</h3><p className="text-gray-500 font-medium">Type : {selectedUser.kyc_doc_type?.toUpperCase()}</p></div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><XCircle size={24}/></button>
            </header>
            <div className="p-8 overflow-y-auto flex-1 bg-gray-100">
              {loadingDocs ? <div className="text-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin mx-auto mb-4" /><p className="font-bold">Extraction...</p></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><h4 className="font-black text-gray-700 uppercase text-sm">Recto</h4>{userDocs?.recto ? <img src={userDocs.recto} className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-md" /> : <div className="w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center">Manquant</div>}</div>
                  <div className="space-y-2"><h4 className="font-black text-gray-700 uppercase text-sm">Selfie</h4>{userDocs?.selfie ? <img src={userDocs.selfie} className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-md" /> : <div className="w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center">Manquant</div>}</div>
                  {userDocs?.verso && <div className="space-y-2 md:col-span-2"><h4 className="font-black text-gray-700 uppercase text-sm">Verso</h4><img src={userDocs.verso} className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-md md:w-1/2" /></div>}
                </div>
              }
            </div>
            <footer className="p-6 bg-white border-t border-gray-100 flex gap-4 justify-end">
              <button onClick={() => handleActionKYC(selectedUser.id, 'rejete')} className="px-8 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 flex items-center gap-2"><XCircle size={20} /> Rejeter</button>
              <button onClick={() => handleActionKYC(selectedUser.id, 'verifie')} className="px-8 py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 shadow-lg flex items-center gap-2"><CheckCircle size={20} /> Approuver</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuBtn({ icon, label, active, badge, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-yamo-teal text-white shadow-lg shadow-yamo-teal/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
      <div className="flex items-center gap-3 font-bold">{icon} <span>{label}</span></div>
      {badge !== undefined && badge > 0 && <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}