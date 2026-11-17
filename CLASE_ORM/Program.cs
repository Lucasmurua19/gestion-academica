using System.Text;
using System.Text.Json.Serialization;
using CLASE_ORM.Application;
using CLASE_ORM.Extensions;
using CLASE_ORM.Infrastructure;
using CLASE_ORM.Infrastructure.Security;
using CLASE_ORM.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options =>
{
    // Mensajes de binding (por ejemplo ?page=abc) en español, para que se vean igual que los de las validaciones.
    var mensajes = options.ModelBindingMessageProvider;
    mensajes.SetValueIsInvalidAccessor(valor => $"El valor '{valor}' no es válido.");
    mensajes.SetAttemptedValueIsInvalidAccessor((valor, campo) => $"El valor '{valor}' no es válido para {campo}.");
    mensajes.SetValueMustBeANumberAccessor(campo => $"El campo {campo} debe ser un número.");
    mensajes.SetMissingRequestBodyRequiredValueAccessor(() => "Hay que enviar un cuerpo en la solicitud.");
})
// Los enums viajan como texto ("Activa" / "Baja") en vez de números, en las respuestas y en Swagger.
.AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Botón "Authorize" en Swagger: pegar el token que devuelve /api/Auth/login.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Token JWT que devuelve /api/Auth/login.",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Para empezar a usar el ORM EntityFrameworkCore.SqlServer, tienen que instalarlo desde el administrador de paquetes Nuget
// esta en Herramientas => Administrador de paquetes Nuget => Administrar paquetes Nuget.
// Son dos cosas: EntityFrameworkCore.SqlServer y EntityFrameworkCore.Tools.
// Tiene que coincidir con la versión de .NET que eligieron, no instalen la 10 o superior si están usando en su propia solución la versión 8.

// Clean Architecture: Api -> Application -> Domain, e Infrastructure implementa los contratos de Application.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();

if (jwtSettings.Key.Length < 32)
{
    throw new InvalidOperationException(
        "Falta configurar Jwt:Key (mínimo 32 caracteres). " +
        "Guardala fuera del repositorio con: dotnet user-secrets set \"Jwt:Key\" \"<clave larga y aleatoria>\"");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Los claims se leen con los mismos nombres cortos con los que se emiten ("sub", "name", "role").
    options.MapInboundClaims = false;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
        NameClaimType = JwtSettings.NameClaimType,
        // Con esto funciona [Authorize(Roles = "Admin")] leyendo el claim "role" del token.
        RoleClaimType = JwtSettings.RoleClaimType
    };
});

builder.Services.AddAuthorization();

// Errores globales: respuestas JSON con formato ProblemDetails (RFC 7807) y traceId.
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        var problem = context.ProblemDetails;

        problem.Extensions["traceId"] = context.HttpContext.ObtenerTraceId();

        // Títulos/detalles en español para las respuestas que arma el propio framework (400 de validación, 401, 403, 404...).
        problem.Title = problem.Status switch
        {
            StatusCodes.Status400BadRequest => "Error de validación",
            StatusCodes.Status401Unauthorized => "No autenticado",
            StatusCodes.Status403Forbidden => "Acceso denegado",
            StatusCodes.Status404NotFound => "Recurso no encontrado",
            StatusCodes.Status405MethodNotAllowed => "Método no permitido",
            StatusCodes.Status409Conflict => "Conflicto",
            StatusCodes.Status415UnsupportedMediaType => "Tipo de contenido no soportado",
            StatusCodes.Status500InternalServerError => "Error interno del servidor",
            _ => problem.Title
        };

        problem.Detail ??= problem.Status switch
        {
            StatusCodes.Status400BadRequest => "Uno o más campos no son válidos.",
            StatusCodes.Status401Unauthorized => "Tenés que iniciar sesión para acceder a este recurso.",
            StatusCodes.Status403Forbidden => "No tenés permisos para realizar esta acción.",
            StatusCodes.Status404NotFound => "El recurso solicitado no existe.",
            _ => null
        };
    };
});
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Orden del pipeline: el log va primero para medir toda la petición, incluido lo que responde el manejador de errores.
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseExceptionHandler();
app.UseStatusCodePages();

// Swagger: siempre en Development; en otros entornos (por ejemplo dentro de Docker) se enciende con Swagger:Enabled=true.
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
