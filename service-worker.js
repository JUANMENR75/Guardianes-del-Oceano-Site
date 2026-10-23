
const CACHE_NAME = "guardianes-oceano-v5";

const ARCHIVOS_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./manifest.json",
    "./Icono/Icono.png",
    "./Fotos/1.png",
    "./Fotos/Menu Principal.png",
    "./Fotos/Escenario Playa.png",
    "./Fotos/Escenario Océano.png",
    "./Fotos/Herramientas.png"
];

// Instalar el Service Worker y guardar los archivos en caché
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const archivo of ARCHIVOS_CACHE) {
                try {
                    await cache.add(archivo);
                } catch (error) {
                    console.warn("No se pudo guardar en caché:", archivo, error);
                }
            }
        })
    );

    self.skipWaiting();
});

// Activar el Service Worker y eliminar cachés antiguas
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nombresCache) => {
            return Promise.all(
                nombresCache
                    .filter((nombre) => nombre !== CACHE_NAME)
                    .map((nombre) => caches.delete(nombre))
            );
        })
    );

    self.clients.claim();
});

// Intentar cargar desde internet y usar la caché si no hay conexión
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

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
                const archivoGuardado = await caches.match(event.request);

                if (archivoGuardado) {
                    return archivoGuardado;
                }

                if (event.request.mode === "navigate") {
                    const paginaPrincipal = await caches.match("./index.html");

                    if (paginaPrincipal) {
                        return paginaPrincipal;
                    }
                }

                return new Response("No hay conexión y este recurso no está disponible sin conexión.", {
                    status: 503,
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8"
                    }
                });
            })
    );
});
