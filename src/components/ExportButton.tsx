import { useState } from "react";
import { Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { exportTab } from "@/api/exportApi";
import type { TabKey } from "@/types/api";

interface ExportButtonProps {
  tab: TabKey;
}

/**
 * Triggers an xlsx export for the active tab.
 *
 * - Shows a loading state on the button while the request is in flight.
 * - On success the download is started inside `exportApi` (no toast needed,
 *   but a subtle success toast is shown for clarity).
 * - On failure shows an `antd` `message.error` toast and does NOT trigger any
 *   download.
 */
export default function ExportButton({ tab }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportTab(tab);
      message.success("Export downloaded.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      loading={loading}
      onClick={handleExport}
    >
      Export
    </Button>
  );
}
