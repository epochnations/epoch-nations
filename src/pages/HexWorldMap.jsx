import { useEffect } from "react";
import { createPageUrl } from "@/utils";

// HexWorldMap has been removed. Redirect to Dashboard.
export default function HexWorldMap() {
  useEffect(() => {
    window.location.href = createPageUrl("Dashboard");
  }, []);
  return null;
}