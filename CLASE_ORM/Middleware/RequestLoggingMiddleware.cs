using System.Diagnostics;
using CLASE_ORM.Extensions;

namespace CLASE_ORM.Middleware
{
    // Middleware propio: deja en el log una línea por cada petición con método, ruta, estado, duración,
    // usuario (id del claim "sub", o "anónimo") y traceId. No registra el cuerpo ni el query string,
    // así que no filtra contraseñas ni tokens.
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();

                var estado = context.Response.StatusCode;
                var nivel = estado >= 500 ? LogLevel.Error
                          : estado >= 400 ? LogLevel.Warning
                          : LogLevel.Information;

                // context.User ya está cargado acá: la autenticación corrió más adentro en el pipeline.
                var usuario = context.User.FindFirst("sub")?.Value ?? "anónimo";

                _logger.Log(
                    nivel,
                    "HTTP {Metodo} {Ruta} -> {Estado} en {Duracion} ms | usuario: {Usuario} | traceId: {TraceId}",
                    context.Request.Method,
                    context.Request.Path.Value,
                    estado,
                    stopwatch.ElapsedMilliseconds,
                    usuario,
                    context.ObtenerTraceId());
            }
        }
    }
}
