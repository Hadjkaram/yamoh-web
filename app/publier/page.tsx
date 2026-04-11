"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Car, User, Coins } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PublierTrajet() {
  const router = useRouter();
  
  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [prix, setPrix] = useState("");
  const [places, setPlaces] = useState("3");
  const [vehicule, setVehicule] = useState("");
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/connexion'); 
      } else {
        setUser(session.user);
      }
      setAuthChecking(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('trajets')
      .insert([
        { 
          depart: depart, 
          destination: destination, 
          prix: parseInt(prix), 
          places_disponibles: parseInt(places),
          conducteur_nom: user?.user_metadata?.full_name || "Conducteur",
          vehicule: vehicule,
          user_id: user?.id // LIEN CRUCIAL : On enregistre qui a publié le trajet
        }
      ]);

    setLoading(false);

    if (error) {
      alert("Erreur lors de la publication : " + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  if (authChecking) return <div className="min-h-screen flex items-center justify-center font-bold text-yamo-teal">Vérification...</div>;

  if (success) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black text-yamo-teal mb-2">Trajet en ligne !</h1>
        <p className="text-gray-500 text-lg">Votre annonce est visible par toute la communauté.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-50">
        <Link href="/">
          <ArrowLeft size={24} className="text-gray-600 hover:text-black transition" />
        </Link>
        <h1 className="text-xl font-bold text-yamo-teal">Proposer un trajet</h1>
      </header>

      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full mt-6">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-6">
          
          <div className="bg-yamo-teal/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-yamo-teal/20">
               <User size={20} className="text-yamo-teal" />
            </div>
            <p className="font-bold text-yamo-teal">Publication en tant que : {user?.user_metadata?.full_name}</p>
          </div>

          <div className="flex flex-col gap-4 relative">
            <div className="absolute left-[1.1rem] top-8 bottom-8 w-1 bg-gray-100 z-0"></div>
            <div className="relative z-10 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-yamo-teal transition">
              <div className="w-4 h-4 rounded-full border-4 border-gray-300 bg-white"></div>
              <input type="text" required placeholder="Départ" className="bg-transparent outline-none w-full text-lg font-bold text-gray-800" value={depart} onChange={(e) => setDepart(e.target.value)} />
            </div>
            <div className="relative z-10 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-yamo-orange transition">
              <div className="w-4 h-4 rounded-full border-4 border-yamo-orange bg-white"></div>
              <input type="text" required placeholder="Arrivée" className="bg-transparent outline-none w-full text-lg font-bold text-gray-800" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><Car size={16}/> Votre Véhicule</label>
            <input type="text" required placeholder="Ex: Toyota Corolla (Climatisé)" className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-medium" value={vehicule} onChange={(e) => setVehicule(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><Coins size={16}/> Prix (FCFA)</label>
              <input type="number" required placeholder="1500" className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-black text-yamo-orange" value={prix} onChange={(e) => setPrix(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><User size={16}/> Places</label>
              <select className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-bold" value={places} onChange={(e) => setPlaces(e.target.value)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full text-white font-black text-xl py-5 rounded-[1.5rem] shadow-xl transition duration-300 mt-4 ${loading ? 'bg-gray-300' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}>
            {loading ? "Chargement..." : "Lancer mon trajet"}
          </button>
        </form>
      </div>
    </main>
  );
}