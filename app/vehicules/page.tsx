"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Car, Plus, Trash2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function VehiculesPage() {
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newVehicule, setNewVehicule] = useState({ marque: "", modele: "", couleur: "" });

  useEffect(() => {
    fetchVehicules();
  }, []);

  async function fetchVehicules() {
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('vehicules').select('*').eq('user_id', session?.user.id);
    if (data) setVehicules(data);
    setLoading(false);
  }

  async function handleAdd() {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('vehicules').insert([{ ...newVehicule, user_id: session?.user.id }]);
    setNewVehicule({ marque: "", modele: "", couleur: "" });
    setShowAdd(false);
    fetchVehicules();
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-12">
      <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-50 flex items-center gap-4">
        <Link href="/profil"><ArrowLeft size={24} className="text-gray-900" /></Link>
        <h1 className="text-xl font-black text-yamo-teal">Mes véhicules</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 mt-10">
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full bg-white border-2 border-dashed border-yamo-teal text-yamo-teal font-black py-6 rounded-[2rem] mb-8 flex items-center justify-center gap-2 hover:bg-yamo-teal/5 transition"
        >
          <Plus size={24} /> Ajouter un véhicule
        </button>

        {showAdd && (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl mb-10 animate-in slide-in-from-top-4">
            <h3 className="text-xl font-black mb-6">Nouveau véhicule</h3>
            <div className="space-y-4">
              <input placeholder="Marque (ex: Toyota)" className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal" value={newVehicule.marque} onChange={e => setNewVehicule({...newVehicule, marque: e.target.value})} />
              <input placeholder="Modèle (ex: Corolla)" className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal" value={newVehicule.modele} onChange={e => setNewVehicule({...newVehicule, modele: e.target.value})} />
              <input placeholder="Couleur" className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:border-yamo-teal" value={newVehicule.couleur} onChange={e => setNewVehicule({...newVehicule, couleur: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-4 font-bold text-gray-400">Annuler</button>
                <button onClick={handleAdd} className="flex-1 bg-yamo-teal text-white font-black py-4 rounded-2xl">Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {vehicules.map(v => (
            <div key={v.id} className="bg-white p-6 rounded-[2rem] flex items-center justify-between border border-gray-100 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gray-50 rounded-2xl text-yamo-teal"><Car /></div>
                <div>
                  <p className="font-black text-gray-900 text-lg">{v.marque} {v.modele}</p>
                  <p className="text-sm text-gray-400 font-bold uppercase">{v.couleur}</p>
                </div>
              </div>
              <button className="text-gray-300 hover:text-red-500 transition"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}