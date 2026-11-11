export const KEY = "com.daggerheart-sheet/sheet";
// Seuls les liens http(s) sont acceptés (bloque javascript:, data:, etc.)
export const isHttp = (u) => { try { return ["https:", "http:"].includes(new URL(u).protocol); } catch { return false; } };
