using CLASE_ORM.Application.DTO.Auth;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegistrarAsync(RegistroDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
    }
}
