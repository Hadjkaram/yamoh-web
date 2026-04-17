"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Car, Clock, Phone, MessageSquare, X, SearchX, Calendar, MapPin, CheckCircle2, AlertCircle, Plus, Minus, Repeat, Star, Snowflake, Briefcase } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react"; 
import { supabase } from "@/lib/supabase";

function RechercheContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const depart = searchParams.get("depart");
  const destination = searchParams.get("destination");
  const dateRecherche = searchParams.get("date");
  const placesDemandeesInit = parseInt(searchParams.get("passagers") || "1");

  const [trajets, setTrajets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [driverRating, setDriverRating] = useState<{note: number, count: number} | null>(null);

  const [bookingModal, setBookingModal] = useState<any>(null);
  const [bookingPlaces, setBookingPlaces] = useState(1);
  const [bookingType, setBookingType] = useState("unique");
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    async function fetchTrajets() {
      if (!depart || !destination) return;
      setLoading(true);
      
      const { data, error } = await supabase.from('trajets').select('*');

      if (error) {
        console.error("Erreur Supabase :", error.message);
        setTrajets([]);
        setLoading(false);
        return;
      }

      const cleanString = (str: string) => {
        if (!str) return "";
        return str.split(',')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      };

      const searchDep = cleanString(depart);
      const searchDest = cleanString(destination);

      let resultatsTrouves = (data || []).filter(t => {
        const tDep = cleanString(t.depart);
        const tDest = cleanString(t.destination);

        const matchDep = tDep.includes(searchDep) || searchDep.includes(tDep);
        const matchDest = tDest.includes(searchDest) || searchDest.includes(tDest);
        const matchDate = !dateRecherche || !t.date_depart || t.date_depart.startsWith(dateRecherche);

        return matchDep && matchDest && matchDate;
      });

      if (resultatsTrouves.length > 0) {
        const userIds = [...new Set(resultatsTrouves.map(t => t.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);
          resultatsTrouves = resultatsTrouves.map(t => ({
            ...t,
            profiles: profilesData?.find(p => p.id === t.user_id) || {}
          }));
        }
      }

      setTrajets(resultatsTrouves);
      setLoading(false);
    }
    
    fetchTrajets();
  }, [depart, destination, dateRecherche]);

  useEffect(() => {
    async function fetchRating() {
      if (!viewingProfile) return;
      
      const { data, error } = await supabase
        .from('avis')
        .select('note')
        .eq('destinataire_id', viewingProfile.id);

      if (data && data.length > 0) {
        const avg = data.reduce((acc, curr) => acc + curr.note, 0) / data.length;
        setDriverRating({ note: Math.round(avg * 10) / 10, count: data.length });
      } else {
        setDriverRating({ note: 0, count: 0 });
      }
    }
    fetchRating();
  }, [viewingProfile]);

  const handleContact = async (conducteurId: string, trajetId: string) => {
    if (!user) { alert("Connectez-vous pour envoyer un message."); router.push('/connexion'); return; }
    if (user.id === conducteurId) { alert("C'est votre propre trajet !"); return; }
    
    setContactLoading(true);

    let { data: conv } = await supabase.from('conversations').select('id').match({ trajet_id: trajetId, passager_id: user.id, conducteur_id: conducteurId }).maybeSingle();
    if (!conv) {
      const { data, error } = await supabase.from('conversations').insert([{ trajet_id: trajetId, passager_id: user.id, conducteur_id: conducteurId }]).select().single();
      if (error) { alert("Erreur."); setContactLoading(false); return; }
      conv = data;
    }
    router.push('/messages');
  };

  const openBookingModal = (trajet: any) => {
    if (!user) {
      alert("Vous devez être connecté pour réserver un trajet.");
      router.push('/connexion');
      return;
    }
    setBookingModal(trajet);
    setBookingPlaces(Math.min(placesDemandeesInit, trajet.places_disponibles));
    setBookingType("unique");
  };

  const handleConfirmBooking = async () => {
    if (!bookingModal) return;
    setIsReserving(true);

    // CALCUL DES JOURS RESTANTS POUR UN ABONNEMENT
    const joursAbonnement = bookingModal.jours_reguliers ? bookingModal.jours_reguliers.split(',').length : 5;

    const { error: resaError } = await supabase
      .from('reservations')
      .insert([
        {
          trajet_id: bookingModal.id,
          passager_nom: user.user_metadata?.full_name || "Passager",
          passager_email: user.email || `${user.phone}@yamoh.net`,
          statut: 'en_attente',
          places_reservees: bookingPlaces,
          type_reservation: bookingType,
          passager_id: user.id, // LIAISON AVEC LE PROFIL POUR LE DASHBOARD CHAUFFEUR
          jours_restants: bookingType === 'semaine' ? joursAbonnement : null // INITIALISATION DU PASS SEMAINE
        }
      ]);

    if (resaError) {
      alert("Erreur lors de la réservation : " + resaError.message);
      setIsReserving(false);
      return;
    }

    const nouvellesPlaces = bookingModal.places_disponibles - bookingPlaces;
    await supabase.from('trajets').update({ places_disponibles: nouvellesPlaces }).eq('id', bookingModal.id);

    if (bookingModal.user_id) {
      const msgSemaine = bookingType === 'semaine' ? " POUR TOUTE LA SEMAINE" : "";
      await supabase.from('notifications').insert([{
        user_id: bookingModal.user_id,
        titre: "Nouvelle réservation ! 🚗",
        message: `${user.user_metadata?.full_name} a réservé ${bookingPlaces} place(s)${msgSemaine} pour votre trajet ${bookingModal.depart.split(',')[0]} → ${bookingModal.destination.split(',')[0]}.`,
        type: 'reservation'
      }]);
    }

    setBookingModal(null);
    setIsReserving(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      router.push('/mes-trajets');
    }, 2500);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date non précisée";
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12 relative">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-30">
        <Link href="/"><ArrowLeft size={24} className="text-gray-600 hover:text-black transition" /></Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 truncate max-w-[250px] md:max-w-md">
            {depart?.split(',')[0] || "Départ"} → {destination?.split(',')[0] || "Destination"}
          </h1>
          <p className="text-sm text-yamo-teal font-medium capitalize">
            {dateRecherche ? formatDate(dateRecherche) : "Date au choix"}
          </p>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-[2rem] h-48 animate-pulse border border-gray-100"></div>)}
          </div>
        ) : trajets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 px-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-[#E8F4F8] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"><SearchX size={40} className="text-yamo-teal opacity-50" /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Yako ! Aucun trajet trouvé</h3>
            <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed">Nous n'avons pas trouvé de véhicule correspondant. Modifiez vos critères !</p>
            <Link href="/publier">
              <button className="bg-yamo-teal text-white font-black px-8 py-4 rounded-full hover:bg-[#115566] transition shadow-xl shadow-yamo-teal/20">Publier ce trajet</button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <h2 className="font-black text-gray-900 text-xl px-2">{trajets.length} {trajets.length > 1 ? 'trajets trouvés' : 'trajet trouvé'}</h2>
            
            {trajets.map((trajet) => {
              const isComplet = trajet.places_disponibles === 0;
              const isNotEnoughSeats = !isComplet && trajet.places_disponibles < placesDemandeesInit;

              return (
                <div key={trajet.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border transition-all duration-300 group ${isComplet ? 'border-red-100 opacity-80' : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'}`}>
                  
                  <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-yamo-teal font-bold text-sm bg-[#E8F4F8] px-3 py-1.5 rounded-xl">
                        <Calendar size={16} /> <span className="capitalize">{formatDate(trajet.date_depart)}</span>
                      </div>
                      {trajet.heure_depart && (
                        <div className="flex items-center gap-1.5 text-yamo-orange font-black bg-[#FFF0E8] px-3 py-1.5 rounded-xl text-sm">
                          <Clock size={16} /> {trajet.heure_depart.substring(0, 5)}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-black text-yamo-teal">{trajet.prix} <span className="text-sm">FCFA</span></div>
                  </div>

                  <div className="flex gap-4 mb-2 relative pl-2">
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

                  {/* NOUVEAU : AFFICHAGE DES BADGES DE CONFORT (CLIM / BAGAGES) */}
                  {(trajet.climatise || trajet.bagages) && (
                    <div className="flex flex-wrap gap-2 mb-4 pl-2">
                      {trajet.climatise && <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"><Snowflake size={14}/> Climatisé</span>}
                      {trajet.bagages && <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100"><Briefcase size={14}/> Bagages acceptés</span>}
                    </div>
                  )}

                  {trajet.lieu_rendez_vous && (
                    <div className="mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
                       <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                       <span><strong className="text-gray-800">Point de RDV :</strong> {trajet.lieu_rendez_vous}</span>
                    </div>
                  )}

                  {trajet.jours_reguliers && (
                    <div className="mb-4 text-sm text-yamo-teal bg-[#E8F4F8] font-bold p-3 rounded-xl flex items-center gap-2">
                       <Repeat size={16}/> Trajet régulier : {trajet.jours_reguliers.split(',').join(', ')}
                    </div>
                  )}

                  <div onClick={() => setViewingProfile({ ...trajet.profiles, trajetId: trajet.id })} className="flex justify-between items-center mb-6 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-yamo-teal font-black text-lg overflow-hidden">
                        {trajet.profiles?.avatar_url ? (
                           <img src={trajet.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                           trajet.conducteur_nom ? trajet.conducteur_nom.charAt(0).toUpperCase() : 'C'
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{trajet.conducteur_nom || "Conducteur"}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 font-medium mt-0.5"><Car size={14} className="text-gray-400" /> {trajet.vehicule}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full font-black text-sm border ${isComplet ? 'bg-red-50 text-red-500 border-red-100' : 'bg-[#E8F4F8] text-yamo-teal border-yamo-teal/10'}`}>
                      {isComplet ? "Complet" : `${trajet.places_disponibles} place${trajet.places_disponibles > 1 ? 's' : ''}`}
                    </div>
                  </div>

                  {isComplet ? (
                    <button disabled className="w-full text-red-500 bg-red-50 border-2 border-red-100 font-black text-xl py-4 rounded-[1.5rem] flex items-center justify-center gap-2 cursor-not-allowed">
                      <AlertCircle size={20} /> Véhicule Complet
                    </button>
                  ) : isNotEnoughSeats ? (
                    <button disabled className="w-full text-orange-500 bg-orange-50 border-2 border-orange-100 font-black text-lg py-4 rounded-[1.5rem] flex items-center justify-center gap-2 cursor-not-allowed">
                      <AlertCircle size={20} /> Pas assez de places pour vous
                    </button>
                  ) : (
                    <button onClick={() => openBookingModal(trajet)} className="w-full text-white font-black text-xl py-4 rounded-[1.5rem] transition shadow-lg flex items-center justify-center gap-2 bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20">
                      Réserver ma place
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL DE RÉSERVATION --- */}
      {bookingModal && !showSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm" onClick={() => setBookingModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 relative animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setBookingModal(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"><X size={20}/></button>
            
            <h3 className="text-2xl font-black text-gray-900 mb-6">Détails réservation</h3>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">Combien de places ?</p>
                <p className="text-sm text-gray-500">{bookingModal.places_disponibles} dispo au maximum</p>
              </div>
              <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                <button onClick={() => setBookingPlaces(Math.max(1, bookingPlaces - 1))} className="p-2 text-gray-400 hover:text-yamo-teal transition"><Minus size={18}/></button>
                <span className="font-black text-xl w-6 text-center">{bookingPlaces}</span>
                <button onClick={() => setBookingPlaces(Math.min(bookingModal.places_disponibles, bookingPlaces + 1))} className="p-2 text-gray-400 hover:text-yamo-teal transition"><Plus size={18}/></button>
              </div>
            </div>

            {bookingModal.jours_reguliers && (
              <div className="mb-6">
                <p className="font-bold text-gray-900 mb-3">Abonnement</p>
                <div className="flex gap-2">
                  <button onClick={() => setBookingType("unique")} className={`flex-1 p-3 rounded-xl font-bold text-sm border-2 transition ${bookingType === "unique" ? 'border-yamo-teal bg-[#E8F4F8] text-yamo-teal' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>Juste une fois</button>
                  <button onClick={() => setBookingType("semaine")} className={`flex-1 p-3 rounded-xl font-bold text-sm border-2 transition ${bookingType === "semaine" ? 'border-yamo-orange bg-[#FFF0E8] text-yamo-orange' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>Toute la semaine</button>
                </div>
                {bookingType === "semaine" && (
                  <p className="text-xs text-yamo-orange font-bold mt-2 flex items-center gap-1"><CheckCircle2 size={14}/> Place réservée pour : {bookingModal.jours_reguliers}</p>
                )}
              </div>
            )}

            <div className="flex justify-between items-end border-t border-gray-100 pt-6 mb-6">
              <p className="text-gray-500 font-bold uppercase text-sm">Total par trajet</p>
              <p className="text-3xl font-black text-yamo-teal">{bookingModal.prix * bookingPlaces} <span className="text-lg">FCFA</span></p>
            </div>

            <button onClick={handleConfirmBooking} disabled={isReserving} className={`w-full text-white font-black text-xl py-5 rounded-[1.5rem] shadow-xl transition flex items-center justify-center gap-2 ${isReserving ? 'bg-gray-400' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}>
              {isReserving ? "Validation..." : "Confirmer ma place"}
            </button>
          </div>
        </div>
      )}

      {/* POP UP DE SUCCES */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 max-w-md w-full border border-gray-100">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner"><CheckCircle2 size={50} /></div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Place réservée !</h2>
            <p className="text-gray-500 text-lg mb-8">Le conducteur a été notifié. Redirection vers vos billets...</p>
            <div className="w-8 h-8 border-4 border-yamo-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* MODAL PROFIL CONDUCTEUR */}
      {viewingProfile && !showSuccess && !bookingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-6 backdrop-blur-sm" onClick={() => setViewingProfile(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 relative animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingProfile(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"><X size={20}/></button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 bg-[#E8F4F8] rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm font-black text-yamo-teal text-2xl overflow-hidden">
                {viewingProfile.avatar_url ? (
                  <img src={viewingProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  viewingProfile.full_name?.charAt(0).toUpperCase()
                )}
              </div>
              <h3 className="text-2xl font-black text-gray-900">{viewingProfile.full_name}</h3>
              
              <div className="flex items-center gap-1 text-yamo-orange mt-2 mb-2">
                <Star size={18} className={driverRating?.count && driverRating.count > 0 ? "fill-current" : ""} />
                <span className="font-bold text-gray-800">{driverRating?.count && driverRating.count > 0 ? driverRating.note : 'Nouveau'}</span>
                <span className="text-gray-400 text-sm ml-1">({driverRating?.count || 0} avis)</span>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-8 italic text-gray-600 text-center leading-relaxed border border-gray-100">
              "{viewingProfile.bio || "Conducteur Yamoh"}"
            </div>

            <div className="flex flex-col gap-4">
              {viewingProfile.phone ? (
                <a 
                  href={`tel:${viewingProfile.phone.replace(/\s+/g, '')}`} 
                  className="w-full bg-yamo-orange text-white font-black py-4 rounded-2xl hover:bg-[#D55A1A] transition shadow-lg shadow-yamo-orange/20 flex items-center justify-center gap-2"
                >
                  <Phone size={20} /> Appeler le {viewingProfile.phone}
                </a>
              ) : (
                 <div className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <Phone size={20} /> Numéro indisponible
                </div>
              )}

              <button onClick={() => handleContact(viewingProfile.id, viewingProfile.trajetId)} disabled={contactLoading} className="w-full bg-white border-2 border-yamo-teal text-yamo-teal font-black py-4 rounded-2xl hover:bg-yamo-teal hover:text-white transition flex items-center justify-center gap-2">
                <MessageSquare size={20} /> {contactLoading ? "Connexion..." : "Envoyer un message"}
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}

export default function RechercheResultats() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-yamo-teal text-xl">Chargement de la recherche...</div>}>
      <RechercheContent />
    </Suspense>
  );
}