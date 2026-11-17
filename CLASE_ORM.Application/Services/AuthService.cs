using CLASE_ORM.Application.DTO.Auth;
using CLASE_ORM.Application.Exceptions;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Constants;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUsuarioRepository _usuarios;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;

        public AuthService(
            IUsuarioRepository usuarios,
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            ITokenService tokenService)
        {
            _usuarios = usuarios;
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseDto> RegistrarAsync(RegistroDto dto)
        {
            var email = dto.Email.Trim();

            if (await _usuarios.ExistsByEmailAsync(email))
            {
                throw new ConflictException("El email ya está registrado.");
            }

            var usuario = new Usuario
            {
                Nombre = dto.Nombre.Trim(),
                Email = email,
                PasswordHash = _passwordHasher.Hash(dto.Password),
                // El registro público nunca crea administradores.
                Rol = Roles.Consulta
            };

            await _usuarios.AddAsync(usuario);
            await _unitOfWork.SaveChangesAsync();

            return GenerarRespuesta(usuario);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var usuario = await _usuarios.GetByEmailAsync(dto.Email.Trim());

            if (usuario == null || !_passwordHasher.Verify(dto.Password, usuario.PasswordHash))
            {
                throw new InvalidCredentialsException();
            }

            return GenerarRespuesta(usuario);
        }

        private AuthResponseDto GenerarRespuesta(Usuario usuario)
        {
            return new AuthResponseDto
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Email = usuario.Email,
                Rol = usuario.Rol,
                Token = _tokenService.GenerarToken(usuario)
            };
        }
    }
}
