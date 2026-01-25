import axios from "axios";

export function createCatalogClient() {
  const baseURL = process.env.CATALOG_BASE_URL;
  return axios.create({ baseURL });
}
