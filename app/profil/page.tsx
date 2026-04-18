"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Phone, MessageSquare, Music, Save, 
  Camera, ChevronRight, Star, ShieldCheck, Mail, Coins, 
  Lock, MapPin, Cigarette, Dog, Info, Award, Car, Clock,
  X, AlertTriangle, UserX, Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function ProfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({ music: true, chat: true, smoke: false, pets: false });
  const [verificationStatus, setVerificationStatus] = useState("non_verifie");
  
  const [stats, setStats] = useState({ solde: 0, trajetsCount: 0 });

  // ÉTATS POUR LES POP-UPS
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ÉTATS POUR LE CHANGEMENT DE MOT DE PASSE
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadFullProfil() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/connexion'); return; }
      setUser(session.user);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setFullName(profile.full_name || session.user.user_metadata?.full_name || "");
        
        // 🎯 LA CORRECTION DÉFINITIVE DU NUMÉRO EST ICI :
        // On force Supabase à fouiller dans ses 3 cachettes possibles.
        const numeroExtrait = profile.phone || session.user.phone || session.user.user_metadata?.phone || "";
        setPhone(numeroExtrait);
        
        setBio(profile.bio || "");
        setVerificationStatus(profile.verification_status || "non_verifie");
        if (profile.preferences) setPrefs(profile.preferences);

        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        } else {
          const { data: files } = await supabase.storage.from('kyc_documents').list(session.user.id);
          const selfieFile = files?.find(f => f.name.includes('selfie'));
          if (selfieFile) {
            const { data: urlData } = supabase.storage.from('kyc_documents').getPublicUrl(`${session.user.id}/${selfieFile.name}`);
            setAvatarUrl(urlData.publicUrl);
          }
        }
      }

      setStats({ 
        solde: profile?.solde_wallet || 0, 
        trajetsCount: 0
      });
      setLoading(false);
    }
    loadFullProfil();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert("Photo de profil mise à jour avec succès !");

    } catch (error: any) {
      alert("Erreur lors de l'ajout de la photo. Avez-vous configuré les Policies dans Storage ?");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // On s'assure d'enregistrer le numéro dans la table profile s'il n'y était pas
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, 
      phone: phone, 
      bio: bio, 
      preferences: prefs
    }).eq('id', user?.id);
    
    setSaving(false);
    if (!error) alert("Profil mis à jour avec succès !");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert("Mot de passe modifié avec succès !");
      setNewPassword("");
      setShowPasswordModal(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    alert("Votre demande de suppression a été envoyée à l'administrateur Yamoh.");
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-yamo-teal">Chargement du profil...</div>;

  return (
    <main className="min-h-screen bg-white font-sans pb-20">
      
      <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-40 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        
        <div className="w-28 h-10 relative">
           <Image src="/Yamo_Logo.png" alt="Yamoh" fill className="object-contain" />
        </div>
        
        <div className="w-12"></div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        
        <div className="flex gap-8 border-b border-gray-100 mb-10">
          <button onClick={() => setActiveTab("about")} className={`pb-4 text-lg font-black transition-all relative ${activeTab === "about" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
            À propos de vous
            {activeTab === "about" && <div className="absolute bottom-0 left-0 w-full h-1 bg-yamo-teal rounded-t-full"></div>}
          </button>
          <button onClick={() => setActiveTab("account")} className={`pb-4 text-lg font-black transition-all relative ${activeTab === "account" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
            Compte
            {activeTab === "account" && <div className="absolute bottom-0 left-0 w-full h-1 bg-yamo-teal rounded-t-full"></div>}
          </button>
        </div>

        {activeTab === "about" ? (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            <div className="flex items-center justify-between bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 bg-yamo-teal/10 rounded-[1.5rem] flex items-center justify-center text-3xl font-black text-yamo-teal overflow-hidden relative shadow-inner">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      fullName?.charAt(0).toUpperCase() || "U"
                    )}
                    {uploadingImage && (
                       <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                         <Loader2 className="animate-spin text-yamo-teal" size={24} />
                       </div>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    disabled={uploadingImage}
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploadingImage}
                    className="absolute -bottom-2 -right-2 bg-yamo-teal p-2 rounded-full text-white border-4 border-white shadow-sm hover:scale-110 transition disabled:opacity-50"
                  >
                    <Camera size={14} />
                  </button>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-none mb-1">{fullName || "Utilisateur"}</h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg uppercase tracking-wide">
                    <Award size={14} /> Membre Actif
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Link href="/paiements" className="bg-white p-6 rounded-[2rem] flex flex-col items-center gap-2 border border-gray-100 shadow-sm hover:border-yamo-teal transition group">
                 <div className="w-12 h-12 bg-yamo-teal/10 rounded-full flex items-center justify-center text-yamo-teal group-hover:scale-110 transition-transform">
                    <Coins size={24} />
                 </div>
                 <p className="text-2xl font-black text-gray-900 mt-2">{stats.solde.toLocaleString()} F</p>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mon Portefeuille</p>
               </Link>
               <Link href="/dashboard" className="bg-white p-6 rounded-[2rem] flex flex-col items-center gap-2 border border-gray-100 shadow-sm hover:border-yamo-teal transition group">
                 <div className="w-12 h-12 bg-yamo-orange/10 rounded-full flex items-center justify-center text-yamo-orange group-hover:scale-110 transition-transform">
                    <Car size={24} />
                 </div>
                 <p className="text-2xl font-black text-gray-900 mt-2">0</p>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trajets publiés</p>
               </Link>
            </div>

            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Sécurité & Confiance</h3>
              <div className="bg-white border border-gray-100 rounded-[2rem] p-2 divide-y divide-gray-50 shadow-sm">
                
                {verificationStatus === 'verifie' ? (
                   <VerificationItem icon={<ShieldCheck size={20} className="text-green-500"/>} title="Identité vérifiée" subtitle="Vous avez le badge de confiance Yamoh" checked={true} />
                ) : verificationStatus === 'en_attente' ? (
                   <div className="flex items-center gap-4 p-4">
                     <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 flex-shrink-0"><Clock size={20} /></div>
                     <div>
                       <p className="font-bold text-gray-900 text-sm">Pièce en cours d'analyse</p>
                       <p className="text-xs text-gray-500 mt-0.5">Nous vérifions vos documents.</p>
                     </div>
                   </div>
                ) : (
                   <Link href="/verif-identite" className="block">
                     <VerificationItem icon={<ShieldCheck size={20} className="text-gray-400"/>} title="Vérifier mon identité" subtitle="Requis pour publier des trajets" checked={false} />
                   </Link>
                )}

                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setShowPhoneModal(true)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0"><Phone size={20} /></div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Numéro de téléphone</p>
                      <p className="text-xs text-gray-500 mt-0.5">{phone || "Introuvable, modifiez-le ci-dessous"}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Mon Style de Voyage</h3>
              
              <div className="mb-6">
                <textarea 
                  rows={3} 
                  placeholder="Décrivez-vous en quelques mots (ex: J'adore voyager tôt le matin...)"
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="w-full bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100 outline-none focus:border-yamo-teal focus:ring-4 focus:ring-yamo-teal/10 font-medium text-sm resize-none transition-all" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setPrefs({...prefs, chat: !prefs.chat})} className="cursor-pointer">
                    <PreferenceToggle icon={<MessageSquare size={20}/>} title="On se gère (Je cause bien)" active={prefs.chat} />
                </div>
                <div onClick={() => setPrefs({...prefs, music: !prefs.music})} className="cursor-pointer">
                    <PreferenceToggle icon={<Music size={20}/>} title="DJ de la route (Musique ON)" active={prefs.music} />
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full bg-gray-900 text-white font-black py-5 rounded-full shadow-xl shadow-gray-900/20 hover:bg-black transition-all flex items-center justify-center gap-2">
              {saving ? "Sauvegarde en cours..." : <><Save size={20}/> Enregistrer mon profil</>}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-[2rem] p-2 divide-y divide-gray-50 shadow-sm animate-in fade-in duration-300">
            <Link href="/avis"><AccountItem icon={<Star />} title="Avis & Notes" /></Link>
            <Link href="/vehicules"><AccountItem icon={<Car />} title="Mes véhicules" /></Link>
            
            <div onClick={() => setShowPasswordModal(true)}>
              <AccountItem icon={<Lock />} title="Sécurité et Mot de passe" />
            </div>
            
            <Link href="/paiements"><AccountItem icon={<Coins />} title="Portefeuille Yamoh" /></Link>
            
            <div className="pt-2 pb-2">
              <button onClick={handleLogout} className="w-full text-left p-4 hover:bg-gray-50 rounded-xl transition flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-gray-200 transition"><LogOutIcon size={18}/></div>
                  <span className="font-bold text-gray-900">Se déconnecter</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition" />
              </button>
            </div>

            <div className="pt-2 pb-2">
              <button onClick={() => setShowDeleteModal(true)} className="w-full text-left p-4 hover:bg-red-50 rounded-xl transition flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-100 transition"><UserX size={18}/></div>
                  <span className="font-bold text-red-600">Fermer mon compte</span>
                </div>
                <ChevronRight size={18} className="text-red-300 group-hover:text-red-600 transition" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL NUMÉRO DE TÉLÉPHONE (AJOUT DE LA MODIFICATION) */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm relative animate-in zoom-in duration-200">
            <button onClick={() => setShowPhoneModal(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"><X size={20} /></button>
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6"><Phone size={32} /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Votre numéro</h2>
            
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Ex: 0700000000"
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:border-green-500 font-bold text-center text-xl tracking-widest text-gray-800"
              />
              <p className="text-gray-500 text-sm leading-relaxed text-center">
                Vérifiez ou mettez à jour votre numéro ici. N'oubliez pas de sauvegarder le profil ensuite.
              </p>
            </div>
            
            <button onClick={() => {setShowPhoneModal(false); handleSave();}} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-500/20">Valider ce numéro</button>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm relative animate-in zoom-in duration-200">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"><X size={20} /></button>
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6"><Lock size={32} /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Changer le mot de passe</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Saisissez un nouveau mot de passe solide pour sécuriser votre compte Yamoh.
            </p>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={updatingPassword}
                className="w-full bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition disabled:opacity-50 mt-4"
              >
                {updatingPassword ? "Mise à jour..." : "Valider le mot de passe"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-sm relative animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={40} /></div>
            <h2 className="text-2xl font-black text-gray-900 text-center mb-2">Quitter Yamoh ?</h2>
            <p className="text-gray-500 text-sm mb-8 text-center leading-relaxed">
              En fermant votre compte, vous perdrez votre historique, vos avis et votre solde Yamoh. Cette action est irréversible.
            </p>
            <div className="w-full flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition">Annuler</button>
              <button onClick={handleDeleteAccount} className="flex-1 py-4 font-bold text-white bg-red-500 hover:bg-red-600 rounded-2xl transition shadow-lg shadow-red-500/20">Oui, fermer</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

const LogOutIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

function VerificationItem({ icon, title, subtitle, checked }: { icon: any, title: string, subtitle: string, checked: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl transition group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${checked ? 'bg-green-50' : 'bg-gray-50 group-hover:bg-yamo-teal/10 transition'}`}>
          {icon}
        </div>
        <div>
          <p className={`font-bold text-sm ${checked ? 'text-gray-900' : 'text-yamo-teal group-hover:underline'}`}>{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {!checked && <ChevronRight size={18} className="text-gray-300 group-hover:text-yamo-teal transition" />}
    </div>
  );
}

function PreferenceToggle({ icon, title, active }: { icon: any, title: string, active: boolean }) {
  return (
    <div className={`flex flex-col p-5 rounded-[1.5rem] border-2 transition-all h-full ${active ? 'border-yamo-teal bg-yamo-teal/5 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${active ? 'bg-yamo-teal text-white' : 'bg-gray-50 text-gray-400'}`}>
          {icon}
        </div>
        <div className={`w-12 h-7 rounded-full relative transition-colors shadow-inner ${active ? 'bg-yamo-teal' : 'bg-gray-200'}`}>
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`} />
        </div>
      </div>
      <p className={`font-bold text-sm leading-tight ${active ? "text-gray-900" : "text-gray-400"}`}>{title}</p>
    </div>
  );
}

function AccountItem({ icon, title }: { icon: any, title: string }) {
  return (
    <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-gray-50 rounded-xl transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-yamo-teal/10 group-hover:text-yamo-teal transition">
          {icon}
        </div>
        <span className="font-bold text-gray-800 text-sm">{title}</span>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition" />
    </div>
  );
}