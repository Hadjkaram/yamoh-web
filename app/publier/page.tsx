"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, Car, User, Coins, MapPin, History, 
  Calendar, Clock, PartyPopper, CalendarDays, Repeat, Snowflake, 
  Briefcase, AlertCircle, Wallet, RefreshCw 
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// --- COMPOSANT D'AUTO-COMPLÉTION (INCHANGÉ) ---
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
    if (query.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Abidjan, Côte d'Ivoire&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (error) { console.error("Erreur", error); }
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
      <input type="text" required placeholder={placeholder} className="bg-transparent outline-none w-full text-lg font-bold text-gray-800 placeholder-gray-400" value={value} onChange={(e) => { fetchSuggestions(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
      {showDropdown && (value.length > 0 || history.length > 0) && (
        <div className="absolute top-[110%] left-0 w-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {value.length === 0 && history.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-bold text-gray-400 uppercase ml-4 mb-2 mt-2">Lieux récents</p>
              {history.map((histItem, idx) => (
                <div key={idx} onClick={() => handleSelect(histItem)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-xl transition">
                  <History size={18} className="text-gray-400" /> <span className="font-medium text-gray-700">{histItem}</span>
                </div>
              ))}
            </div>
          )}
          {value.length >= 2 && (
            <div className="p-2">
              <p className="text-xs font-bold text-gray-400 uppercase ml-4 mb-2 mt-2">Suggestions</p>
              {loading ? <div className="px-4 py-3 text-gray-500 font-medium text-sm italic">Recherche...</div> : suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <div key={idx} onClick={() => handleSelect(item.display_name.split(',')[0])} className="flex items-start gap-3 px-4 py-3 hover:bg-[#E8F4F8] cursor-pointer rounded-xl transition group/item">
                    <MapPin size={20} className="text-yamo-teal mt-0.5 opacity-50 group-hover/item:opacity-100 transition flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">{item.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.display_name.split(',').slice(1).join(',')}</p>
                    </div>
                  </div>
                ))
              ) : <div className="px-4 py-3 text-gray-500 font-medium text-sm italic">Aucun lieu trouvé</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const JOURS_SEMAINE = [
  { id: 'lun', label: 'L' }, { id: 'mar', label: 'M' }, { id: 'mer', label: 'M' },
  { id: 'jeu', label: 'J' }, { id: 'ven', label: 'V' }, { id: 'sam', label: 'S' }, { id: 'dim', label: 'D' }
];

export default function PublierTrajet() {
  const router = useRouter();
  
  // ÉTATS GLOBAUX
  const [typeTrajet, setTypeTrajet] = useState<"quotidien" | "evenement">("quotidien");
  const [isRecurring, setIsRecurring] = useState(false);
  const [joursReguliers, setJoursReguliers] = useState<string[]>([]);
  const [nomEvenement, setNomEvenement] = useState("");
  const [climatise, setClimatise] = useState(false);
  const [bagages, setBagages] = useState(false);

  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [prix, setPrix] = useState("");
  const [places, setPlaces] = useState("3");
  const [vehicule, setVehicule] = useState("");
  
  const [dateDepart, setDateDepart] = useState(new Date().toISOString().split('T')[0]);
  const [heureDepart, setHeureDepart] = useState("");
  const [lieuRdv, setLieuRdv] = useState("");
  
  const [user, setUser] = useState<any>(null);
  
  const [solde, setSolde] = useState<number>(0); 
  const [soldeLoading, setSoldeLoading] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // --- FONCTION DE RÉCUPÉRATION ISOLÉE POUR FORCER L'ACTUALISATION ---
  const fetchUserData = async () => {
    setSoldeLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/connexion'); 
      return;
    } 
    
    setUser(session.user);
    
    // On force la lecture directe dans Supabase (bypass cache)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('vehicule_marque, vehicule_couleur, solde_wallet')
      .eq('id', session.user.id)
      .single();
      
    if (profileData) {
      setSolde(Number(profileData.solde_wallet) || 0);
      const infosVehicule = [profileData.vehicule_marque, profileData.vehicule_couleur].filter(Boolean).join(" - ");
      if (infosVehicule) setVehicule(infosVehicule);
    }
    
    setAuthChecking(false);
    setSoldeLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [router]);

  const toggleJour = (jourId: string) => {
    setJoursReguliers(prev => prev.includes(jourId) ? prev.filter(j => j !== jourId) : [...prev, jourId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (solde < 100) {
        alert("Action impossible : Votre portefeuille Yamoh est insuffisant. Vous devez le recharger pour publier un trajet.");
        return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('trajets')
      .insert([
        { 
          depart, destination, prix: parseInt(prix), places_disponibles: parseInt(places),
          conducteur_nom: user?.user_metadata?.full_name || "Conducteur",
          vehicule, user_id: user?.id, date_depart: dateDepart, heure_depart: heureDepart, lieu_rendez_vous: lieuRdv,
          type_trajet: typeTrajet,
          nom_evenement: typeTrajet === 'evenement' ? nomEvenement : null,
          jours_reguliers: isRecurring ? joursReguliers.join(',') : null,
          climatise: climatise,
          bagages: bagages
        }
      ]);

    setLoading(false);

    if (error) {
      alert("Erreur lors de la publication : " + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => { router.push('/'); }, 2000);
    }
  };

  if (authChecking || soldeLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-yamo-teal">Vérification de votre compte...</div>;

  if (success) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black text-yamo-teal mb-2">Trajet en ligne !</h1>
        <p className="text-gray-500 text-lg">Votre annonce est visible par toute la communauté.</p>
      </main>
    );
  }

  const isSoldeInsuffisant = solde < 100;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/"><ArrowLeft size={24} className="text-gray-600 hover:text-black transition" /></Link>
          <h1 className="text-xl font-bold text-yamo-teal">Proposer un trajet</h1>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full mt-4">
        
        {/* ALERTE SOLDE INSUFFISANT */}
        {isSoldeInsuffisant && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] mb-8 animate-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <div className="bg-red-500 text-white p-2 rounded-full flex-shrink-0"><AlertCircle size={24}/></div>
              <div className="flex-1">
                <h3 className="font-black text-red-900 text-lg">Votre portefeuille est vide !</h3>
                <p className="text-red-700 font-medium text-sm mt-1">Vous devez recharger au moins 100 FCFA sur votre compte Yamoh pour publier des annonces et débloquer ce formulaire.</p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link href="/recharge" className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-red-600 transition shadow-lg shadow-red-500/20">
                    <Wallet size={16}/> Recharger
                  </Link>
                  {/* LE NOUVEAU BOUTON D'ACTUALISATION FORCÉE */}
                  <button onClick={fetchUserData} className="inline-flex items-center gap-2 bg-white text-red-600 px-5 py-3 rounded-xl font-black text-sm border-2 border-red-100 hover:bg-red-50 transition">
                    <RefreshCw size={16} className={soldeLoading ? "animate-spin" : ""} />
                    {soldeLoading ? "Vérification..." : "J'ai rechargé"}
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 mb-6">
          <button 
            type="button"
            onClick={() => { setTypeTrajet("quotidien"); setIsRecurring(false); }}
            className={`flex-1 p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-lg transition-all ${typeTrajet === "quotidien" ? 'bg-yamo-teal text-white shadow-lg shadow-yamo-teal/20 scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
          >
            <Car size={24}/> Quotidien
          </button>
          <button 
            type="button"
            onClick={() => { setTypeTrajet("evenement"); setIsRecurring(false); }}
            className={`flex-1 p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-lg transition-all ${typeTrajet === "evenement" ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
          >
            <PartyPopper size={24}/> Événement
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-8 ${isSoldeInsuffisant ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          
          {typeTrajet === "evenement" && (
            <div className="bg-purple-50 border border-purple-100 p-6 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
              <h3 className="font-black text-purple-900 mb-2 flex items-center gap-2"><PartyPopper size={20}/> Détails de l'événement</h3>
              <p className="text-purple-700 text-sm mb-4 font-medium">Concert, match de la CAN, festival... Proposez un covoiturage dédié !</p>
              <input type="text" required={typeTrajet === 'evenement'} placeholder="Nom de l'événement (ex: Concert au Palais de la Culture)" className="w-full bg-white p-4 rounded-xl border border-purple-200 outline-none focus:border-purple-600 font-bold text-gray-800" value={nomEvenement} onChange={(e) => setNomEvenement(e.target.value)} />
            </div>
          )}

          <div>
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><MapPin size={20} className="text-yamo-teal"/> Itinéraire</h3>
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-[1.35rem] top-10 bottom-10 w-1 bg-gray-100 z-0"></div>
              <FormLocationAutocomplete placeholder="Départ (ex: Riviera Palmeraie)" value={depart} onChange={setDepart} dotColor="border-gray-300" focusColor="yamo-teal" />
              <FormLocationAutocomplete placeholder="Arrivée (ex: Plateau)" value={destination} onChange={setDestination} dotColor="border-yamo-orange" focusColor="yamo-orange" />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-500 uppercase">Lieu précis de prise en charge</label>
              <input type="text" required placeholder="Ex: Devant la pharmacie..." className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-medium" value={lieuRdv} onChange={(e) => setLieuRdv(e.target.value)} />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 flex items-center gap-2"><Calendar size={20} className="text-yamo-teal"/> Programmation</h3>
            </div>

            {typeTrajet === "quotidien" && (
              <div className="flex bg-gray-50 p-1 rounded-2xl mb-6 border border-gray-100">
                <button type="button" onClick={() => setIsRecurring(false)} className={`flex-1 py-3 text-sm font-black rounded-xl transition ${!isRecurring ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Trajet Unique</button>
                <button type="button" onClick={() => setIsRecurring(true)} className={`flex-1 py-3 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${isRecurring ? 'bg-white text-yamo-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Repeat size={16}/> Régulier (Semaine)</button>
              </div>
            )}

            {isRecurring ? (
              <div className="animate-in fade-in">
                <label className="text-sm font-bold text-gray-500 uppercase mb-3 block">Quels jours faites-vous ce trajet ?</label>
                <div className="flex justify-between gap-2 mb-6">
                  {JOURS_SEMAINE.map((jour) => (
                    <button type="button" key={jour.id} onClick={() => toggleJour(jour.id)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full font-black flex items-center justify-center transition-all ${joursReguliers.includes(jour.id) ? 'bg-yamo-teal text-white scale-110 shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {jour.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-500 uppercase">{isRecurring ? "À partir du" : "Date du départ"}</label>
                <div className="relative flex items-center">
                  <CalendarDays size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                  <input type="date" required className="bg-gray-50 pl-11 pr-2 py-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal w-full font-bold text-gray-800" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-500 uppercase">Heure de départ</label>
                <div className="relative flex items-center">
                  <Clock size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                  <input type="time" required className="bg-gray-50 pl-11 pr-2 py-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal w-full font-bold text-gray-800" value={heureDepart} onChange={(e) => setHeureDepart(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><Car size={20} className="text-yamo-teal"/> Détails & Confort</h3>
            
            <input type="text" required placeholder="Votre Véhicule (ex: Toyota Corolla)" className="bg-gray-50 w-full p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-lg font-medium mb-4" value={vehicule} onChange={(e) => setVehicule(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button type="button" onClick={() => setClimatise(!climatise)} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${climatise ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>
                <Snowflake size={24} className={climatise ? 'animate-pulse' : ''} />
                <span className="font-black text-sm">Climatisé</span>
              </button>
              <button type="button" onClick={() => setBagages(!bagages)} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${bagages ? 'border-yamo-orange bg-orange-50 text-yamo-orange' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>
                <Briefcase size={24} />
                <span className="font-black text-sm">Accepte Bagages</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><Coins size={16}/> Prix (FCFA)</label>
                <input type="number" required placeholder="1500" className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-xl font-black text-yamo-orange" value={prix} onChange={(e) => setPrix(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-gray-500 uppercase flex items-center gap-2"><User size={16}/> Places</label>
                <select className="bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal text-xl font-bold appearance-none" value={places} onChange={(e) => setPlaces(e.target.value)}>
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || isSoldeInsuffisant} className={`w-full text-white font-black text-xl py-5 rounded-[1.5rem] shadow-xl transition duration-300 mt-2 ${isSoldeInsuffisant ? 'bg-gray-400 cursor-not-allowed' : loading ? 'bg-gray-300' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}>
            {loading ? "Chargement..." : isSoldeInsuffisant ? "Rechargez pour publier" : "Publier mon annonce"}
          </button>
        </form>
        
        {isSoldeInsuffisant && (
            <p className="text-center text-gray-400 font-bold mt-6 italic">Rechargez votre portefeuille pour débloquer ce formulaire.</p>
        )}
      </div>
    </main>
  );
}