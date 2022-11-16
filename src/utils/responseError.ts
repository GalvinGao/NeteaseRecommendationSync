export const formatResponseError = async (response: any) => {
  const clonedResponse = response.clone()
  return `(status=${response.status} statusText=${response.body})

${await clonedResponse.text()}`
}
