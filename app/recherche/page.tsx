"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Car, Clock, Phone, MessageSquare, Music, X, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react"; 
import { supabase } from "@/lib/supabase";

function RechercheContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // On récupère les paramètres de l'URL
  const depart = searchParams.get("depart");
  const destination = searchParams.get("destination");

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
      setLoading(true);
      
      // 1. On nettoie les mots (enlève les espaces inutiles au début et à la fin)
      const cleanDepart = depart ? depart.trim() : "";
      const cleanDest = destination ? destination.trim() : "";

      // 2. On prépare la requête de base
      let query = supabase
        .from('trajets')
        .select(`
          *,
          profiles (*)
        `)
        .gt('places_disponibles', 0); // Il faut qu'il reste de la place

      // 3. On ajoute les filtres SEULEMENT si l'utilisateur a tapé quelque chose
      if (cleanDepart) {
        query = query.ilike('depart', `%${cleanDepart}%`);
      }
      if (cleanDest) {
        query = query.ilike('destination', `%${cleanDest}%`);
      }

      // 4. On lance la recherche
      const { data, error } = await query;

      if (error) {
        console.error("Erreur de recherche Supabase :", error.message);
      }

      setTrajets(data || []);
      setLoading(false);
    }
    
    fetchTrajets();
  }, [depart, destination]);

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
          passager_email: user.email,
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
        message: `${user.user_metadata?.full_name} a réservé une place pour votre trajet ${trajetConcerne.depart} → ${trajetConcerne.destination}.`,
        type: 'reservation'
      }]);
    }

    alert("Réservation confirmée !");
    router.push('/mes-trajets');
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-40">
        <Link href="/">
          <ArrowLeft size={24} className="text-gray-600 hover:text-black transition" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{depart || "Départ"} → {destination || "Destination"}</h1>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold">Recherche des conducteurs...</div>
        ) : trajets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 px-6">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchX size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Yako ! Aucun trajet trouvé</h3>
            <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
              Il n'y a pas encore de véhicule prévu pour ce trajet aujourd'hui. Mais ça ne saurait tarder !
            </p>
            <Link href="/publier">
              <button className="bg-yamo-teal text-white font-black px-8 py-4 rounded-full hover:bg-yamo-orange transition shadow-xl shadow-yamo-teal/20">
                Publier ce trajet en tant que chauffeur
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trajets.map((trajet) => (
              <div key={trajet.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-yamo-teal font-bold text-lg">
                    <Clock size={20} /><span>Départ immédiat</span>
                  </div>
                  <div className="text-2xl font-black text-yamo-orange">{trajet.prix} FCFA</div>
                </div>

                <div className="flex flex-col gap-1 mb-6 border-l-4 border-gray-200 pl-4 ml-2">
                  <p className="font-bold text-gray-800 text-lg">{trajet.depart}</p>
                  <p className="font-bold text-gray-800 text-lg">{trajet.destination}</p>
                </div>

                <hr className="border-gray-100 mb-4" />

                <div 
                  onClick={() => setViewingProfile({ ...trajet.profiles, trajetId: trajet.id })}
                  className="flex justify-between items-center mb-6 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-yamo-teal/10 p-3 rounded-full text-yamo-teal group-hover:bg-yamo-teal group-hover:text-white transition">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{trajet.conducteur_nom} <span className="text-xs text-yamo-teal font-medium ml-1">Voir profil</span></p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Car size={14} /> {trajet.vehicule}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#E8F4F8] text-yamo-teal px-3 py-1 rounded-full font-bold text-sm">
                    {trajet.places_disponibles} places
                  </div>
                </div>

                <button 
                  onClick={() => handleReserver(trajet.id)}
                  disabled={reservingId === trajet.id}
                  className={`w-full text-white font-black text-lg py-4 rounded-2xl transition shadow-lg ${reservingId === trajet.id ? 'bg-gray-400' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}
                >
                  {reservingId === trajet.id ? "Réservation..." : "Réserver ce trajet"}
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