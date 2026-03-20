import { CheckCircle, AlertCircle } from "lucide-react";

export default function CSVPreview({ data }) {
  if (!data) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">CSV Preview</h2>

      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-200 text-sm">
          📊 Found <span className="font-bold">{data.totalRows}</span> transactions to import
        </p>
      </div>

      {/* Headers */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {data.headers.map((header) => (
                <th
                  key={header}
                  className="text-left py-3 px-4 text-slate-300 font-medium whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.slice(0, 5).map((row, i) => (
              <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                {data.headers.map((header) => (
                  <td key={`${i}-${header}`} className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400">
        Showing first 5 rows of {data.totalRows} total
      </div>
    </div>
  );
}
