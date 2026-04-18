"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Car, CheckCircle, X, ScanLine, Clock, Trash2, Star, CheckCircle2, History, UserMinus, Phone, AlertCircle, PlayCircle, Flag } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

const TAGS_PASSAGER = ["À l'heure au RDV", "Poli et respectueux", "Agréable", "Calme", "Bonne communication"];

export default function DashboardConducteur() {
  const router = useRouter();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // ONGLETS
  const [activeTab, setActiveTab] = useState("en_cours");

  // SCANNER
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);

  // MODALS
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [passengerModal, setPassengerModal] = useState<any>(null); 
  const [confirmDialog, setConfirmDialog] = useState<{titre: string, message: string, actionTexte: string, isDanger?: boolean, onConfirm: () => void} | null>(null);

  // ÉTATS POUR LA NOTATION
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // SYSTÈME DE TRACKING GPS SILENCIEUX
  const watchIdRef = useRef<number | null>(null);
  // On garde en mémoire les ID des trajets actuellement "en_cours"
  const [activeTripIds, setActiveTripIds] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/connexion'); return; }
    setUser(session.user);

    const conducteurNom = session.user.user_metadata?.full_name;
    
    // NOUVEAU: On sélectionne la nouvelle colonne statut_course
    const { data, error } = await supabase
      .from('trajets')
      .select(`
        id, depart, destination, prix, vehicule, date_depart, places_disponibles, statut_course,
        reservations (
          id, passager_nom, date_reservation, statut, places_reservees, passager_id
        )
      `)
      .eq('conducteur_nom', conducteurNom)
      .order('date_depart', { ascending: false });

    if (!error && data) {
      setAnnonces(data);
      
      // On regarde quels trajets d'aujourd'hui sont "en_cours"
      const today = new Date().toISOString().split('T')[0];
      const runningTrips = data.filter(t => t.date_depart === today && t.statut_course === 'en_cours').map(t => t.id);
      
      setActiveTripIds(runningTrips);

      // Si au moins un trajet est en cours, on active le GPS
      if (runningTrips.length > 0) {
        startSilentTracking(runningTrips);
      } else {
        stopSilentTracking();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
    return () => stopSilentTracking();
  }, [router]);

  // --- FONCTIONS DE TRACKING GPS ---
  const startSilentTracking = (trajetIds: string[]) => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current !== null) return; // Déjà en train de tracker

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        for (const trajetId of trajetIds) {
          await supabase.from('trajets').update({ lat: lat, lng: lng }).eq('id', trajetId);
        }
      },
      (error) => console.warn("Tracking GPS impossible:", error.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  };

  const stopSilentTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // --- GESTION DU STATUT DE LA COURSE ---
  const demarrerCourse = async (trajetId: string) => {
    setConfirmDialog({
      titre: "Démarrer la course ?",
      message: "Les passagers seront notifiés de votre départ et votre position sera partagée en direct par sécurité.",
      actionTexte: "Oui, c'est parti !",
      onConfirm: async () => {
        setConfirmDialog(null);
        await supabase.from('trajets').update({ statut_course: 'en_cours' }).eq('id', trajetId);
        fetchDashboardData();
      }
    });
  };

  const terminerCourse = async (trajetId: string, autoConfirm = false) => {
    const doFinish = async () => {
      await supabase.from('trajets').update({ statut_course: 'termine' }).eq('id', trajetId);
      // Optionnel : Nettoyer les coordonnées GPS à la fin
      await supabase.from('trajets').update({ lat: null, lng: null }).eq('id', trajetId);
      fetchDashboardData();
    };

    if (autoConfirm) {
      setConfirmDialog({
        titre: "Tous les passagers sont là !",
        message: "C'était le dernier billet à scanner. Voulez-vous clôturer cette course maintenant ?",
        actionTexte: "Terminer la course",
        onConfirm: () => {
          setConfirmDialog(null);
          doFinish();
        }
      });
    } else {
      setConfirmDialog({
        titre: "Terminer la course ?",
        message: "Confirmez-vous que vous êtes bien arrivé à destination ?",
        actionTexte: "Oui, course terminée",
        onConfirm: () => {
          setConfirmDialog(null);
          doFinish();
        }
      });
    }
  };


  // --- SUPPRIMER TOUT LE TRAJET ---
  const supprimerTrajet = (trajetId: string) => {
    setConfirmDialog({
      titre: "Supprimer le trajet ?",
      message: "Cette action est irréversible et annulera toutes les réservations associées.",
      actionTexte: "Oui, supprimer",
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const { error } = await supabase.from('trajets').delete().eq('id', trajetId);
          if (error) throw error;
          setAnnonces(annonces.filter(a => a.id !== trajetId));
        } catch (err) {
          alert("Erreur lors de la suppression.");
        }
      }
    });
  };

  // --- REFUSER UN PASSAGER ---
  const handleRefuserPassager = (resa: any, trajet: any) => {
    setConfirmDialog({
      titre: "Refuser ce passager ?",
      message: `Voulez-vous vraiment refuser ${resa.passager_nom} ? Ses places vous seront restituées.`,
      actionTexte: "Oui, refuser",
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        
        await supabase.from('reservations').delete().eq('id', resa.id);

        const placesRendues = resa.places_reservees || 1;
        await supabase
          .from('trajets')
          .update({ places_disponibles: trajet.places_disponibles + placesRendues })
          .eq('id', trajet.id);

        if (resa.passager_id) {
          await supabase.from('notifications').insert([{
            user_id: resa.passager_id,
            titre: "Réservation annulée ❌",
            message: `Le conducteur a dû annuler votre place sur le trajet ${trajet.depart.split(',')[0]} → ${trajet.destination.split(',')[0]}. Vous ne serez pas facturé.`,
            type: 'alerte'
          }]);
        }

        setPassengerModal(null);
        fetchDashboardData();
      }
    });
  };

  // --- LOGIQUE DU SCANNER ---
  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      const qrCode = new Html5Qrcode("reader");
      setScannerInstance(qrCode);
      qrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await qrCode.stop();
          setIsScanning(false);
          validerBillet(decodedText);
        },
        () => {}
      ).catch(() => {
        alert("Erreur d'accès à la caméra.");
        setIsScanning(false);
      });
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerInstance) await scannerInstance.stop();
    setIsScanning(false);
  };

  // --- VALIDER LE BILLET ---
  const validerBillet = async (reservationId: string) => {
    const { data, error } = await supabase
      .from('reservations')
      .select('id, statut, passager_nom, trajet_id, places_reservees, trajets(prix)')
      .eq('id', reservationId)
      .single();

    if (error || !data) { alert("❌ QR Code invalide."); return; }
    if (data.statut === 'valide') { alert(`⚠️ Billet déjà validé pour ${data.passager_nom} !`); return; }

    const trajetsData = data.trajets as any;
    const prixUnitaire = Array.isArray(trajetsData) ? trajetsData[0]?.prix : trajetsData?.prix;
    const places = data.places_reservees || 1;
    const prixTotal = (prixUnitaire || 0) * places;
    const commissionYamoh = prixTotal * 0.10; 

    const { data: profile } = await supabase.from('profiles').select('solde_wallet').eq('id', user.id).single();
    const soldeActuel = profile?.solde_wallet || 0;

    await supabase.from('reservations').update({ statut: 'valide' }).eq('id', reservationId);
    await supabase.from('profiles').update({ solde_wallet: soldeActuel - commissionYamoh }).eq('id', user.id);

    await supabase.from('paiements').insert([{
      user_id: user.id, montant: commissionYamoh, type: 'depense', methode: 'Wallet Yamoh', libelle: `Commission (10%) - ${data.passager_nom}`
    }]);

    setRatingModal({ ...data, titre: `Billet validé pour ${data.passager_nom} !` });

    // VÉRIFICATION DU DERNIER PASSAGER POUR FIN AUTO
    // On refetch le trajet pour voir si tout le monde est 'valide'
    const { data: trajetCheck } = await supabase
      .from('trajets')
      .select('id, statut_course, reservations(statut)')
      .eq('id', data.trajet_id)
      .single();

    if (trajetCheck && trajetCheck.statut_course === 'en_cours') {
      const tousValides = trajetCheck.reservations.every((r: any) => r.statut === 'valide');
      if (tousValides && trajetCheck.reservations.length > 0) {
        // Si tout le monde est là, on propose de terminer
        setTimeout(() => terminerCourse(data.trajet_id, true), 1000); 
      }
    }
    
    fetchDashboardData();
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) { alert("Veuillez donner au moins une étoile."); return; }
    setIsSubmittingRating(true);

    const { error } = await supabase.from('avis').insert([{
      trajet_id: ratingModal.trajet_id, auteur_id: user.id, note: rating, tags: selectedTags.join(','), commentaire: comment
    }]);

    setIsSubmittingRating(false);
    if (!error) {
      setRatingModal(null); setRating(0); setSelectedTags([]); setComment("");
    } else alert("Erreur d'envoi.");
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };

  const today = new Date().toISOString().split('T')[0];
  
  // On modifie la logique des onglets : 
  // En cours = Trajets du jour ou futurs (non terminés)
  // Historique = Trajets passés ou marqués comme "terminés"
  const trajetsEnCours = annonces.filter(a => (a.date_depart >= today || !a.date_depart) && a.statut_course !== 'termine');
  const trajetsHistorique = annonces.filter(a => a.date_depart < today || a.statut_course === 'termine');
  
  const trajetsAffiches = activeTab === "en_cours" ? trajetsEnCours : trajetsHistorique;

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-yamo-teal">Chargement...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12 relative">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/"><ArrowLeft size={24} className="text-gray-600 hover:text-black transition" /></Link>
          <h1 className="text-xl font-bold text-yamo-teal">Espace Conducteur</h1>
        </div>
        <div className="bg-[#E8F4F8] text-yamo-teal px-4 py-2 rounded-full font-bold text-sm">
          {user?.user_metadata?.full_name}
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex bg-white p-1 rounded-2xl mb-8 shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab("en_cours")} className={`flex-1 py-3 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${activeTab === "en_cours" ? 'bg-yamo-orange text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            <Car size={18}/> À venir ({trajetsEnCours.length})
          </button>
          <button onClick={() => setActiveTab("historique")} className={`flex-1 py-3 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${activeTab === "historique" ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            <History size={18}/> Historique
          </button>
        </div>

        {activeTab === "en_cours" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            
            {/* INDICATEUR GPS GLOBAL (Si au moins 1 trajet tourne) */}
            {activeTripIds.length > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-[9px] font-black text-green-600 uppercase">GPS</span>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Validation des billets</h2>
              <p className="text-gray-500">Scannez le code des passagers à l'embarquement.</p>
            </div>
            <button onClick={startScanner} className="w-full md:w-auto bg-yamo-orange text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#D55A1A] transition shadow-lg shadow-yamo-orange/20">
              <ScanLine size={24} /> Scanner un QR Code
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {trajetsAffiches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <Car size={64} className="mx-auto text-gray-200 mb-4" />
               <p className="text-xl font-bold text-gray-800">Aucun trajet ici</p>
            </div>
          ) : (
            trajetsAffiches.map((annonce) => {
              const isToday = annonce.date_depart === today;
              const isRunning = annonce.statut_course === 'en_cours';
              
              return (
                <div key={annonce.id} className={`bg-white rounded-3xl p-6 shadow-sm border relative transition-all ${isRunning ? 'border-green-500 ring-4 ring-green-50' : 'border-gray-100'}`}>
                  
                  {/* BOUTON SUPPRIMER (Seulement si non démarré) */}
                  {activeTab === "en_cours" && !isRunning && (
                    <button onClick={() => supprimerTrajet(annonce.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition cursor-pointer" title="Supprimer ce trajet">
                      <Trash2 size={20} />
                    </button>
                  )}

                  {/* HEADER DU TRAJET */}
                  <div className="flex justify-between items-start mb-4 pr-10">
                    <div className="flex flex-col gap-1">
                      <p className="font-black text-xl text-gray-900">{annonce.depart?.split(',')[0]} → {annonce.destination?.split(',')[0]}</p>
                      <p className="text-gray-500 text-sm font-medium">{new Date(annonce.date_depart).toLocaleDateString('fr-FR')} • {annonce.vehicule}</p>
                    </div>
                  </div>
                  
                  {/* BARRE D'ACTIONS (DÉMARRER / TERMINER) */}
                  {activeTab === "en_cours" && isToday && (
                    <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100 flex items-center justify-between">
                      {isRunning ? (
                        <>
                          <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Course en cours
                          </div>
                          <button onClick={() => terminerCourse(annonce.id)} className="bg-gray-900 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-black transition">
                            <Flag size={16}/> Terminer la course
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-500">Prêt à partir ?</p>
                          <button onClick={() => demarrerCourse(annonce.id)} className="bg-green-500 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-green-600 transition shadow-lg shadow-green-500/20">
                            <PlayCircle size={16}/> Démarrer la course
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* LISTE DES PASSAGERS */}
                  <hr className="border-gray-100 my-4" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider"><Users size={16} /> Passagers ({annonce.reservations?.length || 0})</h3>
                      <p className="text-xs font-bold text-yamo-teal bg-yamo-teal/10 px-3 py-1 rounded-full">{annonce.places_disponibles} place(s) dispo</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {annonce.reservations?.length === 0 && <p className="text-sm text-gray-400 italic">Personne n'a encore réservé.</p>}
                      {annonce.reservations?.map((resa: any) => (
                        <div key={resa.id} onClick={() => setPassengerModal({ resa, trajet: annonce })} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-yamo-teal cursor-pointer transition group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-yamo-teal text-xs border border-gray-200 group-hover:bg-yamo-teal group-hover:text-white transition">{resa.passager_nom.charAt(0).toUpperCase()}</div>
                            <div><p className="font-bold text-gray-900 text-sm leading-none">{resa.passager_nom}</p><p className="text-xs text-gray-500 mt-1">{resa.places_reservees || 1} place(s)</p></div>
                          </div>
                          {resa.statut === 'valide' ? <span className="text-green-500 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border border-green-100"><CheckCircle size={14} /> Embarqué</span> : <span className="text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border border-orange-100"><Clock size={14} /> En attente</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {passengerModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-md relative animate-in zoom-in duration-300">
            <button onClick={() => setPassengerModal(null)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"><X size={20} /></button>
            <div className="w-20 h-20 bg-yamo-teal/10 text-yamo-teal rounded-full flex items-center justify-center mb-4 font-black text-3xl">{passengerModal.resa.passager_nom.charAt(0).toUpperCase()}</div>
            <h2 className="text-2xl font-black text-gray-900 text-center mb-1">{passengerModal.resa.passager_nom}</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">Réservation pour {passengerModal.resa.places_reservees || 1} place(s)<br/>Statut : {passengerModal.resa.statut === 'valide' ? 'Déjà scanné ✅' : 'En attente ⏳'}</p>
            <div className="w-full flex flex-col gap-3">
              <button className="w-full font-black py-4 rounded-2xl flex justify-center items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition"><Phone size={20} /> Appeler le passager</button>
              {passengerModal.resa.statut !== 'valide' && <button onClick={() => handleRefuserPassager(passengerModal.resa, passengerModal.trajet)} className="w-full font-black py-4 rounded-2xl transition flex justify-center items-center gap-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 mt-4"><UserMinus size={20} /> Refuser / Annuler</button>}
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-sm relative animate-in zoom-in duration-200">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? 'bg-red-50 text-red-500' : 'bg-yamo-teal/10 text-yamo-teal'}`}>
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 text-center mb-2">{confirmDialog.titre}</h2>
            <p className="text-gray-500 text-sm mb-8 text-center leading-relaxed">{confirmDialog.message}</p>
            <div className="w-full flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition">Annuler</button>
              <button onClick={confirmDialog.onConfirm} className={`flex-1 py-4 font-bold text-white rounded-2xl transition shadow-lg ${confirmDialog.isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}>
                {confirmDialog.actionTexte}
              </button>
            </div>
          </div>
        </div>
      )}

      {ratingModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-md relative animate-in zoom-in duration-300">
            <button onClick={() => {setRatingModal(null); setRating(0); setSelectedTags([]);}} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"><X size={20} /></button>
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4 shadow-inner"><CheckCircle2 size={40} /></div>
            <h2 className="text-2xl font-black text-gray-900 text-center mb-1">{ratingModal.titre}</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">Le passager est à bord. Comment s'est passé le contact ?</p>
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} onClick={() => setRating(star)} className="p-1 transition-transform hover:scale-110">
                  <Star size={36} className={`${(hoveredRating || rating) >= star ? 'fill-yamo-orange text-yamo-orange' : 'text-gray-200'} transition-colors duration-200`} />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {TAGS_PASSAGER.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border-2 ${selectedTags.includes(tag) ? 'bg-yamo-teal text-white border-yamo-teal' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'}`}>{tag}</button>)}
            </div>
            <textarea placeholder="Un petit mot ? (Optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal mb-6 font-medium text-sm resize-none" rows={3}></textarea>
            <button onClick={handleRatingSubmit} disabled={isSubmittingRating || rating === 0} className={`w-full font-black py-4 rounded-2xl transition flex justify-center items-center gap-2 ${rating === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-yamo-teal text-white hover:bg-[#115566] shadow-lg shadow-yamo-teal/20'}`}>{isSubmittingRating ? "Envoi..." : "Valider l'évaluation"}</button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden relative">
            <div className="bg-yamo-teal text-white text-center py-4 font-bold flex items-center justify-between px-6">
              <span>Scanner le billet</span>
              <button onClick={stopScanner} className="bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div id="reader" className="w-full"></div>
          </div>
        </div>
      )}
    </main>
  );
}