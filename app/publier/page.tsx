"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Car, User, Coins, MapPin, History } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// --- COMPOSANT D'AUTO-COMPLÉTION ADAPTÉ POUR LE FORMULAIRE ---
function FormLocationAutocomplete({ placeholder, value, onChange, dotColor, focusColor }: any) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('yamoh_publish_history') || '[]');
    setHistory(savedHistory);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    onChange(query);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Abidjan, Côte d'Ivoire&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Erreur de recherche d'adresse", error);
    }
    setLoading(false);
  };

  const handleSelect = (adresse: string) => {
    onChange(adresse);
    setShowDropdown(false);
    const newHistory = [adresse, ...history.filter(h => h !== adresse)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('yamoh_publish_history', JSON.stringify(newHistory));
  };

  return (
    <div className={`relative z-10 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 transition focus-within:border-${focusColor}`} ref={wrapperRef}>
      <div className={`w-4 h-4 rounded-full border-4 ${dotColor} bg-white flex-shrink-0`}></div>
      <input 
        type="text" 
        required 
        placeholder={placeholder} 
        className="bg-transparent outline-none w-full text-lg font-bold text-gray-800 placeholder-gray-400" 
        value={value} 
        onChange={(e) => {
          fetchSuggestions(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />

      {showDropdown && (value.length > 0 || history.length > 0) && (
        <div className="absolute top-[110%] left-0 w-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {value.length === 0 && history.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-bold text-gray-400 uppercase ml-4 mb-2 mt-2">Lieux récents</p>
              {history.map((histItem, idx) => (
                <div key={idx} onClick={() => handleSelect(histItem)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-xl transition">
                  <History size={18} className="text-gray-400" />
                  <span className="font-medium text-gray-700">{histItem}</span>
                </div>
              ))}
            </div>
          )}

          {value.length >= 2 && (
            <div className="p-2">
              <p className="text-xs font-bold text-gray-400 uppercase ml-4 mb-2 mt-2">Suggestions</p>
              {loading ? (
                <div className="px-4 py-3 text-gray-500 font-medium text-sm italic">Recherche en cours...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <div key={idx} onClick={() => handleSelect(item.display_name.split(',')[0])} className="flex items-start gap-3 px-4 py-3 hover:bg-[#E8F4F8] cursor-pointer rounded-xl transition group/item">
                    <MapPin size={20} className="text-yamo-teal mt-0.5 opacity-50 group-hover/item:opacity-100 transition flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">{item.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.display_name.split(',').slice(1).join(',')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 font-medium text-sm italic">Aucun lieu trouvé pour "{value}"</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/connexion'); 
      } else {
        setUser(session.user);
        
        // RECUPERATION DES DONNEES DU VEHICULE DEPUIS LE PROFIL
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('vehicule_marque, vehicule_couleur, vehicule_plaque')
          .eq('id', session.user.id)
          .single();

        if (profileData && !profileError) {
          // On assemble les informations si elles existent (Ex: "Toyota Corolla - Gris - 1234 AB 01")
          const infosVehicule = [
            profileData.vehicule_marque, 
            profileData.vehicule_couleur, 
            profileData.vehicule_plaque
          ].filter(Boolean).join(" - ");

          if (infosVehicule) {
            setVehicule(infosVehicule);
          }
        }
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
          user_id: user?.id
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
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-yamo-teal/20 shadow-sm">
               <User size={20} className="text-yamo-teal" />
            </div>
            <p className="font-bold text-yamo-teal">Publication en tant que : {user?.user_metadata?.full_name}</p>
          </div>

          <div className="flex flex-col gap-4 relative">
            <div className="absolute left-[1.35rem] top-10 bottom-10 w-1 bg-gray-100 z-0"></div>
            
            <FormLocationAutocomplete 
              placeholder="Départ (ex: Riviera Palmeraie)"
              value={depart}
              onChange={setDepart}
              dotColor="border-gray-300"
              focusColor="yamo-teal"
            />

            <FormLocationAutocomplete 
              placeholder="Arrivée (ex: Plateau)"
              value={destination}
              onChange={setDestination}
              dotColor="border-yamo-orange"
              focusColor="yamo-orange"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><Car size={16}/> Votre Véhicule</label>
            <input type="text" required placeholder="Ex: Toyota Corolla (Climatisé)" className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-medium" value={vehicule} onChange={(e) => setVehicule(e.target.value)} />
            <p className="text-xs text-gray-400">Rempli automatiquement avec vos informations de profil.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><Coins size={16}/> Prix (FCFA)</label>
              <input type="number" required placeholder="1500" className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-black text-yamo-orange" value={prix} onChange={(e) => setPrix(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><User size={16}/> Places</label>
              <select className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-bold appearance-none" value={places} onChange={(e) => setPlaces(e.target.value)}>
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