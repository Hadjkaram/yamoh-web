"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Upload, CheckCircle, Camera, UserSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function VerifIdentite() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fichiers et Prévisualisations
  const [cniFile, setCniFile] = useState<File | null>(null);
  const [cniPreview, setCniPreview] = useState<string | null>(null);
  
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Gérer la sélection de la CNI
  const handleCniCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCniFile(file);
      setCniPreview(URL.createObjectURL(file));
      setStep(3); // On passe au selfie
    }
  };

  // Gérer la sélection du Selfie
  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
      setStep(4); // On passe à l'écran de validation
    }
  };

  // Fonction finale pour tout envoyer à Supabase
  const submitVerification = async () => {
    if (!user || !cniFile || !selfieFile) {
      alert("Erreur: Données manquantes.");
      return;
    }

    setLoading(true);

    try {
      const timestamp = new Date().getTime();

      // 1. Upload CNI dans le bucket 'kyc_documents' (Dossier au nom de l'user ID)
      const cniPath = `${user.id}/cni-${timestamp}.jpg`;
      const { error: cniError } = await supabase.storage
        .from('kyc_documents')
        .upload(cniPath, cniFile);

      if (cniError) throw cniError;

      // 2. Upload Selfie
      const selfiePath = `${user.id}/selfie-${timestamp}.jpg`;
      const { error: selfieError } = await supabase.storage
        .from('kyc_documents')
        .upload(selfiePath, selfieFile);

      if (selfieError) throw selfieError;

      // 3. Mettre à jour le profil avec le statut "en attente"
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verification_status: 'en_attente' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Succès !
      setStep(5);

    } catch (error: any) {
      console.error("Erreur d'upload :", error);
      alert("Une erreur est survenue lors de l'envoi : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-12">
      <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-50 flex items-center gap-4 shadow-sm">
        <Link href="/"><ArrowLeft size={24} className="text-gray-900" /></Link>
        <h1 className="text-xl font-black text-yamo-teal">Vérification d'identité</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        
        {/* ÉTAPE 1 : INTRODUCTION */}
        {step === 1 && (
          <div className="animate-in fade-in zoom-in duration-500 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-yamo-teal/10 rounded-full flex items-center justify-center mx-auto mb-8 text-yamo-teal">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Renforçons la confiance</h2>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              Pour assurer la sécurité de tous sur <strong>Yamoh</strong>, nous vérifions les documents officiels de nos membres.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-3xl text-left mb-10 space-y-4 border border-gray-100">
              <p className="font-bold text-gray-700 flex items-center gap-3">
                <CheckCircle size={20} className="text-yamo-teal" /> Votre document reste strictement confidentiel.
              </p>
              <p className="font-bold text-gray-700 flex items-center gap-3">
                <CheckCircle size={20} className="text-yamo-teal" /> Seul un badge "Vérifié" sera visible.
              </p>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-yamo-teal hover:bg-[#115566] text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-yamo-teal/20 transition">
              Commencer la vérification
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : PHOTO DE LA CNI */}
        {step === 2 && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8">
              <span className="bg-yamo-teal/10 text-yamo-teal font-black px-4 py-2 rounded-full text-sm">Étape 1 sur 2</span>
            </div>
            <h2 className="text-3xl font-black mb-4">Votre pièce d'identité</h2>
            <p className="text-gray-500 mb-8">Prenez en photo l'avant de votre CNI ou Passeport. Assurez-vous que le texte soit bien lisible.</p>
            
            <label className="border-4 border-dashed border-gray-200 bg-white rounded-[2.5rem] p-12 md:p-20 flex flex-col items-center justify-center gap-6 group hover:border-yamo-teal hover:bg-gray-50 transition cursor-pointer shadow-sm">
              <div className="bg-gray-100 p-6 rounded-full group-hover:bg-yamo-teal/10 transition">
                <Camera size={48} className="text-gray-400 group-hover:text-yamo-teal transition" />
              </div>
              <p className="text-gray-600 font-bold text-lg">Scanner la pièce d'identité</p>
              {/* Le "capture='environment'" ouvre la caméra arrière sur mobile */}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCniCapture} />
            </label>
          </div>
        )}

        {/* ÉTAPE 3 : SELFIE */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <div className="mb-8">
              <span className="bg-yamo-orange/10 text-yamo-orange font-black px-4 py-2 rounded-full text-sm">Étape 2 sur 2</span>
            </div>
            <h2 className="text-3xl font-black mb-4">Prenez un Selfie</h2>
            <p className="text-gray-500 mb-8">Nous devons vérifier que vous êtes bien la personne sur la pièce d'identité.</p>
            
            <label className="border-4 border-dashed border-gray-200 bg-white rounded-[2.5rem] p-12 md:p-20 flex flex-col items-center justify-center gap-6 group hover:border-yamo-orange hover:bg-gray-50 transition cursor-pointer shadow-sm">
              <div className="bg-gray-100 p-6 rounded-full group-hover:bg-yamo-orange/10 transition">
                <UserSquare size={48} className="text-gray-400 group-hover:text-yamo-orange transition" />
              </div>
              <p className="text-gray-600 font-bold text-lg">Prendre un selfie</p>
              {/* Le "capture='user'" ouvre la caméra frontale sur mobile */}
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieCapture} />
            </label>
          </div>
        )}

        {/* ÉTAPE 4 : CONFIRMATION AVANT ENVOI */}
        {step === 4 && (
          <div className="animate-in slide-in-from-bottom-8 duration-500 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black mb-8 text-gray-900">Vérifiez vos photos</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-500">Document</span>
                {cniPreview && <img src={cniPreview} alt="CNI" className="rounded-2xl h-32 object-cover border border-gray-200 shadow-sm" />}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-500">Selfie</span>
                {selfiePreview && <img src={selfiePreview} alt="Selfie" className="rounded-2xl h-32 object-cover border border-gray-200 shadow-sm" />}
              </div>
            </div>

            <button 
              onClick={submitVerification} 
              disabled={loading}
              className={`w-full text-white font-black text-lg py-5 rounded-2xl transition flex items-center justify-center gap-2 shadow-xl ${loading ? 'bg-gray-400' : 'bg-yamo-orange hover:bg-[#D55A1A] shadow-yamo-orange/20'}`}
            >
              {loading ? <><Loader2 className="animate-spin" /> Envoi en cours...</> : "Soumettre pour validation"}
            </button>
            <button onClick={() => setStep(2)} disabled={loading} className="w-full mt-4 text-gray-500 font-bold hover:text-gray-900 transition">
              Recommencer
            </button>
          </div>
        )}

        {/* ÉTAPE 5 : SUCCÈS */}
        {step === 5 && (
          <div className="animate-in zoom-in duration-500 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">C'est dans la boîte !</h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Vos documents ont bien été envoyés. Notre équipe va les vérifier très rapidement. Vous pouvez déjà commencer à utiliser l'application !
            </p>
            <Link href="/">
              <button className="w-full bg-yamo-teal text-white font-black text-lg py-5 rounded-2xl hover:bg-[#115566] transition shadow-xl shadow-yamo-teal/20">
                Aller à l'accueil
              </button>
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}