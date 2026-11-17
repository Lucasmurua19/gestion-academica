// Formato de error de la API (ProblemDetails, RFC 7807). "errors" viene solo en los 400 de validación.
export interface ApiProblem {

    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    traceId?: string;
    errors?: Record<string, string[]>;

}
