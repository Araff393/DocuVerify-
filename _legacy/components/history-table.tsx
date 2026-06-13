import { CertificateRecord } from "@/lib/types";
import { truncateCid } from "@/lib/format";

type HistoryTableProps = {
  certificates: CertificateRecord[];
};

export function HistoryTable({ certificates }: HistoryTableProps) {
  return (
    <div className="bg-surface-container-low overflow-hidden rounded-xl">
      <div className="overflow-x-auto w-full scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-container text-on-surface-variant uppercase text-[10px] tracking-[0.15em] font-semibold border-b border-outline-variant/10">
              <th className="px-6 py-5 whitespace-nowrap">ID Entry</th>
              <th className="px-6 py-5">Nama Sertifikat</th>
              <th className="px-6 py-5 whitespace-nowrap">Pemilik</th>
              <th className="px-6 py-5 whitespace-nowrap">CID (IPFS)</th>
              <th className="px-6 py-5 whitespace-nowrap">Tanggal</th>
              <th className="px-6 py-5 text-right whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {certificates.map((certificate) => {
              const initials = certificate.ownerName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <tr
                  key={certificate.certificateId}
                  className="hover:bg-surface-container-highest/30 transition-colors group relative"
                >
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-secondary-container rounded-full" />
                      <span className="font-headline text-white font-medium">
                        #{certificate.certificateId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <p className="text-white font-medium mb-1">{certificate.certificateName}</p>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] text-primary">
                        {initials}
                      </div>
                      <span className="text-on-surface whitespace-nowrap">{certificate.ownerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-2 group/cid cursor-pointer">
                      <span className="font-mono text-xs text-on-surface-variant">
                        {truncateCid(certificate.cid, 10, 6)}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-primary/40 group-hover/cid:text-primary transition-colors">
                        content_copy
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className="text-on-surface-variant text-sm whitespace-nowrap">
                      {certificate.issuedDate}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-on-secondary-container text-secondary-fixed">
                      Valid
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination/Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 gap-4">
        <span className="text-xs text-on-surface-variant font-medium">
          Showing 1-{certificates.length} of {certificates.length} entries
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            className="p-2 bg-surface-container text-on-surface-variant hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
            disabled
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button className="px-3 py-1.5 bg-primary-container text-on-primary-fixed font-bold text-xs rounded-lg transition-colors">
            1
          </button>
          <button className="p-2 bg-surface-container text-on-surface hover:bg-surface-variant rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
