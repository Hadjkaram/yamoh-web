import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, provider, phone, userId } = body;

    // L'URL exacte tirée de la documentation GeniusPay
    const geniusPayResponse = await fetch('https://pay.genius.ci/api/v1/merchant/payments', { 
      method: 'POST',
      headers: {
        // GeniusPay exige ces deux headers spécifiques
        'X-API-Key': process.env.GENIUSPAY_API_KEY!,
        'X-API-Secret': process.env.GENIUSPAY_API_SECRET!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        payment_method: provider, // ex: 'wave', 'orange_money'
        customer: {
          phone: phone // Doit inclure l'indicatif (ex: +225...)
        },
        metadata: {
          user_id: userId // Pour que le webhook sache à qui donner l'argent
        }
      })
    });

    const json = await geniusPayResponse.json();

    // Gestion des erreurs selon la documentation GeniusPay
    if (!json.success) {
        return NextResponse.json({ error: json.error?.message || "Erreur GeniusPay" }, { status: 400 });
    }

    // GeniusPay renvoie payment_url (si provider spécifié) ou checkout_url
    const paymentUrl = json.data.payment_url || json.data.checkout_url;

    return NextResponse.json({ url: paymentUrl });

  } catch (error) {
    console.error("Erreur Init Paiement:", error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}