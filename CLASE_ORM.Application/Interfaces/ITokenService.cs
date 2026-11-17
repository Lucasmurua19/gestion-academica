using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerarToken(Usuario usuario);
    }
}
