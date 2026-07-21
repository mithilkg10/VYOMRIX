import { redirect } from "next/navigation";

export default function SiemRoot() {
  redirect("/siem/alerts");
}
