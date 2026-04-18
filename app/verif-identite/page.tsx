"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, CheckCircle, Camera, Loader2, CreditCard, Book, FileText, ScanFace, CheckCircle2, Car, AlertCircle } from "lucide-react"; // <-- L'icône AlertCircle est bien ajoutée ici !
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function VerifIdentite() {
  const router = useRouter();
  
  // ÉTAPES : 1:Intro, 2:TypePièce, 3:Recto, 4:Verso, 5:Selfie, 5.1:Permis(Chauffeur), 5.2:CarteGrise(Chauffeur), 6:Revue, 7:Succès
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("passager"); // On récupère le rôle pour adapter le flux
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Données Communes
  const [docType, setDocType] = useState(""); // cni, passeport, permis...
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Données Spécifiques Chauffeur
  const [permisFile, setPermisFile] = useState<File | null>(null);
  const [permisPreview, setPermisPreview] = useState<string | null>(null);
  const [carteGriseFile, setCarteGriseFile] = useState<File | null>(null);
  const [carteGrisePreview, setCarteGrisePreview] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        // On vérifie le rôle de l'utilisateur pour savoir quelles étapes lui afficher
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setRole(profile.role || "passager");
      }
      setLoading(false);
    });
  }, []);

  const selectDocument = (type: string) => {
    setDocType(type);
    setStep(3); // On passe au Recto
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>, type: 'recto' | 'verso' | 'selfie' | 'permis' | 'cartegrise') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);

      if (type === 'recto') {
        setRectoFile(file);
        setRectoPreview(preview);
        if (docType === 'passeport' || docType === 'passeport_etranger') setStep(5); // Selfie
        else setStep(4); // Verso
      } 
      else if (type === 'verso') {
        setVersoFile(file);
        setVersoPreview(preview);
        setStep(5); // Selfie
      } 
      else if (type === 'selfie') {
        setSelfieFile(file);
        setSelfiePreview(preview);
        // NOUVEAU: Si chauffeur, on demande les documents du véhicule !
        if (role === 'chauffeur') setStep(5.1); // Permis de conduire
        else setStep(6); // Revue (Passager)
      }
      else if (type === 'permis') {
        setPermisFile(file);
        setPermisPreview(preview);
        setStep(5.2); // Carte grise
      }
      else if (type === 'cartegrise') {
        setCarteGriseFile(file);
        setCarteGrisePreview(preview);
        setStep(6); // Revue Globale
      }
    }
  };

  const submitVerification = async () => {
    if (!user || !rectoFile || !selfieFile) {
      alert("Erreur: Documents d'identité manquants.");
      return;
    }
    if (role === 'chauffeur' && (!permisFile || !carteGriseFile)) {
      alert("Erreur: En tant que chauffeur, vous devez fournir la photo de votre permis et de la carte grise.");
      return;
    }

    setUploading(true);

    try {
      const timestamp = new Date().getTime();

      // 1. Upload Identité
      const rectoPath = `${user.id}/recto-${timestamp}.jpg`;
      const { error: rectoError } = await supabase.storage.from('kyc_documents').upload(rectoPath, rectoFile);
      if (rectoError) throw rectoError;

      if (versoFile) {
        const versoPath = `${user.id}/verso-${timestamp}.jpg`;
        const { error: versoError } = await supabase.storage.from('kyc_documents').upload(versoPath, versoFile);
        if (versoError) throw versoError;
      }

      const selfiePath = `${user.id}/selfie-${timestamp}.jpg`;
      const { error: selfieError } = await supabase.storage.from('kyc_documents').upload(selfiePath, selfieFile);
      if (selfieError) throw selfieError;

      // 2. Upload Documents Véhicule (Chauffeurs)
      if (role === 'chauffeur' && permisFile && carteGriseFile) {
        const permisPath = `${user.id}/permis-${timestamp}.jpg`;
        const { error: permisError } = await supabase.storage.from('kyc_documents').upload(permisPath, permisFile);
        if (permisError) throw permisError;

        const cgPath = `${user.id}/cartegrise-${timestamp}.jpg`;
        const { error: cgError } = await supabase.storage.from('kyc_documents').upload(cgPath, carteGriseFile);
        if (cgError) throw cgError;
      }

      // 3. MAJ du profil (Statut + Type de doc)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'en_attente',
          kyc_doc_type: docType 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setStep(7); // Succès

    } catch (error: any) {
      console.error("Erreur d'upload :", error);
      alert("Une erreur est survenue lors de l'envoi : " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-yamo-teal font-bold">Vérification de votre compte...</div>;

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-12 relative">
      <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/"><ArrowLeft size={24} className="text-gray-900" /></Link>
          <h1 className="text-xl font-black text-yamo-teal">Vérification</h1>
        </div>
        {step > 1 && step < 7 && (
          <div className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Étape {Math.floor(step) - 1} / {role === 'chauffeur' ? '6' : '4'}
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        
        {/* ÉTAPE 1 : INTRODUCTION */}
        {step === 1 && (
          <div className="animate-in fade-in zoom-in duration-300 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mt-4">
            <div className="w-24 h-24 bg-yamo-teal/10 rounded-full flex items-center justify-center mx-auto mb-8 text-yamo-teal">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Renforçons la confiance</h2>
            <p className="text-gray-500 text-lg mb-6 leading-relaxed px-4">
              Pour assurer la sécurité de tous sur <strong>Yamoh</strong>, nous vérifions les documents officiels de nos membres.
            </p>
            
            {role === 'chauffeur' && (
               <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl text-sm font-bold border border-orange-100 mb-6 flex items-start gap-3 text-left">
                  <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                  <p>En tant que chauffeur, vous devrez également photographier votre <strong>Permis de conduire</strong> et votre <strong>Carte Grise</strong> après votre pièce d'identité.</p>
               </div>
            )}
            
            <div className="bg-gray-50 p-6 rounded-3xl text-left mb-10 space-y-4 border border-gray-100">
              <p className="font-bold text-gray-700 flex items-center gap-3"><CheckCircle size={20} className="text-yamo-teal" /> Vos données sont cryptées et protégées.</p>
              <p className="font-bold text-gray-700 flex items-center gap-3"><CheckCircle size={20} className="text-yamo-teal" /> Obtiens ton badge "Profil Vérifié".</p>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-yamo-teal hover:bg-[#115566] text-white font-black text-lg py-5 rounded-[1.5rem] shadow-xl shadow-yamo-teal/20 transition">
              C'est parti
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : CHOIX DU DOCUMENT */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-3xl font-black mb-4 text-gray-900">Quel document d'identité avez-vous ?</h2>
            <p className="text-gray-500 mb-8 font-medium">Choisissez un document officiel valide et non expiré.</p>
            
            <div className="flex flex-col gap-4">
              <DocumentBtn icon={<CreditCard/>} title="Carte Nationale d'Identité (CNI)" onClick={() => selectDocument('cni')} />
              <DocumentBtn icon={<Book/>} title="Passeport Ivoirien" onClick={() => selectDocument('passeport')} />
              <DocumentBtn icon={<CreditCard/>} title="Carte Consulaire" onClick={() => selectDocument('consulaire')} />
              <DocumentBtn icon={<Book/>} title="Passeport Étranger" onClick={() => selectDocument('passeport_etranger')} />
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : CAPTURE RECTO */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-3xl font-black mb-2 text-gray-900">Prenez le RECTO</h2>
            <p className="text-gray-500 mb-8 font-medium">Placez l'avant de votre document dans le cadre.</p>
            
            <div className="bg-gray-900 rounded-[2.5rem] p-6 mb-8 relative overflow-hidden shadow-2xl">
              <div className="border-4 border-dashed border-white/50 h-56 rounded-xl flex items-center justify-center relative z-10">
                <div className="text-white/30 flex flex-col items-center">
                  <CreditCard size={64} />
                  <span className="font-bold mt-2 tracking-widest uppercase text-sm">Face avant</span>
                </div>
              </div>
            </div>

            <label className="w-full bg-yamo-teal text-white font-black text-lg py-5 rounded-[1.5rem] flex justify-center items-center gap-3 cursor-pointer shadow-xl shadow-yamo-teal/20 transition hover:bg-[#115566]">
              <Camera size={24} /> Ouvrir la caméra
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCapture(e, 'recto')} />
            </label>
          </div>
        )}

        {/* ÉTAPE 4 : CAPTURE VERSO */}
        {step === 4 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-3xl font-black mb-2 text-gray-900">Prenez le VERSO</h2>
            <p className="text-gray-500 mb-8 font-medium">Retournez votre document et cadrez l'arrière.</p>
            
            <div className="bg-gray-900 rounded-[2.5rem] p-6 mb-8 relative overflow-hidden shadow-2xl">
              <div className="border-4 border-dashed border-white/50 h-56 rounded-xl flex items-center justify-center relative z-10">
                <div className="text-white/30 flex flex-col items-center">
                  <FileText size={64} />
                  <span className="font-bold mt-2 tracking-widest uppercase text-sm">Arrière</span>
                </div>
              </div>
            </div>

            <label className="w-full bg-yamo-teal text-white font-black text-lg py-5 rounded-[1.5rem] flex justify-center items-center gap-3 cursor-pointer shadow-xl shadow-yamo-teal/20 transition hover:bg-[#115566]">
              <Camera size={24} /> Ouvrir la caméra
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCapture(e, 'verso')} />
            </label>
          </div>
        )}

        {/* ÉTAPE 5 : SELFIE */}
        {step === 5 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-3xl font-black mb-2 text-gray-900">Le test du Selfie</h2>
            <p className="text-gray-500 mb-8 font-medium">Regardez l'objectif et placez votre visage dans l'ovale. Sans lunettes ni chapeau.</p>
            
            <div className="bg-gray-900 rounded-[2.5rem] p-6 mb-8 relative overflow-hidden shadow-2xl flex justify-center">
              <div className="border-4 border-dashed border-white/50 w-48 h-64 rounded-[100%] flex items-center justify-center relative z-10">
                <ScanFace size={64} className="text-white/30" />
              </div>
            </div>

            <label className="w-full bg-yamo-orange text-white font-black text-lg py-5 rounded-[1.5rem] flex justify-center items-center gap-3 cursor-pointer shadow-xl shadow-yamo-orange/20 transition hover:bg-[#D55A1A]">
              <ScanFace size={24} /> Prendre le selfie
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleCapture(e, 'selfie')} />
            </label>
          </div>
        )}

        {/* ÉTAPE 5.1 : PERMIS (CHAUFFEUR SEULEMENT) */}
        {step === 5.1 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="bg-orange-50 text-yamo-orange inline-flex px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-4">Étape Chauffeur 1/2</div>
            <h2 className="text-3xl font-black mb-2 text-gray-900">Photo du Permis</h2>
            <p className="text-gray-500 mb-8 font-medium">Prenez en photo la face contenant vos informations de permis de conduire.</p>
            
            <div className="bg-gray-900 rounded-[2.5rem] p-6 mb-8 relative overflow-hidden shadow-2xl">
              <div className="border-4 border-dashed border-yamo-orange/50 h-56 rounded-xl flex items-center justify-center relative z-10">
                <div className="text-yamo-orange/50 flex flex-col items-center">
                  <Car size={64} />
                  <span className="font-bold mt-2 tracking-widest uppercase text-sm text-yamo-orange/80">Permis de Conduire</span>
                </div>
              </div>
            </div>

            <label className="w-full bg-gray-900 text-white font-black text-lg py-5 rounded-[1.5rem] flex justify-center items-center gap-3 cursor-pointer shadow-xl shadow-gray-900/20 transition hover:bg-black">
              <Camera size={24} /> Prendre la photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCapture(e, 'permis')} />
            </label>
          </div>
        )}

        {/* ÉTAPE 5.2 : CARTE GRISE (CHAUFFEUR SEULEMENT) */}
        {step === 5.2 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="bg-orange-50 text-yamo-orange inline-flex px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-4">Étape Chauffeur 2/2</div>
            <h2 className="text-3xl font-black mb-2 text-gray-900">Photo de la Carte Grise</h2>
            <p className="text-gray-500 mb-8 font-medium">Prenez en photo votre carte grise bien lisible.</p>
            
            <div className="bg-gray-900 rounded-[2.5rem] p-6 mb-8 relative overflow-hidden shadow-2xl">
              <div className="border-4 border-dashed border-yamo-orange/50 h-56 rounded-xl flex items-center justify-center relative z-10">
                <div className="text-yamo-orange/50 flex flex-col items-center">
                  <FileText size={64} />
                  <span className="font-bold mt-2 tracking-widest uppercase text-sm text-yamo-orange/80">Carte Grise</span>
                </div>
              </div>
            </div>

            <label className="w-full bg-gray-900 text-white font-black text-lg py-5 rounded-[1.5rem] flex justify-center items-center gap-3 cursor-pointer shadow-xl shadow-gray-900/20 transition hover:bg-black">
              <Camera size={24} /> Prendre la photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCapture(e, 'cartegrise')} />
            </label>
          </div>
        )}

        {/* ÉTAPE 6 : REVUE AVANT ENVOI */}
        {step === 6 && (
          <div className="animate-in slide-in-from-right-8 duration-300 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black mb-2 text-gray-900">Vérifiez vos documents</h2>
            <p className="text-gray-500 mb-8 text-sm">Assurez-vous que tout est lisible.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10 text-left">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-gray-400 uppercase">Identité (Recto)</span>
                {rectoPreview && <img src={rectoPreview} className="rounded-2xl h-24 w-full object-cover border border-gray-200" />}
              </div>
              
              {versoPreview && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black text-gray-400 uppercase">Identité (Verso)</span>
                  <img src={versoPreview} className="rounded-2xl h-24 w-full object-cover border border-gray-200" />
                </div>
              )}
              
              <div className="flex flex-col gap-2 col-span-2 mt-2 items-center">
                <span className="text-xs font-black text-gray-400 uppercase">Selfie</span>
                {selfiePreview && <img src={selfiePreview} className="rounded-full h-32 w-32 object-cover border-4 border-gray-200" />}
              </div>

              {/* Revue Docs Chauffeur */}
              {role === 'chauffeur' && (
                <>
                  <div className="col-span-2 border-t border-gray-100 my-4"></div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black text-yamo-orange uppercase">Permis</span>
                    {permisPreview && <img src={permisPreview} className="rounded-2xl h-24 w-full object-cover border border-gray-200" />}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black text-yamo-orange uppercase">Carte Grise</span>
                    {carteGrisePreview && <img src={carteGrisePreview} className="rounded-2xl h-24 w-full object-cover border border-gray-200" />}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={submitVerification} 
              disabled={uploading}
              className={`w-full text-white font-black text-lg py-5 rounded-[1.5rem] transition flex items-center justify-center gap-2 shadow-xl ${uploading ? 'bg-gray-400' : 'bg-yamo-teal hover:bg-[#115566] shadow-yamo-teal/20'}`}
            >
              {uploading ? <><Loader2 className="animate-spin" /> Envoi sécurisé...</> : "Soumettre le dossier"}
            </button>
            <button onClick={() => setStep(2)} disabled={uploading} className="w-full mt-6 text-gray-400 font-bold hover:text-gray-900 transition">
              Recommencer
            </button>
          </div>
        )}

        {/* ÉTAPE 7 : SUCCÈS */}
        {step === 7 && (
          <div className="animate-in zoom-in duration-500 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center mt-10">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">C'est dans la boîte !</h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Vos documents ont bien été transmis de façon sécurisée. Notre équipe les validera très vite.
            </p>
            <Link href="/">
              <button className="w-full bg-yamo-teal text-white font-black text-lg py-5 rounded-[1.5rem] hover:bg-[#115566] transition shadow-xl shadow-yamo-teal/20">
                Aller à l'accueil
              </button>
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}

function DocumentBtn({ icon, title, onClick }: { icon: any, title: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4 hover:border-yamo-teal hover:shadow-md transition group text-left"
    >
      <div className="bg-gray-50 p-3 rounded-xl text-yamo-teal group-hover:bg-yamo-teal/10 transition">
        {icon}
      </div>
      <span className="font-bold text-gray-800 text-lg flex-1">{title}</span>
    </button>
  );
}