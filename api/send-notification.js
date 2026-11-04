import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:soporte@guardianesdeloceano.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { 
    title = 'Guardianes del Océano', 
    body = '¡Nueva actualización en el océano!', 
    icon = '/icon-192.png' 
  } = req.body || {};

  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;

    const notificationPayload = JSON.stringify({ title, body, icon });

    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, notificationPayload)
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          console.error('Error enviando a:', sub.endpoint, err);
        });
    });

    await Promise.all(sendPromises);

    return res.status(200).json({ message: 'Notificaciones enviadas correctamente' });
  } catch (err) {
    console.error('Error enviando notificaciones:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}