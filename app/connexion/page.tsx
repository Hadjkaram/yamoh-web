"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Connexion() {
  const router = useRouter();
  
  // États pour gérer le formulaire
  const [isLogin, setIsLogin] = useState(true); // true = Connexion, false = Inscription
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Utilisé uniquement pour l'inscription
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (isLogin) {
      // --- LOGIQUE DE CONNEXION ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setErrorMsg(error.message);
      else router.push("/"); // Redirection vers l'accueil si succès
      
    } else {
      // --- LOGIQUE D'INSCRIPTION ---
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name, // On sauvegarde le nom dans le profil Supabase
          }
        }
      });
      if (error) setErrorMsg(error.message);
      else {
        alert("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        setIsLogin(true); // On bascule sur l'écran de connexion
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
        <h1 className="text-xl font-bold text-yamo-teal">
          yamoh
        </h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
            {isLogin ? "Bon retour !" : "Rejoignez Yamoh"}
          </h2>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            
            {!isLogin && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-600">Nom complet</label>
                <div className="relative flex items-center">
                  <UserIcon size={20} className="absolute left-4 text-gray-400" />
                  <input type="text" required placeholder="Ex: Amadou K." className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Adresse e-mail</label>
              <div className="relative flex items-center">
                <Mail size={20} className="absolute left-4 text-gray-400" />
                <input type="email" required placeholder="vous@email.com" className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Mot de passe</label>
              <div className="relative flex items-center">
                <Lock size={20} className="absolute left-4 text-gray-400" />
                <input type="password" required placeholder="••••••••" minLength={6} className="bg-gray-50 pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-yamo-teal w-full font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full text-white font-bold text-lg py-4 rounded-xl mt-4 transition duration-300 ${loading ? 'bg-gray-400' : 'bg-yamo-teal hover:bg-[#115566]'}`}>
              {loading ? "Chargement..." : (isLogin ? "Se connecter" : "S'inscrire")}
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