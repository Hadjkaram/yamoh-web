"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Car, Clock, Phone, MessageSquare, Music, X, SearchX, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react"; 
import { supabase } from "@/lib/supabase";

function RechercheContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const depart = searchParams.get("depart");
  const destination = searchParams.get("destination");
  const dateRecherche = searchParams.get("date");

  const [trajets, setTrajets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    async function fetchTrajets() {
      if (!depart || !destination) return;
      setLoading(true);
      
      // 1. ASTUCE INFAILLIBLE : On récupère tous les trajets avec des places dispos
      const { data, error } = await supabase
        .from('trajets')
        .select(`*, profiles (*)`)
        .gt('places_disponibles', 0);

      if (error) {
        console.error("Erreur Supabase :", error.message);
        setTrajets([]);
        setLoading(false);
        return;
      }

      // 2. On fait le tri en JavaScript (Ignore les accents, les majuscules et les virgules)
      const cleanString = (str: string) => {
        if (!str) return "";
        // On prend juste la ville avant la virgule, on enlève les accents et on met en minuscule
        return str.split(',')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      };

      const searchDep = cleanString(depart);
      const searchDest = cleanString(destination);

      const resultatsTrouves = (data || []).filter(t => {
        const tDep = cleanString(t.depart);
        const tDest = cleanString(t.destination);

        // Vérification Départ et Destination (Tolérance si un mot est inclus dans l'autre)
        const matchDep = tDep.includes(searchDep) || searchDep.includes(tDep);
        const matchDest = tDest.includes(searchDest) || searchDest.includes(tDest);

        // Vérification de la date (Accepte la bonne date OU les trajets sans date)
        const matchDate = !dateRecherche || t.date_depart === dateRecherche || !t.date_depart;

        return matchDep && matchDest && matchDate;
      });

      setTrajets(resultatsTrouves);
      setLoading(false);
    }
    
    fetchTrajets();
  }, [depart, destination, dateRecherche]);

  const handleContact = async (conducteurId: string, trajetId: string) => {
    if (!user) {
      alert("Connectez-vous pour envoyer un message.");
      router.push('/connexion');
      return;
    }
    if (user.id === conducteurId) {
      alert("C'est votre propre trajet !");
      return;
    }

    setContactLoading(true);

    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .match({ trajet_id: trajetId, passager_id: user.id, conducteur_id: conducteurId })
      .maybeSingle();

    if (!conv) {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ trajet_id: trajetId, passager_id: user.id, conducteur_id: conducteurId }])
        .select()
        .single();
      
      if (error) {
        alert("Erreur lors de la création de la discussion.");
        setContactLoading(false);
        return;
      }
      conv = data;
    }

    router.push('/messages');
  };

  const handleReserver = async (trajetId: string) => {
    if (!user) {
      alert("Vous devez être connecté pour réserver un trajet.");
      router.push('/connexion');
      return;
    }

    setReservingId(trajetId);

    const { error: resaError } = await supabase
      .from('reservations')
      .insert([
        {
          trajet_id: trajetId,
          passager_nom: user.user_metadata?.full_name || "Passager",
          passager_email: user.email || `${user.phone}@yamoh.net`,
          statut: 'en_attente'
        }
      ]);

    if (resaError) {
      alert("Erreur lors de la réservation : " + resaError.message);
      setReservingId(null);
      return;
    }

    const trajetConcerne = trajets.find(t => t.id === trajetId);
    if (trajetConcerne && trajetConcerne.user_id) {
      await supabase.from('notifications').insert([{
        user_id: trajetConcerne.user_id,
        titre: "Nouvelle réservation ! 🚗",
        message: `${user.user_metadata?.full_name} a réservé une place pour votre trajet ${trajetConcerne.depart.split(',')[0]} → ${trajetConcerne.destination.split(',')[0]}.`,
        type: 'reservation'
      }]);
    }

    alert("Réservation confirmée ! Le conducteur a été notifié.");
    router.push('/mes-trajets');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date non précisée";
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-40">
        <Link href="/">
          <ArrowLeft size={24} className="text-gray-600 hover:text-black transition" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 truncate max-w-[250px] md:max-w-md">
            {depart?.split(',')[0] || "Départ"} → {destination?.split(',')[0] || "Destination"}
          </h1>
          {dateRecherche && <p className="text-sm text-yamo-teal font-medium capitalize">{formatDate(dateRecherche)}</p>}
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-[2rem] h-48 animate-pulse border border-gray-100"></div>)}
          </div>
        ) : trajets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 px-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-[#E8F4F8] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchX size={40} className="text-yamo-teal opacity-50" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Yako ! Aucun trajet trouvé</h3>
            <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
              Nous n'avons pas trouvé de véhicule correspondant exactement à votre recherche. Modifiez vos critères ou proposez le vôtre !
            </p>
            <Link href="/publier">
              <button className="bg-yamo-teal text-white font-black px-8 py-4 rounded-full hover:bg-[#115566] transition shadow-xl shadow-yamo-teal/20">
                Publier ce trajet (Chauffeur)
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <h2 className="font-black text-gray-900 text-xl px-2">{trajets.length} {trajets.length > 1 ? 'trajets disponibles' : 'trajet disponible'}</h2>
            
            {trajets.map((trajet) => (
              <div key={trajet.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                
                <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-yamo-teal font-bold text-sm bg-[#E8F4F8] px-3 py-1.5 rounded-xl">
                      <Calendar size={16} />
                      <span className="capitalize">{formatDate(trajet.date_depart)}</span>
                    </div>
                    {trajet.heure_depart && (
                      <div className="flex items-center gap-1.5 text-yamo-orange font-black bg-[#FFF0E8] px-3 py-1.5 rounded-xl text-sm">
                        <Clock size={16} />
                        {trajet.heure_depart.substring(0, 5)}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-black text-yamo-teal">{trajet.prix} <span className="text-sm">FCFA</span></div>
                </div>

                <div className="flex gap-4 mb-4 relative pl-2">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3.5 h-3.5 rounded-full border-[3px] border-gray-300"></div>
                    <div className="w-0.5 h-10 bg-gray-200 my-1"></div>
                    <div className="w-3.5 h-3.5 rounded-full border-[3px] border-yamo-orange"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg mb-4 line-clamp-1">{trajet.depart}</p>
                    <p className="font-bold text-gray-900 text-lg line-clamp-1">{trajet.destination}</p>
                  </div>
                </div>

                {trajet.lieu_rendez_vous && (
                  <div className="mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
                     <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                     <span><strong className="text-gray-800">Point de RDV :</strong> {trajet.lieu_rendez_vous}</span>
                  </div>
                )}

                <div 
                  onClick={() => setViewingProfile({ ...trajet.profiles, trajetId: trajet.id })}
                  className="flex justify-between items-center mb-6 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-yamo-teal font-black text-lg">
                      {trajet.conducteur_nom ? trajet.conducteur_nom.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{trajet.conducteur_nom || "Conducteur"}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                        <Car size={14} className="text-gray-400" /> {trajet.vehicule}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#E8F4F8] text-yamo-teal px-4 py-1.5 rounded-full font-black text-sm border border-yamo-teal/10">
                    {trajet.places_disponibles} places
                  </div>
                </div>

                <button 
                  onClick={() => handleReserver(trajet.id)}
                  disabled={reservingId === trajet.id}
                  className={`w-full text-white font-black text-xl py-4 rounded-[1.5rem] transition shadow-lg flex items-center justify-center gap-2 ${reservingId === trajet.id ? 'bg-gray-400' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}
                >
                  {reservingId === trajet.id && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {reservingId === trajet.id ? "Réservation en cours..." : "Réserver ma place"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-6 backdrop-blur-sm" onClick={() => setViewingProfile(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 relative animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingProfile(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition">
              <X size={20}/>
            </button>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 bg-[#E8F4F8] rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm font-black text-yamo-teal text-2xl">
                {viewingProfile.full_name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-black text-gray-900">{viewingProfile.full_name}</h3>
              <p className="text-yamo-orange font-bold flex items-center gap-2 mt-1">
                <Phone size={18} /> {viewingProfile.phone || "Non renseigné"}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-6 italic text-gray-600 text-center leading-relaxed border border-gray-100">
              "{viewingProfile.bio || "Pas de bio disponible."}"
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition ${viewingProfile.preferences?.music ? 'border-yamo-teal bg-[#E8F4F8] text-yamo-teal' : 'border-gray-100 text-gray-300'}`}>
                 <Music size={24} className="mb-2"/> <span className="text-xs font-black uppercase">Musique</span>
               </div>
               <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition ${viewingProfile.preferences?.chat ? 'border-yamo-teal bg-[#E8F4F8] text-yamo-teal' : 'border-gray-100 text-gray-300'}`}>
                 <MessageSquare size={24} className="mb-2"/> <span className="text-xs font-black uppercase">Discussion</span>
               </div>
            </div>

            <button 
              onClick={() => handleContact(viewingProfile.id, viewingProfile.trajetId)}
              disabled={contactLoading}
              className="w-full bg-white border-2 border-yamo-teal text-yamo-teal font-black py-4 rounded-2xl hover:bg-yamo-teal hover:text-white transition flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              {contactLoading ? "Connexion..." : "Contacter le conducteur"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function RechercheResultats() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-yamo-teal text-xl">
        Chargement de la recherche...
      </div>
    }>
      <RechercheContent />
    </Suspense>
  );
}