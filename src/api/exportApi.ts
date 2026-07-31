import { requestBlob } from "@/api/client";
import type { TabKey } from "@/types/api";

function fileNameForTab(tab: TabKey): string {
  return `${tab}-export.xlsx`;
}

/**
 * Fetches the export blob for the given tab and triggers a browser download.
 *
 * On any failure (network error, non-2xx, envelope error) this throws — the
 * caller must catch and show a toast. No download is triggered on failure.
 */
export async function exportTab(tab: TabKey): Promise<Blob> {
  const blob = await requestBlob(`/export?tab=${encodeURIComponent(tab)}&format=xlsx`, {
    method: "GET",
  });

  // Trigger the browser download only after we hold a valid blob.
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileNameForTab(tab);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Release the object URL on the next tick so the click can resolve.
  setTimeout(() => URL.revokeObjectURL(url), 0);

  return blob;
}
