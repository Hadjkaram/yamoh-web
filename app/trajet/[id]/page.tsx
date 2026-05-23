import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import { MapPin, Navigation, Calendar, Smartphone, Users } from "lucide-react";

type Props = {
  params: { id: string };
};

// 1. GÉNÉRATION DE L'APERÇU POUR WHATSAPP ET FACEBOOK (Open Graph)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: trajet } = await supabase
    .from('trajets')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!trajet) {
    return { title: "Trajet introuvable | Yamoh" };
  }

  // Formatage propre des villes
  const depart = trajet.depart?.split(',')[0] || "Départ";
  const dest = trajet.destination?.split(',')[0] || "Destination";
  const dateFormatee = new Date(trajet.date_depart).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });

  const title = `🚗 ${depart} ➔ ${dest} avec ${trajet.conducteur_nom}`;
  const description = `Départ le ${dateFormatee} à ${trajet.heure_depart?.substring(0,5)}. Il reste ${trajet.places_disponibles} place(s) à ${trajet.prix} FCFA. Réservez vite sur Yamoh !`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      siteName: "Yamoh",
      images: [
        {
          url: "https://www.yamoh.net/securite_verified.jpg", // Image d'aperçu par défaut (on utilise celle de ton site)
          width: 1200,
          height: 630,
          alt: "Covoiturage Yamoh",
        }
      ],
      locale: "fr_FR",
      type: "website",
    },
  };
}

// 2. L'INTERFACE WEB (Si l'utilisateur clique sur le lien depuis un navigateur)
export default async function TrajetPage({ params }: Props) {
  const { data: trajet } = await supabase
    .from('trajets')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!trajet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Ce trajet n'est plus disponible.</h1>
          <p className="text-gray-500">Le chauffeur a peut-être annulé ou le trajet est complet.</p>
        </div>
      </div>
    );
  }

  const dateFormatee = new Date(trajet.date_depart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        {/* Header coloré */}
        <div className="bg-[#166C82] p-8 text-white text-center">
          <img src="/Yamo_Logo.png" alt="Yamoh" className="h-10 mx-auto mb-6 brightness-200" />
          <p className="text-sm font-bold uppercase tracking-widest text-[#166C82] bg-white inline-block px-3 py-1 rounded-full mb-4">
            {trajet.type_trajet === 'evenement' ? '🎊 Trajet Événement' : '🤝 Trajet Quotidien'}
          </p>
          <h1 className="text-3xl font-black">{trajet.prix} FCFA <span className="text-sm font-normal opacity-80">/ place</span></h1>
        </div>

        {/* Détails du trajet */}
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center mt-1">
              <MapPin size={20} className="text-[#E66825]" />
              <div className="w-0.5 h-10 bg-gray-200 my-1"></div>
              <Navigation size={20} className="text-[#166C82]" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Départ</p>
                <p className="font-black text-lg text-gray-900 leading-tight">{trajet.depart}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Arrivée</p>
                <p className="font-black text-lg text-gray-900 leading-tight">{trajet.destination}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100">
            <div className="flex items-center gap-3">
              <Calendar className="text-gray-400" size={20} />
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
                <p className="font-bold text-gray-900 capitalize">{dateFormatee}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-lg">{trajet.heure_depart?.substring(0, 5)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-[#166C82]/10 text-[#166C82] rounded-full flex items-center justify-center font-black text-lg">
                 {trajet.conducteur_nom.charAt(0)}
               </div>
               <div>
                 <p className="text-xs font-bold text-gray-400 uppercase">Chauffeur</p>
                 <p className="font-black text-gray-900">{trajet.conducteur_nom}</p>
               </div>
             </div>
             <div className="text-right">
               <p className="text-xs font-bold text-gray-400 uppercase">Places</p>
               <p className="font-black text-[#E66825] flex items-center gap-1"><Users size={16}/> {trajet.places_disponibles}</p>
             </div>
          </div>
        </div>

        {/* CTA Téléchargement */}
        <div className="p-8 bg-gray-900 text-center">
          <h3 className="text-white font-black text-xl mb-2">Réservez cette place</h3>
          <p className="text-gray-400 text-sm mb-6">Ouvrez ou téléchargez l'application Yamoh pour confirmer votre place instantanément.</p>
          <a href="https://play.google.com/store/apps/details?id=net.yamoh.app" className="flex items-center justify-center gap-2 bg-white text-gray-900 w-full py-4 rounded-xl font-black hover:bg-gray-100 transition">
            <Smartphone size={20}/> Ouvrir dans l'Application
          </a>
        </div>
      </div>
    </main>
  );
}