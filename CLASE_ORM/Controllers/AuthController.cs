using CLASE_ORM.Application.DTO.Auth;
using CLASE_ORM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CLASE_ORM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _service;

        public AuthController(IAuthService service)
        {
            _service = service;
        }

        // Email repetido -> 409. Datos inválidos -> 400. Siempre crea un usuario con rol "Consulta".
        [HttpPost("registro")]
        public async Task<IActionResult> Registro(RegistroDto dto)
        {
            var resultado = await _service.RegistrarAsync(dto);
            return Ok(resultado);
        }

        // Credenciales incorrectas -> 401
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var resultado = await _service.LoginAsync(dto);
            return Ok(resultado);
        }
    }
}
