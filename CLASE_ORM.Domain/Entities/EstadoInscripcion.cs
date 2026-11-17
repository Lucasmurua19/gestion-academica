namespace CLASE_ORM.Domain.Entities
{
    // Se guarda en la base como texto ("Activa" / "Baja"). El índice único filtrado de Inscripciones
    // usa el nombre de Activa (ver AppDbContext), así que si se renombra hay que migrar el índice.
    public enum EstadoInscripcion
    {
        Activa,
        Baja
    }
}
