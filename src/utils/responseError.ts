import { Response } from "node-fetch";

export const formatResponseError = async (response: Response) => {
  const clonedResponse = response.clone();
  return `(status=${response.status} statusText=${response.statusText})

${await clonedResponse.text()}`;
};
