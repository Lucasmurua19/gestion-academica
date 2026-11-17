using CLASE_ORM.Application.Exceptions;
using CLASE_ORM.Extensions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace CLASE_ORM.Middleware
{
    // Convierte cualquier excepción que se escape de un controlador en una respuesta JSON ProblemDetails (RFC 7807):
    //   400 validación (con "errors" por campo) | 401 credenciales | 404 no existe | 409 conflicto | 500 inesperado.
    // El detalle técnico de un 500 se registra en el servidor; al cliente solo le llega un mensaje genérico y el traceId.
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly IProblemDetailsService _problemDetailsService;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(IProblemDetailsService problemDetailsService, ILogger<GlobalExceptionHandler> logger)
        {
            _problemDetailsService = problemDetailsService;
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            var traceId = httpContext.ObtenerTraceId();

            ProblemDetails problem;

            switch (exception)
            {
                case ValidationFailedException ex:
                    problem = new ValidationProblemDetails(ex.Errors)
                    {
                        Status = StatusCodes.Status400BadRequest,
                        Title = "Error de validación",
                        Detail = "Uno o más campos no son válidos."
                    };
                    break;

                case NotFoundException ex:
                    problem = Crear(StatusCodes.Status404NotFound, "Recurso no encontrado", ex.Message);
                    break;

                case ConflictException ex:
                    problem = Crear(StatusCodes.Status409Conflict, "Conflicto", ex.Message);
                    break;

                // Red de seguridad: si algún caso de uso no tradujo la violación de un índice único, igual es un 409 y no un 500.
                case UniqueConstraintViolationException ex:
                    problem = Crear(StatusCodes.Status409Conflict, "Conflicto", "Ya existe un registro con esos datos.");
                    break;

                case InvalidCredentialsException ex:
                    problem = Crear(StatusCodes.Status401Unauthorized, "No autenticado", ex.Message);
                    break;

                default:
                    // Falla inesperada: stack completo al log, mensaje genérico al cliente.
                    _logger.LogError(exception, "Excepción no controlada. traceId: {TraceId}", traceId);
                    problem = Crear(
                        StatusCodes.Status500InternalServerError,
                        "Error interno del servidor",
                        "Ocurrió un error inesperado. Si el problema continúa, informá el identificador de seguimiento (traceId).");
                    break;
            }

            if (problem.Status != StatusCodes.Status500InternalServerError)
            {
                // Errores esperados del negocio: alcanza con una línea, sin stack trace.
                _logger.LogWarning("{Tipo}: {Mensaje} | traceId: {TraceId}", exception.GetType().Name, exception.Message, traceId);
            }

            httpContext.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;

            return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problem,
                Exception = exception
            });
        }

        private static ProblemDetails Crear(int status, string titulo, string detalle)
        {
            return new ProblemDetails
            {
                Status = status,
                Title = titulo,
                Detail = detalle
            };
        }
    }
}
