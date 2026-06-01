export function exportToCSV<T extends object>(
  data: Array<T>,
  filename: string
) {
  if (!data.length) return

  const headers = Object.keys(data[0])

  // 2. Map over the data to create comma-separated rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        // Escape quotes and wrap fields in quotes to prevent comma breaking
        const cellValue =
          row[header as keyof T] === null ? "" : String(row[header as keyof T])
        return `"${cellValue.replace(/"/g, '""')}"`
      })
      .join(",")
  })

  // 3. Combine headers and rows
  const csvString = [headers.join(","), ...csvRows].join("\n")

  // 4. Create a Blob and trigger the native browser download
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
