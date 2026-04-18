"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, ShieldCheck, Users, Map, Wallet, Search, 
  CheckCircle, XCircle, Eye, AlertTriangle, LogOut, Loader2,
  Clock, CheckCircle2, Ban, Lock, User as UserIcon,
  Activity, TrendingUp, MapPin, Navigation, Car, PlusCircle, Trash2,
  Menu, X, Receipt, Phone, AlertOctagon, Crosshair
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
  
  // NOUVEAU : RADAR À ERREURS
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

  const [pendingRecharges, setPendingRecharges] = useState<any[]>([]);
  const [loadingRecharges, setLoadingRecharges] = useState(true);

  const [alertes, setAlertes] = useState<any[]>([]);

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
      setDbError(null); // On réinitialise l'erreur à chaque changement de menu
      if (activeMenu === "kyc") fetchPendingKYC();
      if (activeMenu === "users") fetchAllUsers();
      if (activeMenu === "live") fetchLiveTrips();
      if (activeMenu === "compta" || activeMenu === "dashboard") fetchCompta();
      if (activeMenu === "recharges") fetchPendingRecharges();
      if (activeMenu === "alertes") fetchAlertes();
    }
  }, [activeMenu, isAuthorized]);

  const fetchAlertes = async () => {
    setAlertes([
      { id: 1, type: 'SOS_PASSAGER', message: "Conduite dangereuse !", trajet: "Abidjan -> Yamoussoukro", passager: "Aicha K.", chauffeur: "Ibrahim", date: new Date().toISOString(), lat: 5.3096, lng: -4.0126 }
    ]);
  };

  const fetchPendingKYC = async () => {
    setLoadingKyc(true);
    // CORRECTION : On enlève le tri SQL qui peut faire planter et on récupère juste les données
    const { data, error } = await supabase.from('profiles').select('*').eq('verification_status', 'en_attente');
    
    if (error) {
      console.error("Erreur KYC:", error);
      setDbError(`Erreur KYC : ${error.message}`);
    }
    
    if (data) {
      // Tri en Javascript (ne plantera pas même si created_at manque)
      const sortedData = data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setPendingUsers(sortedData);
    }
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
    
    if (error) {
      console.error("Erreur Users:", error);
      setDbError(`Erreur Utilisateurs : ${error.message}`);
    }

    if (data) {
      const sortedData = data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setAllUsers(sortedData);
    }
    setLoadingUsers(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirm = window.confirm(`⚠️ ATTENTION : Voulez-vous vraiment bannir et supprimer les données de ${userName || "cet utilisateur"} ? Cette action est irréversible.`);
    if (!confirm) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) alert("Erreur : " + error.message);
    else { alert("Utilisateur supprimé avec succès."); fetchAllUsers(); }
  };

  const fetchLiveTrips = async () => {
    setLoadingLive(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('trajets').select('*, reservations(*)').gte('date_depart', today);
    
    if (error) {
      console.error("Erreur Trips:", error);
      setDbError(`Erreur Trajets : ${error.message}`);
    }

    if (data) {
      const sortedData = data.sort((a, b) => new Date(a.date_depart || 0).getTime() - new Date(b.date_depart || 0).getTime());
      setLiveTrips(sortedData);
    }
    setLoadingLive(false);
  };

  const openGPS = (lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=5.30966,-4.01266`, '_blank');
    }
  };

  const fetchCompta = async () => {
    setLoadingCompta(true);
    const { data: resas, error: resaError } = await supabase.from('reservations').select('places_reservees, statut, trajets(prix)').eq('statut', 'valide');
    
    if (resaError) setDbError(`Erreur Compta Resa: ${resaError.message}`);

    let volumeGlobal = 0; let totalBillets = 0;
    if (resas) {
      totalBillets = resas.length;
      resas.forEach((r: any) => { 
        // Gestion des tableaux et objets
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

  const fetchPendingRecharges = async () => {
    setLoadingRecharges(true);
    const { data, error } = await supabase
      .from('paiements')
      .select('*, profiles(full_name, phone, solde_wallet)')
      .eq('type', 'recharge_attente');
      
    if (error) setDbError(`Erreur Recharges : ${error.message}`);

    if (data) {
      const sortedData = data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setPendingRecharges(sortedData);
    }
    setLoadingRecharges(false);
  };

  const handleValiderRecharge = async (recharge: any) => {
    const confirm = window.confirm(`Voulez-vous valider cette recharge de ${recharge.montant} FCFA pour ${recharge.profiles?.full_name} ? Avez-vous bien reçu l'argent sur ${recharge.methode} ?`);
    if (!confirm) return;

    await supabase.from('paiements').update({ type: 'gain' }).eq('id', recharge.id);
    
    const nouveauSolde = (recharge.profiles?.solde_wallet || 0) + recharge.montant;
    await supabase.from('profiles').update({ solde_wallet: nouveauSolde }).eq('user_id', recharge.user_id);
    
    await supabase.from('notifications').insert([{
      user_id: recharge.user_id, 
      titre: "Recharge validée ! 💰", 
      message: `Votre recharge de ${recharge.montant} FCFA via ${recharge.methode} a été validée. Vous pouvez publier !`, 
      type: 'systeme'
    }]);

    alert("Recharge validée et compte crédité !");
    fetchPendingRecharges();
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

  const filteredUsers = allUsers.filter(u => {
    if (!globalSearch) return true;
    const searchLower = globalSearch.toLowerCase();
    const nameMatch = (u.full_name || "").toLowerCase().includes(searchLower);
    const phoneMatch = (u.phone || "").includes(globalSearch);
    return nameMatch || phoneMatch;
  });

  const filteredChauffeurs = chauffeurs.filter(c => {
    if (!globalSearch) return true;
    const searchLower = globalSearch.toLowerCase();
    const nameMatch = (c.full_name || "").toLowerCase().includes(searchLower);
    const phoneMatch = (c.phone || "").includes(globalSearch);
    return nameMatch || phoneMatch;
  });
  
  const menuTitles: any = {
    live: { title: "Tour de Contrôle GPS", desc: "Suivi en temps réel des véhicules sur la route." },
    alertes: { title: "Urgences & SOS", desc: "Signalements des passagers et incidents." },
    recharges: { title: "Dépôts Mobile Money", desc: "Validez les transferts des chauffeurs." },
    kyc: { title: "Vérifications KYC", desc: "Validez les permis et cartes d'identité." },
    users: { title: "Base Utilisateurs", desc: "Gérez tous les membres inscrits sur Yamoh." },
    compta: { title: "Comptabilité globale", desc: "Recharges de secours et revenus." },
    dashboard: { title: "Vue d'ensemble", desc: "Statistiques globales de Yamoh." }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-800 flex justify-between items-center">
        {/* LE LOGO AGRANDI AU MAXIMUM DE LA LARGEUR DISPONIBLE */}
        <div className="w-52 h-16 relative">
           <Image src="/Yamo_Logo.png" alt="Yamoh ERP" fill className="object-contain object-left" />
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white"><X size={24} /></button>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <MenuBtn icon={<Map size={20}/>} label="Tour de Contrôle" active={activeMenu === "live"} onClick={() => {setActiveMenu("live"); setIsMobileMenuOpen(false);}} />
        <MenuBtn icon={<AlertOctagon size={20}/>} label="Urgences SOS" badge={alertes.length > 0 ? alertes.length : undefined} active={activeMenu === "alertes"} onClick={() => {setActiveMenu("alertes"); setIsMobileMenuOpen(false);}} isAlert={true}/>
        
        <div className="my-4 border-t border-gray-800"></div>

        <MenuBtn icon={<Receipt size={20}/>} label="Dépôts en attente" badge={pendingRecharges.length > 0 ? pendingRecharges.length : undefined} active={activeMenu === "recharges"} onClick={() => {setActiveMenu("recharges"); setIsMobileMenuOpen(false);}} />
        <MenuBtn icon={<ShieldCheck size={20}/>} label="Vérifications (KYC)" badge={pendingUsers.length > 0 ? pendingUsers.length : undefined} active={activeMenu === "kyc"} onClick={() => {setActiveMenu("kyc"); setIsMobileMenuOpen(false);}} />
        <MenuBtn icon={<Users size={20}/>} label="Utilisateurs" active={activeMenu === "users"} onClick={() => {setActiveMenu("users"); setIsMobileMenuOpen(false);}} />
        <MenuBtn icon={<Wallet size={20}/>} label="Comptabilité" active={activeMenu === "compta"} onClick={() => {setActiveMenu("compta"); setIsMobileMenuOpen(false);}} />
        <MenuBtn icon={<LayoutDashboard size={20}/>} label="Statistiques" active={activeMenu === "dashboard"} onClick={() => {setActiveMenu("dashboard"); setIsMobileMenuOpen(false);}} />
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button onClick={async () => { await supabase.auth.signOut(); setIsAuthorized(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition">
          <LogOut size={20} /> Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-gray-900 text-white flex flex-col z-50 transform transition-transform duration-300 md:translate-x-0 md:relative md:w-64 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      <main className="flex-1 w-full md:w-auto h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 bg-white border-b border-gray-100 sticky top-0 z-30 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 bg-gray-100 rounded-xl md:hidden text-gray-600"><Menu size={24} /></button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{menuTitles[activeMenu]?.title}</h2>
              <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">{menuTitles[activeMenu]?.desc}</p>
            </div>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="text" placeholder="Rechercher..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-yamo-teal w-full md:w-72 transition-all focus:w-full md:focus:w-96 font-bold" />
          </div>
        </header>

        <div className="p-4 md:p-8">
          
          {/* AFFICHAGE DE L'ERREUR SUPABASE POUR COMPRENDRE LE PROBLÈME */}
          {dbError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl border-2 border-red-200 font-bold flex items-center gap-3 mb-6 shadow-sm">
              <AlertTriangle size={24} className="flex-shrink-0" />
              <div>
                <p>Oups ! Impossible de charger les données.</p>
                <p className="text-sm font-medium opacity-80">{dbError}</p>
              </div>
            </div>
          )}

          {activeMenu === "live" && (
             loadingLive ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
             liveTrips.length === 0 && !dbError ? (
               <div className="bg-white p-12 md:p-16 rounded-[2rem] text-center border border-gray-100 shadow-sm mx-4 md:mx-0">
                  <Map size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-2xl font-black">Route dégagée</h3><p className="text-gray-500 mt-2">Aucun véhicule n'est en mouvement actuellement.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-300">
                 {liveTrips.map(trip => {
                   const resas = trip.reservations || [];
                   const totalPrises = resas.reduce((acc: number, curr: any) => acc + (curr.places_reservees || 1), 0);
                   const isFull = totalPrises >= (trip.places_disponibles + totalPrises);
                   
                   return (
                     <div key={trip.id} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-gray-200 relative overflow-hidden">
                       <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1 animate-pulse">
                         <div className="w-1.5 h-1.5 bg-white rounded-full"></div> GPS Actif
                       </div>

                       <div className="flex justify-between items-start mb-4 mt-2">
                         <div className="pr-4">
                           <span className="text-gray-500 text-xs font-black uppercase tracking-widest">{trip.heure_depart?.substring(0,5)}</span>
                           <h4 className="font-black text-lg md:text-xl mt-1 flex items-start gap-2"><MapPin size={20} className="text-yamo-orange flex-shrink-0 mt-1"/> <span className="line-clamp-2">{trip.depart?.split(',')[0]}</span></h4>
                           <h4 className="font-black text-lg md:text-xl text-gray-400 flex items-start gap-2"><Navigation size={20} className="flex-shrink-0 mt-1"/> <span className="line-clamp-2">{trip.destination?.split(',')[0]}</span></h4>
                         </div>
                       </div>
                       
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chauffeur</p>
                            <p className="font-bold text-gray-900">{trip.conducteur_nom}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Passagers</p>
                             <p className={`font-black text-lg ${isFull ? 'text-red-500' : 'text-yamo-teal'}`}>{totalPrises} / {trip.places_disponibles + totalPrises}</p>
                          </div>
                       </div>

                       <button onClick={() => openGPS()} className="w-full bg-gray-900 text-white hover:bg-black font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                         <Crosshair size={18} className="text-yamo-teal" /> Localiser le véhicule
                       </button>
                     </div>
                   );
                 })}
               </div>
             )
          )}

          {activeMenu === "alertes" && (
             alertes.length === 0 ? (
               <div className="bg-white p-12 md:p-16 rounded-[2rem] text-center border border-gray-100 shadow-sm mx-4 md:mx-0">
                  <ShieldCheck size={64} className="mx-auto text-green-500 mb-4 opacity-50" />
                  <h3 className="text-2xl font-black">Aucune urgence</h3><p className="text-gray-500 mt-2">Tout se passe bien sur les routes.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                 {alertes.map(alerte => (
                   <div key={alerte.id} className="bg-red-50 p-5 md:p-6 rounded-[2rem] border border-red-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                     <div className="flex gap-4">
                       <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex flex-col items-center justify-center animate-pulse flex-shrink-0">
                         <AlertOctagon size={28} />
                       </div>
                       <div>
                         <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Urgence SOS</span>
                         <h4 className="font-black text-xl text-red-900 mt-1">{alerte.message}</h4>
                         <p className="text-sm font-bold text-red-700/70 mt-1">Passager : {alerte.passager} • Chauffeur : {alerte.chauffeur}</p>
                         <p className="text-xs font-bold text-red-700/50 mt-0.5">{alerte.trajet}</p>
                       </div>
                     </div>
                     <button onClick={() => openGPS(alerte.lat, alerte.lng)} className="w-full md:w-auto bg-red-600 text-white hover:bg-red-700 font-black py-4 md:py-3 px-6 rounded-xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2">
                       <Crosshair size={18} /> Voir la position exacte
                     </button>
                   </div>
                 ))}
               </div>
             )
          )}

          {activeMenu === "dashboard" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-300">
               <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4 md:gap-6">
                  <div className="bg-yamo-teal/10 p-4 md:p-5 rounded-full text-yamo-teal"><Users size={28} className="md:w-8 md:h-8"/></div>
                  <div><p className="text-gray-500 font-bold uppercase text-xs">Utilisateurs</p><p className="text-2xl md:text-3xl font-black">{allUsers.length}</p></div>
               </div>
               <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4 md:gap-6">
                  <div className="bg-yamo-orange/10 p-4 md:p-5 rounded-full text-yamo-orange"><CheckCircle2 size={28} className="md:w-8 md:h-8"/></div>
                  <div><p className="text-gray-500 font-bold uppercase text-xs">Billets Scannés</p><p className="text-2xl md:text-3xl font-black">{statsCompta.totalBillets}</p></div>
               </div>
               <div className="bg-gray-900 p-6 md:p-8 rounded-[2rem] shadow-xl text-white flex items-center gap-4 md:gap-6 sm:col-span-2 lg:col-span-1">
                  <div className="bg-white/10 p-4 md:p-5 rounded-full text-white"><TrendingUp size={28} className="md:w-8 md:h-8"/></div>
                  <div><p className="text-gray-400 font-bold uppercase text-xs">Revenu Yamoh</p><p className="text-2xl md:text-3xl font-black text-yamo-teal">{statsCompta.commissionYamoh.toLocaleString()} F</p></div>
               </div>
            </div>
          )}

          {activeMenu === "kyc" && (
             loadingKyc ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
             pendingUsers.length === 0 && !dbError ? (
              <div className="bg-white p-12 md:p-16 rounded-[2rem] text-center border border-gray-100 shadow-sm mx-4 md:mx-0">
                <ShieldCheck size={64} className="mx-auto text-green-500 mb-4 opacity-50" />
                <h3 className="text-2xl font-black">Tout est propre !</h3><p className="text-gray-500 mt-2">Aucun profil en attente de vérification.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {pendingUsers.map(user => (
                  <div key={user.id} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-[#E8F4F8] text-yamo-teal font-black text-xl rounded-full flex items-center justify-center flex-shrink-0">{user.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                      <div className="overflow-hidden"><h4 className="font-black text-lg truncate">{user.full_name || 'Utilisateur'}</h4><p className="text-xs font-bold text-gray-400 uppercase truncate">{user.role || 'Passager'}</p></div>
                    </div>
                    <div className="bg-orange-50 text-orange-600 px-4 py-3 rounded-xl text-sm font-bold flex justify-between mb-4"><span>Doc : {user.kyc_doc_type?.toUpperCase() || '?'}</span><AlertTriangle size={16} /></div>
                    <button onClick={() => openUserModal(user)} className="mt-auto w-full bg-gray-900 text-white font-bold py-3 md:py-4 rounded-xl hover:bg-black transition flex justify-center items-center gap-2"><Eye size={18} /> Examiner</button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeMenu === "users" && (
             loadingUsers ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
             <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-black">
                      <th className="p-4 md:p-6">Utilisateur</th><th className="p-4 md:p-6">Rôle</th><th className="p-4 md:p-6">Contact</th><th className="p-4 md:p-6">Statut KYC</th><th className="p-4 md:p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-yamo-teal/10 text-yamo-teal font-black rounded-full flex items-center justify-center flex-shrink-0">{u.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                          <div><p className="font-bold text-sm md:text-base truncate max-w-[150px]">{u.full_name || 'Utilisateur'}</p><p className="text-[10px] md:text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p></div>
                        </td>
                        <td className="p-4 md:p-6"><span className={`px-2 py-1 md:px-3 md:py-1 text-[10px] md:text-xs font-black uppercase rounded-lg ${u.role === 'chauffeur' ? 'bg-yamo-orange/10 text-yamo-orange' : 'bg-gray-100 text-gray-600'}`}>{u.role || 'Passager'}</span></td>
                        <td className="p-4 md:p-6 font-medium text-xs md:text-sm">{u.phone || 'N/A'}</td>
                        <td className="p-4 md:p-6">
                          {u.verification_status === 'verifie' ? <span className="text-green-600 font-bold text-xs md:text-sm flex items-center gap-1"><CheckCircle2 size={14}/> <span className="hidden md:inline">Vérifié</span></span> :
                           u.verification_status === 'en_attente' ? <span className="text-orange-500 font-bold text-xs md:text-sm flex items-center gap-1"><Clock size={14}/> <span className="hidden md:inline">Attente</span></span> :
                           <span className="text-gray-400 font-bold text-xs md:text-sm flex items-center gap-1"><ShieldCheck size={14}/> <span className="hidden md:inline">Non initié</span></span>}
                        </td>
                        <td className="p-4 md:p-6 text-right">
                          <button onClick={() => handleDeleteUser(u.id, u.full_name)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition inline-flex justify-center" title="Bannir et Supprimer"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && !dbError && <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">Aucun utilisateur trouvé.</td></tr>}
                  </tbody>
               </table>
             </div>
          )}

          {activeMenu === "recharges" && (
             loadingRecharges ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
             pendingRecharges.length === 0 && !dbError ? (
              <div className="bg-white p-12 md:p-16 rounded-[2rem] text-center border border-gray-100 shadow-sm mx-4 md:mx-0">
                <Receipt size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-black">Aucune recharge en attente</h3><p className="text-gray-500 mt-2">Les chauffeurs sont à jour.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {pendingRecharges.map(recharge => (
                  <div key={recharge.id} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest animate-pulse">En attente</div>
                    <div className="flex items-center gap-4 mb-4 mt-2">
                      <div className="w-12 h-12 bg-gray-100 text-gray-600 font-black text-xl rounded-full flex items-center justify-center flex-shrink-0">{recharge.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                      <div className="overflow-hidden">
                        <h4 className="font-black text-lg truncate leading-tight">{recharge.profiles?.full_name || 'Chauffeur'}</h4>
                        <p className="text-xs font-bold text-gray-500 flex items-center gap-1"><Phone size={12}/> {recharge.profiles?.phone || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Demande de</p>
                      <p className="text-3xl font-black text-center text-yamo-teal">{recharge.montant} F</p>
                      <p className="text-center font-bold text-sm text-gray-600 mt-2 bg-white py-1.5 rounded-lg border border-gray-200">Via {recharge.methode}</p>
                    </div>

                    <button onClick={() => handleValiderRecharge(recharge)} className="mt-auto w-full bg-green-500 text-white font-black py-4 rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-500/20 flex justify-center items-center gap-2">
                      <CheckCircle size={20} /> Valider le paiement
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeMenu === "compta" && (
             loadingCompta ? <div className="flex justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div> :
             <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
                   <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4"><Activity size={24}/></div>
                   <p className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1">Volume global (Brut)</p>
                   <p className="text-2xl md:text-3xl font-black text-gray-900">{statsCompta.volumeGlobal.toLocaleString()} <span className="text-sm md:text-lg">F</span></p>
                 </div>
                 <div className="bg-gray-900 p-6 md:p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                   <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
                   <div className="w-12 h-12 bg-white/10 text-yamo-teal rounded-full flex items-center justify-center mb-4"><TrendingUp size={24}/></div>
                   <p className="text-gray-400 font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1">Chiffre d'Affaires (10%)</p>
                   <p className="text-3xl md:text-4xl font-black text-yamo-teal">{statsCompta.commissionYamoh.toLocaleString()} <span className="text-sm md:text-lg text-white">F</span></p>
                 </div>
                 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
                   <div className="w-12 h-12 bg-yamo-orange/10 text-yamo-orange rounded-full flex items-center justify-center mb-4"><Wallet size={24}/></div>
                   <p className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1">Total Soldes Chauffeurs</p>
                   <p className="text-2xl md:text-3xl font-black text-gray-900">{statsCompta.totalWallets.toLocaleString()} <span className="text-sm md:text-lg">F</span></p>
                 </div>
               </div>

               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                  <div className="p-4 md:p-6 border-b border-gray-100 flex items-center gap-4 bg-orange-50/50">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><AlertTriangle size={24}/></div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-gray-900">Recharge d'urgence / Espèces</h3>
                      <p className="text-gray-600 text-xs md:text-sm mt-1">Créditez manuellement le portefeuille d'un chauffeur (Paiement physique ou bug API).</p>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead><tr className="bg-gray-50 border-b border-gray-100 text-[10px] md:text-xs uppercase tracking-wider text-gray-500 font-black"><th className="p-4 md:p-6">Chauffeur</th><th className="p-4 md:p-6">Contact</th><th className="p-4 md:p-6">Solde Wallet</th><th className="p-4 md:p-6 text-right">Action d'Urgence</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredChauffeurs.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 font-black rounded-full flex items-center justify-center text-gray-700 flex-shrink-0">{c.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                            <p className="font-bold text-sm md:text-base truncate max-w-[120px]">{c.full_name || 'Utilisateur'}</p>
                          </td>
                          <td className="p-4 md:p-6 font-medium text-xs md:text-sm text-gray-600">{c.phone || 'N/A'}</td>
                          <td className="p-4 md:p-6"><span className={`font-black text-sm md:text-lg ${c.solde_wallet > 0 ? 'text-green-600' : 'text-red-500'}`}>{c.solde_wallet || 0} F</span></td>
                          <td className="p-4 md:p-6 text-right">
                            <button onClick={() => handleRechargerWallet(c)} className="bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white font-bold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl transition flex items-center justify-center gap-1.5 md:gap-2 ml-auto shadow-sm">
                              <PlusCircle size={16}/> <span className="hidden sm:inline">Forcer Recharge</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             </div>
          )}

        </div>
      </main>

      {/* --- MODAL KYC --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
            <header className="px-6 py-4 md:px-8 md:py-6 border-b border-gray-100 flex justify-between bg-gray-50 items-start md:items-center">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 pr-4">Examen : {selectedUser.full_name || 'Utilisateur'}</h3>
                <p className="text-gray-500 font-medium text-sm md:text-base mt-1">Type de document : {selectedUser.kyc_doc_type?.toUpperCase() || 'INCONNU'}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition flex-shrink-0"><X size={20}/></button>
            </header>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-100">
              {loadingDocs ? <div className="text-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin mx-auto mb-4" /><p className="font-bold">Extraction sécurisée des fichiers...</p></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2">
                    <h4 className="font-black text-gray-700 uppercase text-xs tracking-widest bg-white inline-block px-3 py-1 rounded-full shadow-sm">Recto / Passeport</h4>
                    {userDocs?.recto ? <a href={userDocs.recto} target="_blank" rel="noreferrer"><img src={userDocs.recto} className="w-full h-48 md:h-64 object-cover rounded-2xl border-4 border-white shadow-md hover:scale-[1.02] transition cursor-zoom-in" /></a> : <div className="w-full h-48 md:h-64 bg-white/50 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center font-bold text-gray-400">Document Manquant</div>}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-black text-gray-700 uppercase text-xs tracking-widest bg-white inline-block px-3 py-1 rounded-full shadow-sm">Selfie de vérification</h4>
                    {userDocs?.selfie ? <a href={userDocs.selfie} target="_blank" rel="noreferrer"><img src={userDocs.selfie} className="w-full h-48 md:h-64 object-cover rounded-2xl border-4 border-white shadow-md hover:scale-[1.02] transition cursor-zoom-in" /></a> : <div className="w-full h-48 md:h-64 bg-white/50 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center font-bold text-gray-400">Selfie Manquant</div>}
                  </div>
                  
                  {userDocs?.verso && 
                    <div className="space-y-2 md:col-span-2">
                      <h4 className="font-black text-gray-700 uppercase text-xs tracking-widest bg-white inline-block px-3 py-1 rounded-full shadow-sm">Verso (Si CNI)</h4>
                      <a href={userDocs.verso} target="_blank" rel="noreferrer"><img src={userDocs.verso} className="w-full h-48 md:h-64 object-cover rounded-2xl border-4 border-white shadow-md md:w-1/2 hover:scale-[1.02] transition cursor-zoom-in" /></a>
                    </div>
                  }

                  {selectedUser.role === 'chauffeur' && (
                    <>
                      <div className="col-span-1 md:col-span-2 border-t-2 border-dashed border-gray-300 my-4"></div>
                      
                      <div className="space-y-2">
                        <h4 className="font-black text-yamo-orange uppercase text-xs tracking-widest bg-orange-50 inline-block px-3 py-1 rounded-full shadow-sm">Permis de Conduire</h4>
                        {userDocs?.permis ? <a href={userDocs.permis} target="_blank" rel="noreferrer"><img src={userDocs.permis} className="w-full h-48 md:h-64 object-cover rounded-2xl border-4 border-white shadow-md hover:scale-[1.02] transition cursor-zoom-in" /></a> : <div className="w-full h-48 md:h-64 bg-white/50 border-2 border-dashed border-orange-300 rounded-2xl flex items-center justify-center font-bold text-orange-400">Permis Manquant</div>}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-black text-yamo-orange uppercase text-xs tracking-widest bg-orange-50 inline-block px-3 py-1 rounded-full shadow-sm">Carte Grise</h4>
                        {userDocs?.cartegrise ? <a href={userDocs.cartegrise} target="_blank" rel="noreferrer"><img src={userDocs.cartegrise} className="w-full h-48 md:h-64 object-cover rounded-2xl border-4 border-white shadow-md hover:scale-[1.02] transition cursor-zoom-in" /></a> : <div className="w-full h-48 md:h-64 bg-white/50 border-2 border-dashed border-orange-300 rounded-2xl flex items-center justify-center font-bold text-orange-400">Carte Grise Manquante</div>}
                      </div>
                    </>
                  )}
                </div>
              }
            </div>
            
            <footer className="p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row gap-3 md:gap-4 justify-end">
              <button onClick={() => handleActionKYC(selectedUser.id, 'rejete')} className="w-full md:w-auto px-6 py-4 md:py-3 bg-red-50 text-red-600 font-black rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 transition"><XCircle size={20} /> Rejeter le dossier</button>
              <button onClick={() => handleActionKYC(selectedUser.id, 'verifie')} className="w-full md:w-auto px-8 py-4 md:py-3 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition"><CheckCircle size={20} /> Approuver le compte</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuBtn({ icon, label, active, badge, onClick, isAlert }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 md:py-3 rounded-xl transition-all ${active ? (isAlert ? 'bg-red-600 text-white shadow-lg' : 'bg-yamo-teal text-white shadow-lg') : (isAlert ? 'text-red-400 hover:bg-red-950 hover:text-red-300' : 'text-gray-400 hover:text-white hover:bg-gray-800')}`}>
      <div className="flex items-center gap-3 font-bold">{icon} <span className="md:text-sm">{label}</span></div>
      {badge !== undefined && badge > 0 && <span className={`text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse ${isAlert ? 'bg-red-900' : 'bg-red-500'}`}>{badge}</span>}
    </button>
  );
}