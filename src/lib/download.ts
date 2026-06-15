import api from "./api";

/**
 * Baixa um arquivo de uma rota autenticada da API (envia o token via axios)
 * e dispara o download no browser com o nome correto.
 */
export async function downloadFromApi(url: string, fallbackName = "documento") {
  const res = await api.get(url, { responseType: "blob" });
  const blob = res.data as Blob;

  let name = fallbackName;
  const cd = res.headers["content-disposition"] as string | undefined;
  if (cd) {
    const star = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    const plain = /filename="?([^";]+)"?/i.exec(cd);
    if (star) name = decodeURIComponent(star[1]);
    else if (plain) name = plain[1];
  }

  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}

/** Abre um arquivo de rota autenticada numa nova aba (visualizar), enviando o token. */
export async function viewFromApi(url: string) {
  const res = await api.get(url, { responseType: "blob" });
  const objUrl = URL.createObjectURL(res.data as Blob);
  window.open(objUrl, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
}
