"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, MapPin, X, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code"; 

export default function MesTrajets() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResa, setSelectedResa] = useState<any>(null);

  useEffect(() => {
    async function fetchMesReservations() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/connexion');
        return;
      }

      // NOUVEAU : On récupère aussi le "statut" pour savoir s'il est déjà scanné
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          date_reservation,
          statut,
          trajets (
            depart,
            destination,
            prix,
            conducteur_nom,
            vehicule
          )
        `)
        .eq('passager_email', session.user.email)
        .order('date_reservation', { ascending: false });

      if (!error && data) {
        setReservations(data);
      }
      setLoading(false);
    }

    fetchMesReservations();
  }, [router]);

  // Fonction pour déclencher l'impression / sauvegarde PDF du navigateur
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12 relative">
      {/* On cache le header lors de l'impression PDF */}
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-40 print:hidden">
        <Link href="/">
          <ArrowLeft size={24} className="text-gray-600 hover:text-black" />
        </Link>
        <h1 className="text-xl font-bold text-yamo-teal">Mes réservations</h1>
      </header>

      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full print:p-0">
        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500">Chargement de vos billets...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl p-8 border border-gray-100 print:hidden">
            <QrCode size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-800">Aucun trajet réservé</p>
            <p className="text-gray-500 mt-2">Vos prochains billets apparaîtront ici.</p>
            <Link href="/">
              <button className="mt-6 bg-yamo-orange text-white font-bold px-6 py-3 rounded-full">Rechercher un trajet</button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {reservations.map((resa) => {
              const isUsed = resa.statut === 'valide';

              return (
                <div key={resa.id} className={`rounded-3xl p-6 shadow-lg text-white relative overflow-hidden print:shadow-none print:border print:border-gray-300 print:text-black ${isUsed ? 'bg-gray-400' : 'bg-yamo-teal'}`}>
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full print:hidden"></div>
                  <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-white/10 rounded-full print:hidden"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-black text-xl tracking-widest opacity-80">YAMOH TICKET</span>
                      {isUsed && <span className="bg-white text-gray-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider print:border print:border-gray-800">Utilisé</span>}
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-4 ${isUsed ? 'border-gray-200' : 'border-white'} print:border-gray-800`}></div>
                        <div className={`w-1 h-12 my-1 ${isUsed ? 'bg-gray-200/30' : 'bg-white/30'} print:bg-gray-400`}></div>
                        <div className={`w-4 h-4 rounded-full border-4 bg-white ${isUsed ? 'border-gray-300' : 'border-yamo-orange'} print:border-black`}></div>
                      </div>
                      <div className="flex flex-col justify-between h-20">
                        <p className="text-2xl font-bold">{resa.trajets.depart}</p>
                        <p className="text-2xl font-bold">{resa.trajets.destination}</p>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-sm print:bg-gray-50 print:text-black">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm opacity-80 mb-1 font-medium">Conducteur</p>
                          <p className="font-bold text-lg">{resa.trajets.conducteur_nom}</p>
                          <p className="text-sm opacity-80">{resa.trajets.vehicule}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-80 mb-1 font-medium">Montant à régler</p>
                          <p className={`text-2xl font-black ${isUsed ? 'text-white' : 'text-yamo-orange'} print:text-black`}>
                            {resa.trajets.prix} FCFA
                          </p>
                        </div>
                      </div>
                      
                      {/* NOUVEAU LOGIQUE : Si utilisé = Disparait. Sinon = Bouton QR */}
                      {!isUsed ? (
                        <button 
                          onClick={() => setSelectedResa(resa)}
                          className="w-full bg-white text-yamo-teal font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition cursor-pointer print:hidden"
                        >
                          <QrCode size={20} /> Afficher le QR Code
                        </button>
                      ) : (
                        <div className="w-full bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 print:text-gray-800 print:bg-transparent">
                          <CheckCircle2 size={20} /> Billet validé par le chauffeur
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LA FENÊTRE MODALE DU QR CODE (Cachée à l'impression, gérée avec un autre style) */}
      {selectedResa && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm transition-opacity print:bg-white print:items-start print:pt-10"
          onClick={() => setSelectedResa(null)}
        >
          <div 
            className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center relative shadow-2xl print:shadow-none print:w-full print:max-w-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedResa(null)}
              className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition cursor-pointer print:hidden"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-yamo-teal mb-2 text-center">Billet Yamoh</h3>
            <p className="text-gray-500 text-center mb-8 print:hidden">Présentez ce code à {selectedResa.trajets.conducteur_nom} avant de monter.</p>
            
            <div className="bg-white p-4 rounded-2xl border-4 border-yamo-teal shadow-inner mb-6">
              <QRCode 
                value={selectedResa.id} 
                size={220}
                fgColor="#166C82" 
              />
            </div>

            <div className="w-full bg-gray-50 p-4 rounded-xl mb-6 text-center border border-gray-100">
              <p className="font-bold text-gray-900">{selectedResa.trajets.depart} → {selectedResa.trajets.destination}</p>
              <p className="text-sm text-gray-500 mt-1">Conducteur : {selectedResa.trajets.conducteur_nom}</p>
            </div>

            {/* BOUTON TÉLÉCHARGER EN PDF */}
            <button 
              onClick={handleDownloadPDF}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition print:hidden"
            >
              <Download size={20} /> Sauvegarder en PDF
            </button>
            <p className="text-xs text-gray-400 mt-4 font-mono text-center print:text-black">ID: {selectedResa.id}</p>
          </div>
        </div>
      )}
    </main>
  );
}