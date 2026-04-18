"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, X, CheckCircle2, Download, Star, Ticket, History, CalendarDays, PauseCircle, AlertTriangle, Loader2, Phone } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code"; 

const TAGS_CHAUFFEUR = ["Conduite prudente", "Véhicule propre", "Bonne musique", "Ponctuel", "Climatisé", "Agréable"];
const MOTIFS_SOS = ["Conduite dangereuse", "Harcèlement / Agressivité", "Panne / Accident", "Le chauffeur ne correspond pas", "Autre urgence"];

export default function MesTrajets() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // ONGLETS : "en_cours" ou "historique"
  const [activeTab, setActiveTab] = useState("en_cours");

  // MODALS
  const [selectedResa, setSelectedResa] = useState<any>(null); 
  const [ratingModal, setRatingModal] = useState<any>(null); 
  const [sosModal, setSosModal] = useState<any>(null); 

  // ÉTATS DE NOTATION & SOS
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [avisSoumis, setAvisSoumis] = useState<string[]>([]); 
  
  const [sosType, setSosType] = useState("");
  const [isSubmittingSos, setIsSubmittingSos] = useState(false);

  useEffect(() => {
    async function fetchMesReservations() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/connexion'); return; }
      setUser(session.user);

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id, date_reservation, statut, trajet_id, type_reservation, jours_restants,
          trajets ( id, user_id, depart, destination, prix, conducteur_nom, vehicule )
        `)
        .eq('passager_email', session.user.email)
        .order('date_reservation', { ascending: false });

      if (!error && data) setReservations(data);
      setLoading(false);
    }
    fetchMesReservations();
  }, [router]);

  const handleDownloadPDF = () => window.print();

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) { alert("Veuillez donner au moins une étoile."); return; }
    setIsSubmittingRating(true);

    const { error } = await supabase.from('avis').insert([{
      trajet_id: ratingModal.trajet_id,
      auteur_id: user.id,
      destinataire_id: ratingModal.trajets.user_id, 
      note: rating,
      tags: selectedTags.join(','),
      commentaire: comment
    }]);

    setIsSubmittingRating(false);
    if (!error) {
      setAvisSoumis([...avisSoumis, ratingModal.id]); 
      setRatingModal(null);
      setRating(0);
      setSelectedTags([]);
      setComment("");
    } else {
      alert("Erreur lors de l'envoi de l'avis.");
    }
  };

  const handleSignalerAbsence = async (resa: any) => {
    const confirm = window.confirm("Prévenir le conducteur que vous ne voyagez pas demain ? Votre place sera libérée pour ce jour-là, et votre jour d'abonnement sera conservé.");
    if (!confirm) return;

    await supabase.from('notifications').insert([{
      user_id: resa.trajets.user_id,
      titre: "Imprévu Passager ⚠️",
      message: `${user?.user_metadata?.full_name || "Un passager"} a signalé une absence pour demain sur le trajet ${resa.trajets.depart.split(',')[0]}. Vous pouvez prendre quelqu'un d'autre !`,
      type: 'alerte'
    }]);

    alert("Le conducteur a été prévenu. Votre jour est conservé !");
  };

  const handleSOS = async () => {
    if (!sosType) {
      alert("Veuillez sélectionner un motif d'urgence.");
      return;
    }
    
    setIsSubmittingSos(true);
    let lat = null;
    let lng = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn("Position introuvable pour le SOS");
      }
    }

    const trajetInfo = `${sosModal.trajets.depart.split(',')[0]} → ${sosModal.trajets.destination.split(',')[0]}`;
    
    const { error } = await supabase.from('alertes').insert([{
      type: 'SOS_PASSAGER',
      message: sosType,
      trajet: trajetInfo,
      passager: user?.user_metadata?.full_name || user?.email,
      chauffeur: sosModal.trajets.conducteur_nom,
      lat: lat,
      lng: lng
    }]);

    setIsSubmittingSos(false);

    if (error) {
      alert("Erreur réseau : " + error.message);
    } else {
      alert("🚨 ALERTE ENVOYÉE ! L'administrateur Yamoh a reçu votre position et va vous contacter immédiatement.");
      setSosModal(null);
      setSosType("");
    }
  };

  const billetsEnCours = reservations.filter(r => 
    r.statut !== 'valide' || (r.type_reservation === 'semaine' && r.jours_restants > 0)
  );
  
  const billetsHistorique = reservations.filter(r => 
    r.statut === 'valide' && (r.type_reservation !== 'semaine' || r.jours_restants === 0)
  );

  const billetsAffiches = activeTab === "en_cours" ? billetsEnCours : billetsHistorique;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12 relative">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-40 print:hidden">
        <Link href="/"><ArrowLeft size={24} className="text-gray-600 hover:text-black transition" /></Link>
        <h1 className="text-xl font-black text-yamo-teal">Mes réservations</h1>
      </header>

      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full print:p-0">
        
        <div className="flex bg-white p-1 rounded-2xl mb-8 shadow-sm border border-gray-100 print:hidden">
          <button onClick={() => setActiveTab("en_cours")} className={`flex-1 py-3 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${activeTab === "en_cours" ? 'bg-yamo-teal text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            <Ticket size={18}/> En cours ({billetsEnCours.length})
          </button>
          <button onClick={() => setActiveTab("historique")} className={`flex-1 py-3 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${activeTab === "historique" ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            <History size={18}/> Historique
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500">Chargement de vos billets...</div>
        ) : billetsAffiches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm print:hidden">
            <QrCode size={64} className="text-yamo-teal/20 mx-auto mb-4" />
            <p className="text-2xl font-black text-gray-800">Aucun billet ici</p>
            <p className="text-gray-500 mt-2 font-medium">C'est le moment de prévoir votre prochain trajet !</p>
            <Link href="/"><button className="mt-8 bg-yamo-teal text-white font-black px-8 py-4 rounded-2xl hover:bg-[#115566] transition shadow-lg shadow-yamo-teal/20">Rechercher un trajet</button></Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {billetsAffiches.map((resa) => {
              const isUsed = activeTab === "historique";
              const isAbonnement = resa.type_reservation === 'semaine';
              const joursRestants = resa.jours_restants !== undefined ? resa.jours_restants : (isAbonnement ? 5 : 1);
              const isRated = avisSoumis.includes(resa.id);
              
              // --- NOUVEAU : VÉRIFICATION DE L'APPROBATION ---
              const isApproved = resa.statut === 'approuve' || resa.statut === 'valide';

              return (
                <div key={resa.id} className={`rounded-[2rem] p-6 shadow-lg text-white relative overflow-hidden print:shadow-none print:border print:border-gray-300 print:text-black ${isUsed ? 'bg-gray-400' : 'bg-yamo-teal'}`}>
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full print:hidden"></div>
                  <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-white/10 rounded-full print:hidden"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-black text-xl tracking-widest opacity-80 flex items-center gap-2">
                        {isAbonnement ? <CalendarDays size={20}/> : null}
                        {isAbonnement ? 'PASS SEMAINE' : 'YAMOH TICKET'}
                      </span>
                      
                      {/* STATUTS DYNAMIQUES */}
                      {isUsed && <span className="bg-white text-gray-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider print:border print:border-gray-800">Terminé</span>}
                      {!isUsed && isApproved && <span className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase">Approuvé</span>}
                      {!isUsed && !isApproved && <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase animate-pulse">En attente</span>}
                      
                      {!isUsed && isAbonnement && isApproved && (
                        <span className="bg-yamo-orange text-white text-xs font-black px-3 py-1 rounded-full uppercase ml-2">
                          {joursRestants} jour(s)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-4 ${isUsed ? 'border-gray-200' : 'border-white'} print:border-gray-800`}></div>
                        <div className={`w-1 h-12 my-1 ${isUsed ? 'bg-gray-200/30' : 'bg-white/30'} print:bg-gray-400`}></div>
                        <div className={`w-4 h-4 rounded-full border-4 bg-white ${isUsed ? 'border-gray-300' : 'border-yamo-orange'} print:border-black`}></div>
                      </div>
                      <div className="flex flex-col justify-between h-20">
                        <p className="text-2xl font-bold">{resa.trajets.depart.split(',')[0]}</p>
                        <p className="text-2xl font-bold">{resa.trajets.destination.split(',')[0]}</p>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-sm print:bg-gray-50 print:text-black">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm opacity-80 mb-1 font-medium">Conducteur</p>
                          <p className="font-bold text-lg">{resa.trajets.conducteur_nom}</p>
                          
                          {/* ON FLoute LE VÉHICULE SI NON APPROUVÉ */}
                          {isApproved ? (
                            <p className="text-sm opacity-80">{resa.trajets.vehicule}</p>
                          ) : (
                            <p className="text-sm opacity-80 blur-sm select-none">Véhicule masqué</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-80 mb-1 font-medium">Montant</p>
                          <p className={`text-2xl font-black ${isUsed ? 'text-white' : 'text-yamo-orange'} print:text-black`}>{resa.trajets.prix} FCFA</p>
                        </div>
                      </div>
                      
                      {/* BOUTONS D'ACTION */}
                      {!isUsed ? (
                        <div className="flex flex-col gap-2 print:hidden mt-2">
                          
                          {/* SI NON APPROUVÉ : MESSAGE D'ATTENTE */}
                          {!isApproved ? (
                            <div className="bg-orange-500/20 border border-orange-500/50 p-4 rounded-xl text-center">
                              <p className="font-bold text-sm">Le conducteur doit accepter votre demande.</p>
                              <p className="text-xs mt-1 opacity-80">Le QR Code et ses contacts s'afficheront ici.</p>
                            </div>
                          ) : (
                            /* SI APPROUVÉ : AFFICHE LE QR CODE ET BOUTON D'APPEL */
                            <>
                              <button onClick={() => setSelectedResa(resa)} className="w-full bg-white text-yamo-teal font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-sm">
                                <QrCode size={20} /> Afficher le QR Code
                              </button>
                              
                              <button className="w-full bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition text-sm mt-1">
                                <Phone size={16} /> Appeler le conducteur
                              </button>
                            </>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {isAbonnement && isApproved && (
                              <button onClick={() => handleSignalerAbsence(resa)} className="w-full bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition text-[10px] md:text-xs">
                                <PauseCircle size={16} /> Je passe mon tour
                              </button>
                            )}
                            
                            {/* BOUTON SOS URGENCE (Toujours visible si le trajet est en cours, même non abonnement) */}
                            <button onClick={() => setSosModal(resa)} className={`w-full bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition text-[10px] md:text-xs shadow-lg shadow-red-500/20 ${!isAbonnement || !isApproved ? 'col-span-2' : ''}`}>
                              <AlertTriangle size={16} /> Signaler un problème
                            </button>
                          </div>
                        </div>
                      ) : (
                        !isRated ? (
                           <button onClick={() => setRatingModal(resa)} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition shadow-lg print:hidden mt-2">
                             <Star size={20} className="fill-current text-yamo-orange" /> Noter le conducteur
                           </button>
                        ) : (
                           <div className="w-full bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 print:text-gray-800 print:bg-transparent mt-2">
                             <CheckCircle2 size={20} /> Merci pour votre avis !
                           </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL QR CODE --- */}
      {selectedResa && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm transition-opacity print:bg-white print:items-start print:pt-10" onClick={() => setSelectedResa(null)}>
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm flex flex-col items-center relative shadow-2xl print:shadow-none print:w-full print:max-w-none" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedResa(null)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition print:hidden"><X size={20} /></button>
            <h3 className="text-2xl font-black text-yamo-teal mb-2 text-center">
              {selectedResa.type_reservation === 'semaine' ? 'Pass Semaine Yamoh' : 'Billet Yamoh'}
            </h3>
            <p className="text-gray-500 text-center mb-8 print:hidden">Présentez ce code à {selectedResa.trajets.conducteur_nom}.</p>
            <div className="bg-white p-4 rounded-2xl border-4 border-yamo-teal shadow-inner mb-6"><QRCode value={selectedResa.id} size={220} fgColor="#166C82" /></div>
            <button onClick={handleDownloadPDF} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition print:hidden"><Download size={20} /> Sauvegarder en PDF</button>
          </div>
        </div>
      )}

      {/* --- NOUVEAU MODAL : ALERTE SOS --- */}
      {sosModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-md relative animate-in zoom-in duration-300">
            <button onClick={() => {setSosModal(null); setSosType("");}} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition">
              <X size={20} />
            </button>
            
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner animate-pulse">
              <AlertTriangle size={40} />
            </div>
            
            <h2 className="text-2xl font-black text-red-600 text-center mb-2">Signaler une urgence</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Si vous vous sentez en danger, prévenez immédiatement l'administration Yamoh. Votre GPS sera partagé.
            </p>
            
            <div className="w-full space-y-3 mb-6">
              {MOTIFS_SOS.map((motif) => (
                <button
                  key={motif}
                  onClick={() => setSosType(motif)}
                  className={`w-full p-4 rounded-xl font-bold border-2 transition text-left ${sosType === motif ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-red-50/50'}`}
                >
                  {motif}
                </button>
              ))}
            </div>

            <button 
              onClick={handleSOS} 
              disabled={isSubmittingSos || !sosType}
              className={`w-full font-black py-4 rounded-2xl transition flex justify-center items-center gap-2 ${!sosType ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30'}`}
            >
              {isSubmittingSos ? <><Loader2 className="animate-spin" size={20} /> Localisation en cours...</> : "Déclencher l'alerte SOS"}
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL DE NOTATION --- */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-md relative animate-in zoom-in duration-300">
            <button onClick={() => {setRatingModal(null); setRating(0); setSelectedTags([]);}} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition">
              <X size={20} />
            </button>
            
            <div className="w-20 h-20 bg-yamo-teal/10 text-yamo-teal rounded-full flex items-center justify-center mb-4 shadow-inner font-black text-3xl">
              {ratingModal.trajets.conducteur_nom.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 text-center mb-1">Noter {ratingModal.trajets.conducteur_nom}</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">Comment s'est passé votre voyage de {ratingModal.trajets.depart.split(',')[0]} à {ratingModal.trajets.destination.split(',')[0]} ?</p>
            
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star size={36} className={`${(hoveredRating || rating) >= star ? 'fill-yamo-orange text-yamo-orange' : 'text-gray-200'} transition-colors duration-200`} />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {TAGS_CHAUFFEUR.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border-2 ${selectedTags.includes(tag) ? 'bg-yamo-teal text-white border-yamo-teal' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'}`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Un petit mot sur le chauffeur ? (Optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal mb-6 font-medium text-sm resize-none"
              rows={3}
            ></textarea>

            <button 
              onClick={handleRatingSubmit} 
              disabled={isSubmittingRating || rating === 0}
              className={`w-full font-black py-4 rounded-2xl transition flex justify-center items-center gap-2 ${rating === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-yamo-orange text-white hover:bg-[#D55A1A] shadow-lg shadow-yamo-orange/20'}`}
            >
              {isSubmittingRating ? "Envoi..." : "Envoyer mon avis"}
            </button>
          </div>
        </div>
      )}

    </main>
  );
}