import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Suscripción inválida' });
    }

    const { endpoint, keys } = subscription;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth
        },
        { onConflict: 'endpoint' }
      );

    if (error) throw error;

    return res.status(200).json({ message: 'Suscripción guardada exitosamente' });
  } catch (err) {
    console.error('Error al guardar suscripción:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}