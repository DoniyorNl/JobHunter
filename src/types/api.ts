export interface ApiSuccessResponse<T> {
	data: T
	message?: string
}

export interface ApiErrorResponse {
	error: string
	code?: string
	details?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function isApiError(response: ApiResponse<unknown>): response is ApiErrorResponse {
	return 'error' in response
}

/**
 * Creates a standardized success response.
 */
export function successResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
	return { data, ...(message ? { message } : {}) }
}

/**
 * Creates a standardized error Response for API routes.
 */
export function errorResponse(error: string, status = 400, code?: string): Response {
	return Response.json({ error, ...(code ? { code } : {}) } satisfies ApiErrorResponse, {
		status,
	})
}
