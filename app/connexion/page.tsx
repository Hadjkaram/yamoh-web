"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User as UserIcon, Phone, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Connexion() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Nouveaux champs pour l'inscription
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setErrorMsg(error.message);
      else router.push("/");
      
    } else {
      // --- INSCRIPTION AVEC DONNÉES COMPLÈTES ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
            birth_date: birthDate,
            gender: gender,
            verification_status: 'non_verifie' // Statut initial
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        alert("Compte créé ! Passons maintenant à la vérification de votre identité.");
        // Redirection directe vers la vérification après inscription
        router.push("/verif-identite");
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4">
        <Link href="/">
          <ArrowLeft size={24} className="text-gray-600 hover:text-black" />
        </Link>
        <h1 className="text-xl font-bold text-yamo-teal">yamoh</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
            {isLogin ? "Bon retour !" : "Créez votre compte"}
          </h2>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            
            {!isLogin && (
              <>
                {/* NOM COMPLET */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-600">Nom complet</label>
                  <div className="relative flex items-center">
                    <UserIcon size={20} className="absolute left-4 text-gray-400" />
                    <input type="text" required placeholder="Ex: Ibrahim K." className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>

                {/* TÉLÉPHONE */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-600">Numéro de téléphone</label>
                  <div className="relative flex items-center">
                    <Phone size={20} className="absolute left-4 text-gray-400" />
                    <input type="tel" required placeholder="Ex: 07 00 00 00 00" className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                {/* DATE DE NAISSANCE & GENRE */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-600">Naissance</label>
                    <div className="relative flex items-center">
                      <Calendar size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                      <input type="date" required className="bg-gray-50 pl-11 pr-2 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium text-sm" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-600">Genre</label>
                    <div className="relative flex items-center">
                      <Users size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                      <select required className="bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium text-sm appearance-none" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Genre</option>
                        <option value="M">Homme</option>
                        <option value="F">Femme</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* EMAIL */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Adresse e-mail</label>
              <div className="relative flex items-center">
                <Mail size={20} className="absolute left-4 text-gray-400" />
                <input type="email" required placeholder="vous@email.com" className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            {/* MOT DE PASSE */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Mot de passe</label>
              <div className="relative flex items-center">
                <Lock size={20} className="absolute left-4 text-gray-400" />
                <input type="password" required placeholder="••••••••" minLength={6} className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full text-white font-black text-lg py-4 rounded-2xl mt-4 transition duration-300 shadow-lg ${loading ? 'bg-gray-400' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}>
              {loading ? "Chargement..." : (isLogin ? "Se connecter" : "Suivant : Vérifier mon identité")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-yamo-orange font-bold hover:underline">
              {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}