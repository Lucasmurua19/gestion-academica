using System.Linq.Expressions;
using CLASE_ORM.Application.DTO.Common;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence
{
    internal static class PagingExtensions
    {
        // Recibe la consulta YA filtrada y ordenada: cuenta el total filtrado y recién después recorta la página.
        public static async Task<PagedResult<TDto>> ToPagedResultAsync<TEntity, TDto>(
            this IOrderedQueryable<TEntity> query,
            int page,
            int pageSize,
            Expression<Func<TEntity, TDto>> selector)
        {
            var totalCount = await query.CountAsync();

            // long para que una página enorme no desborde el int y se traduzca en un OFFSET negativo.
            var skip = (int)Math.Min((long)(page - 1) * pageSize, int.MaxValue);

            var items = await query
                .Skip(skip)
                .Take(pageSize)
                .Select(selector)
                .ToListAsync();

            return new PagedResult<TDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }
    }
}
