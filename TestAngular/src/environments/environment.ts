export const environment = {

    production:true,

    // Versión de producción (la que usa Docker): ruta relativa, así el navegador le habla al mismo servidor que le
    // entregó la página y nginx reenvía /api a la API (ver TestAngular/nginx.conf). No hay CORS ni puertos fijos.
    // En desarrollo (ng serve) se usa environment.development.ts, que apunta a https://localhost:7197/api.
    apiUrl: '/api'

};
