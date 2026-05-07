import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    
    // Vérification de l'événement selon la doc GeniusPay
    if (body.event !== 'payment.success') {
      return NextResponse.json({ message: 'Ignoré (pas un succès)' });
    }

    // Récupération des données selon la structure de la doc
    const userId = body.data?.metadata?.user_id;
    const amountPaid = Number(body.data?.amount);

    if (!userId || !amountPaid) {
      return NextResponse.json({ error: 'Données utilisateur manquantes' }, { status: 400 });
    }

    // Vérification du solde actuel
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('solde_wallet')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Ajout du montant
    const nouveauSolde = (profile?.solde_wallet || 0) + amountPaid;

    // Sauvegarde du nouveau solde
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ solde_wallet: nouveauSolde })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Portefeuille rechargé !' });

  } catch (error) {
    console.error("Erreur Webhook:", error);
    return NextResponse.json({ error: 'Erreur Interne' }, { status: 500 });
  }
}