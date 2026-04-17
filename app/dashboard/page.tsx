"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Car, CheckCircle, X, ScanLine, Clock, Trash2, Star, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

const TAGS_PASSAGER = ["À l'heure au RDV", "Poli et respectueux", "Agréable", "Calme", "Bonne communication"];

export default function DashboardConducteur() {
  const router = useRouter();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);

  // ÉTATS POUR LA NOTATION
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/connexion');
      return;
    }
    setUser(session.user);

    const conducteurNom = session.user.user_metadata?.full_name;
    
    const { data, error } = await supabase
      .from('trajets')
      .select(`
        id, depart, destination, prix, vehicule, date_depart,
        reservations (
          id, passager_nom, date_reservation, statut
        )
      `)
      .eq('conducteur_nom', conducteurNom)
      .order('date_depart', { ascending: false });

    if (!error && data) setAnnonces(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const supprimerTrajet = async (trajetId: string) => {
    const confirmation = window.confirm("Es-tu sûr de vouloir supprimer ce trajet ? Cette action est irréversible et annulera toutes les réservations associées.");
    if (confirmation) {
      try {
        const { error } = await supabase.from('trajets').delete().eq('id', trajetId);
        if (error) throw error;
        setAnnonces(annonces.filter(a => a.id !== trajetId));
      } catch (err) {
        alert("Erreur lors de la suppression du trajet.");
      }
    }
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
    // 1. On récupère la résa ET le trajet associé pour la notation
    const { data, error } = await supabase
      .from('reservations')
      .select('id, statut, passager_nom, trajet_id')
      .eq('id', reservationId)
      .single();

    if (error || !data) {
      alert("❌ QR Code invalide ou illisible.");
      return;
    }

    if (data.statut === 'valide') {
      alert(`⚠️ Le billet de ${data.passager_nom} a déjà été scanné !`);
      return;
    }

    // 2. On valide le billet
    await supabase.from('reservations').update({ statut: 'valide' }).eq('id', reservationId);
    
    // 3. On rafraîchit la liste en arrière-plan
    fetchDashboardData();

    // 4. LA MAGIE OPÈRE : On ouvre le pop-up pour noter le passager
    setRatingModal({
      ...data,
      titre: `Billet validé pour ${data.passager_nom} !`
    });
  };

  // --- SOUMETTRE LA NOTE ---
  const handleRatingSubmit = async () => {
    if (rating === 0) { alert("Veuillez donner au moins une étoile."); return; }
    setIsSubmittingRating(true);

    // Envoi de l'avis dans la base de données
    const { error } = await supabase.from('avis').insert([{
      trajet_id: ratingModal.trajet_id,
      auteur_id: user.id,
      // Note: Idéalement, ajoutez passager_id dans la table reservations pour lier l'avis au profil exact
      note: rating,
      tags: selectedTags.join(','),
      commentaire: comment
    }]);

    setIsSubmittingRating(false);
    if (!error) {
      setRatingModal(null);
      setRating(0);
      setSelectedTags([]);
      setComment("");
    } else {
      alert("Erreur lors de l'envoi de l'avis.");
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };

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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Validation des billets</h2>
            <p className="text-gray-500">Scannez le code des passagers à l'embarquement.</p>
          </div>
          <button onClick={startScanner} className="w-full md:w-auto bg-yamo-orange text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#D55A1A] transition shadow-lg shadow-yamo-orange/20">
            <ScanLine size={24} /> Scanner un QR Code
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Car className="text-yamo-teal" /> Mes annonces</h2>

        <div className="flex flex-col gap-6">
          {annonces.map((annonce) => (
            <div key={annonce.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative">
              <button onClick={() => supprimerTrajet(annonce.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition cursor-pointer" title="Supprimer ce trajet">
                <Trash2 size={20} />
              </button>

              <div className="flex justify-between items-start mb-4 pr-10">
                <div className="flex flex-col gap-1">
                  <p className="font-black text-xl text-gray-900">{annonce.depart.split(',')[0]} → {annonce.destination.split(',')[0]}</p>
                  <p className="text-gray-500 text-sm">{annonce.vehicule} • {annonce.prix} FCFA</p>
                </div>
              </div>
              <hr className="border-gray-100 my-4" />

              <div>
                <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                  <Users size={16} /> Passagers ({annonce.reservations?.length || 0})
                </h3>
                <div className="flex flex-col gap-3">
                  {annonce.reservations?.map((resa: any) => (
                    <div key={resa.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-yamo-teal text-xs border border-gray-200">
                          {resa.passager_nom.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{resa.passager_nom}</p>
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
          ))}
        </div>
      </div>

      {/* --- LE MODAL DE NOTATION (APPARAÎT APRÈS LE SCAN) --- */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-full max-w-md relative animate-in zoom-in duration-300">
            <button onClick={() => {setRatingModal(null); setRating(0); setSelectedTags([]);}} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition">
              <X size={20} />
            </button>
            
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 text-center mb-1">{ratingModal.titre}</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">Le passager est à bord. Comment s'est passé le contact ?</p>
            
            {/* Les Étoiles */}
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

            {/* Les Badges Interactifs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {TAGS_PASSAGER.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border-2 ${selectedTags.includes(tag) ? 'bg-yamo-teal text-white border-yamo-teal' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'}`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Commentaire optionnel */}
            <textarea
              placeholder="Un petit mot ? (Optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal mb-6 font-medium text-sm resize-none"
              rows={3}
            ></textarea>

            <button 
              onClick={handleRatingSubmit} 
              disabled={isSubmittingRating || rating === 0}
              className={`w-full font-black py-4 rounded-2xl transition flex justify-center items-center gap-2 ${rating === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-yamo-teal text-white hover:bg-[#115566] shadow-lg shadow-yamo-teal/20'}`}
            >
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