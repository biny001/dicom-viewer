import Image from "next/image";
import Link from "next/link";
import DwvComponent from "./_components/DwvComponent";
import { DwViewer } from "./_components/DwvComponentV2";

export default function Home() {
  return (
    <div className="app">
      {/* <DwvComponent /> */}
      <DwViewer />
    </div>
  );
}
