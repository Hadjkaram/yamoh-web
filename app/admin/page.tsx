"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, ShieldCheck, Users, Map, Wallet, Settings, 
  Search, CheckCircle, XCircle, Eye, AlertTriangle, LogOut, Loader2,
  Clock, CheckCircle2, Ban, MoreVertical
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ERPAdmin() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("kyc");
  const [globalSearch, setGlobalSearch] = useState("");
  
  // --- ÉTATS KYC ---
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDocs, setUserDocs] = useState<{recto?: string, verso?: string, selfie?: string} | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // --- ÉTATS UTILISATEURS ---
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // --- CHARGEMENT DYNAMIQUE SELON LE MENU ---
  useEffect(() => {
    if (activeMenu === "kyc") fetchPendingKYC();
    if (activeMenu === "users") fetchAllUsers();
  }, [activeMenu]);

  // ==========================================
  // LOGIQUE KYC (Inchangée)
  // ==========================================
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
        const { data: publicUrlData } = supabase.storage.from('kyc_documents').getPublicUrl(`${userId}/${file.name}`);
        if (file.name.includes('recto')) docs.recto = publicUrlData.publicUrl;
        if (file.name.includes('verso')) docs.verso = publicUrlData.publicUrl;
        if (file.name.includes('selfie')) docs.selfie = publicUrlData.publicUrl;
      });
      setUserDocs(docs);
    } else {
      setUserDocs({});
    }
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
      user_id: userId,
      titre: action === 'verifie' ? "Identité Validée ✅" : "Identité Rejetée ❌",
      message: action === 'verifie' ? "Super ! Votre compte est maintenant vérifié à 100%. Bon voyage sur Yamoh !" : "Vos documents n'ont pas pu être validés. Veuillez recommencer.",
      type: 'systeme'
    }]);

    alert(`Profil ${action === 'verifie' ? 'validé' : 'rejeté'} avec succès.`);
    setSelectedUser(null);
    fetchPendingKYC(); 
  };

  // ==========================================
  // LOGIQUE UTILISATEURS (NOUVEAU)
  // ==========================================
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setAllUsers(data);
    setLoadingUsers(false);
  };

  // Filtrage local pour la barre de recherche
  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(globalSearch.toLowerCase()) || 
    u.phone?.includes(globalSearch)
  );

  // ==========================================
  // INTERFACE ERP
  // ==========================================
  const menuTitles: any = {
    dashboard: { title: "Vue d'ensemble", desc: "Statistiques globales de Yamoh." },
    kyc: { title: "Centre de Vérification KYC", desc: "Validez les documents d'identité pour sécuriser la plateforme." },
    live: { title: "Trajets en direct", desc: "Suivez l'activité des covoiturages d'aujourd'hui." },
    users: { title: "Base Utilisateurs", desc: "Gérez tous les membres inscrits sur Yamoh." },
    compta: { title: "Comptabilité & Finances", desc: "Suivi des revenus, commissions et paiements." }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* SIDEBAR GAUCHE (MENU ERP) */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black text-yamo-teal tracking-wider">YAMOH<span className="text-white text-sm ml-2 font-medium">ERP</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuBtn icon={<LayoutDashboard size={20}/>} label="Vue d'ensemble" active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} />
          <MenuBtn icon={<ShieldCheck size={20}/>} label="Vérifications (KYC)" badge={activeMenu === "kyc" ? pendingUsers.length : undefined} active={activeMenu === "kyc"} onClick={() => setActiveMenu("kyc")} />
          <MenuBtn icon={<Map size={20}/>} label="Trajets en direct" active={activeMenu === "live"} onClick={() => setActiveMenu("live")} />
          <MenuBtn icon={<Users size={20}/>} label="Utilisateurs" active={activeMenu === "users"} onClick={() => setActiveMenu("users")} />
          <MenuBtn icon={<Wallet size={20}/>} label="Comptabilité" active={activeMenu === "compta"} onClick={() => setActiveMenu("compta")} />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition">
            <LogOut size={20} /> Quitter l'ERP
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-8">
        
        {/* HEADER DYNAMIQUE */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900">{menuTitles[activeMenu]?.title || "Chargement..."}</h2>
            <p className="text-gray-500 font-medium mt-1">{menuTitles[activeMenu]?.desc}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher un nom ou numéro..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm outline-none focus:border-yamo-teal w-72 transition-all focus:w-96" 
            />
          </div>
        </header>

        {/* ----------------------------------------------------- */}
        {/* MODULE 1 : VÉRIFICATION KYC                           */}
        {/* ----------------------------------------------------- */}
        {activeMenu === "kyc" && (
          loadingKyc ? (
            <div className="flex items-center justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div>
          ) : pendingUsers.length === 0 ? (
            <div className="bg-white p-16 rounded-[2rem] text-center border border-gray-100 shadow-sm">
              <ShieldCheck size={64} className="mx-auto text-green-500 mb-4 opacity-50" />
              <h3 className="text-2xl font-black text-gray-900">Tout est propre !</h3>
              <p className="text-gray-500">Aucun profil en attente de validation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-[#E8F4F8] text-yamo-teal font-black text-xl rounded-full flex items-center justify-center">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-gray-900 leading-tight">{user.full_name}</h4>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 text-orange-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between mb-6">
                    <span>Document : {user.kyc_doc_type?.toUpperCase() || 'Inconnu'}</span>
                    <AlertTriangle size={16} />
                  </div>

                  <button 
                    onClick={() => openUserModal(user)}
                    className="mt-auto w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition flex items-center justify-center gap-2"
                  >
                    <Eye size={18} /> Examiner les documents
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ----------------------------------------------------- */}
        {/* MODULE 2 : BASE UTILISATEURS (LE NOUVEAU !)           */}
        {/* ----------------------------------------------------- */}
        {activeMenu === "users" && (
          loadingUsers ? (
            <div className="flex items-center justify-center py-20 text-yamo-teal"><Loader2 size={40} className="animate-spin" /></div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-black">
                      <th className="p-6">Utilisateur</th>
                      <th className="p-6">Rôle</th>
                      <th className="p-6">Contact</th>
                      <th className="p-6">Statut KYC</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-bold">Aucun utilisateur trouvé.</td></tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-yamo-teal/10 text-yamo-teal font-black rounded-full flex items-center justify-center flex-shrink-0">
                                {u.full_name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{u.full_name || 'Inconnu'}</p>
                                <p className="text-xs text-gray-400">Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${u.role === 'chauffeur' ? 'bg-yamo-orange/10 text-yamo-orange' : 'bg-[#E8F4F8] text-yamo-teal'}`}>
                              {u.role || 'Passager'}
                            </span>
                          </td>
                          <td className="p-6">
                            <p className="font-medium text-gray-900">{u.phone || 'Non renseigné'}</p>
                          </td>
                          <td className="p-6">
                            {u.verification_status === 'verifie' ? (
                              <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm"><CheckCircle2 size={16}/> Vérifié</span>
                            ) : u.verification_status === 'en_attente' ? (
                              <span className="flex items-center gap-1.5 text-orange-500 font-bold text-sm"><Clock size={16}/> En attente</span>
                            ) : u.verification_status === 'rejete' ? (
                              <span className="flex items-center gap-1.5 text-red-500 font-bold text-sm"><Ban size={16}/> Rejeté</span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-gray-400 font-bold text-sm"><ShieldCheck size={16}/> Non initié</span>
                            )}
                          </td>
                          <td className="p-6 text-right">
                            <button className="p-2 text-gray-400 hover:text-yamo-teal hover:bg-yamo-teal/10 rounded-xl transition" title="Gérer l'utilisateur (À venir)">
                              <MoreVertical size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* ----------------------------------------------------- */}
        {/* MODULE 3 : TRAJETS EN DIRECT (PLACEHOLDER)            */}
        {/* ----------------------------------------------------- */}
        {activeMenu === "live" && (
          <div className="bg-white p-16 rounded-[2.5rem] text-center border border-gray-100 shadow-sm animate-in fade-in duration-300">
            <Map size={64} className="mx-auto text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Module Trajets en cours de construction</h3>
            <p className="text-gray-500">Bientôt, vous verrez tous les véhicules sur une carte interactive ici.</p>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* MODULE 4 : COMPTABILITÉ (PLACEHOLDER)                 */}
        {/* ----------------------------------------------------- */}
        {activeMenu === "compta" && (
          <div className="bg-white p-16 rounded-[2.5rem] text-center border border-gray-100 shadow-sm animate-in fade-in duration-300">
            <Wallet size={64} className="mx-auto text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Module Comptabilité en cours de construction</h3>
            <p className="text-gray-500">Le grand livre des finances, commissions et paiements arrivera ici.</p>
          </div>
        )}

      </main>

      {/* MODAL D'EXAMEN DES DOCUMENTS (KYC) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
            <header className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Examen : {selectedUser.full_name}</h3>
                <p className="text-gray-500 font-medium">Type : {selectedUser.kyc_doc_type?.toUpperCase()} • Rôle : {selectedUser.role}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300"><XCircle size={24}/></button>
            </header>

            <div className="p-8 overflow-y-auto flex-1 bg-gray-100">
              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-20 text-yamo-teal">
                  <Loader2 size={40} className="animate-spin mb-4" />
                  <p className="font-bold">Extraction des fichiers sécurisés...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="font-black text-gray-700 uppercase tracking-wider text-sm">Pièce d'identité (Recto)</h4>
                    {userDocs?.recto ? (
                      <img src={userDocs.recto} alt="Recto" className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-md" />
                    ) : <div className="w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-bold">Document manquant</div>}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-black text-gray-700 uppercase tracking-wider text-sm">Selfie de contrôle</h4>
                    {userDocs?.selfie ? (
                      <img src={userDocs.selfie} alt="Selfie" className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-md" />
                    ) : <div className="w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-bold">Selfie manquant</div>}
                  </div>

                  {userDocs?.verso && (
                    <div className="space-y-2 md:col-span-2">
                      <h4 className="font-black text-gray-700 uppercase tracking-wider text-sm">Pièce d'identité (Verso)</h4>
                      <img src={userDocs.verso} alt="Verso" className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-md md:w-1/2" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="p-6 bg-white border-t border-gray-100 flex gap-4 justify-end">
              <button onClick={() => handleActionKYC(selectedUser.id, 'rejete')} className="px-8 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition flex items-center gap-2">
                <XCircle size={20} /> Rejeter
              </button>
              <button onClick={() => handleActionKYC(selectedUser.id, 'verifie')} className="px-8 py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition shadow-lg shadow-green-500/30 flex items-center gap-2">
                <CheckCircle size={20} /> Approuver le profil
              </button>
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
      <div className="flex items-center gap-3 font-bold">
        {icon} <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}