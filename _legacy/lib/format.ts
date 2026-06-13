export function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp * 1000));
}

export function truncateCid(cid: string, start = 10, end = 8) {
  if (cid.length <= start + end) {
    return cid;
  }

  return `${cid.slice(0, start)}...${cid.slice(-end)}`;
}
