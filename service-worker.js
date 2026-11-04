
const CACHE_NAME = "guardianes-oceano-v7";

const ARCHIVOS_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./Icono/Icono.png",
    "./Fotos/1.png",
    "./Fotos/Menu Principal.png",
    "./Fotos/Escenario Playa.png",
    "./Fotos/Escenario Océano.png",
    "./Fotos/Herramientas.png"
];

// INSTALAR Y GUARDAR ARCHIVOS
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const archivo of ARCHIVOS_CACHE) {
                try {
                    await cache.add(archivo);
                } catch (error) {
                    console.warn("No se pudo guardar:", archivo, error);
                }
            }
        })
    );

    self.skipWaiting();
});

// ACTIVAR Y ELIMINAR CACHÉS ANTIGUAS
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nombres) =>
            Promise.all(
                nombres
                    .filter((nombre) => nombre !== CACHE_NAME)
                    .map((nombre) => caches.delete(nombre))
            )
        )
    );

    self.clients.claim();
});

// FUNCIONAMIENTO SIN CONEXIÓN
self.addEventListener("fetch", (event) => {

    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then((respuesta) => {
                if (respuesta && respuesta.ok) {
                    const copia = respuesta.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, copia);
                    });
                }

                return respuesta;
            })
            .catch(async () => {
                const guardado = await caches.match(event.request);

                if (guardado) return guardado;

                if (event.request.mode === "navigate") {
                    const principal = await caches.match("./index.html");

                    if (principal) return principal;
                }

                return new Response(
                    "No hay conexión a internet.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8"
                        }
                    }
                );
            })
    );
});

// MOSTRAR NOTIFICACIONES PUSH
self.addEventListener("push", (event) => {

    let datos = {
        title: "Guardianes del Océano",
        body: "¡Gracias por ayudar a proteger nuestros océanos!",
        icon: "./Icono/Icono.png",
        badge: "./Icono/Icono.png",
        url: "./"
    };

    if (event.data) {
        try {
            datos = { ...datos, ...event.data.json() };
        } catch (error) {
            datos.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(datos.title, {
            body: datos.body,
            icon: datos.icon,
            badge: datos.badge,
            data: { url: datos.url }
        })
    );
});

// ABRIR LA PÁGINA AL TOCAR LA NOTIFICACIÓN
self.addEventListener("notificationclick", (event) => {

    event.notification.close();

    const ruta = event.notification.data?.url || "./";
    const destino = new URL(ruta, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then((ventanas) => {

            for (const ventana of ventanas) {
                if (ventana.url === destino) {
                    return ventana.focus();
                }
            }

            return self.clients.openWindow(destino);
        })
    );
});
