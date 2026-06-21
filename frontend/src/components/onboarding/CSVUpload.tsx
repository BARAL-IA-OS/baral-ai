export function CSVUpload() {
  return (
    <label className="upload-box">
      <span>CSV de clientes</span>
      <input type="file" accept=".csv,text/csv" />
    </label>
  )
}
