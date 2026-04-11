"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Car, QrCode, CheckCircle, X, ScanLine, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

export default function DashboardConducteur() {
  const router = useRouter();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);

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
        *,
        reservations (
          id,
          passager_nom,
          date_reservation,
          statut
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

  // --- NOUVELLE FONCTION : SUPPRIMER UN TRAJET ---
  const supprimerTrajet = async (trajetId: string) => {
    const confirmation = window.confirm("Es-tu sûr de vouloir supprimer ce trajet ? Cette action est irréversible et annulera toutes les réservations associées.");
    
    if (confirmation) {
      try {
        // 1. Supprimer le trajet (la suppression en cascade dans Supabase devrait gérer les réservations)
        const { error } = await supabase
          .from('trajets')
          .delete()
          .eq('id', trajetId);

        if (error) throw error;

        alert("Trajet supprimé avec succès.");
        // Mettre à jour l'affichage localement
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
    const { data, error } = await supabase
      .from('reservations')
      .select('id, statut, passager_nom')
      .eq('id', reservationId)
      .single();

    if (error || !data) {
      alert("❌ QR Code invalide.");
      return;
    }

    if (data.statut === 'valide') {
      alert(`⚠️ Déjà validé pour ${data.passager_nom}`);
      return;
    }

    await supabase.from('reservations').update({ statut: 'valide' }).eq('id', reservationId);
    alert(`✅ Validé pour ${data.passager_nom}`);
    fetchDashboardData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-yamo-teal">Chargement...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12 relative">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
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
          <button onClick={startScanner} className="w-full md:w-auto bg-yamo-orange text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2">
            <ScanLine size={24} /> Scanner
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Car className="text-yamo-teal" /> Mes annonces
        </h2>

        <div className="flex flex-col gap-6">
          {annonces.map((annonce) => (
            <div key={annonce.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative">
              
              {/* BOUTON SUPPRIMER */}
              <button 
                onClick={() => supprimerTrajet(annonce.id)}
                className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition cursor-pointer"
                title="Supprimer ce trajet"
              >
                <Trash2 size={20} />
              </button>

              <div className="flex justify-between items-start mb-4 pr-10">
                <div className="flex flex-col gap-1">
                  <p className="font-black text-xl text-gray-900">{annonce.depart} → {annonce.destination}</p>
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
                        <span className="text-green-500 bg-green-50 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <CheckCircle size={12} /> Scanné
                        </span>
                      ) : (
                        <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <Clock size={12} /> Attente
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