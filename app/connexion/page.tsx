"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, User as UserIcon, Phone, Calendar, Users, Car, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Connexion() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [roleSelection, setRoleSelection] = useState(false); 
  const [role, setRole] = useState<"passager" | "chauffeur">("passager");

  const [phoneInput, setPhoneInput] = useState("");
  const [password, setPassword] = useState("");
  
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");

  const [vehiculeMarque, setVehiculeMarque] = useState("");
  const [vehiculeCouleur, setVehiculeCouleur] = useState("");
  const [vehiculePlaque, setVehiculePlaque] = useState("");
  const [permisNumero, setPermisNumero] = useState("");
  const [carteGriseNumero, setCarteGriseNumero] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // NOUVEAU : État pour gérer le beau pop-up de succès
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formattedPhone = phoneInput.replace(/\s+/g, '');
    let finalPhone = formattedPhone;
    if (!finalPhone.startsWith('+')) {
      finalPhone = '+225' + finalPhone;
    }
    const fakeEmail = `${finalPhone.replace('+', '')}@yamoh.net`;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail, 
        password,
      });
      
      if (error) {
        setErrorMsg("Numéro ou mot de passe incorrect.");
        setLoading(false);
      } else {
        router.push("/");
      }
      
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail, 
        password,
        options: {
          data: {
            full_name: name,
            phone: finalPhone, 
            birth_date: birthDate,
            gender: gender,
            role: role,
            verification_status: 'non_verifie',
            ...(role === 'chauffeur' && {
              vehicule_marque: vehiculeMarque,
              vehicule_couleur: vehiculeCouleur,
              vehicule_plaque: vehiculePlaque,
              permis_numero: permisNumero,
              carte_grise_numero: carteGriseNumero
            })
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        // NOUVEAU : On affiche le pop-up pro au lieu de "alert()"
        setShowSuccess(true);
        // On patiente 2.5 secondes pour qu'il lise, puis on redirige
        setTimeout(() => {
          router.push("/verif-identite");
        }, 2500);
      }
    }
  };

  // NOUVEAU : Le composant du Pop-up de succès
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 max-w-md w-full border border-gray-100">
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CheckCircle2 size={50} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Compte créé !</h2>
          <p className="text-gray-500 text-lg mb-8">Redirection vers la vérification de vos documents...</p>
          <div className="w-8 h-8 border-4 border-yamo-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (roleSelection) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4">
          <button onClick={() => setRoleSelection(false)}><ArrowLeft size={24} className="text-gray-600 hover:text-black" /></button>
          <h1 className="text-xl font-bold text-yamo-teal">yamoh</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Comment voulez-vous utiliser Yamoh ?</h2>
          <p className="text-gray-500 mb-10">Choisissez votre profil pour continuer l'inscription.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div 
              onClick={() => { setRole("passager"); setRoleSelection(false); setIsLogin(false); }}
              className="bg-white border-2 border-gray-100 hover:border-yamo-teal p-8 rounded-[2rem] cursor-pointer transition shadow-sm hover:shadow-md flex flex-col items-center group"
            >
              <div className="bg-[#E8F4F8] p-5 rounded-full text-yamo-teal mb-4 group-hover:scale-110 transition">
                <UserIcon size={40} />
              </div>
              <h3 className="font-black text-xl mb-2">Passager</h3>
              <p className="text-gray-500 text-sm">Je cherche des trajets abordables.</p>
            </div>

            <div 
              onClick={() => { setRole("chauffeur"); setRoleSelection(false); setIsLogin(false); }}
              className="bg-white border-2 border-gray-100 hover:border-yamo-orange p-8 rounded-[2rem] cursor-pointer transition shadow-sm hover:shadow-md flex flex-col items-center group"
            >
              <div className="bg-[#FFF0E8] p-5 rounded-full text-yamo-orange mb-4 group-hover:scale-110 transition">
                <Car size={40} />
              </div>
              <h3 className="font-black text-xl mb-2">Chauffeur</h3>
              <p className="text-gray-500 text-sm">Je propose des trajets et je conduis.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4">
        <Link href="/"><ArrowLeft size={24} className="text-gray-600 hover:text-black" /></Link>
        <h1 className="text-xl font-bold text-yamo-teal">yamoh</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="bg-white w-full max-w-xl p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {isLogin ? "Bon retour !" : (role === 'chauffeur' ? "Inscription Chauffeur" : "Inscription Passager")}
            </h2>
            {!isLogin && <p className="text-gray-500">Remplissez vos informations pour sécuriser votre compte.</p>}
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            
            {!isLogin && (
              <>
                <h3 className="font-bold text-lg border-b border-gray-100 pb-2 mt-2">Informations personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-600">Nom complet</label>
                    <div className="relative flex items-center">
                      <UserIcon size={18} className="absolute left-4 text-gray-400" />
                      <input type="text" required placeholder="Ex: Amadou K." className="bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium text-sm" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-600">Genre</label>
                    <div className="relative flex items-center">
                      <Users size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                      <select required className="bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium text-sm appearance-none" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Sélectionner</option>
                        <option value="M">Homme</option>
                        <option value="F">Femme</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-600">Date de Naissance</label>
                  <div className="relative flex items-center">
                    <Calendar size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                    <input type="date" required className="bg-gray-50 pl-11 pr-2 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium text-sm" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                </div>

                {role === 'chauffeur' && (
                  <div className="mt-4 bg-[#FFF0E8] p-5 rounded-2xl border border-yamo-orange/20 space-y-4">
                    <h3 className="font-bold text-lg border-b border-yamo-orange/20 pb-2 text-yamo-orange flex items-center gap-2">
                      <Car size={20}/> Informations du Véhicule
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Marque & Modèle</label>
                        <input type="text" required placeholder="Ex: Toyota Yaris" className="bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-orange w-full font-medium text-sm" value={vehiculeMarque} onChange={(e) => setVehiculeMarque(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Couleur</label>
                        <input type="text" required placeholder="Ex: Gris" className="bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-orange w-full font-medium text-sm" value={vehiculeCouleur} onChange={(e) => setVehiculeCouleur(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Plaque d'immatriculation</label>
                      <input type="text" required placeholder="Ex: 1234 AB 01" className="bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-orange w-full font-medium uppercase tracking-widest text-sm" value={vehiculePlaque} onChange={(e) => setVehiculePlaque(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">N° Permis de conduire</label>
                        <input type="text" required placeholder="Numéro du permis" className="bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-orange w-full font-medium text-sm" value={permisNumero} onChange={(e) => setPermisNumero(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">N° Carte Grise</label>
                        <input type="text" required placeholder="Numéro carte grise" className="bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-orange w-full font-medium text-sm" value={carteGriseNumero} onChange={(e) => setCarteGriseNumero(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
                <h3 className="font-bold text-lg border-b border-gray-100 pb-2 mt-4">Sécurité du compte</h3>
              </>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Numéro de téléphone</label>
              <div className="relative flex items-center">
                <Phone size={20} className="absolute left-4 text-gray-400" />
                <input type="tel" required placeholder="Ex: 0700000000" className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium tracking-wide" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Mot de passe</label>
              <div className="relative flex items-center">
                <Lock size={20} className="absolute left-4 text-gray-400" />
                <input type="password" required placeholder="••••••••" minLength={6} className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full text-white font-black text-lg py-4 rounded-2xl mt-4 transition duration-300 shadow-lg flex justify-center items-center gap-2 ${loading ? 'bg-gray-400' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}>
              {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {loading ? "Chargement..." : (isLogin ? "Se connecter" : "Valider mon inscription")}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            {isLogin ? (
              <p className="text-gray-500">Nouveau sur Yamoh ? <button onClick={() => setRoleSelection(true)} className="text-yamo-orange font-bold hover:underline ml-1">Créer un compte</button></p>
            ) : (
              <p className="text-gray-500">Déjà inscrit ? <button onClick={() => { setIsLogin(true); setErrorMsg(""); }} className="text-yamo-teal font-bold hover:underline ml-1">Se connecter</button></p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}