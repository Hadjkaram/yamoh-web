"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Car, CheckCircle, X, ScanLine, Clock, Trash2, Star, CheckCircle2, History, UserMinus, Phone } from "lucide-react";
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
  const [passengerModal, setPassengerModal] = useState<any>(null); // Pour gérer un passager

  // ÉTATS POUR LA NOTATION
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/connexion'); return; }
    setUser(session.user);

    const conducteurNom = session.user.user_metadata?.full_name;
    
    // On récupère les trajets ET les réservations (avec l'ID du passager pour son profil)
    const { data, error } = await supabase
      .from('trajets')
      .select(`
        id, depart, destination, prix, vehicule, date_depart, places_disponibles,
        reservations (
          id, passager_nom, date_reservation, statut, places_reservees, passager_id
        )
      `)
      .eq('conducteur_nom', conducteurNom)
      .order('date_depart', { ascending: false });

    if (!error && data) {
      setAnnonces(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  // --- SUPPRIMER TOUT LE TRAJET ---
  const supprimerTrajet = async (trajetId: string) => {
    const confirmation = window.confirm("Es-tu sûr de vouloir supprimer ce trajet ? Cette action annulera toutes les réservations.");
    if (confirmation) {
      try {
        const { error } = await supabase.from('trajets').delete().eq('id', trajetId);
        if (error) throw error;
        setAnnonces(annonces.filter(a => a.id !== trajetId));
      } catch (err) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  // --- NOUVEAU : REFUSER UN PASSAGER ---
  const handleRefuserPassager = async (resa: any, trajet: any) => {
    const confirmation = window.confirm(`Voulez-vous vraiment refuser ${resa.passager_nom} ? Ses places vous seront restituées.`);
    if (!confirmation) return;

    // 1. On supprime (ou annule) la réservation
    await supabase.from('reservations').delete().eq('id', resa.id);

    // 2. On rend les places au trajet (Le Décompte Inversé !)
    const placesRendues = resa.places_reservees || 1;
    await supabase
      .from('trajets')
      .update({ places_disponibles: trajet.places_disponibles + placesRendues })
      .eq('id', trajet.id);

    // 3. On envoie une notification de refus au passager s'il a un ID
    if (resa.passager_id) {
      await supabase.from('notifications').insert([{
        user_id: resa.passager_id,
        titre: "Réservation annulée ❌",
        message: `Le conducteur a dû annuler votre place sur le trajet ${trajet.depart.split(',')[0]} → ${trajet.destination.split(',')[0]}. Vous ne serez pas facturé.`,
        type: 'alerte'
      }]);
    }

    alert("Le passager a été refusé. Vos places ont été restaurées.");
    setPassengerModal(null);
    fetchDashboardData(); // Rafraîchit l'écran
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

  const validerBillet = async (reservationId: string) => {
    const { data, error } = await supabase
      .from('reservations')
      .select('id, statut, passager_nom, trajet_id')
      .eq('id', reservationId)
      .single();

    if (error || !data) { alert("❌ QR Code invalide."); return; }
    if (data.statut === 'valide') { alert(`⚠️ Billet déjà validé pour ${data.passager_nom} !`); return; }

    await supabase.from('reservations').update({ statut: 'valide' }).eq('id', reservationId);
    fetchDashboardData();

    // Ouverture du pop-up de notation !
    setRatingModal({ ...data, titre: `Billet validé pour ${data.passager_nom} !` });
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) { alert("Veuillez donner au moins une étoile."); return; }
    setIsSubmittingRating(true);

    const { error } = await supabase.from('avis').insert([{
      trajet_id: ratingModal.trajet_id,
      auteur_id: user.id,
      note: rating,
      tags: selectedTags.join(','),
      commentaire: comment
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

  // FILTRES DES ONGLETS (Basé sur la date)
  const today = new Date().toISOString().split('T')[0];
  const trajetsEnCours = annonces.filter(a => a.date_depart >= today || !a.date_depart);
  const trajetsHistorique = annonces.filter(a => a.date_depart < today && a.date_depart);
  
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
        
        {/* NOUVEAU : SYSTÈME D'ONGLETS POUR LE CHAUFFEUR */}
        <div className="flex bg-white p-1 rounded-2xl mb-8 shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab("en_cours")} 
            className={`flex-1 py-3 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${activeTab === "en_cours" ? 'bg-yamo-orange text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Car size={18}/> À venir ({trajetsEnCours.length})
          </button>
          <button 
            onClick={() => setActiveTab("historique")} 
            className={`flex-1 py-3 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${activeTab === "historique" ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <History size={18}/> Historique
          </button>
        </div>

        {/* ZONE DE SCAN UNQUEMENT POUR LES TRAJETS EN COURS */}
        {activeTab === "en_cours" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
            trajetsAffiches.map((annonce) => (
              <div key={annonce.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative">
                {activeTab === "en_cours" && (
                  <button onClick={() => supprimerTrajet(annonce.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition cursor-pointer" title="Supprimer ce trajet">
                    <Trash2 size={20} />
                  </button>
                )}

                <div className="flex justify-between items-start mb-4 pr-10">
                  <div className="flex flex-col gap-1">
                    <p className="font-black text-xl text-gray-900">{annonce.depart?.split(',')[0]} → {annonce.destination?.split(',')[0]}</p>
                    <p className="text-gray-500 text-sm font-medium">{new Date(annonce.date_depart).toLocaleDateString('fr-FR')} • {annonce.vehicule}</p>
                  </div>
                </div>
                
                <hr className="border-gray-100 my-4" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Users size={16} /> Passagers ({annonce.reservations?.length || 0})
                    </h3>
                    <p className="text-xs font-bold text-yamo-teal bg-yamo-teal/10 px-3 py-1 rounded-full">{annonce.places_disponibles} place(s) dispo</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {annonce.reservations?.length === 0 && (
                      <p className="text-sm text-gray-400 italic">Personne n'a encore réservé.</p>
                    )}
                    {annonce.reservations?.map((resa: any) => (
                      <div 
                        key={resa.id} 
                        onClick={() => setPassengerModal({ resa, trajet: annonce })}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-yamo-teal cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-yamo-teal text-xs border border-gray-200 group-hover:bg-yamo-teal group-hover:text-white transition">
                            {resa.passager_nom.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-none">{resa.passager_nom}</p>
                            <p className="text-xs text-gray-500 mt-1">{resa.places_reservees || 1} place(s)</p>
                          </div>
                        </div>
                        {resa.statut === 'valide' ? (
                          <span className="text-green-500 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border border-green-100">
                            <CheckCircle size={14} /> Embarqué
                          </span>
                        ) : (
                          <span className="text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border border-orange-100">
                            <Clock size={14} /> En attente
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- LE MODAL DE GESTION DU PASSAGER --- */}
      {passengerModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-md relative animate-in zoom-in duration-300">
            <button onClick={() => setPassengerModal(null)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition">
              <X size={20} />
            </button>
            
            <div className="w-20 h-20 bg-yamo-teal/10 text-yamo-teal rounded-full flex items-center justify-center mb-4 font-black text-3xl">
              {passengerModal.resa.passager_nom.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 text-center mb-1">{passengerModal.resa.passager_nom}</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Réservation pour {passengerModal.resa.places_reservees || 1} place(s)<br/>
              Statut : {passengerModal.resa.statut === 'valide' ? 'Déjà scanné ✅' : 'En attente ⏳'}
            </p>

            <div className="w-full flex flex-col gap-3">
              {/* Si on avait son tel on pourrait l'appeler, pour l'instant on met un bouton factice ou on passe via les messages Yamoh */}
              <button className="w-full font-black py-4 rounded-2xl flex justify-center items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                <Phone size={20} /> Appeler le passager
              </button>

              {passengerModal.resa.statut !== 'valide' && (
                <button 
                  onClick={() => handleRefuserPassager(passengerModal.resa, passengerModal.trajet)}
                  className="w-full font-black py-4 rounded-2xl transition flex justify-center items-center gap-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 mt-4"
                >
                  <UserMinus size={20} /> Refuser / Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- LE MODAL DE NOTATION (APPARAÎT APRÈS LE SCAN) --- */}
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
              {TAGS_PASSAGER.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border-2 ${selectedTags.includes(tag) ? 'bg-yamo-teal text-white border-yamo-teal' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'}`}>{tag}</button>
              ))}
            </div>

            <textarea placeholder="Un petit mot ? (Optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal mb-6 font-medium text-sm resize-none" rows={3}></textarea>

            <button onClick={handleRatingSubmit} disabled={isSubmittingRating || rating === 0} className={`w-full font-black py-4 rounded-2xl transition flex justify-center items-center gap-2 ${rating === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-yamo-teal text-white hover:bg-[#115566] shadow-lg shadow-yamo-teal/20'}`}>
              {isSubmittingRating ? "Envoi..." : "Valider l'évaluation"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DU SCANNER */}
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