"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Calendar, User, PlusCircle, ShieldCheck, 
  SmartphoneNfc, PiggyBank, LogOut, ChevronDown, 
  Car, MessageSquare, CreditCard, Ticket, ArrowRight,
  Share2 
} from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import NotificationBell from "@/components/NotificationBell";

export default function Home() {
  const router = useRouter();

  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [passagers, setPassagers] = useState("1");
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = () => {
    if (!depart || !destination) {
      alert("Dites-nous où vous allez pour qu'on cherche vos chauffeurs !");
      return;
    }
    router.push(`/recherche?depart=${depart}&destination=${destination}&date=${date}&passagers=${passagers}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    alert("À la prochaine sur Yamoh !");
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
          /* Génération d'une ville stylisée en SVG direct (Couleur Yamoh Teal) */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 200'%3E%3Cpath fill='%23166C82' d='M0,200 L0,150 L50,150 L50,100 L90,100 L90,160 L140,160 L140,80 L200,80 L200,120 L250,120 L250,60 L300,60 L300,140 L350,140 L350,90 L420,90 L420,150 L480,150 L480,40 L530,40 L530,130 L600,130 L600,70 L650,70 L650,160 L700,160 L700,110 L760,110 L760,140 L820,140 L820,80 L880,80 L880,150 L950,150 L950,100 L1000,100 L1000,200 Z'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          background-size: 800px 100%;
          background-position: bottom;
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
            Publier un trajet
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
                      <PlusCircle size={18} /> Publier un trajet
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

      {/* --- HERO SECTION AVEC ANIMATION VILLE ET VOITURE --- */}
      <section className="relative flex flex-col items-center justify-center pt-16 pb-32 bg-[#E8F4F8] px-4 text-center overflow-hidden">
        
        {/* FOND DE VILLE EN OMBRE YAMOH */}
        <div className="absolute bottom-0 left-0 w-full h-48 city-skyline opacity-10 pointer-events-none"></div>

        {/* VOITURE ANIMÉE QUI ROULE */}
        <div className="absolute bottom-12 left-0 animate-drive pointer-events-none z-10">
          {/* Custom SVG Voiture aux couleurs Yamoh */}
          <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 30 C 15 30, 15 15, 30 15 L 45 5 L 75 5 L 90 20 C 95 20, 95 30, 95 30 Z" fill="#166C82"/> {/* Corps Teal */}
            <circle cx="35" cy="30" r="8" fill="#D55A1A"/> {/* Roue Orange */}
            <circle cx="75" cy="30" r="8" fill="#D55A1A"/> {/* Roue Orange */}
            <path d="M 47 7 L 68 7 L 82 18 L 47 18 Z" fill="#E8F4F8"/> {/* Vitre bleue ciel */}
          </svg>
        </div>

        <h1 className="relative z-20 text-4xl md:text-5xl lg:text-7xl font-extrabold text-yamo-teal mb-12 max-w-4xl tracking-tight leading-[1.1]">
          On fait la route ensemble à Abidjan.
        </h1>

        <div className="relative z-20 bg-white rounded-3xl md:rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center w-full max-w-5xl border border-white/50">
          <div className="flex items-center flex-1 px-6 py-5 w-full border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 rounded-t-2xl md:rounded-l-full transition group">
            <div className="w-5 h-5 rounded-full border-[3px] border-gray-300 mr-4 group-focus-within:border-yamo-teal transition"></div>
            <input type="text" placeholder="Départ (ex: Angré)" className="outline-none w-full text-lg text-gray-800 placeholder-gray-400 font-bold bg-transparent" value={depart} onChange={(e) => setDepart(e.target.value)} />
          </div>
          <div className="flex items-center flex-1 px-6 py-5 w-full border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 transition group">
            <div className="w-5 h-5 rounded-full border-[3px] border-yamo-orange mr-4"></div>
            <input type="text" placeholder="Destination (ex: Plateau)" className="outline-none w-full text-lg text-gray-800 placeholder-gray-400 font-bold bg-transparent" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
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

      {/* --- MEILLEURS PRIX ABIDJAN (AGRANDIS) --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-black text-gray-900 mb-16 text-center">Les trajets les plus demandés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { from: "Yopougon", to: "Plateau", price: "500", img: "/yop_plateau.jpg" },
            { from: "Cocody", to: "Plateau", price: "500", img: "/cocody_plateau.jpg" },
            { from: "Yopougon", to: "Cocody", price: "800", img: "/yop_cocody.jpg" },
            { from: "Bingerville", to: "Plateau", price: "1.000", img: "/binge_plateau.jpg" }
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition duration-500 group">
              <div className="h-64 bg-gray-200 relative overflow-hidden">
                <img 
                  src={item.img} 
                  className="h-full w-full object-cover group-hover:scale-110 transition duration-700" 
                  alt={`${item.from} vers ${item.to}`}
                  onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=800" }} 
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-yamo-teal"></div>
                    <div className="w-[2px] h-6 bg-gray-200"></div>
                    <div className="w-3 h-3 rounded-full border-2 border-yamo-orange"></div>
                  </div>
                  <div className="font-black text-xl text-gray-800">
                    <p>{item.from}</p>
                    <p>{item.to}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                  <div>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest">À partir de</p>
                    <p className="text-3xl font-black text-yamo-teal">{item.price} <span className="text-lg">FCFA</span></p>
                  </div>
                  <button className="bg-yamo-teal text-white p-4 rounded-full group-hover:bg-yamo-orange transition-all shadow-lg shadow-yamo-teal/20 group-hover:shadow-yamo-orange/20"><ArrowRight size={24}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- CONFIANCE & CHOIX --- */}
      <section className="py-24 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
            <div className="flex flex-col items-start gap-6">
              <div className="p-5 bg-white rounded-3xl shadow-sm"><ShieldCheck size={48} className="text-yamo-teal" /></div>
              <h3 className="text-2xl font-black text-gray-900">Zéro "On dit", que du vrai</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">On check les profils, les avis et les CNI. Tu sais avec qui tu montes en voiture.</p>
            </div>
            <div className="flex flex-col items-start gap-6">
              <div className="p-5 bg-white rounded-3xl shadow-sm"><SmartphoneNfc size={48} className="text-yamo-teal" /></div>
              <h3 className="text-2xl font-black text-gray-900">Payez par Mobile Money</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">Wave, Orange Money ou MTN... Réglez sans palabres avant même d'arriver.</p>
            </div>
            <div className="flex flex-col items-start gap-6">
              <div className="p-5 bg-white rounded-3xl shadow-sm"><PiggyBank size={48} className="text-yamo-teal" /></div>
              <h3 className="text-2xl font-black text-gray-900">Économisez gros</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">Partagez l'essence avec les autres. C'est cadeau pour ton portefeuille !</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-16 text-center">On bouge comment aujourd'hui ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm flex items-center gap-8 border border-gray-100 hover:border-yamo-teal transition-all duration-300 cursor-pointer group">
              <div className="bg-[#E8F4F8] p-6 rounded-[2rem] text-yamo-teal group-hover:bg-yamo-teal group-hover:text-white transition-all"><Car size={40}/></div>
              <div className="flex-1">
                <h4 className="text-2xl font-black">Covoiturage</h4>
                <p className="text-gray-500 font-medium italic text-lg">Le transport est cher ? Partagez les frais !</p>
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-yamo-teal transition" size={32} />
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm flex items-center gap-8 border border-gray-100 hover:border-yamo-teal transition-all duration-300 cursor-pointer group">
              <div className="bg-[#FFF0E8] p-6 rounded-[2rem] text-yamo-orange group-hover:bg-yamo-orange group-hover:text-white transition-all"><Car size={40}/></div>
              <div className="flex-1">
                <h4 className="text-2xl font-black">VTC & Pro</h4>
                <p className="text-gray-500 font-medium italic text-lg">Pour un trajet calme, VIP et climatisé.</p>
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-yamo-orange transition" size={32} />
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
              <li><Link href="#" className="hover:text-yamo-orange transition">Qui sommes-nous ?</Link></li>
              <li><Link href="/publier" className="hover:text-yamo-orange transition">Proposer un trajet</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-xl mb-8 tracking-tight">Légal</h5>
            <ul className="space-y-5 text-gray-400 font-bold text-lg">
              <li><Link href="#" className="hover:text-yamo-orange transition">CGV</Link></li>
              <li><Link href="#" className="hover:text-yamo-orange transition">Confidentialité</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-xl mb-8 tracking-tight">Suivez-nous</h5>
            <div className="flex gap-5">
              <div className="bg-white/10 p-4 rounded-full hover:bg-yamo-orange transition cursor-pointer shadow-lg"><Share2 size={24}/></div>
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