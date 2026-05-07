"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, ShieldCheck, Users, Map, Wallet, Search, 
  CheckCircle, XCircle, Eye, AlertTriangle, LogOut, Loader2,
  Clock, CheckCircle2, Ban, Lock, User as UserIcon,
  Activity, TrendingUp, MapPin, Navigation, Car, PlusCircle, Trash2,
  Menu, X, Receipt, Phone, AlertOctagon, Crosshair, History, Download, BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ERPAdmin() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("live");
  const [globalSearch, setGlobalSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  const [dbError, setDbError] = useState<string | null>(null);

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDocs, setUserDocs] = useState<{recto?: string, verso?: string, selfie?: string, permis?: string, cartegrise?: string} | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [liveTrips, setLiveTrips] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  
  const [statsCompta, setStatsCompta] = useState({ volumeGlobal: 0, commissionYamoh: 0, totalBillets: 0, totalWallets: 0 });
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [loadingCompta, setLoadingCompta] = useState(true);

  const [transactionsHistory, setTransactionsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [alertes, setAlertes] = useState<any[]>([]);

  const [inspectUser, setInspectUser] = useState<any>(null);
  const [inspectUserHistory, setInspectUserHistory] = useState<any[]>([]);

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
      setDbError(null);
      if (activeMenu === "kyc") fetchPendingKYC();
      if (activeMenu === "users") fetchAllUsers();
      if (activeMenu === "live") fetchLiveTrips();
      if (activeMenu === "compta" || activeMenu === "dashboard") fetchCompta();
      if (activeMenu === "history") fetchTransactionsHistory();
      if (activeMenu === "alertes") fetchAlertes();
    }
  }, [activeMenu, isAuthorized]);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (typeof val === 'object' ? JSON.stringify(val) : val)).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const fetchAlertes = async () => {
    const { data } = await supabase.from('alertes').select('*').order('created_at', { ascending: false });
    setAlertes(data || []);
  };

  const fetchPendingKYC = async () => {
    setLoadingKyc(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('verification_status', 'en_attente');
    if (error) setDbError(`Erreur KYC : ${error.message}`);
    if (data) setPendingUsers(data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
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
        if (file.name.includes('permis')) docs.permis = urlData.publicUrl;
        if (file.name.includes('cartegrise')) docs.cartegrise = urlData.publicUrl;
      });
      setUserDocs(docs);
    } else setUserDocs({});
    setLoadingDocs(false);
  };

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    loadUserDocuments(user.id);
  };

  const openInspectUser = async (user: any) => {
    setInspectUser(user);
    setLoadingDocs(true);
    await loadUserDocuments(user.id);
    const { data: trajets } = await supabase.from('trajets').select('*').eq('user_id', user.id).order('date_depart', { ascending: false });
    setInspectUserHistory(trajets || []);
    setLoadingDocs(false);
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
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) setDbError(`Erreur Utilisateurs : ${error.message}`);
    if (data) setAllUsers(data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
    setLoadingUsers(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirm = window.confirm(`⚠️ ATTENTION : Voulez-vous vraiment supprimer ${userName || "cet utilisateur"} ?`);
    if (!confirm) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) alert("Erreur : " + error.message);
    else { alert("Utilisateur supprimé."); fetchAllUsers(); }
  };

  const fetchLiveTrips = async () => {
    setLoadingLive(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('trajets').select('*, reservations(*)').gte('date_depart', today);
    if (error) setDbError(`Erreur Trajets : ${error.message}`);
    if (data) setLiveTrips(data.sort((a, b) => new Date(a.date_depart || 0).getTime() - new Date(b.date_depart || 0).getTime()));
    setLoadingLive(false);
  };

  const openGPS = (lat?: number, lng?: number) => {
    if (lat && lng) window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    else alert("Position GPS non disponible.");
  };

  const fetchCompta = async () => {
    setLoadingCompta(true);
    const { data: resas, error: resaError } = await supabase.from('reservations').select('places_reservees, statut, trajets(prix)').eq('statut', 'valide');
    if (resaError) setDbError(`Erreur Compta Resa: ${resaError.message}`);

    let volumeGlobal = 0; let totalBillets = 0;
    if (resas) {
      totalBillets = resas.length;
      resas.forEach((r: any) => { 
        const trajetPrix = Array.isArray(r.trajets) ? r.trajets[0]?.prix : r.trajets?.prix;
        if (trajetPrix) volumeGlobal += (r.places_reservees || 1) * trajetPrix; 
      });
    }
    const commissionYamoh = volumeGlobal * 0.10;
    
    const { data: drivers, error: driversError } = await supabase.from('profiles').select('*').eq('role', 'chauffeur');
    if (driversError) setDbError(`Erreur Compta Chauffeurs: ${driversError.message}`);

    let totalWallets = 0;
    if (drivers) { 
      const sortedDrivers = drivers.sort((a, b) => (b.solde_wallet || 0) - (a.solde_wallet || 0));
      setChauffeurs(sortedDrivers); 
      sortedDrivers.forEach(d => { totalWallets += (d.solde_wallet || 0); }); 
    }
    
    setStatsCompta({ volumeGlobal, commissionYamoh, totalBillets, totalWallets });
    setLoadingCompta(false);
  };

  const handleRechargerWallet = async (chauffeur: any) => {
    const montantStr = window.prompt(`Entrez le montant en ESPÈCES reçu de ${chauffeur.full_name} (en FCFA) :`);
    if (!montantStr) return;
    const montant = parseInt(montantStr, 10);
    if (isNaN(montant) || montant <= 0) { alert("Montant invalide."); return; }

    const nouveauSolde = (chauffeur.solde_wallet || 0) + montant;
    const { error } = await supabase.from('profiles').update({ solde_wallet: nouveauSolde }).eq('id', chauffeur.id);
    
    if (error) {
      alert("Erreur lors de la recharge : " + error.message);
    } else {
      await supabase.from('paiements').insert([{
        user_id: chauffeur.id, montant: montant, type: 'gain', methode: 'Espèces / Manuel', libelle: 'Recharge en agence', status: 'completed'
      }]);
      await supabase.from('notifications').insert([{
        user_id: chauffeur.id, titre: "Recharge Espèces 💰", message: `Votre portefeuille Yamoh a été crédité manuellement de ${montant} FCFA.`, type: 'systeme'
      }]);
      alert(`Recharge effectuée !`);
      fetchCompta(); 
    }
  };

  const fetchTransactionsHistory = async () => {
    setLoadingHistory(true);
    const { data: historyData, error: payError } = await supabase.from('paiements').select('*').order('created_at', { ascending: false }).limit(100);
    if (payError) { setDbError(`Erreur Historique : ${payError.message}`); setLoadingHistory(false); return; }
    if (historyData && historyData.length > 0) {
      const { data: profilesData } = await supabase.from('profiles').select('id, full_name, phone');
      const combined = historyData.map(transaction => {
        const profile = profilesData?.find(p => p.id === transaction.user_id);
        return { ...transaction, profiles: profile || {} };
      });
      setTransactionsHistory(combined);
    } else { setTransactionsHistory([]); }
    setLoadingHistory(false);
  };

  if (isAuthorized === null) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-[#166C82] font-black">VÉRIFICATION...</div>;

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-[#166C82]/10 rounded-full flex items-center justify-center text-[#166C82] mb-4"><Lock size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900">Yamoh Admin</h1>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="text" placeholder="Identifiant" className="w-full bg-gray-50 border p-4 rounded-2xl outline-none" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
            <input type="password" placeholder="Mot de passe" className="w-full bg-gray-50 border p-4 rounded-2xl outline-none" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
            <button type="submit" disabled={authLoading} className="w-full bg-[#166C82] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-[#115566] transition">
              {authLoading ? <Loader2 className="animate-spin mx-auto" /> : "Déverrouiller l'accès"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const filteredUsers = allUsers.filter(u => {
    if (!globalSearch) return true;
    const s = globalSearch.toLowerCase();
    return (u.full_name || "").toLowerCase().includes(s) || (u.phone || "").includes(globalSearch);
  });

  const filteredChauffeurs = chauffeurs.filter(c => {
    if (!globalSearch) return true;
    const s = globalSearch.toLowerCase();
    return (c.full_name || "").toLowerCase().includes(s) || (c.phone || "").includes(globalSearch);
  });
  
  const menuTitles: any = {
    live: { title: "Tour de Contrôle GPS", desc: "Suivi en temps réel des véhicules." },
    alertes: { title: "Urgences & SOS", desc: "Signalements des incidents." },
    history: { title: "Historique Transactions", desc: "Suivi GeniusPay et dépôts espèces." },
    kyc: { title: "Vérifications KYC", desc: "Validation des documents officiels." },
    users: { title: "Base Utilisateurs", desc: "Gestion des membres Yamoh." },
    compta: { title: "Dépôts Espèces", desc: "Recharges manuelles en agence." },
    dashboard: { title: "Statistiques", desc: "Performances globales." }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-gray-900 text-white flex flex-col z-50 transform transition-transform duration-300 md:translate-x-0 md:relative md:w-64 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#166C82]">YAMOH ERP</h2>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400"><X size={24} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuBtn icon={<Map size={20}/>} label="Live GPS" active={activeMenu === "live"} onClick={() => setActiveMenu("live")} />
          <MenuBtn icon={<AlertOctagon size={20}/>} label="Urgences SOS" badge={alertes.length} active={activeMenu === "alertes"} onClick={() => setActiveMenu("alertes")} isAlert={true}/>
          <div className="my-4 border-t border-gray-800"></div>
          <MenuBtn icon={<History size={20}/>} label="Transactions" active={activeMenu === "history"} onClick={() => setActiveMenu("history")} />
          <MenuBtn icon={<ShieldCheck size={20}/>} label="KYC" badge={pendingUsers.length} active={activeMenu === "kyc"} onClick={() => setActiveMenu("kyc")} />
          <MenuBtn icon={<Users size={20}/>} label="Utilisateurs" active={activeMenu === "users"} onClick={() => setActiveMenu("users")} />
          <MenuBtn icon={<Wallet size={20}/>} label="Dépôts Cash" active={activeMenu === "compta"} onClick={() => setActiveMenu("compta")} />
          <MenuBtn icon={<BarChart3 size={20}/>} label="Statistiques" active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} />
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={async () => { await supabase.auth.signOut(); setIsAuthorized(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"><LogOut size={20} /> Déconnexion</button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 bg-white border-b sticky top-0 z-30 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-100 rounded-xl md:hidden"><Menu size={24} /></button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{menuTitles[activeMenu]?.title}</h2>
              <p className="text-gray-500 font-medium text-xs md:text-sm">{menuTitles[activeMenu]?.desc}</p>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="text" placeholder="Rechercher..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="pl-12 pr-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:border-[#166C82] w-full font-bold" />
          </div>
        </header>

        <div className="p-4 md:p-8">
          {dbError && <div className="bg-red-50 text-red-600 p-4 rounded-2xl border-2 border-red-200 font-bold mb-6 flex items-center gap-3"><AlertTriangle size={24} /> {dbError}</div>}

          {activeMenu === "live" && (
             loadingLive ? <div className="flex justify-center py-20 text-[#166C82]"><Loader2 size={40} className="animate-spin" /></div> :
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
               {liveTrips.map(trip => (
                 <div key={trip.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border ${trip.statut_course === 'en_cours' ? 'border-green-500 ring-4 ring-green-50' : 'border-gray-200'}`}>
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <span className="text-gray-500 text-xs font-black">{trip.heure_depart?.substring(0,5)}</span>
                       <h4 className="font-black text-lg flex items-center gap-2"><MapPin size={18} className="text-orange-500"/> {trip.depart?.split(',')[0]}</h4>
                       <h4 className="font-black text-lg text-gray-400 flex items-center gap-2"><Navigation size={18}/> {trip.destination?.split(',')[0]}</h4>
                     </div>
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black text-white ${trip.statut_course === 'en_cours' ? 'bg-green-500' : 'bg-gray-400'}`}>{trip.statut_course?.toUpperCase()}</span>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center mb-4">
                     <p className="font-bold">{trip.conducteur_nom}</p>
                     <p className="font-black text-[#166C82]">{trip.reservations?.length} Passagers</p>
                   </div>
                   <button onClick={() => openGPS(trip.lat, trip.lng)} disabled={!trip.lat} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                     <Crosshair size={18} /> {trip.lat ? "Suivi en direct" : "GPS Inactif"}
                   </button>
                 </div>
               ))}
             </div>
          )}

          {activeMenu === "history" && (
             loadingHistory ? <div className="flex justify-center py-20 text-[#166C82]"><Loader2 size={40} className="animate-spin" /></div> :
             <div className="space-y-6">
                <div className="flex justify-end"><button onClick={() => exportToCSV(transactionsHistory, "Transactions")} className="bg-gray-900 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2"><Download size={18}/> Export CSV</button></div>
                <div className="bg-white rounded-[2rem] border overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500 border-b">
                      <tr><th className="p-6">Date</th><th className="p-6">Client</th><th className="p-6">Montant</th><th className="p-6">Méthode</th><th className="p-6">Statut</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactionsHistory.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 transition">
                          <td className="p-6 text-sm font-bold text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="p-6"><p className="font-bold">{t.profiles?.full_name}</p><p className="text-xs text-gray-500">{t.profiles?.phone}</p></td>
                          <td className="p-6 font-black text-[#166C82]">{t.montant} F</td>
                          <td className="p-6"><span className="bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black">{t.methode}</span></td>
                          <td className="p-6"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{t.status?.toUpperCase() || 'VALIDE'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {activeMenu === "compta" && (
             <div className="bg-white rounded-[2rem] border overflow-hidden animate-in fade-in">
                <div className="p-8 bg-orange-50 border-b flex items-center gap-4">
                  <AlertTriangle className="text-orange-500" size={32}/>
                  <div><h3 className="text-xl font-black">Dépôts Cash en Agence</h3><p className="text-sm text-gray-600">Pour les chauffeurs payant en espèces.</p></div>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500 border-b">
                    <tr><th className="p-6">Chauffeur</th><th className="p-6">Solde actuel</th><th className="p-6 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredChauffeurs.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition">
                        <td className="p-6"><p className="font-bold">{c.full_name}</p><p className="text-xs text-gray-500">{c.phone}</p></td>
                        <td className="p-6 font-black text-lg">{c.solde_wallet || 0} F</td>
                        <td className="p-6 text-right"><button onClick={() => handleRechargerWallet(c)} className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 ml-auto"><PlusCircle size={18}/> Recharger</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}

          {activeMenu === "dashboard" && (
             <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex items-center gap-6">
                    <div className="bg-[#166C82]/10 p-5 rounded-full text-[#166C82]"><Users size={32}/></div>
                    <div><p className="text-gray-500 font-bold uppercase text-xs">Utilisateurs</p><p className="text-3xl font-black">{allUsers.length}</p></div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex items-center gap-6">
                    <div className="bg-orange-100 p-5 rounded-full text-orange-500"><History size={32}/></div>
                    <div><p className="text-gray-500 font-bold uppercase text-xs">Courses</p><p className="text-3xl font-black">{statsCompta.totalBillets}</p></div>
                  </div>
                  <div className="bg-gray-900 p-8 rounded-[2rem] text-white flex items-center gap-6 shadow-xl">
                    <div className="bg-white/10 p-5 rounded-full text-[#166C82]"><TrendingUp size={32}/></div>
                    <div><p className="text-gray-400 font-bold uppercase text-xs">Revenu (10%)</p><p className="text-3xl font-black text-[#166C82]">{statsCompta.commissionYamoh.toLocaleString()} F</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border">
                    <h3 className="font-black text-lg mb-8">Répartition Chauffeurs/Passagers</h3>
                    <div className="flex items-end gap-6 h-48 border-b pb-2">
                       <div className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-blue-500 rounded-t-xl" style={{ height: `${(allUsers.filter(u => u.role !== 'chauffeur').length / (allUsers.length || 1)) * 100}%` }}></div>
                          <span className="text-[10px] font-black uppercase text-gray-400">Passagers</span>
                       </div>
                       <div className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-orange-500 rounded-t-xl" style={{ height: `${(allUsers.filter(u => u.role === 'chauffeur').length / (allUsers.length || 1)) * 100}%` }}></div>
                          <span className="text-[10px] font-black uppercase text-gray-400">Chauffeurs</span>
                       </div>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border">
                    <h3 className="font-black text-lg mb-8">Volume Financier (FCFA)</h3>
                    <div className="space-y-6">
                       <div><div className="flex justify-between mb-1 font-bold text-xs"><span>BRUT GLOBAL</span><span>{statsCompta.volumeGlobal.toLocaleString()} F</span></div><div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden"><div className="bg-gray-800 h-full" style={{ width: '100%' }}></div></div></div>
                       <div><div className="flex justify-between mb-1 font-bold text-xs text-[#166C82]"><span>BÉNÉFICE YAMOH</span><span>{statsCompta.commissionYamoh.toLocaleString()} F</span></div><div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden"><div className="bg-[#166C82] h-full" style={{ width: '10%' }}></div></div></div>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {activeMenu === "users" && (
             <div className="bg-white rounded-[2rem] border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500 border-b">
                    <tr><th className="p-6">Utilisateur</th><th className="p-6">Rôle</th><th className="p-6">KYC</th><th className="p-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="p-6 flex items-center gap-4"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black">{u.full_name?.charAt(0)}</div><div><p className="font-bold">{u.full_name}</p><p className="text-xs text-gray-500">{u.phone}</p></div></td>
                        <td className="p-6"><span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${u.role === 'chauffeur' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                        <td className="p-6">{u.verification_status === 'verifie' ? '✅' : '⏳'}</td>
                        <td className="p-6 text-right flex justify-end gap-2"><button onClick={() => openInspectUser(u)} className="p-2 bg-gray-100 rounded-lg hover:bg-[#166C82] hover:text-white transition"><Eye size={18}/></button><button onClick={() => handleDeleteUser(u.id, u.full_name)} className="p-2 bg-gray-100 rounded-lg hover:bg-red-500 hover:text-white transition"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}

          {activeMenu === "kyc" && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-[#166C82] rounded-full flex items-center justify-center font-black">{u.full_name?.charAt(0)}</div>
                      <div className="overflow-hidden"><h4 className="font-black truncate">{u.full_name}</h4><p className="text-xs uppercase text-gray-400 font-bold">{u.role}</p></div>
                    </div>
                    <button onClick={() => openUserModal(u)} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 hover:bg-black transition"><Eye size={18}/> Examiner</button>
                  </div>
                ))}
             </div>
          )}
        </div>
      </main>

      {/* --- MODAL INSPECTION --- */}
      {inspectUser && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in">
            <header className="px-8 py-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-2xl font-black">{inspectUser.full_name}</h3>
              <button onClick={() => setInspectUser(null)} className="p-3 bg-gray-200 rounded-full hover:bg-red-500 transition"><X size={24}/></button>
            </header>
            <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-xl">
                  <p className="text-gray-400 text-xs font-bold uppercase">Solde Portefeuille</p>
                  <p className="text-4xl font-black text-[#166C82]">{inspectUser.solde_wallet || 0} F</p>
                  <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                    <p className="flex items-center gap-2"><Phone size={16}/> {inspectUser.phone}</p>
                    <p className="flex items-center gap-2 text-[#166C82]"><Car size={16}/> {inspectUser.vehicule_plaque || 'Pas de véhicule'}</p>
                  </div>
               </div>
               <div className="bg-white border p-6 rounded-[2rem]">
                  <h4 className="font-black mb-4 flex items-center gap-2"><History size={18}/> Trajets Récents</h4>
                  <div className="space-y-3">
                    {inspectUserHistory.map((t, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-xl text-[10px] font-bold border flex justify-between">
                        <span>{t.depart?.split(',')[0]} → {t.destination?.split(',')[0]}</span>
                        <span className="text-[#166C82]">{t.statut_course}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-white border p-6 rounded-[2rem]">
                  <h4 className="font-black mb-4 flex items-center gap-2"><ShieldCheck size={18}/> Documents Photos</h4>
                  <div className="grid grid-cols-2 gap-2">
                     {['recto', 'verso', 'selfie', 'permis', 'cartegrise'].map(k => (userDocs as any)?.[k] && (
                       <img key={k} src={(userDocs as any)[k]} className="w-full h-24 object-cover rounded-xl border cursor-zoom-in" onClick={() => window.open((userDocs as any)[k])} />
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL KYC --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in">
            <header className="px-8 py-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-black">Examen : {selectedUser.full_name}</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"><X size={20}/></button>
            </header>
            <div className="p-8 overflow-y-auto flex-1 bg-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              {['recto', 'selfie', 'permis', 'cartegrise'].map(k => (
                <div key={k} className="space-y-2">
                  <h4 className="font-black text-[10px] uppercase tracking-widest bg-white px-3 py-1 rounded-full inline-block">{k}</h4>
                  {(userDocs as any)?.[k] ? <img src={(userDocs as any)[k]} className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-md" /> : <div className="h-64 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-bold">Non fourni</div>}
                </div>
              ))}
            </div>
            <footer className="p-6 bg-white border-t flex flex-col md:flex-row gap-4 justify-end">
              <button onClick={() => handleActionKYC(selectedUser.id, 'rejete')} className="px-6 py-3 bg-red-50 text-red-600 font-black rounded-xl flex items-center gap-2"><XCircle size={20} /> Rejeter</button>
              <button onClick={() => handleActionKYC(selectedUser.id, 'verifie')} className="px-8 py-3 bg-green-500 text-white font-black rounded-xl shadow-lg flex items-center gap-2"><CheckCircle size={20} /> Valider</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuBtn({ icon, label, active, badge, onClick, isAlert }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${active ? (isAlert ? 'bg-red-600' : 'bg-[#166C82]') : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
      <div className="flex items-center gap-3 font-bold">{icon} <span className="text-sm">{label}</span></div>
      {badge !== undefined && badge > 0 && <span className={`text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse ${isAlert ? 'bg-red-900' : 'bg-red-500'}`}>{badge}</span>}
    </button>
  );
}