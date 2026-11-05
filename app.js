/* ==========================================
   GUARDIANES DEL OCÉANO - APP.JS
   PWA Y NOTIFICACIONES LOCALES (GITHUB PAGES)
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    console.log("Guardianes del Océano está listo.");

    // Registrar Service Worker de tu PWA
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js")
            .then(registro => {
                console.log("Service Worker registrado:", registro.scope);
                configurarNotificaciones(registro);
            })
            .catch(error => {
                console.error("Error al registrar el Service Worker:", error);
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
// NOTIFICACIONES LOCALES CON SERVICE WORKER
// ==========================================

function configurarNotificaciones(registro) {
    const activar = document.getElementById("activar-notificaciones");
    const desactivar = document.getElementById("desactivar-notificaciones");
    const estado = document.getElementById("estado-notificaciones");

    function mostrarEstado(mensaje) {
        if (estado) estado.textContent = mensaje;
        console.log(mensaje);
    }

    // Consultar permiso del navegador
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

    // ACTIVAR NOTIFICACIÓN EN EL CLIENTE
    if (activar) {
        activar.addEventListener("click", async () => {
            if (!("Notification" in window)) {
                mostrarEstado("Tu navegador no admite notificaciones.");
                return;
            }

            try {
                const permiso = await Notification.requestPermission();

                if (permiso !== "granted") {
                    mostrarEstado("No se concedió el permiso.");
                    return;
                }

                mostrarEstado("Activando notificaciones...");

                // Lanza la notificación usando tu Service Worker local
                await registro.showNotification("Guardianes del Océano", {
                    body: "¡Gracias por activar las notificaciones y cuidar nuestros océanos!",
                    icon: "./Icono/Icono.png",
                    badge: "./Icono/Icono.png",
                    vibrate: [200, 100, 200]
                });

                mostrarEstado("¡Notificaciones activadas con éxito!");

            } catch (error) {
                console.error("Error al activar notificaciones:", error);
                mostrarEstado("No se pudo activar las notificaciones.");
            }
        });
    }

    // DESACTIVAR
    if (desactivar) {
        desactivar.addEventListener("click", () => {
            if (!("Notification" in window)) return;

            mostrarEstado(
                "Para bloquear las notificaciones, cambia el permiso desde la configuración de tu navegador."
            );
        });
    }
}