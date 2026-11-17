using System.Diagnostics;

namespace CLASE_ORM.Extensions
{
    public static class HttpContextExtensions
    {
        // Identificador de seguimiento de la petición. Es el mismo que se escribe en el log del servidor
        // y el que viaja en el campo "traceId" de las respuestas de error, así se puede cruzar uno con otro.
        public static string ObtenerTraceId(this HttpContext context)
        {
            return Activity.Current?.Id ?? context.TraceIdentifier;
        }
    }
}
