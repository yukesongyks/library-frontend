import { useState } from "react";
import { Upload, Button, Table, message, Space, Alert, Typography } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { uploadImportFile, getImportResult, getImportTemplateUrl } from "../../api/staffApi";
import type { ImportResult, ImportValidationDetail } from "../../types/staff";

const { Link } = Typography;

export default function ImportPanel() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const importResult = await uploadImportFile(file);
      // Poll for completion if still validating
      let finalResult = importResult;
      if (importResult.status === "VALIDATING") {
        const pollInterval = setInterval(async () => {
          try {
            const status = await getImportResult(importResult.taskId);
            if (status.status !== "VALIDATING") {
              clearInterval(pollInterval);
              setResult(status);
              setUploading(false);
              if (status.failureCount > 0) {
                message.warning(`导入完成，${status.failureCount} 条失败`);
              } else {
                message.success(`导入成功，共 ${status.successCount} 条`);
              }
            }
          } catch {
            clearInterval(pollInterval);
            setUploading(false);
          }
        }, 2000);
        // Safety timeout
        setTimeout(() => {
          clearInterval(pollInterval);
          setUploading(false);
        }, 60000);
      } else {
        setResult(finalResult);
        setUploading(false);
        if (finalResult.failureCount > 0) {
          message.warning(`导入完成，${finalResult.failureCount} 条失败`);
        } else {
          message.success(`导入成功，共 ${finalResult.successCount} 条`);
        }
      }
    } catch (err: any) {
      message.error(err?.message || "上传失败");
      setUploading(false);
    }
    return false; // prevent default upload
  };

  const failureColumns = [
    { title: "行号", dataIndex: "rowNumber", width: 80 },
    { title: "工号", dataIndex: "employeeId", width: 120 },
    { title: "字段", dataIndex: "fieldName", width: 120 },
    { title: "错误信息", dataIndex: "errorMessage" },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Upload
          accept=".xlsx,.xls,.csv"
          showUploadList={false}
          beforeUpload={(file) => {
            handleUpload(file as unknown as File);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>上传导入文件</Button>
        </Upload>
        <Link href={getImportTemplateUrl()} target="_blank">
          <Button icon={<DownloadOutlined />}>下载导入模板</Button>
        </Link>
      </Space>

      {result && (
        <>
          <Alert
            type={result.failureCount > 0 ? "warning" : "success"}
            message={`总计 ${result.totalCount} 条，成功 ${result.successCount} 条，失败 ${result.failureCount} 条`}
            style={{ marginBottom: 16 }}
            showIcon
          />
          {result.failures.length > 0 && (
            <Table
              rowKey={(r: ImportValidationDetail) => `${r.rowNumber}-${r.fieldName}`}
              dataSource={result.failures}
              columns={failureColumns}
              pagination={false}
              size="small"
              title={() => "失败详情"}
            />
          )}
        </>
      )}
    </>
  );
}
