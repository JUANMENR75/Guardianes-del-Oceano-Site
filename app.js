
/* ==========================================
   GUARDIANES DEL OCÉANO - APP.JS
   ========================================== */

// Comprobar que la aplicación se haya cargado
document.addEventListener("DOMContentLoaded", () => {
    console.log("Guardianes del Océano está listo.");

    // Registrar el Service Worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js")
            .then((registro) => {
                console.log(
                    "Service Worker registrado correctamente:",
                    registro.scope
                );
            })
            .catch((error) => {
                console.error(
                    "Error al registrar el Service Worker:",
                    error
                );
            });
    }

    // Detectar si la aplicación está instalada
    const estaInstalada =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    if (estaInstalada) {
        console.log("Guardianes del Océano está funcionando como aplicación instalada.");
    } else {
        console.log("Guardianes del Océano está abierto desde el navegador.");
    }
});

// Detectar cuando la conexión cambia
window.addEventListener("online", () => {
    console.log("Conexión a internet recuperada.");
});

window.addEventListener("offline", () => {
    console.log("No hay conexión a internet.");
});
