"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Calendar, User, PlusCircle, ShieldCheck, 
  SmartphoneNfc, PiggyBank, LogOut, ChevronDown, 
  Car, MessageSquare, CreditCard, Ticket, ArrowRight,
  Share2, MapPin, History, Clock, Users, Navigation, Compass
} from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import NotificationBell from "@/components/NotificationBell";

// --- COMPOSANT INTELLIGENT D'AUTO-COMPLÉTION ---
function LocationAutocomplete({ placeholder, value, onChange, dotColor, borderClass }: any) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('yamoh_search_history') || '[]');
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
    localStorage.setItem('yamoh_search_history', JSON.stringify(newHistory));
  };

  return (
    <div className={`flex items-center flex-1 px-6 py-5 w-full relative transition group ${borderClass}`} ref={wrapperRef}>
      <div className={`w-5 h-5 rounded-full border-[3px] mr-4 transition ${dotColor}`}></div>
      <input 
        type="text" 
        placeholder={placeholder} 
        className="outline-none w-full text-lg text-gray-800 placeholder-gray-400 font-bold bg-transparent" 
        value={value} 
        onChange={(e) => {
          fetchSuggestions(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />

      {showDropdown && (value.length > 0 || history.length > 0) && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {value.length === 0 && history.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-bold text-gray-400 uppercase ml-4 mb-2 mt-2">Recherches récentes</p>
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
              <p className="text-xs font-bold text-gray-400 uppercase ml-4 mb-2 mt-2">Lieux trouvés</p>
              {loading ? (
                <div className="px-4 py-3 text-gray-500 font-medium text-sm italic">Recherche en cours...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <div key={idx} onClick={() => handleSelect(item.display_name.split(',')[0])} className="flex items-start gap-3 px-4 py-3 hover:bg-[#E8F4F8] cursor-pointer rounded-xl transition group/item">
                    <MapPin size={20} className="text-yamo-teal mt-0.5 opacity-50 group-hover/item:opacity-100 transition" />
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

export default function Home() {
  const router = useRouter();

  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [passagers, setPassagers] = useState("1");
  
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ÉTAT POUR LES TRAJETS EN TEMPS RÉEL
  const [liveTrips, setLiveTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // --- NOUVEAU : WIDGET GPS CHAUFFEUR ---
  const [activeTrip, setActiveTrip] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkActiveTrip(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkActiveTrip(session.user);
      else setActiveTrip(null);
    });

    // --- RÉCUPÉRATION DES TRAJETS DEPUIS SUPABASE ---
    const fetchLiveTrips = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('trajets')
        .select('*')
        .gte('date_depart', today)
        // On ne montre que les trajets prévus ou en cours sur l'accueil, pas ceux terminés
        .neq('statut_course', 'termine') 
        .order('date_depart', { ascending: true })
        .limit(6); 

      if (data && !error) {
        setLiveTrips(data);
      }
      setLoadingTrips(false);
    };

    fetchLiveTrips();

    return () => subscription.unsubscribe();
  }, []);

  // --- VÉRIFIER SI LE CHAUFFEUR A UNE COURSE EN COURS ---
  const checkActiveTrip = async (currentUser: any) => {
    if (currentUser?.user_metadata?.role !== 'chauffeur') return;
    
    const { data } = await supabase
      .from('trajets')
      .select('id, depart, destination')
      .eq('user_id', currentUser.id)
      .eq('statut_course', 'en_cours')
      .single(); // Un chauffeur ne peut avoir qu'une seule course en cours

    if (data) setActiveTrip(data);
  };

  const handleSearch = () => {
    if (!depart || !destination) {
      alert("Dites-nous où vous allez pour qu'on cherche vos chauffeurs !");
      return;
    }
    router.push(`/recherche?depart=${encodeURIComponent(depart)}&destination=${encodeURIComponent(destination)}&date=${date}&passagers=${passagers}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    alert("À la prochaine sur Yamoh !");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date à préciser";
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* ANIMATIONS CSS GLOBALES POUR L'ACCUEIL */}
      <style>{`
        @keyframes drive {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(100vw); }
        }
        .animate-drive {
          animation: drive 18s linear infinite;
        }
        .city-skyline {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 200'%3E%3Cpath fill='%23166C82' d='M0,200 L0,150 L50,150 L50,100 L90,100 L90,160 L140,160 L140,80 L200,80 L200,120 L250,120 L250,60 L300,60 L300,140 L350,140 L350,90 L420,90 L420,150 L480,150 L480,40 L530,40 L530,130 L600,130 L600,70 L650,70 L650,160 L700,160 L700,110 L760,110 L760,140 L820,140 L820,80 L880,80 L880,150 L950,150 L950,100 L1000,100 L1000,200 Z'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          background-size: 800px 100%;
          background-position: bottom;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .animate-radar {
          animation: pulse-ring 2s infinite cubic-bezier(0.66, 0, 0, 1);
        }
      `}</style>

      {/* --- HEADER --- */}
      <header className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
           <img 
             src="/Yamo_Logo.png" 
             alt="Yamo Logo" 
             className="h-20 md:h-28 w-auto object-contain cursor-pointer transition-transform hover:scale-105" 
           />
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/publier" className="hidden md:flex items-center gap-2 text-yamo-teal font-bold hover:bg-gray-50 px-4 py-2 rounded-full transition">
            <PlusCircle size={20} />
            Proposer un trajet
          </Link>

          {user ? (
            <div className="flex items-center gap-3 relative">
              <NotificationBell userId={user.id} />
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-gray-100 border border-gray-200 transition cursor-pointer"
                >
                  <div className="w-10 h-10 bg-yamo-teal rounded-full flex items-center justify-center text-white text-sm font-bold shadow-inner">
                    {user.user_metadata?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-2 animate-in fade-in zoom-in duration-150">
                    <Link href="/publier" className="px-6 py-3 hover:bg-gray-50 flex md:hidden items-center gap-3 text-yamo-teal font-black transition border-b border-gray-50" onClick={() => setShowUserMenu(false)}>
                      <PlusCircle size={18} /> Proposer un trajet
                    </Link>
                    <Link href="/dashboard" className="px-6 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition" onClick={() => setShowUserMenu(false)}><Car size={18} /> Vos trajets</Link>
                    <Link href="/mes-trajets" className="px-6 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition" onClick={() => setShowUserMenu(false)}><Ticket size={18} /> Mes billets</Link>
                    <Link href="/messages" className="px-6 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition" onClick={() => setShowUserMenu(false)}><MessageSquare size={18} /> Messages</Link>
                    <Link href="/profil" className="px-6 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition border-b border-gray-50" onClick={() => setShowUserMenu(false)}><User size={18} /> Profil</Link>
                    <Link href="/paiements" className="px-6 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition" onClick={() => setShowUserMenu(false)}><CreditCard size={18} /> Paiements</Link>
                    <button onClick={handleLogout} className="px-6 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 font-bold w-full text-left transition border-t border-gray-50"><LogOut size={18} /> Déconnexion</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/connexion">
              <button className="flex items-center gap-2 text-yamo-teal font-bold hover:bg-gray-100 p-3 rounded-full transition cursor-pointer">
                <User size={24} />
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative flex flex-col items-center justify-center pt-16 pb-32 bg-[#E8F4F8] px-4 text-center overflow-hidden">
        
        <div className="absolute bottom-0 left-0 w-full h-48 city-skyline opacity-10 pointer-events-none"></div>

        <div className="absolute bottom-12 left-0 animate-drive pointer-events-none z-10">
          <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 30 C 15 30, 15 15, 30 15 L 45 5 L 75 5 L 90 20 C 95 20, 95 30, 95 30 Z" fill="#166C82"/>
            <circle cx="35" cy="30" r="8" fill="#D55A1A"/>
            <circle cx="75" cy="30" r="8" fill="#D55A1A"/>
            <path d="M 47 7 L 68 7 L 82 18 L 47 18 Z" fill="#E8F4F8"/>
          </svg>
        </div>

        <h1 className="relative z-20 text-4xl md:text-5xl lg:text-7xl font-extrabold text-yamo-teal mb-12 max-w-4xl tracking-tight leading-[1.1]">
          On fait la route ensemble.
        </h1>

        {/* NOUVEAU : WIDGET GPS CHAUFFEUR EN COURS */}
        {activeTrip && (
          <div className="relative z-30 bg-green-50 border-2 border-green-500 rounded-[2rem] p-6 w-full max-w-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center animate-radar shadow-lg">
                <Navigation size={28} className="animate-pulse" />
              </div>
              <div>
                <p className="text-green-700 font-black uppercase text-xs tracking-widest mb-1">Course en direct</p>
                <h3 className="text-xl font-black text-gray-900 line-clamp-1">{activeTrip.destination.split(',')[0]}</h3>
                <p className="text-sm font-bold text-gray-500">Depuis {activeTrip.depart.split(',')[0]}</p>
              </div>
            </div>
            <Link href="/dashboard" className="w-full md:w-auto">
              <button className="w-full bg-gray-900 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition shadow-xl">
                <Compass size={20} /> Gérer ma course
              </button>
            </Link>
          </div>
        )}

        <div className="relative z-30 bg-white rounded-3xl md:rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center w-full max-w-5xl border border-white/50">
          
          <LocationAutocomplete 
            placeholder="Départ (ex: Angré)" 
            value={depart} 
            onChange={setDepart} 
            dotColor="border-gray-300 group-focus-within:border-yamo-teal"
            borderClass="border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 rounded-t-2xl md:rounded-l-full"
          />

          <LocationAutocomplete 
            placeholder="Destination (ex: Plateau)" 
            value={destination} 
            onChange={setDestination} 
            dotColor="border-yamo-orange"
            borderClass="border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50"
          />

          <div className="flex items-center px-6 py-5 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 transition">
            <Calendar size={24} className="text-gray-400 mr-3" />
            <input type="date" className="outline-none text-lg text-gray-800 font-bold bg-transparent cursor-pointer" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-center px-6 py-5 w-full md:w-auto hover:bg-gray-50 transition">
            <User size={24} className="text-gray-400 mr-3" />
            <select className="outline-none text-lg text-gray-800 font-bold bg-transparent cursor-pointer appearance-none" value={passagers} onChange={(e) => setPassagers(e.target.value)}>
              {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n > 1 ? 'passagers' : 'passager'}</option>)}
            </select>
          </div>
          <button onClick={handleSearch} className="w-full md:w-auto bg-yamo-orange hover:bg-[#D55A1A] text-white font-black text-xl px-12 py-5 rounded-2xl md:rounded-full transition mt-2 md:mt-0 md:ml-2 shadow-xl shadow-yamo-orange/30">
            C'est parti !
          </button>
        </div>
      </section>

      {/* --- TRAJETS EN TEMPS RÉEL --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-black text-gray-900 flex items-center gap-3">
              Trajets disponibles
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
              </span>
            </h2>
            <p className="text-gray-500 text-lg mt-2 font-medium">Réservez directement votre place avec nos chauffeurs.</p>
          </div>
        </div>

        {loadingTrips ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-[2.5rem] h-64 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : liveTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveTrips.map((trip) => {
              const lienDepart = trip.depart ? encodeURIComponent(trip.depart.split(',')[0]) : "";
              const lienDest = trip.destination ? encodeURIComponent(trip.destination.split(',')[0]) : "";
              const lienDate = trip.date_depart ? trip.date_depart.split('T')[0] : "";
              
              // On vérifie si le trajet est "en_cours" pour afficher le badge Live
              const isRunning = trip.statut_course === 'en_cours';
              
              return (
                <div key={trip.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group ${isRunning ? 'border-green-500 ring-2 ring-green-50' : 'border-gray-100'}`}>
                  
                  {isRunning && (
                     <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                        <div className="w-2 h-2 bg-white rounded-full"></div> En Route
                     </div>
                  )}
                  
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4 mb-4">
                    <div className="flex items-center gap-2 text-yamo-teal font-bold bg-yamo-teal/10 px-3 py-1.5 rounded-xl text-sm">
                      <Calendar size={16} />
                      <span className="capitalize">{formatDate(trip.date_depart)}</span>
                    </div>
                    {trip.heure_depart && (
                      <div className="flex items-center gap-1.5 text-yamo-orange font-black">
                        <Clock size={16} />
                        {trip.heure_depart.substring(0, 5)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mb-6 relative">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3.5 h-3.5 rounded-full border-[3px] border-gray-300"></div>
                      <div className="w-0.5 h-10 bg-gray-200 my-1"></div>
                      <div className="w-3.5 h-3.5 rounded-full border-[3px] border-yamo-orange"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg mb-4 line-clamp-1">{trip.depart.split(',')[0]}</p>
                      <p className="font-bold text-gray-900 text-lg line-clamp-1">{trip.destination.split(',')[0]}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-yamo-teal font-black">
                        {trip.conducteur_nom ? trip.conducteur_nom.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{trip.conducteur_nom || "Conducteur"}</p>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Users size={12}/> {trip.places_disponibles} places
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <p className="text-2xl font-black text-yamo-teal">{trip.prix} <span className="text-sm font-bold">FCFA</span></p>
                      <Link href={`/recherche?depart=${lienDepart}&destination=${lienDest}&date=${lienDate}&passagers=1`}>
                        <button className="mt-2 text-sm bg-gray-50 text-yamo-teal font-bold px-4 py-2 rounded-xl group-hover:bg-yamo-teal group-hover:text-white transition">
                          Réserver
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#E8F4F8] rounded-[3rem] p-12 text-center border border-yamo-teal/10">
            <Car size={64} className="mx-auto text-yamo-teal opacity-50 mb-4" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Soyez le premier à publier !</h3>
            <p className="text-gray-600 text-lg mb-6">Il n'y a pas encore de trajet programmé aujourd'hui.</p>
            <Link href="/publier">
              <button className="bg-yamo-teal text-white font-bold px-8 py-4 rounded-full shadow-lg hover:bg-[#115566] transition">
                Proposer mon trajet
              </button>
            </Link>
          </div>
        )}
      </section>

      {/* --- CONFIANCE & CHOIX --- */}
      <section className="py-24 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
            <div className="flex flex-col items-start gap-6 group hover:-translate-y-1 transition-transform duration-300">
              <div className="p-5 bg-white rounded-3xl shadow-sm group-hover:shadow-md transition-shadow"><ShieldCheck size={48} className="text-yamo-teal group-hover:scale-110 transition-transform" /></div>
              <h3 className="text-2xl font-black text-gray-900">Zéro "On dit", que du vrai</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">On check les profils, les avis et les CNI. Tu sais avec qui tu montes en voiture.</p>
            </div>
            <div className="flex flex-col items-start gap-6 group hover:-translate-y-1 transition-transform duration-300">
              <div className="p-5 bg-white rounded-3xl shadow-sm group-hover:shadow-md transition-shadow"><SmartphoneNfc size={48} className="text-yamo-teal group-hover:scale-110 transition-transform" /></div>
              <h3 className="text-2xl font-black text-gray-900">Payez par Mobile Money</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">Wave, Orange Money ou MTN... Réglez sans palabres avant même d'arriver.</p>
            </div>
            <div className="flex flex-col items-start gap-6 group hover:-translate-y-1 transition-transform duration-300">
              <div className="p-5 bg-white rounded-3xl shadow-sm group-hover:shadow-md transition-shadow"><PiggyBank size={48} className="text-yamo-teal group-hover:scale-110 transition-transform" /></div>
              <h3 className="text-2xl font-black text-gray-900">Économisez gros</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">Partagez l'essence avec les autres. C'est cadeau pour ton portefeuille !</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-16 text-center">Choisis ton wé, on gère le reste !</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm flex items-center gap-8 border border-gray-100 hover:border-yamo-teal hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
              <div className="bg-[#E8F4F8] p-6 rounded-[2rem] text-yamo-teal group-hover:bg-yamo-teal group-hover:text-white transition-all"><Car size={40}/></div>
              <div className="flex-1">
                <h4 className="text-2xl font-black">Trajet Express</h4>
                <p className="text-gray-500 font-medium italic text-lg">Un gombo urgent ou une course ? On part ensemble, c'est moins cher !</p>
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-yamo-teal group-hover:translate-x-2 transition-all" size={32} />
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] shadow-sm flex items-center gap-8 border border-gray-100 hover:border-yamo-teal hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
              <div className="bg-[#FFF0E8] p-6 rounded-[2rem] text-yamo-orange group-hover:bg-yamo-orange group-hover:text-white transition-all"><Calendar size={40}/></div>
              <div className="flex-1">
                <h4 className="text-2xl font-black">Pass Boulot-Dodo</h4>
                <p className="text-gray-500 font-medium italic text-lg">Fini les rangs à la gare ! Abonne-toi pour toute la semaine avec ton voisin.</p>
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-yamo-orange group-hover:translate-x-2 transition-all" size={32} />
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-white pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1">
            <img src="/Yamo_Logo.png" className="h-24 brightness-200 mb-8" alt="Logo White" />
            <p className="text-gray-400 font-medium leading-relaxed text-lg">Le covoiturage n°1 au pays. Voyagez malin, voyagez ensemble.</p>
          </div>
          <div>
            <h5 className="font-black text-xl mb-8 tracking-tight">Yamoh</h5>
            <ul className="space-y-5 text-gray-400 font-bold text-lg">
              <li><Link href="#" className="hover:text-yamo-orange hover:translate-x-1 inline-block transition-transform">Qui sommes-nous ?</Link></li>
              <li><Link href="/publier" className="hover:text-yamo-orange hover:translate-x-1 inline-block transition-transform">Proposer un trajet</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-xl mb-8 tracking-tight">Légal</h5>
            <ul className="space-y-5 text-gray-400 font-bold text-lg">
              <li><Link href="#" className="hover:text-yamo-orange hover:translate-x-1 inline-block transition-transform">CGV</Link></li>
              <li><Link href="#" className="hover:text-yamo-orange hover:translate-x-1 inline-block transition-transform">Confidentialité</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-xl mb-8 tracking-tight">Suivez-nous</h5>
            <div className="flex gap-5">
              <div className="bg-white/10 p-4 rounded-full hover:bg-yamo-orange hover:scale-110 transition-all cursor-pointer shadow-lg"><Share2 size={24}/></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-white/10 text-center text-gray-500 font-bold">
          © 2026 Yamoh Côte d'Ivoire. Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}