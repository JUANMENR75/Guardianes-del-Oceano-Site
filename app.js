/* ==========================================
   GUARDIANES DEL OCÉANO - APP.JS
   PWA Y NOTIFICACIONES PUSH SUPABASE
   ========================================== */

const PUBLIC_VAPID_KEY = 'BFFdg_Y6A-AxcKH7VWD5EupX9UJpxg59nqcgWSubGjG6Y71MZCQoaNsLO2Ryry3glFo1Tp6NTdbaCJOEhg3HiYQ';

// Función auxiliar para convertir la clave VAPID pública
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

document.addEventListener("DOMContentLoaded", () => {

    console.log("Guardianes del Océano está listo.");

    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js")
            .then(registro => {
                console.log("Service Worker registrado:", registro.scope);
                configurarNotificaciones(registro);
            })
            .catch(error => {
                console.error("Error al registrar:", error);
            });
    }

    // Detectar si la aplicación está instalada
    const instalada =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    console.log(
        instalada
            ? "Aplicación instalada."
            : "Aplicación abierta desde el navegador."
    );
});

// Detectar conexión
window.addEventListener("online", () => {
    console.log("Conexión recuperada.");
});

window.addEventListener("offline", () => {
    console.log("Sin conexión a internet.");
});

// ==========================================
// NOTIFICACIONES
// ==========================================

function configurarNotificaciones(registro) {

    const activar = document.getElementById("activar-notificaciones");
    const desactivar = document.getElementById("desactivar-notificaciones");
    const estado = document.getElementById("estado-notificaciones");

    function mostrarEstado(mensaje) {
        if (estado) estado.textContent = mensaje;
        console.log(mensaje);
    }

    // Consultar permiso
    if ("permissions" in navigator) {
        navigator.permissions.query({ name: "notifications" })
            .then(resultado => {
                mostrarEstado(
                    resultado.state === "granted"
                        ? "Tienes las notificaciones permitidas."
                        : resultado.state === "denied"
                            ? "Las notificaciones están bloqueadas."
                            : "Puedes activar las notificaciones."
                );

                resultado.onchange = () => {
                    mostrarEstado("Permiso actualizado: " + resultado.state);
                };
            })
            .catch(() => {
                mostrarEstado("Puedes configurar tus notificaciones.");
            });
    }

    // ACTIVAR Y SUSCRIBIR EN SUPABASE
    if (activar) {
        activar.addEventListener("click", async () => {

            if (!("Notification" in window) || !("PushManager" in window)) {
                mostrarEstado("Tu navegador no admite notificaciones Push.");
                return;
            }

            try {
                const permiso = await Notification.requestPermission();

                if (permiso !== "granted") {
                    mostrarEstado("No se concedió el permiso.");
                    return;
                }

                mostrarEstado("Registrando suscripción...");

                // 1. Obtener la suscripción Push desde el Service Worker
                let suscripcion = await registro.pushManager.getSubscription();
                if (!suscripcion) {
                    suscripcion = await registro.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                    });
                }

                // 2. Guardar la suscripción en Supabase vía Vercel API
                const respuesta = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(suscripcion)
                });

                if (!respuesta.ok) throw new Error("Error al guardar en el servidor");

                // 3. Mostrar notificación de confirmación
                await registro.showNotification("Guardianes del Océano", {
                    body: "¡Gracias por activar las notificaciones y cuidar nuestros océanos!",
                    icon: "./Icono/Icono.png",
                    badge: "./Icono/Icono.png"
                });

                mostrarEstado("¡Notificaciones activadas y suscripción guardada!");

            } catch (error) {
                console.error("Error al activar notificaciones:", error);
                mostrarEstado("No se pudo activar las notificaciones.");
            }
        });
    }

    // DESACTIVAR
    if (desactivar) {
        desactivar.addEventListener("click", async () => {

            if (!("Notification" in window)) return;

            mostrarEstado(
                "Para bloquear las notificaciones, cambia el permiso desde la configuración de tu navegador."
            );
        });
    }
}