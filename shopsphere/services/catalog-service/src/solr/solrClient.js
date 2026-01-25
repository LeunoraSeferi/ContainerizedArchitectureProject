import axios from "axios";

const SOLR_URL = process.env.SOLR_URL || "http://localhost:8983/solr/products";

export async function solrAddDocs(docs) {
  return axios.post(`${SOLR_URL}/update?commit=true`, docs, {
    headers: { "Content-Type": "application/json" },
  });
}

export async function solrQuery(params) {
  return axios.get(`${SOLR_URL}/select`, { params });
}
