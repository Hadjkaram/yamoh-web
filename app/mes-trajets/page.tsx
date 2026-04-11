"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, MapPin, X } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code"; // On importe le vrai générateur de QR Code !

export default function MesTrajets() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NOUVEAU : État pour gérer l'affichage du QR Code en plein écran
  const [selectedResa, setSelectedResa] = useState<any>(null);

  useEffect(() => {
    async function fetchMesReservations() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/connexion');
        return;
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          date_reservation,
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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12 relative">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-40">
        <Link href="/">
          <ArrowLeft size={24} className="text-gray-600 hover:text-black" />
        </Link>
        <h1 className="text-xl font-bold text-yamo-teal">Mes réservations</h1>
      </header>

      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500">Chargement de vos billets...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl p-8 border border-gray-100">
            <QrCode size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-800">Aucun trajet réservé</p>
            <p className="text-gray-500 mt-2">Vos prochains billets apparaîtront ici.</p>
            <Link href="/">
              <button className="mt-6 bg-yamo-orange text-white font-bold px-6 py-3 rounded-full">Rechercher un trajet</button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {reservations.map((resa) => (
              <div key={resa.id} className="bg-yamo-teal rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-white/10 rounded-full"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-black text-xl tracking-widest opacity-80">YAMOH TICKET</span>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full border-4 border-white"></div>
                      <div className="w-1 h-12 bg-white/30 my-1"></div>
                      <div className="w-4 h-4 rounded-full border-4 border-yamo-orange bg-white"></div>
                    </div>
                    <div className="flex flex-col justify-between h-20">
                      <p className="text-2xl font-bold">{resa.trajets.depart}</p>
                      <p className="text-2xl font-bold">{resa.trajets.destination}</p>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm opacity-80 mb-1">Conducteur</p>
                        <p className="font-bold">{resa.trajets.conducteur_nom}</p>
                        <p className="text-sm opacity-80">{resa.trajets.vehicule}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm opacity-80 mb-1">Montant à régler</p>
                        <p className="text-2xl font-black text-yamo-orange">{resa.trajets.prix} FCFA</p>
                      </div>
                    </div>
                    
                    {/* NOUVEAU BOUTON INTERACTIF */}
                    <button 
                      onClick={() => setSelectedResa(resa)}
                      className="w-full bg-white text-yamo-teal font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition cursor-pointer"
                    >
                      <QrCode size={20} /> Afficher le QR Code pour le conducteur
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LA FENÊTRE MODALE (POP-UP) DU QR CODE */}
      {selectedResa && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedResa(null)} // Ferme la pop-up si on clique dans le vide
        >
          <div 
            className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique sur la boîte blanche
          >
            {/* Bouton Fermer */}
            <button 
              onClick={() => setSelectedResa(null)}
              className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-yamo-teal mb-2 text-center">Scan Conducteur</h3>
            <p className="text-gray-500 text-center mb-8">Présentez ce code à {selectedResa.trajets.conducteur_nom} avant de monter.</p>
            
            {/* LE VRAI QR CODE GÉNÉRÉ */}
            <div className="bg-white p-4 rounded-2xl border-4 border-yamo-teal shadow-inner">
              <QRCode 
                value={selectedResa.id} // C'est l'ID unique de la réservation qui est crypté !
                size={220}
                fgColor="#166C82" // Couleur yamoTeal
              />
            </div>

            <p className="text-xs text-gray-400 mt-6 font-mono text-center">ID: {selectedResa.id}</p>
          </div>
        </div>
      )}

    </main>
  );
}