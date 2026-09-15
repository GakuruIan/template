import axios from "axios"

type ApiErrorResponse = {
  message?: string | string[]
  error?: string
}

export const emptyToUndefined = (value?: string) => {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : undefined
}

export const formatDate = (value: Date | string | null) => {
  if (!value) return "--"
  return new Date(value).toLocaleDateString()
}

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message

    if (Array.isArray(message)) return message.join(", ")
    if (message) return message
    if (error.response?.data?.error) return error.response.data.error
  }

  return error instanceof Error
    ? error.message
    : "Unknown error occurred while fetching users"
}
